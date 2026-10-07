import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable, DataTableStateEvent } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import { useAuthStore } from '../../../stores/auth.store';
import { activosApi, catalogosApi } from '../../activos/api/activos.api';
import { AssetListItem, CatalogItem } from '../../activos/types/activos.types';
import { InventarioStatusTag, VerificacionStatusTag } from '../components/InventarioStatusTags';
import {
  useCerrarInventario,
  useInventario,
  useInventarioDetalle,
  useVerificarActivo,
} from '../hooks/useInventarios';
import {
  EstadoVerificacion,
  InventarioDetalleItem,
  QueryInventarioDetalleParams,
} from '../types/inventarios.types';

export default function InventarioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const inventarioId = Number(id || 0);
  const nav = useNavigate();
  const permissions = useAuthStore(s => s.permissions);
  const canManage = permissions.includes('INVENTARIO_GESTIONAR');

  const { data: inv, isPending: invPending, isError: invError } = useInventario(inventarioId);

  // Table filters & pagination
  const [params, setParams] = useState<QueryInventarioDetalleParams>({
    page: 1,
    pageSize: 15,
    search: '',
    estadoVerificacion: undefined,
  });
  const [searchInput, setSearchInput] = useState('');

  const { data: detalleData, isPending: detallePending, refetch: refetchDetalle } = useInventarioDetalle(
    inventarioId,
    params
  );

  const verificarMutation = useVerificarActivo(inventarioId);
  const cerrarMutation = useCerrarInventario(inventarioId);

  // Verification Dialog State
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyAssetId, setVerifyAssetId] = useState<number | null>(null);
  const [verifyLocationId, setVerifyLocationId] = useState<number | null>(null);
  const [verifyEstado, setVerifyEstado] = useState<EstadoVerificacion>('ENCONTRADO');
  const [verifyObs, setVerifyObs] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Asset search for verification
  const [assetOptions, setAssetOptions] = useState<{ label: string; value: number }[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [ubicaciones, setUbicaciones] = useState<CatalogItem[]>([]);

  // Close Dialog State
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeMotivo, setCloseMotivo] = useState('');
  const [confirmPending, setConfirmPending] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  useEffect(() => {
    catalogosApi.ubicaciones().then(setUbicaciones).catch(() => {});
  }, []);

  // Search assets for verify dialog
  useEffect(() => {
    let active = true;
    if (showVerifyDialog) {
      activosApi
        .list({
          page: 1,
          pageSize: 30,
          sortBy: 'codigo',
          sortDirection: 'asc',
          search: assetSearch,
        })
        .then(res => {
          if (active) {
            setAssetOptions(
              res.items.map((a: AssetListItem) => ({
                label: `${a.codigo} - ${[a.marca, a.modelo].filter(Boolean).join(' ') || a.tipo}`,
                value: a.id,
              }))
            );
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [showVerifyDialog, assetSearch]);

  const handlePageOrFilter = (event: DataTableStateEvent) => {
    const page = event.page !== undefined ? event.page + 1 : 1;
    const pageSize = event.rows || 15;
    setParams(prev => ({ ...prev, page, pageSize }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(prev => ({ ...prev, page: 1, search: searchInput.trim() }));
  };

  const handleOpenVerifyForAsset = (row?: InventarioDetalleItem) => {
    if (row) {
      setVerifyAssetId(row.idActivo);
      setVerifyLocationId(row.idUbicacionEsperada || null);
      setAssetOptions([
        {
          label: `${row.activo.codigo} - ${[row.activo.marca, row.activo.modelo].filter(Boolean).join(' ') || row.activo.tipo}`,
          value: row.idActivo,
        },
      ]);
    } else {
      setVerifyAssetId(null);
      setVerifyLocationId(null);
    }
    setVerifyEstado('ENCONTRADO');
    setVerifyObs('');
    setVerifyError(null);
    setShowVerifyDialog(true);
  };

  const handleConfirmVerify = async () => {
    if (!verifyAssetId) {
      setVerifyError('Seleccione un activo para verificar.');
      return;
    }
    setVerifyError(null);
    try {
      await verificarMutation.mutateAsync({
        idActivo: verifyAssetId,
        idUbicacionEncontrada: verifyLocationId || undefined,
        estadoVerificacion: verifyEstado,
        observaciones: verifyObs.trim() || undefined,
      });
      setShowVerifyDialog(false);
      refetchDetalle();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setVerifyError(e.response?.data?.message || 'Error al verificar el activo.');
    }
  };

  const handleConfirmClose = async () => {
    setCloseError(null);
    try {
      await cerrarMutation.mutateAsync({
        motivoCierre: closeMotivo.trim() || undefined,
        confirmarPendientes: confirmPending,
      });
      setShowCloseDialog(false);
      refetchDetalle();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setCloseError(e.response?.data?.message || 'Error al cerrar el inventario.');
    }
  };

  if (invPending) return <Skeleton height="450px" />;
  if (invError || !inv) {
    return (
      <section className="dashboard-error">
        <h2>Inventario no encontrado.</h2>
        <Button label="Volver a Inventarios" outlined onClick={() => nav('/inventarios')} />
      </section>
    );
  }

  const isClosed = inv.estado === 'FINALIZADO' || inv.estado === 'CANCELADO';
  const resumen = inv.resumen;

  return (
    <div className="telefonia-page">
      <header className="page-header module-header">
        <div>
          <p className="eyebrow">INVENTARIO FÍSICO</p>
          <h1>{inv.nombre}</h1>
          <p>
            Sede: <strong>{inv.sedeNombre || 'Global (Todas las sedes)'}</strong> · Iniciado el{' '}
            {new Date(inv.fechaInicio).toLocaleDateString('es-PE')}
          </p>
        </div>
        <div className="detail-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <InventarioStatusTag estado={inv.estado} />
          {canManage && !isClosed && (
            <>
              <Button
                label="Verificar activo"
                icon="pi pi-check-circle"
                onClick={() => handleOpenVerifyForAsset()}
              />
              <Button
                label="Cerrar inventario"
                icon="pi pi-lock"
                severity="warning"
                onClick={() => {
                  setCloseMotivo('');
                  setConfirmPending(false);
                  setCloseError(null);
                  setShowCloseDialog(true);
                }}
              />
            </>
          )}
          <Button label="Volver" icon="pi pi-arrow-left" text onClick={() => nav('/inventarios')} />
        </div>
      </header>

      {/* KPI Cards */}
      <section className="dashboard-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <div className="kpi-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <span className="kpi-card__label" style={{ fontSize: '0.8rem' }}>Total Esperados</span>
          <strong className="kpi-card__value" style={{ fontSize: '1.6rem' }}>{resumen?.totalEsperados ?? 0}</strong>
        </div>

        <div className="kpi-card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid var(--primary-color)' }}>
          <span className="kpi-card__label" style={{ fontSize: '0.8rem' }}>Verificados</span>
          <strong className="kpi-card__value" style={{ fontSize: '1.6rem', color: 'var(--primary-color)' }}>
            {resumen?.verificados ?? 0}
          </strong>
        </div>

        <div className="kpi-card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid #6b7280' }}>
          <span className="kpi-card__label" style={{ fontSize: '0.8rem' }}>Pendientes</span>
          <strong className="kpi-card__value" style={{ fontSize: '1.6rem', color: '#6b7280' }}>
            {resumen?.pendientes ?? 0}
          </strong>
        </div>

        <div className="kpi-card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid #10b981' }}>
          <span className="kpi-card__label" style={{ fontSize: '0.8rem' }}>Encontrados</span>
          <strong className="kpi-card__value" style={{ fontSize: '1.6rem', color: '#10b981' }}>
            {resumen?.encontrados ?? 0}
          </strong>
        </div>

        <div className="kpi-card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid #f59e0b' }}>
          <span className="kpi-card__label" style={{ fontSize: '0.8rem' }}>Cambio Ubicación</span>
          <strong className="kpi-card__value" style={{ fontSize: '1.6rem', color: '#f59e0b' }}>
            {resumen?.cambioUbicacion ?? 0}
          </strong>
        </div>

        <div className="kpi-card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid #ef4444' }}>
          <span className="kpi-card__label" style={{ fontSize: '0.8rem' }}>No Encontrados</span>
          <strong className="kpi-card__value" style={{ fontSize: '1.6rem', color: '#ef4444' }}>
            {resumen?.noEncontrados ?? 0}
          </strong>
        </div>

        <div className="kpi-card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid #b91c1c' }}>
          <span className="kpi-card__label" style={{ fontSize: '0.8rem' }}>Observados</span>
          <strong className="kpi-card__value" style={{ fontSize: '1.6rem', color: '#b91c1c' }}>
            {resumen?.observados ?? 0}
          </strong>
        </div>

        <div className="kpi-card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid var(--primary-color)' }}>
          <span className="kpi-card__label" style={{ fontSize: '0.8rem' }}>Avance</span>
          <strong className="kpi-card__value" style={{ fontSize: '1.6rem' }}>{resumen?.progreso ?? 0}%</strong>
          <ProgressBar
            value={resumen?.progreso ?? 0}
            showValue={false}
            style={{ height: '6px', marginTop: '0.5rem' }}
          />
        </div>
      </section>

      {/* Filter toolbar */}
      <section className="form-section filter-toolbar mb-4" style={{ padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} className="filter-form" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="p-input-icon-left" style={{ flex: '1 1 240px' }}>
            <i className="pi pi-search" />
            <InputText
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Buscar por código, serie o marca..."
              style={{ width: '100%' }}
            />
          </span>

          <Dropdown
            value={params.estadoVerificacion || ''}
            options={[
              { label: 'Todos los resultados', value: '' },
              { label: 'Pendiente', value: 'PENDIENTE' },
              { label: 'Encontrado', value: 'ENCONTRADO' },
              { label: 'No Encontrado', value: 'NO_ENCONTRADO' },
              { label: 'Cambio Ubicación', value: 'CAMBIO_UBICACION' },
              { label: 'Observado', value: 'OBSERVADO' },
            ]}
            onChange={e => setParams(prev => ({ ...prev, page: 1, estadoVerificacion: e.value || undefined }))}
            placeholder="Resultado"
            style={{ minWidth: '180px' }}
          />

          <Button type="submit" label="Filtrar" icon="pi pi-filter" outlined />
          {(params.search || params.estadoVerificacion) && (
            <Button
              type="button"
              label="Limpiar"
              icon="pi pi-times"
              text
              severity="secondary"
              onClick={() => {
                setSearchInput('');
                setParams({ page: 1, pageSize: 15 });
              }}
            />
          )}
        </form>
      </section>

      {/* Detail Table */}
      <DataTable
        value={detalleData?.items || []}
        lazy
        paginator
        first={((params.page || 1) - 1) * (params.pageSize || 15)}
        rows={params.pageSize || 15}
        totalRecords={detalleData?.total || 0}
        rowsPerPageOptions={[10, 15, 25, 50]}
        onPage={handlePageOrFilter}
        loading={detallePending}
        emptyMessage="No se encontraron activos en este filtro del inventario."
        stripedRows
        responsiveLayout="stack"
        className="p-datatable-sm"
      >
        <Column
          field="activo.codigo"
          header="Activo"
          body={(row: InventarioDetalleItem) => (
            <div>
              <strong style={{ color: 'var(--primary-color)' }}>{row.activo.codigo}</strong>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-color-secondary)' }}>
                {[row.activo.marca, row.activo.modelo].filter(Boolean).join(' ') || row.activo.tipo}
              </div>
              {row.activo.numeroSerie && (
                <small style={{ color: 'var(--text-color-secondary)' }}>S/N: {row.activo.numeroSerie}</small>
              )}
            </div>
          )}
        />

        <Column
          field="ubicacionEsperada"
          header="Ubicación Esperada (Snapshot)"
          body={(row: InventarioDetalleItem) => row.ubicacionEsperada || 'Sin ubicación asignada'}
        />

        <Column
          field="ubicacionEncontrada"
          header="Ubicación Encontrada"
          body={(row: InventarioDetalleItem) =>
            row.ubicacionEncontrada ? (
              <span style={{ color: row.ubicacionEncontrada !== row.ubicacionEsperada ? 'var(--orange-500)' : 'inherit' }}>
                {row.ubicacionEncontrada}
              </span>
            ) : (
              '—'
            )
          }
        />

        <Column
          field="estadoVerificacion"
          header="Estado Verificación"
          body={(row: InventarioDetalleItem) => <VerificacionStatusTag estado={row.estadoVerificacion} />}
        />

        <Column
          field="fechaVerificacion"
          header="Verificación"
          body={(row: InventarioDetalleItem) =>
            row.fechaVerificacion ? (
              <div>
                <span>{new Date(row.fechaVerificacion).toLocaleString('es-PE')}</span>
                {row.usuarioVerificacion && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-color-secondary)' }}>
                    Por: {row.usuarioVerificacion.nombre}
                  </div>
                )}
              </div>
            ) : (
              '—'
            )
          }
        />

        <Column
          field="observaciones"
          header="Observaciones"
          body={(row: InventarioDetalleItem) => row.observaciones || '—'}
        />

        <Column
          header="Acción"
          style={{ width: '100px', textAlign: 'center' }}
          body={(row: InventarioDetalleItem) =>
            canManage && !isClosed && row.estadoVerificacion === 'PENDIENTE' ? (
              <Button
                icon="pi pi-check"
                label="Verificar"
                size="small"
                outlined
                onClick={() => handleOpenVerifyForAsset(row)}
              />
            ) : null
          }
        />
      </DataTable>

      {/* Verify Dialog */}
      <Dialog
        header="Verificar Activo Físico"
        visible={showVerifyDialog}
        style={{ width: '90vw', maxWidth: '580px' }}
        onHide={() => setShowVerifyDialog(false)}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button label="Cancelar" severity="secondary" text onClick={() => setShowVerifyDialog(false)} />
            <Button
              label="Registrar Verificación"
              icon="pi pi-check"
              loading={verificarMutation.isPending}
              onClick={handleConfirmVerify}
            />
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          {verifyError && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px' }}>
              {verifyError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="verifyAsset">Activo a contrastar *</label>
            <Dropdown
              id="verifyAsset"
              value={verifyAssetId}
              options={assetOptions}
              onChange={e => setVerifyAssetId(e.value)}
              placeholder="Buscar activo por código..."
              filter
              filterBy="label"
              onFilter={e => setAssetSearch(e.filter)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="verifyLocation">Ubicación física encontrada</label>
            <Dropdown
              id="verifyLocation"
              value={verifyLocationId}
              options={ubicaciones.map(u => ({ label: u.nombre, value: u.id }))}
              onChange={e => setVerifyLocationId(e.value)}
              placeholder="Seleccionar ubicación..."
              filter
              filterBy="label"
            />
          </div>

          <div className="form-field">
            <label htmlFor="verifyEstado">Resultado de verificación *</label>
            <Dropdown
              id="verifyEstado"
              value={verifyEstado}
              options={[
                { label: 'Encontrado (Conforme)', value: 'ENCONTRADO' },
                { label: 'Cambio de Ubicación', value: 'CAMBIO_UBICACION' },
                { label: 'No Encontrado (Faltante)', value: 'NO_ENCONTRADO' },
                { label: 'Observado (Dañado / Inconsistencia)', value: 'OBSERVADO' },
              ]}
              onChange={e => setVerifyEstado(e.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="verifyObs">Observaciones de campo</label>
            <InputTextarea
              id="verifyObs"
              value={verifyObs}
              onChange={e => setVerifyObs(e.target.value)}
              rows={2}
              maxLength={700}
              placeholder="Notas de la constatación física..."
            />
          </div>
        </div>
      </Dialog>

      {/* Close Campaign Dialog */}
      <Dialog
        header="Cierre de Campaña de Inventario"
        visible={showCloseDialog}
        style={{ width: '90vw', maxWidth: '520px' }}
        onHide={() => setShowCloseDialog(false)}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button label="Cancelar" severity="secondary" text onClick={() => setShowCloseDialog(false)} />
            <Button
              label="Confirmar Cierre"
              icon="pi pi-lock"
              severity="warning"
              loading={cerrarMutation.isPending}
              onClick={handleConfirmClose}
            />
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          {closeError && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px' }}>
              {closeError}
            </div>
          )}

          {(resumen?.pendientes ?? 0) > 0 && (
            <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: '4px' }}>
              <strong>Advertencia:</strong> Existen <strong>{resumen?.pendientes}</strong> activos pendientes de
              verificación física. El cierre requiere justificación obligatoria.
            </div>
          )}

          <p style={{ color: 'var(--text-color-secondary)' }}>
            Una vez cerrado el inventario, no se podrán realizar nuevas verificaciones ni modificar los resultados.
          </p>

          <div className="form-field">
            <label htmlFor="closeMotivo">Motivo / Justificación de cierre {(resumen?.pendientes ?? 0) > 0 ? '*' : ''}</label>
            <InputTextarea
              id="closeMotivo"
              value={closeMotivo}
              onChange={e => setCloseMotivo(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Explique el motivo de cierre o las razones de los activos no auditados..."
            />
          </div>

          {(resumen?.pendientes ?? 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Checkbox
                inputId="confirmPending"
                checked={confirmPending}
                onChange={e => setConfirmPending(e.checked ?? false)}
              />
              <label htmlFor="confirmPending" style={{ cursor: 'pointer', margin: 0 }}>
                Confirmo que deseo cerrar el inventario a pesar de tener activos pendientes.
              </label>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
