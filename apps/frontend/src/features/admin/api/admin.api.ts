import { api } from '../../../services/api';
import {
  PaginatedUsuariosResponse,
  QueryUsuariosParams,
  UsuarioDetail,
  UpdateUsuarioAccesoPayload,
  RolItem,
  PermisoItem,
} from '../types/admin.types';

export const adminApi = {
  listUsuarios: async (params: QueryUsuariosParams) =>
    (await api.get<PaginatedUsuariosResponse>('/admin/usuarios', { params })).data,

  getUsuario: async (id: number) =>
    (await api.get<UsuarioDetail>(`/admin/usuarios/${id}`)).data,

  updateUsuarioAcceso: async (id: number, payload: UpdateUsuarioAccesoPayload) =>
    (await api.patch<UsuarioDetail>(`/admin/usuarios/${id}`, payload)).data,

  sincronizarErp: async () =>
    (await api.post<{ sincronizados: number }>('/admin/usuarios/sincronizar')).data,

  getRoles: async () =>
    (await api.get<RolItem[]>('/admin/roles')).data,

  getPermisos: async () =>
    (await api.get<PermisoItem[]>('/admin/permisos')).data,
};
