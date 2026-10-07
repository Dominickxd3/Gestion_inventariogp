import { useQuery } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { api } from '../services/api';

export function App() {
  const health = useQuery({
    queryKey: ['health', 'ready'],
    queryFn: async () => (await api.get<{ status: string }>('/health/ready')).data,
  });
  return <div className="workspace">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">GP</span><div>Grupo Pecuario<small>Gestión TI</small></div></div>
      <div className="nav-label">GENERAL</div>
      <div className="nav-active"><i className="pi pi-server" aria-hidden="true" /> Estado del sistema</div>
      <div className="sidebar-footer">Plataforma interna<small>Infraestructura · Fase 1</small></div>
    </aside>
    <main>
      <header><p className="eyebrow">GESTIÓN TECNOLÓGICA</p><h1>Estado del sistema</h1><p>Base técnica para la gestión de activos y telefonía de Grupo Pecuario.</p></header>
      <section className="card" aria-labelledby="connection-title">
        <div className="card-heading"><h2 id="connection-title">Conexión con el servidor</h2><Tag severity={health.isPending ? 'info' : health.isError ? 'warning' : 'success'} value={health.isPending ? 'Verificando' : health.isError ? 'No disponible' : 'Disponible'} /></div>
        <p>{health.isError ? 'No se pudo verificar la conexión. Revisa la configuración del backend y vuelve a intentar.' : health.isPending ? 'Comprobando la disponibilidad de la API y SQL Server…' : 'La API responde y SQL Server está disponible.'}</p>
        <Button label="Verificar conexión" icon="pi pi-refresh" outlined loading={health.isFetching} onClick={() => void health.refetch()} />
      </section>
      <section className="card"><h2>Implementación por fases</h2><p>La infraestructura está preparada. Los siguientes módulos incorporarán el acceso corporativo, los permisos y la gestión operativa.</p><p className="muted">Los datos empresariales se mostrarán después de implementar la autenticación.</p></section>
    </main>
  </div>;
}

