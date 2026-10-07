import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LiberarResponsableDto {
  @IsOptional() @IsString() @MaxLength(500) motivo?: string;
  @IsOptional() @IsString() @MaxLength(1000) observaciones?: string;
}
