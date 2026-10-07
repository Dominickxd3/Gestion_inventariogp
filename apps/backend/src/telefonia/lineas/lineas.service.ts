import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLineaDto } from '../dto/create-linea.dto';
import { QueryLineasDto } from '../dto/query-lineas.dto';
import { UpdateLineaDto } from '../dto/update-linea.dto';
import { LineasRepository } from './lineas.repository';

@Injectable()
export class LineasService {
  constructor(private readonly repo: LineasRepository) {}

  list(q: QueryLineasDto) { return this.repo.list(q); }
  equiposDisponibles(search?: string) { return this.repo.equiposDisponibles(search); }

  async detail(id: number) {
    const x = await this.repo.detail(id);
    if (!x) throw new NotFoundException('Línea no encontrada.');
    return x;
  }

  async create(d: CreateLineaDto, userId: number, ip: string) {
    try {
      return await this.repo.create(d, userId, ip);
    } catch (e) {
      return this.mapError(e);
    }
  }

  async update(id: number, d: UpdateLineaDto, userId: number, ip: string) {
    await this.detail(id);
    try {
      const result = await this.repo.update(id, d, userId, ip);
      if (!result) throw new NotFoundException('Línea no encontrada.');
      return result;
    } catch (e) {
      return this.mapError(e);
    }
  }

  private mapError(e: unknown): never {
    const x = e as { code?: string; number?: number };
    if (x.code === 'PLAN_OPERADOR_MISMATCH') throw new BadRequestException('El plan seleccionado no pertenece al operador de la línea.');
    if (x.number === 2601 || x.number === 2627) throw new ConflictException('Ya existe una línea con ese número.');
    throw e;
  }
}
