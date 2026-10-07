export type TipoMantenimiento = 'CORRECTIVO' | 'PREVENTIVO';
export type EstadoMantenimiento = 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADO' | 'CANCELADO';

export interface MantenimientoItem {
  id: number;
  idActivo: number;
  activo: {
    codigo: string;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
    tipo: string;
    estado: {
      codigo: string;
      nombre: string;
    };
    sede: string | null;
    area: string | null;
  };
  tipo: TipoMantenimiento;
  fechaProgramada: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  problemaReportado: string | null;
  diagnostico: string | null;
  trabajoRealizado: string | null;
  costo: number | null;
  proveedor: string | null;
  estado: EstadoMantenimiento;
  proximoMantenimiento: string | null;
  observaciones: string | null;
  usuarioRegistro: {
    id: number;
    nombre: string;
  } | null;
}

export interface MantenimientoDetail extends MantenimientoItem {
  activoCompleto: {
    id: number;
    codigo: string;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
    tipo: string;
    estado: {
      codigo: string;
      nombre: string;
    };
    ubicacionTexto: string | null;
    responsableActual: string | null;
  };
}

export interface QueryMantenimientosParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  search?: string;
  estado?: string;
  idActivo?: number;
  tipo?: string;
  idSede?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface PaginatedMantenimientosResponse {
  items: MantenimientoItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateMantenimientoPayload {
  idActivo: number;
  tipo: TipoMantenimiento;
  fechaProgramada?: string;
  fechaInicio?: string;
  problemaReportado?: string;
  diagnostico?: string;
  trabajoRealizado?: string;
  costo?: number;
  proveedor?: string;
  estado?: EstadoMantenimiento;
  proximoMantenimiento?: string;
  observaciones?: string;
  cambiarEstadoActivo?: boolean;
}

export interface UpdateMantenimientoPayload {
  tipo?: TipoMantenimiento;
  fechaProgramada?: string;
  fechaInicio?: string;
  problemaReportado?: string;
  diagnostico?: string;
  trabajoRealizado?: string;
  costo?: number;
  proveedor?: string;
  estado?: EstadoMantenimiento;
  proximoMantenimiento?: string;
  observaciones?: string;
}

export interface FinalizarMantenimientoPayload {
  fechaFin?: string;
  trabajoRealizado?: string;
  diagnostico?: string;
  costo?: number;
  proximoMantenimiento?: string;
  observaciones?: string;
}
