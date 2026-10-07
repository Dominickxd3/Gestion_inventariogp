import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QueryFacturasDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idOperador?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => String(value).toUpperCase())
  @IsIn(['PENDIENTE', 'EN_REVISION', 'CONCILIADO', 'CERRADO'])
  estadoConciliacion?: string;

  @IsOptional()
  @IsString()
  periodoDesde?: string;

  @IsOptional()
  @IsString()
  periodoHasta?: string;

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
  pageSize = 20;

  @IsOptional()
  @IsIn(['periodoInicio', 'periodoFin', 'fechaEmision', 'fechaVencimiento', 'montoTotal', 'numeroFactura', 'estadoConciliacion'])
  sortBy = 'periodoInicio';

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => String(value).toLowerCase())
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'desc';
}
