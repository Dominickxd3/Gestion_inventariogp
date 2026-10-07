export type EstadoInventario = 'ABIERTO' | 'EN_PROCESO' | 'FINALIZADO' | 'CANCELADO';
export type EstadoVerificacion = 'PENDIENTE' | 'ENCONTRADO' | 'NO_ENCONTRADO' | 'CAMBIO_UBICACION' | 'OBSERVADO';

export interface InventarioItem {
  id: number;
  nombre: string;
  idSede: number | null;
  sedeNombre: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoInventario;
  observaciones: string | null;
  usuarioRegistro: {
    id: number;
    nombre: string;
  } | null;
  totalEsperados: number;
  verificados: number;
  pendientes: number;
  progreso: number;
}

export interface InventarioResumen {
  idInventario: number;
  totalEsperados: number;
  verificados: number;
  pendientes: number;
  encontrados: number;
  noEncontrados: number;
  cambioUbicacion: number;
  observados: number;
  progreso: number;
}

export interface InventarioDetalleItem {
  id: number;
  idInventario: number;
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
  };
  idUbicacionEsperada: number | null;
  ubicacionEsperada: string | null;
  idUbicacionEncontrada: number | null;
  ubicacionEncontrada: string | null;
  estadoVerificacion: EstadoVerificacion;
  fechaVerificacion: string | null;
  usuarioVerificacion: {
    id: number;
    nombre: string;
  } | null;
  observaciones: string | null;
}

export interface QueryInventariosParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  search?: string;
  estado?: string;
  idSede?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface PaginatedInventariosResponse {
  items: InventarioItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryInventarioDetalleParams {
  page?: number;
  pageSize?: number;
  search?: string;
  estadoVerificacion?: string;
  idTipo?: number;
  idArea?: number;
}

export interface PaginatedInventarioDetalleResponse {
  items: InventarioDetalleItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateInventarioPayload {
  nombre: string;
  idSede?: number;
  observaciones?: string;
}

export interface VerificarActivoPayload {
  idActivo: number;
  idUbicacionEncontrada?: number;
  estadoVerificacion: EstadoVerificacion;
  observaciones?: string;
}

export interface CerrarInventarioPayload {
  motivoCierre?: string;
  confirmarPendientes?: boolean;
}
