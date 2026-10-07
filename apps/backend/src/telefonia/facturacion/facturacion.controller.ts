import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthUser } from '../../auth/auth.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { ConciliacionService } from './conciliacion.service';
import { CerrarFacturaDto } from './dto/cerrar-factura.dto';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { QueryFacturaDetalleDto } from './dto/query-factura-detalle.dto';
import { QueryFacturasDto } from './dto/query-facturas.dto';
import { UpdateDetalleEstadoDto } from './dto/update-detalle-estado.dto';
import { VincularCuotaDto } from './dto/vincular-cuota.dto';
import { FacturacionService } from './facturacion.service';

@Controller('telefonia/facturas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FacturacionController {
  constructor(
    private readonly facturacion: FacturacionService,
    private readonly conciliacion: ConciliacionService,
  ) {}

  @Get()
  @Permissions('LINEAS_VER')
  list(@Query() q: QueryFacturasDto) {
    return this.facturacion.list(q);
  }

  @Get(':id')
  @Permissions('LINEAS_VER')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.facturacion.detail(id);
  }

  @Post()
  @Permissions('LINEAS_CONCILIAR')
  create(@Body() d: CreateFacturaDto, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.facturacion.create(d, req.user.id, req.ip);
  }

  @Get(':id/detalle')
  @Permissions('LINEAS_VER')
  listDetalle(@Param('id', ParseIntPipe) id: number, @Query() q: QueryFacturaDetalleDto) {
    return this.facturacion.listDetalle(id, q);
  }

  @Post(':id/conciliar')
  @Permissions('LINEAS_CONCILIAR')
  conciliar(@Param('id', ParseIntPipe) id: number, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.conciliacion.conciliar(id, req.user.id, req.ip);
  }

  @Get(':id/resumen-conciliacion')
  @Permissions('LINEAS_VER')
  resumenConciliacion(@Param('id', ParseIntPipe) id: number) {
    return this.conciliacion.getResumenConciliacion(id);
  }

  @Patch(':id/detalle/:idDetalle')
  @Permissions('LINEAS_CONCILIAR')
  updateDetalleEstado(
    @Param('id', ParseIntPipe) id: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() d: UpdateDetalleEstadoDto,
    @Req() req: FastifyRequest & { user: AuthUser },
  ) {
    return this.facturacion.updateDetalleEstado(id, idDetalle, d, req.user.id, req.ip);
  }

  @Post(':id/cerrar')
  @Permissions('LINEAS_CONCILIAR')
  cerrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() d: CerrarFacturaDto,
    @Req() req: FastifyRequest & { user: AuthUser },
  ) {
    return this.facturacion.cerrar(id, d.motivoCierre, req.user.id, req.ip);
  }

  @Post(':id/cuotas')
  @Permissions('LINEAS_CONCILIAR')
  vincularCuota(
    @Param('id', ParseIntPipe) id: number,
    @Body() d: VincularCuotaDto,
    @Req() req: FastifyRequest & { user: AuthUser },
  ) {
    return this.facturacion.vincularCuota(id, d.idCuota, req.user.id, req.ip);
  }
}
