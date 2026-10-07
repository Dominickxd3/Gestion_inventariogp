import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryInventarioDetalleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['PENDIENTE', 'ENCONTRADO', 'NO_ENCONTRADO', 'CAMBIO_UBICACION', 'OBSERVADO'])
  estadoVerificacion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idTipo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idArea?: number;
}
