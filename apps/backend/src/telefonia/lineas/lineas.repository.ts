import { Injectable } from '@nestjs/common';
import { Int, NVarChar, Request, Transaction, VarChar } from 'mssql';
import { DatabaseService } from '../../database/database.service';
import { CreateLineaDto } from '../dto/create-linea.dto';
import { QueryLineasDto } from '../dto/query-lineas.dto';
import { UpdateLineaDto } from '../dto/update-linea.dto';

const sortMap: Record<string, string> = {
  numero: 'L.numero', estado: 'L.estado', operador: 'O.nombre', plan: 'P.nombre',
};

@Injectable()
export class LineasRepository {
  constructor(private readonly database: DatabaseService) {}

  request(tx?: Transaction): Promise<Request> {
    return tx ? Promise.resolve(new Request(tx)) : this.database.request();
  }

  async list(q: QueryLineasDto) {
    const r = await this.database.request();
    const where: string[] = [];
    if (q.search)      { r.input('search', VarChar(202), `%${q.search}%`); where.push(`(L.numero LIKE @search OR L.iccid LIKE @search)`); }
    if (q.estado)      { r.input('estado', VarChar(30), q.estado);         where.push(`L.estado=@estado`); }
    if (q.idOperador)  { r.input('idOp', Int, q.idOperador);               where.push(`L.id_operador=@idOp`); }
    if (q.idPlan)      { r.input('idPlan', Int, q.idPlan);                  where.push(`L.id_plan_actual=@idPlan`); }
    if (q.conResponsable === true)  where.push(`AL.id_asignacion_linea IS NOT NULL`);
    if (q.conResponsable === false) where.push(`AL.id_asignacion_linea IS NULL`);
    if (q.conCelular === true)      where.push(`LEH.id_linea_equipo IS NOT NULL`);
    if (q.conCelular === false)     where.push(`LEH.id_linea_equipo IS NULL`);
    r.input('offset', Int, (q.page - 1) * q.pageSize).input('pageSize', Int, q.pageSize);
    const col = sortMap[q.sortBy] ?? 'L.numero';

    const rows = (await r.query(
      `SELECT
         L.id_linea AS idLinea, L.numero, L.iccid, L.estado,
         L.fecha_alta AS fechaAlta, L.fecha_baja AS fechaBaja, L.observaciones,
         O.id_operador AS idOperador, O.nombre AS operador,
         P.id_plan AS idPlan, P.nombre AS plan,
         T.id_trabajador AS responsableId,
         CONCAT_WS(' ', T.nombres, T.apellidos) AS responsableNombre,
         T.cargo AS responsableCargo,
         A.id_activo AS celularId,
         A.codigo AS celularCodigo, A.marca AS celularMarca, A.modelo AS celularModelo,
         COUNT(*) OVER() AS total
       FROM dbo.lineas_moviles L
       LEFT JOIN dbo.operadores_moviles O ON O.id_operador = L.id_operador
       LEFT JOIN dbo.planes_moviles P ON P.id_plan = L.id_plan_actual
       LEFT JOIN dbo.asignaciones_linea AL ON AL.id_linea = L.id_linea AND AL.activo = 1
       LEFT JOIN dbo.trabajadores T ON T.id_trabajador = AL.id_trabajador
       LEFT JOIN dbo.linea_equipo_historial LEH ON LEH.id_linea = L.id_linea AND LEH.activo = 1
       LEFT JOIN dbo.activos A ON A.id_activo = LEH.id_activo
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY ${col} ${q.sortDirection.toUpperCase()}
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
    )).recordset;

    const total = Number(rows[0]?.total ?? 0);
    return {
      items: rows.map((x: Record<string, unknown>) => ({
        idLinea: x.idLinea, numero: x.numero, iccid: x.iccid, estado: x.estado,
        fechaAlta: x.fechaAlta, fechaBaja: x.fechaBaja, observaciones: x.observaciones,
        operador: x.idOperador ? { id: x.idOperador, nombre: x.operador } : null,
        plan: x.idPlan ? { id: x.idPlan, nombre: x.plan } : null,
        responsable: x.responsableId ? { id: x.responsableId, nombre: x.responsableNombre, cargo: x.responsableCargo } : null,
        celular: x.celularId ? { id: x.celularId, codigo: x.celularCodigo, marca: x.celularMarca, modelo: x.celularModelo } : null,
      })),
      pagination: { page: q.page, pageSize: q.pageSize, total, totalPages: total ? Math.ceil(total / q.pageSize) : 0 },
    };
  }

  // Detalle enriquecido — un solo request devuelve todo lo necesario para LineaDetailPage
  async detail(id: number, tx?: Transaction, lock = false) {
    const hint = lock ? ' WITH (UPDLOCK,HOLDLOCK)' : '';
    const r = await this.request(tx);
    r.input('id', Int, id);

    const x = (await r.query(
      `SELECT L.id_linea, L.numero, L.iccid, L.estado,
         L.fecha_alta, L.fecha_baja, L.observaciones, L.fecha_creacion, L.fecha_actualizacion,
         O.id_operador, O.nombre AS operador_nombre,
         P.id_plan, P.nombre AS plan_nombre, P.precio_mensual
       FROM dbo.lineas_moviles L${hint}
       LEFT JOIN dbo.operadores_moviles O ON O.id_operador = L.id_operador
       LEFT JOIN dbo.planes_moviles P ON P.id_plan = L.id_plan_actual
       WHERE L.id_linea = @id`,
    )).recordset[0];
    if (!x) return null;

    // responsable vigente
    const rr = await this.request(tx); rr.input('id', Int, id);
    const resp = (await rr.query(
      `SELECT AL.id_asignacion_linea, AL.id_trabajador,
         CONCAT_WS(' ', T.nombres, T.apellidos) AS nombre,
         T.dni, T.cargo, AR.nombre AS area, S.nombre AS sede,
         AL.fecha_inicio, AL.motivo, AL.observaciones, AL.usuario_registro
       FROM dbo.asignaciones_linea AL
       JOIN dbo.trabajadores T ON T.id_trabajador = AL.id_trabajador
       LEFT JOIN dbo.areas AR ON AR.id_area = T.id_area
       LEFT JOIN dbo.sedes S ON S.id_sede = AR.id_sede
       WHERE AL.id_linea = @id AND AL.activo = 1`,
    )).recordset[0] ?? null;

    // equipo vigente
    const rc = await this.request(tx); rc.input('id', Int, id);
    const cel = (await rc.query(
      `SELECT LEH.id_linea_equipo, LEH.id_activo,
         A.codigo, A.marca, A.modelo, AC.imei1, AC.imei2,
         LEH.fecha_inicio, LEH.observaciones, LEH.usuario_registro
       FROM dbo.linea_equipo_historial LEH
       JOIN dbo.activos A ON A.id_activo = LEH.id_activo
       LEFT JOIN dbo.activos_celulares AC ON AC.id_activo = A.id_activo
       WHERE LEH.id_linea = @id AND LEH.activo = 1`,
    )).recordset[0] ?? null;

    // historial responsables
    const rh = await this.request(tx); rh.input('id', Int, id);
    const histResp = (await rh.query(
      `SELECT AL.id_asignacion_linea, AL.activo AS vigente,
         T.id_trabajador, CONCAT_WS(' ', T.nombres, T.apellidos) AS nombre,
         T.dni, T.cargo, AR.nombre AS area,
         AL.fecha_inicio, AL.fecha_fin, AL.motivo, AL.observaciones, AL.usuario_registro
       FROM dbo.asignaciones_linea AL
       JOIN dbo.trabajadores T ON T.id_trabajador = AL.id_trabajador
       LEFT JOIN dbo.areas AR ON AR.id_area = T.id_area
       WHERE AL.id_linea = @id ORDER BY AL.fecha_inicio DESC`,
    )).recordset;

    // historial equipos
    const rhe = await this.request(tx); rhe.input('id', Int, id);
    const histEquipos = (await rhe.query(
      `SELECT LEH.id_linea_equipo, LEH.activo AS vigente,
         A.id_activo, A.codigo, A.marca, A.modelo, AC.imei1, AC.imei2,
         LEH.fecha_inicio, LEH.fecha_fin, LEH.observaciones, LEH.usuario_registro
       FROM dbo.linea_equipo_historial LEH
       JOIN dbo.activos A ON A.id_activo = LEH.id_activo
       LEFT JOIN dbo.activos_celulares AC ON AC.id_activo = A.id_activo
       WHERE LEH.id_linea = @id ORDER BY LEH.fecha_inicio DESC`,
    )).recordset;

    // advertencias / inconsistencias
    const advertencias: Array<{ codigo: string; mensaje: string }> = [];
    if (x.estado === 'ACTIVA') {
      if (!resp) advertencias.push({ codigo: 'SIN_RESPONSABLE', mensaje: 'La línea no tiene un responsable vigente.' });
      if (!cel)  advertencias.push({ codigo: 'SIN_EQUIPO',       mensaje: 'La línea no tiene un equipo asociado.' });
    }
    if (cel && resp) {
      const ri = await this.request(tx); ri.input('activo', Int, cel.id_activo as number);
      const asigEquipo = (await ri.query(
        `SELECT id_trabajador FROM dbo.asignaciones_activo WHERE id_activo=@activo AND activo=1`,
      )).recordset[0];
      if (asigEquipo && asigEquipo.id_trabajador !== resp.id_trabajador) {
        advertencias.push({ codigo: 'RESPONSABLE_DISTINTO', mensaje: 'El responsable de la línea no coincide con el responsable del celular.' });
      }
    }

    // financiamiento activo del equipo vigente
    let financiamientoActual = null;
    if (cel) {
      const rf = await this.request(tx); rf.input('activo', Int, cel.id_activo as number);
      financiamientoActual = (await rf.query(
        `SELECT id_financiamiento AS idFinanciamiento, numero_folio AS numeroFolio,
           fecha_inicio AS fechaInicio, cantidad_cuotas AS cantidadCuotas,
           monto_cuota AS montoCuota, monto_total AS montoTotal, estado
         FROM dbo.financiamientos_equipo
         WHERE id_activo=@activo AND estado='ACTIVO'`,
      )).recordset[0] ?? null;
    }

    return {
      idLinea: x.id_linea, numero: x.numero, iccid: x.iccid, estado: x.estado,
      fechaAlta: x.fecha_alta, fechaBaja: x.fecha_baja, observaciones: x.observaciones,
      fechaCreacion: x.fecha_creacion, fechaActualizacion: x.fecha_actualizacion,
      operador: x.id_operador ? { id: x.id_operador, nombre: x.operador_nombre } : null,
      plan: x.id_plan ? { id: x.id_plan, nombre: x.plan_nombre, precioMensual: x.precio_mensual } : null,
      responsableActual: resp ? {
        idAsignacionLinea: resp.id_asignacion_linea, idTrabajador: resp.id_trabajador,
        nombre: resp.nombre, dni: resp.dni, cargo: resp.cargo, area: resp.area, sede: resp.sede,
        fechaInicio: resp.fecha_inicio, motivo: resp.motivo, observaciones: resp.observaciones,
      } : null,
      equipoActual: cel ? {
        idLineaEquipo: cel.id_linea_equipo, idActivo: cel.id_activo,
        codigo: cel.codigo, marca: cel.marca, modelo: cel.modelo, imei1: cel.imei1, imei2: cel.imei2,
        fechaInicio: cel.fecha_inicio, observaciones: cel.observaciones,
      } : null,
      historialResponsables: histResp,
      historialEquipos: histEquipos,
      advertencias,
      financiamientoActual,
    };
  }

  async create(d: CreateLineaDto, userId: number, ip: string) {
    return this.database.transaction(async tx => {
      // validar plan pertenece al operador
      if (d.idPlan) {
        const rp = await this.request(tx);
        rp.input('plan', Int, d.idPlan).input('op', Int, d.idOperador);
        const planRow = (await rp.query(
          `SELECT id_plan FROM dbo.planes_moviles WHERE id_plan=@plan AND id_operador=@op AND estado=1`,
        )).recordset[0];
        if (!planRow) throw Object.assign(new Error('PLAN_OPERADOR_MISMATCH'), { code: 'PLAN_OPERADOR_MISMATCH' });
      }

      const r = await this.request(tx);
      r.input('numero', VarChar(20), d.numero)
        .input('idOp', Int, d.idOperador)
        .input('idPlan', Int, d.idPlan ?? null)
        .input('iccid', VarChar(100), d.iccid ?? null)
        .input('fechaAlta', VarChar(50), d.fechaAlta ?? null)
        .input('obs', NVarChar(1000), d.observaciones ?? null);

      const res = (await r.query(
        `INSERT dbo.lineas_moviles(numero,id_operador,id_plan_actual,iccid,estado,fecha_alta,observaciones,fecha_creacion,fecha_actualizacion)
         OUTPUT INSERTED.id_linea
         VALUES(@numero,@idOp,@idPlan,@iccid,'ACTIVA',ISNULL(CONVERT(date,@fechaAlta),GETDATE()),@obs,GETDATE(),GETDATE())`,
      )).recordset[0];

      const newId: number = res.id_linea;
      const after = await this.detail(newId, tx);
      await this.audit(tx, newId, userId, 'LINEA_CREAR', null, after, ip);
      return after;
    });
  }

  async update(id: number, d: UpdateLineaDto, userId: number, ip: string) {
    return this.database.transaction(async tx => {
      const before = await this.detail(id, tx, true);
      if (!before) return null;

      // validar plan ↔ operador si se cambia el plan
      if (d.idPlan !== undefined) {
        const idOperador = (before.operador as { id: number } | null)?.id;
        if (idOperador) {
          const rp = await this.request(tx);
          rp.input('plan', Int, d.idPlan).input('op', Int, idOperador);
          const planRow = (await rp.query(
            `SELECT id_plan FROM dbo.planes_moviles WHERE id_plan=@plan AND id_operador=@op AND estado=1`,
          )).recordset[0];
          if (!planRow) throw Object.assign(new Error('PLAN_OPERADOR_MISMATCH'), { code: 'PLAN_OPERADOR_MISMATCH' });
        }
      }

      const r = await this.request(tx);
      const sets: string[] = [];
      if (d.estado !== undefined)        { r.input('estado', VarChar(30), d.estado);         sets.push(`estado=@estado`); }
      if (d.iccid !== undefined)         { r.input('iccid', VarChar(100), d.iccid);           sets.push(`iccid=@iccid`); }
      if (d.idPlan !== undefined)        { r.input('idPlan', Int, d.idPlan);                   sets.push(`id_plan_actual=@idPlan`); }
      if (d.observaciones !== undefined) { r.input('obs', NVarChar(1000), d.observaciones);   sets.push(`observaciones=@obs`); }

      if (sets.length > 0) {
        r.input('id', Int, id);
        await r.query(`UPDATE dbo.lineas_moviles SET ${sets.join(',')},fecha_actualizacion=GETDATE() WHERE id_linea=@id`);
      }

      const after = await this.detail(id, tx);
      await this.audit(tx, id, userId, 'LINEA_EDITAR', before, after, ip);
      return after;
    });
  }

  // Equipos disponibles para asociar a línea
  // Un celular puede estar asignado físicamente pero libre de línea.
  async equiposDisponibles(search?: string) {
    const r = await this.database.request();
    if (search) r.input('search', VarChar(202), `%${search}%`);
    return (await r.query(
      `SELECT TOP (20)
         A.id_activo AS id, A.codigo, A.marca, A.modelo,
         AC.imei1, AC.imei2, EA.codigo AS estadoCodigo,
         CONCAT_WS(' ', T.nombres, T.apellidos) AS responsable
       FROM dbo.activos A
       JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
         AND UPPER(RTRIM(LTRIM(TA.nombre))) = 'CELULAR'
       JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
         AND EA.codigo NOT IN ('BAJA','MALOGRADO')
       LEFT JOIN dbo.activos_celulares AC ON AC.id_activo = A.id_activo
       LEFT JOIN dbo.asignaciones_activo AA ON AA.id_activo = A.id_activo AND AA.activo = 1
       LEFT JOIN dbo.trabajadores T ON T.id_trabajador = AA.id_trabajador
       WHERE NOT EXISTS (
         SELECT 1 FROM dbo.linea_equipo_historial H
         WHERE H.id_activo = A.id_activo AND H.activo = 1
       )
       ${search ? 'AND (A.codigo LIKE @search OR A.marca LIKE @search OR A.modelo LIKE @search OR AC.imei1 LIKE @search OR AC.imei2 LIKE @search)' : ''}
       ORDER BY A.codigo`,
    )).recordset;
  }

  private async audit(tx: Transaction, idLinea: number, user: number, action: string, before: unknown, after: unknown, ip: string) {
    const r = await this.request(tx);
    r.input('user', Int, user).input('action', VarChar(100), action)
      .input('id', VarChar(100), String(idLinea))
      .input('before', NVarChar(4000), before ? JSON.stringify(before) : null)
      .input('after', NVarChar(4000), JSON.stringify(after))
      .input('ip', VarChar(45), ip);
    await r.query(
      `INSERT dbo.auditoria(id_usuario,modulo,accion,tabla_afectada,registro_id,datos_anteriores,datos_nuevos,direccion_ip)
       VALUES(@user,'TELEFONIA',@action,'lineas_moviles',@id,@before,@after,@ip)`,
    );
  }
}
