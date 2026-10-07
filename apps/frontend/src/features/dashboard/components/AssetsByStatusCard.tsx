import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardDistribution } from '../types/dashboard.types';
const colors = ['#356a4d', '#718d7c', '#9caea3', '#c1ccc5', '#526c5c', '#83988b'];
const formatter = new Intl.NumberFormat('es-PE');
export function AssetsByStatusCard({ data }: { data: DashboardDistribution[] }) {
  const present = data.filter(item => item.count > 0);
  return <section className="dashboard-card chart-card" aria-labelledby="assets-status-title"><h2 id="assets-status-title">Activos por estado</h2>{present.length === 0 ? <p className="empty-state">No hay activos registrados.</p> : <div className="status-chart-layout"><div className="chart-area chart-area--pie" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={present} dataKey="count" nameKey="label" innerRadius={48} outerRadius={78} paddingAngle={2}>{present.map((item, index) => <Cell key={item.label} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={value => formatter.format(Number(value))} /></PieChart></ResponsiveContainer></div><ul className="chart-legend">{present.map((item, index) => <li key={item.label}><span className="legend-dot" data-index={index % colors.length} /><span>{item.label}</span><strong>{formatter.format(item.count)}</strong></li>)}</ul></div>}</section>;
}
