import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InventariosRepository } from '../src/inventarios/inventarios.repository';
import { InventariosService } from '../src/inventarios/inventarios.service';
import { CreateInventarioDto } from '../src/inventarios/dto/create-inventario.dto';
import { VerificarActivoDto } from '../src/inventarios/dto/verificar-activo.dto';
import { CerrarInventarioDto } from '../src/inventarios/dto/cerrar-inventario.dto';

describe('InventariosService', () => {
  const repo = {
    list: jest.fn(),
    detail: jest.fn(),
    resumen: jest.fn(),
    detallePaginado: jest.fn(),
    create: jest.fn(),
    verificarActivo: jest.fn(),
    cerrar: jest.fn(),
  };

  const service = new InventariosService(repo as unknown as InventariosRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('delega al repositorio y retorna resultado paginado con progreso', async () => {
      const mockResult = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
      repo.list.mockResolvedValue(mockResult);

      const res = await service.list({ page: 1, pageSize: 20, sortBy: 'id_inventario', sortDirection: 'DESC' });
      expect(res).toEqual(mockResult);
      expect(repo.list).toHaveBeenCalledWith({ page: 1, pageSize: 20, sortBy: 'id_inventario', sortDirection: 'DESC' });
    });
  });

  describe('detail', () => {
    it('retorna el detalle cuando el inventario existe', async () => {
      const mockDetail = { id: 1, nombre: 'Campaña 2026', totalEsperados: 10 };
      repo.detail.mockResolvedValue(mockDetail);

      const res = await service.detail(1);
      expect(res).toEqual(mockDetail);
    });

    it('lanza NotFoundException cuando el inventario no existe', async () => {
      repo.detail.mockResolvedValue(null);
      await expect(service.detail(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('resumen', () => {
    it('retorna el resumen cuando el inventario existe', async () => {
      const mockResumen = { idInventario: 1, totalEsperados: 10, verificados: 5, pendientes: 5 };
      repo.resumen.mockResolvedValue(mockResumen);

      const res = await service.resumen(1);
      expect(res).toEqual(mockResumen);
    });

    it('lanza NotFoundException si no existe el inventario', async () => {
      repo.resumen.mockResolvedValue(null);
      await expect(service.resumen(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('detallePaginado', () => {
    it('delega al repositorio si el inventario existe', async () => {
      repo.detail.mockResolvedValue({ id: 1 });
      const mockDetalle = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
      repo.detallePaginado.mockResolvedValue(mockDetalle);

      const res = await service.detallePaginado(1, { page: 1, pageSize: 20 });
      expect(res).toEqual(mockDetalle);
      expect(repo.detallePaginado).toHaveBeenCalledWith(1, { page: 1, pageSize: 20 });
    });

    it('lanza NotFoundException si el inventario no existe', async () => {
      repo.detail.mockResolvedValue(null);
      await expect(service.detallePaginado(999, { page: 1, pageSize: 20 })).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  describe('create', () => {
    const validDto: CreateInventarioDto = {
      nombre: 'Inventario General Octubre 2026',
      idSede: 1,
    };

    it('crea el inventario y genera el snapshot de activos', async () => {
      repo.create.mockResolvedValue({ id: 1, nombre: validDto.nombre });
      const res = await service.create(validDto, 10, '127.0.0.1');
      expect(res).toBeDefined();
      expect(repo.create).toHaveBeenCalledWith(validDto, 10, '127.0.0.1');
    });

    it('traduce SEDE_NOT_FOUND a NotFoundException (404)', async () => {
      repo.create.mockRejectedValue(new Error('SEDE_NOT_FOUND'));
      await expect(service.create(validDto, 10, '127.0.0.1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('verificarActivo (QR-ready logic)', () => {
    const verifyDto: VerificarActivoDto = {
      idActivo: 5,
      idUbicacionEncontrada: 2,
      estadoVerificacion: 'ENCONTRADO',
      observaciones: 'En perfecto estado',
    };

    it('verifica el activo exitosamente', async () => {
      repo.verificarActivo.mockResolvedValue({ id: 1, idActivo: 5, estadoVerificacion: 'ENCONTRADO' });
      const res = await service.verificarActivo(1, verifyDto, 10, '127.0.0.1');
      expect(res).toBeDefined();
      expect(repo.verificarActivo).toHaveBeenCalledWith(1, verifyDto, 10, '127.0.0.1');
    });

    it('traduce INVENTARIO_NOT_FOUND a NotFoundException (404)', async () => {
      repo.verificarActivo.mockRejectedValue(new Error('INVENTARIO_NOT_FOUND'));
      await expect(service.verificarActivo(1, verifyDto, 10, '127.0.0.1')).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('traduce INVENTARIO_CLOSED a ConflictException (409)', async () => {
      repo.verificarActivo.mockRejectedValue(new Error('INVENTARIO_CLOSED'));
      await expect(service.verificarActivo(1, verifyDto, 10, '127.0.0.1')).rejects.toBeInstanceOf(
        ConflictException
      );
    });

    it('traduce ACTIVO_NOT_FOUND a NotFoundException (404)', async () => {
      repo.verificarActivo.mockRejectedValue(new Error('ACTIVO_NOT_FOUND'));
      await expect(service.verificarActivo(1, verifyDto, 10, '127.0.0.1')).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('traduce ACTIVO_ALREADY_VERIFIED a ConflictException (409)', async () => {
      repo.verificarActivo.mockRejectedValue(new Error('ACTIVO_ALREADY_VERIFIED'));
      await expect(service.verificarActivo(1, verifyDto, 10, '127.0.0.1')).rejects.toBeInstanceOf(
        ConflictException
      );
    });
  });

  describe('cerrar', () => {
    const closeDto: CerrarInventarioDto = {
      motivoCierre: 'Fin de auditoría física',
      confirmarPendientes: true,
    };

    it('cierra el inventario exitosamente', async () => {
      repo.cerrar.mockResolvedValue({ id: 1, estado: 'FINALIZADO' });
      const res = await service.cerrar(1, closeDto, 10, '127.0.0.1');
      expect(res.estado).toBe('FINALIZADO');
      expect(repo.cerrar).toHaveBeenCalledWith(1, closeDto, 10, '127.0.0.1');
    });

    it('traduce INVENTARIO_NOT_FOUND a NotFoundException (404)', async () => {
      repo.cerrar.mockRejectedValue(new Error('INVENTARIO_NOT_FOUND'));
      await expect(service.cerrar(1, closeDto, 10, '127.0.0.1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('traduce INVENTARIO_ALREADY_CLOSED a ConflictException (409)', async () => {
      repo.cerrar.mockRejectedValue(new Error('INVENTARIO_ALREADY_CLOSED'));
      await expect(service.cerrar(1, closeDto, 10, '127.0.0.1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('traduce INVENTARIO_CANCELLED a ConflictException (409)', async () => {
      repo.cerrar.mockRejectedValue(new Error('INVENTARIO_CANCELLED'));
      await expect(service.cerrar(1, closeDto, 10, '127.0.0.1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('traduce INVENTARIO_HAS_PENDING a BadRequestException (400) cuando faltan confirmaciones', async () => {
      repo.cerrar.mockRejectedValue(new Error('INVENTARIO_HAS_PENDING:7'));
      await expect(service.cerrar(1, { confirmarPendientes: false }, 10, '127.0.0.1')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });
});
