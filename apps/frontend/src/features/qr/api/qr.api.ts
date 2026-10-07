import { api } from '../../../services/api';
import { QrResolvedActivo, QrGenerationResult } from '../types/qr.types';

export const qrApi = {
  resolve: async (token: string) =>
    (await api.get<QrResolvedActivo>(`/qr/${encodeURIComponent(token)}`)).data,

  getActivoQr: async (idActivo: number) =>
    (await api.get<QrGenerationResult>(`/activos/${idActivo}/qr`)).data,
};
