import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { TabPanel, TabView } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { useAuthStore } from '../../../stores/auth.store';
import {
  useAsignarResponsable,
  useAsociarEquipo,
  useCambiarEquipo,
  useCambiarResponsable,
  useEquiposDisponibles,
  useLiberarResponsable,
  useLinea,
  usePlanes,
  useRetirarEquipo,
  useTelefoniaTrabajadores,
  useUpdateLinea,
} from '../hooks/useTelefonia';
import { HistorialEquipoItem, HistorialResponsableItem } from '../types/telefonia.types';

const formatDate = (v?: string | null) =>
  v ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(v)) : '—';

const formatDateTime = (v?: string | null) =>
  v ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : '—';

const estadoSeverities: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
  ACTIVA: 'success',
  DISPONIBLE: 'info',
  SUSPENDIDA: 'warning',
  BAJA: 'danger',
  ROBADA: 'danger',
  PERDIDA: 'danger',
};

export default function LineaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const idLinea = Number(id);
  const nav = useNavigate();
  const permissions = useAuthStore((s) => s.permissions);
  const canEdit = permissions.includes('LINEAS_EDITAR');

  const lineaQuery = useLinea(idLinea);

  // Modals state
  const [modalType, setModalType] = useState<
    'asignarResp' | 'cambiarResp' | 'liberarResp' | 'asociarEq' | 'cambiarEq' | 'retirarEq' | 'editarLinea' | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states for modals
  const [workerSearch, setWorkerSearch] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | undefined>();
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [equipoSearch, setEquipoSearch] = useState('');
  const [selectedActivoId, setSelectedActivoId] = useState<number | undefined>();

  const [editEstado, setEditEstado] = useState<string>('ACTIVA');
  const [editPlanId, setEditPlanId] = useState<number | undefined>();
  const [editIccid, setEditIccid] = useState('');
  const [editObservaciones, setEditObservaciones] = useState('');

  // Sub-queries for modals
  const workers = useTelefoniaTrabajadores(workerSearch);
  const equipos = useEquiposDisponibles(equipoSearch);
  const planes = usePlanes(lineaQuery.data?.operador?.id);

  // Mutations
  const asignarRespMut = useAsignarResponsable(idLinea);
  const cambiarRespMut = useCambiarResponsable(idLinea);
  const liberarRespMut = useLiberarResponsable(idLinea);
  const asociarEqMut = useAsociarEquipo(idLinea);
  const cambiarEqMut = useCambiarEquipo(idLinea);
  const retirarEqMut = useRetirarEquipo(idLinea);
  const updateLineaMut = useUpdateLinea(idLinea);

  if (lineaQuery.isPending) return <Skeleton height="550px" />;
  if (lineaQuery.isError || !lineaQuery.data) {
    return (
      <section className="dashboard-error">
        <h1>No se pudo cargar la línea móvil #{idLinea}.</h1>
        <Button label="Volver a telefonía" onClick={() => nav('/telefonia')} />
      </section>
    );
  }

  const d = lineaQuery.data;

  const closeModal = () => {
    setModalType(null);
    setActionError(null);
    setWorkerSearch('');
    setSelectedWorkerId(undefined);
    setMotivo('');
    setObservaciones('');
    setEquipoSearch('');
    setSelectedActivoId(undefined);
  };

  const openEditarLinea = () => {
    setEditEstado(d.estado);
    setEditPlanId(d.plan?.id);
    setEditIccid(d.iccid ?? '');
    setEditObservaciones(d.observaciones ?? '');
    setActionError(null);
    setModalType('editarLinea');
  };

  // Submit handlers
  const handleAsignarResponsable = async () => {
    if (!selectedWorkerId) {
      setActionError('Debe seleccionar un trabajador.');
      return;
    }
    try {
      await asignarRespMut.mutateAsync({
        idTrabajador: selectedWorkerId,
        motivo: motivo.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      });
      closeModal();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al asignar responsable.');
    }
  };

  const handleCambiarResponsable = async () => {
    if (!selectedWorkerId) {
      setActionError('Debe seleccionar el nuevo trabajador.');
      return;
    }
    if (!motivo.trim()) {
      setActionError('El motivo del cambio es obligatorio.');
      return;
    }
    try {
      await cambiarRespMut.mutateAsync({
        idTrabajador: selectedWorkerId,
        motivoCambio: motivo.trim(),
        observaciones: observaciones.trim() || undefined,
      });
      closeModal();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al cambiar responsable.');
    }
  };

  const handleLiberarResponsable = async () => {
    try {
      await liberarRespMut.mutateAsync({
        motivo: motivo.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      });
      closeModal();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al liberar responsable.');
    }
  };

  const handleAsociarEquipo = async () => {
    if (!selectedActivoId) {
      setActionError('Debe seleccionar un equipo celular.');
      return;
    }
    try {
      await asociarEqMut.mutateAsync({
        idActivo: selectedActivoId,
        observaciones: observaciones.trim() || undefined,
      });
      closeModal();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al asociar equipo.');
    }
  };

  const handleCambiarEquipo = async () => {
    if (!selectedActivoId) {
      setActionError('Debe seleccionar el nuevo equipo celular.');
      return;
    }
    try {
      await cambiarEqMut.mutateAsync({
        idActivo: selectedActivoId,
        observaciones: observaciones.trim() || undefined,
      });
      closeModal();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al cambiar equipo.');
    }
  };

  const handleRetirarEquipo = async () => {
    try {
      await retirarEqMut.mutateAsync({
        motivo: motivo.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      });
      closeModal();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al retirar equipo.');
    }
  };

  const handleUpdateLinea = async () => {
    try {
      await updateLineaMut.mutateAsync({
        estado: editEstado,
        idPlan: editPlanId,
        iccid: editIccid.trim() || undefined,
        observaciones: editObservaciones.trim() || undefined,
      });
      closeModal();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al actualizar línea.');
    }
  };

  const isMutating =
    asignarRespMut.isPending ||
    cambiarRespMut.isPending ||
    liberarRespMut.isPending ||
    asociarEqMut.isPending ||
    cambiarEqMut.isPending ||
    retirarEqMut.isPending ||
    updateLineaMut.isPending;

  return (
    <>
      <header className="page-header module-header">
        <div>
          <button
            type="button"
            className="link-button"
            onClick={() => nav('/telefonia')}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, marginBottom: '6px' }}
          >
            ← Volver a Telefonía
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1>{d.numero}</h1>
            <Tag value={d.estado} severity={estadoSeverities[d.estado] ?? 'secondary'} />
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {d.operador?.nombre ?? 'Sin operador'} {d.plan ? `· Plan: ${d.plan.nombre}` : ''}
          </p>
        </div>

        {canEdit && (
          <div className="detail-actions">
            <Button label="Editar línea" icon="pi pi-pencil" outlined onClick={openEditarLinea} />
          </div>
        )}
      </header>

      {/* Banner de inconsistencias o advertencias */}
      {d.advertencias && d.advertencias.length > 0 && (
        <section className="warning-banner" role="alert">
          <div className="warning-title">
            <i className="pi pi-exclamation-triangle" />
            <span>Advertencias de consistencia en la línea</span>
          </div>
          <ul>
            {d.advertencias.map((adv) => (
              <li key={adv.codigo}>{adv.mensaje}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Grid con detalles principales */}
      <div className="detail-grid">
        {/* Tarjeta Información General */}
        <section className="form-section">
          <h2>Información de la Línea</h2>
          <dl className="details-list">
            <div>
              <dt>Número</dt>
              <dd><strong>{d.numero}</strong></dd>
            </div>
            <div>
              <dt>Operador</dt>
              <dd>{d.operador?.nombre ?? '—'}</dd>
            </div>
            <div>
              <dt>Plan Actual</dt>
              <dd>
                {d.plan?.nombre ?? '—'}
                {d.plan?.precioMensual ? ` (S/ ${Number(d.plan.precioMensual).toFixed(2)}/mes)` : ''}
              </dd>
            </div>
            <div>
              <dt>ICCID (SIM)</dt>
              <dd>{d.iccid || '—'}</dd>
            </div>
            <div>
              <dt>Fecha de Alta</dt>
              <dd>{formatDate(d.fechaAlta)}</dd>
            </div>
            {d.fechaBaja && (
              <div>
                <dt>Fecha de Baja</dt>
                <dd>{formatDate(d.fechaBaja)}</dd>
              </div>
            )}
            <div className="form-field--wide">
              <dt>Observaciones</dt>
              <dd>{d.observaciones || '—'}</dd>
            </div>
          </dl>
        </section>

        {/* Tarjeta Responsable Actual */}
        <section className="form-section">
          <div className="card-with-actions">
            <h2>Responsable Actual</h2>
            {canEdit && (
              <div className="action-buttons-group">
                {d.responsableActual ? (
                  <>
                    <Button
                      label="Cambiar"
                      icon="pi pi-user-edit"
                      size="small"
                      outlined
                      onClick={() => {
                        setActionError(null);
                        setModalType('cambiarResp');
                      }}
                    />
                    <Button
                      label="Liberar"
                      icon="pi pi-user-minus"
                      size="small"
                      severity="danger"
                      outlined
                      onClick={() => {
                        setActionError(null);
                        setModalType('liberarResp');
                      }}
                    />
                  </>
                ) : (
                  <Button
                    label="Asignar Responsable"
                    icon="pi pi-user-plus"
                    size="small"
                    onClick={() => {
                      setActionError(null);
                      setModalType('asignarResp');
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {d.responsableActual ? (
            <dl className="details-list">
              <div>
                <dt>Colaborador</dt>
                <dd><strong>{d.responsableActual.nombre}</strong></dd>
              </div>
              <div>
                <dt>DNI</dt>
                <dd>{d.responsableActual.dni}</dd>
              </div>
              <div>
                <dt>Cargo</dt>
                <dd>{d.responsableActual.cargo || '—'}</dd>
              </div>
              <div>
                <dt>Área / Sede</dt>
                <dd>{[d.responsableActual.area, d.responsableActual.sede].filter(Boolean).join(' · ') || '—'}</dd>
              </div>
              <div>
                <dt>Fecha Asignación</dt>
                <dd>{formatDateTime(d.responsableActual.fechaInicio)}</dd>
              </div>
              <div>
                <dt>Motivo</dt>
                <dd>{d.responsableActual.motivo || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty-copy">No hay colaborador asignado a esta línea actualmente.</p>
          )}
        </section>

        {/* Tarjeta Equipo Celular Asociado */}
        <section className="form-section">
          <div className="card-with-actions">
            <h2>Equipo Celular Asociado</h2>
            {canEdit && (
              <div className="action-buttons-group">
                {d.equipoActual ? (
                  <>
                    <Button
                      label="Cambiar equipo"
                      icon="pi pi-refresh"
                      size="small"
                      outlined
                      onClick={() => {
                        setActionError(null);
                        setModalType('cambiarEq');
                      }}
                    />
                    <Button
                      label="Retirar equipo"
                      icon="pi pi-times"
                      size="small"
                      severity="danger"
                      outlined
                      onClick={() => {
                        setActionError(null);
                        setModalType('retirarEq');
                      }}
                    />
                  </>
                ) : (
                  <Button
                    label="Asociar Equipo"
                    icon="pi pi-mobile"
                    size="small"
                    onClick={() => {
                      setActionError(null);
                      setModalType('asociarEq');
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {d.equipoActual ? (
            <dl className="details-list">
              <div>
                <dt>Código Patrimonial</dt>
                <dd>
                  <button
                    type="button"
                    onClick={() => nav(`/activos/${d.equipoActual?.idActivo}`)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                  >
                    {d.equipoActual.codigo}
                  </button>
                </dd>
              </div>
              <div>
                <dt>Marca / Modelo</dt>
                <dd>{[d.equipoActual.marca, d.equipoActual.modelo].filter(Boolean).join(' ')}</dd>
              </div>
              <div>
                <dt>IMEI 1</dt>
                <dd>{d.equipoActual.imei1 || '—'}</dd>
              </div>
              <div>
                <dt>IMEI 2</dt>
                <dd>{d.equipoActual.imei2 || '—'}</dd>
              </div>
              <div>
                <dt>Fecha Asociación</dt>
                <dd>{formatDateTime(d.equipoActual.fechaInicio)}</dd>
              </div>
              <div>
                <dt>Observaciones</dt>
                <dd>{d.equipoActual.observaciones || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty-copy">No hay equipo celular vinculado a esta línea.</p>
          )}
        </section>

        {/* Tarjeta Financiamiento si existe */}
        {d.financiamientoActual && (
          <section className="form-section">
            <h2>Financiamiento Activo del Celular</h2>
            <dl className="details-list">
              <div>
                <dt>Folio</dt>
                <dd>{d.financiamientoActual.numeroFolio || '—'}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd><Tag value={d.financiamientoActual.estado} severity="success" /></dd>
              </div>
              <div>
                <dt>Cuotas</dt>
                <dd>{d.financiamientoActual.cantidadCuotas} cuotas</dd>
              </div>
              <div>
                <dt>Monto Cuota</dt>
                <dd>S/ {Number(d.financiamientoActual.montoCuota).toFixed(2)}</dd>
              </div>
              <div>
                <dt>Monto Total</dt>
                <dd><strong>S/ {Number(d.financiamientoActual.montoTotal).toFixed(2)}</strong></dd>
              </div>
            </dl>
          </section>
        )}
      </div>

      {/* Historiales de Responsables y de Equipos */}
      <section className="form-section" style={{ marginTop: '24px' }}>
        <TabView>
          <TabPanel header="Historial de Responsables">
            <DataTable
              value={d.historialResponsables}
              emptyMessage="No hay registros históricos de asignación de responsables."
              tableStyle={{ minWidth: '800px' }}
            >
              <Column
                header="Estado"
                body={(r: HistorialResponsableItem) => (
                  <Tag value={r.vigente ? 'VIGENTE' : 'FINALIZADO'} severity={r.vigente ? 'success' : 'secondary'} />
                )}
              />
              <Column field="nombre" header="Trabajador" />
              <Column field="dni" header="DNI" />
              <Column field="cargo" header="Cargo" />
              <Column field="area" header="Área" />
              <Column header="Desde" body={(r: HistorialResponsableItem) => formatDateTime(r.fechaInicio)} />
              <Column header="Hasta" body={(r: HistorialResponsableItem) => formatDateTime(r.fechaFin)} />
              <Column field="motivo" header="Motivo" />
            </DataTable>
          </TabPanel>

          <TabPanel header="Historial de Equipos">
            <DataTable
              value={d.historialEquipos}
              emptyMessage="No hay registros históricos de vinculación de equipos."
              tableStyle={{ minWidth: '800px' }}
            >
              <Column
                header="Estado"
                body={(r: HistorialEquipoItem) => (
                  <Tag value={r.vigente ? 'VIGENTE' : 'FINALIZADO'} severity={r.vigente ? 'success' : 'secondary'} />
                )}
              />
              <Column field="codigo" header="Código Celular" />
              <Column
                header="Equipo"
                body={(r: HistorialEquipoItem) => [r.marca, r.modelo].filter(Boolean).join(' ')}
              />
              <Column field="imei1" header="IMEI" />
              <Column header="Desde" body={(r: HistorialEquipoItem) => formatDateTime(r.fechaInicio)} />
              <Column header="Hasta" body={(r: HistorialEquipoItem) => formatDateTime(r.fechaFin)} />
              <Column field="observaciones" header="Observaciones" />
            </DataTable>
          </TabPanel>
        </TabView>
      </section>

      {/* ─── MODALES DE ACCIONES ─── */}

      {/* Modal: Asignar o Cambiar Responsable */}
      <Dialog
        header={modalType === 'cambiarResp' ? 'Cambiar Responsable de Línea' : 'Asignar Responsable a Línea'}
        visible={modalType === 'asignarResp' || modalType === 'cambiarResp'}
        onHide={closeModal}
        style={{ width: '480px' }}
        modal
      >
        <div className="dialog-form">
          {actionError && <Message severity="error" text={actionError} />}

          <div className="field">
            <label>Buscar Trabajador (mínimo 2 letras)</label>
            <InputText
              value={workerSearch}
              onChange={(e) => setWorkerSearch(e.target.value)}
              placeholder="Nombre o apellido…"
            />
          </div>

          <div className="field">
            <label>Seleccionar Trabajador</label>
            <Dropdown
              value={selectedWorkerId}
              options={workers.data ?? []}
              optionLabel="nombres"
              optionValue="id"
              itemTemplate={(opt) => (
                <div>
                  <strong>{opt.nombres} {opt.apellidos}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{opt.documentoIdentidad} · {opt.cargo} ({opt.area})</div>
                </div>
              )}
              valueTemplate={(opt) =>
                opt ? `${opt.nombres} ${opt.apellidos} (${opt.documentoIdentidad})` : 'Seleccione un trabajador'
              }
              placeholder="Seleccionar..."
              disabled={!workers.data?.length}
              onChange={(e) => setSelectedWorkerId(e.value)}
            />
          </div>

          <div className="field">
            <label>{modalType === 'cambiarResp' ? 'Motivo del cambio *' : 'Motivo de asignación'}</label>
            <InputText
              value={motivo}
              placeholder="Ej. Reasignación por cambio de área / ingreso"
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Observaciones</label>
            <InputTextarea
              value={observaciones}
              rows={2}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button label="Cancelar" outlined onClick={closeModal} disabled={isMutating} />
            <Button
              label={modalType === 'cambiarResp' ? 'Cambiar Responsable' : 'Asignar'}
              loading={isMutating}
              onClick={modalType === 'cambiarResp' ? handleCambiarResponsable : handleAsignarResponsable}
            />
          </div>
        </div>
      </Dialog>

      {/* Modal: Liberar Responsable */}
      <Dialog
        header="Liberar Responsable de Línea"
        visible={modalType === 'liberarResp'}
        onHide={closeModal}
        style={{ width: '440px' }}
        modal
      >
        <div className="dialog-form">
          {actionError && <Message severity="error" text={actionError} />}
          <p>
            ¿Estás seguro de liberar al responsable actual (<strong>{d.responsableActual?.nombre}</strong>)?
            La línea quedará disponible sin responsable.
          </p>

          <div className="field">
            <label>Motivo</label>
            <InputText value={motivo} placeholder="Ej. Cese de colaborador / renuncia" onChange={(e) => setMotivo(e.target.value)} />
          </div>

          <div className="field">
            <label>Observaciones</label>
            <InputTextarea value={observaciones} rows={2} onChange={(e) => setObservaciones(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button label="Cancelar" outlined onClick={closeModal} disabled={isMutating} />
            <Button label="Confirmar Liberación" severity="danger" loading={isMutating} onClick={handleLiberarResponsable} />
          </div>
        </div>
      </Dialog>

      {/* Modal: Asociar o Cambiar Equipo */}
      <Dialog
        header={modalType === 'cambiarEq' ? 'Cambiar Equipo Celular' : 'Asociar Equipo Celular'}
        visible={modalType === 'asociarEq' || modalType === 'cambiarEq'}
        onHide={closeModal}
        style={{ width: '480px' }}
        modal
      >
        <div className="dialog-form">
          {actionError && <Message severity="error" text={actionError} />}

          <div className="field">
            <label>Buscar Celular Disponible</label>
            <InputText
              value={equipoSearch}
              onChange={(e) => setEquipoSearch(e.target.value)}
              placeholder="Código, marca, modelo o IMEI…"
            />
          </div>

          <div className="field">
            <label>Seleccionar Equipo Celular</label>
            <Dropdown
              value={selectedActivoId}
              options={equipos.data ?? []}
              optionLabel="codigo"
              optionValue="id"
              itemTemplate={(opt) => (
                <div>
                  <strong>{opt.codigo}</strong> · {opt.marca} {opt.modelo}
                  {opt.imei1 && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>IMEI: {opt.imei1}</div>}
                  {opt.responsable && <div style={{ fontSize: '11px', color: '#0284c7' }}>En posesión de: {opt.responsable}</div>}
                </div>
              )}
              valueTemplate={(opt) =>
                opt ? `${opt.codigo} - ${opt.marca} ${opt.modelo}` : 'Seleccione un equipo disponible'
              }
              placeholder="Seleccionar..."
              disabled={!equipos.data?.length}
              onChange={(e) => setSelectedActivoId(e.value)}
            />
          </div>

          <div className="field">
            <label>Observaciones</label>
            <InputTextarea value={observaciones} rows={2} onChange={(e) => setObservaciones(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button label="Cancelar" outlined onClick={closeModal} disabled={isMutating} />
            <Button
              label={modalType === 'cambiarEq' ? 'Cambiar Equipo' : 'Asociar Equipo'}
              loading={isMutating}
              onClick={modalType === 'cambiarEq' ? handleCambiarEquipo : handleAsociarEquipo}
            />
          </div>
        </div>
      </Dialog>

      {/* Modal: Retirar Equipo */}
      <Dialog
        header="Retirar Equipo Celular de la Línea"
        visible={modalType === 'retirarEq'}
        onHide={closeModal}
        style={{ width: '440px' }}
        modal
      >
        <div className="dialog-form">
          {actionError && <Message severity="error" text={actionError} />}
          <p>
            ¿Estás seguro de desvincular el celular <strong>{d.equipoActual?.codigo}</strong> de esta línea?
            El equipo pasará a estar disponible para otra línea.
          </p>

          <div className="field">
            <label>Motivo</label>
            <InputText value={motivo} placeholder="Ej. Cambio de terminal / equipo averiado" onChange={(e) => setMotivo(e.target.value)} />
          </div>

          <div className="field">
            <label>Observaciones</label>
            <InputTextarea value={observaciones} rows={2} onChange={(e) => setObservaciones(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button label="Cancelar" outlined onClick={closeModal} disabled={isMutating} />
            <Button label="Confirmar Retiro" severity="danger" loading={isMutating} onClick={handleRetirarEquipo} />
          </div>
        </div>
      </Dialog>

      {/* Modal: Editar Información de la Línea */}
      <Dialog
        header="Editar Información de la Línea"
        visible={modalType === 'editarLinea'}
        onHide={closeModal}
        style={{ width: '460px' }}
        modal
      >
        <div className="dialog-form">
          {actionError && <Message severity="error" text={actionError} />}

          <div className="field">
            <label>Estado</label>
            <Dropdown
              value={editEstado}
              options={[
                { label: 'ACTIVA', value: 'ACTIVA' },
                { label: 'DISPONIBLE', value: 'DISPONIBLE' },
                { label: 'SUSPENDIDA', value: 'SUSPENDIDA' },
                { label: 'BAJA', value: 'BAJA' },
                { label: 'ROBADA', value: 'ROBADA' },
                { label: 'PERDIDA', value: 'PERDIDA' },
              ]}
              onChange={(e) => setEditEstado(e.value)}
            />
          </div>

          <div className="field">
            <label>Plan Móvil</label>
            <Dropdown
              value={editPlanId}
              options={planes.data ?? []}
              optionLabel="nombre"
              optionValue="id"
              showClear
              placeholder="Seleccionar plan"
              onChange={(e) => setEditPlanId(e.value)}
            />
          </div>

          <div className="field">
            <label>ICCID (Tarjeta SIM)</label>
            <InputText value={editIccid} onChange={(e) => setEditIccid(e.target.value)} />
          </div>

          <div className="field">
            <label>Observaciones</label>
            <InputTextarea value={editObservaciones} rows={3} onChange={(e) => setEditObservaciones(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button label="Cancelar" outlined onClick={closeModal} disabled={isMutating} />
            <Button label="Guardar Cambios" loading={isMutating} onClick={handleUpdateLinea} />
          </div>
        </div>
      </Dialog>
    </>
  );
}
