import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateDetalleEstadoDto {
  @Transform(({ value }: { value: unknown }) => String(value).toUpperCase())
  @IsIn(['PENDIENTE', 'CONFORME', 'OBSERVADO', 'CORREGIDO'])
  estadoConciliacion!: string;

  @IsOptional()
  @IsString()
  @MaxLength(700)
  observaciones?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  idLinea?: number;
}
