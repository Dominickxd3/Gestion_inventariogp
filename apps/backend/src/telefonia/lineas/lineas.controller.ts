import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthUser } from '../../auth/auth.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { CreateLineaDto } from '../dto/create-linea.dto';
import { QueryLineasDto } from '../dto/query-lineas.dto';
import { UpdateLineaDto } from '../dto/update-linea.dto';
import { RelacionesService } from '../relaciones/relaciones.service';
import { AsignarResponsableDto } from '../dto/asignar-responsable.dto';
import { CambiarResponsableDto } from '../dto/cambiar-responsable.dto';
import { LiberarResponsableDto } from '../dto/liberar-responsable.dto';
import { AsociarCelularDto } from '../dto/asociar-celular.dto';
import { RetirarCelularDto } from '../dto/retirar-celular.dto';
import { LineasService } from './lineas.service';

@Controller('telefonia') @UseGuards(JwtAuthGuard, PermissionsGuard)
export class LineasController {
  constructor(
    private readonly lineas: LineasService,
    private readonly relaciones: RelacionesService,
  ) {}

  // ─── LÍNEAS ───────────────────────────────────────────────────────────────
  @Get('lineas') @Permissions('LINEAS_VER')
  list(@Query() q: QueryLineasDto) { return this.lineas.list(q); }

  @Get('equipos-disponibles') @Permissions('LINEAS_VER')
  equiposDisponibles(@Query('search') search?: string) { return this.lineas.equiposDisponibles(search); }

  @Get('lineas/:id') @Permissions('LINEAS_VER')
  detail(@Param('id', ParseIntPipe) id: number) { return this.lineas.detail(id); }

  @Post('lineas') @Permissions('LINEAS_EDITAR')
  create(@Body() d: CreateLineaDto, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.lineas.create(d, req.user.id, req.ip);
  }

  @Patch('lineas/:id') @Permissions('LINEAS_EDITAR')
  update(@Param('id', ParseIntPipe) id: number, @Body() d: UpdateLineaDto, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.lineas.update(id, d, req.user.id, req.ip);
  }

  // ─── RESPONSABLE ──────────────────────────────────────────────────────────
  @Post('lineas/:id/responsable') @Permissions('LINEAS_EDITAR')
  asignarResponsable(@Param('id', ParseIntPipe) id: number, @Body() d: AsignarResponsableDto, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.relaciones.asignarResponsable(id, d, req.user.id, req.ip);
  }

  @Post('lineas/:id/cambiar-responsable') @Permissions('LINEAS_EDITAR')
  cambiarResponsable(@Param('id', ParseIntPipe) id: number, @Body() d: CambiarResponsableDto, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.relaciones.cambiarResponsable(id, d, req.user.id, req.ip);
  }

  @Post('lineas/:id/liberar-responsable') @Permissions('LINEAS_EDITAR')
  liberarResponsable(@Param('id', ParseIntPipe) id: number, @Body() d: LiberarResponsableDto, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.relaciones.liberarResponsable(id, d, req.user.id, req.ip);
  }

  // ─── EQUIPO ───────────────────────────────────────────────────────────────
  @Post('lineas/:id/equipo') @Permissions('LINEAS_EDITAR')
  asociarEquipo(@Param('id', ParseIntPipe) id: number, @Body() d: AsociarCelularDto, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.relaciones.asociarEquipo(id, d, req.user.id, req.ip);
  }

  @Post('lineas/:id/cambiar-equipo') @Permissions('LINEAS_EDITAR')
  cambiarEquipo(@Param('id', ParseIntPipe) id: number, @Body() d: AsociarCelularDto, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.relaciones.cambiarEquipo(id, d, req.user.id, req.ip);
  }

  @Post('lineas/:id/retirar-equipo') @Permissions('LINEAS_EDITAR')
  retirarEquipo(@Param('id', ParseIntPipe) id: number, @Body() d: RetirarCelularDto, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.relaciones.retirarEquipo(id, d, req.user.id, req.ip);
  }
}
