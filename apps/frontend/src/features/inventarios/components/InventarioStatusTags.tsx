import { Tag } from 'primereact/tag';
import { EstadoInventario, EstadoVerificacion } from '../types/inventarios.types';

export function InventarioStatusTag({ estado }: { estado: EstadoInventario }) {
  let severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' = 'secondary';
  let label: string = estado;

  switch (estado) {
    case 'ABIERTO':
      severity = 'info';
      label = 'Abierto';
      break;
    case 'EN_PROCESO':
      severity = 'warning';
      label = 'En Proceso';
      break;
    case 'FINALIZADO':
      severity = 'success';
      label = 'Finalizado';
      break;
    case 'CANCELADO':
      severity = 'danger';
      label = 'Cancelado';
      break;
  }

  return <Tag value={label} severity={severity} />;
}

export function VerificacionStatusTag({ estado }: { estado: EstadoVerificacion }) {
  let severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' = 'secondary';
  let label: string = estado;

  switch (estado) {
    case 'PENDIENTE':
      severity = 'secondary';
      label = 'Pendiente';
      break;
    case 'ENCONTRADO':
      severity = 'success';
      label = 'Encontrado';
      break;
    case 'NO_ENCONTRADO':
      severity = 'danger';
      label = 'No Encontrado';
      break;
    case 'CAMBIO_UBICACION':
      severity = 'warning';
      label = 'Cambio de Ubicación';
      break;
    case 'OBSERVADO':
      severity = 'danger';
      label = 'Observado';
      break;
  }

  return <Tag value={label} severity={severity} />;
}
