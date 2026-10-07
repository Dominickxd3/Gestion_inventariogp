import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MantenimientosRepository } from '../src/mantenimientos/mantenimientos.repository';
import { MantenimientosService } from '../src/mantenimientos/mantenimientos.service';
import { CreateMantenimientoDto } from '../src/mantenimientos/dto/create-mantenimiento.dto';
import { UpdateMantenimientoDto } from '../src/mantenimientos/dto/update-mantenimiento.dto';
import { FinalizarMantenimientoDto } from '../src/mantenimientos/dto/finalizar-mantenimiento.dto';

describe('MantenimientosService', () => {
  const repo = {
    list: jest.fn(),
    detail: jest.fn(),
    historyByAsset: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    finalizar: jest.fn(),
  };

  const service = new MantenimientosService(repo as unknown as MantenimientosRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('delega al repositorio y retorna resultado paginado', async () => {
      const mockResult = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
      repo.list.mockResolvedValue(mockResult);

      const res = await service.list({ page: 1, pageSize: 20, sortBy: 'id_mantenimiento', sortDirection: 'DESC' });
      expect(res).toEqual(mockResult);
      expect(repo.list).toHaveBeenCalledWith({ page: 1, pageSize: 20, sortBy: 'id_mantenimiento', sortDirection: 'DESC' });
    });
  });

  describe('detail', () => {
    it('retorna el detalle cuando el mantenimiento existe', async () => {
      const mockDetail = { id: 1, idActivo: 10, tipo: 'CORRECTIVO', estado: 'PENDIENTE' };
      repo.detail.mockResolvedValue(mockDetail);

      const res = await service.detail(1);
      expect(res).toEqual(mockDetail);
    });

    it('lanza NotFoundException cuando el mantenimiento no existe', async () => {
      repo.detail.mockResolvedValue(null);
      await expect(service.detail(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('historyByAsset', () => {
    it('retorna el historial para un activo válido', async () => {
      const mockHistory = [{ id: 1, tipo: 'PREVENTIVO' }];
      repo.historyByAsset.mockResolvedValue(mockHistory);

      const res = await service.historyByAsset(5);
      expect(res).toEqual(mockHistory);
      expect(repo.historyByAsset).toHaveBeenCalledWith(5);
    });

    it('lanza BadRequestException cuando el id del activo es inválido', async () => {
      await expect(service.historyByAsset(0)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.historyByAsset(-1)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('create', () => {
    const validDto: CreateMantenimientoDto = {
      idActivo: 10,
      tipo: 'CORRECTIVO',
      problemaReportado: 'Pantalla no enciende',
      costo: 150.5,
    };

    it('crea el mantenimiento exitosamente', async () => {
      repo.create.mockResolvedValue({ id: 1, ...validDto });
      const res = await service.create(validDto, 5, '127.0.0.1');
      expect(res).toBeDefined();
      expect(repo.create).toHaveBeenCalledWith(validDto, 5, '127.0.0.1');
    });

    it('lanza BadRequestException si el costo es negativo', async () => {
      await expect(service.create({ ...validDto, costo: -10 }, 5, '127.0.0.1')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('traduce ACTIVO_NOT_FOUND a NotFoundException (404)', async () => {
      repo.create.mockRejectedValue(new Error('ACTIVO_NOT_FOUND'));
      await expect(service.create(validDto, 5, '127.0.0.1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('traduce ACTIVO_DE_BAJA a BadRequestException (400)', async () => {
      repo.create.mockRejectedValue(new Error('ACTIVO_DE_BAJA'));
      await expect(service.create(validDto, 5, '127.0.0.1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateMantenimientoDto = {
      problemaReportado: 'Actualizado',
      costo: 200,
    };

    it('actualiza el mantenimiento exitosamente', async () => {
      repo.update.mockResolvedValue({ id: 1, ...updateDto });
      const res = await service.update(1, updateDto, 5, '127.0.0.1');
      expect(res).toBeDefined();
      expect(repo.update).toHaveBeenCalledWith(1, updateDto, 5, '127.0.0.1');
    });

    it('lanza BadRequestException si el costo es negativo', async () => {
      await expect(service.update(1, { costo: -5 }, 5, '127.0.0.1')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('traduce MANTENIMIENTO_NOT_FOUND a NotFoundException', async () => {
      repo.update.mockRejectedValue(new Error('MANTENIMIENTO_NOT_FOUND'));
      await expect(service.update(1, updateDto, 5, '127.0.0.1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('traduce MANTENIMIENTO_CLOSED a ConflictException (409)', async () => {
      repo.update.mockRejectedValue(new Error('MANTENIMIENTO_CLOSED'));
      await expect(service.update(1, updateDto, 5, '127.0.0.1')).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('finalizar', () => {
    const finalizarDto: FinalizarMantenimientoDto = {
      trabajoRealizado: 'Cambio de display',
      costo: 300,
      diagnostico: 'Display quemado',
    };

    it('finaliza el mantenimiento exitosamente', async () => {
      repo.finalizar.mockResolvedValue({ id: 1, estado: 'FINALIZADO' });
      const res = await service.finalizar(1, finalizarDto, 5, '127.0.0.1');
      expect(res.estado).toBe('FINALIZADO');
      expect(repo.finalizar).toHaveBeenCalledWith(1, finalizarDto, 5, '127.0.0.1');
    });

    it('lanza BadRequestException si el costo es negativo', async () => {
      await expect(service.finalizar(1, { costo: -20 }, 5, '127.0.0.1')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('traduce MANTENIMIENTO_NOT_FOUND a NotFoundException', async () => {
      repo.finalizar.mockRejectedValue(new Error('MANTENIMIENTO_NOT_FOUND'));
      await expect(service.finalizar(1, finalizarDto, 5, '127.0.0.1')).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('traduce MANTENIMIENTO_ALREADY_FINISHED a ConflictException (409)', async () => {
      repo.finalizar.mockRejectedValue(new Error('MANTENIMIENTO_ALREADY_FINISHED'));
      await expect(service.finalizar(1, finalizarDto, 5, '127.0.0.1')).rejects.toBeInstanceOf(
        ConflictException
      );
    });
  });
});
