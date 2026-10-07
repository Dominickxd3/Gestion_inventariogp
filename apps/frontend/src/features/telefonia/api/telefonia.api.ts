import { api } from '../../../services/api';
import {
  AsignarResponsableInput,
  AsociarEquipoInput,
  CambiarResponsableInput,
  CrearFinanciamientoInput,
  CreateLineaInput,
  EquipoDisponible,
  FinanciamientoDetail,
  FinanciamientoPage,
  FinanciamientoQuery,
  LiberarResponsableInput,
  LineaDetail,
  LineaPage,
  LineaQuery,
  OperadorMovil,
  PlanMovil,
  RetirarEquipoInput,
  UpdateLineaInput,
} from '../types/telefonia.types';

export const telefoniaApi = {
  list: async (q: LineaQuery) => (await api.get<LineaPage>('/telefonia/lineas', { params: q })).data,
  detail: async (id: number) => (await api.get<LineaDetail>(`/telefonia/lineas/${id}`)).data,
  create: async (d: CreateLineaInput) => (await api.post<LineaDetail>('/telefonia/lineas', d)).data,
  update: async (id: number, d: UpdateLineaInput) => (await api.patch<LineaDetail>(`/telefonia/lineas/${id}`, d)).data,

  asignarResponsable: async (id: number, d: AsignarResponsableInput) =>
    (await api.post(`/telefonia/lineas/${id}/responsable`, d)).data,
  cambiarResponsable: async (id: number, d: CambiarResponsableInput) =>
    (await api.post(`/telefonia/lineas/${id}/cambiar-responsable`, d)).data,
  liberarResponsable: async (id: number, d: LiberarResponsableInput) =>
    (await api.post(`/telefonia/lineas/${id}/liberar-responsable`, d)).data,

  asociarEquipo: async (id: number, d: AsociarEquipoInput) =>
    (await api.post(`/telefonia/lineas/${id}/equipo`, d)).data,
  cambiarEquipo: async (id: number, d: AsociarEquipoInput) =>
    (await api.post(`/telefonia/lineas/${id}/cambiar-equipo`, d)).data,
  retirarEquipo: async (id: number, d: RetirarEquipoInput) =>
    (await api.post(`/telefonia/lineas/${id}/retirar-equipo`, d)).data,

  equiposDisponibles: async (search?: string) =>
    (await api.get<EquipoDisponible[]>('/telefonia/equipos-disponibles', { params: { search } })).data,

  operadores: async () =>
    (await api.get<OperadorMovil[]>('/catalogos/operadores-moviles')).data,

  planes: async (idOperador?: number) =>
    (await api.get<PlanMovil[]>('/catalogos/planes-moviles', { params: { idOperador } })).data,

  trabajadores: async (search: string) =>
    (await api.get<Array<{ id: number; documentoIdentidad: string; nombres: string; apellidos: string; cargo: string; area: string }>>(
      '/catalogos/trabajadores',
      { params: { search } },
    )).data,

  listFinanciamientos: async (q: FinanciamientoQuery) =>
    (await api.get<FinanciamientoPage>('/telefonia/financiamientos', { params: q })).data,
  detailFinanciamiento: async (id: number) =>
    (await api.get<FinanciamientoDetail>(`/telefonia/financiamientos/${id}`)).data,
  createFinanciamiento: async (d: CrearFinanciamientoInput) =>
    (await api.post<FinanciamientoDetail>('/telefonia/financiamientos', d)).data,
};
