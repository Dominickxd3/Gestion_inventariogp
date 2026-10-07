import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoMantenimiento, EstadoMantenimiento } from '../types/mantenimientos.types';

export class CreateMantenimientoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idActivo!: number;

  @IsIn(['CORRECTIVO', 'PREVENTIVO'])
  tipo!: TipoMantenimiento;

  @IsOptional()
  @IsDateString()
  fechaProgramada?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  problemaReportado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  diagnostico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2500)
  trabajoRealizado?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  proveedor?: string;

  @IsOptional()
  @IsIn(['PENDIENTE', 'EN_PROCESO'])
  estado?: EstadoMantenimiento;

  @IsOptional()
  @IsDateString()
  proximoMantenimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  cambiarEstadoActivo?: boolean;
}
