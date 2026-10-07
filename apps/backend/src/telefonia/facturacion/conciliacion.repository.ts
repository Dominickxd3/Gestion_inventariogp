import { Injectable } from '@nestjs/common';
import { Int, NVarChar, Request, Transaction, VarChar } from 'mssql';
import { DatabaseService } from '../../database/database.service';
import { DiagnosticoConciliacion, IntervaloEquipoHistorico, IntervaloResponsableHistorico } from './types/facturacion.types';

export interface DetalleConciliadoResultado {
  idDetalle: number;
  idFactura: number;
  idLinea: number | null;
  numeroLinea: string;
  nombrePlan: string | null;
  cargoPlan: number;
  cargosAdicionales: number;
  cargoEquipos: number;
  descuentos: number;
  prorrateo: number;
  saldoAnterior: number;
  montoTotal: number;
  estadoConciliacion: string;
  observaciones: string | null;
  lineaRegistrada: boolean;
  planEsperado?: { idPlan: number; nombre: string; precioMensual: number } | null;
  diagnosticos: DiagnosticoConciliacion[];
  responsablesPeriodo: IntervaloResponsableHistorico[];
  equiposPeriodo: IntervaloEquipoHistorico[];
}

@Injectable()
export class ConciliacionRepository {
  constructor(private readonly database: DatabaseService) {}

  private request(tx?: Transaction): Promise<Request> {
    return tx ? Promise.resolve(new Request(tx)) : this.database.request();
  }

