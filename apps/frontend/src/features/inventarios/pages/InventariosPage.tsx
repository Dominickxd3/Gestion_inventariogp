import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableStateEvent } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { ProgressBar } from 'primereact/progressbar';
import { useAuthStore } from '../../../stores/auth.store';
import { InventarioStatusTag } from '../components/InventarioStatusTags';
import { useInventarios } from '../hooks/useInventarios';
import { InventarioItem, QueryInventariosParams } from '../types/inventarios.types';

export default function InventariosPage() {
  const nav = useNavigate();
  const permissions = useAuthStore(s => s.permissions);
  const canManage = permissions.includes('INVENTARIO_GESTIONAR');

  const [params, setParams] = useState<QueryInventariosParams>({
    page: 1,
    pageSize: 15,
    sortBy: 'id_inventario',
    sortDirection: 'DESC',
    search: '',
    estado: undefined,
  });

  const [searchInput, setSearchInput] = useState('');

  const { data, isPending, isError, refetch } = useInventarios(params);

  const handlePageOrSort = (event: DataTableStateEvent) => {
    const page = event.page !== undefined ? event.page + 1 : 1;
    const pageSize = event.rows || 15;
    const sortBy = event.sortField || 'id_inventario';
    const sortDirection = event.sortOrder === 1 ? 'ASC' : 'DESC';

    setParams(prev => ({ ...prev, page, pageSize, sortBy, sortDirection }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(prev => ({ ...prev, page: 1, search: searchInput.trim() }));
  };

  const estadoOptions = [
    { label: 'Todos los estados', value: '' },
    { label: 'Abierto', value: 'ABIERTO' },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Finalizado', value: 'FINALIZADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];

  return (
    <div className="telefonia-page">
      <header className="page-header module-header">
        <div>
          <p className="eyebrow">CONTROL PATRIMONIAL</p>
          <h1>Inventarios Físicos</h1>
          <p>Campañas de verificación física y contrastación de activos en sedes.</p>
        </div>
        {canManage && (
          <Button
            label="Nuevo inventario"
            icon="pi pi-plus"
            onClick={() => nav('/inventarios/nuevo')}
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
              placeholder="Buscar por nombre de inventario o sede..."
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

          <Button type="submit" label="Filtrar" icon="pi pi-filter" outlined />
          {(params.search || params.estado) && (
            <Button
              type="button"
              label="Limpiar"
              icon="pi pi-times"
              text
              severity="secondary"
              onClick={() => {
                setSearchInput('');
                setParams({ page: 1, pageSize: 15, sortBy: 'id_inventario', sortDirection: 'DESC' });
              }}
            />
          )}
        </form>
      </section>

      {/* Table section */}
      {isError ? (
        <section className="dashboard-error">
          <h2>No se pudieron cargar las campañas de inventario.</h2>
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
          emptyMessage="No hay campañas de inventario registradas."
          stripedRows
          responsiveLayout="stack"
          className="p-datatable-sm"
        >
          <Column
            field="id_inventario"
            header="ID"
            sortable
            style={{ width: '80px' }}
            body={(row: InventarioItem) => <strong>#{row.id}</strong>}
          />

          <Column
            field="nombre"
            header="Campaña"
            sortable
            body={(row: InventarioItem) => (
              <div>
                <button
                  type="button"
                  className="history-link"
                  style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => nav(`/inventarios/${row.id}`)}
                >
                  <strong style={{ color: 'var(--primary-color)' }}>{row.nombre}</strong>
                </button>
                {row.observaciones && (
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-color-secondary)' }}>
                    {row.observaciones.length > 50 ? row.observaciones.slice(0, 50) + '...' : row.observaciones}
                  </div>
                )}
              </div>
            )}
          />

          <Column
            field="sedeNombre"
            header="Sede"
            body={(row: InventarioItem) => row.sedeNombre || 'Global (Todas las sedes)'}
          />

          <Column
            field="fecha_inicio"
            header="Fecha Inicio"
            sortable
            body={(row: InventarioItem) => new Date(row.fechaInicio).toLocaleDateString('es-PE')}
          />

          <Column
            header="Avance Físico"
            style={{ minWidth: '180px' }}
            body={(row: InventarioItem) => (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                  <span>{row.verificados} / {row.totalEsperados}</span>
                  <strong>{row.progreso}%</strong>
                </div>
                <ProgressBar
                  value={row.progreso}
                  showValue={false}
                  style={{ height: '8px' }}
                  color={row.progreso === 100 ? 'var(--green-500)' : 'var(--primary-color)'}
                />
              </div>
            )}
          />

          <Column
            field="estado"
            header="Estado"
            sortable
            body={(row: InventarioItem) => <InventarioStatusTag estado={row.estado} />}
          />

          <Column
            header="Acciones"
            style={{ width: '100px', textAlign: 'center' }}
            body={(row: InventarioItem) => (
              <Button
                icon="pi pi-eye"
                label="Ver detalle"
                size="small"
                outlined
                onClick={() => nav(`/inventarios/${row.id}`)}
              />
            )}
          />
        </DataTable>
      )}
    </div>
  );
}
