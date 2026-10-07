import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthUser } from '../../auth/auth.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { CrearFinanciamientoDto } from '../dto/crear-financiamiento.dto';
import { QueryFinanciamientosDto } from '../dto/query-financiamientos.dto';
import { FinanciamientosService } from './financiamientos.service';

@Controller('telefonia/financiamientos') @UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanciamientosController {
  constructor(private readonly service: FinanciamientosService) {}

  @Get() @Permissions('LINEAS_VER')
  list(@Query() q: QueryFinanciamientosDto) { return this.service.list(q); }

  @Get(':id') @Permissions('LINEAS_VER')
  detail(@Param('id', ParseIntPipe) id: number) { return this.service.detail(id); }

  @Post() @Permissions('LINEAS_EDITAR')
  create(@Body() d: CrearFinanciamientoDto, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.service.create(d, req.user.id, req.ip);
  }
}
