import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
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
  useCerrarFactura,
  useConciliarFactura,
  useFactura,
  useFacturaDetalles,
  useResumenConciliacion,
  useUpdateDetalleEstado,
  useVincularCuota,
} from '../hooks/useFacturacion';
import {
  CuotaVinculadaItem,
  DiagnosticoConciliacion,
  EstadoConciliacionDetalle,
  FacturaDetalleItem,
} from '../types/facturacion.types';

const formatDate = (v?: string | null) =>
  v ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(v)) : '—';

const formatDateTime = (v?: string | null) =>
  v ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : '—';

const estadoFacturaSeverities: Record<string, 'success' | 'warning' | 'info' | 'secondary'> = {
  CONCILIADO: 'success',
  EN_REVISION: 'warning',
  PENDIENTE: 'info',
  CERRADO: 'secondary',
};

const estadoDetalleSeverities: Record<string, 'success' | 'warning' | 'info' | 'secondary'> = {
  CONFORME: 'success',
  OBSERVADO: 'warning',
  CORREGIDO: 'info',
  PENDIENTE: 'secondary',
};

const diagnosticoBadges: Record<DiagnosticoConciliacion, { label: string; severity: 'success' | 'danger' | 'warning' | 'info' | 'secondary' }> = {
  CONFORME: { label: 'Conforme', severity: 'success' },
  LINEA_NO_REGISTRADA: { label: 'Línea no registrada', severity: 'danger' },
  SIN_RESPONSABLE: { label: 'Sin responsable', severity: 'warning' },
  SIN_EQUIPO: { label: 'Sin equipo celular', severity: 'warning' },
  MULTIPLES_RESPONSABLES_PERIODO: { label: 'Múltiples responsables', severity: 'info' },
  MULTIPLES_EQUIPOS_PERIODO: { label: 'Múltiples equipos', severity: 'info' },
  RESPONSABLE_INCONSISTENTE: { label: 'Responsable discordante', severity: 'warning' },
  MONTO_PLAN_DIFERENTE: { label: 'Desvío en cargo plan', severity: 'warning' },
  CARGOS_ADICIONALES: { label: 'Cargos adicionales', severity: 'info' },
  CARGO_EQUIPO: { label: 'Cargo de equipo', severity: 'info' },
  PRORRATEO: { label: 'Prorrateo', severity: 'secondary' },
  DESCUENTO: { label: 'Descuento', severity: 'secondary' },
  SALDO_ANTERIOR: { label: 'Saldo anterior', severity: 'secondary' },
};

