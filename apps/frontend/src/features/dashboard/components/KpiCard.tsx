const formatter = new Intl.NumberFormat('es-PE');
interface KpiCardProps { label: string; value: number; icon: string }
export function KpiCard({ label, value, icon }: KpiCardProps) {
  return <article className="kpi-card"><div className="kpi-icon"><i className={icon} aria-hidden="true" /></div><div><p>{label}</p><strong>{formatter.format(value)}</strong></div></article>;
}
