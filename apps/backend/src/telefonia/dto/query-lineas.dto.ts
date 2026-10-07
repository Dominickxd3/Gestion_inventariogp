import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QueryLineasDto {
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @Transform(({ value }: { value: unknown }) => String(value).toUpperCase()) @IsIn(['ACTIVA','DISPONIBLE','SUSPENDIDA','BAJA','ROBADA','PERDIDA']) estado?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) idOperador?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) idPlan?: number;
  @IsOptional() @Transform(({ value }: { value: unknown }) => value === 'true' || value === true) @IsBoolean() conResponsable?: boolean;
  @IsOptional() @Transform(({ value }: { value: unknown }) => value === 'true' || value === true) @IsBoolean() conCelular?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsIn(['numero','estado','operador','plan']) sortBy = 'numero';
  @IsOptional() @Transform(({ value }: { value: unknown }) => String(value).toLowerCase()) @IsIn(['asc','desc']) sortDirection: 'asc' | 'desc' = 'asc';
}
