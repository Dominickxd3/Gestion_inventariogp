import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableStateEvent } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { useAuthStore } from '../../../stores/auth.store';
import { MantenimientoStatusTag } from '../components/MantenimientoStatusTag';
import { useMantenimientos } from '../hooks/useMantenimientos';
import { MantenimientoItem, QueryMantenimientosParams } from '../types/mantenimientos.types';

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export default function MantenimientosPage() {
  const nav = useNavigate();
  const permissions = useAuthStore(s => s.permissions);
  const canEdit = permissions.includes('MANTENIMIENTO_EDITAR');

  const [params, setParams] = useState<QueryMantenimientosParams>({
    page: 1,
    pageSize: 15,
    sortBy: 'id_mantenimiento',
    sortDirection: 'DESC',
    search: '',
    estado: undefined,
    tipo: undefined,
  });

  const [searchInput, setSearchInput] = useState('');

  const { data, isPending, isError, refetch } = useMantenimientos(params);

  const handlePageOrSort = (event: DataTableStateEvent) => {
    const page = event.page !== undefined ? event.page + 1 : 1;
    const pageSize = event.rows || 15;
    const sortBy = event.sortField || 'id_mantenimiento';
    const sortDirection = event.sortOrder === 1 ? 'ASC' : 'DESC';

    setParams(prev => ({ ...prev, page, pageSize, sortBy, sortDirection }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(prev => ({ ...prev, page: 1, search: searchInput.trim() }));
  };

  const estadoOptions = [
    { label: 'Todos los estados', value: '' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Finalizado', value: 'FINALIZADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];

  const tipoOptions = [
    { label: 'Todos los tipos', value: '' },
    { label: 'Correctivo', value: 'CORRECTIVO' },
    { label: 'Preventivo', value: 'PREVENTIVO' },
  ];

  return (
    <div className="telefonia-page">
      <header className="page-header module-header">
        <div>
          <p className="eyebrow">GESTIÓN DE ACTIVOS</p>
          <h1>Mantenimientos</h1>
          <p>Control e intervenciones técnicas preventivas y correctivas sobre los activos.</p>
        </div>
        {canEdit && (
          <Button
            label="Nuevo mantenimiento"
            icon="pi pi-plus"
            onClick={() => nav('/mantenimientos/nuevo')}
          />
        )}
      </header>

      {/* Filter toolbar */}
      <section className="form-section filter-toolbar mb-4" style={{ padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} className="filter-form" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="p-input-icon-left" style={{ flex: '1 1 240px' }}>
            <i className="pi pi-search" />
            <InputText
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Buscar por código, marca, problema o proveedor..."
              style={{ width: '100%' }}
            />
          </span>

          <Dropdown
            value={params.estado || ''}
            options={estadoOptions}
            onChange={e => setParams(prev => ({ ...prev, page: 1, estado: e.value || undefined }))}
            placeholder="Estado"
            style={{ minWidth: '160px' }}
          />

          <Dropdown
            value={params.tipo || ''}
            options={tipoOptions}
            onChange={e => setParams(prev => ({ ...prev, page: 1, tipo: e.value || undefined }))}
            placeholder="Tipo"
            style={{ minWidth: '160px' }}
          />

          <Button type="submit" label="Filtrar" icon="pi pi-filter" outlined />
          {(params.search || params.estado || params.tipo) && (
            <Button
              type="button"
              label="Limpiar"
              icon="pi pi-times"
              text
              severity="secondary"
              onClick={() => {
                setSearchInput('');
                setParams({ page: 1, pageSize: 15, sortBy: 'id_mantenimiento', sortDirection: 'DESC' });
              }}
            />
          )}
        </form>
      </section>

      {/* Table section */}
      {isError ? (
        <section className="dashboard-error">
          <h2>No se pudieron cargar los mantenimientos.</h2>
          <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={() => refetch()} />
        </section>
      ) : (
        <DataTable
          value={data?.items || []}
          lazy
          paginator
          first={((params.page || 1) - 1) * (params.pageSize || 15)}
          rows={params.pageSize || 15}
          totalRecords={data?.total || 0}
          rowsPerPageOptions={[10, 15, 25, 50]}
          onPage={handlePageOrSort}
          onSort={handlePageOrSort}
          sortField={params.sortBy}
          sortOrder={params.sortDirection === 'ASC' ? 1 : -1}
          loading={isPending}
          emptyMessage="No hay registros de mantenimientos."
          stripedRows
          responsiveLayout="stack"
          className="p-datatable-sm"
        >
          <Column
            field="id_mantenimiento"
            header="ID"
            sortable
            style={{ width: '80px' }}
            body={(row: MantenimientoItem) => <strong>#{row.id}</strong>}
          />

          <Column
            field="codigo"
            header="Activo"
            sortable
            body={(row: MantenimientoItem) => (
              <div>
                <button
                  type="button"
                  className="history-link"
                  style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => nav(`/activos/${row.idActivo}`)}
                >
                  <strong style={{ color: 'var(--primary-color)' }}>{row.activo.codigo}</strong>
                </button>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-color-secondary)' }}>
                  {[row.activo.marca, row.activo.modelo].filter(Boolean).join(' ') || row.activo.tipo}
                </div>
              </div>
            )}
          />

          <Column
            field="tipo"
            header="Tipo"
            sortable
            body={(row: MantenimientoItem) => (
              <Tag
                value={row.tipo}
                severity={row.tipo === 'CORRECTIVO' ? 'warning' : 'info'}
              />
            )}
          />

          <Column
            field="problema_reportado"
            header="Problema / Motivo"
            body={(row: MantenimientoItem) => (
              <span title={row.problemaReportado || ''}>
                {row.problemaReportado
                  ? row.problemaReportado.length > 50
                    ? row.problemaReportado.slice(0, 50) + '...'
                    : row.problemaReportado
                  : '—'}
              </span>
            )}
          />

          <Column
            field="fecha_inicio"
            header="Fecha Inicio"
            sortable
            body={(row: MantenimientoItem) =>
              row.fechaInicio
                ? new Date(row.fechaInicio).toLocaleDateString('es-PE')
                : row.fechaProgramada
                ? `${row.fechaProgramada} (Prog.)`
                : '—'
            }
          />

          <Column
            field="costo"
            header="Costo"
            sortable
            body={(row: MantenimientoItem) =>
              row.costo !== null && row.costo !== undefined ? money.format(row.costo) : '—'
            }
          />

          <Column
            field="estado"
            header="Estado"
            sortable
            body={(row: MantenimientoItem) => <MantenimientoStatusTag estado={row.estado} />}
          />

          <Column
            header="Acciones"
            style={{ width: '120px', textAlign: 'center' }}
            body={(row: MantenimientoItem) => (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <Button
                  icon="pi pi-eye"
                  rounded
                  text
                  aria-label="Ver detalle"
                  tooltip="Ver detalle"
                  onClick={() => nav(`/mantenimientos/${row.id}`)}
                />
                {canEdit && (row.estado === 'PENDIENTE' || row.estado === 'EN_PROCESO') && (
                  <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="secondary"
                    aria-label="Editar"
                    tooltip="Editar"
                    onClick={() => nav(`/mantenimientos/${row.id}/editar`)}
                  />
                )}
              </div>
            )}
          />
        </DataTable>
      )}
    </div>
  );
}
