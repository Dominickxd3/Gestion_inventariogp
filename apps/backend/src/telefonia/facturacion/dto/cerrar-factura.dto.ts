import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CerrarFacturaDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motivoCierre?: string;
}
