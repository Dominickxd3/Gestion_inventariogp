import { Tag } from 'primereact/tag';
import { EstadoMantenimiento } from '../types/mantenimientos.types';

interface Props {
  estado: EstadoMantenimiento;
}

export function MantenimientoStatusTag({ estado }: Props) {
  let severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' = 'secondary';
  let label: string = estado;

  switch (estado) {
    case 'PENDIENTE':
      severity = 'warning';
      label = 'Pendiente';
      break;
    case 'EN_PROCESO':
      severity = 'info';
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
