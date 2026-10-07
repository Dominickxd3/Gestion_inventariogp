import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogosRepository } from './catalogos.repository';
class CatalogQuery { @IsOptional() @Type(()=>Number) @IsInt() @Min(1) idSede?:number; @IsOptional() @Type(()=>Number) @IsInt() @Min(1) idArea?:number; @IsOptional() @Type(()=>Number) @IsInt() @Min(1) idOperador?:number; @IsOptional() @IsString() @MaxLength(200) search?:string; }
@Controller('catalogos') @UseGuards(JwtAuthGuard)
export class CatalogosController {
  constructor(private readonly repo:CatalogosRepository){}
  @Get('tipos-activo') tipos(){return this.repo.tiposActivo();}
  @Get('estados-activo') estados(){return this.repo.estadosActivo();}
  @Get('sedes') sedes(){return this.repo.sedes();}
  @Get('areas') areas(@Query() q:CatalogQuery){return this.repo.areas(q.idSede);}
  @Get('ubicaciones') ubicaciones(@Query() q:CatalogQuery){return this.repo.ubicaciones(q.idSede,q.idArea);}
  @Get('trabajadores') trabajadores(@Query() q:CatalogQuery){return this.repo.trabajadores(q.search,q.idArea);}
  @Get('accesorios') accesorios(@Query() q:CatalogQuery){return this.repo.accesorios(q.search);}
  @Get('operadores-moviles') operadoresMoviles(){return this.repo.operadoresMoviles();}
  @Get('planes-moviles') planesMoviles(@Query() q:CatalogQuery){return this.repo.planesMoviles(q.idOperador);}
}
