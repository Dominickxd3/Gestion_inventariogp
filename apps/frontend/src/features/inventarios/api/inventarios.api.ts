import { api } from '../../../services/api';
import {
  CerrarInventarioPayload,
  CreateInventarioPayload,
  InventarioDetalleItem,
  InventarioItem,
  InventarioResumen,
  PaginatedInventarioDetalleResponse,
  PaginatedInventariosResponse,
  QueryInventarioDetalleParams,
  QueryInventariosParams,
  VerificarActivoPayload,
} from '../types/inventarios.types';

export const inventariosApi = {
  list: async (params: QueryInventariosParams) =>
    (await api.get<PaginatedInventariosResponse>('/inventarios', { params })).data,

  getById: async (id: number) =>
    (await api.get<InventarioItem & { resumen: InventarioResumen }>(`/inventarios/${id}`)).data,

  getResumen: async (id: number) =>
    (await api.get<InventarioResumen>(`/inventarios/${id}/resumen`)).data,

  getDetalle: async (id: number, params: QueryInventarioDetalleParams) =>
    (await api.get<PaginatedInventarioDetalleResponse>(`/inventarios/${id}/detalle`, { params })).data,

  create: async (payload: CreateInventarioPayload) =>
    (await api.post<InventarioItem & { resumen: InventarioResumen }>('/inventarios', payload)).data,

  verificarActivo: async (id: number, payload: VerificarActivoPayload) =>
    (await api.post<InventarioDetalleItem>(`/inventarios/${id}/verificar`, payload)).data,

  cerrar: async (id: number, payload: CerrarInventarioPayload) =>
    (await api.post<InventarioItem & { resumen: InventarioResumen }>(`/inventarios/${id}/cerrar`, payload)).data,
};
