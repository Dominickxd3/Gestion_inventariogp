import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTablePageEvent, DataTableSortEvent } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { useAuthStore } from '../../../stores/auth.store';
import { useFacturas } from '../hooks/useFacturacion';
import { useFinanciamientos, useLineas, useOperadores, usePlanes } from '../hooks/useTelefonia';
import { FacturaListItem } from '../types/facturacion.types';
import { FinanciamientoItem, LineaItem, LineaQuery } from '../types/telefonia.types';

const initialQuery: LineaQuery = {
  page: 1,
  pageSize: 20,
  sortBy: 'numero',
  sortDirection: 'asc',
};

const estadoSeverities: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
  ACTIVA: 'success',
  DISPONIBLE: 'info',
  SUSPENDIDA: 'warning',
  BAJA: 'danger',
  ROBADA: 'danger',
  PERDIDA: 'danger',
  CONCILIADO: 'success',
  EN_REVISION: 'warning',
  PENDIENTE: 'info',
  CERRADO: 'secondary',
};

export default function TelefoniaPage() {
  const nav = useNavigate();
  const permissions = useAuthStore((s) => s.permissions);
  const [activeTab, setActiveTab] = useState<'lineas' | 'financiamientos' | 'facturacion'>('lineas');

  // Filtros de líneas
  const [q, setQ] = useState<LineaQuery>(initialQuery);
  const [search, setSearch] = useState('');
  const [selectedOperador, setSelectedOperador] = useState<number | undefined>();
  const [selectedPlan, setSelectedPlan] = useState<number | undefined>();
  const [selectedEstado, setSelectedEstado] = useState<string | undefined>();
  const [filterResponsable, setFilterResponsable] = useState<boolean | undefined>();
  const [filterCelular, setFilterCelular] = useState<boolean | undefined>();

  // Datos
  const lineasQuery = useLineas(q);
  const operadores = useOperadores();
  const planes = usePlanes(selectedOperador);

  // Financiamientos
  const [finPage, setFinPage] = useState(1);
  const financiamientosQuery = useFinanciamientos({ page: finPage, pageSize: 20 });

  // Facturación
  const [factPage, setFactPage] = useState(1);
  const [factSearch, setFactSearch] = useState('');
  const [factOperador, setFactOperador] = useState<number | undefined>();
  const [factEstado, setFactEstado] = useState<string | undefined>();
  const facturasQuery = useFacturas({
    page: factPage,
    pageSize: 20,
    search: factSearch || undefined,
    idOperador: factOperador,
    estadoConciliacion: factEstado,
  });

  const applyFilters = () => {
    setQ((prev) => ({
      ...prev,
      page: 1,
      search: search.trim() || undefined,
      idOperador: selectedOperador,
      idPlan: selectedPlan,
      estado: selectedEstado,
      conResponsable: filterResponsable,
      conCelular: filterCelular,
    }));
  };

  const handlePageChange = (e: DataTablePageEvent) => {
    setQ((prev) => ({
      ...prev,
      page: (e.page ?? 0) + 1,
      pageSize: e.rows,
    }));
  };

  const handleSortChange = (e: DataTableSortEvent) => {
    const fieldMap: Record<string, LineaQuery['sortBy']> = {
      numero: 'numero',
      estado: 'estado',
      'operador.nombre': 'operador',
      'plan.nombre': 'plan',
    };
    const validSort = fieldMap[String(e.sortField)] ?? 'numero';
    setQ((prev) => ({
      ...prev,
      sortBy: validSort,
      sortDirection: e.sortOrder === 1 ? 'asc' : 'desc',
    }));
  };

  const items = lineasQuery.data?.items ?? [];
  const activasCount = items.filter((x) => x.estado === 'ACTIVA').length;
  const conRespCount = items.filter((x) => Boolean(x.responsable)).length;
  const conCelCount = items.filter((x) => Boolean(x.celular)).length;

  return (
    <>
      <header className="page-header module-header">
        <div>
          <p className="eyebrow">CONTROL DE TELEFONÍA</p>
          <h1>Telefonía Móvil</h1>
          <p>Líneas celulares corporativas, asignaciones a colaboradores, financiamientos y facturación mensual.</p>
        </div>
        {activeTab === 'lineas' && permissions.includes('LINEAS_EDITAR') && (
          <Button
            label="Nueva línea"
            icon="pi pi-plus"
            onClick={() => nav('/telefonia/nueva')}
          />
        )}
        {activeTab === 'facturacion' && permissions.includes('LINEAS_CONCILIAR') && (
          <Button
            label="Nueva factura"
            icon="pi pi-plus"
            onClick={() => nav('/telefonia/facturas/nueva')}
          />
        )}
      </header>

      <div className="telefonia-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'lineas'}
          className={activeTab === 'lineas' ? 'active' : ''}
          onClick={() => setActiveTab('lineas')}
        >
          <i className="pi pi-mobile" /> Líneas Móviles
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'financiamientos'}
          className={activeTab === 'financiamientos' ? 'active' : ''}
          onClick={() => setActiveTab('financiamientos')}
        >
          <i className="pi pi-dollar" /> Financiamientos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'facturacion'}
          className={activeTab === 'facturacion' ? 'active' : ''}
          onClick={() => setActiveTab('facturacion')}
        >
          <i className="pi pi-file" /> Facturación y Conciliación
        </button>
      </div>

      {activeTab === 'lineas' && (
        <>
          <section className="telefonia-kpis">
            <div>
              <strong>{lineasQuery.data?.pagination.total ?? '—'}</strong>
              <span>Total líneas registradas</span>
            </div>
            <div>
              <strong>{activasCount}</strong>
              <span>Activas (en esta página)</span>
            </div>
            <div>
              <strong>{conRespCount}</strong>
              <span>Con responsable asignado</span>
            </div>
            <div>
              <strong>{conCelCount}</strong>
              <span>Con equipo celular asociado</span>
            </div>
          </section>

          <section className="filters-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
            >
              <span className="search-field">
                <i className="pi pi-search" />
                <InputText
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Número o ICCID…"
                  aria-label="Buscar líneas"
                />
              </span>

              <Dropdown
                value={selectedOperador}
                options={operadores.data ?? []}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Operador"
                showClear
                onChange={(e) => {
                  setSelectedOperador(e.value);
                  setSelectedPlan(undefined);
                }}
              />

              <Dropdown
                value={selectedPlan}
                options={planes.data ?? []}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Plan móvil"
                showClear
                disabled={!selectedOperador}
                onChange={(e) => setSelectedPlan(e.value)}
              />

              <Dropdown
                value={selectedEstado}
                options={[
                  { label: 'ACTIVA', value: 'ACTIVA' },
                  { label: 'DISPONIBLE', value: 'DISPONIBLE' },
                  { label: 'SUSPENDIDA', value: 'SUSPENDIDA' },
                  { label: 'BAJA', value: 'BAJA' },
                  { label: 'ROBADA', value: 'ROBADA' },
                  { label: 'PERDIDA', value: 'PERDIDA' },
                ]}
                placeholder="Estado"
                showClear
                onChange={(e) => setSelectedEstado(e.value)}
              />

              <Dropdown
                value={filterResponsable}
                options={[
                  { label: 'Con responsable', value: true },
                  { label: 'Sin responsable', value: false },
                ]}
                placeholder="Responsable"
                showClear
                onChange={(e) => setFilterResponsable(e.value)}
              />

              <Dropdown
                value={filterCelular}
                options={[
                  { label: 'Con celular', value: true },
                  { label: 'Sin celular', value: false },
                ]}
                placeholder="Equipo celular"
                showClear
                onChange={(e) => setFilterCelular(e.value)}
              />

              <Button type="submit" label="Buscar" outlined />
            </form>
          </section>

          {lineasQuery.isPending ? (
            <Skeleton height="360px" />
          ) : lineasQuery.isError ? (
            <section className="dashboard-error">
              <h2>No se pudieron cargar las líneas móviles.</h2>
              <Button label="Reintentar" onClick={() => void lineasQuery.refetch()} />
            </section>
          ) : (
            <section className="table-card">
              <DataTable
                value={items}
                lazy
                paginator
                first={(q.page! - 1) * q.pageSize!}
                rows={q.pageSize}
                totalRecords={lineasQuery.data.pagination.total}
                onPage={handlePageChange}
                onSort={handleSortChange}
                emptyMessage={q.search || q.estado ? 'No se encontraron líneas móviles.' : 'No hay líneas registradas.'}
                scrollable
                tableStyle={{ minWidth: '950px' }}
              >
                <Column
                  field="numero"
                  header="Número"
                  sortable
                  body={(r: LineaItem) => (
                    <button
                      type="button"
                      className="history-link"
                      onClick={() => nav(`/telefonia/${r.idLinea}`)}
                      style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <strong>{r.numero}</strong>
                      {r.iccid && <small className="cell-subtitle">ICCID: {r.iccid}</small>}
                    </button>
                  )}
                />
                <Column field="operador.nombre" header="Operador" sortable body={(r: LineaItem) => r.operador?.nombre ?? '—'} />
                <Column field="plan.nombre" header="Plan" sortable body={(r: LineaItem) => r.plan?.nombre ?? '—'} />
                <Column
                  field="estado"
                  header="Estado"
                  sortable
                  body={(r: LineaItem) => (
                    <Tag value={r.estado} severity={estadoSeverities[r.estado] ?? 'secondary'} />
                  )}
                />
                <Column
                  header="Responsable Actual"
                  body={(r: LineaItem) =>
                    r.responsable ? (
                      <div>
                        <div>{r.responsable.nombre}</div>
                        {r.responsable.cargo && <small className="cell-subtitle">{r.responsable.cargo}</small>}
                      </div>
                    ) : (
                      <span className="cell-subtitle">Sin responsable</span>
                    )
                  }
                />
                <Column
                  header="Equipo Asociado"
                  body={(r: LineaItem) =>
                    r.celular ? (
                      <div>
                        <strong>{r.celular.codigo}</strong>
                        <small className="cell-subtitle">{[r.celular.marca, r.celular.modelo].filter(Boolean).join(' ')}</small>
                      </div>
                    ) : (
                      <span className="cell-subtitle">Sin equipo</span>
                    )
                  }
                />
                <Column
                  header="Acciones"
                  body={(r: LineaItem) => (
                    <div className="row-actions">
                      <Button
                        icon="pi pi-eye"
                        text
                        rounded
                        aria-label={`Ver detalle de línea ${r.numero}`}
                        onClick={() => nav(`/telefonia/${r.idLinea}`)}
                      />
                    </div>
                  )}
                />
              </DataTable>
            </section>
          )}
        </>
      )}

      {activeTab === 'financiamientos' && (
        <>
          {financiamientosQuery.isPending ? (
            <Skeleton height="360px" />
          ) : financiamientosQuery.isError ? (
            <section className="dashboard-error">
              <h2>No se pudieron cargar los financiamientos.</h2>
              <Button label="Reintentar" onClick={() => void financiamientosQuery.refetch()} />
            </section>
          ) : (
            <section className="table-card">
              <DataTable
                value={financiamientosQuery.data.items}
                lazy
                paginator
                first={(finPage - 1) * 20}
                rows={20}
                totalRecords={financiamientosQuery.data.pagination.total}
                onPage={(e: DataTablePageEvent) => setFinPage((e.page ?? 0) + 1)}
                emptyMessage="No hay financiamientos de equipos registrados."
                scrollable
                tableStyle={{ minWidth: '950px' }}
              >
                <Column
                  header="Equipo Celular"
                  body={(r: FinanciamientoItem) => (
                    <div>
                      <strong>{r.codigoActivo}</strong>
                      <small className="cell-subtitle">{[r.marca, r.modelo].filter(Boolean).join(' ')}</small>
                    </div>
                  )}
                />
                <Column field="operador" header="Operador" />
                <Column field="numeroFolio" header="Folio" body={(r: FinanciamientoItem) => r.numeroFolio || '—'} />
                <Column
                  field="fechaInicio"
                  header="Inicio"
                  body={(r: FinanciamientoItem) =>
                    r.fechaInicio ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(r.fechaInicio)) : '—'
                  }
                />
                <Column field="cantidadCuotas" header="Cuotas" body={(r: FinanciamientoItem) => `${r.cantidadCuotas} cuotas`} />
                <Column
                  field="montoCuota"
                  header="Monto Cuota"
                  body={(r: FinanciamientoItem) => `S/ ${Number(r.montoCuota).toFixed(2)}`}
                />
                <Column
                  field="montoTotal"
                  header="Monto Total"
                  body={(r: FinanciamientoItem) => `S/ ${Number(r.montoTotal).toFixed(2)}`}
                />
                <Column
                  field="estado"
                  header="Estado"
                  body={(r: FinanciamientoItem) => (
                    <Tag
                      value={r.estado}
                      severity={r.estado === 'ACTIVO' ? 'success' : r.estado === 'PAGADO' ? 'info' : 'secondary'}
                    />
                  )}
                />
              </DataTable>
            </section>
          )}
        </>
      )}

      {activeTab === 'facturacion' && (
        <>
          <section className="telefonia-kpis">
            <div>
              <strong>{facturasQuery.data?.pagination.total ?? '—'}</strong>
              <span>Total facturas registradas</span>
            </div>
            <div>
              <strong>
                {facturasQuery.data?.items.filter((x) => x.estadoConciliacion === 'CONCILIADO').length ?? '—'}
              </strong>
              <span>Conciliadas (en esta página)</span>
            </div>
            <div>
              <strong>
                {facturasQuery.data?.items.filter((x) => x.estadoConciliacion === 'EN_REVISION' || x.estadoConciliacion === 'PENDIENTE').length ?? '—'}
              </strong>
              <span>En revisión / Pendientes</span>
            </div>
            <div>
              <strong>
                {facturasQuery.data?.items.filter((x) => x.estadoConciliacion === 'CERRADO').length ?? '—'}
              </strong>
              <span>Periodos cerrados</span>
            </div>
          </section>

          <section className="filters-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFactPage(1);
              }}
            >
              <span className="search-field">
                <i className="pi pi-search" />
                <InputText
                  value={factSearch}
                  onChange={(e) => setFactSearch(e.target.value)}
                  placeholder="Número de factura o cuenta…"
                  aria-label="Buscar facturas"
                />
              </span>

              <Dropdown
                value={factOperador}
                options={operadores.data ?? []}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Operador"
                showClear
                onChange={(e) => {
                  setFactOperador(e.value);
                  setFactPage(1);
                }}
              />

              <Dropdown
                value={factEstado}
                options={[
                  { label: 'PENDIENTE', value: 'PENDIENTE' },
                  { label: 'EN_REVISION', value: 'EN_REVISION' },
                  { label: 'CONCILIADO', value: 'CONCILIADO' },
                  { label: 'CERRADO', value: 'CERRADO' },
                ]}
                placeholder="Estado conciliación"
                showClear
                onChange={(e) => {
                  setFactEstado(e.value);
                  setFactPage(1);
                }}
              />

              <Button type="submit" label="Buscar" outlined />
            </form>
          </section>

          {facturasQuery.isPending ? (
            <Skeleton height="360px" />
          ) : facturasQuery.isError ? (
            <section className="dashboard-error">
              <h2>No se pudieron cargar las facturas de telefonía.</h2>
              <Button label="Reintentar" onClick={() => void facturasQuery.refetch()} />
            </section>
          ) : (
            <section className="table-card">
              <DataTable
                value={facturasQuery.data.items}
                lazy
                paginator
                first={(factPage - 1) * 20}
                rows={20}
                totalRecords={facturasQuery.data.pagination.total}
                onPage={(e: DataTablePageEvent) => setFactPage((e.page ?? 0) + 1)}
                emptyMessage="No hay facturas de telefonía registradas."
                scrollable
                tableStyle={{ minWidth: '950px' }}
              >
                <Column
                  field="numeroFactura"
                  header="N° Factura / Documento"
                  body={(r: FacturaListItem) => (
                    <button
                      type="button"
                      className="history-link"
                      onClick={() => nav(`/telefonia/facturas/${r.idFactura}`)}
                      style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <strong>{r.numeroFactura || `Factura #${r.idFactura}`}</strong>
                      {r.numeroCuenta && <small className="cell-subtitle">Cuenta: {r.numeroCuenta}</small>}
                    </button>
                  )}
                />
                <Column field="operador.nombre" header="Operador" />
                <Column
                  header="Periodo Facturado"
                  body={(r: FacturaListItem) => (
                    <div>
                      <span>
                        {new Intl.DateTimeFormat('es-PE', { dateStyle: 'short' }).format(new Date(r.periodoInicio))} al{' '}
                        {new Intl.DateTimeFormat('es-PE', { dateStyle: 'short' }).format(new Date(r.periodoFin))}
                      </span>
                    </div>
                  )}
                />
                <Column
                  field="fechaEmision"
                  header="Emisión"
                  body={(r: FacturaListItem) =>
                    r.fechaEmision ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'short' }).format(new Date(r.fechaEmision)) : '—'
                  }
                />
                <Column
                  field="totalLineas"
                  header="Líneas Facturadas"
                  body={(r: FacturaListItem) => `${r.totalLineas} líneas`}
                />
                <Column
                  field="montoTotal"
                  header="Monto Total"
                  body={(r: FacturaListItem) => <strong>S/ {Number(r.montoTotal).toFixed(2)}</strong>}
                />
                <Column
                  field="estadoConciliacion"
                  header="Estado Conciliación"
                  body={(r: FacturaListItem) => (
                    <Tag
                      value={r.estadoConciliacion}
                      severity={estadoSeverities[r.estadoConciliacion] ?? 'secondary'}
                    />
                  )}
                />
                <Column
                  header="Acciones"
                  body={(r: FacturaListItem) => (
                    <div className="row-actions">
                      <Button
                        icon="pi pi-eye"
                        text
                        rounded
                        aria-label={`Ver factura ${r.numeroFactura || r.idFactura}`}
                        onClick={() => nav(`/telefonia/facturas/${r.idFactura}`)}
                      />
                    </div>
                  )}
                />
              </DataTable>
            </section>
          )}
        </>
      )}
    </>
  );
}
