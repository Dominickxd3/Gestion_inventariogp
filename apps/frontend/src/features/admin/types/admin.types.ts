export interface UsuarioListItem {
  id: number;
  userLogon: string;
  userFullname: string | null;
  userEmail: string | null;
  userEstadoErp: number | null;
  permitirAcceso: boolean;
  estadoLocal: boolean;
  idRol: number | null;
  rolCodigo: string | null;
  rol: string | null;
  ultimaSincronizacion: string | null;
  ultimoAcceso: string | null;
}

export interface UsuarioDetail {
  id: number;
  userLogon: string;
  userFullname: string | null;
  userEmail: string | null;
  userEstadoErp: number | null;
  permitirAcceso: boolean;
  estadoLocal: boolean;
  idRol: number | null;
  rolCodigo: string | null;
  rolNombre: string | null;
  rolDescripcion: string | null;
  ultimaSincronizacion: string | null;
  ultimoAcceso: string | null;
  observaciones: string | null;
  permisos: Array<{
    codigo: string;
    nombre: string;
    modulo: string;
  }>;
}

export interface RolItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface PermisoItem {
  id: number;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion: string | null;
}

export interface QueryUsuariosParams {
  search?: string;
  estadoERP?: number;
  estadoLocal?: boolean;
  permitirAcceso?: boolean;
  idRol?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface UpdateUsuarioAccesoPayload {
  permitir_acceso?: boolean;
  estado_local?: boolean;
  id_rol?: number;
  observaciones?: string;
}

export interface PaginatedUsuariosResponse {
  items: UsuarioListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