  async conciliar(idFactura: number, userId: number, ip: string) {
    return this.database.transaction(async (tx) => {
      // 1. Bloquear y verificar cabecera de factura
      const rf = await this.request(tx);
      rf.input('idFactura', Int, idFactura);
      const factura = (
        await rf.query(`
        SELECT
          id_factura AS idFactura,
          numero_factura AS numeroFactura,
          id_operador AS idOperador,
          periodo_inicio AS periodoInicio,
          periodo_fin AS periodoFin,
          monto_total AS montoTotal,
          estado_conciliacion AS estado
        FROM dbo.facturas_telefonia WITH (UPDLOCK,HOLDLOCK)
        WHERE id_factura = @idFactura
      `)
      ).recordset[0];

      if (!factura) {
        throw Object.assign(new Error('FACTURA_NO_ENCONTRADA'), { code: 'FACTURA_NO_ENCONTRADA' });
      }
      if (factura.estado === 'CERRADO') {
        throw Object.assign(new Error('FACTURA_CERRADA'), { code: 'FACTURA_CERRADA' });
      }

      const pInicio = factura.periodoInicio;
      const pFin = factura.periodoFin;

      // 2. Set-based: pre-vincular id_linea en detalles donde coincida el número
      const rlink = await this.request(tx);
      rlink.input('idFactura', Int, idFactura);
      await rlink.query(`
        UPDATE FD
        SET FD.id_linea = L.id_linea
        FROM dbo.facturas_telefonia_detalle FD
        JOIN dbo.lineas_moviles L ON L.numero = FD.numero_linea
        WHERE FD.id_factura = @idFactura AND FD.id_linea IS NULL
      `);

      // 3. Consultar todos los detalles de la factura
      const rDet = await this.request(tx);
      rDet.input('idFactura', Int, idFactura);
      const detalles = (
        await rDet.query(`
        SELECT
          FD.id_detalle AS idDetalle,
          FD.id_linea AS idLinea,
          FD.numero_linea AS numeroLinea,
          FD.nombre_plan AS nombrePlan,
          FD.cargo_plan AS cargoPlan,
          FD.prorrateo,
          FD.cargos_adicionales AS cargosAdicionales,
          FD.descuentos,
          FD.cargo_equipos AS cargoEquipos,
          FD.saldo_anterior AS saldoAnterior,
          FD.monto_total AS montoTotal,
          FD.estado_conciliacion AS estadoConciliacion,
          FD.observaciones,
          P.id_plan AS idPlanEsperado,
          P.nombre AS nombrePlanEsperado,
          P.precio_mensual AS precioPlanEsperado
        FROM dbo.facturas_telefonia_detalle FD WITH (UPDLOCK,HOLDLOCK)
        LEFT JOIN dbo.lineas_moviles L ON L.id_linea = FD.id_linea
        LEFT JOIN dbo.planes_moviles P ON P.id_plan = L.id_plan_actual
        WHERE FD.id_factura = @idFactura
      `)
      ).recordset;

      if (!detalles.length) {
        throw Object.assign(new Error('FACTURA_SIN_DETALLES'), { code: 'FACTURA_SIN_DETALLES' });
      }

      // 4. Set-based: Consultar responsables históricos en el periodo para las líneas facturadas
      const rResp = await this.request(tx);
      rResp.input('idFactura', Int, idFactura).input('pInicio', pInicio).input('pFin', pFin);
      const respRows = (
        await rResp.query(`
        SELECT
          AL.id_linea AS idLinea,
          AL.id_trabajador AS idTrabajador,
          CONCAT_WS(' ', T.nombres, T.apellidos) AS nombreTrabajador,
          T.dni,
          T.cargo,
          AR.nombre AS area,
          AL.fecha_inicio AS fechaInicio,
          AL.fecha_fin AS fechaFin,
          AL.motivo
        FROM dbo.asignaciones_linea AL
        JOIN dbo.trabajadores T ON T.id_trabajador = AL.id_trabajador
        LEFT JOIN dbo.areas AR ON AR.id_area = T.id_area
        WHERE AL.id_linea IN (
          SELECT id_linea FROM dbo.facturas_telefonia_detalle
          WHERE id_factura = @idFactura AND id_linea IS NOT NULL
        )
        AND AL.fecha_inicio <= @pFin
        AND (AL.fecha_fin IS NULL OR AL.fecha_fin >= @pInicio)
        ORDER BY AL.fecha_inicio ASC
      `)
      ).recordset;

      // 5. Set-based: Consultar equipos celulares históricos en el periodo para las líneas facturadas
      const rEq = await this.request(tx);
      rEq.input('idFactura', Int, idFactura).input('pInicio', pInicio).input('pFin', pFin);
      const eqRows = (
        await rEq.query(`
        SELECT
          LEH.id_linea AS idLinea,
          LEH.id_activo AS idActivo,
          A.codigo AS codigoActivo,
          A.marca,
          A.modelo,
          AC.imei1,
          LEH.fecha_inicio AS fechaInicio,
          LEH.fecha_fin AS fechaFin,
          LEH.observaciones
        FROM dbo.linea_equipo_historial LEH
        JOIN dbo.activos A ON A.id_activo = LEH.id_activo
        LEFT JOIN dbo.activos_celulares AC ON AC.id_activo = A.id_activo
        WHERE LEH.id_linea IN (
          SELECT id_linea FROM dbo.facturas_telefonia_detalle
          WHERE id_factura = @idFactura AND id_linea IS NOT NULL
        )
        AND LEH.fecha_inicio <= @pFin
        AND (LEH.fecha_fin IS NULL OR LEH.fecha_fin >= @pInicio)
        ORDER BY LEH.fecha_inicio ASC
      `)
      ).recordset;

      // 6. Set-based: Posesión física de celulares en el periodo
      const rPhys = await this.request(tx);
      rPhys.input('idFactura', Int, idFactura).input('pInicio', pInicio).input('pFin', pFin);
      const physRows = (
        await rPhys.query(`
        SELECT
          AA.id_activo AS idActivo,
          AA.id_trabajador AS idTrabajador,
          AA.fecha_entrega AS fechaEntrega,
          AA.fecha_devolucion AS fechaDevolucion
        FROM dbo.asignaciones_activo AA
        WHERE AA.id_activo IN (
          SELECT LEH.id_activo FROM dbo.linea_equipo_historial LEH
          WHERE LEH.id_linea IN (
            SELECT id_linea FROM dbo.facturas_telefonia_detalle
            WHERE id_factura = @idFactura AND id_linea IS NOT NULL
          )
        )
        AND AA.fecha_entrega <= @pFin
        AND (AA.fecha_devolucion IS NULL OR AA.fecha_devolucion >= @pInicio)
      `)
      ).recordset;

      // Agrupar relaciones en memoria
      const respMap = new Map<number, IntervaloResponsableHistorico[]>();
      for (const r of respRows) {
        const idL = Number(r.idLinea);
        const list = respMap.get(idL) ?? [];
        list.push({
          idTrabajador: Number(r.idTrabajador),
          nombre: String(r.nombreTrabajador),
          dni: r.dni ? String(r.dni) : undefined,
          cargo: r.cargo ? String(r.cargo) : undefined,
          area: r.area ? String(r.area) : undefined,
          fechaInicio: r.fechaInicio ? new Date(r.fechaInicio).toISOString() : '',
          fechaFin: r.fechaFin ? new Date(r.fechaFin).toISOString() : null,
          motivo: r.motivo ? String(r.motivo) : undefined,
        });
        respMap.set(idL, list);
      }

      const eqMap = new Map<number, IntervaloEquipoHistorico[]>();
      for (const e of eqRows) {
        const idL = Number(e.idLinea);
        const list = eqMap.get(idL) ?? [];
        list.push({
          idActivo: Number(e.idActivo),
          codigo: String(e.codigoActivo),
          marca: e.marca ? String(e.marca) : undefined,
          modelo: e.modelo ? String(e.modelo) : undefined,
          imei1: e.imei1 ? String(e.imei1) : undefined,
          fechaInicio: e.fechaInicio ? new Date(e.fechaInicio).toISOString() : '',
          fechaFin: e.fechaFin ? new Date(e.fechaFin).toISOString() : null,
          observaciones: e.observaciones ? String(e.observaciones) : undefined,
        });
        eqMap.set(idL, list);
      }

      const physMap = new Map<number, number[]>();
      for (const p of physRows) {
        const idA = Number(p.idActivo);
        const list = physMap.get(idA) ?? [];
        list.push(Number(p.idTrabajador));
        physMap.set(idA, list);
      }

      // 7. Evaluar cada detalle
      const updates: Array<{ idDetalle: number; nuevoEstado: string }> = [];
      const resultados: DetalleConciliadoResultado[] = [];

      for (const d of detalles) {
        const diagnosticos: DiagnosticoConciliacion[] = [];
        const idLinea = d.idLinea ? Number(d.idLinea) : null;
        const cargoPlan = Number(d.cargoPlan ?? 0);
        const cargosAdicionales = Number(d.cargosAdicionales ?? 0);
        const cargoEquipos = Number(d.cargoEquipos ?? 0);
        const descuentos = Number(d.descuentos ?? 0);
        const prorrateo = Number(d.prorrateo ?? 0);
        const saldoAnterior = Number(d.saldoAnterior ?? 0);
        const montoTotal = Number(d.montoTotal ?? 0);

        const responsables = idLinea ? (respMap.get(idLinea) ?? []) : [];
        const equipos = idLinea ? (eqMap.get(idLinea) ?? []) : [];

        if (!idLinea) {
          diagnosticos.push('LINEA_NO_REGISTRADA');
        } else {
          // Evaluación de responsable
          if (responsables.length === 0) {
            diagnosticos.push('SIN_RESPONSABLE');
          } else if (responsables.length > 1) {
            diagnosticos.push('MULTIPLES_RESPONSABLES_PERIODO');
          }

          // Evaluación de equipo
          if (equipos.length === 0) {
            diagnosticos.push('SIN_EQUIPO');
          } else if (equipos.length > 1) {
            diagnosticos.push('MULTIPLES_EQUIPOS_PERIODO');
          }

          // Posesión física vs responsable de línea
          if (responsables.length === 1 && equipos.length === 1) {
            const respId = responsables[0].idTrabajador;
            const eqId = equipos[0].idActivo;
            const physWorkers = physMap.get(eqId) ?? [];
            if (physWorkers.length > 0 && !physWorkers.includes(respId)) {
              diagnosticos.push('RESPONSABLE_INCONSISTENTE');
            }
          }

          // Desglose financiero y validación de plan
          if (d.idPlanEsperado && d.precioPlanEsperado !== null) {
            const precioPlan = Number(d.precioPlanEsperado);
            if (Math.abs(cargoPlan - precioPlan) > 0.05) {
              diagnosticos.push('MONTO_PLAN_DIFERENTE');
            }
          }
          if (cargosAdicionales > 0) diagnosticos.push('CARGOS_ADICIONALES');
          if (cargoEquipos > 0) diagnosticos.push('CARGO_EQUIPO');
          if (prorrateo !== 0) diagnosticos.push('PRORRATEO');
          if (descuentos !== 0) diagnosticos.push('DESCUENTO');
          if (saldoAnterior !== 0) diagnosticos.push('SALDO_ANTERIOR');
        }

        // Determinar estado de gestión persistido
        let nuevoEstado = d.estadoConciliacion;
        if (d.estadoConciliacion !== 'CORREGIDO') {
          const tieneAnomaliaCritica = diagnosticos.some((dg) =>
            [
              'LINEA_NO_REGISTRADA',
              'SIN_RESPONSABLE',
              'SIN_EQUIPO',
              'MULTIPLES_RESPONSABLES_PERIODO',
              'MULTIPLES_EQUIPOS_PERIODO',
              'RESPONSABLE_INCONSISTENTE',
              'MONTO_PLAN_DIFERENTE',
            ].includes(dg),
          );

          if (tieneAnomaliaCritica) {
            nuevoEstado = 'OBSERVADO';
          } else {
            nuevoEstado = 'CONFORME';
            if (diagnosticos.length === 0) diagnosticos.push('CONFORME');
          }
        }

        updates.push({ idDetalle: Number(d.idDetalle), nuevoEstado });

        resultados.push({
          idDetalle: Number(d.idDetalle),
          idFactura,
          idLinea,
          numeroLinea: String(d.numeroLinea),
          nombrePlan: d.nombrePlan ? String(d.nombrePlan) : null,
          cargoPlan,
          cargosAdicionales,
          cargoEquipos,
          descuentos,
          prorrateo,
          saldoAnterior,
          montoTotal,
          estadoConciliacion: nuevoEstado,
          observaciones: d.observaciones ? String(d.observaciones) : null,
          lineaRegistrada: Boolean(idLinea),
          planEsperado: d.idPlanEsperado
            ? {
                idPlan: Number(d.idPlanEsperado),
                nombre: String(d.nombrePlanEsperado),
                precioMensual: Number(d.precioPlanEsperado),
              }
            : null,
          diagnosticos,
          responsablesPeriodo: responsables,
          equiposPeriodo: equipos,
        });
      }

      // 8. Actualizar por lotes el estado en dbo.facturas_telefonia_detalle
      const batchSize = 100;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        const rBatch = await this.request(tx);
        const cases = batch.map((u, idx) => {
          rBatch.input(`id_${idx}`, Int, u.idDetalle);
          rBatch.input(`est_${idx}`, VarChar(30), u.nuevoEstado);
          return `WHEN id_detalle = @id_${idx} THEN @est_${idx}`;
        });
        const idList = batch.map((_, idx) => `@id_${idx}`).join(', ');

        await rBatch.query(`
          UPDATE dbo.facturas_telefonia_detalle
          SET estado_conciliacion = CASE ${cases.join(' ')} ELSE estado_conciliacion END
          WHERE id_detalle IN (${idList})
        `);
      }

      // 9. Actualizar estado de cabecera de la factura
      const allConformesOCorregidos = updates.every(
        (u) => u.nuevoEstado === 'CONFORME' || u.nuevoEstado === 'CORREGIDO',
      );
      const nuevoEstadoFactura = allConformesOCorregidos ? 'CONCILIADO' : 'EN_REVISION';

      const rHead = await this.request(tx);
      rHead.input('idFactura', Int, idFactura).input('estadoFactura', VarChar(30), nuevoEstadoFactura);
      await rHead.query(`
        UPDATE dbo.facturas_telefonia
        SET estado_conciliacion = @estadoFactura
        WHERE id_factura = @idFactura
      `);

      // 10. Auditoría
      await this.audit(
        tx,
        idFactura,
        userId,
        'FACTURA_TELEFONIA_CONCILIAR',
        { estadoAnterior: factura.estado },
        {
          idFactura,
          nuevoEstado: nuevoEstadoFactura,
          totalLineas: updates.length,
          conformes: updates.filter((u) => u.nuevoEstado === 'CONFORME').length,
          observados: updates.filter((u) => u.nuevoEstado === 'OBSERVADO').length,
          corregidos: updates.filter((u) => u.nuevoEstado === 'CORREGIDO').length,
        },
        ip,
      );

      return {
        idFactura,
        estadoConciliacion: nuevoEstadoFactura,
        totalDetalles: resultados.length,
        items: resultados,
      };
    });
  }

  async getResumenConciliacion(idFactura: number) {
    const r = await this.database.request();
    r.input('idFactura', Int, idFactura);

    const factRow = (
      await r.query(`
      SELECT
        F.id_factura AS idFactura,
        F.numero_factura AS numeroFactura,
        F.periodo_inicio AS periodoInicio,
        F.periodo_fin AS periodoFin,
        F.monto_total AS montoTotal,
        F.estado_conciliacion AS estadoConciliacion,
        O.nombre AS operadorNombre
      FROM dbo.facturas_telefonia F
      JOIN dbo.operadores_moviles O ON O.id_operador = F.id_operador
      WHERE F.id_factura = @idFactura
    `)
    ).recordset[0];

    if (!factRow) return null;

    // Resumen de estados y montos
    const rs = await this.database.request();
    rs.input('idFactura', Int, idFactura);
    const summaryRow = (
      await rs.query(`
      SELECT
        COUNT(*) AS totalLineas,
        SUM(CASE WHEN estado_conciliacion = 'CONFORME' THEN 1 ELSE 0 END) AS conformes,
        SUM(CASE WHEN estado_conciliacion = 'OBSERVADO' THEN 1 ELSE 0 END) AS observados,
        SUM(CASE WHEN estado_conciliacion = 'CORREGIDO' THEN 1 ELSE 0 END) AS corregidos,
        SUM(CASE WHEN estado_conciliacion = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN id_linea IS NULL THEN 1 ELSE 0 END) AS lineasNoRegistradas,
        SUM(cargo_plan) AS totalCargosPlan,
        SUM(cargos_adicionales) AS totalCargosAdicionales,
        SUM(cargo_equipos) AS totalCargosEquipos,
        SUM(descuentos) AS totalDescuentos,
        SUM(monto_total) AS totalCalculado
      FROM dbo.facturas_telefonia_detalle
      WHERE id_factura = @idFactura
    `)
    ).recordset[0];

    return {
      factura: {
        idFactura: factRow.idFactura,
        numeroFactura: factRow.numeroFactura,
        operador: factRow.operadorNombre,
        periodoInicio: factRow.periodoInicio,
        periodoFin: factRow.periodoFin,
        montoTotal: Number(factRow.montoTotal),
        estadoConciliacion: factRow.estadoConciliacion,
      },
      metricas: {
        totalLineas: Number(summaryRow?.totalLineas ?? 0),
        conformes: Number(summaryRow?.conformes ?? 0),
        observados: Number(summaryRow?.observados ?? 0),
        corregidos: Number(summaryRow?.corregidos ?? 0),
        pendientes: Number(summaryRow?.pendientes ?? 0),
        lineasNoRegistradas: Number(summaryRow?.lineasNoRegistradas ?? 0),
      },
      financiero: {
        montoFacturado: Number(factRow.montoTotal),
        totalCargosPlan: Number(summaryRow?.totalCargosPlan ?? 0),
        totalCargosAdicionales: Number(summaryRow?.totalCargosAdicionales ?? 0),
        totalCargosEquipos: Number(summaryRow?.totalCargosEquipos ?? 0),
        totalDescuentos: Number(summaryRow?.totalDescuentos ?? 0),
        totalCalculado: Number(summaryRow?.totalCalculado ?? 0),
        diferencia: Number(factRow.montoTotal) - Number(summaryRow?.totalCalculado ?? 0),
      },
    };
  }

  private async audit(
    tx: Transaction,
    idFactura: number,
    user: number,
    action: string,
    before: unknown,
    after: unknown,
    ip: string,
  ) {
    const r = new Request(tx);
    r.input('user', Int, user)
      .input('action', VarChar(100), action)
      .input('id', VarChar(100), String(idFactura))
      .input('before', NVarChar(4000), before ? JSON.stringify(before) : null)
      .input('after', NVarChar(4000), JSON.stringify(after))
      .input('ip', VarChar(45), ip);

    await r.query(`
      INSERT INTO dbo.auditoria (
        id_usuario, modulo, accion, tabla_afectada, registro_id,
        datos_anteriores, datos_nuevos, direccion_ip
      )
      VALUES (
        @user, 'TELEFONIA', @action, 'facturas_telefonia', @id,
        @before, @after, @ip
      )
    `);
  }
}
