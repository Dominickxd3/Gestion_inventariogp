import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AsociarCelularDto {
  @IsInt() @Min(1) idActivo!: number;
  @IsOptional() @IsString() @MaxLength(1000) observaciones?: string;
}
