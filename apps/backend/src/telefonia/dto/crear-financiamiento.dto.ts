import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CrearFinanciamientoDto {
  @IsInt() @Min(1) idActivo!: number;
  @IsInt() @Min(1) idOperador!: number;
  @IsOptional() @IsString() @MaxLength(100) numeroFolio?: string;
  @IsString() @MaxLength(50) fechaInicio!: string;
  @IsInt() @Min(1) @Max(120) cantidadCuotas!: number;
  @IsNumber() @Min(0) montoCuota!: number;
  @IsNumber() @Min(0) montoTotal!: number;
  @IsOptional() @IsIn(['ACTIVO','PAGADO','CANCELADO']) estado?: string;
  @IsOptional() @IsString() @MaxLength(1000) observaciones?: string;
}
