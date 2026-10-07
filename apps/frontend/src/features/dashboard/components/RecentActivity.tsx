import { DashboardActivity } from '../types/dashboard.types';
const dateFormatter = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
function detail(item: DashboardActivity): string {
  if (item.description) return item.description;
  const asset = [item.asset.code, item.asset.brand, item.asset.model].filter(Boolean).join(' · ');
  return item.destinationWorker ? `${asset} · ${item.destinationWorker}` : asset;
}
export function RecentActivity({ activity }: { activity: DashboardActivity[] }) {
  return <section className="dashboard-card activity-card" aria-labelledby="activity-title"><h2 id="activity-title">Actividad reciente</h2>{activity.length === 0 ? <p className="empty-state">No hay actividad reciente.</p> : <ol className="activity-list">{activity.map(item => <li key={item.id}><div className="activity-icon"><i className="pi pi-arrow-right-arrow-left" aria-hidden="true" /></div><div className="activity-copy"><strong>{item.type}</strong><p>{detail(item)}</p><small>{item.user ?? 'Usuario no registrado'}</small></div><time dateTime={item.date}>{dateFormatter.format(new Date(item.date))}</time></li>)}</ol>}</section>;
}
