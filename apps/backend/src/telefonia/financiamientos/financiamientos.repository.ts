import { Injectable } from '@nestjs/common';
import { Int, NVarChar, Request, Transaction, VarChar } from 'mssql';
import { DatabaseService } from '../../database/database.service';
import { CrearFinanciamientoDto } from '../dto/crear-financiamiento.dto';
import { QueryFinanciamientosDto } from '../dto/query-financiamientos.dto';

@Injectable()
export class FinanciamientosRepository {
  constructor(private readonly database: DatabaseService) {}

  private request(tx?: Transaction): Promise<Request> {
    return tx ? Promise.resolve(new Request(tx)) : this.database.request();
  }

  private async validateCelular(idActivo: number, tx: Transaction): Promise<void> {
    const r = await this.request(tx);
    r.input('activo', Int, idActivo);
    const row = (await r.query(
      `SELECT UPPER(RTRIM(LTRIM(TA.nombre))) AS tipoNombre
       FROM dbo.activos A
       JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
       WHERE A.id_activo = @activo`,
    )).recordset[0];
    if (!row) throw Object.assign(new Error('ACTIVO_NOT_FOUND'), { code: 'ACTIVO_NOT_FOUND' });
    if (row.tipoNombre !== 'CELULAR') throw Object.assign(new Error('NOT_CELULAR'), { code: 'NOT_CELULAR' });
  }

