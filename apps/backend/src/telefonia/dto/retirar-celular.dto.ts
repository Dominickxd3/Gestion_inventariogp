import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RetirarCelularDto {
  @IsOptional() @IsString() @MaxLength(1000) observaciones?: string;
}
