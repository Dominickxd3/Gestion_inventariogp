import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
export function NotFoundPage() {
  const navigate = useNavigate();
  return <main className="status-page"><div className="status-code">404</div><h1>Página no encontrada</h1><p>La dirección solicitada no existe o fue movida.</p><Button label="Volver al inicio" icon="pi pi-arrow-left" outlined onClick={() => navigate('/inicio')} /></main>;
}
