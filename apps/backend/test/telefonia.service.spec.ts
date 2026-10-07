import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { LineasRepository } from '../src/telefonia/lineas/lineas.repository';
import { LineasService } from '../src/telefonia/lineas/lineas.service';
import { RelacionesRepository } from '../src/telefonia/relaciones/relaciones.repository';
import { RelacionesService } from '../src/telefonia/relaciones/relaciones.service';
import { FinanciamientosRepository } from '../src/telefonia/financiamientos/financiamientos.repository';
import { FinanciamientosService } from '../src/telefonia/financiamientos/financiamientos.service';

describe('Telefonia Services', () => {
  describe('LineasService', () => {
    const repo = {
      list: jest.fn(),
      equiposDisponibles: jest.fn(),
      detail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const service = new LineasService(repo as unknown as LineasRepository);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('delega listado y búsqueda de equipos', async () => {
      repo.list.mockResolvedValue({ items: [], total: 0 });
      repo.equiposDisponibles.mockResolvedValue([]);
      await service.list({ page: 1, pageSize: 20, sortBy: 'numero', sortDirection: 'asc' });
      await service.equiposDisponibles('Samsung');
      expect(repo.list).toHaveBeenCalledWith({ page: 1, pageSize: 20, sortBy: 'numero', sortDirection: 'asc' });
      expect(repo.equiposDisponibles).toHaveBeenCalledWith('Samsung');
    });

    it('lanza NotFoundException si la línea no existe', async () => {
      repo.detail.mockResolvedValue(null);
      await expect(service.detail(999)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('crea línea delegando al repositorio', async () => {
      repo.create.mockResolvedValue({ idLinea: 1, numero: '999888777' });
      const result = await service.create({ numero: '999888777', idOperador: 1 }, 1, '127.0.0.1');
      expect(result).toEqual({ idLinea: 1, numero: '999888777' });
    });

    it('traduce error PLAN_OPERADOR_MISMATCH a BadRequestException', async () => {
      repo.create.mockRejectedValue({ code: 'PLAN_OPERADOR_MISMATCH' });
      await expect(service.create({ numero: '999888777', idOperador: 1, idPlan: 5 }, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('traduce número duplicado (2601) a ConflictException', async () => {
      repo.create.mockRejectedValue({ number: 2601 });
      await expect(service.create({ numero: '999888777', idOperador: 1 }, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('actualiza línea tras validar existencia', async () => {
      repo.detail.mockResolvedValue({ idLinea: 1 });
      repo.update.mockResolvedValue({ idLinea: 1, observaciones: 'Actualizado' });
      const res = await service.update(1, { observaciones: 'Actualizado' }, 1, '127.0.0.1');
      expect(res).toEqual({ idLinea: 1, observaciones: 'Actualizado' });
    });
  });

  describe('RelacionesService', () => {
    const repo = {
      asignarResponsable: jest.fn(),
      cambiarResponsable: jest.fn(),
      liberarResponsable: jest.fn(),
      asociarEquipo: jest.fn(),
      cambiarEquipo: jest.fn(),
      retirarEquipo: jest.fn(),
    };
    const service = new RelacionesService(repo as unknown as RelacionesRepository);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('asigna responsable correctamente', async () => {
      repo.asignarResponsable.mockResolvedValue({ idAsignacionLinea: 1 });
      const res = await service.asignarResponsable(1, { idTrabajador: 10 }, 1, '127.0.0.1');
      expect(res).toEqual({ idAsignacionLinea: 1 });
    });

    it('lanza ConflictException si ya tiene responsable', async () => {
      repo.asignarResponsable.mockRejectedValue({ code: 'ALREADY_HAS_RESPONSABLE' });
      await expect(service.asignarResponsable(1, { idTrabajador: 10 }, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('lanza BadRequestException si el trabajador está inactivo', async () => {
      repo.asignarResponsable.mockRejectedValue({ code: 'TRABAJADOR_INACTIVE' });
      await expect(service.asignarResponsable(1, { idTrabajador: 10 }, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza ConflictException si no tiene responsable al liberar', async () => {
      repo.liberarResponsable.mockRejectedValue({ code: 'NO_RESPONSABLE' });
      await expect(service.liberarResponsable(1, {}, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('asocia equipo correctamente', async () => {
      repo.asociarEquipo.mockResolvedValue({ idHistorial: 1 });
      const res = await service.asociarEquipo(1, { idActivo: 5 }, 1, '127.0.0.1');
      expect(res).toEqual({ idHistorial: 1 });
    });

    it('lanza BadRequestException si el activo no es celular', async () => {
      repo.asociarEquipo.mockRejectedValue({ code: 'NOT_CELULAR' });
      await expect(service.asociarEquipo(1, { idActivo: 5 }, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza ConflictException si el equipo ya está en otra línea', async () => {
      repo.asociarEquipo.mockRejectedValue({ code: 'EQUIPO_ALREADY_IN_LINEA' });
      await expect(service.asociarEquipo(1, { idActivo: 5 }, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('FinanciamientosService', () => {
    const repo = {
      list: jest.fn(),
      detail: jest.fn(),
      create: jest.fn(),
    };
    const service = new FinanciamientosService(repo as unknown as FinanciamientosRepository);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('delega listado y detalle', async () => {
      repo.list.mockResolvedValue({ items: [], total: 0 });
      repo.detail.mockResolvedValue({ idFinanciamiento: 1 });
      await service.list({ page: 1, pageSize: 20 });
      const detail = await service.detail(1);
      expect(repo.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
      expect(detail).toEqual({ idFinanciamiento: 1 });
    });

    it('lanza NotFoundException si no existe detalle', async () => {
      repo.detail.mockResolvedValue(null);
      await expect(service.detail(999)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza BadRequestException si no es celular', async () => {
      repo.create.mockRejectedValue({ code: 'NOT_CELULAR' });
      await expect(service.create({ idActivo: 1, idOperador: 1, fechaInicio: '2026-01-01', cantidadCuotas: 12, montoCuota: 100, montoTotal: 1200 }, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
