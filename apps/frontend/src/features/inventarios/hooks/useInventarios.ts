import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventariosApi } from '../api/inventarios.api';
import {
  CerrarInventarioPayload,
  CreateInventarioPayload,
  QueryInventarioDetalleParams,
  QueryInventariosParams,
  VerificarActivoPayload,
} from '../types/inventarios.types';

export function useInventarios(params: QueryInventariosParams) {
  return useQuery({
    queryKey: ['inventarios', params],
    queryFn: () => inventariosApi.list(params),
  });
}

export function useInventario(id: number) {
  return useQuery({
    queryKey: ['inventario', id],
    queryFn: () => inventariosApi.getById(id),
    enabled: id > 0,
  });
}

export function useInventarioResumen(id: number) {
  return useQuery({
    queryKey: ['inventario-resumen', id],
    queryFn: () => inventariosApi.getResumen(id),
    enabled: id > 0,
  });
}

export function useInventarioDetalle(id: number, params: QueryInventarioDetalleParams) {
  return useQuery({
    queryKey: ['inventario-detalle', id, params],
    queryFn: () => inventariosApi.getDetalle(id, params),
    enabled: id > 0,
  });
}

export function useCreateInventario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInventarioPayload) => inventariosApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventarios'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useVerificarActivo(idInventario: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerificarActivoPayload) =>
      inventariosApi.verificarActivo(idInventario, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario', idInventario] });
      queryClient.invalidateQueries({ queryKey: ['inventario-resumen', idInventario] });
      queryClient.invalidateQueries({ queryKey: ['inventario-detalle', idInventario] });
      queryClient.invalidateQueries({ queryKey: ['inventarios'] });
    },
  });
}

export function useCerrarInventario(idInventario: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CerrarInventarioPayload) =>
      inventariosApi.cerrar(idInventario, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario', idInventario] });
      queryClient.invalidateQueries({ queryKey: ['inventario-resumen', idInventario] });
      queryClient.invalidateQueries({ queryKey: ['inventario-detalle', idInventario] });
      queryClient.invalidateQueries({ queryKey: ['inventarios'] });
    },
  });
}
