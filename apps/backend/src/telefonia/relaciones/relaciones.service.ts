import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AsignarResponsableDto } from '../dto/asignar-responsable.dto';
import { AsociarCelularDto } from '../dto/asociar-celular.dto';
import { CambiarResponsableDto } from '../dto/cambiar-responsable.dto';
import { LiberarResponsableDto } from '../dto/liberar-responsable.dto';
import { RetirarCelularDto } from '../dto/retirar-celular.dto';
import { RelacionesRepository } from './relaciones.repository';

@Injectable()
export class RelacionesService {
  constructor(private readonly repo: RelacionesRepository) {}

  async asignarResponsable(idLinea: number, d: AsignarResponsableDto, userId: number, ip: string) {
    try { return await this.repo.asignarResponsable(idLinea, d, userId, ip); }
    catch (e) { return this.mapResponsable(e); }
  }

  async cambiarResponsable(idLinea: number, d: CambiarResponsableDto, userId: number, ip: string) {
    try { return await this.repo.cambiarResponsable(idLinea, d, userId, ip); }
    catch (e) { return this.mapResponsable(e); }
  }

  async liberarResponsable(idLinea: number, d: LiberarResponsableDto, userId: number, ip: string) {
    try { return await this.repo.liberarResponsable(idLinea, d, userId, ip); }
    catch (e) { return this.mapResponsable(e); }
  }

  async asociarEquipo(idLinea: number, d: AsociarCelularDto, userId: number, ip: string) {
    try { return await this.repo.asociarEquipo(idLinea, d, userId, ip); }
    catch (e) { return this.mapEquipo(e); }
  }

  async cambiarEquipo(idLinea: number, d: AsociarCelularDto, userId: number, ip: string) {
    try { return await this.repo.cambiarEquipo(idLinea, d, userId, ip); }
    catch (e) { return this.mapEquipo(e); }
  }

  async retirarEquipo(idLinea: number, d: RetirarCelularDto, userId: number, ip: string) {
    try { return await this.repo.retirarEquipo(idLinea, d, userId, ip); }
    catch (e) { return this.mapEquipo(e); }
  }

  private mapResponsable(e: unknown): never {
    const x = e as { code?: string; number?: number };
    if (x.code === 'ALREADY_HAS_RESPONSABLE') throw new ConflictException('La línea ya tiene un responsable vigente.');
    if (x.code === 'NO_RESPONSABLE')           throw new ConflictException('La línea no tiene responsable vigente.');
    if (x.code === 'TRABAJADOR_NOT_FOUND')     throw new NotFoundException('El trabajador no existe.');
    if (x.code === 'TRABAJADOR_INACTIVE')      throw new BadRequestException('El trabajador no está activo.');
    if (x.number === 2601 || x.number === 2627) throw new ConflictException('Conflicto de concurrencia en el responsable.');
    throw e;
  }

  private mapEquipo(e: unknown): never {
    const x = e as { code?: string; number?: number };
    if (x.code === 'ACTIVO_NOT_FOUND')          throw new NotFoundException('El activo no existe.');
    if (x.code === 'NOT_CELULAR')               throw new BadRequestException('El activo no es de tipo CELULAR.');
    if (x.code === 'LINEA_ALREADY_HAS_EQUIPO')  throw new ConflictException('La línea ya tiene un equipo asociado.');
    if (x.code === 'LINEA_NO_EQUIPO')           throw new ConflictException('La línea no tiene equipo asociado.');
    if (x.code === 'EQUIPO_ALREADY_IN_LINEA')   throw new ConflictException('El equipo ya está asociado a otra línea vigente.');
    if (x.number === 2601 || x.number === 2627)  throw new ConflictException('Conflicto de concurrencia en la asociación.');
    throw e;
  }
}
