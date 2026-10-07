import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsIP, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class ComputerDto {
  @IsOptional() @IsString() @MaxLength(150) hostname?:string;
  @IsOptional() @IsIP() direccionIp?:string;
  @IsOptional() @Matches(/^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/) direccionMac?:string;
  @IsOptional() @IsString() @MaxLength(250) procesador?:string;
  @IsOptional() @Type(()=>Number) @IsNumber() @Min(0) @Max(999999) ramGb?:number;
  @IsOptional() @IsString() @MaxLength(100) almacenamientoTipo?:string;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(0) almacenamientoGb?:number;
  @IsOptional() @IsString() @MaxLength(200) sistemaOperativo?:string;
  @IsOptional() @IsString() @MaxLength(50) arquitectura?:string;
  @IsOptional() @IsString() @MaxLength(150) usuarioWindows?:string;
  @IsOptional() @IsString() @MaxLength(150) dominio?:string;
}
export class MobileDto {
  @IsOptional() @Matches(/^\d{8,20}$/) imei1?:string;
  @IsOptional() @Matches(/^\d{8,20}$/) imei2?:string;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(0) ramGb?:number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(0) almacenamientoGb?:number;
  @IsOptional() @IsString() @MaxLength(150) sistemaOperativo?:string;
}
export class CreateActivoDto {
  @IsString() @MaxLength(50) @Matches(/^\S(?:.*\S)?$/) codigo!:string;
  @Type(()=>Number) @IsInt() @Min(1) idTipo!:number;
  @Type(()=>Number) @IsInt() @Min(1) idEstado!:number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) idUbicacion?:number;
  @IsOptional() @IsString() @MaxLength(150) marca?:string;
  @IsOptional() @IsString() @MaxLength(200) modelo?:string;
  @IsOptional() @IsString() @MaxLength(200) numeroSerie?:string;
  @IsOptional() @IsString() @MaxLength(100) color?:string;
  @IsOptional() @IsDateString() fechaCompra?:string;
  @IsOptional() @IsDateString() fechaGarantiaHasta?:string;
  @IsOptional() @IsString() @MaxLength(200) proveedor?:string;
  @IsOptional() @Type(()=>Number) @IsNumber() @Min(0) costoCompra?:number;
  @IsOptional() @IsBoolean() propiedadEmpresa=true;
  @IsOptional() @IsString() @MaxLength(1500) observaciones?:string;
  @IsOptional() @ValidateNested() @Type(()=>ComputerDto) computo?:ComputerDto;
  @IsOptional() @ValidateNested() @Type(()=>MobileDto) celular?:MobileDto;
}
