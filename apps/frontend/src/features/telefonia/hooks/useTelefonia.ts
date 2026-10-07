import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { telefoniaApi } from '../api/telefonia.api';
import {
  AsignarResponsableInput,
  AsociarEquipoInput,
  CambiarResponsableInput,
  CrearFinanciamientoInput,
  CreateLineaInput,
  FinanciamientoQuery,
  LiberarResponsableInput,
  LineaQuery,
  RetirarEquipoInput,
  UpdateLineaInput,
} from '../types/telefonia.types';

export const useLineas = (q: LineaQuery) =>
  useQuery({
    queryKey: ['lineas', q],
    queryFn: () => telefoniaApi.list(q),
  });

export const useLinea = (id: number) =>
  useQuery({
    queryKey: ['linea', id],
    queryFn: () => telefoniaApi.detail(id),
    enabled: id > 0,
  });

export const useEquiposDisponibles = (search?: string) =>
  useQuery({
    queryKey: ['equipos-disponibles', search],
    queryFn: () => telefoniaApi.equiposDisponibles(search),
  });

export const useOperadores = () =>
  useQuery({
    queryKey: ['operadores-moviles'],
    queryFn: () => telefoniaApi.operadores(),
    staleTime: 5 * 60 * 1000,
  });

export const usePlanes = (idOperador?: number) =>
  useQuery({
    queryKey: ['planes-moviles', idOperador],
    queryFn: () => telefoniaApi.planes(idOperador),
    enabled: idOperador === undefined || idOperador > 0,
    staleTime: 5 * 60 * 1000,
  });

export const useTelefoniaTrabajadores = (search: string) =>
  useQuery({
    queryKey: ['trabajadores', search],
    queryFn: () => telefoniaApi.trabajadores(search),
    enabled: search.trim().length >= 2,
  });

export const useFinanciamientos = (q: FinanciamientoQuery) =>
  useQuery({
    queryKey: ['financiamientos', q],
    queryFn: () => telefoniaApi.listFinanciamientos(q),
  });

export const useFinanciamiento = (id: number) =>
  useQuery({
    queryKey: ['financiamiento', id],
    queryFn: () => telefoniaApi.detailFinanciamiento(id),
    enabled: id > 0,
  });

const invalidateTelefonia = (qc: ReturnType<typeof useQueryClient>, idLinea?: number) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: ['lineas'] }),
    qc.invalidateQueries({ queryKey: ['equipos-disponibles'] }),
    qc.invalidateQueries({ queryKey: ['financiamientos'] }),
    qc.invalidateQueries({ queryKey: ['activos'] }),
    qc.invalidateQueries({ queryKey: ['dashboard'] }),
    ...(idLinea ? [qc.invalidateQueries({ queryKey: ['linea', idLinea] })] : []),
  ]);

export function useCreateLinea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: CreateLineaInput) => telefoniaApi.create(d),
    onSuccess: (res) => invalidateTelefonia(qc, res?.idLinea),
  });
}

export function useUpdateLinea(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: UpdateLineaInput) => telefoniaApi.update(id, d),
    onSuccess: () => invalidateTelefonia(qc, id),
  });
}

export function useAsignarResponsable(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: AsignarResponsableInput) => telefoniaApi.asignarResponsable(id, d),
    onSuccess: () => invalidateTelefonia(qc, id),
  });
}

export function useCambiarResponsable(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: CambiarResponsableInput) => telefoniaApi.cambiarResponsable(id, d),
    onSuccess: () => invalidateTelefonia(qc, id),
  });
}

export function useLiberarResponsable(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: LiberarResponsableInput) => telefoniaApi.liberarResponsable(id, d),
    onSuccess: () => invalidateTelefonia(qc, id),
  });
}

export function useAsociarEquipo(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: AsociarEquipoInput) => telefoniaApi.asociarEquipo(id, d),
    onSuccess: () => invalidateTelefonia(qc, id),
  });
}

export function useCambiarEquipo(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: AsociarEquipoInput) => telefoniaApi.cambiarEquipo(id, d),
    onSuccess: () => invalidateTelefonia(qc, id),
  });
}

export function useRetirarEquipo(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: RetirarEquipoInput) => telefoniaApi.retirarEquipo(id, d),
    onSuccess: () => invalidateTelefonia(qc, id),
  });
}

export function useCreateFinanciamiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: CrearFinanciamientoInput) => telefoniaApi.createFinanciamiento(d),
    onSuccess: () => invalidateTelefonia(qc),
  });
}