  async list(q: QueryFinanciamientosDto) {
    const r = await this.database.request();
    const where: string[] = [];
    if (q.idActivo)   { r.input('idActivo', Int, q.idActivo);     where.push(`FE.id_activo=@idActivo`); }
    if (q.idOperador) { r.input('idOp', Int, q.idOperador);       where.push(`FE.id_operador=@idOp`); }
    if (q.estado)     { r.input('estado', VarChar(20), q.estado); where.push(`FE.estado=@estado`); }
    r.input('offset', Int, (q.page - 1) * q.pageSize).input('pageSize', Int, q.pageSize);

    const rows = (await r.query(
      `SELECT
         FE.id_financiamiento AS idFinanciamiento, FE.id_activo AS idActivo,
         A.codigo AS activoCodigo, A.marca AS activoMarca, A.modelo AS activoModelo,
         FE.id_operador AS idOperador, O.nombre AS operador,
         FE.numero_folio AS numeroFolio, FE.fecha_inicio AS fechaInicio,
         FE.cantidad_cuotas AS cantidadCuotas,
         FE.monto_cuota AS montoCuota, FE.monto_total AS montoTotal,
         FE.estado, FE.observaciones,
         COUNT(*) OVER() AS total
       FROM dbo.financiamientos_equipo FE
       JOIN dbo.activos A ON A.id_activo = FE.id_activo
       LEFT JOIN dbo.operadores_moviles O ON O.id_operador = FE.id_operador
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY FE.fecha_inicio DESC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
    )).recordset;

    const total = Number(rows[0]?.total ?? 0);
    return {
      items: rows.map((x: Record<string, unknown>) => ({
        idFinanciamiento: x.idFinanciamiento, idActivo: x.idActivo,
        activo: { codigo: x.activoCodigo, marca: x.activoMarca, modelo: x.activoModelo },
        operador: x.idOperador ? { id: x.idOperador, nombre: x.operador } : null,
        numeroFolio: x.numeroFolio, fechaInicio: x.fechaInicio,
        cantidadCuotas: x.cantidadCuotas, montoCuota: x.montoCuota,
        montoTotal: x.montoTotal, estado: x.estado, observaciones: x.observaciones,
      })),
      pagination: { page: q.page, pageSize: q.pageSize, total, totalPages: total ? Math.ceil(total / q.pageSize) : 0 },
    };
  }

  async detail(id: number) {
    const r = await this.database.request(); r.input('id', Int, id);
    const x = (await r.query(
      `SELECT FE.id_financiamiento, FE.id_activo,
         A.codigo AS activoCodigo, A.marca AS activoMarca, A.modelo AS activoModelo,
         FE.id_operador, O.nombre AS operador,
         FE.numero_folio, FE.fecha_inicio, FE.cantidad_cuotas,
         FE.monto_cuota, FE.monto_total, FE.estado, FE.observaciones
       FROM dbo.financiamientos_equipo FE
       JOIN dbo.activos A ON A.id_activo = FE.id_activo
       LEFT JOIN dbo.operadores_moviles O ON O.id_operador = FE.id_operador
       WHERE FE.id_financiamiento = @id`,
    )).recordset[0];
    if (!x) return null;

    const rc = await this.database.request(); rc.input('id', Int, id);
    const cuotas = (await rc.query(
      `SELECT id_cuota AS idCuota, numero_cuota AS numeroCuota,
         fecha_vencimiento AS fechaVencimiento, monto, estado, fecha_pago AS fechaPago
       FROM dbo.financiamientos_cuotas WHERE id_financiamiento=@id ORDER BY numero_cuota`,
    )).recordset;

    return {
      idFinanciamiento: x.id_financiamiento, idActivo: x.id_activo,
      activo: { codigo: x.activoCodigo, marca: x.activoMarca, modelo: x.activoModelo },
      operador: x.id_operador ? { id: x.id_operador, nombre: x.operador } : null,
      numeroFolio: x.numero_folio, fechaInicio: x.fecha_inicio,
      cantidadCuotas: x.cantidad_cuotas, montoCuota: x.monto_cuota,
      montoTotal: x.monto_total, estado: x.estado, observaciones: x.observaciones,
      cuotas,
    };
  }

  async create(d: CrearFinanciamientoDto, userId: number, ip: string) {
    return this.database.transaction(async tx => {
      await this.validateCelular(d.idActivo, tx);

      const r = await this.request(tx);
      r.input('idActivo', Int, d.idActivo).input('idOperador', Int, d.idOperador)
        .input('folio', VarChar(100), d.numeroFolio ?? null)
        .input('fechaInicio', VarChar(50), d.fechaInicio)
        .input('cuotas', Int, d.cantidadCuotas)
        .input('montoCuota', NVarChar(30), String(d.montoCuota))
        .input('montoTotal', NVarChar(30), String(d.montoTotal))
        .input('estado', VarChar(20), d.estado ?? 'ACTIVO')
        .input('obs', NVarChar(1000), d.observaciones ?? null);

      const res = (await r.query(
        `INSERT dbo.financiamientos_equipo(id_activo,id_operador,numero_folio,fecha_inicio,cantidad_cuotas,monto_cuota,monto_total,estado,observaciones)
         OUTPUT INSERTED.id_financiamiento
         VALUES(@idActivo,@idOperador,@folio,CONVERT(date,@fechaInicio),@cuotas,@montoCuota,@montoTotal,@estado,@obs)`,
      )).recordset[0];

      const newId: number = res.id_financiamiento;
      const after = await this.detail(newId);
      await this.audit(tx, newId, userId, 'FINANCIAMIENTO_CREAR', null, after, ip);
      return after;
    });
  }

  private async audit(tx: Transaction, id: number, user: number, action: string, before: unknown, after: unknown, ip: string) {
    const r = await this.request(tx);
    r.input('user', Int, user).input('action', VarChar(100), action)
      .input('id', VarChar(100), String(id))
      .input('before', NVarChar(4000), before ? JSON.stringify(before) : null)
      .input('after', NVarChar(4000), JSON.stringify(after))
      .input('ip', VarChar(45), ip);
    await r.query(
      `INSERT dbo.auditoria(id_usuario,modulo,accion,tabla_afectada,registro_id,datos_anteriores,datos_nuevos,direccion_ip)
       VALUES(@user,'TELEFONIA',@action,'financiamientos_equipo',@id,@before,@after,@ip)`,
    );
  }
}
