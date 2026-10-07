import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Skeleton } from 'primereact/skeleton';
import { activosApi } from '../../activos/api/activos.api';
import { AssetListItem } from '../../activos/types/activos.types';
import { useCreateMantenimiento, useMantenimiento, useUpdateMantenimiento } from '../hooks/useMantenimientos';
import { CreateMantenimientoPayload } from '../types/mantenimientos.types';

interface FormValues {
  idActivo: number;
  tipo: 'CORRECTIVO' | 'PREVENTIVO';
  fechaProgramada?: string;
  fechaInicio?: string;
  problemaReportado?: string;
  diagnostico?: string;
  trabajoRealizado?: string;
  costo?: number;
  proveedor?: string;
  estado?: 'PENDIENTE' | 'EN_PROCESO';
  proximoMantenimiento?: string;
  observaciones?: string;
  cambiarEstadoActivo?: boolean;
}

export default function MantenimientoFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const mantenimientoId = Number(id || 0);

  const nav = useNavigate();
  const createMutation = useCreateMantenimiento();
  const updateMutation = useUpdateMantenimiento(mantenimientoId);
  const detailQuery = useMantenimiento(mantenimientoId);

  const [assetOptions, setAssetOptions] = useState<{ label: string; value: number }[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [searchingAssets, setSearchingAssets] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      tipo: 'CORRECTIVO',
      estado: 'PENDIENTE',
      cambiarEstadoActivo: true,
    },
  });

  // Search assets
  useEffect(() => {
    let active = true;
    const fetchAssets = async () => {
      setSearchingAssets(true);
      try {
        const res = await activosApi.list({
          page: 1,
          pageSize: 30,
          sortBy: 'codigo',
          sortDirection: 'asc',
          search: assetSearch,
        });
        if (active) {
          setAssetOptions(
            res.items.map((a: AssetListItem) => ({
              label: `${a.codigo} - ${[a.marca, a.modelo].filter(Boolean).join(' ') || a.tipo} (${a.estado})`,
              value: a.id,
            }))
          );
        }
      } catch {
        // Ignore search error
      } finally {
        if (active) setSearchingAssets(false);
      }
    };

    fetchAssets();
    return () => {
      active = false;
    };
  }, [assetSearch]);

  // Load existing data in edit mode
  useEffect(() => {
    if (isEdit && detailQuery.data) {
      const d = detailQuery.data;
      setValue('idActivo', d.idActivo);
      setValue('tipo', d.tipo);
      setValue('fechaProgramada', d.fechaProgramada || '');
      setValue('fechaInicio', d.fechaInicio ? d.fechaInicio.slice(0, 10) : '');
      setValue('problemaReportado', d.problemaReportado || '');
      setValue('diagnostico', d.diagnostico || '');
      setValue('trabajoRealizado', d.trabajoRealizado || '');
      setValue('costo', d.costo || undefined);
      setValue('proveedor', d.proveedor || '');
      setValue('estado', d.estado === 'EN_PROCESO' ? 'EN_PROCESO' : 'PENDIENTE');
      setValue('proximoMantenimiento', d.proximoMantenimiento || '');
      setValue('observaciones', d.observaciones || '');

      setAssetOptions(prev => {
        if (!prev.some(x => x.value === d.idActivo)) {
          return [
            {
              label: `${d.activoCompleto?.codigo || d.activo.codigo} - ${[d.activoCompleto?.marca, d.activoCompleto?.modelo].filter(Boolean).join(' ') || d.activo.tipo}`,
              value: d.idActivo,
            },
            ...prev,
          ];
        }
        return prev;
      });
    }
  }, [isEdit, detailQuery.data, setValue]);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          tipo: values.tipo,
          fechaProgramada: values.fechaProgramada || undefined,
          fechaInicio: values.fechaInicio || undefined,
          problemaReportado: values.problemaReportado || undefined,
          diagnostico: values.diagnostico || undefined,
          trabajoRealizado: values.trabajoRealizado || undefined,
          costo: values.costo,
          proveedor: values.proveedor || undefined,
          estado: values.estado,
          proximoMantenimiento: values.proximoMantenimiento || undefined,
          observaciones: values.observaciones || undefined,
        });
        nav(`/mantenimientos/${mantenimientoId}`);
      } else {
        const payload: CreateMantenimientoPayload = {
          idActivo: values.idActivo,
          tipo: values.tipo,
          fechaProgramada: values.fechaProgramada || undefined,
          fechaInicio: values.fechaInicio || undefined,
          problemaReportado: values.problemaReportado || undefined,
          diagnostico: values.diagnostico || undefined,
          trabajoRealizado: values.trabajoRealizado || undefined,
          costo: values.costo,
          proveedor: values.proveedor || undefined,
          estado: values.estado,
          proximoMantenimiento: values.proximoMantenimiento || undefined,
          observaciones: values.observaciones || undefined,
          cambiarEstadoActivo: values.cambiarEstadoActivo,
        };
        const created = await createMutation.mutateAsync(payload);
        nav(`/mantenimientos/${created.id}`);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSubmitError(e.response?.data?.message || 'Error al guardar el mantenimiento.');
    }
  };

  if (isEdit && detailQuery.isPending) {
    return <Skeleton height="450px" />;
  }

  return (
    <div className="telefonia-page">
      <header className="page-header module-header">
        <div>
          <p className="eyebrow">MANTENIMIENTO DE ACTIVOS</p>
          <h1>{isEdit ? `Editar Mantenimiento #${mantenimientoId}` : 'Nuevo Mantenimiento'}</h1>
          <p>
            {isEdit
              ? 'Actualización controlada de datos del mantenimiento.'
              : 'Registrar nueva intervención técnica sobre un activo de TI.'}
          </p>
        </div>
        <Button label="Volver" icon="pi pi-arrow-left" outlined onClick={() => nav(-1)} />
      </header>

      {submitError && (
        <section className="form-feedback error mb-3" style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px' }}>
          <strong>Error:</strong> {submitError}
        </section>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
        <section className="form-section">
          <h2>Activo e Intervención</h2>

          <div className="form-field">
            <label htmlFor="idActivo">Activo *</label>
            <Controller
              name="idActivo"
              control={control}
              rules={{ required: 'Seleccione un activo para la intervención.' }}
              render={({ field }) => (
                <Dropdown
                  id="idActivo"
                  value={field.value}
                  options={assetOptions}
                  onChange={e => field.onChange(e.value)}
                  placeholder="Seleccionar activo..."
                  filter
                  filterBy="label"
                  onFilter={e => setAssetSearch(e.filter)}
                  disabled={isEdit}
                  loading={searchingAssets}
                  className={errors.idActivo ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.idActivo && <span className="field-error">{errors.idActivo.message}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="tipo">Tipo de mantenimiento *</label>
            <Controller
              name="tipo"
              control={control}
              rules={{ required: 'El tipo es obligatorio.' }}
              render={({ field }) => (
                <Dropdown
                  id="tipo"
                  value={field.value}
                  options={[
                    { label: 'Correctivo', value: 'CORRECTIVO' },
                    { label: 'Preventivo', value: 'PREVENTIVO' },
                  ]}
                  onChange={e => field.onChange(e.value)}
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="estado">Estado inicial</label>
            <Controller
              name="estado"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="estado"
                  value={field.value}
                  options={[
                    { label: 'Pendiente', value: 'PENDIENTE' },
                    { label: 'En Proceso', value: 'EN_PROCESO' },
                  ]}
                  onChange={e => field.onChange(e.value)}
                />
              )}
            />
          </div>

          {!isEdit && (
            <div className="form-field mt-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Controller
                  name="cambiarEstadoActivo"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      inputId="cambiarEstadoActivo"
                      checked={field.value ?? false}
                      onChange={e => field.onChange(e.checked)}
                    />
                  )}
                />
                <label htmlFor="cambiarEstadoActivo" style={{ cursor: 'pointer', margin: 0 }}>
                  Cambiar estado del activo a MANTENIMIENTO (si está DISPONIBLE)
                </label>
              </div>
              <small style={{ color: 'var(--text-color-secondary)', display: 'block', marginTop: '0.25rem' }}>
                Si el activo está actualmente asignado, mantendrá su asignación sin romperla.
              </small>
            </div>
          )}
        </section>

        <section className="form-section">
          <h2>Fechas y Costos</h2>

          <div className="form-field">
            <label htmlFor="fechaProgramada">Fecha programada</label>
            <Controller
              name="fechaProgramada"
              control={control}
              render={({ field }) => (
                <InputText
                  id="fechaProgramada"
                  type="date"
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value)}
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="fechaInicio">Fecha de inicio</label>
            <Controller
              name="fechaInicio"
              control={control}
              render={({ field }) => (
                <InputText
                  id="fechaInicio"
                  type="date"
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value)}
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="costo">Costo estimado (S/)</label>
            <Controller
              name="costo"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="costo"
                  value={field.value}
                  onValueChange={e => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  min={0}
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="proveedor">Proveedor / Técnico</label>
            <Controller
              name="proveedor"
              control={control}
              render={({ field }) => (
                <InputText
                  id="proveedor"
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value)}
                  placeholder="Ej: Servicio Técnico Autorizado HP"
                  maxLength={200}
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="proximoMantenimiento">Próximo mantenimiento sugerido</label>
            <Controller
              name="proximoMantenimiento"
              control={control}
              render={({ field }) => (
                <InputText
                  id="proximoMantenimiento"
                  type="date"
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value)}
                />
              )}
            />
          </div>
        </section>

        <section className="form-section form-field--wide">
          <h2>Detalle del Problema y Trabajo</h2>

          <div className="form-field">
            <label htmlFor="problemaReportado">Problema reportado</label>
            <Controller
              name="problemaReportado"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="problemaReportado"
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value)}
                  rows={3}
                  maxLength={1500}
                  placeholder="Describa la falla o motivo del servicio..."
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="diagnostico">Diagnóstico</label>
            <Controller
              name="diagnostico"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="diagnostico"
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value)}
                  rows={3}
                  maxLength={1500}
                  placeholder="Diagnóstico emitido por el técnico o proveedor..."
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="trabajoRealizado">Trabajo realizado</label>
            <Controller
              name="trabajoRealizado"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="trabajoRealizado"
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value)}
                  rows={3}
                  maxLength={2500}
                  placeholder="Detalle de componentes cambiados, reparaciones o limpiezas..."
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="observaciones">Observaciones generales</label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value)}
                  rows={2}
                  maxLength={1500}
                  placeholder="Notas adicionales..."
                />
              )}
            />
          </div>

          <div className="form-actions mt-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              label="Cancelar"
              severity="secondary"
              outlined
              onClick={() => nav(-1)}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              label={isEdit ? 'Guardar cambios' : 'Registrar mantenimiento'}
              icon="pi pi-check"
              loading={isSubmitting}
            />
          </div>
        </section>
      </form>
    </div>
  );
}
