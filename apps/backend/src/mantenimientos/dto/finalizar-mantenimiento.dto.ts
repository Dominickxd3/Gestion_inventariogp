import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class FinalizarMantenimientoDto {
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2500)
  trabajoRealizado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  diagnostico?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsDateString()
  proximoMantenimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  observaciones?: string;
}
