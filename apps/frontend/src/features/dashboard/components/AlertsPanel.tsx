import { DashboardSummary } from '../types/dashboard.types';
const formatter = new Intl.NumberFormat('es-PE');
const definitions = [
  { key: 'lineasSinResponsable', label: 'Líneas sin responsable', description: 'Líneas activas pendientes de asignación', icon: 'pi pi-user-minus' },
  { key: 'lineasSinEquipo', label: 'Líneas sin equipo', description: 'Líneas activas sin equipo vigente', icon: 'pi pi-mobile' },
  { key: 'mantenimientosPendientes', label: 'Mantenimientos pendientes', description: 'Pendientes o en proceso', icon: 'pi pi-wrench' },
  { key: 'inventariosAbiertos', label: 'Inventarios abiertos', description: 'Abiertos o en proceso', icon: 'pi pi-box' },
] as const;
export function AlertsPanel({ alerts }: { alerts: DashboardSummary['alertas'] }) {
  return <section className="dashboard-card alerts-card" aria-labelledby="alerts-title"><h2 id="alerts-title">Alertas operativas</h2><div className="alerts-list">{definitions.map(item => <article key={item.key} className="alert-item"><i className={item.icon} aria-hidden="true" /><div><strong>{item.label}</strong><p>{item.description}</p></div><span>{formatter.format(alerts[item.key])}</span></article>)}</div></section>;
}
