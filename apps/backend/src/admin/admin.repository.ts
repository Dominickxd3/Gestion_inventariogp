import { Injectable } from '@nestjs/common';
import { Bit, Int, MAX, NVarChar, VarChar } from 'mssql';
import { DatabaseService } from '../database/database.service';
import { QueryUsuariosDto } from './dto/query-usuarios.dto';
import { UpdateUsuarioAccesoDto } from './dto/update-usuario-acceso.dto';

export interface UsuarioListItem {
  id: number;
  userLogon: string;
  userFullname: string | null;
  userEmail: string | null;
  userEstadoErp: number | null;
  permitirAcceso: boolean;
  estadoLocal: boolean;
  idRol: number | null;
  rolCodigo: string | null;
  rol: string | null;
  ultimaSincronizacion: Date | null;
  ultimoAcceso: Date | null;
}

export interface UsuarioDetail {
  id: number;
  userLogon: string;
  userFullname: string | null;
  userEmail: string | null;
  userEstadoErp: number | null;
  permitirAcceso: boolean;
  estadoLocal: boolean;
  idRol: number | null;
  rolCodigo: string | null;
  rolNombre: string | null;
  rolDescripcion: string | null;
  ultimaSincronizacion: Date | null;
  ultimoAcceso: Date | null;
  observaciones: string | null;
  permisos: Array<{
    codigo: string;
    nombre: string;
    modulo: string;
  }>;
}

export interface RolItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface PermisoItem {
  id: number;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion: string | null;
}

const sortMap: Record<string, string> = {
  user_logon: 'U.user_logon',
  user_fullname: 'U.user_fullname',
  rol: 'R.nombre',
  ultimo_acceso: 'U.ultimo_acceso',
  ultima_sincronizacion: 'U.ultima_sincronizacion',
  permitir_acceso: 'U.permitir_acceso',
};

@Injectable()
export class AdminRepository {
  constructor(private readonly database: DatabaseService) {}

  async findUsuarios(q: QueryUsuariosDto): Promise<{ items: UsuarioListItem[]; total: number }> {
    const request = await this.database.request();
    const where: string[] = [];

    if (q.search) {
      request.input('search', VarChar(150), `%${q.search.trim()}%`);
      where.push(`(U.user_logon LIKE @search OR U.user_fullname LIKE @search OR U.user_email LIKE @search)`);
    }

    if (q.estadoERP !== undefined) {
      request.input('estadoERP', Int, q.estadoERP);
      where.push(`U.user_estado_erp = @estadoERP`);
    }

    if (q.estadoLocal !== undefined) {
      request.input('estadoLocal', Bit, q.estadoLocal ? 1 : 0);
      where.push(`U.estado_local = @estadoLocal`);
    }

    if (q.permitirAcceso !== undefined) {
      request.input('permitirAcceso', Bit, q.permitirAcceso ? 1 : 0);
      where.push(`U.permitir_acceso = @permitirAcceso`);
    }

    if (q.idRol !== undefined) {
      request.input('idRol', Int, q.idRol);
      where.push(`U.id_rol = @idRol`);
    }

    const sortColumn = sortMap[q.sortBy] ?? 'U.user_logon';
    const sortDir = q.sortDirection?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const offset = (q.page - 1) * q.pageSize;

    request.input('offset', Int, offset);
    request.input('pageSize', Int, q.pageSize);

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const result = await request.query<{
      id_usuario_sistema: number;
      user_logon: string;
      user_fullname: string | null;
      user_email: string | null;
      user_estado_erp: number | null;
      permitir_acceso: boolean;
      estado_local: boolean;
      id_rol: number | null;
      rol_codigo: string | null;
      rol_nombre: string | null;
      ultima_sincronizacion: Date | null;
      ultimo_acceso: Date | null;
      total: number;
    }>(`
      SELECT
        U.id_usuario_sistema,
        U.user_logon,
        U.user_fullname,
        U.user_email,
        U.user_estado_erp,
        U.permitir_acceso,
        U.estado_local,
        U.id_rol,
        R.codigo AS rol_codigo,
        R.nombre AS rol_nombre,
        U.ultima_sincronizacion,
        U.ultimo_acceso,
        COUNT(*) OVER() AS total
      FROM dbo.usuarios_sistema U
      LEFT JOIN dbo.roles R ON R.id_rol = U.id_rol
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDir}
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `);

    const total = Number(result.recordset[0]?.total ?? 0);
    const items: UsuarioListItem[] = result.recordset.map((row) => ({
      id: row.id_usuario_sistema,
      userLogon: row.user_logon,
      userFullname: row.user_fullname,
      userEmail: row.user_email,
      userEstadoErp: row.user_estado_erp,
      permitirAcceso: Boolean(row.permitir_acceso),
      estadoLocal: Boolean(row.estado_local),
      idRol: row.id_rol,
      rolCodigo: row.rol_codigo,
      rol: row.rol_nombre,
      ultimaSincronizacion: row.ultima_sincronizacion,
      ultimoAcceso: row.ultimo_acceso,
    }));

    return { items, total };
  }

