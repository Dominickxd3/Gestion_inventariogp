import { api } from '../../../services/api';
import {
  CreateMantenimientoPayload,
  FinalizarMantenimientoPayload,
  MantenimientoDetail,
  MantenimientoItem,
  PaginatedMantenimientosResponse,
  QueryMantenimientosParams,
  UpdateMantenimientoPayload,
} from '../types/mantenimientos.types';

export const mantenimientosApi = {
  list: async (params: QueryMantenimientosParams) =>
    (await api.get<PaginatedMantenimientosResponse>('/mantenimientos', { params })).data,

  getById: async (id: number) =>
    (await api.get<MantenimientoDetail>(`/mantenimientos/${id}`)).data,

  getByAsset: async (idActivo: number) =>
    (await api.get<MantenimientoItem[]>(`/activos/${idActivo}/mantenimientos`)).data,

  create: async (payload: CreateMantenimientoPayload) =>
    (await api.post<MantenimientoDetail>('/mantenimientos', payload)).data,

  update: async (id: number, payload: UpdateMantenimientoPayload) =>
    (await api.patch<MantenimientoDetail>(`/mantenimientos/${id}`, payload)).data,

  finalizar: async (id: number, payload: FinalizarMantenimientoPayload) =>
    (await api.post<MantenimientoDetail>(`/mantenimientos/${id}/finalizar`, payload)).data,
};
