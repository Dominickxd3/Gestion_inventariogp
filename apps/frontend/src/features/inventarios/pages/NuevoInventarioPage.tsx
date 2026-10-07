import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { catalogosApi } from '../../activos/api/activos.api';
import { CatalogItem } from '../../activos/types/activos.types';
import { useCreateInventario } from '../hooks/useInventarios';
import { CreateInventarioPayload } from '../types/inventarios.types';

interface FormValues {
  nombre: string;
  idSede?: number;
  observaciones?: string;
}

export default function NuevoInventarioPage() {
  const nav = useNavigate();
  const createMutation = useCreateInventario();

  const [sedes, setSedes] = useState<CatalogItem[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      nombre: '',
      idSede: undefined,
      observaciones: '',
    },
  });

  useEffect(() => {
    catalogosApi.sedes().then(setSedes).catch(() => {});
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const payload: CreateInventarioPayload = {
        nombre: values.nombre.trim(),
        idSede: values.idSede ? Number(values.idSede) : undefined,
        observaciones: values.observaciones?.trim() || undefined,
      };

      const created = await createMutation.mutateAsync(payload);
      nav(`/inventarios/${created.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSubmitError(e.response?.data?.message || 'Error al iniciar la campaña de inventario.');
    }
  };

  const sedeOptions = [
    { label: 'Global (Todas las sedes)', value: undefined },
    ...sedes.map(s => ({ label: s.nombre, value: s.id })),
  ];

  return (
    <div className="telefonia-page">
      <header className="page-header module-header">
        <div>
          <p className="eyebrow">INVENTARIO FÍSICO</p>
          <h1>Nueva Campaña de Inventario</h1>
          <p>Creación y apertura de campaña de verificación patrimonial.</p>
        </div>
        <Button label="Volver" icon="pi pi-arrow-left" outlined onClick={() => nav('/inventarios')} />
      </header>

      {submitError && (
        <section className="form-feedback error mb-3" style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px' }}>
          <strong>Error:</strong> {submitError}
        </section>
      )}

      {/* Info callout on snapshot */}
      <section className="form-section mb-4" style={{ background: 'var(--surface-50)', borderLeft: '4px solid var(--primary-color)' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>
          <i className="pi pi-info-circle mr-2" />
          Generación automática de snapshot esperado
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-color-secondary)' }}>
          Al iniciar la campaña, el sistema genera automáticamente un snapshot histórico de todos los activos operativos
          asignados a la sede seleccionada (o de todas las sedes si es global). Los activos quedarán en estado{' '}
          <strong>PENDIENTE</strong> para su contrastación física en terreno.
        </p>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
        <section className="form-section form-field--wide">
          <h2>Datos de la Campaña</h2>

          <div className="form-field">
            <label htmlFor="nombre">Nombre de la campaña *</label>
            <Controller
              name="nombre"
              control={control}
              rules={{
                required: 'El nombre de la campaña es obligatorio.',
                maxLength: { value: 200, message: 'Máximo 200 caracteres.' },
              }}
              render={({ field }) => (
                <InputText
                  id="nombre"
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  placeholder="Ej: Inventario General Sede Central 2026-II"
                  className={errors.nombre ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.nombre && <span className="field-error">{errors.nombre.message}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="idSede">Sede a inventariar</label>
            <Controller
              name="idSede"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="idSede"
                  value={field.value}
                  options={sedeOptions}
                  onChange={e => field.onChange(e.value)}
                  placeholder="Seleccione sede o global..."
                />
              )}
            />
            <small style={{ color: 'var(--text-color-secondary)' }}>
              Si selecciona una sede, solo se incluirán los activos ubicados en ella.
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="observaciones">Objetivo / Observaciones</label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value)}
                  rows={3}
                  maxLength={1500}
                  placeholder="Alcance, equipo auditor o instrucciones de la campaña..."
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
              onClick={() => nav('/inventarios')}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              label="Iniciar campaña y generar snapshot"
              icon="pi pi-check"
              loading={isSubmitting}
            />
          </div>
        </section>
      </form>
    </div>
  );
}
