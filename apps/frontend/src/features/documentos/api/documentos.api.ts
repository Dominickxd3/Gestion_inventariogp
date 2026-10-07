import { api } from '../../../services/api';
import {
  PaginatedDocumentosResponse,
  QueryDocumentosParams,
  DocumentoListItem,
  GenerarDocumentoPayload,
} from '../types/documentos.types';

export const documentosApi = {
  list: async (params: QueryDocumentosParams) =>
    (await api.get<PaginatedDocumentosResponse>('/documentos', { params })).data,

  getById: async (id: number) =>
    (await api.get<DocumentoListItem>(`/documentos/${id}`)).data,

  descargar: async (id: number, nombreArchivo: string) => {
    const response = await api.get(`/documentos/${id}/descargar`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo || `documento_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  generar: async (payload: GenerarDocumentoPayload) =>
    (await api.post<DocumentoListItem>('/documentos/generar', payload)).data,
};
