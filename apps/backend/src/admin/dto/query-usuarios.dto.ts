import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUsuariosDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estadoERP?: number;

  @IsOptional()
  @Type(() => Boolean)
  estadoLocal?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  permitirAcceso?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idRol?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @IsOptional()
  @IsIn(['user_logon', 'user_fullname', 'rol', 'ultimo_acceso', 'ultima_sincronizacion', 'permitir_acceso'])
  sortBy: string = 'user_logon';

  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  sortDirection: 'asc' | 'desc' | 'ASC' | 'DESC' = 'ASC';
}
