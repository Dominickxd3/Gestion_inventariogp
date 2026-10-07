import { Skeleton } from 'primereact/skeleton';
export function DashboardSkeleton() {
  return <div aria-label="Cargando resumen" className="dashboard-skeleton"><div className="kpi-grid">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} height="104px" borderRadius="10px" />)}</div><div className="analytics-grid"><Skeleton height="330px" borderRadius="10px" /><Skeleton height="330px" borderRadius="10px" /></div><div className="dashboard-lower-grid"><Skeleton height="300px" borderRadius="10px" /><Skeleton height="300px" borderRadius="10px" /></div></div>;
}
