export interface DashboardKpis {
  totalActivos: number; asignados: number; disponibles: number;
  mantenimiento: number; observados: number; lineasActivas: number;
}
export interface DashboardDistribution { label: string; count: number }
export interface DashboardAlerts {
  lineasSinResponsable: number; lineasSinEquipo: number;
  mantenimientosPendientes: number; inventariosAbiertos: number;
}
export interface DashboardActivity {
  id: number; type: string; description: string | null; date: string;
  asset: { code: string; brand: string | null; model: string | null };
  destinationWorker: string | null; user: string | null;
}
export interface DashboardSummary {
  kpis: DashboardKpis; activosPorTipo: DashboardDistribution[];
  activosPorEstado: DashboardDistribution[]; alertas: DashboardAlerts;
  actividadReciente: DashboardActivity[];
}
