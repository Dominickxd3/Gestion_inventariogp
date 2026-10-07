import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUsuarioAccesoDto {
  @IsOptional()
  @IsBoolean()
  permitir_acceso?: boolean;

  @IsOptional()
  @IsBoolean()
  estado_local?: boolean;

  @IsOptional()
  @IsInt()
  id_rol?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