  async findUsuarioById(id: number): Promise<UsuarioDetail | null> {
    const request = await this.database.request();
    request.input('id', Int, id);

    const result = await request.query<{
      id_usuario_sistema: number;
      user_logon: string;
      user_fullname: string | null;
      user_email: string | null;
      user_estado_erp: number | null;
      permitir_acceso: boolean;
      estado_local: boolean;
      id_rol: number | null;
      rol_codigo: string | null;
      rol_nombre: string | null;
      rol_descripcion: string | null;
      ultima_sincronizacion: Date | null;
      ultimo_acceso: Date | null;
      observaciones: string | null;
    }>(`
      SELECT
        U.id_usuario_sistema,
        U.user_logon,
        U.user_fullname,
        U.user_email,
        U.user_estado_erp,
        U.permitir_acceso,
        U.estado_local,
        U.id_rol,
        R.codigo AS rol_codigo,
        R.nombre AS rol_nombre,
        R.descripcion AS rol_descripcion,
        U.ultima_sincronizacion,
        U.ultimo_acceso,
        U.observaciones
      FROM dbo.usuarios_sistema U
      LEFT JOIN dbo.roles R ON R.id_rol = U.id_rol
      WHERE U.id_usuario_sistema = @id
    `);

    const row = result.recordset[0];
    if (!row) return null;

    const permRequest = await this.database.request();
    permRequest.input('id', Int, id);
    const permResult = await permRequest.query<{
      permiso: string;
      nombre_permiso: string;
      modulo: string;
    }>(`
      SELECT permiso, nombre_permiso, modulo
      FROM dbo.vw_usuarios_permisos
      WHERE id_usuario_sistema = @id
      ORDER BY modulo, permiso
    `);

    return {
      id: row.id_usuario_sistema,
      userLogon: row.user_logon,
      userFullname: row.user_fullname,
      userEmail: row.user_email,
      userEstadoErp: row.user_estado_erp,
      permitirAcceso: Boolean(row.permitir_acceso),
      estadoLocal: Boolean(row.estado_local),
      idRol: row.id_rol,
      rolCodigo: row.rol_codigo,
      rolNombre: row.rol_nombre,
      rolDescripcion: row.rol_descripcion,
      ultimaSincronizacion: row.ultima_sincronizacion,
      ultimoAcceso: row.ultimo_acceso,
      observaciones: row.observaciones,
      permisos: permResult.recordset.map((p) => ({
        codigo: p.permiso,
        nombre: p.nombre_permiso,
        modulo: p.modulo,
      })),
    };
  }

  async countActiveAdmins(): Promise<number> {
    const request = await this.database.request();
    const result = await request.query<{ count: number }>(`
      SELECT COUNT(*) AS count
      FROM dbo.usuarios_sistema U
      INNER JOIN dbo.roles R ON R.id_rol = U.id_rol
      WHERE R.codigo = 'ADMIN'
        AND U.permitir_acceso = 1
        AND U.estado_local = 1
        AND U.user_estado_erp = 0
    `);
    return Number(result.recordset[0]?.count ?? 0);
  }

  async findRolById(idRol: number): Promise<RolItem | null> {
    const request = await this.database.request();
    request.input('idRol', Int, idRol);
    const result = await request.query<{
      id_rol: number;
      codigo: string;
      nombre: string;
      descripcion: string | null;
      estado: boolean;
    }>(`
      SELECT id_rol, codigo, nombre, descripcion, estado
      FROM dbo.roles
      WHERE id_rol = @idRol
    `);
    const row = result.recordset[0];
    if (!row) return null;
    return {
      id: row.id_rol,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion,
      estado: Boolean(row.estado),
    };
  }

