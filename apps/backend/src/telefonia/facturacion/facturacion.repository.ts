import { Injectable } from '@nestjs/common';
import { Date as SqlDate, Decimal, Int, NVarChar, Request, Transaction, VarChar } from 'mssql';
import { DatabaseService } from '../../database/database.service';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { QueryFacturaDetalleDto } from './dto/query-factura-detalle.dto';
import { QueryFacturasDto } from './dto/query-facturas.dto';
import { UpdateDetalleEstadoDto } from './dto/update-detalle-estado.dto';

const sortFacturasMap: Record<string, string> = {
  periodoInicio: 'F.periodo_inicio',
  periodoFin: 'F.periodo_fin',
  fechaEmision: 'F.fecha_emision',
  fechaVencimiento: 'F.fecha_vencimiento',
  montoTotal: 'F.monto_total',
  numeroFactura: 'F.numero_factura',
  estadoConciliacion: 'F.estado_conciliacion',
};

const sortDetalleMap: Record<string, string> = {
  numeroLinea: 'FD.numero_linea',
  cargoPlan: 'FD.cargo_plan',
  montoTotal: 'FD.monto_total',
  estadoConciliacion: 'FD.estado_conciliacion',
};

@Injectable()
export class FacturacionRepository {
  constructor(private readonly database: DatabaseService) {}

  private request(tx?: Transaction): Promise<Request> {
    return tx ? Promise.resolve(new Request(tx)) : this.database.request();
  }

