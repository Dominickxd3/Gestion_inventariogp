export interface DashboardDistribution { label: string; count: number }
export interface DashboardActivity {
  id: number; type: string; description: string | null; date: string;
  asset: { code: string; brand: string | null; model: string | null };
  destinationWorker: string | null; user: string | null;
}
export interface DashboardSummary {
  kpis: { totalActivos: number; asignados: number; disponibles: number; mantenimiento: number; observados: number; lineasActivas: number };
  activosPorTipo: DashboardDistribution[];
  activosPorEstado: DashboardDistribution[];
  alertas: { lineasSinResponsable: number; lineasSinEquipo: number; mantenimientosPendientes: number; inventariosAbiertos: number };
  actividadReciente: DashboardActivity[];
}
