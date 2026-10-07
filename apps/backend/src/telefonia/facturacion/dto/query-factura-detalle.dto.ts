import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QueryFacturaDetalleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => String(value).toUpperCase())
  @IsIn(['PENDIENTE', 'CONFORME', 'OBSERVADO', 'CORREGIDO'])
  estadoConciliacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  diagnostico?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 50;

  @IsOptional()
  @IsIn(['numeroLinea', 'cargoPlan', 'montoTotal', 'estadoConciliacion'])
  sortBy = 'numeroLinea';

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => String(value).toLowerCase())
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'asc';
}
