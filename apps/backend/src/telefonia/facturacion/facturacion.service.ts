import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { QueryFacturaDetalleDto } from './dto/query-factura-detalle.dto';
import { QueryFacturasDto } from './dto/query-facturas.dto';
import { UpdateDetalleEstadoDto } from './dto/update-detalle-estado.dto';
import { FacturacionRepository } from './facturacion.repository';

@Injectable()
export class FacturacionService {
  constructor(private readonly repo: FacturacionRepository) {}

  list(q: QueryFacturasDto) {
    return this.repo.list(q);
  }

  async detail(id: number) {
    const x = await this.repo.detail(id);
    if (!x) throw new NotFoundException('Factura de telefonía no encontrada.');
    return x;
  }

  async create(d: CreateFacturaDto, userId: number, ip: string) {
    try {
      return await this.repo.create(d, userId, ip);
    } catch (e: unknown) {
      const x = e as { code?: string; message?: string; number?: number };
      if (x.code === 'OPERADOR_NO_ENCONTRADO') {
        throw new NotFoundException('El operador móvil no existe o no está activo.');
      }
      if (x.code === 'FACTURA_DUPLICADA') {
        throw new ConflictException('Ya existe una factura registrada con ese número para el operador.');
      }
      if (x.code === 'DETALLE_LINEAS_DUPLICADAS') {
        throw new BadRequestException(x.message || 'El detalle contiene líneas repetidas.');
      }
      if (x.number === 547) {
        throw new BadRequestException('Error de validación de periodo (fecha fin debe ser mayor o igual a fecha inicio).');
      }
      throw e;
    }
  }

  async listDetalle(idFactura: number, q: QueryFacturaDetalleDto) {
    await this.detail(idFactura);
    return this.repo.listDetalle(idFactura, q);
  }

  async updateDetalleEstado(
    idFactura: number,
    idDetalle: number,
    d: UpdateDetalleEstadoDto,
    userId: number,
    ip: string,
  ) {
    try {
      return await this.repo.updateDetalleEstado(idFactura, idDetalle, d, userId, ip);
    } catch (e: unknown) {
      const x = e as { code?: string };
      if (x.code === 'FACTURA_NO_ENCONTRADA') throw new NotFoundException('Factura no encontrada.');
      if (x.code === 'FACTURA_CERRADA') throw new BadRequestException('No se pueden modificar detalles de una factura cerrada.');
      if (x.code === 'DETALLE_NO_ENCONTRADO') throw new NotFoundException('Detalle de factura no encontrado.');
      if (x.code === 'LINEA_NO_ENCONTRADA') throw new NotFoundException('La línea móvil a vincular no existe.');
      throw e;
    }
  }

  async cerrar(idFactura: number, motivo: string | undefined, userId: number, ip: string) {
    try {
      return await this.repo.cerrar(idFactura, motivo, userId, ip);
    } catch (e: unknown) {
      const x = e as { code?: string; message?: string };
      if (x.code === 'FACTURA_NO_ENCONTRADA') throw new NotFoundException('Factura no encontrada.');
      if (x.code === 'FACTURA_YA_CERRADA') throw new BadRequestException('La factura ya se encuentra cerrada.');
      if (x.code === 'CIERRE_REQUERIDO_JUSTIFICACION') throw new BadRequestException(x.message);
      throw e;
    }
  }

  async vincularCuota(idFactura: number, idCuota: number, userId: number, ip: string) {
    try {
      return await this.repo.vincularCuota(idFactura, idCuota, userId, ip);
    } catch (e: unknown) {
      const x = e as { code?: string };
      if (x.code === 'FACTURA_NO_ENCONTRADA') throw new NotFoundException('Factura no encontrada.');
      if (x.code === 'FACTURA_CERRADA') throw new BadRequestException('No se pueden vincular cuotas a una factura cerrada.');
      if (x.code === 'CUOTA_NO_ENCONTRADA') throw new NotFoundException('Cuota de financiamiento no encontrada.');
      if (x.code === 'CUOTA_YA_VINCULADA_OTRA_FACTURA') {
        throw new ConflictException('La cuota de financiamiento ya se encuentra vinculada a otra factura.');
      }
      throw e;
    }
  }
}
