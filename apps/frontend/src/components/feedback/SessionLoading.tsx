import { ProgressSpinner } from 'primereact/progressspinner';
export function SessionLoading() {
  return <main className="session-loading" aria-live="polite"><ProgressSpinner strokeWidth="3" /><p>Validando sesión…</p></main>;
}
