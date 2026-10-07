import { api } from '../../../services/api';
import {
  CerrarFacturaInput,
  CreateFacturaInput,
  FacturaDetail,
  FacturaDetalleItem,
  FacturaDetallePage,
  FacturaPage,
  QueryFacturaDetalles,
  QueryFacturas,
  ResumenConciliacion,
  UpdateDetalleEstadoInput,
  VincularCuotaInput,
} from '../types/facturacion.types';

export const facturacionApi = {
  list: async (q: QueryFacturas) => (await api.get<FacturaPage>('/telefonia/facturas', { params: q })).data,
  detail: async (id: number) => (await api.get<FacturaDetail>(`/telefonia/facturas/${id}`)).data,
  create: async (d: CreateFacturaInput) => (await api.post<FacturaDetail>('/telefonia/facturas', d)).data,
  listDetalle: async (id: number, q: QueryFacturaDetalles) =>
    (await api.get<FacturaDetallePage>(`/telefonia/facturas/${id}/detalle`, { params: q })).data,
  conciliar: async (id: number) =>
    (
      await api.post<{
        idFactura: number;
        estadoConciliacion: string;
        totalDetalles: number;
        items: FacturaDetalleItem[];
      }>(`/telefonia/facturas/${id}/conciliar`)
    ).data,
  resumenConciliacion: async (id: number) =>
    (await api.get<ResumenConciliacion>(`/telefonia/facturas/${id}/resumen-conciliacion`)).data,
  updateDetalleEstado: async (idFactura: number, idDetalle: number, d: UpdateDetalleEstadoInput) =>
    (await api.patch(`/telefonia/facturas/${idFactura}/detalle/${idDetalle}`, d)).data,
  cerrar: async (id: number, d: CerrarFacturaInput) =>
    (await api.post<FacturaDetail>(`/telefonia/facturas/${id}/cerrar`, d)).data,
  vincularCuota: async (id: number, d: VincularCuotaInput) =>
    (await api.post(`/telefonia/facturas/${id}/cuotas`, d)).data,
};
