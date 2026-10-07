import { api } from '../../../services/api';
import { DashboardSummary } from '../types/dashboard.types';
export async function getDashboardSummary(): Promise<DashboardSummary> {
  return (await api.get<DashboardSummary>('/dashboard/resumen')).data;
}
