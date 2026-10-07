import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AdminRepository, UsuarioListItem, UsuarioDetail, RolItem, PermisoItem } from './admin.repository';
import { QueryUsuariosDto } from './dto/query-usuarios.dto';
import { UpdateUsuarioAccesoDto } from './dto/update-usuario-acceso.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly logger: PinoLogger,
  ) {}

  async listUsuarios(q: QueryUsuariosDto): Promise<{
    items: UsuarioListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const { items, total } = await this.repository.findUsuarios(q);
    const totalPages = total > 0 ? Math.ceil(total / q.pageSize) : 0;
    return {
      items,
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages,
      },
    };
  }

  async getUsuario(id: number): Promise<UsuarioDetail> {
    const user = await this.repository.findUsuarioById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async updateUsuarioAcceso(
    targetUserId: number,
    dto: UpdateUsuarioAccesoDto,
    currentUserId: number,
    ip: string,
  ): Promise<UsuarioDetail> {
    const current = await this.repository.findUsuarioById(targetUserId);
    if (!current) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isSelf = targetUserId === currentUserId;

    // Regla de Protección contra Auto-Bloqueo
    if (isSelf) {
      if (dto.permitir_acceso === false) {
        throw new ForbiddenException('No puede revocar su propio acceso al sistema');
      }
      if (dto.estado_local === false) {
        throw new ForbiddenException('No puede deshabilitar su propia cuenta local');
      }
      if (dto.id_rol !== undefined && dto.id_rol !== current.idRol && current.rolCodigo === 'ADMIN') {
        throw new ForbiddenException('No puede revocar su propio rol de Administrador');
      }
    }

    // Si el usuario target es ADMIN y se le intenta quitar acceso o cambiar rol
    const isTargetAdmin = current.rolCodigo === 'ADMIN';
    const removingAccess =
      dto.permitir_acceso === false ||
      dto.estado_local === false ||
      (dto.id_rol !== undefined && dto.id_rol !== current.idRol);

    if (isTargetAdmin && removingAccess) {
      const activeAdmins = await this.repository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new BadRequestException(
          'Operación rechazada: no se puede inhabilitar ni cambiar de rol al único Administrador activo del sistema',
        );
      }
    }

    // Validar nuevo rol si se suministró
    if (dto.id_rol !== undefined && dto.id_rol !== current.idRol) {
      const rol = await this.repository.findRolById(dto.id_rol);
      if (!rol || !rol.estado) {
        throw new BadRequestException('El rol especificado no existe o no está activo');
      }
    }

    // Snapshot anterior para auditoría
    const beforeSnapshot = {
      permitir_acceso: current.permitirAcceso,
      estado_local: current.estadoLocal,
      id_rol: current.idRol,
      rol_codigo: current.rolCodigo,
      observaciones: current.observaciones,
    };

    await this.repository.updateUsuarioAcceso(targetUserId, dto);

    const updated = await this.repository.findUsuarioById(targetUserId);
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado tras actualización');
    }

    const afterSnapshot = {
      permitir_acceso: updated.permitirAcceso,
      estado_local: updated.estadoLocal,
      id_rol: updated.idRol,
      rol_codigo: updated.rolCodigo,
      observaciones: updated.observaciones,
    };

    const action = dto.id_rol !== undefined && dto.id_rol !== current.idRol
      ? 'USUARIO_ROL_EDITAR'
      : 'USUARIO_ACCESO_EDITAR';

    await this.repository.audit(
      currentUserId,
      action,
      String(targetUserId),
      beforeSnapshot,
      afterSnapshot,
      ip,
    );

    this.logger.info(
      { targetUserId, action, currentUserId },
      'Usuario acceso actualizado exitosamente',
    );

    return updated;
  }

  async sincronizarErp(currentUserId: number, ip: string): Promise<{ sincronizados: number }> {
    const res = await this.repository.sincronizarUsuariosErp();

    await this.repository.audit(
      currentUserId,
      'USUARIOS_SINCRONIZAR',
      '0',
      null,
      { totalSincronizados: res.sincronizados },
      ip,
    );

    this.logger.info(
      { sincronizados: res.sincronizados, currentUserId },
      'Sincronización de usuarios ERP completada',
    );

    return res;
  }

  async listRoles(): Promise<RolItem[]> {
    return this.repository.findRoles();
  }

  async listPermisos(): Promise<PermisoItem[]> {
    return this.repository.findPermisos();
  }
}
