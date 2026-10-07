import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class AccesorioDevolucionDto {
  @Type(() => Number) @IsInt() @Min(1) idAsignacionAccesorio!: number;
  @IsIn(['DEVUELTO','MALOGRADO','PERDIDO']) resultado!: 'DEVUELTO'|'MALOGRADO'|'PERDIDO';
  @IsOptional() @IsString() @MaxLength(150) estadoDevolucion?: string;
  @IsOptional() @IsString() @MaxLength(500) observaciones?: string;
}
export class DevolverAsignacionDto {
  @IsOptional() @IsString() @MaxLength(150) estadoDevolucion?: string;
  @IsOptional() @IsString() @MaxLength(300) motivo?: string;
  @IsOptional() @IsString() @MaxLength(1500) observacion?: string;
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => AccesorioDevolucionDto) accesorios: AccesorioDevolucionDto[] = [];
}