  async updateUsuarioAcceso(id: number, data: UpdateUsuarioAccesoDto): Promise<void> {
    const request = await this.database.request();
    request.input('id', Int, id);

    const updates: string[] = ['fecha_actualizacion = SYSDATETIME()'];

    if (data.permitir_acceso !== undefined) {
      request.input('permitirAcceso', Bit, data.permitir_acceso ? 1 : 0);
      updates.push('permitir_acceso = @permitirAcceso');
    }

    if (data.estado_local !== undefined) {
      request.input('estadoLocal', Bit, data.estado_local ? 1 : 0);
      updates.push('estado_local = @estadoLocal');
    }

    if (data.id_rol !== undefined) {
      request.input('idRol', Int, data.id_rol);
      updates.push('id_rol = @idRol');
    }

    if (data.observaciones !== undefined) {
      request.input('observaciones', VarChar(500), data.observaciones);
      updates.push('observaciones = @observaciones');
    }

    await request.query(`
      UPDATE dbo.usuarios_sistema
      SET ${updates.join(', ')}
      WHERE id_usuario_sistema = @id
    `);
  }

  async sincronizarUsuariosErp(): Promise<{ sincronizados: number }> {
    const request = await this.database.request();
    const result = await request.execute<{ total_usuarios_locales?: number; sincronizados?: number }>('dbo.sp_sincronizar_usuarios_erp');
    const firstRow = result.recordset?.[0] as Record<string, unknown> | undefined;
    const count = Number(firstRow?.sincronizados ?? firstRow?.total_usuarios_locales ?? 0);
    return { sincronizados: count };
  }

  async findRoles(): Promise<RolItem[]> {
    const request = await this.database.request();
    const result = await request.query<{
      id_rol: number;
      codigo: string;
      nombre: string;
      descripcion: string | null;
      estado: boolean;
    }>(`
      SELECT id_rol, codigo, nombre, descripcion, estado
      FROM dbo.roles
      WHERE estado = 1
      ORDER BY nombre
    `);
    return result.recordset.map((r) => ({
      id: r.id_rol,
      codigo: r.codigo,
      nombre: r.nombre,
      descripcion: r.descripcion,
      estado: Boolean(r.estado),
    }));
  }

  async findPermisos(): Promise<PermisoItem[]> {
    const request = await this.database.request();
    const result = await request.query<{
      id_permiso: number;
      codigo: string;
      nombre: string;
      modulo: string;
      descripcion: string | null;
    }>(`
      SELECT id_permiso, codigo, nombre, modulo, descripcion
      FROM dbo.permisos
      WHERE estado = 1
      ORDER BY modulo, codigo
    `);
    return result.recordset.map((p) => ({
      id: p.id_permiso,
      codigo: p.codigo,
      nombre: p.nombre,
      modulo: p.modulo,
      descripcion: p.descripcion,
    }));
  }

  async audit(
    userId: number,
    action: string,
    recordId: string,
    before: unknown,
    after: unknown,
    ip: string,
  ): Promise<void> {
    const request = await this.database.request();
    request.input('userId', Int, userId);
    request.input('modulo', VarChar(150), 'SEGURIDAD');
    request.input('accion', VarChar(100), action);
    request.input('tabla', VarChar(150), 'usuarios_sistema');
    request.input('recordId', VarChar(100), recordId);
    request.input('before', NVarChar(MAX), before ? JSON.stringify(before) : null);
    request.input('after', NVarChar(MAX), after ? JSON.stringify(after) : null);
    request.input('ip', VarChar(45), ip);

    await request.query(`
      INSERT INTO dbo.auditoria (
        id_usuario,
        modulo,
        accion,
        tabla_afectada,
        registro_id,
        datos_anteriores,
        datos_nuevos,
        direccion_ip
      )
      VALUES (
        @userId,
        @modulo,
        @accion,
        @tabla,
        @recordId,
        @before,
        @after,
        @ip
      )
    `);
  }
}
