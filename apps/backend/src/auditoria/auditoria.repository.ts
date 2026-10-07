import { Injectable } from '@nestjs/common';
import { Int, VarChar, BigInt } from 'mssql';
import { DatabaseService } from '../database/database.service';
import { QueryAuditoriaDto } from './dto/query-auditoria.dto';

export interface AuditoriaListItem {
  id: string;
  idUsuario: number | null;
  usuarioLogon: string | null;
  usuarioNombre: string | null;
  modulo: string;
  accion: string;
  tablaAfectada: string | null;
  registroId: string | null;
  direccionIp: string | null;
  fecha: Date;
}

export interface AuditoriaDetail extends AuditoriaListItem {
  datosAnteriores: unknown | null;
  datosNuevos: unknown | null;
}

const sortMap: Record<string, string> = {
  fecha: 'A.fecha',
  modulo: 'A.modulo',
  accion: 'A.accion',
  usuario: 'U.user_logon',
  id_auditoria: 'A.id_auditoria',
};

@Injectable()
export class AuditoriaRepository {
  constructor(private readonly database: DatabaseService) {}

  async findAuditoria(q: QueryAuditoriaDto): Promise<{ items: AuditoriaListItem[]; total: number }> {
    const request = await this.database.request();
    const where: string[] = [];

    if (q.search) {
      request.input('search', VarChar(150), `%${q.search.trim()}%`);
      where.push(`(A.registro_id LIKE @search OR A.accion LIKE @search OR A.modulo LIKE @search OR U.user_logon LIKE @search)`);
    }

    if (q.fechaDesde) {
      request.input('fechaDesde', VarChar(50), q.fechaDesde);
      where.push(`A.fecha >= TRY_CAST(@fechaDesde AS DATETIME2)`);
    }

    if (q.fechaHasta) {
      request.input('fechaHasta', VarChar(50), q.fechaHasta);
      where.push(`A.fecha <= TRY_CAST(@fechaHasta AS DATETIME2)`);
    }

    if (q.usuario) {
      request.input('usuario', VarChar(100), `%${q.usuario.trim()}%`);
      where.push(`(U.user_logon LIKE @usuario OR U.user_fullname LIKE @usuario)`);
    }

    if (q.modulo) {
      request.input('modulo', VarChar(150), q.modulo.trim());
      where.push(`A.modulo = @modulo`);
    }

    if (q.accion) {
      request.input('accion', VarChar(100), q.accion.trim());
      where.push(`A.accion = @accion`);
    }

    if (q.tabla) {
      request.input('tabla', VarChar(150), q.tabla.trim());
      where.push(`A.tabla_afectada = @tabla`);
    }

    if (q.registroId) {
      request.input('registroId', VarChar(100), q.registroId.trim());
      where.push(`A.registro_id = @registroId`);
    }

    const sortCol = sortMap[q.sortBy] ?? 'A.fecha';
    const sortDir = q.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (q.page - 1) * q.pageSize;

    request.input('offset', Int, offset);
    request.input('pageSize', Int, q.pageSize);

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const result = await request.query<{
      id_auditoria: number | string;
      id_usuario: number | null;
      user_logon: string | null;
      user_fullname: string | null;
      modulo: string;
      accion: string;
      tabla_afectada: string | null;
      registro_id: string | null;
      direccion_ip: string | null;
      fecha: Date;
      total: number;
    }>(`
      SELECT
        A.id_auditoria,
        A.id_usuario,
        U.user_logon,
        U.user_fullname,
        A.modulo,
        A.accion,
        A.tabla_afectada,
        A.registro_id,
        A.direccion_ip,
        A.fecha,
        COUNT(*) OVER() AS total
      FROM dbo.auditoria A
      LEFT JOIN dbo.usuarios_sistema U ON U.id_usuario_sistema = A.id_usuario
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `);

    const total = Number(result.recordset[0]?.total ?? 0);
    const items: AuditoriaListItem[] = result.recordset.map((r) => ({
      id: String(r.id_auditoria),
      idUsuario: r.id_usuario,
      usuarioLogon: r.user_logon,
      usuarioNombre: r.user_fullname,
      modulo: r.modulo,
      accion: r.accion,
      tablaAfectada: r.tabla_afectada,
      registroId: r.registro_id,
      direccionIp: r.direccion_ip,
      fecha: r.fecha,
    }));

    return { items, total };
  }

  async findAuditoriaById(id: string): Promise<AuditoriaDetail | null> {
    const request = await this.database.request();
    request.input('id', BigInt, id);

    const result = await request.query<{
      id_auditoria: number | string;
      id_usuario: number | null;
      user_logon: string | null;
      user_fullname: string | null;
      modulo: string;
      accion: string;
      tabla_afectada: string | null;
      registro_id: string | null;
      datos_anteriores: string | null;
      datos_nuevos: string | null;
      direccion_ip: string | null;
      fecha: Date;
    }>(`
      SELECT
        A.id_auditoria,
        A.id_usuario,
        U.user_logon,
        U.user_fullname,
        A.modulo,
        A.accion,
        A.tabla_afectada,
        A.registro_id,
        A.datos_anteriores,
        A.datos_nuevos,
        A.direccion_ip,
        A.fecha
      FROM dbo.auditoria A
      LEFT JOIN dbo.usuarios_sistema U ON U.id_usuario_sistema = A.id_usuario
      WHERE A.id_auditoria = @id
    `);

    const row = result.recordset[0];
    if (!row) return null;

    let parsedBefore: unknown = null;
    let parsedAfter: unknown = null;

    if (row.datos_anteriores) {
      try {
        parsedBefore = JSON.parse(row.datos_anteriores);
      } catch {
        parsedBefore = row.datos_anteriores;
      }
    }

    if (row.datos_nuevos) {
      try {
        parsedAfter = JSON.parse(row.datos_nuevos);
      } catch {
        parsedAfter = row.datos_nuevos;
      }
    }

    return {
      id: String(row.id_auditoria),
      idUsuario: row.id_usuario,
      usuarioLogon: row.user_logon,
      usuarioNombre: row.user_fullname,
      modulo: row.modulo,
      accion: row.accion,
      tablaAfectada: row.tabla_afectada,
      registroId: row.registro_id,
      datosAnteriores: parsedBefore,
      datosNuevos: parsedAfter,
      direccionIp: row.direccion_ip,
      fecha: row.fecha,
    };
  }
}
