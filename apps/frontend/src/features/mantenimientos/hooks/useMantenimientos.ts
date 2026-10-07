import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mantenimientosApi } from '../api/mantenimientos.api';
import {
  CreateMantenimientoPayload,
  FinalizarMantenimientoPayload,
  QueryMantenimientosParams,
  UpdateMantenimientoPayload,
} from '../types/mantenimientos.types';

export function useMantenimientos(params: QueryMantenimientosParams) {
  return useQuery({
    queryKey: ['mantenimientos', params],
    queryFn: () => mantenimientosApi.list(params),
  });
}

export function useMantenimiento(id: number) {
  return useQuery({
    queryKey: ['mantenimiento', id],
    queryFn: () => mantenimientosApi.getById(id),
    enabled: id > 0,
  });
}

export function useAssetMantenimientos(idActivo: number) {
  return useQuery({
    queryKey: ['activo-mantenimientos', idActivo],
    queryFn: () => mantenimientosApi.getByAsset(idActivo),
    enabled: idActivo > 0,
  });
}

export function useCreateMantenimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMantenimientoPayload) => mantenimientosApi.create(payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      queryClient.invalidateQueries({ queryKey: ['activo', vars.idActivo] });
      queryClient.invalidateQueries({ queryKey: ['activo-mantenimientos', vars.idActivo] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateMantenimiento(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMantenimientoPayload) => mantenimientosApi.update(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      queryClient.invalidateQueries({ queryKey: ['mantenimiento', id] });
      queryClient.invalidateQueries({ queryKey: ['activo', updated.idActivo] });
      queryClient.invalidateQueries({ queryKey: ['activo-mantenimientos', updated.idActivo] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useFinalizarMantenimiento(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FinalizarMantenimientoPayload) => mantenimientosApi.finalizar(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      queryClient.invalidateQueries({ queryKey: ['mantenimiento', id] });
      queryClient.invalidateQueries({ queryKey: ['activo', updated.idActivo] });
      queryClient.invalidateQueries({ queryKey: ['activo-mantenimientos', updated.idActivo] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
