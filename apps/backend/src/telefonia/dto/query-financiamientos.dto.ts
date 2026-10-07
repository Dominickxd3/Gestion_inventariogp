import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryFinanciamientosDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) idActivo?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) idOperador?: number;
  @IsOptional() @Transform(({ value }: { value: unknown }) => String(value).toUpperCase()) @IsIn(['ACTIVO','PAGADO','CANCELADO']) estado?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
