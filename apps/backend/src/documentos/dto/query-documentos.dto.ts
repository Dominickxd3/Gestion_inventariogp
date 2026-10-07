import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDocumentosDto {
  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idActivo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idAsignacion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idTrabajador?: number;

  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @IsOptional()
  @IsString()
  fechaHasta?: string;

  @IsOptional()
  @IsString()
  search?: string;

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
  @IsIn(['fecha_documento', 'fecha_registro', 'tipo_documento', 'id_documento'])
  sortBy: string = 'fecha_documento';

  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  sortDirection: 'asc' | 'desc' | 'ASC' | 'DESC' = 'DESC';
}
