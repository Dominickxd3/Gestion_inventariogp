import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AdminService } from '../src/admin/admin.service';
import { AdminRepository, UsuarioDetail, UsuarioListItem } from '../src/admin/admin.repository';

describe('AdminService', () => {
  let service: AdminService;
  let repository: jest.Mocked<AdminRepository>;
  let logger: jest.Mocked<PinoLogger>;

  const mockAdminUser: UsuarioDetail = {
    id: 1,
    userLogon: 'admin.user',
    userFullname: 'Administrador Principal',
    userEmail: 'admin@grupopeuario.com',
    userEstadoErp: 0,
    permitirAcceso: true,
    estadoLocal: true,
    idRol: 1,
    rolCodigo: 'ADMIN',
    rolNombre: 'Administrador',
    rolDescripcion: 'Control total',
    ultimaSincronizacion: new Date(),
    ultimoAcceso: new Date(),
    observaciones: null,
    permisos: [
      { codigo: 'USUARIOS_VER', nombre: 'Ver usuarios', modulo: 'SEGURIDAD' },
      { codigo: 'USUARIOS_EDITAR', nombre: 'Editar usuarios', modulo: 'SEGURIDAD' },
    ],
  };

  const mockNormalUser: UsuarioDetail = {
    id: 2,
    userLogon: 'juan.perez',
    userFullname: 'Juan Perez',
    userEmail: 'juan@grupopeuario.com',
    userEstadoErp: 0,
    permitirAcceso: true,
    estadoLocal: true,
    idRol: 2,
    rolCodigo: 'CONSULTA',
    rolNombre: 'Consulta',
    rolDescripcion: 'Solo lectura',
    ultimaSincronizacion: new Date(),
    ultimoAcceso: new Date(),
    observaciones: null,
    permisos: [{ codigo: 'ACTIVOS_VER', nombre: 'Ver activos', modulo: 'ACTIVOS' }],
  };

  beforeEach(() => {
    repository = {
      findUsuarios: jest.fn(),
      findUsuarioById: jest.fn(),
      countActiveAdmins: jest.fn(),
      findRolById: jest.fn(),
      updateUsuarioAcceso: jest.fn(),
      sincronizarUsuariosErp: jest.fn(),
      findRoles: jest.fn(),
      findPermisos: jest.fn(),
      audit: jest.fn(),
    } as unknown as jest.Mocked<AdminRepository>;

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<PinoLogger>;

    service = new AdminService(repository, logger);
  });

  it('debe listar usuarios con paginación calculada correctamente', async () => {
    const items: UsuarioListItem[] = [
      {
        id: 1,
        userLogon: 'admin.user',
        userFullname: 'Admin',
        userEmail: 'admin@gp.com',
        userEstadoErp: 0,
        permitirAcceso: true,
        estadoLocal: true,
        idRol: 1,
        rolCodigo: 'ADMIN',
        rol: 'Administrador',
        ultimaSincronizacion: new Date(),
        ultimoAcceso: new Date(),
      },
    ];
    repository.findUsuarios.mockResolvedValue({ items, total: 1 });

    const result = await service.listUsuarios({ page: 1, pageSize: 20, sortBy: 'user_logon', sortDirection: 'ASC' });

    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toEqual(1);
    expect(result.pagination.totalPages).toEqual(1);
  });

  it('debe retornar el detalle de usuario con roles y permisos efectivos', async () => {
    repository.findUsuarioById.mockResolvedValue(mockAdminUser);

    const result = await service.getUsuario(1);

    expect(result.userLogon).toEqual('admin.user');
    expect(result.rolCodigo).toEqual('ADMIN');
    expect(result.permisos).toHaveLength(2);
  });

  it('debe actualizar acceso y rol de un usuario normal y auditar la operación', async () => {
    repository.findUsuarioById
      .mockResolvedValueOnce(mockNormalUser)
      .mockResolvedValueOnce({ ...mockNormalUser, permitirAcceso: false });
    repository.findRolById.mockResolvedValue({ id: 2, codigo: 'CONSULTA', nombre: 'Consulta', descripcion: null, estado: true });

    const result = await service.updateUsuarioAcceso(2, { permitir_acceso: false }, 1, '127.0.0.1');

    expect(result.permitirAcceso).toBe(false);
    expect(repository.updateUsuarioAcceso).toHaveBeenCalledWith(2, { permitir_acceso: false });
    expect(repository.audit).toHaveBeenCalledWith(
      1,
      'USUARIO_ACCESO_EDITAR',
      '2',
      expect.any(Object),
      expect.any(Object),
      '127.0.0.1',
    );
  });

  it('debe bloquear que un administrador se quite su propio acceso (auto-bloqueo)', async () => {
    repository.findUsuarioById.mockResolvedValue(mockAdminUser);

    await expect(
      service.updateUsuarioAcceso(1, { permitir_acceso: false }, 1, '127.0.0.1'),
    ).rejects.toThrow(ForbiddenException);

    expect(repository.updateUsuarioAcceso).not.toHaveBeenCalled();
  });

  it('debe bloquear que un administrador desactive su propio estado local', async () => {
    repository.findUsuarioById.mockResolvedValue(mockAdminUser);

    await expect(
      service.updateUsuarioAcceso(1, { estado_local: false }, 1, '127.0.0.1'),
    ).rejects.toThrow(ForbiddenException);

    expect(repository.updateUsuarioAcceso).not.toHaveBeenCalled();
  });

  it('debe bloquear que un administrador cambie su propio rol de ADMIN', async () => {
    repository.findUsuarioById.mockResolvedValue(mockAdminUser);

    await expect(
      service.updateUsuarioAcceso(1, { id_rol: 2 }, 1, '127.0.0.1'),
    ).rejects.toThrow(ForbiddenException);

    expect(repository.updateUsuarioAcceso).not.toHaveBeenCalled();
  });

  it('debe impedir deshabilitar o remover el rol al único ADMIN activo del sistema', async () => {
    const anotherAdmin: UsuarioDetail = { ...mockAdminUser, id: 3, userLogon: 'otro.admin' };
    repository.findUsuarioById.mockResolvedValue(anotherAdmin);
    repository.countActiveAdmins.mockResolvedValue(1); // Solo queda 1 ADMIN activo

    await expect(
      service.updateUsuarioAcceso(3, { permitir_acceso: false }, 1, '127.0.0.1'),
    ).rejects.toThrow(BadRequestException);

    expect(repository.updateUsuarioAcceso).not.toHaveBeenCalled();
  });

  it('debe sincronizar identidades desde el ERP y registrar auditoría', async () => {
    repository.sincronizarUsuariosErp.mockResolvedValue({ sincronizados: 5 });

    const result = await service.sincronizarErp(1, '127.0.0.1');

    expect(result.sincronizados).toEqual(5);
    expect(repository.audit).toHaveBeenCalledWith(
      1,
      'USUARIOS_SINCRONIZAR',
      '0',
      null,
      { totalSincronizados: 5 },
      '127.0.0.1',
    );
  });
});
