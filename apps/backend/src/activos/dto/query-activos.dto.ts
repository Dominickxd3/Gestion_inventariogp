import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
export class QueryActivosDto {
  @IsOptional() @IsString() @MaxLength(200) search?:string;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) idTipo?:number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) idEstado?:number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) idSede?:number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) idArea?:number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) page=1;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(100) pageSize=20;
  @IsOptional() @IsIn(['codigo','marca','modelo','tipo','estado','fechaCreacion']) sortBy='fechaCreacion';
  @IsOptional() @Transform(({value}:{value:unknown})=>String(value).toLowerCase()) @IsIn(['asc','desc']) sortDirection:'asc'|'desc'='desc';
}
