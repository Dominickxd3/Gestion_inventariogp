export type EstadoConciliacionFactura = 'PENDIENTE' | 'EN_REVISION' | 'CONCILIADO' | 'CERRADO';

export type EstadoConciliacionDetalle = 'PENDIENTE' | 'CONFORME' | 'OBSERVADO' | 'CORREGIDO';

export type DiagnosticoConciliacion =
  | 'CONFORME'
  | 'LINEA_NO_REGISTRADA'
  | 'SIN_RESPONSABLE'
  | 'SIN_EQUIPO'
  | 'MULTIPLES_RESPONSABLES_PERIODO'
  | 'MULTIPLES_EQUIPOS_PERIODO'
  | 'RESPONSABLE_INCONSISTENTE'
  | 'MONTO_PLAN_DIFERENTE'
  | 'CARGOS_ADICIONALES'
  | 'CARGO_EQUIPO'
  | 'PRORRATEO'
  | 'DESCUENTO'
  | 'SALDO_ANTERIOR';

export interface IntervaloResponsableHistorico {
  idTrabajador: number;
  nombre: string;
  dni?: string;
  cargo?: string;
  area?: string;
  fechaInicio: string;
  fechaFin: string | null;
  motivo?: string;
}

export interface IntervaloEquipoHistorico {
  idActivo: number;
  codigo: string;
  marca?: string;
  modelo?: string;
  imei1?: string;
  fechaInicio: string;
  fechaFin: string | null;
  observaciones?: string;
}

export interface CuotaFacturaItem {
  idCuota: number;
  idFinanciamiento: number;
  numeroCuota: number;
  monto: number;
  estado: string;
  fechaFacturacion?: string;
}
