import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CerrarInventarioDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivoCierre?: string;

  @IsOptional()
  @IsBoolean()
  confirmarPendientes?: boolean;
}
