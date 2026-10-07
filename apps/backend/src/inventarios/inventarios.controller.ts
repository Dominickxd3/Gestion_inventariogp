import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { CerrarInventarioDto } from './dto/cerrar-inventario.dto';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { QueryInventarioDetalleDto } from './dto/query-inventario-detalle.dto';
import { QueryInventariosDto } from './dto/query-inventarios.dto';
import { VerificarActivoDto } from './dto/verificar-activo.dto';
import { InventariosService } from './inventarios.service';

@Controller('inventarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventariosController {
  constructor(private readonly service: InventariosService) {}

  @Get()
  @Permissions('INVENTARIO_VER')
  list(@Query() q: QueryInventariosDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @Permissions('INVENTARIO_VER')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  @Get(':id/resumen')
  @Permissions('INVENTARIO_VER')
  resumen(@Param('id', ParseIntPipe) id: number) {
    return this.service.resumen(id);
  }

  @Get(':id/detalle')
  @Permissions('INVENTARIO_VER')
  detalle(
    @Param('id', ParseIntPipe) id: number,
    @Query() q: QueryInventarioDetalleDto
  ) {
    return this.service.detallePaginado(id, q);
  }

  @Post()
  @Permissions('INVENTARIO_GESTIONAR')
  create(
    @Body() dto: CreateInventarioDto,
    @Req() req: FastifyRequest & { user: AuthUser }
  ) {
    return this.service.create(dto, req.user.id, req.ip);
  }

  @Post(':id/verificar')
  @Permissions('INVENTARIO_GESTIONAR')
  verificar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerificarActivoDto,
    @Req() req: FastifyRequest & { user: AuthUser }
  ) {
    return this.service.verificarActivo(id, dto, req.user.id, req.ip);
  }

  @Post(':id/cerrar')
  @Permissions('INVENTARIO_GESTIONAR')
  cerrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CerrarInventarioDto,
    @Req() req: FastifyRequest & { user: AuthUser }
  ) {
    return this.service.cerrar(id, dto, req.user.id, req.ip);
  }
}
