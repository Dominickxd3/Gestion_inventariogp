import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { useCreateFactura } from '../hooks/useFacturacion';
import { useOperadores } from '../hooks/useTelefonia';
import { CreateFacturaDetalleInput } from '../types/facturacion.types';

export default function NuevaFacturaPage() {
  const nav = useNavigate();
  const operadores = useOperadores();
  const createFacturaMut = useCreateFactura();

  // Cabecera
  const [idOperador, setIdOperador] = useState<number | undefined>();
  const [numeroFactura, setNumeroFactura] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFin, setPeriodoFin] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Líneas del detalle
  const [detalles, setDetalles] = useState<CreateFacturaDetalleInput[]>([
    {
      numeroLinea: '',
      nombrePlan: '',
      cargoPlan: 0,
      cargosAdicionales: 0,
      descuentos: 0,
      cargoEquipos: 0,
      prorrateo: 0,
      saldoAnterior: 0,
      montoTotal: 0,
      observaciones: '',
    },
  ]);

  const addRow = () => {
    setDetalles((prev) => [
      ...prev,
      {
        numeroLinea: '',
        nombrePlan: '',
        cargoPlan: 0,
        cargosAdicionales: 0,
        descuentos: 0,
        cargoEquipos: 0,
        prorrateo: 0,
        saldoAnterior: 0,
        montoTotal: 0,
        observaciones: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    setDetalles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateRow = (index: number, field: keyof CreateFacturaDetalleInput, val: unknown) => {
    setDetalles((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };

      // Recalcular montoTotal de la línea
      const cPlan = Number(item.cargoPlan || 0);
      const cAdic = Number(item.cargosAdicionales || 0);
      const cEq = Number(item.cargoEquipos || 0);
      const prorr = Number(item.prorrateo || 0);
      const sAnt = Number(item.saldoAnterior || 0);
      const desc = Number(item.descuentos || 0);
      item.montoTotal = Number((cPlan + cAdic + cEq + prorr + sAnt - desc).toFixed(2));

      copy[index] = item;
      return copy;
    });
  };

  const montoTotalCalculado = detalles.reduce((acc, curr) => acc + (curr.montoTotal ?? 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!idOperador) {
      setFormError('Debe seleccionar el operador móvil de la factura.');
      return;
    }
    if (!fechaEmision || !periodoInicio || !periodoFin) {
      setFormError('La fecha de emisión y las fechas del periodo inicio y fin son obligatorias.');
      return;
    }
    if (new Date(periodoFin) < new Date(periodoInicio)) {
      setFormError('La fecha de fin del periodo debe ser mayor o igual a la fecha de inicio.');
      return;
    }
    if (detalles.length === 0) {
      setFormError('Debe ingresar al menos una línea facturada en el detalle.');
      return;
    }

    // Validar líneas
    const numeros = new Set<string>();
    for (let i = 0; i < detalles.length; i++) {
      const num = detalles[i].numeroLinea.trim();
      if (!num) {
        setFormError(`La línea #${i + 1} no tiene número móvil ingresado.`);
        return;
      }
      if (numeros.has(num)) {
        setFormError(`El número de línea ${num} está repetido en el detalle.`);
        return;
      }
      numeros.add(num);
    }

    try {
      const res = await createFacturaMut.mutateAsync({
        idOperador,
        numeroFactura: numeroFactura.trim() || undefined,
        numeroCuenta: numeroCuenta.trim() || undefined,
        fechaEmision,
        periodoInicio,
        periodoFin,
        fechaVencimiento: fechaVencimiento || undefined,
        montoTotal: Number(montoTotalCalculado.toFixed(2)),
        observaciones: observaciones.trim() || undefined,
        detalles: detalles.map((d) => ({
          ...d,
          numeroLinea: d.numeroLinea.trim(),
          nombrePlan: d.nombrePlan?.trim() || undefined,
          observaciones: d.observaciones?.trim() || undefined,
        })),
      });

      nav(`/telefonia/facturas/${res.idFactura}`);
    } catch (err: unknown) {
      const respError = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(respError || 'Ocurrió un error al registrar la factura de telefonía.');
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
          <h1>Nueva Factura de Telefonía</h1>
          <p>Registro estructurado de cabecera y desglose de líneas facturadas para conciliación histórica.</p>
        </div>
      </header>

      {formError && (
        <div style={{ marginBottom: '18px', maxWidth: '1100px' }}>
          <Message severity="error" text={formError} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '22px', maxWidth: '1100px' }}>
        {/* Cabecera */}
        <section className="form-card">
          <h2 style={{ marginTop: 0, fontSize: '16px', marginBottom: '16px' }}>Datos Principales del Comprobante</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
                onChange={(e) => setIdOperador(e.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="numeroFactura">Número de Factura / Documento</label>
              <InputText
                id="numeroFactura"
                value={numeroFactura}
                placeholder="Ej. F001-00023456"
                onChange={(e) => setNumeroFactura(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="numeroCuenta">Número de Cuenta</label>
              <InputText
                id="numeroCuenta"
                value={numeroCuenta}
                placeholder="Ej. 10239485"
                onChange={(e) => setNumeroCuenta(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="fechaEmision">
                Fecha Emisión <span style={{ color: '#b42318' }}>*</span>
              </label>
              <InputText
                id="fechaEmision"
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="periodoInicio">
                Periodo Inicio <span style={{ color: '#b42318' }}>*</span>
              </label>
              <InputText
                id="periodoInicio"
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="periodoFin">
                Periodo Fin <span style={{ color: '#b42318' }}>*</span>
              </label>
              <InputText
                id="periodoFin"
                type="date"
                value={periodoFin}
                onChange={(e) => setPeriodoFin(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="fechaVencimiento">Fecha Vencimiento (opcional)</label>
              <InputText
                id="fechaVencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="montoTotalCalculado">Monto Total Factura (S/)</label>
              <InputText
                id="montoTotalCalculado"
                value={`S/ ${montoTotalCalculado.toFixed(2)}`}
                disabled
                style={{ fontWeight: 'bold' }}
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: '14px' }}>
            <label htmlFor="observaciones">Observaciones Generales</label>
            <InputTextarea
              id="observaciones"
              value={observaciones}
              rows={2}
              placeholder="Notas de facturación o recepción del documento..."
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>
        </section>

        {/* Tabla editable de líneas facturadas */}
        <section className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px' }}>Desglose de Líneas Facturadas ({detalles.length})</h2>
              <small style={{ color: 'var(--text-secondary)' }}>
                Ingresa los consumos y cargos reportados por el operador para cada línea.
              </small>
            </div>
            <Button
              type="button"
              label="Agregar Línea"
              icon="pi pi-plus"
              size="small"
              onClick={addRow}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-50, #f8fafc)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>Número Línea *</th>
                  <th style={{ padding: '8px' }}>Nombre Plan</th>
                  <th style={{ padding: '8px' }}>Cargo Plan (S/)</th>
                  <th style={{ padding: '8px' }}>Adicionales (S/)</th>
                  <th style={{ padding: '8px' }}>Equipos (S/)</th>
                  <th style={{ padding: '8px' }}>Descuentos (S/)</th>
                  <th style={{ padding: '8px' }}>Total (S/)</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                    <td style={{ padding: '6px' }}>
                      <InputText
                        value={row.numeroLinea}
                        maxLength={20}
                        placeholder="Ej. 987654321"
                        onChange={(e) => updateRow(idx, 'numeroLinea', e.target.value.replace(/[^\d+ -]/g, ''))}
                        style={{ width: '130px', padding: '6px 8px', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <InputText
                        value={row.nombrePlan ?? ''}
                        placeholder="Plan Max..."
                        onChange={(e) => updateRow(idx, 'nombrePlan', e.target.value)}
                        style={{ width: '140px', padding: '6px 8px', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <InputText
                        type="number"
                        step="0.01"
                        value={String(row.cargoPlan ?? 0)}
                        onChange={(e) => updateRow(idx, 'cargoPlan', parseFloat(e.target.value) || 0)}
                        style={{ width: '90px', padding: '6px 8px', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <InputText
                        type="number"
                        step="0.01"
                        value={String(row.cargosAdicionales ?? 0)}
                        onChange={(e) => updateRow(idx, 'cargosAdicionales', parseFloat(e.target.value) || 0)}
                        style={{ width: '90px', padding: '6px 8px', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <InputText
                        type="number"
                        step="0.01"
                        value={String(row.cargoEquipos ?? 0)}
                        onChange={(e) => updateRow(idx, 'cargoEquipos', parseFloat(e.target.value) || 0)}
                        style={{ width: '90px', padding: '6px 8px', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <InputText
                        type="number"
                        step="0.01"
                        value={String(row.descuentos ?? 0)}
                        onChange={(e) => updateRow(idx, 'descuentos', parseFloat(e.target.value) || 0)}
                        style={{ width: '90px', padding: '6px 8px', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '6px', fontWeight: 'bold' }}>
                      S/ {row.montoTotal?.toFixed(2)}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      {detalles.length > 1 && (
                        <Button
                          type="button"
                          icon="pi pi-trash"
                          text
                          rounded
                          severity="danger"
                          size="small"
                          aria-label={`Eliminar fila ${idx + 1}`}
                          onClick={() => removeRow(idx)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <Button
            type="button"
            label="Cancelar"
            outlined
            onClick={() => nav('/telefonia')}
            disabled={createFacturaMut.isPending}
          />
          <Button
            type="submit"
            label={createFacturaMut.isPending ? 'Guardando Factura...' : 'Guardar y Procesar Factura'}
            icon="pi pi-check"
            loading={createFacturaMut.isPending}
          />
        </div>
      </form>
    </>
  );
}
