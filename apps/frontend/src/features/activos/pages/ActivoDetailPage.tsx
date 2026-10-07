import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { useAuthStore } from '../../../stores/auth.store';
import { asignacionesApi } from '../../asignaciones/api/asignaciones.api';
import { mantenimientosApi } from '../../mantenimientos/api/mantenimientos.api';
import { useState } from 'react';
import { AssetStatusTag } from '../components/AssetStatusTag';
import { useActivo } from '../hooks/useActivos';
import { QrModal } from '../../qr/components/QrModal';

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));

export default function ActivoDetailPage() {
  const id = Number(useParams().id);
  const nav = useNavigate();
  const [qrOpen, setQrOpen] = useState(false);
  const permissions = useAuthStore(s => s.permissions);
  const canEdit = permissions.includes('ACTIVOS_EDITAR');
  const canHistory = permissions.includes('ASIGNACIONES_VER');
  const canMantenimiento = permissions.includes('MANTENIMIENTO_VER');

  const asset = useActivo(id);
  const history = useQuery({
    queryKey: ['activo-asignaciones', id],
    queryFn: () => asignacionesApi.assetHistory(id),
    enabled: canHistory && id > 0,
  });

  const mantenimientosHistory = useQuery({
    queryKey: ['activo-mantenimientos', id],
    queryFn: () => mantenimientosApi.getByAsset(id),
    enabled: canMantenimiento && id > 0,
  });

  if (asset.isPending) return <Skeleton height="420px" />;
  if (asset.isError) {
    return (
      <section className="dashboard-error">
        <h2>Activo no encontrado.</h2>
        <Button label="Volver" outlined onClick={() => nav('/activos')} />
      </section>
    );
  }

  const a = asset.data;
  const rows = [
    ['Código', a.codigo],
    ['Tipo', a.tipo.nombre],
    ['Estado', a.estado.nombre],
    ['Marca', a.marca],
    ['Modelo', a.modelo],
    ['Serie', a.numeroSerie],
    ['Ubicación', a.ubicacion ? [a.ubicacion.sede, a.ubicacion.area, a.ubicacion.piso, a.ubicacion.zona, a.ubicacion.puesto].filter(Boolean).join(' / ') : null],
    ['Responsable actual', a.responsableActual],
    ['Fecha de compra', a.fechaCompra?.slice(0, 10)],
    ['Garantía hasta', a.fechaGarantiaHasta?.slice(0, 10)],
    ['Proveedor', a.proveedor],
    ['Costo', a.costoCompra === null ? null : money.format(a.costoCompra)],
    ['Propiedad', a.propiedadEmpresa ? 'Empresa' : 'Tercero'],
    ['Observaciones', a.observaciones],
  ];
  const tech = a.computo ?? a.celular;

  return (
    <>
      <header className="page-header module-header">
        <div>
          <p className="eyebrow">DETALLE DEL ACTIVO</p>
          <h1>{a.codigo}</h1>
          <p>{[a.marca, a.modelo].filter(Boolean).join(' ') || a.tipo.nombre}</p>
        </div>
        <div className="detail-actions">
          <AssetStatusTag code={a.estado.codigo} label={a.estado.nombre} />
          <Button label="Etiqueta QR" icon="pi pi-qrcode" outlined onClick={() => setQrOpen(true)} />
          {canEdit && <Button label="Editar" icon="pi pi-pencil" onClick={() => nav(`/activos/${a.id}/editar`)} />}
        </div>
      </header>

      <div className="detail-grid">
        <section className="form-section">
          <h2>Resumen</h2>
          <dl className="details-list">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{show(value)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="form-section">
          <h2>Especificaciones</h2>
          {tech ? (
            <dl className="details-list">
              {Object.entries(tech).map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replace(/([A-Z])/g, ' $1')}</dt>
                  <dd>{show(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="empty-copy">Este activo no tiene especificaciones técnicas adicionales registradas.</p>
          )}
        </section>

        <section className="form-section form-field--wide">
          <h2>Historial de asignaciones</h2>
          {!canHistory ? (
            <p>No tienes permiso para consultar el historial de asignaciones.</p>
          ) : history.isPending ? (
            <Skeleton height="120px" />
          ) : history.data?.items.length ? (
            <ul className="accessory-list">
              {history.data.items.map(x => (
                <li key={x.idAsignacion}>
                  <button className="history-link" onClick={() => nav(`/asignaciones/${x.idAsignacion}`)}>
                    <strong>{x.trabajador.nombreCompleto}</strong>
                    <span>
                      {new Date(x.fechaEntrega).toLocaleDateString('es-PE')} ·{' '}
                      <Tag value={x.vigente ? 'VIGENTE' : 'DEVUELTA'} severity={x.vigente ? 'success' : 'secondary'} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay asignaciones registradas para este activo.</p>
          )}
        </section>

        <section className="form-section form-field--wide">
          <h2>Historial de mantenimientos</h2>
          {!canMantenimiento ? (
            <p>No tienes permiso para consultar el historial de mantenimientos.</p>
          ) : mantenimientosHistory.isPending ? (
            <Skeleton height="120px" />
          ) : mantenimientosHistory.data?.length ? (
            <ul className="accessory-list">
              {mantenimientosHistory.data.map(m => (
                <li key={m.id}>
                  <button className="history-link" onClick={() => nav(`/mantenimientos/${m.id}`)}>
                    <strong>
                      #{m.id} · {m.tipo}: {m.problemaReportado || 'Intervención técnica'}
                    </strong>
                    <span>
                      {m.fechaInicio ? new Date(m.fechaInicio).toLocaleDateString('es-PE') : m.fechaProgramada || '—'} ·{' '}
                      <Tag
                        value={m.estado}
                        severity={
                          m.estado === 'FINALIZADO'
                            ? 'success'
                            : m.estado === 'EN_PROCESO'
                            ? 'info'
                            : m.estado === 'CANCELADO'
                            ? 'danger'
                            : 'warning'
                        }
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay mantenimientos registrados para este activo.</p>
          )}
        </section>
      </div>
      <QrModal idActivo={a.id} visible={qrOpen} onHide={() => setQrOpen(false)} />
    </>
  );
}
