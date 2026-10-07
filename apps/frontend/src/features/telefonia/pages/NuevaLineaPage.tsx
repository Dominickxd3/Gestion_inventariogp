import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { useCreateLinea, useOperadores, usePlanes } from '../hooks/useTelefonia';

export default function NuevaLineaPage() {
  const nav = useNavigate();
  const [numero, setNumero] = useState('');
  const [idOperador, setIdOperador] = useState<number | undefined>();
  const [idPlan, setIdPlan] = useState<number | undefined>();
  const [iccid, setIccid] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const operadores = useOperadores();
  const planes = usePlanes(idOperador);
  const createMutation = useCreateLinea();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNumero = numero.trim();
    if (!cleanNumero) {
      setFormError('El número de línea es obligatorio.');
      return;
    }
    if (cleanNumero.length < 6 || cleanNumero.length > 20) {
      setFormError('El número de línea debe tener entre 6 y 20 caracteres.');
      return;
    }
    if (!idOperador) {
      setFormError('Debe seleccionar el operador móvil.');
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        numero: cleanNumero,
        idOperador,
        idPlan,
        iccid: iccid.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      });
      nav(`/telefonia/${res.idLinea}`);
    } catch (err: unknown) {
      const respError = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(respError || 'Ocurrió un error al registrar la línea móvil.');
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
          <h1>Nueva Línea Móvil</h1>
          <p>Registra una nueva línea celular en el inventario corporativo.</p>
        </div>
      </header>

      <section className="form-card" style={{ maxWidth: '640px' }}>
        {formError && (
          <div style={{ marginBottom: '18px' }}>
            <Message severity="error" text={formError} />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
          <div className="field">
            <label htmlFor="numero">
              Número Móvil <span style={{ color: '#b42318' }}>*</span>
            </label>
            <InputText
              id="numero"
              value={numero}
              maxLength={20}
              placeholder="Ej. 987654321 o +51987654321"
              onChange={(e) => setNumero(e.target.value.replace(/[^\d+ -]/g, ''))}
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
              Admite líneas nacionales (9 dígitos), corporativas o con prefijo internacional (6 a 20 caracteres).
            </small>
          </div>

          <div className="field">
            <label htmlFor="operador">
              Operador Móvil <span style={{ color: '#b42318' }}>*</span>
            </label>
            <Dropdown
              id="operador"
              value={idOperador}
              options={operadores.data ?? []}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccionar operador"
              onChange={(e) => {
                setIdOperador(e.value);
                setIdPlan(undefined);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="plan">Plan Móvil (opcional)</label>
            <Dropdown
              id="plan"
              value={idPlan}
              options={planes.data ?? []}
              optionLabel="nombre"
              optionValue="id"
              placeholder={idOperador ? 'Seleccionar plan' : 'Selecciona un operador primero'}
              disabled={!idOperador}
              showClear
              onChange={(e) => setIdPlan(e.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="iccid">ICCID / Tarjeta SIM (opcional)</label>
            <InputText
              id="iccid"
              value={iccid}
              placeholder="Número de serie de la SIM card"
              onChange={(e) => setIccid(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="observaciones">Observaciones (opcional)</label>
            <InputTextarea
              id="observaciones"
              value={observaciones}
              rows={3}
              placeholder="Notas o detalles adicionales de la línea..."
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <Button
              type="button"
              label="Cancelar"
              outlined
              onClick={() => nav('/telefonia')}
              disabled={createMutation.isPending}
            />
            <Button
              type="submit"
              label={createMutation.isPending ? 'Guardando...' : 'Crear Línea'}
              icon="pi pi-check"
              loading={createMutation.isPending}
            />
          </div>
        </form>
      </section>
    </>
  );
}
