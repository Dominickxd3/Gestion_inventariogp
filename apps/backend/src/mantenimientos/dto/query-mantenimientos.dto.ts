import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryMantenimientosDto {
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
  @IsIn(['id_mantenimiento', 'fecha_inicio', 'fecha_programada', 'costo', 'estado', 'tipo', 'codigo'])
  sortBy: string = 'id_mantenimiento';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['PENDIENTE', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO'])
  estado?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idActivo?: number;

  @IsOptional()
  @IsIn(['CORRECTIVO', 'PREVENTIVO'])
  tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idSede?: number;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
