import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class AccesorioEntregaDto {
  @Type(() => Number) @IsInt() @Min(1) idAccesorio!: number;
  @IsOptional() @IsString() @MaxLength(150) estadoEntrega?: string;
  @IsOptional() @IsString() @MaxLength(500) observaciones?: string;
}
export class CreateAsignacionDto {
  @Type(() => Number) @IsInt() @Min(1) idActivo!: number;
  @Type(() => Number) @IsInt() @Min(1) idTrabajador!: number;
  @IsOptional() @IsString() @MaxLength(150) estadoEntrega?: string;
  @IsOptional() @IsString() @MaxLength(300) motivo?: string;
  @IsOptional() @IsString() @MaxLength(1500) observacion?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => AccesorioEntregaDto) accesorios: AccesorioEntregaDto[] = [];
}
