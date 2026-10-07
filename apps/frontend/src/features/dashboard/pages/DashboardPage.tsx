import { Button } from 'primereact/button';
import { AlertsPanel } from '../components/AlertsPanel';
import { AssetsByStatusCard } from '../components/AssetsByStatusCard';
import { AssetsByTypeCard } from '../components/AssetsByTypeCard';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { KpiCard } from '../components/KpiCard';
import { RecentActivity } from '../components/RecentActivity';
import { useDashboard } from '../hooks/useDashboard';

const kpis = [
  { key: 'totalActivos', label: 'Total activos', icon: 'pi pi-desktop' },
  { key: 'asignados', label: 'Asignados', icon: 'pi pi-user' },
  { key: 'disponibles', label: 'Disponibles', icon: 'pi pi-check-circle' },
  { key: 'mantenimiento', label: 'En mantenimiento', icon: 'pi pi-wrench' },
  { key: 'observados', label: 'Observados', icon: 'pi pi-eye' },
  { key: 'lineasActivas', label: 'Líneas activas', icon: 'pi pi-mobile' },
] as const;

export default function DashboardPage() {
  const dashboard = useDashboard();
  return <><DashboardHeader />{dashboard.isPending ? <DashboardSkeleton /> : dashboard.isError ? <section className="dashboard-error"><i className="pi pi-exclamation-circle" aria-hidden="true" /><h2>No se pudo cargar el resumen.</h2><p>Verifica la conexión e inténtalo nuevamente.</p><Button label="Reintentar" icon="pi pi-refresh" outlined loading={dashboard.isFetching} onClick={() => void dashboard.refetch()} /></section> : <div className="dashboard-content">
    <section className="kpi-grid" aria-label="Indicadores principales">{kpis.map(item => <KpiCard key={item.key} label={item.label} value={dashboard.data.kpis[item.key]} icon={item.icon} />)}</section>
    <div className="analytics-grid"><AssetsByTypeCard data={dashboard.data.activosPorTipo} /><AssetsByStatusCard data={dashboard.data.activosPorEstado} /></div>
    <div className="dashboard-lower-grid"><AlertsPanel alerts={dashboard.data.alertas} /><RecentActivity activity={dashboard.data.actividadReciente} /></div>
  </div>}</>;
}
