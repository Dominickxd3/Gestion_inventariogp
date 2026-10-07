import { api } from '../../../services/api';
import {
  PaginatedAuditoriaResponse,
  QueryAuditoriaParams,
  AuditoriaDetail,
} from '../types/auditoria.types';

export const auditoriaApi = {
  list: async (params: QueryAuditoriaParams) =>
    (await api.get<PaginatedAuditoriaResponse>('/auditoria', { params })).data,

  getById: async (id: string) =>
    (await api.get<AuditoriaDetail>(`/auditoria/${id}`)).data,
};
