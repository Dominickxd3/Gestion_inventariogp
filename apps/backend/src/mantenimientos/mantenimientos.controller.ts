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
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreateMantenimientoDto } from './dto/create-mantenimiento.dto';
import { FinalizarMantenimientoDto } from './dto/finalizar-mantenimiento.dto';
import { QueryMantenimientosDto } from './dto/query-mantenimientos.dto';
import { UpdateMantenimientoDto } from './dto/update-mantenimiento.dto';
import { MantenimientosService } from './mantenimientos.service';

@Controller('mantenimientos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MantenimientosController {
  constructor(private readonly service: MantenimientosService) {}

  @Get()
  @Permissions('MANTENIMIENTO_VER')
  list(@Query() q: QueryMantenimientosDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @Permissions('MANTENIMIENTO_VER')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  @Post()
  @Permissions('MANTENIMIENTO_EDITAR')
  create(
    @Body() dto: CreateMantenimientoDto,
    @Req() req: FastifyRequest & { user: AuthUser }
  ) {
    return this.service.create(dto, req.user.id, req.ip);
  }

  @Patch(':id')
  @Permissions('MANTENIMIENTO_EDITAR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMantenimientoDto,
    @Req() req: FastifyRequest & { user: AuthUser }
  ) {
    return this.service.update(id, dto, req.user.id, req.ip);
  }

  @Post(':id/finalizar')
  @Permissions('MANTENIMIENTO_EDITAR')
  finalizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinalizarMantenimientoDto,
    @Req() req: FastifyRequest & { user: AuthUser }
  ) {
    return this.service.finalizar(id, dto, req.user.id, req.ip);
  }
}
