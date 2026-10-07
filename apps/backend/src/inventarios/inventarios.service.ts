import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CerrarInventarioDto } from './dto/cerrar-inventario.dto';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { QueryInventarioDetalleDto } from './dto/query-inventario-detalle.dto';
import { QueryInventariosDto } from './dto/query-inventarios.dto';
import { VerificarActivoDto } from './dto/verificar-activo.dto';
import { InventariosRepository } from './inventarios.repository';

@Injectable()
export class InventariosService {
  constructor(private readonly repo: InventariosRepository) {}

  async list(q: QueryInventariosDto) {
    return this.repo.list(q);
  }

  async detail(id: number) {
    const item = await this.repo.detail(id);
    if (!item) {
      throw new NotFoundException(`Inventario #${id} no encontrado.`);
    }
    return item;
  }

  async resumen(id: number) {
    const res = await this.repo.resumen(id);
    if (!res) {
      throw new NotFoundException(`Inventario #${id} no encontrado.`);
    }
    return res;
  }

  async detallePaginado(idInventario: number, q: QueryInventarioDetalleDto) {
    // Check inventario exists
    const inv = await this.repo.detail(idInventario);
    if (!inv) {
      throw new NotFoundException(`Inventario #${idInventario} no encontrado.`);
    }
    return this.repo.detallePaginado(idInventario, q);
  }

  async create(dto: CreateInventarioDto, userId: number, ip: string) {
    try {
      return await this.repo.create(dto, userId, ip);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg === 'SEDE_NOT_FOUND') {
        throw new NotFoundException(`La sede #${dto.idSede} no existe.`);
      }
      throw err;
    }
  }

  /**
   * Reusable asset verification logic, cleanly decoupled from UI forms
   * to allow future transversal QR scanning integration.
   */
  async verificarActivo(
    idInventario: number,
    dto: VerificarActivoDto,
    userId: number,
    ip: string
  ) {
    try {
      return await this.repo.verificarActivo(idInventario, dto, userId, ip);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg === 'INVENTARIO_NOT_FOUND') {
        throw new NotFoundException(`Inventario #${idInventario} no encontrado.`);
      }
      if (msg === 'INVENTARIO_CLOSED') {
        throw new ConflictException(
          `El inventario #${idInventario} se encuentra cerrado o cancelado y no admite verificaciones.`
        );
      }
      if (msg === 'ACTIVO_NOT_FOUND') {
        throw new NotFoundException(`El activo #${dto.idActivo} no existe en el sistema.`);
      }
      if (msg === 'ACTIVO_ALREADY_VERIFIED') {
        throw new ConflictException(
          `El activo #${dto.idActivo} ya fue verificado previamente en esta campaña de inventario.`
        );
      }
      throw err;
    }
  }

  async cerrar(
    idInventario: number,
    dto: CerrarInventarioDto,
    userId: number,
    ip: string
  ) {
    try {
      return await this.repo.cerrar(idInventario, dto, userId, ip);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg === 'INVENTARIO_NOT_FOUND') {
        throw new NotFoundException(`Inventario #${idInventario} no encontrado.`);
      }
      if (msg === 'INVENTARIO_ALREADY_CLOSED') {
        throw new ConflictException(`El inventario #${idInventario} ya se encuentra finalizado.`);
      }
      if (msg === 'INVENTARIO_CANCELLED') {
        throw new ConflictException(`El inventario #${idInventario} está cancelado.`);
      }
      if (msg?.startsWith('INVENTARIO_HAS_PENDING:')) {
        const count = msg.split(':')[1];
        throw new BadRequestException(
          `Existen ${count} activos pendientes de verificación. Se requiere confirmación explícita y motivo para cerrar el inventario.`
        );
      }
      throw err;
    }
  }
}
