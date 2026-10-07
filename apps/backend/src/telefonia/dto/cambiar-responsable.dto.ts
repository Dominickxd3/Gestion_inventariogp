import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CambiarResponsableDto {
  @IsInt() @Min(1) idTrabajador!: number;
  @IsOptional() @IsString() @MaxLength(500) motivo?: string;
  @IsOptional() @IsString() @MaxLength(1000) observaciones?: string;
}
