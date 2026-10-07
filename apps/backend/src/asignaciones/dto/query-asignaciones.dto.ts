import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QueryAsignacionesDto {
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @Transform(({ value }: { value: unknown }) => String(value).toUpperCase()) @IsIn(['VIGENTE', 'DEVUELTA']) estado?: 'VIGENTE'|'DEVUELTA';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) idTrabajador?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) idTipo?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) idSede?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsIn(['fechaEntrega','fechaDevolucion','codigoActivo','trabajador','tipo']) sortBy = 'fechaEntrega';
  @IsOptional() @Transform(({ value }: { value: unknown }) => String(value).toLowerCase()) @IsIn(['asc','desc']) sortDirection: 'asc'|'desc' = 'desc';
}
