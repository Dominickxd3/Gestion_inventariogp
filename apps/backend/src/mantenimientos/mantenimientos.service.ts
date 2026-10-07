import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMantenimientoDto } from './dto/create-mantenimiento.dto';
import { FinalizarMantenimientoDto } from './dto/finalizar-mantenimiento.dto';
import { QueryMantenimientosDto } from './dto/query-mantenimientos.dto';
import { UpdateMantenimientoDto } from './dto/update-mantenimiento.dto';
import { MantenimientosRepository } from './mantenimientos.repository';

@Injectable()
export class MantenimientosService {
  constructor(private readonly repo: MantenimientosRepository) {}

  async list(q: QueryMantenimientosDto) {
    return this.repo.list(q);
  }

  async detail(id: number) {
    const item = await this.repo.detail(id);
    if (!item) {
      throw new NotFoundException(`Mantenimiento #${id} no encontrado.`);
    }
    return item;
  }

  async historyByAsset(idActivo: number) {
    if (!idActivo || idActivo <= 0) {
      throw new BadRequestException('ID de activo inválido.');
    }
    return this.repo.historyByAsset(idActivo);
  }

  async create(dto: CreateMantenimientoDto, userId: number, ip: string) {
    if (dto.costo !== undefined && dto.costo < 0) {
      throw new BadRequestException('El costo no puede ser negativo.');
    }
    try {
      return await this.repo.create(dto, userId, ip);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg === 'ACTIVO_NOT_FOUND') {
        throw new NotFoundException(`El activo #${dto.idActivo} no existe.`);
      }
      if (msg === 'ACTIVO_DE_BAJA') {
        throw new BadRequestException('No se puede registrar mantenimiento para un activo dado de baja.');
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateMantenimientoDto, userId: number, ip: string) {
    if (dto.costo !== undefined && dto.costo < 0) {
      throw new BadRequestException('El costo no puede ser negativo.');
    }
    try {
      return await this.repo.update(id, dto, userId, ip);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg === 'MANTENIMIENTO_NOT_FOUND') {
        throw new NotFoundException(`Mantenimiento #${id} no encontrado.`);
      }
      if (msg === 'MANTENIMIENTO_CLOSED') {
        throw new ConflictException(`El mantenimiento #${id} ya se encuentra finalizado o cancelado.`);
      }
      throw err;
    }
  }

  async finalizar(id: number, dto: FinalizarMantenimientoDto, userId: number, ip: string) {
    if (dto.costo !== undefined && dto.costo < 0) {
      throw new BadRequestException('El costo no puede ser negativo.');
    }
    try {
      return await this.repo.finalizar(id, dto, userId, ip);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg === 'MANTENIMIENTO_NOT_FOUND') {
        throw new NotFoundException(`Mantenimiento #${id} no encontrado.`);
      }
      if (msg === 'MANTENIMIENTO_ALREADY_FINISHED') {
        throw new ConflictException(`El mantenimiento #${id} ya fue finalizado o cancelado previamente.`);
      }
      throw err;
    }
  }
}
