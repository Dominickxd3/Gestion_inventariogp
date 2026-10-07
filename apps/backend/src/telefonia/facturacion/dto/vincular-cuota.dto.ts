import { IsInt, Min } from 'class-validator';

export class VincularCuotaDto {
  @IsInt()
  @Min(1)
  idCuota!: number;
}
