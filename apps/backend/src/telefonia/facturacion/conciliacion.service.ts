import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConciliacionRepository } from './conciliacion.repository';

@Injectable()
export class ConciliacionService {
  constructor(private readonly repo: ConciliacionRepository) {}

  async conciliar(idFactura: number, userId: number, ip: string) {
    try {
      return await this.repo.conciliar(idFactura, userId, ip);
    } catch (e: unknown) {
      const x = e as { code?: string; message?: string };
      if (x.code === 'FACTURA_NO_ENCONTRADA') throw new NotFoundException('Factura de telefonía no encontrada.');
      if (x.code === 'FACTURA_CERRADA') throw new BadRequestException('No se puede conciliar una factura que ya ha sido cerrada.');
      if (x.code === 'FACTURA_SIN_DETALLES') throw new BadRequestException('La factura no contiene líneas de detalle para conciliar.');
      throw e;
    }
  }

  async getResumenConciliacion(idFactura: number) {
    const res = await this.repo.getResumenConciliacion(idFactura);
    if (!res) throw new NotFoundException('Factura de telefonía no encontrada.');
    return res;
  }
}
