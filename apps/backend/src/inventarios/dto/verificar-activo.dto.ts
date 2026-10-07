import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { EstadoVerificacion } from '../types/inventarios.types';

export class VerificarActivoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idActivo!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idUbicacionEncontrada?: number;

  @IsIn(['ENCONTRADO', 'NO_ENCONTRADO', 'CAMBIO_UBICACION', 'OBSERVADO'], {
    message: 'El estado de verificación debe ser ENCONTRADO, NO_ENCONTRADO, CAMBIO_UBICACION u OBSERVADO.',
  })
  estadoVerificacion!: EstadoVerificacion;

  @IsOptional()
  @IsString()
  @MaxLength(700)
  observaciones?: string;
}