export default function FacturaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const idFactura = Number(id);
  const nav = useNavigate();
  const permissions = useAuthStore((s) => s.permissions);
  const canConciliar = permissions.includes('LINEAS_CONCILIAR');

  const facturaQuery = useFactura(idFactura);
  const resumenQuery = useResumenConciliacion(idFactura);

  // Filtros de detalle
  const [detPage, setDetPage] = useState(1);
  const [detSearch, setDetSearch] = useState('');
  const [detEstado, setDetEstado] = useState<string | undefined>();
  const detallesQuery = useFacturaDetalles(idFactura, {
    page: detPage,
    pageSize: 50,
    search: detSearch || undefined,
    estadoConciliacion: detEstado,
  });

  // Mutations
  const conciliarMut = useConciliarFactura(idFactura);
  const cerrarMut = useCerrarFactura(idFactura);
  const updateDetalleMut = useUpdateDetalleEstado(idFactura);
  const vincularCuotaMut = useVincularCuota(idFactura);

  // Modales
  const [modalType, setModalType] = useState<'editarDetalle' | 'cerrarFactura' | 'vincularCuota' | null>(null);
  const [selectedDetalle, setSelectedDetalle] = useState<FacturaDetalleItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Campos de modales
  const [editEstado, setEditEstado] = useState<EstadoConciliacionDetalle>('CONFORME');
  const [editObservacion, setEditObservacion] = useState('');
  const [editIdLinea, setEditIdLinea] = useState<number | undefined>();

  const [motivoCierre, setMotivoCierre] = useState('');
  const [cuotaIdInput, setCuotaIdInput] = useState<number | undefined>();

  if (facturaQuery.isPending) return <Skeleton height="550px" />;
  if (facturaQuery.isError || !facturaQuery.data) {
    return (
      <section className="dashboard-error">
        <h1>No se pudo cargar la factura de telefonía #{idFactura}.</h1>
        <Button label="Volver a telefonía" onClick={() => nav('/telefonia')} />
      </section>
    );
  }

  const f = facturaQuery.data;
  const isCerrada = f.estadoConciliacion === 'CERRADO';
  const resumen = resumenQuery.data?.metricas ?? f.resumen;

  const closeModal = () => {
    setModalType(null);
    setSelectedDetalle(null);
    setActionError(null);
    setMotivoCierre('');
    setCuotaIdInput(undefined);
  };

  const handleConciliar = async () => {
    setActionError(null);
    try {
      await conciliarMut.mutateAsync();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al ejecutar la conciliación.');
    }
  };

  const handleOpenEditarDetalle = (item: FacturaDetalleItem) => {
    setSelectedDetalle(item);
    setEditEstado(item.estadoConciliacion);
    setEditObservacion(item.observaciones ?? '');
    setEditIdLinea(item.idLinea ?? undefined);
    setActionError(null);
    setModalType('editarDetalle');
  };

  const handleSaveDetalleEstado = async () => {
    if (!selectedDetalle) return;
    try {
      await updateDetalleMut.mutateAsync({
        idDetalle: selectedDetalle.idDetalle,
        data: {
          estadoConciliacion: editEstado,
          observaciones: editObservacion.trim() || undefined,
          idLinea: editIdLinea,
        },
      });
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al actualizar estado del detalle.');
    }
  };

  const handleCerrarFactura = async () => {
    try {
      await cerrarMut.mutateAsync({
        motivoCierre: motivoCierre.trim() || undefined,
      });
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al cerrar la factura.');
    }
  };

  const handleVincularCuota = async () => {
    if (!cuotaIdInput) {
      setActionError('Debe ingresar el identificador de la cuota.');
      return;
    }
    try {
      await vincularCuotaMut.mutateAsync({ idCuota: cuotaIdInput });
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg || 'Error al vincular cuota.');
    }
  };

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
            <h1>{f.numeroFactura || `Factura #${f.idFactura}`}</h1>
            <Tag value={f.estadoConciliacion} severity={estadoFacturaSeverities[f.estadoConciliacion] ?? 'secondary'} />
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Operador: <strong>{f.operador.nombre}</strong> · Periodo: {formatDate(f.periodoInicio)} al {formatDate(f.periodoFin)}
          </p>
        </div>

        {canConciliar && (
          <div className="detail-actions">
            <Button
              label={conciliarMut.isPending ? 'Conciliando...' : 'Ejecutar Conciliación'}
              icon="pi pi-sync"
              loading={conciliarMut.isPending}
              disabled={isCerrada || conciliarMut.isPending}
              onClick={handleConciliar}
            />
            {!isCerrada && (
              <Button
                label="Cerrar Periodo"
                icon="pi pi-lock"
                severity="warning"
                outlined
                onClick={() => {
                  setActionError(null);
                  setModalType('cerrarFactura');
                }}
              />
            )}
          </div>
        )}
      </header>

      {actionError && (
        <div style={{ marginBottom: '18px' }}>
          <Message severity="error" text={actionError} />
        </div>
      )}

      {/* Tarjetas KPI de conciliación */}
      <section className="telefonia-kpis">
        <div>
          <strong>{resumen.totalLineas}</strong>
          <span>Total líneas facturadas</span>
        </div>
        <div>
          <strong style={{ color: '#16a34a' }}>{resumen.conformes}</strong>
          <span>Líneas conformes</span>
        </div>
        <div>
          <strong style={{ color: '#d97706' }}>{resumen.observados}</strong>
          <span>Líneas observadas</span>
        </div>
        <div>
          <strong style={{ color: '#0284c7' }}>{resumen.corregidos}</strong>
          <span>Líneas corregidas</span>
        </div>
        <div>
          <strong>S/ {f.montoTotal.toFixed(2)}</strong>
          <span>Monto total comprobante</span>
        </div>
      </section>

      {/* Grid de información general */}
      <div className="detail-grid">
        <section className="form-section">
          <h2>Datos del Comprobante</h2>
          <dl className="details-list">
            <div>
              <dt>N° Documento</dt>
              <dd>{f.numeroFactura || '—'}</dd>
            </div>
            <div>
              <dt>N° Cuenta</dt>
              <dd>{f.numeroCuenta || '—'}</dd>
            </div>
            <div>
              <dt>Fecha Emisión</dt>
              <dd>{formatDate(f.fechaEmision)}</dd>
            </div>
            <div>
              <dt>Fecha Vencimiento</dt>
              <dd>{formatDate(f.fechaVencimiento)}</dd>
            </div>
            <div>
              <dt>Importado Por</dt>
              <dd>{f.usuarioImportacion || '—'}</dd>
            </div>
            <div>
              <dt>Fecha Importación</dt>
              <dd>{formatDateTime(f.fechaImportacion)}</dd>
            </div>
            {f.fechaCierre && (
              <div>
                <dt>Cerrado Por</dt>
                <dd>{f.usuarioCierre || '—'} ({formatDateTime(f.fechaCierre)})</dd>
              </div>
            )}
            <div className="form-field--wide">
              <dt>Observaciones</dt>
              <dd>{f.observaciones || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="form-section">
          <h2>Resumen Financiero Calculado</h2>
          <dl className="details-list">
            <div>
              <dt>Cargos en Planes</dt>
              <dd>S/ {f.resumen.totalCargosPlan.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Cargos Adicionales</dt>
              <dd>S/ {f.resumen.totalCargosAdicionales.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Cargos por Equipos</dt>
              <dd>S/ {f.resumen.totalCargosEquipos.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Descuentos</dt>
              <dd>S/ {f.resumen.totalDescuentos.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Total Calculado</dt>
              <dd><strong>S/ {f.resumen.totalCalculado.toFixed(2)}</strong></dd>
            </div>
            <div>
              <dt>Diferencia con Comprobante</dt>
              <dd style={{ color: Math.abs(f.montoTotal - f.resumen.totalCalculado) > 0.05 ? '#b42318' : 'inherit' }}>
                S/ {(f.montoTotal - f.resumen.totalCalculado).toFixed(2)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Pestañas: Líneas Facturadas y Cuotas Vinculadas */}
      <section className="form-section" style={{ marginTop: '24px' }}>
        <TabView>
          <TabPanel header={`Líneas Facturadas (${resumen.totalLineas})`}>
            {/* Filtros de la tabla de detalle */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span className="search-field" style={{ minWidth: '220px' }}>
                <i className="pi pi-search" />
                <InputText
                  value={detSearch}
                  onChange={(e) => setDetSearch(e.target.value)}
                  placeholder="Número de línea…"
                  aria-label="Buscar en detalle"
                />
              </span>
              <Dropdown
                value={detEstado}
                options={[
                  { label: 'CONFORME', value: 'CONFORME' },
                  { label: 'OBSERVADO', value: 'OBSERVADO' },
                  { label: 'CORREGIDO', value: 'CORREGIDO' },
                  { label: 'PENDIENTE', value: 'PENDIENTE' },
                ]}
                placeholder="Filtrar por estado"
                showClear
                onChange={(e) => {
                  setDetEstado(e.value);
                  setDetPage(1);
                }}
              />
            </div>

            {detallesQuery.isPending ? (
              <Skeleton height="360px" />
            ) : (
              <DataTable
                value={detallesQuery.data?.items ?? []}
                lazy
                paginator
                first={(detPage - 1) * 50}
                rows={50}
                totalRecords={detallesQuery.data?.pagination.total ?? 0}
                onPage={(e: DataTablePageEvent) => setDetPage((e.page ?? 0) + 1)}
                emptyMessage="No se encontraron líneas facturadas con los filtros aplicados."
                scrollable
                tableStyle={{ minWidth: '1000px' }}
              >
                <Column
                  field="numeroLinea"
                  header="Número Facturado"
                  body={(r: FacturaDetalleItem) => (
                    <div>
                      <strong>{r.numeroLinea}</strong>
                      {r.idLinea ? (
                        <small className="cell-subtitle" style={{ color: '#16a34a' }}>✓ Registrada en sistema</small>
                      ) : (
                        <small className="cell-subtitle" style={{ color: '#b42318' }}>✗ No registrada</small>
                      )}
                    </div>
                  )}
                />
                <Column
                  header="Plan Facturado"
                  body={(r: FacturaDetalleItem) => (
                    <div>
                      <span>{r.nombrePlan || '—'}</span>
                      <small className="cell-subtitle">Cargo: S/ {r.cargoPlan.toFixed(2)}</small>
                    </div>
                  )}
                />
                <Column
                  header="Desglose Cargos"
                  body={(r: FacturaDetalleItem) => (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {r.cargosAdicionales > 0 && <div>Adic: +S/ {r.cargosAdicionales.toFixed(2)}</div>}
                      {r.cargoEquipos > 0 && <div>Eq: +S/ {r.cargoEquipos.toFixed(2)}</div>}
                      {r.descuentos > 0 && <div>Desc: -S/ {r.descuentos.toFixed(2)}</div>}
                      {r.prorrateo !== 0 && <div>Prorr: S/ {r.prorrateo.toFixed(2)}</div>}
                    </div>
                  )}
                />
                <Column
                  field="montoTotal"
                  header="Monto Total"
                  body={(r: FacturaDetalleItem) => <strong>S/ {r.montoTotal.toFixed(2)}</strong>}
                />
                <Column
                  header="Responsable(s) en Periodo"
                  body={(r: FacturaDetalleItem) => {
                    if (!r.responsablesPeriodo || r.responsablesPeriodo.length === 0) {
                      return <span className="cell-subtitle">Sin responsable</span>;
                    }
                    if (r.responsablesPeriodo.length === 1) {
                      const rp = r.responsablesPeriodo[0];
                      return (
                        <div>
                          <strong>{rp.nombre}</strong>
                          {rp.cargo && <small className="cell-subtitle">{rp.cargo}</small>}
                        </div>
                      );
                    }
                    return (
                      <div style={{ fontSize: '11px', background: '#f8fafc', padding: '4px 6px', borderRadius: '4px' }}>
                        <strong style={{ color: '#0284c7' }}>Múltiples ({r.responsablesPeriodo.length}):</strong>
                        {r.responsablesPeriodo.map((rp, idx) => (
                          <div key={idx}>
                            • {formatDate(rp.fechaInicio)} a {formatDate(rp.fechaFin)}: {rp.nombre}
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Column
                  header="Equipo(s) en Periodo"
                  body={(r: FacturaDetalleItem) => {
                    if (!r.equiposPeriodo || r.equiposPeriodo.length === 0) {
                      return <span className="cell-subtitle">Sin celular</span>;
                    }
                    if (r.equiposPeriodo.length === 1) {
                      const eq = r.equiposPeriodo[0];
                      return (
                        <div>
                          <strong>{eq.codigo}</strong>
                          <small className="cell-subtitle">{[eq.marca, eq.modelo].filter(Boolean).join(' ')}</small>
                        </div>
                      );
                    }
                    return (
                      <div style={{ fontSize: '11px', background: '#f8fafc', padding: '4px 6px', borderRadius: '4px' }}>
                        <strong style={{ color: '#0284c7' }}>Múltiples ({r.equiposPeriodo.length}):</strong>
                        {r.equiposPeriodo.map((eq, idx) => (
                          <div key={idx}>
                            • {formatDate(eq.fechaInicio)} a {formatDate(eq.fechaFin)}: {eq.codigo}
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Column
                  header="Diagnóstico"
                  body={(r: FacturaDetalleItem) => (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {r.diagnosticos?.length ? (
                        r.diagnosticos.map((dg, idx) => {
                          const badge = diagnosticoBadges[dg] ?? { label: dg, severity: 'secondary' };
                          return <Tag key={idx} value={badge.label} severity={badge.severity} />;
                        })
                      ) : (
                        <Tag value={r.estadoConciliacion} severity={estadoDetalleSeverities[r.estadoConciliacion]} />
                      )}
                    </div>
                  )}
                />
                <Column
                  header="Estado Gestión"
                  body={(r: FacturaDetalleItem) => (
                    <div>
                      <Tag
                        value={r.estadoConciliacion}
                        severity={estadoDetalleSeverities[r.estadoConciliacion] ?? 'secondary'}
                      />
                      {r.observaciones && <small className="cell-subtitle">{r.observaciones}</small>}
                    </div>
                  )}
                />
                <Column
                  header="Acciones"
                  body={(r: FacturaDetalleItem) => (
                    <div className="row-actions">
                      {canConciliar && !isCerrada && (
                        <Button
                          icon="pi pi-pencil"
                          text
                          rounded
                          size="small"
                          aria-label={`Editar estado línea ${r.numeroLinea}`}
                          onClick={() => handleOpenEditarDetalle(r)}
                        />
                      )}
                    </div>
                  )}
                />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={`Cuotas de Financiamiento Vinculadas (${f.cuotasVinculadas?.length ?? 0})`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Cuotas de contratos de equipos celulares cobradas e imputadas en este periodo.
              </p>
              {canConciliar && !isCerrada && (
                <Button
                  label="Vincular Cuota"
                  icon="pi pi-link"
                  size="small"
                  onClick={() => {
                    setActionError(null);
                    setModalType('vincularCuota');
                  }}
                />
              )}
            </div>

            <DataTable
              value={f.cuotasVinculadas}
              emptyMessage="No hay cuotas de financiamiento vinculadas a esta factura."
              tableStyle={{ minWidth: '700px' }}
            >
              <Column field="numeroFolio" header="Folio Contrato" body={(r: CuotaVinculadaItem) => r.numeroFolio || '—'} />
              <Column field="numeroCuota" header="N° Cuota" body={(r: CuotaVinculadaItem) => `Cuota ${r.numeroCuota}`} />
              <Column
                header="Equipo Celular"
                body={(r: CuotaVinculadaItem) => (
                  <div>
                    <strong>{r.activo.codigo}</strong>
                    <small className="cell-subtitle">{[r.activo.marca, r.activo.modelo].filter(Boolean).join(' ')}</small>
                  </div>
                )}
              />
              <Column field="monto" header="Monto (S/)" body={(r: CuotaVinculadaItem) => `S/ ${r.monto.toFixed(2)}`} />
              <Column field="estado" header="Estado Cuota" body={(r: CuotaVinculadaItem) => <Tag value={r.estado} severity="info" />} />
            </DataTable>
          </TabPanel>
        </TabView>
      </section>

      {/* ─── MODALES ─── */}

      {/* Modal: Editar estado del detalle / corrección humana */}
      <Dialog
        header={`Gestión de Línea Facturada ${selectedDetalle?.numeroLinea ?? ''}`}
        visible={modalType === 'editarDetalle'}
        onHide={closeModal}
        style={{ width: '480px' }}
        modal
      >
        <div className="dialog-form">
          {actionError && <Message severity="error" text={actionError} />}

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            El número facturado original (<strong>{selectedDetalle?.numeroLinea}</strong>) y los importes se preservan intactos.
          </p>

          <div className="field">
            <label>Estado de Gestión</label>
            <Dropdown
              value={editEstado}
              options={[
                { label: 'CONFORME', value: 'CONFORME' },
                { label: 'OBSERVADO', value: 'OBSERVADO' },
                { label: 'CORREGIDO', value: 'CORREGIDO' },
                { label: 'PENDIENTE', value: 'PENDIENTE' },
              ]}
              onChange={(e) => setEditEstado(e.value)}
            />
          </div>

          <div className="field">
            <label>Vincular a ID de Línea Registrada (opcional)</label>
            <InputText
              type="number"
              value={editIdLinea ? String(editIdLinea) : ''}
              placeholder="Ej. 42 (si se registró extemporáneamente)"
              onChange={(e) => setEditIdLinea(parseInt(e.target.value) || undefined)}
            />
          </div>

          <div className="field">
            <label>Observaciones de Corrección / Justificación</label>
            <InputTextarea
              value={editObservacion}
              rows={3}
              placeholder="Ej. Línea dada de alta y vinculada manualmente / Justificación de consumo..."
              onChange={(e) => setEditObservacion(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button label="Cancelar" outlined onClick={closeModal} disabled={updateDetalleMut.isPending} />
            <Button label="Guardar Corrección" loading={updateDetalleMut.isPending} onClick={handleSaveDetalleEstado} />
          </div>
        </div>
      </Dialog>

      {/* Modal: Cerrar Factura */}
      <Dialog
        header="Cerrar Periodo de Factura"
        visible={modalType === 'cerrarFactura'}
        onHide={closeModal}
        style={{ width: '480px' }}
        modal
      >
        <div className="dialog-form">
          {actionError && <Message severity="error" text={actionError} />}

          <p>
            Al cerrar la factura <strong>{f.numeroFactura || `#${f.idFactura}`}</strong>, se bloquearán futuras conciliaciones y modificaciones de detalle.
          </p>

          {resumen.observados + resumen.pendientes > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: '6px' }}>
              <strong style={{ color: '#92400e', fontSize: '13px' }}>
                ⚠️ Existen {resumen.observados + resumen.pendientes} líneas pendientes u observadas.
              </strong>
              <p style={{ margin: '4px 0 0', color: '#78350f', fontSize: '12px' }}>
                Para cerrar el periodo con observaciones no resueltas, debe ingresar obligatoriamente un motivo justificado.
              </p>
            </div>
          )}

          <div className="field">
            <label>Motivo de Cierre</label>
            <InputTextarea
              value={motivoCierre}
              rows={3}
              placeholder="Justificación del cierre formal de periodo..."
              onChange={(e) => setMotivoCierre(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button label="Cancelar" outlined onClick={closeModal} disabled={cerrarMut.isPending} />
            <Button label="Confirmar Cierre" severity="warning" loading={cerrarMut.isPending} onClick={handleCerrarFactura} />
          </div>
        </div>
      </Dialog>

      {/* Modal: Vincular Cuota */}
      <Dialog
        header="Vincular Cuota de Financiamiento a Factura"
        visible={modalType === 'vincularCuota'}
        onHide={closeModal}
        style={{ width: '420px' }}
        modal
      >
        <div className="dialog-form">
          {actionError && <Message severity="error" text={actionError} />}

          <div className="field">
            <label>ID de Cuota de Financiamiento</label>
            <InputText
              type="number"
              value={cuotaIdInput ? String(cuotaIdInput) : ''}
              placeholder="Ej. 15"
              onChange={(e) => setCuotaIdInput(parseInt(e.target.value) || undefined)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button label="Cancelar" outlined onClick={closeModal} disabled={vincularCuotaMut.isPending} />
            <Button label="Vincular" loading={vincularCuotaMut.isPending} onClick={handleVincularCuota} />
          </div>
        </div>
      </Dialog>
    </>
  );
}
