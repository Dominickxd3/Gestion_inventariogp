import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { auditoriaApi } from '../api/auditoria.api';
import { AuditoriaListItem, AuditoriaDetail } from '../types/auditoria.types';

const modulosList = [
  'ACTIVOS',
  'ASIGNACIONES',
  'TELEFONIA',
  'MANTENIMIENTO',
  'INVENTARIO',
  'DOCUMENTOS',
  'SEGURIDAD',
];

export default function AuditoriaPage() {
  const toastRef = React.useRef<Toast>(null);

  const [search, setSearch] = useState('');
  const [moduloFilter, setModuloFilter] = useState<string | undefined>(undefined);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [selectedItem, setSelectedItem] = useState<AuditoriaDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria-list', { search, moduloFilter, fechaDesde, fechaHasta, page, pageSize }],
    queryFn: () =>
      auditoriaApi.list({
        search: search.trim() || undefined,
        modulo: moduloFilter,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        page,
        pageSize,
        sortBy: 'fecha',
        sortDirection: 'DESC',
      }),
  });

  const openDetail = async (row: AuditoriaListItem) => {
    try {
      const detail = await auditoriaApi.getById(row.id);
      setSelectedItem(detail);
      setIsDetailOpen(true);
    } catch {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el detalle del registro de auditoría.',
      });
    }
  };

  const renderDiff = (before: unknown, after: unknown) => {
    if (!before && !after) return <p className="text-sm text-slate-400">Sin datos de modificación.</p>;

    const isObject = (val: unknown): val is Record<string, unknown> =>
      typeof val === 'object' && val !== null && !Array.isArray(val);
    const beforeObj: Record<string, unknown> = isObject(before) ? before : {};
    const afterObj: Record<string, unknown> = isObject(after) ? after : {};
    const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));

    if (allKeys.length === 0) {
      return (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-500">Datos Anteriores:</span>
            <pre className="p-2 bg-slate-100 dark:bg-slate-800 rounded mt-1 overflow-x-auto">
              {JSON.stringify(before, null, 2) ?? 'null'}
            </pre>
          </div>
          <div>
            <span className="font-bold text-slate-500">Datos Nuevos:</span>
            <pre className="p-2 bg-slate-100 dark:bg-slate-800 rounded mt-1 overflow-x-auto">
              {JSON.stringify(after, null, 2) ?? 'null'}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border rounded text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 border-b">
              <th className="p-2 font-bold">Campo</th>
              <th className="p-2 font-bold text-red-600 dark:text-red-400">Valor Anterior</th>
              <th className="p-2 font-bold text-green-600 dark:text-green-400">Valor Nuevo</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map((k) => {
              const bVal = beforeObj[k];
              const aVal = afterObj[k];
              const isChanged = JSON.stringify(bVal) !== JSON.stringify(aVal);

              return (
                <tr
                  key={k}
                  className={`border-b ${isChanged ? 'bg-amber-50/50 dark:bg-amber-950/20 font-medium' : ''}`}
                >
                  <td className="p-2 font-mono text-slate-600 dark:text-slate-300">{k}</td>
                  <td className="p-2 font-mono text-slate-700 dark:text-slate-300">
                    {bVal !== undefined ? JSON.stringify(bVal) : <span className="text-slate-400 italic">vacío</span>}
                  </td>
                  <td className="p-2 font-mono text-slate-700 dark:text-slate-300">
                    {aVal !== undefined ? JSON.stringify(aVal) : <span className="text-slate-400 italic">vacío</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Auditoría y Trazabilidad del Sistema
        </h1>
        <p className="text-sm text-slate-500">
          Registro inmutable de todas las operaciones realizadas en Gestión TI
        </p>
      </div>

      {/* Filtros */}
      <div className="p-card p-3 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <span className="p-input-icon-left w-full">
            <i className="pi pi-search" />
            <InputText
              className="w-full"
              placeholder="Buscar por usuario, acción o registro ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </span>
        </div>

        <Dropdown
          placeholder="Todos los módulos"
          value={moduloFilter}
          options={modulosList.map((m) => ({ label: m, value: m }))}
          showClear
          onChange={(e) => {
            setModuloFilter(e.value);
            setPage(1);
          }}
          className="w-48"
        />

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Desde:</label>
          <InputText
            type="date"
            className="p-inputtext-sm"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Hasta:</label>
          <InputText
            type="date"
            className="p-inputtext-sm"
            value={fechaHasta}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Tabla de Auditoría */}
      <div className="p-card">
        <DataTable
          value={data?.items ?? []}
          loading={isLoading}
          lazy
          paginator
          rows={pageSize}
          totalRecords={data?.pagination.total ?? 0}
          first={(page - 1) * pageSize}
          onPage={(e) => {
            setPage((e.page ?? 0) + 1);
            setPageSize(e.rows ?? 20);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          emptyMessage="No se encontraron registros de auditoría."
        >
          <Column
            field="fecha"
            header="Fecha y Hora"
            body={(row: AuditoriaListItem) =>
              new Date(row.fecha).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            }
          />
          <Column
            field="modulo"
            header="Módulo"
            body={(row: AuditoriaListItem) => <Tag value={row.modulo} severity="info" />}
          />
          <Column field="accion" header="Acción" style={{ fontWeight: 600 }} />
          <Column
            field="usuarioLogon"
            header="Usuario"
            body={(row: AuditoriaListItem) => row.usuarioNombre ?? row.usuarioLogon ?? 'SISTEMA'}
          />
          <Column field="tablaAfectada" header="Tabla" />
          <Column field="registroId" header="ID Registro" />
          <Column field="direccionIp" header="IP" />
          <Column
            header="Detalle"
            body={(row: AuditoriaListItem) => (
              <Button
                icon="pi pi-search-plus"
                className="p-button-text p-button-sm"
                tooltip="Ver cambios y snapshots"
                onClick={() => openDetail(row)}
              />
            )}
          />
        </DataTable>
      </div>

      {/* Modal Detalle de Auditoría */}
      <Dialog
        header={`Evento de Auditoría #${selectedItem?.id ?? ''} · ${selectedItem?.accion ?? ''}`}
        visible={isDetailOpen}
        style={{ width: '750px' }}
        onHide={() => setIsDetailOpen(false)}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded border">
              <div>
                <span className="font-semibold text-slate-500">Módulo:</span>
                <p className="font-bold text-slate-800 dark:text-slate-100">{selectedItem.modulo}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Acción:</span>
                <p className="font-bold text-slate-800 dark:text-slate-100">{selectedItem.accion}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Usuario:</span>
                <p className="text-slate-800 dark:text-slate-100">
                  {selectedItem.usuarioNombre} ({selectedItem.usuarioLogon ?? 'N/D'})
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Tabla / Registro:</span>
                <p className="font-mono text-slate-800 dark:text-slate-100">
                  {selectedItem.tablaAfectada} #{selectedItem.registroId}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Dirección IP:</span>
                <p className="font-mono text-slate-800 dark:text-slate-100">
                  {selectedItem.direccionIp ?? 'N/D'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Fecha:</span>
                <p className="text-slate-800 dark:text-slate-100">
                  {new Date(selectedItem.fecha).toLocaleString('es-PE')}
                </p>
              </div>
            </div>

            <TabView>
              <TabPanel header="Comparación de Cambios">
                {renderDiff(selectedItem.datosAnteriores, selectedItem.datosNuevos)}
              </TabPanel>
              <TabPanel header="JSON Crudo">
                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <span className="font-bold text-slate-500">Snapshot Anterior:</span>
                    <pre className="p-2 bg-slate-100 dark:bg-slate-800 rounded mt-1 max-h-48 overflow-y-auto">
                      {JSON.stringify(selectedItem.datosAnteriores, null, 2) ?? 'null'}
                    </pre>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Snapshot Nuevo:</span>
                    <pre className="p-2 bg-slate-100 dark:bg-slate-800 rounded mt-1 max-h-48 overflow-y-auto">
                      {JSON.stringify(selectedItem.datosNuevos, null, 2) ?? 'null'}
                    </pre>
                  </div>
                </div>
              </TabPanel>
            </TabView>
          </div>
        )}
      </Dialog>
    </div>
  );
}
