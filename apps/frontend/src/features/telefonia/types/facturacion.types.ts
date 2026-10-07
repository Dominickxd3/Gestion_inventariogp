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

export interface FacturaListItem {
  idFactura: number;
  numeroFactura?: string | null;
  numeroCuenta?: string | null;
  fechaEmision: string;
  periodoInicio: string;
  periodoFin: string;
  fechaVencimiento?: string | null;
  montoTotal: number;
  archivoPdf?: string | null;
  estadoConciliacion: EstadoConciliacionFactura;
  fechaImportacion: string;
  fechaCierre?: string | null;
  operador: { id: number; nombre: string };
  usuarioImportacion?: string | null;
  usuarioCierre?: string | null;
  totalLineas: number;
}

export interface FacturaPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FacturaPage {
  items: FacturaListItem[];
  pagination: FacturaPagination;
}

export interface CuotaVinculadaItem {
  idCuota: number;
  idFinanciamiento: number;
  numeroCuota: number;
  monto: number;
  estado: string;
  fechaFacturacion?: string | null;
  activo: { codigo: string; marca?: string; modelo?: string };
  numeroFolio?: string | null;
}

export interface FacturaDetail {
  idFactura: number;
  numeroFactura?: string | null;
  numeroCuenta?: string | null;
  fechaEmision: string;
  periodoInicio: string;
  periodoFin: string;
  fechaVencimiento?: string | null;
  montoTotal: number;
  archivoPdf?: string | null;
  estadoConciliacion: EstadoConciliacionFactura;
  fechaImportacion: string;
  fechaCierre?: string | null;
  observaciones?: string | null;
  operador: { id: number; nombre: string };
  usuarioImportacion?: string | null;
  usuarioCierre?: string | null;
  resumen: {
    totalLineas: number;
    conformes: number;
    observados: number;
    corregidos: number;
    pendientes: number;
    totalCargosPlan: number;
    totalCargosAdicionales: number;
    totalCargosEquipos: number;
    totalDescuentos: number;
    totalCalculado: number;
  };
  cuotasVinculadas: CuotaVinculadaItem[];
}

export interface FacturaDetalleItem {
  idDetalle: number;
  idFactura: number;
  idLinea: number | null;
  numeroLinea: string;
  nombrePlan?: string | null;
  cargoPlan: number;
  prorrateo: number;
  cargosAdicionales: number;
  descuentos: number;
  cargoEquipos: number;
  saldoAnterior: number;
  montoTotal: number;
  estadoConciliacion: EstadoConciliacionDetalle;
  observaciones?: string | null;
  lineaEstado?: string | null;
  diagnosticos?: DiagnosticoConciliacion[];
  responsablesPeriodo?: IntervaloResponsableHistorico[];
  equiposPeriodo?: IntervaloEquipoHistorico[];
}

export interface FacturaDetallePage {
  items: FacturaDetalleItem[];
  pagination: FacturaPagination;
}

export interface ResumenConciliacion {
  factura: {
    idFactura: number;
    numeroFactura?: string | null;
    operador: string;
    periodoInicio: string;
    periodoFin: string;
    montoTotal: number;
    estadoConciliacion: EstadoConciliacionFactura;
  };
  metricas: {
    totalLineas: number;
    conformes: number;
    observados: number;
    corregidos: number;
    pendientes: number;
    lineasNoRegistradas: number;
  };
  financiero: {
    montoFacturado: number;
    totalCargosPlan: number;
    totalCargosAdicionales: number;
    totalCargosEquipos: number;
    totalDescuentos: number;
    totalCalculado: number;
    diferencia: number;
  };
}

export interface QueryFacturas {
  search?: string;
  idOperador?: number;
  estadoConciliacion?: string;
  periodoDesde?: string;
  periodoHasta?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface QueryFacturaDetalles {
  search?: string;
  estadoConciliacion?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CreateFacturaDetalleInput {
  numeroLinea: string;
  nombrePlan?: string;
  cargoPlan?: number;
  prorrateo?: number;
  cargosAdicionales?: number;
  descuentos?: number;
  cargoEquipos?: number;
  saldoAnterior?: number;
  montoTotal?: number;
  observaciones?: string;
}

export interface CreateFacturaInput {
  idOperador: number;
  numeroFactura?: string;
  numeroCuenta?: string;
  fechaEmision: string;
  periodoInicio: string;
  periodoFin: string;
  fechaVencimiento?: string;
  montoTotal: number;
  archivoPdf?: string;
  observaciones?: string;
  detalles: CreateFacturaDetalleInput[];
}

export interface UpdateDetalleEstadoInput {
  estadoConciliacion: EstadoConciliacionDetalle;
  observaciones?: string;
  idLinea?: number;
}

export interface CerrarFacturaInput {
  motivoCierre?: string;
}

export interface VincularCuotaInput {
  idCuota: number;
}
