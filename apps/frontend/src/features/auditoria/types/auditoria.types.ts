export interface AuditoriaListItem {
  id: string;
  idUsuario: number | null;
  usuarioLogon: string | null;
  usuarioNombre: string | null;
  modulo: string;
  accion: string;
  tablaAfectada: string | null;
  registroId: string | null;
  direccionIp: string | null;
  fecha: string;
}

export interface AuditoriaDetail extends AuditoriaListItem {
  datosAnteriores: unknown | null;
  datosNuevos: unknown | null;
}

export interface QueryAuditoriaParams {
  fechaDesde?: string;
  fechaHasta?: string;
  usuario?: string;
  modulo?: string;
  accion?: string;
  tabla?: string;
  registroId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface PaginatedAuditoriaResponse {
  items: AuditoriaListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
