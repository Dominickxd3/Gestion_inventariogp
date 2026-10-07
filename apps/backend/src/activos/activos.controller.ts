import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthUser } from '../auth/auth.types'; import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { Permissions } from '../auth/permissions.decorator'; import { PermissionsGuard } from '../auth/permissions.guard';
import { ActivosService } from './activos.service'; import { CreateActivoDto } from './dto/create-activo.dto'; import { QueryActivosDto } from './dto/query-activos.dto'; import { UpdateActivoDto } from './dto/update-activo.dto';
import { AsignacionesService } from '../asignaciones/asignaciones.service'; import { QueryAsignacionesDto } from '../asignaciones/dto/query-asignaciones.dto';
import { MantenimientosService } from '../mantenimientos/mantenimientos.service';
@Controller('activos') @UseGuards(JwtAuthGuard,PermissionsGuard)
export class ActivosController {
  constructor(
    private readonly service:ActivosService,
    private readonly asignaciones:AsignacionesService,
    private readonly mantenimientos:MantenimientosService
  ){}
  @Get() @Permissions('ACTIVOS_VER') list(@Query() q:QueryActivosDto){return this.service.list(q);}
  @Get(':id') @Permissions('ACTIVOS_VER') detail(@Param('id',ParseIntPipe)id:number){return this.service.detail(id);}
  @Get(':id/asignaciones') @Permissions('ASIGNACIONES_VER') history(@Param('id',ParseIntPipe)id:number,@Query()q:QueryAsignacionesDto){return this.asignaciones.list(q,id);}
  @Get(':id/mantenimientos') @Permissions('MANTENIMIENTO_VER') assetMantenimientos(@Param('id',ParseIntPipe)id:number){return this.mantenimientos.historyByAsset(id);}
  @Post() @Permissions('ACTIVOS_CREAR') create(@Body()d:CreateActivoDto,@Req()req:FastifyRequest&{user:AuthUser}){return this.service.create(d,req.user.id,req.ip);}
  @Patch(':id') @Permissions('ACTIVOS_EDITAR') update(@Param('id',ParseIntPipe)id:number,@Body()d:UpdateActivoDto,@Req()req:FastifyRequest&{user:AuthUser}){return this.service.update(id,d,req.user.id,req.ip);}
}
