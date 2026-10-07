import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bit, Int, VarChar } from 'mssql';
import { DatabaseService } from '../database/database.service';
import { Environment } from '../config/environment';
import { AuthUser, Permission } from './auth.types';

interface ResultRow { Success: number | boolean; Message?: string }
interface LocalAccessRow extends ResultRow {
  id_usuario_sistema?: number; user_logon?: string; user_fullname?: string | null;
  user_email?: string | null; id_rol?: number; rol_codigo?: string; rol?: string;
}
interface PermissionRow { permiso: string; nombre_permiso: string; modulo: string }

@Injectable()
export class AuthRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async authenticateCorporate(username: string, password: string): Promise<ResultRow> {
    const authMode = this.config.get('AUTH_MODE');
    if (authMode === 'LOCAL_TEST') {
      // En modo LOCAL_TEST para entornos de desarrollo aislados sin conectividad a 10.10.1.3
      const request = await this.database.request();
      request.input('Usuario', VarChar(100), username);
      const userCheck = await request.query<{ id_usuario_sistema: number }>(`
        SELECT id_usuario_sistema FROM dbo.usuarios_sistema WHERE user_logon = @Usuario AND user_estado_erp = 0
      `);
      if (userCheck.recordset.length > 0) {
        return { Success: 1 };
      }
      return { Success: 0 };
    }

    // Modo oficial ERP: consulta linked server DB_GP_Trabajos_TEST -> vw_ERP_Usuarios (10.10.1.3 / MAA001020)
    const request = await this.database.request();
    request.input('Usuario', VarChar(50), username);
    request.input('Contrasena', VarChar(255), password);
    const result = await request.query<ResultRow>(`
      SELECT CASE WHEN EXISTS (
        SELECT 1
        FROM [DB_GP_Trabajos_TEST].[dbo].[vw_ERP_Usuarios]
        WHERE User_Logon = @Usuario
          AND User_Estado = '0'
          AND CONVERT(VARCHAR(15), User_PassBin) = @Contrasena
      ) THEN 1 ELSE 0 END AS Success
    `);
    return result.recordset[0] ?? { Success: 0 };
  }

  async authorizeLocal(username: string): Promise<LocalAccessRow> {
    const request = await this.database.request();
    request.input('Usuario', VarChar(100), username);
    const result = await request.execute<LocalAccessRow>('dbo.sp_validar_acceso_sistema');
    return result.recordset[0] ?? { Success: 0 };
  }

  async isRoleActive(roleId: number): Promise<boolean> {
    const request = await this.database.request();
    request.input('idRol', Int, roleId);
    const result = await request.query<{ estado: boolean | number }>('SELECT estado FROM dbo.roles WHERE id_rol = @idRol');
    return result.recordset[0]?.estado === true || result.recordset[0]?.estado === 1;
  }

  async findEffectiveUser(userId: number): Promise<AuthUser | null> {
    const request = await this.database.request();
    request.input('idUsuario', Int, userId);
    request.input('activoErp', Int, 0);
    request.input('habilitado', Bit, 1);
    const result = await request.query<{ id_usuario_sistema: number; user_logon: string; user_fullname: string | null; user_email: string | null; rol_codigo: string }>(
      `SELECT U.id_usuario_sistema, U.user_logon, U.user_fullname, U.user_email, R.codigo AS rol_codigo
       FROM dbo.usuarios_sistema U
       INNER JOIN dbo.roles R ON R.id_rol = U.id_rol AND R.estado = @habilitado
       WHERE U.id_usuario_sistema = @idUsuario AND U.user_estado_erp = @activoErp
         AND U.permitir_acceso = @habilitado AND U.estado_local = @habilitado`,
    );
    const row = result.recordset[0];
    if (!row) return null;
    return { id: row.id_usuario_sistema, username: row.user_logon, name: row.user_fullname ?? row.user_logon,
      email: row.user_email, role: row.rol_codigo, permissions: await this.findPermissions(row.id_usuario_sistema) };
  }

  async findPermissions(userId: number): Promise<Permission[]> {
    const request = await this.database.request();
    request.input('idUsuario', Int, userId);
    const result = await request.query<PermissionRow>(`SELECT permiso, nombre_permiso, modulo
      FROM dbo.vw_usuarios_permisos WHERE id_usuario_sistema = @idUsuario ORDER BY modulo, permiso`);
    return result.recordset.map(row => ({ code: row.permiso, name: row.nombre_permiso, module: row.modulo }));
  }
}
