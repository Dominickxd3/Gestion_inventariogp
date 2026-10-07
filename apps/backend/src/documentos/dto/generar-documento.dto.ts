import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerarDocumentoDto {
  @IsIn(['ACTA_ENTREGA', 'CONSTANCIA_DEVOLUCION'], {
    message: 'tipoDocumento debe ser ACTA_ENTREGA o CONSTANCIA_DEVOLUCION',
  })
  tipoDocumento!: 'ACTA_ENTREGA' | 'CONSTANCIA_DEVOLUCION';

  @IsInt({ message: 'idAsignacion debe ser un número entero' })
  idAsignacion!: number;

  @IsOptional()
  @IsString()
  @MaxLength(700, { message: 'observaciones no puede exceder 700 caracteres' })
  observaciones?: string;
}
