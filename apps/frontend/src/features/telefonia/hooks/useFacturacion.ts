import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { facturacionApi } from '../api/facturacion.api';
import {
  CerrarFacturaInput,
  CreateFacturaInput,
  QueryFacturaDetalles,
  QueryFacturas,
  UpdateDetalleEstadoInput,
  VincularCuotaInput,
} from '../types/facturacion.types';

export const useFacturas = (q: QueryFacturas) =>
  useQuery({
    queryKey: ['facturas', q],
    queryFn: () => facturacionApi.list(q),
  });

export const useFactura = (id: number) =>
  useQuery({
    queryKey: ['factura', id],
    queryFn: () => facturacionApi.detail(id),
    enabled: id > 0,
  });

export const useFacturaDetalles = (idFactura: number, q: QueryFacturaDetalles) =>
  useQuery({
    queryKey: ['factura-detalles', idFactura, q],
    queryFn: () => facturacionApi.listDetalle(idFactura, q),
    enabled: idFactura > 0,
  });

export const useResumenConciliacion = (idFactura: number) =>
  useQuery({
    queryKey: ['resumen-conciliacion', idFactura],
    queryFn: () => facturacionApi.resumenConciliacion(idFactura),
    enabled: idFactura > 0,
  });

export function useCreateFactura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: CreateFacturaInput) => facturacionApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facturas'] });
    },
  });
}

export function useConciliarFactura(idFactura: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => facturacionApi.conciliar(idFactura),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factura', idFactura] });
      qc.invalidateQueries({ queryKey: ['factura-detalles', idFactura] });
      qc.invalidateQueries({ queryKey: ['resumen-conciliacion', idFactura] });
      qc.invalidateQueries({ queryKey: ['facturas'] });
    },
  });
}

export function useUpdateDetalleEstado(idFactura: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idDetalle, data }: { idDetalle: number; data: UpdateDetalleEstadoInput }) =>
      facturacionApi.updateDetalleEstado(idFactura, idDetalle, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factura', idFactura] });
      qc.invalidateQueries({ queryKey: ['factura-detalles', idFactura] });
      qc.invalidateQueries({ queryKey: ['resumen-conciliacion', idFactura] });
    },
  });
}

export function useCerrarFactura(idFactura: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: CerrarFacturaInput) => facturacionApi.cerrar(idFactura, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factura', idFactura] });
      qc.invalidateQueries({ queryKey: ['facturas'] });
    },
  });
}

export function useVincularCuota(idFactura: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: VincularCuotaInput) => facturacionApi.vincularCuota(idFactura, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factura', idFactura] });
      qc.invalidateQueries({ queryKey: ['financiamientos'] });
    },
  });
}
