import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateFacturaDetalleDto {
  @IsString()
  @MaxLength(20)
  numeroLinea!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombrePlan?: string;

  @IsOptional()
  @IsNumber()
  cargoPlan = 0;

  @IsOptional()
  @IsNumber()
  prorrateo = 0;

  @IsOptional()
  @IsNumber()
  cargosAdicionales = 0;

  @IsOptional()
  @IsNumber()
  descuentos = 0;

  @IsOptional()
  @IsNumber()
  cargoEquipos = 0;

  @IsOptional()
  @IsNumber()
  saldoAnterior = 0;

  @IsOptional()
  @IsNumber()
  montoTotal = 0;

  @IsOptional()
  @IsString()
  @MaxLength(700)
  observaciones?: string;
}

export class CreateFacturaDto {
  @IsInt()
  @Min(1)
  idOperador!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroFactura?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroCuenta?: string;

  @IsDateString()
  fechaEmision!: string;

  @IsDateString()
  periodoInicio!: string;

  @IsDateString()
  periodoFin!: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsNumber()
  @Min(0)
  montoTotal!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  archivoPdf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  observaciones?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateFacturaDetalleDto)
  detalles!: CreateFacturaDetalleDto[];
}
