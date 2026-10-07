export interface DocumentoListItem {
  id: number;
  tipoDocumento: string;
  idActivo: number | null;
  activoCodigo: string | null;
  activoTipo: string | null;
  idAsignacion: number | null;
  idTrabajador: number | null;
  trabajadorDni: string | null;
  trabajadorNombre: string | null;
  nombreArchivo: string;
  rutaArchivo: string;
  hashArchivo: string | null;
  fechaDocumento: string | null;
  fechaRegistro: string;
  usuarioRegistroNombre: string | null;
  observaciones: string | null;
}

export interface QueryDocumentosParams {
  tipo?: string;
  idActivo?: number;
  idAsignacion?: number;
  idTrabajador?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface GenerarDocumentoPayload {
  tipoDocumento: 'ACTA_ENTREGA' | 'CONSTANCIA_DEVOLUCION';
  idAsignacion: number;
  observaciones?: string;
}

export interface PaginatedDocumentosResponse {
  items: DocumentoListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
