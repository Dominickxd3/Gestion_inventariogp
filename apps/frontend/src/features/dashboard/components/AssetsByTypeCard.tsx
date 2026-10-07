import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardDistribution } from '../types/dashboard.types';
const formatter = new Intl.NumberFormat('es-PE');
export function AssetsByTypeCard({ data }: { data: DashboardDistribution[] }) {
  const present = data.filter(item => item.count > 0);
  return <section className="dashboard-card chart-card" aria-labelledby="assets-type-title"><h2 id="assets-type-title">Activos por tipo</h2>{present.length === 0 ? <p className="empty-state">No hay activos registrados.</p> : <><div className="chart-area" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><BarChart data={present} margin={{ top: 12, right: 8, left: -18, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip formatter={value => formatter.format(Number(value))} /><Bar dataKey="count" fill="#47765c" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><ul className="chart-data-list">{present.map(item => <li key={item.label}><span>{item.label}</span><strong>{formatter.format(item.count)}</strong></li>)}</ul></>}</section>;
}
