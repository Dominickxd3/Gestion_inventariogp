import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthUser } from '../auth/auth.types'; import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { Permissions } from '../auth/permissions.decorator'; import { PermissionsGuard } from '../auth/permissions.guard';
import { AsignacionesService } from './asignaciones.service'; import { CreateAsignacionDto } from './dto/create-asignacion.dto'; import { DevolverAsignacionDto } from './dto/devolver-asignacion.dto'; import { QueryAsignacionesDto } from './dto/query-asignaciones.dto';
@Controller('asignaciones') @UseGuards(JwtAuthGuard,PermissionsGuard)
export class AsignacionesController { constructor(private readonly service:AsignacionesService){}
  @Get() @Permissions('ASIGNACIONES_VER') list(@Query()q:QueryAsignacionesDto){return this.service.list(q);}
  @Get('activos-disponibles') @Permissions('ASIGNACIONES_CREAR') available(@Query('search')search?:string){return this.service.availableAssets(search?.slice(0,200));}
  @Get(':id') @Permissions('ASIGNACIONES_VER') detail(@Param('id',ParseIntPipe)id:number){return this.service.detail(id);}
  @Post() @Permissions('ASIGNACIONES_CREAR') create(@Body()d:CreateAsignacionDto,@Req()req:FastifyRequest&{user:AuthUser}){return this.service.create(d,req.user.id,req.ip);}
  @Post(':id/devolucion') @Permissions('ASIGNACIONES_DEVOLVER') devolucion(@Param('id',ParseIntPipe)id:number,@Body()d:DevolverAsignacionDto,@Req()req:FastifyRequest&{user:AuthUser}){return this.service.returnAssignment(id,d,req.user.id,req.ip);}
}
