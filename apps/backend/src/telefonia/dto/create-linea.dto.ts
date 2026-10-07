import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateLineaDto {
  @IsString() @MaxLength(20) numero!: string;
  @IsInt() @Min(1) idOperador!: number;
  @IsOptional() @IsInt() @Min(1) idPlan?: number;
  @IsOptional() @IsString() @MaxLength(100) iccid?: string;
  @IsOptional() @IsString() @MaxLength(50) fechaAlta?: string;
  @IsOptional() @IsString() @MaxLength(1000) observaciones?: string;
}
