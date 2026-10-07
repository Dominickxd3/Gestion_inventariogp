import { useAuthStore } from '../../stores/auth.store';
export function HomePage() {
  const user = useAuthStore(state => state.user);
  if (!user) return null;
  return <><header className="page-header"><p className="eyebrow">GESTIÓN TI</p><h1>Inicio</h1><p>Gestión de infraestructura tecnológica</p></header><section className="welcome-card"><div><p className="eyebrow">SESIÓN ACTIVA</p><h2>Bienvenido, {user.name}</h2><p>Tu acceso se encuentra vigente y los permisos han sido validados.</p></div><dl className="session-summary"><div><dt>Rol</dt><dd>{user.role}</dd></div><div><dt>Permisos</dt><dd>{user.permissions.length} activos</dd></div></dl></section></>;
}