  async list(q: QueryFacturasDto) {
    const r = await this.database.request();
    const where: string[] = [];

    if (q.search) {
      r.input('search', VarChar(102), `%${q.search}%`);
      where.push(`(F.numero_factura LIKE @search OR F.numero_cuenta LIKE @search)`);
    }
    if (q.idOperador) {
      r.input('idOperador', Int, q.idOperador);
      where.push(`F.id_operador = @idOperador`);
    }
    if (q.estadoConciliacion) {
      r.input('estado', VarChar(30), q.estadoConciliacion);
      where.push(`F.estado_conciliacion = @estado`);
    }
    if (q.periodoDesde) {
      r.input('periodoDesde', VarChar(20), q.periodoDesde);
      where.push(`F.periodo_inicio >= @periodoDesde`);
    }
    if (q.periodoHasta) {
      r.input('periodoHasta', VarChar(20), q.periodoHasta);
      where.push(`F.periodo_fin <= @periodoHasta`);
    }

    r.input('offset', Int, (q.page - 1) * q.pageSize).input('pageSize', Int, q.pageSize);
    const col = sortFacturasMap[q.sortBy] ?? 'F.periodo_inicio';

    const queryStr = `
      SELECT
        F.id_factura AS idFactura,
        F.numero_factura AS numeroFactura,
        F.numero_cuenta AS numeroCuenta,
        F.fecha_emision AS fechaEmision,
        F.periodo_inicio AS periodoInicio,
        F.periodo_fin AS periodoFin,
        F.fecha_vencimiento AS fechaVencimiento,
        F.monto_total AS montoTotal,
        F.archivo_pdf AS archivoPdf,
        F.estado_conciliacion AS estadoConciliacion,
        F.fecha_importacion AS fechaImportacion,
        F.fecha_cierre AS fechaCierre,
        O.id_operador AS idOperador,
        O.nombre AS operadorNombre,
        UI.nombres AS usuarioImportacionNombre,
        UC.nombres AS usuarioCierreNombre,
        (SELECT COUNT(*) FROM dbo.facturas_telefonia_detalle FD WHERE FD.id_factura = F.id_factura) AS totalLineas,
        COUNT(*) OVER() AS total
      FROM dbo.facturas_telefonia F
      JOIN dbo.operadores_moviles O ON O.id_operador = F.id_operador
      LEFT JOIN dbo.usuarios_sistema UI ON UI.id_usuario = F.usuario_importacion
      LEFT JOIN dbo.usuarios_sistema UC ON UC.id_usuario = F.usuario_cierre
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY ${col} ${q.sortDirection.toUpperCase()}
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;

    const rows = (await r.query(queryStr)).recordset;
    const total = Number(rows[0]?.total ?? 0);

    return {
      items: rows.map((x: Record<string, unknown>) => ({
        idFactura: x.idFactura,
        numeroFactura: x.numeroFactura,
        numeroCuenta: x.numeroCuenta,
        fechaEmision: x.fechaEmision,
        periodoInicio: x.periodoInicio,
        periodoFin: x.periodoFin,
        fechaVencimiento: x.fechaVencimiento,
        montoTotal: Number(x.montoTotal),
        archivoPdf: x.archivoPdf,
        estadoConciliacion: x.estadoConciliacion,
        fechaImportacion: x.fechaImportacion,
        fechaCierre: x.fechaCierre,
        operador: { id: x.idOperador, nombre: x.operadorNombre },
        usuarioImportacion: x.usuarioImportacionNombre,
        usuarioCierre: x.usuarioCierreNombre,
        totalLineas: Number(x.totalLineas ?? 0),
      })),
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: total ? Math.ceil(total / q.pageSize) : 0,
      },
    };
  }

  async detail(id: number, tx?: Transaction, lock = false) {
    const hint = lock ? ' WITH (UPDLOCK,HOLDLOCK)' : '';
    const r = await this.request(tx);
    r.input('id', Int, id);

    const factRow = (
      await r.query(`
      SELECT
        F.id_factura AS idFactura,
        F.numero_factura AS numeroFactura,
        F.numero_cuenta AS numeroCuenta,
        F.fecha_emision AS fechaEmision,
        F.periodo_inicio AS periodoInicio,
        F.periodo_fin AS periodoFin,
        F.fecha_vencimiento AS fechaVencimiento,
        F.monto_total AS montoTotal,
        F.archivo_pdf AS archivoPdf,
        F.estado_conciliacion AS estadoConciliacion,
        F.fecha_importacion AS fechaImportacion,
        F.fecha_cierre AS fechaCierre,
        F.observaciones,
        O.id_operador AS idOperador,
        O.nombre AS operadorNombre,
        UI.nombres AS usuarioImportacionNombre,
        UC.nombres AS usuarioCierreNombre
      FROM dbo.facturas_telefonia F${hint}
      JOIN dbo.operadores_moviles O ON O.id_operador = F.id_operador
      LEFT JOIN dbo.usuarios_sistema UI ON UI.id_usuario = F.usuario_importacion
      LEFT JOIN dbo.usuarios_sistema UC ON UC.id_usuario = F.usuario_cierre
      WHERE F.id_factura = @id
    `)
    ).recordset[0];

    if (!factRow) return null;

    // Resumen estadístico de las líneas
    const rs = await this.request(tx);
    rs.input('id', Int, id);
    const statsRow = (
      await rs.query(`
      SELECT
        COUNT(*) AS totalLineas,
        SUM(CASE WHEN estado_conciliacion = 'CONFORME' THEN 1 ELSE 0 END) AS conformes,
        SUM(CASE WHEN estado_conciliacion = 'OBSERVADO' THEN 1 ELSE 0 END) AS observados,
        SUM(CASE WHEN estado_conciliacion = 'CORREGIDO' THEN 1 ELSE 0 END) AS corregidos,
        SUM(CASE WHEN estado_conciliacion = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
        SUM(cargo_plan) AS totalCargosPlan,
        SUM(cargos_adicionales) AS totalCargosAdicionales,
        SUM(cargo_equipos) AS totalCargosEquipos,
        SUM(descuentos) AS totalDescuentos,
        SUM(monto_total) AS totalCalculado
      FROM dbo.facturas_telefonia_detalle
      WHERE id_factura = @id
    `)
    ).recordset[0];

    // Cuotas vinculadas a esta factura
    const rc = await this.request(tx);
    rc.input('id', Int, id);
    const cuotas = (
      await rc.query(`
      SELECT
        FC.id_cuota AS idCuota,
        FC.id_financiamiento AS idFinanciamiento,
        FC.numero_cuota AS numeroCuota,
        FC.monto,
        FC.estado,
        FC.fecha_facturacion AS fechaFacturacion,
        A.codigo AS codigoActivo,
        A.marca,
        A.modelo,
        FE.numero_folio AS numeroFolio
      FROM dbo.financiamientos_cuotas FC
      JOIN dbo.financiamientos_equipo FE ON FE.id_financiamiento = FC.id_financiamiento
      JOIN dbo.activos A ON A.id_activo = FE.id_activo
      WHERE FC.id_factura = @id
      ORDER BY FC.numero_cuota ASC
    `)
    ).recordset;

    return {
      idFactura: factRow.idFactura,
      numeroFactura: factRow.numeroFactura,
      numeroCuenta: factRow.numeroCuenta,
      fechaEmision: factRow.fechaEmision,
      periodoInicio: factRow.periodoInicio,
      periodoFin: factRow.periodoFin,
      fechaVencimiento: factRow.fechaVencimiento,
      montoTotal: Number(factRow.montoTotal),
      archivoPdf: factRow.archivoPdf,
      estadoConciliacion: factRow.estadoConciliacion,
      fechaImportacion: factRow.fechaImportacion,
      fechaCierre: factRow.fechaCierre,
      observaciones: factRow.observaciones,
      operador: { id: factRow.idOperador, nombre: factRow.operadorNombre },
      usuarioImportacion: factRow.usuarioImportacionNombre,
      usuarioCierre: factRow.usuarioCierreNombre,
      resumen: {
        totalLineas: Number(statsRow?.totalLineas ?? 0),
        conformes: Number(statsRow?.conformes ?? 0),
        observados: Number(statsRow?.observados ?? 0),
        corregidos: Number(statsRow?.corregidos ?? 0),
        pendientes: Number(statsRow?.pendientes ?? 0),
        totalCargosPlan: Number(statsRow?.totalCargosPlan ?? 0),
        totalCargosAdicionales: Number(statsRow?.totalCargosAdicionales ?? 0),
        totalCargosEquipos: Number(statsRow?.totalCargosEquipos ?? 0),
        totalDescuentos: Number(statsRow?.totalDescuentos ?? 0),
        totalCalculado: Number(statsRow?.totalCalculado ?? 0),
      },
      cuotasVinculadas: cuotas.map((c: Record<string, unknown>) => ({
        idCuota: c.idCuota,
        idFinanciamiento: c.idFinanciamiento,
        numeroCuota: c.numeroCuota,
        monto: Number(c.monto),
        estado: c.estado,
        fechaFacturacion: c.fechaFacturacion,
        activo: { codigo: c.codigoActivo, marca: c.marca, modelo: c.modelo },
        numeroFolio: c.numeroFolio,
      })),
    };
  }

  async create(d: CreateFacturaDto, userId: number, ip: string) {
    return this.database.transaction(async (tx) => {
      // 1. Validar operador
      const ro = await this.request(tx);
      ro.input('idOp', Int, d.idOperador);
      const opExists = (
        await ro.query(`SELECT id_operador FROM dbo.operadores_moviles WHERE id_operador = @idOp AND estado = 1`)
      ).recordset[0];
      if (!opExists) {
        throw Object.assign(new Error('OPERADOR_NO_ENCONTRADO'), { code: 'OPERADOR_NO_ENCONTRADO' });
      }

      // 2. Validar duplicidad si viene numeroFactura
      if (d.numeroFactura) {
        const rd = await this.request(tx);
        rd.input('idOp', Int, d.idOperador).input('numFactura', VarChar(100), d.numeroFactura);
        const dupFactura = (
          await rd.query(`
          SELECT id_factura FROM dbo.facturas_telefonia
          WHERE id_operador = @idOp AND numero_factura = @numFactura
        `)
        ).recordset[0];
        if (dupFactura) {
          throw Object.assign(new Error('FACTURA_DUPLICADA'), { code: 'FACTURA_DUPLICADA' });
        }
      }

      // 3. Validar números duplicados en el lote de detalle
      const numerosSet = new Set<string>();
      for (const item of d.detalles) {
        const num = item.numeroLinea.trim();
        if (numerosSet.has(num)) {
          throw Object.assign(new Error(`DETALLE_LINEAS_DUPLICADAS: ${num}`), { code: 'DETALLE_LINEAS_DUPLICADAS' });
        }
        numerosSet.add(num);
      }

      // 4. Insertar cabecera de factura
      const rf = await this.request(tx);
      rf.input('idOp', Int, d.idOperador)
        .input('numFactura', VarChar(100), d.numeroFactura ?? null)
        .input('numCuenta', VarChar(100), d.numeroCuenta ?? null)
        .input('fEmision', SqlDate, new Date(d.fechaEmision))
        .input('pInicio', SqlDate, new Date(d.periodoInicio))
        .input('pFin', SqlDate, new Date(d.periodoFin))
        .input('fVenc', SqlDate, d.fechaVencimiento ? new Date(d.fechaVencimiento) : null)
        .input('montoTotal', Decimal(14, 2), d.montoTotal)
        .input('archivoPdf', VarChar(1000), d.archivoPdf ?? null)
        .input('userImport', Int, userId)
        .input('observaciones', VarChar(1500), d.observaciones ?? null);

      const insResult = await rf.query(`
        INSERT INTO dbo.facturas_telefonia (
          id_operador, numero_factura, numero_cuenta, fecha_emision,
          periodo_inicio, periodo_fin, fecha_vencimiento, monto_total,
          archivo_pdf, estado_conciliacion, usuario_importacion, observaciones
        )
        VALUES (
          @idOp, @numFactura, @numCuenta, @fEmision,
          @pInicio, @pFin, @fVenc, @montoTotal,
          @archivoPdf, 'PENDIENTE', @userImport, @observaciones
        );
        SELECT SCOPE_IDENTITY() AS idFactura;
      `);

      const idFactura = Number(insResult.recordset[0]?.idFactura);

      // 5. Pre-vincular id_linea de manera set-based preservando numero_linea
      // Insertamos el detalle por bloques para soportar lotes de líneas
      const chunkSize = 50;
      for (let i = 0; i < d.detalles.length; i += chunkSize) {
        const chunk = d.detalles.slice(i, i + chunkSize);
        const rdChunk = await this.request(tx);
        rdChunk.input('idFactura', Int, idFactura);

        const valuesSql: string[] = [];
        chunk.forEach((det, idx) => {
          rdChunk
            .input(`num_${idx}`, VarChar(20), det.numeroLinea.trim())
            .input(`plan_${idx}`, VarChar(200), det.nombrePlan ?? null)
            .input(`cPlan_${idx}`, Decimal(12, 2), det.cargoPlan ?? 0)
            .input(`prorr_${idx}`, Decimal(12, 2), det.prorrateo ?? 0)
            .input(`cAdic_${idx}`, Decimal(12, 2), det.cargosAdicionales ?? 0)
            .input(`desc_${idx}`, Decimal(12, 2), det.descuentos ?? 0)
            .input(`cEq_${idx}`, Decimal(12, 2), det.cargoEquipos ?? 0)
            .input(`sAnt_${idx}`, Decimal(12, 2), det.saldoAnterior ?? 0)
            .input(`mTotal_${idx}`, Decimal(12, 2), det.montoTotal ?? 0)
            .input(`obs_${idx}`, VarChar(700), det.observaciones ?? null);

          valuesSql.push(`
            (
              @idFactura,
              (SELECT id_linea FROM dbo.lineas_moviles WHERE numero = @num_${idx}),
              @num_${idx},
              @plan_${idx},
              @cPlan_${idx},
              @prorr_${idx},
              @cAdic_${idx},
              @desc_${idx},
              @cEq_${idx},
              @sAnt_${idx},
              @mTotal_${idx},
              'PENDIENTE',
              @obs_${idx}
            )
          `);
        });

        await rdChunk.query(`
          INSERT INTO dbo.facturas_telefonia_detalle (
            id_factura, id_linea, numero_linea, nombre_plan,
            cargo_plan, prorrateo, cargos_adicionales, descuentos,
            cargo_equipos, saldo_anterior, monto_total, estado_conciliacion, observaciones
          )
          VALUES ${valuesSql.join(', ')}
        `);
      }

      // 6. Auditoría
      await this.audit(
        tx,
        idFactura,
        userId,
        'FACTURA_TELEFONIA_CREAR',
        null,
        { idFactura, idOperador: d.idOperador, numeroFactura: d.numeroFactura, totalLineas: d.detalles.length },
        ip,
      );

      return this.detail(idFactura, tx);
    });
  }

  async listDetalle(idFactura: number, q: QueryFacturaDetalleDto) {
    const r = await this.database.request();
    r.input('idFactura', Int, idFactura);
    const where: string[] = ['FD.id_factura = @idFactura'];

    if (q.search) {
      r.input('search', VarChar(102), `%${q.search}%`);
      where.push(`(FD.numero_linea LIKE @search OR FD.nombre_plan LIKE @search)`);
    }
    if (q.estadoConciliacion) {
      r.input('estado', VarChar(30), q.estadoConciliacion);
      where.push(`FD.estado_conciliacion = @estado`);
    }

    r.input('offset', Int, (q.page - 1) * q.pageSize).input('pageSize', Int, q.pageSize);
    const col = sortDetalleMap[q.sortBy] ?? 'FD.numero_linea';

    const queryStr = `
      SELECT
        FD.id_detalle AS idDetalle,
        FD.id_factura AS idFactura,
        FD.id_linea AS idLinea,
        FD.numero_linea AS numeroLinea,
        FD.nombre_plan AS nombrePlan,
        FD.cargo_plan AS cargoPlan,
        FD.prorrateo AS prorrateo,
        FD.cargos_adicionales AS cargosAdicionales,
        FD.descuentos AS descuentos,
        FD.cargo_equipos AS cargoEquipos,
        FD.saldo_anterior AS saldoAnterior,
        FD.monto_total AS montoTotal,
        FD.estado_conciliacion AS estadoConciliacion,
        FD.observaciones,
        L.estado AS lineaEstado,
        COUNT(*) OVER() AS total
      FROM dbo.facturas_telefonia_detalle FD
      LEFT JOIN dbo.lineas_moviles L ON L.id_linea = FD.id_linea
      WHERE ${where.join(' AND ')}
      ORDER BY ${col} ${q.sortDirection.toUpperCase()}
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;

    const rows = (await r.query(queryStr)).recordset;
    const total = Number(rows[0]?.total ?? 0);

    return {
      items: rows.map((x: Record<string, unknown>) => ({
        idDetalle: x.idDetalle,
        idFactura: x.idFactura,
        idLinea: x.idLinea,
        numeroLinea: x.numeroLinea,
        nombrePlan: x.nombrePlan,
        cargoPlan: Number(x.cargoPlan),
        prorrateo: Number(x.prorrateo),
        cargosAdicionales: Number(x.cargosAdicionales),
        descuentos: Number(x.descuentos),
        cargoEquipos: Number(x.cargoEquipos),
        saldoAnterior: Number(x.saldoAnterior),
        montoTotal: Number(x.montoTotal),
        estadoConciliacion: x.estadoConciliacion,
        observaciones: x.observaciones,
        lineaEstado: x.lineaEstado,
      })),
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: total ? Math.ceil(total / q.pageSize) : 0,
      },
    };
  }

