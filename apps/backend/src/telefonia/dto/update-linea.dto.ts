import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateLineaDto {
  @IsOptional() @Transform(({ value }: { value: unknown }) => String(value).toUpperCase()) @IsIn(['ACTIVA','DISPONIBLE','SUSPENDIDA','BAJA','ROBADA','PERDIDA']) estado?: string;
  @IsOptional() @IsString() @MaxLength(100) iccid?: string;
  @IsOptional() @IsInt() @Min(1) idPlan?: number;
  @IsOptional() @IsString() @MaxLength(1000) observaciones?: string;
}
