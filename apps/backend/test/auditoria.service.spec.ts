import { NotFoundException } from '@nestjs/common';
import { AuditoriaService } from '../src/auditoria/auditoria.service';
import { AuditoriaRepository, AuditoriaListItem, AuditoriaDetail } from '../src/auditoria/auditoria.repository';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let repository: jest.Mocked<AuditoriaRepository>;

  const mockItem: AuditoriaListItem = {
    id: '1001',
    idUsuario: 1,
    usuarioLogon: 'admin.user',
    usuarioNombre: 'Admin',
    modulo: 'SEGURIDAD',
    accion: 'USUARIO_ACCESO_EDITAR',
    tablaAfectada: 'usuarios_sistema',
    registroId: '2',
    direccionIp: '127.0.0.1',
    fecha: new Date(),
  };

  const mockDetail: AuditoriaDetail = {
    ...mockItem,
    datosAnteriores: { permitir_acceso: true },
    datosNuevos: { permitir_acceso: false },
  };

  beforeEach(() => {
    repository = {
      findAuditoria: jest.fn(),
      findAuditoriaById: jest.fn(),
    } as unknown as jest.Mocked<AuditoriaRepository>;

    service = new AuditoriaService(repository);
  });

  it('debe listar registros de auditoría con paginación', async () => {
    repository.findAuditoria.mockResolvedValue({ items: [mockItem], total: 1 });

    const result = await service.list({ page: 1, pageSize: 20, sortBy: 'fecha', sortDirection: 'DESC' });

    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toEqual(1);
    expect(result.pagination.totalPages).toEqual(1);
  });

  it('debe retornar detalle de auditoría con snapshots JSON estructurados', async () => {
    repository.findAuditoriaById.mockResolvedValue(mockDetail);

    const result = await service.getById('1001');

    expect(result.id).toEqual('1001');
    expect(result.accion).toEqual('USUARIO_ACCESO_EDITAR');
    expect(result.datosAnteriores).toEqual({ permitir_acceso: true });
    expect(result.datosNuevos).toEqual({ permitir_acceso: false });
  });

  it('debe lanzar NotFoundException si el ID de auditoría no existe', async () => {
    repository.findAuditoriaById.mockResolvedValue(null);

    await expect(service.getById('999999')).rejects.toThrow(NotFoundException);
  });
});
