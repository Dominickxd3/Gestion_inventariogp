import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { documentosApi } from '../api/documentos.api';
import { DocumentoListItem } from '../types/documentos.types';
import { useAuthStore } from '../../../stores/auth.store';

export default function DocumentosPage() {
  const queryClient = useQueryClient();
  const toastRef = useRef<Toast>(null);
  const permissions = useAuthStore((s) => s.permissions);

  const canGenerar = permissions.includes('DOCUMENTOS_GENERAR');

  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string | undefined>(undefined);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal Generar
  const [isGenerarOpen, setIsGenerarOpen] = useState(false);
  const [genTipo, setGenTipo] = useState<'ACTA_ENTREGA' | 'CONSTANCIA_DEVOLUCION'>('ACTA_ENTREGA');
  const [genIdAsignacion, setGenIdAsignacion] = useState<number | null>(null);
  const [genObs, setGenObs] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['documentos-list', { search, tipoFilter, fechaDesde, fechaHasta, page, pageSize }],
    queryFn: () =>
      documentosApi.list({
        search: search.trim() || undefined,
        tipo: tipoFilter,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        page,
        pageSize,
        sortBy: 'fecha_documento',
        sortDirection: 'DESC',
      }),
  });

  const generarMutation = useMutation({
    mutationFn: () => {
      if (!genIdAsignacion) throw new Error('Debe ingresar el ID de asignación');
      return documentosApi.generar({
        tipoDocumento: genTipo,
        idAsignacion: genIdAsignacion,
        observaciones: genObs || undefined,
      });
    },
    onSuccess: (res) => {
      toastRef.current?.show({
        severity: 'success',
        summary: 'Documento Generado',
        detail: `Se generó ${res.nombreArchivo} exitosamente.`,
      });
      setIsGenerarOpen(false);
      setGenIdAsignacion(null);
      setGenObs('');
      queryClient.invalidateQueries({ queryKey: ['documentos-list'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'No se pudo generar el documento.';
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error al Generar',
        detail: msg,
      });
    },
  });

  const handleDescargar = async (doc: DocumentoListItem) => {
    try {
      await documentosApi.descargar(doc.id, doc.nombreArchivo);
    } catch {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error de Descarga',
        detail: 'No se pudo descargar el archivo del servidor.',
      });
    }
  };

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Documentos Operativos de TI
          </h1>
          <p className="text-sm text-slate-500">
            Cargos de entrega, constancias de devolución y actas oficiales en PDF
          </p>
        </div>

        {canGenerar && (
          <Button
            label="Generar Documento"
            icon="pi pi-file-pdf"
            className="p-button-primary"
            onClick={() => setIsGenerarOpen(true)}
          />
        )}
      </div>

      {/* Filtros */}
      <div className="p-card p-3 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <span className="p-input-icon-left w-full">
            <i className="pi pi-search" />
            <InputText
              className="w-full"
              placeholder="Buscar por código de activo, trabajador o archivo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </span>
        </div>

        <Dropdown
          placeholder="Todos los tipos"
          value={tipoFilter}
          options={[
            { label: 'Acta de Entrega', value: 'ACTA_ENTREGA' },
            { label: 'Constancia de Devolución', value: 'CONSTANCIA_DEVOLUCION' },
          ]}
          showClear
          onChange={(e) => {
            setTipoFilter(e.value);
            setPage(1);
          }}
          className="w-56"
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

      {/* Tabla de Documentos */}
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
            setPageSize(e.rows ?? 10);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          emptyMessage="No se encontraron documentos registrados."
        >
          <Column
            field="tipoDocumento"
            header="Tipo Documento"
            body={(row: DocumentoListItem) => (
              <Tag
                value={row.tipoDocumento === 'ACTA_ENTREGA' ? 'CARGO ENTREGA' : 'DEVOLUCIÓN'}
                severity={row.tipoDocumento === 'ACTA_ENTREGA' ? 'info' : 'warning'}
              />
            )}
          />
          <Column field="activoCodigo" header="Código Activo" style={{ fontWeight: 600 }} />
          <Column field="activoTipo" header="Tipo Activo" />
          <Column field="trabajadorNombre" header="Colaborador Responsable" />
          <Column
            field="fechaDocumento"
            header="Fecha Documento"
            body={(row: DocumentoListItem) =>
              row.fechaDocumento
                ? new Date(row.fechaDocumento).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : 'N/D'
            }
          />
          <Column field="usuarioRegistroNombre" header="Generado Por" />
          <Column
            header="Acciones"
            body={(row: DocumentoListItem) => (
              <Button
                label="PDF"
                icon="pi pi-download"
                className="p-button-outlined p-button-sm p-button-danger"
                tooltip="Descargar documento PDF oficial"
                onClick={() => handleDescargar(row)}
              />
            )}
          />
        </DataTable>
      </div>

      {/* Modal Generar Documento */}
      <Dialog
        header="Generar Documento Operativo Oficial"
        visible={isGenerarOpen}
        style={{ width: '480px' }}
        onHide={() => setIsGenerarOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setIsGenerarOpen(false)}
            />
            <Button
              label="Generar PDF"
              icon="pi pi-check"
              loading={generarMutation.isPending}
              disabled={!genIdAsignacion}
              onClick={() => generarMutation.mutate()}
            />
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block font-medium text-sm mb-1">Tipo de Documento:</label>
            <Dropdown
              className="w-full"
              value={genTipo}
              options={[
                { label: 'Acta de Entrega (Cargo de Asignación)', value: 'ACTA_ENTREGA' },
                { label: 'Constancia de Devolución', value: 'CONSTANCIA_DEVOLUCION' },
              ]}
              onChange={(e) => setGenTipo(e.value)}
            />
          </div>

          <div>
            <label className="block font-medium text-sm mb-1">ID de Asignación:</label>
            <InputNumber
              className="w-full"
              value={genIdAsignacion}
              onValueChange={(e) => setGenIdAsignacion(e.value ?? null)}
              placeholder="Ej. 12"
              min={1}
            />
            <p className="text-xs text-slate-400 mt-1">
              Ingrese el identificador numérico de la asignación registrada.
            </p>
          </div>

          <div>
            <label className="block font-medium text-sm mb-1">Observaciones Adicionales:</label>
            <InputText
              className="w-full"
              value={genObs}
              onChange={(e) => setGenObs(e.target.value)}
              placeholder="Opcional: detalles especiales del cargo..."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
