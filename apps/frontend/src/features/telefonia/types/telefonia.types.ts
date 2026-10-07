export interface OperadorMovil {
  id: number;
  nombre: string;
}

export interface PlanMovil {
  id: number;
  nombre: string;
  precioMensual?: number;
  datosGb?: number;
  minutos?: string;
}

export interface LineaItem {
  idLinea: number;
  numero: string;
  iccid?: string | null;
  estado: string;
  fechaAlta?: string | null;
  fechaBaja?: string | null;
  observaciones?: string | null;
  operador: { id: number; nombre: string } | null;
  plan: { id: number; nombre: string } | null;
  responsable: { id: number; nombre: string; cargo?: string } | null;
  celular: { id: number; codigo: string; marca: string; modelo: string } | null;
}

export interface LineaPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LineaPage {
  items: LineaItem[];
  pagination: LineaPagination;
}

export interface ResponsableVigente {
  idAsignacionLinea: number;
  idTrabajador: number;
  nombre: string;
  dni: string;
  cargo?: string;
  area?: string;
  sede?: string;
  fechaInicio: string;
  motivo?: string;
  observaciones?: string;
}

export interface EquipoVigente {
  idLineaEquipo: number;
  idActivo: number;
  codigo: string;
  marca: string;
  modelo: string;
  imei1?: string;
  imei2?: string;
  fechaInicio: string;
  observaciones?: string;
}

export interface HistorialResponsableItem {
  idAsignacionLinea: number;
  vigente: boolean;
  idTrabajador: number;
  nombre: string;
  dni: string;
  cargo?: string;
  area?: string;
  fechaInicio: string;
  fechaFin?: string | null;
  motivo?: string;
  observaciones?: string;
}

export interface HistorialEquipoItem {
  idLineaEquipo: number;
  vigente: boolean;
  idActivo: number;
  codigo: string;
  marca: string;
  modelo: string;
  imei1?: string;
  imei2?: string;
  fechaInicio: string;
  fechaFin?: string | null;
  observaciones?: string;
}

export interface AdvertenciaLinea {
  codigo: string;
  mensaje: string;
}

export interface FinanciamientoLineaActual {
  idFinanciamiento: number;
  numeroFolio?: string;
  fechaInicio: string;
  cantidadCuotas: number;
  montoCuota: number;
  montoTotal: number;
  estado: string;
}

export interface LineaDetail {
  idLinea: number;
  numero: string;
  iccid?: string | null;
  estado: string;
  fechaAlta?: string | null;
  fechaBaja?: string | null;
  observaciones?: string | null;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  operador: { id: number; nombre: string } | null;
  plan: { id: number; nombre: string; precioMensual?: number } | null;
  responsableActual: ResponsableVigente | null;
  equipoActual: EquipoVigente | null;
  historialResponsables: HistorialResponsableItem[];
  historialEquipos: HistorialEquipoItem[];
  advertencias: AdvertenciaLinea[];
  financiamientoActual: FinanciamientoLineaActual | null;
}

export interface LineaQuery {
  search?: string;
  estado?: string;
  idOperador?: number;
  idPlan?: number;
  conResponsable?: boolean;
  conCelular?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'numero' | 'estado' | 'operador' | 'plan';
  sortDirection?: 'asc' | 'desc';
}

export interface CreateLineaInput {
  numero: string;
  idOperador: number;
  idPlan?: number;
  iccid?: string;
  fechaAlta?: string;
  observaciones?: string;
}

export interface UpdateLineaInput {
  estado?: string;
  iccid?: string;
  idPlan?: number;
  observaciones?: string;
}

export interface AsignarResponsableInput {
  idTrabajador: number;
  motivo?: string;
  observaciones?: string;
}

export interface CambiarResponsableInput {
  idTrabajador: number;
  motivoCambio: string;
  observaciones?: string;
}

export interface LiberarResponsableInput {
  motivo?: string;
  observaciones?: string;
}

export interface AsociarEquipoInput {
  idActivo: number;
  observaciones?: string;
}

export interface RetirarEquipoInput {
  motivo?: string;
  observaciones?: string;
}

export interface EquipoDisponible {
  id: number;
  codigo: string;
  marca: string;
  modelo: string;
  imei1?: string;
  imei2?: string;
  estadoCodigo: string;
  responsable?: string;
}

export interface FinanciamientoItem {
  idFinanciamiento: number;
  idActivo: number;
  codigoActivo: string;
  marca: string;
  modelo: string;
  operador: string;
  numeroFolio?: string;
  fechaInicio: string;
  cantidadCuotas: number;
  montoCuota: number;
  montoTotal: number;
  estado: string;
  cuotasPagadas?: number;
}

export interface FinanciamientoQuery {
  search?: string;
  idOperador?: number;
  estado?: string;
  page?: number;
  pageSize?: number;
}

export interface FinanciamientoPage {
  items: FinanciamientoItem[];
  pagination: LineaPagination;
}

export interface FinanciamientoCuota {
  idCuota: number;
  numeroCuota: number;
  periodo: string;
  monto: number;
  estado: string;
  fechaPago?: string;
}

export interface FinanciamientoDetail extends FinanciamientoItem {
  observaciones?: string;
  cuotas: FinanciamientoCuota[];
}

export interface CrearFinanciamientoInput {
  idActivo: number;
  idOperador: number;
  numeroFolio?: string;
  fechaInicio: string;
  cantidadCuotas: number;
  montoCuota: number;
  montoTotal: number;
  estado?: string;
  observaciones?: string;
}
