import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateInventarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del inventario es obligatorio.' })
  @MaxLength(200)
  nombre!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idSede?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  observaciones?: string;
}
