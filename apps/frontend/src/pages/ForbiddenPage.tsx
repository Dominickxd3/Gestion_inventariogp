import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
export function ForbiddenPage() {
  const navigate = useNavigate();
  return <main className="status-page"><div className="status-code">403</div><h1>Acceso denegado</h1><p>No tienes permisos para acceder a este módulo.</p><Button label="Volver al inicio" icon="pi pi-arrow-left" outlined onClick={() => navigate('/inicio')} /></main>;
}
