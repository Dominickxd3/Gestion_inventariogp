import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { useAuthStore } from '../../../stores/auth.store';
import { MantenimientoStatusTag } from '../components/MantenimientoStatusTag';
import { useFinalizarMantenimiento, useMantenimiento } from '../hooks/useMantenimientos';
import { FinalizarMantenimientoPayload } from '../types/mantenimientos.types';

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));

export default function MantenimientoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mantenimientoId = Number(id || 0);
  const nav = useNavigate();
  const permissions = useAuthStore(s => s.permissions);
  const canEdit = permissions.includes('MANTENIMIENTO_EDITAR');

  const { data: item, isPending, isError, refetch } = useMantenimiento(mantenimientoId);
  const finalizarMutation = useFinalizarMantenimiento(mantenimientoId);

  // Dialog state
  const [showFinalizarDialog, setShowFinalizarDialog] = useState(false);
  const [finalizarPayload, setFinalizarPayload] = useState<FinalizarMantenimientoPayload>({
    trabajoRealizado: '',
    diagnostico: '',
    costo: undefined,
    proximoMantenimiento: '',
    observaciones: '',
  });
  const [dialogError, setDialogError] = useState<string | null>(null);

  if (isPending) return <Skeleton height="450px" />;
  if (isError || !item) {
    return (
      <section className="dashboard-error">
        <h2>Mantenimiento no encontrado.</h2>
        <Button label="Volver a Mantenimientos" outlined onClick={() => nav('/mantenimientos')} />
      </section>
    );
  }

  const isFinalizable = item.estado === 'PENDIENTE' || item.estado === 'EN_PROCESO';

  const handleOpenFinalizar = () => {
    setFinalizarPayload({
      trabajoRealizado: item.trabajoRealizado || '',
      diagnostico: item.diagnostico || '',
      costo: item.costo ?? undefined,
      proximoMantenimiento: item.proximoMantenimiento || '',
      observaciones: '',
    });
    setDialogError(null);
    setShowFinalizarDialog(true);
  };

  const handleConfirmFinalizar = async () => {
    setDialogError(null);
    try {
      await finalizarMutation.mutateAsync({
        trabajoRealizado: finalizarPayload.trabajoRealizado || undefined,
        diagnostico: finalizarPayload.diagnostico || undefined,
        costo: finalizarPayload.costo,
        proximoMantenimiento: finalizarPayload.proximoMantenimiento || undefined,
        observaciones: finalizarPayload.observaciones || undefined,
      });
      setShowFinalizarDialog(false);
      refetch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDialogError(e.response?.data?.message || 'Error al finalizar el mantenimiento.');
    }
  };

  const asset = item.activoCompleto || item.activo;

  return (
    <div className="telefonia-page">
      <header className="page-header module-header">
        <div>
          <p className="eyebrow">DETALLE DE MANTENIMIENTO</p>
          <h1>Intervención #{item.id}</h1>
          <p>
            {item.tipo} para activo <strong>{asset.codigo}</strong>
          </p>
        </div>
        <div className="detail-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <MantenimientoStatusTag estado={item.estado} />
          {canEdit && isFinalizable && (
            <>
              <Button
                label="Editar"
                icon="pi pi-pencil"
                outlined
                onClick={() => nav(`/mantenimientos/${item.id}/editar`)}
              />
              <Button
                label="Finalizar mantenimiento"
                icon="pi pi-check"
                severity="success"
                onClick={handleOpenFinalizar}
              />
            </>
          )}
          <Button label="Volver" icon="pi pi-arrow-left" text onClick={() => nav('/mantenimientos')} />
        </div>
      </header>

      <div className="detail-grid">
        {/* Asset summary card */}
        <section className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Activo intervenido</h2>
            <Button
              label="Ver activo"
              icon="pi pi-external-link"
              text
              size="small"
              onClick={() => nav(`/activos/${item.idActivo}`)}
            />
          </div>
          <dl className="details-list">
            <div>
              <dt>Código de activo</dt>
              <dd>
                <strong>{asset.codigo}</strong>
              </dd>
            </div>
            <div>
              <dt>Tipo de equipo</dt>
              <dd>{show(asset.tipo)}</dd>
            </div>
            <div>
              <dt>Marca / Modelo</dt>
              <dd>{show([asset.marca, asset.modelo].filter(Boolean).join(' '))}</dd>
            </div>
            <div>
              <dt>Número de serie</dt>
              <dd>{show(asset.numeroSerie)}</dd>
            </div>
            <div>
              <dt>Estado del activo</dt>
              <dd>
                <Tag value={asset.estado.nombre} severity="info" />
              </dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{show(item.activoCompleto?.ubicacionTexto || [item.activo.sede, item.activo.area].filter(Boolean).join(' / '))}</dd>
            </div>
            <div>
              <dt>Responsable asignado</dt>
              <dd>{show(item.activoCompleto?.responsableActual)}</dd>
            </div>
          </dl>
        </section>

        {/* Maintenance dates & cost */}
        <section className="form-section">
          <h2>Datos de la intervención</h2>
          <dl className="details-list">
            <div>
              <dt>Tipo de servicio</dt>
              <dd>
                <Tag
                  value={item.tipo}
                  severity={item.tipo === 'CORRECTIVO' ? 'warning' : 'info'}
                />
              </dd>
            </div>
            <div>
              <dt>Proveedor / Técnico</dt>
              <dd>{show(item.proveedor)}</dd>
            </div>
            <div>
              <dt>Costo</dt>
              <dd>
                <strong>{item.costo !== null && item.costo !== undefined ? money.format(item.costo) : '—'}</strong>
              </dd>
            </div>
            <div>
              <dt>Fecha programada</dt>
              <dd>{show(item.fechaProgramada)}</dd>
            </div>
            <div>
              <dt>Fecha de inicio</dt>
              <dd>{item.fechaInicio ? new Date(item.fechaInicio).toLocaleDateString('es-PE') : '—'}</dd>
            </div>
            <div>
              <dt>Fecha de fin</dt>
              <dd>{item.fechaFin ? new Date(item.fechaFin).toLocaleDateString('es-PE') : '—'}</dd>
            </div>
            <div>
              <dt>Próximo mantenimiento</dt>
              <dd>{show(item.proximoMantenimiento)}</dd>
            </div>
            <div>
              <dt>Registrado por</dt>
              <dd>{show(item.usuarioRegistro?.nombre)}</dd>
            </div>
          </dl>
        </section>

        {/* Technical findings */}
        <section className="form-section form-field--wide">
          <h2>Informe Técnico</h2>
          <dl className="details-list">
            <div>
              <dt>Problema reportado</dt>
              <dd>{show(item.problemaReportado)}</dd>
            </div>
            <div>
              <dt>Diagnóstico técnico</dt>
              <dd>{show(item.diagnostico)}</dd>
            </div>
            <div>
              <dt>Trabajo realizado</dt>
              <dd>{show(item.trabajoRealizado)}</dd>
            </div>
            <div>
              <dt>Observaciones generales</dt>
              <dd>{show(item.observaciones)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Finalizar Dialog */}
      <Dialog
        header="Finalizar Mantenimiento"
        visible={showFinalizarDialog}
        style={{ width: '90vw', maxWidth: '600px' }}
        onHide={() => setShowFinalizarDialog(false)}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button label="Cancelar" severity="secondary" text onClick={() => setShowFinalizarDialog(false)} />
            <Button
              label="Confirmar Finalización"
              icon="pi pi-check"
              severity="success"
              loading={finalizarMutation.isPending}
              onClick={handleConfirmFinalizar}
            />
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <p style={{ color: 'var(--text-color-secondary)' }}>
            Al finalizar la intervención, el estado del activo se restaurará automáticamente a su estado coherente
            (ASIGNADO si tiene una asignación activa, o DISPONIBLE en caso contrario).
          </p>

          {dialogError && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px' }}>
              {dialogError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="finalDiagnostico">Diagnóstico final</label>
            <InputTextarea
              id="finalDiagnostico"
              value={finalizarPayload.diagnostico || ''}
              onChange={e => setFinalizarPayload(prev => ({ ...prev, diagnostico: e.target.value }))}
              rows={2}
              maxLength={1500}
              placeholder="Diagnóstico técnico confirmado..."
            />
          </div>

          <div className="form-field">
            <label htmlFor="finalTrabajo">Trabajo realizado *</label>
            <InputTextarea
              id="finalTrabajo"
              value={finalizarPayload.trabajoRealizado || ''}
              onChange={e => setFinalizarPayload(prev => ({ ...prev, trabajoRealizado: e.target.value }))}
              rows={3}
              maxLength={2500}
              placeholder="Detalle de trabajos efectuados..."
            />
          </div>

          <div className="form-field">
            <label htmlFor="finalCosto">Costo final (S/)</label>
            <InputNumber
              id="finalCosto"
              value={finalizarPayload.costo}
              onValueChange={e => setFinalizarPayload(prev => ({ ...prev, costo: e.value || undefined }))}
              mode="currency"
              currency="PEN"
              locale="es-PE"
              min={0}
            />
          </div>

          <div className="form-field">
            <label htmlFor="finalProximo">Próximo mantenimiento sugerido</label>
            <InputText
              id="finalProximo"
              type="date"
              value={finalizarPayload.proximoMantenimiento || ''}
              onChange={e => setFinalizarPayload(prev => ({ ...prev, proximoMantenimiento: e.target.value }))}
            />
          </div>

          <div className="form-field">
            <label htmlFor="finalObs">Observaciones de cierre</label>
            <InputTextarea
              id="finalObs"
              value={finalizarPayload.observaciones || ''}
              onChange={e => setFinalizarPayload(prev => ({ ...prev, observaciones: e.target.value }))}
              rows={2}
              maxLength={1500}
              placeholder="Notas finales..."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