  async updateDetalleEstado(
    idFactura: number,
    idDetalle: number,
    d: UpdateDetalleEstadoDto,
    userId: number,
    ip: string,
  ) {
    return this.database.transaction(async (tx) => {
      // 1. Bloquear cabecera y verificar que la factura no esté CERRADA
      const rf = await this.request(tx);
      rf.input('idFactura', Int, idFactura);
      const factura = (
        await rf.query(`
        SELECT estado_conciliacion AS estado
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

      // 2. Obtener estado previo del detalle
      const rd = await this.request(tx);
      rd.input('idDetalle', Int, idDetalle).input('idFactura', Int, idFactura);
      const before = (
        await rd.query(`
        SELECT id_detalle, id_linea, numero_linea, estado_conciliacion, observaciones
        FROM dbo.facturas_telefonia_detalle WITH (UPDLOCK,HOLDLOCK)
        WHERE id_detalle = @idDetalle AND id_factura = @idFactura
      `)
      ).recordset[0];

      if (!before) {
        throw Object.assign(new Error('DETALLE_NO_ENCONTRADO'), { code: 'DETALLE_NO_ENCONTRADO' });
      }

      // 3. Si se proporciona idLinea, verificar que la línea exista
      if (d.idLinea) {
        const rl = await this.request(tx);
        rl.input('idLinea', Int, d.idLinea);
        const lineaExists = (
          await rl.query(`SELECT id_linea FROM dbo.lineas_moviles WHERE id_linea = @idLinea`)
        ).recordset[0];
        if (!lineaExists) {
          throw Object.assign(new Error('LINEA_NO_ENCONTRADA'), { code: 'LINEA_NO_ENCONTRADA' });
        }
      }

      // 4. Actualizar detalle (sin sobreescribir el numero_linea original facturado)
      const ru = await this.request(tx);
      ru.input('idDetalle', Int, idDetalle)
        .input('estado', VarChar(30), d.estadoConciliacion)
        .input('obs', VarChar(700), d.observaciones ?? null)
        .input('idLinea', Int, d.idLinea ?? before.id_linea);

      await ru.query(`
        UPDATE dbo.facturas_telefonia_detalle
        SET
          estado_conciliacion = @estado,
          observaciones = @obs,
          id_linea = @idLinea
        WHERE id_detalle = @idDetalle
      `);

      // 5. Auditoría
      await this.audit(
        tx,
        idFactura,
        userId,
        'FACTURA_TELEFONIA_DETALLE_ESTADO',
        before,
        { idDetalle, estado: d.estadoConciliacion, observaciones: d.observaciones, idLinea: d.idLinea },
        ip,
      );

      return {
        idDetalle,
        idFactura,
        estadoConciliacion: d.estadoConciliacion,
        observaciones: d.observaciones,
        idLinea: d.idLinea ?? before.id_linea,
      };
    });
  }

  async cerrar(idFactura: number, motivo: string | undefined, userId: number, ip: string) {
    return this.database.transaction(async (tx) => {
      // 1. Bloquear y verificar cabecera
      const rf = await this.request(tx);
      rf.input('id', Int, idFactura);
      const factura = (
        await rf.query(`
        SELECT id_factura, estado_conciliacion AS estado, observaciones
        FROM dbo.facturas_telefonia WITH (UPDLOCK,HOLDLOCK)
        WHERE id_factura = @id
      `)
      ).recordset[0];

      if (!factura) {
        throw Object.assign(new Error('FACTURA_NO_ENCONTRADA'), { code: 'FACTURA_NO_ENCONTRADA' });
      }
      if (factura.estado === 'CERRADO') {
        throw Object.assign(new Error('FACTURA_YA_CERRADA'), { code: 'FACTURA_YA_CERRADA' });
      }

      // 2. Verificar si existen detalles pendientes u observados
      const rd = await this.request(tx);
      rd.input('id', Int, idFactura);
      const unverified = (
        await rd.query(`
        SELECT COUNT(*) AS total
        FROM dbo.facturas_telefonia_detalle
        WHERE id_factura = @id AND estado_conciliacion IN ('PENDIENTE', 'OBSERVADO')
      `)
      ).recordset[0]?.total;

      if (Number(unverified) > 0 && (!motivo || !motivo.trim())) {
        throw Object.assign(
          new Error('CIERRE_REQUERIDO_JUSTIFICACION: Existen líneas pendientes u observadas. Debe proporcionar un motivo de cierre justificado.'),
          { code: 'CIERRE_REQUERIDO_JUSTIFICACION' },
        );
      }

      // 3. Cerrar factura
      const ru = await this.request(tx);
      ru.input('id', Int, idFactura)
        .input('userId', Int, userId)
        .input('motivo', VarChar(1500), motivo?.trim() ? `[Cierre: ${motivo.trim()}]` : null);

      await ru.query(`
        UPDATE dbo.facturas_telefonia
        SET
          estado_conciliacion = 'CERRADO',
          fecha_cierre = SYSDATETIME(),
          usuario_cierre = @userId,
          observaciones = CASE
            WHEN @motivo IS NOT NULL AND observaciones IS NOT NULL THEN CONCAT_WS(' | ', observaciones, @motivo)
            WHEN @motivo IS NOT NULL THEN @motivo
            ELSE observaciones
          END
        WHERE id_factura = @id
      `);

      // 4. Auditoría
      await this.audit(
        tx,
        idFactura,
        userId,
        'FACTURA_TELEFONIA_CERRAR',
        factura,
        { idFactura, estado: 'CERRADO', fechaCierre: new Date().toISOString(), motivo },
        ip,
      );

      return this.detail(idFactura, tx);
    });
  }

  async vincularCuota(idFactura: number, idCuota: number, userId: number, ip: string) {
    return this.database.transaction(async (tx) => {
      // 1. Bloquear y verificar cabecera de factura
      const rf = await this.request(tx);
      rf.input('idFactura', Int, idFactura);
      const factura = (
        await rf.query(`
        SELECT id_factura, estado_conciliacion AS estado
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

      // 2. Bloquear y verificar cuota
      const rc = await this.request(tx);
      rc.input('idCuota', Int, idCuota);
      const cuota = (
        await rc.query(`
        SELECT id_cuota, id_financiamiento, numero_cuota, id_factura, estado, monto
        FROM dbo.financiamientos_cuotas WITH (UPDLOCK,HOLDLOCK)
        WHERE id_cuota = @idCuota
      `)
      ).recordset[0];

      if (!cuota) {
        throw Object.assign(new Error('CUOTA_NO_ENCONTRADA'), { code: 'CUOTA_NO_ENCONTRADA' });
      }
      if (cuota.id_factura && cuota.id_factura !== idFactura) {
        throw Object.assign(new Error('CUOTA_YA_VINCULADA_OTRA_FACTURA'), { code: 'CUOTA_YA_VINCULADA_OTRA_FACTURA' });
      }

      // 3. Vincular cuota a la factura
      const ru = await this.request(tx);
      ru.input('idCuota', Int, idCuota).input('idFactura', Int, idFactura);
      await ru.query(`
        UPDATE dbo.financiamientos_cuotas
        SET
          id_factura = @idFactura,
          estado = CASE WHEN estado = 'PENDIENTE' THEN 'FACTURADA' ELSE estado END
        WHERE id_cuota = @idCuota
      `);

      // 4. Auditoría
      await this.audit(
        tx,
        idFactura,
        userId,
        'FINANCIAMIENTO_CUOTA_VINCULAR_FACTURA',
        cuota,
        { idCuota, idFactura, estadoAnterior: cuota.estado, nuevoEstado: 'FACTURADA' },
        ip,
      );

      return {
        idCuota,
        idFactura,
        numeroCuota: cuota.numero_cuota,
        monto: Number(cuota.monto),
        estado: 'FACTURADA',
      };
    });
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
    const r = await this.request(tx);
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
