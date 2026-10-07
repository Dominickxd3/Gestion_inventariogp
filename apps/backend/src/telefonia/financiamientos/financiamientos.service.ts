import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrearFinanciamientoDto } from '../dto/crear-financiamiento.dto';
import { QueryFinanciamientosDto } from '../dto/query-financiamientos.dto';
import { FinanciamientosRepository } from './financiamientos.repository';

@Injectable()
export class FinanciamientosService {
  constructor(private readonly repo: FinanciamientosRepository) {}

  list(q: QueryFinanciamientosDto) { return this.repo.list(q); }

  async detail(id: number) {
    const x = await this.repo.detail(id);
    if (!x) throw new NotFoundException('Financiamiento no encontrado.');
    return x;
  }

  async create(d: CrearFinanciamientoDto, userId: number, ip: string) {
    try {
      return await this.repo.create(d, userId, ip);
    } catch (e) {
      const x = e as { code?: string };
      if (x.code === 'ACTIVO_NOT_FOUND') throw new NotFoundException('El activo no existe.');
      if (x.code === 'NOT_CELULAR') throw new BadRequestException('El activo no es de tipo CELULAR.');
      throw e;
    }
  }
}
