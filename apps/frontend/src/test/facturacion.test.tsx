import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import TelefoniaPage from '../features/telefonia/pages/TelefoniaPage';
import FacturaDetailPage from '../features/telefonia/pages/FacturaDetailPage';
import NuevaFacturaPage from '../features/telefonia/pages/NuevaFacturaPage';

const mockFacturasPage = {
  items: [
    {
      idFactura: 1,
      numeroFactura: 'F001-00045612',
      numeroCuenta: '10293847',
      fechaEmision: '2026-09-05',
      periodoInicio: '2026-08-01',
      periodoFin: '2026-08-31',
      fechaVencimiento: '2026-09-25',
      montoTotal: 1540.5,
      archivoPdf: null,
      estadoConciliacion: 'CONCILIADO',
      fechaImportacion: '2026-09-06T10:00:00',
      fechaCierre: null,
      operador: { id: 1, nombre: 'Claro' },
      usuarioImportacion: 'Admin TI',
      totalLineas: 15,
    },
  ],
  pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
};

const mockFacturaDetail = {
  idFactura: 1,
  numeroFactura: 'F001-00045612',
  numeroCuenta: '10293847',
  fechaEmision: '2026-09-05',
  periodoInicio: '2026-08-01',
  periodoFin: '2026-08-31',
  fechaVencimiento: '2026-09-25',
  montoTotal: 1540.5,
  archivoPdf: null,
  estadoConciliacion: 'EN_REVISION',
  fechaImportacion: '2026-09-06T10:00:00',
  fechaCierre: null,
  observaciones: 'Factura mensual de líneas operativas',
  operador: { id: 1, nombre: 'Claro' },
  usuarioImportacion: 'Admin TI',
  usuarioCierre: null,
  resumen: {
    totalLineas: 2,
    conformes: 1,
    observados: 1,
    corregidos: 0,
    pendientes: 0,
    totalCargosPlan: 139.8,
    totalCargosAdicionales: 25.5,
    totalCargosEquipos: 0,
    totalDescuentos: 0,
    totalCalculado: 165.3,
  },
  cuotasVinculadas: [
    {
      idCuota: 4,
      idFinanciamiento: 2,
      numeroCuota: 6,
      monto: 75.0,
      estado: 'FACTURADA',
      fechaFacturacion: '2026-09-05',
      activo: { codigo: 'CEL-001', marca: 'Samsung', modelo: 'Galaxy A54' },
      numeroFolio: 'F-2026-001',
    },
  ],
};

const mockDetallesPage = {
  items: [
    {
      idDetalle: 101,
      idFactura: 1,
      idLinea: 10,
      numeroLinea: '987654321',
      nombrePlan: 'Plan Max 69.90',
      cargoPlan: 69.9,
      prorrateo: 0,
      cargosAdicionales: 0,
      descuentos: 0,
      cargoEquipos: 0,
      saldoAnterior: 0,
      montoTotal: 69.9,
      estadoConciliacion: 'CONFORME',
      observaciones: null,
      lineaEstado: 'ACTIVA',
      diagnosticos: ['CONFORME'],
      responsablesPeriodo: [
        { idTrabajador: 5, nombre: 'Ana Gómez', cargo: 'Analista', fechaInicio: '2026-08-01', fechaFin: null },
      ],
      equiposPeriodo: [
        { idActivo: 20, codigo: 'CEL-001', marca: 'Samsung', modelo: 'A54', fechaInicio: '2026-08-01', fechaFin: null },
      ],
    },
    {
      idDetalle: 102,
      idFactura: 1,
      idLinea: 11,
      numeroLinea: '912345678',
      nombrePlan: 'Plan Max 69.90',
      cargoPlan: 69.9,
      prorrateo: 0,
      cargosAdicionales: 25.5,
      descuentos: 0,
      cargoEquipos: 0,
      saldoAnterior: 0,
      montoTotal: 95.4,
      estadoConciliacion: 'OBSERVADO',
      observaciones: null,
      lineaEstado: 'ACTIVA',
      diagnosticos: ['MULTIPLES_RESPONSABLES_PERIODO', 'CARGOS_ADICIONALES'],
      responsablesPeriodo: [
        { idTrabajador: 1, nombre: 'Juan Pérez', cargo: 'Técnico', fechaInicio: '2026-08-01', fechaFin: '2026-08-15' },
        { idTrabajador: 2, nombre: 'María López', cargo: 'Coordinadora', fechaInicio: '2026-08-16', fechaFin: '2026-08-31' },
      ],
      equiposPeriodo: [],
    },
  ],
  pagination: { page: 1, pageSize: 50, total: 2, totalPages: 1 },
};

const mockResumenConciliacion = {
  factura: {
    idFactura: 1,
    numeroFactura: 'F001-00045612',
    operador: 'Claro',
    periodoInicio: '2026-08-01',
    periodoFin: '2026-08-31',
    montoTotal: 1540.5,
    estadoConciliacion: 'EN_REVISION',
  },
  metricas: {
    totalLineas: 2,
    conformes: 1,
    observados: 1,
    corregidos: 0,
    pendientes: 0,
    lineasNoRegistradas: 0,
  },
  financiero: {
    montoFacturado: 1540.5,
    totalCargosPlan: 139.8,
    totalCargosAdicionales: 25.5,
    totalCargosEquipos: 0,
    totalDescuentos: 0,
    totalCalculado: 165.3,
    diferencia: 1375.2,
  },
};

const mockRouterApi = (url: string) => {
  if (url === '/telefonia/facturas') return Promise.resolve({ data: mockFacturasPage });
  if (url === '/telefonia/facturas/1') return Promise.resolve({ data: mockFacturaDetail });
  if (url === '/telefonia/facturas/1/detalle') return Promise.resolve({ data: mockDetallesPage });
  if (url === '/telefonia/facturas/1/resumen-conciliacion') return Promise.resolve({ data: mockResumenConciliacion });
  if (url === '/telefonia/lineas') return Promise.resolve({ data: { items: [], pagination: { total: 0 } } });
  if (url === '/telefonia/financiamientos') return Promise.resolve({ data: { items: [], pagination: { total: 0 } } });
  if (url === '/catalogos/operadores-moviles') return Promise.resolve({ data: [{ id: 1, nombre: 'Claro' }] });
  return Promise.resolve({ data: [] });
};

function wrapper(ui: React.ReactNode, path = '/telefonia') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Módulo de Facturación y Conciliación de Telefonía', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      permissions: ['LINEAS_VER', 'LINEAS_CONCILIAR'],
      isAuthenticated: true,
      accessToken: 'dummy',
      user: null,
    });
  });

  it('permite cambiar a la pestaña de facturación y lista las facturas', async () => {
    vi.spyOn(api, 'get').mockImplementation(mockRouterApi);
    wrapper(<TelefoniaPage />);

    // Click en la pestaña Facturación
    const tabBtn = screen.getByRole('tab', { name: /Facturación/i });
    await userEvent.click(tabBtn);

    expect(await screen.findByText('F001-00045612')).toBeInTheDocument();
    expect(screen.getByText('15 líneas')).toBeInTheDocument();
  });

  it('muestra detalle de factura con KPIs, líneas facturadas y múltiples responsables en periodo', async () => {
    vi.spyOn(api, 'get').mockImplementation(mockRouterApi);
    wrapper(
      <Routes>
        <Route path="/telefonia/facturas/:id" element={<FacturaDetailPage />} />
      </Routes>,
      '/telefonia/facturas/1',
    );

    // Cabecera y datos
    expect(await screen.findByRole('heading', { name: 'F001-00045612' })).toBeInTheDocument();
    expect(screen.getByText('S/ 1540.50')).toBeInTheDocument();

    // Líneas del detalle
    expect(await screen.findByText('987654321')).toBeInTheDocument();
    expect(screen.getByText('912345678')).toBeInTheDocument();

    // Diagnósticos calculados presentes
    expect(screen.getByText('Conforme')).toBeInTheDocument();
    expect(screen.getByText('Múltiples responsables')).toBeInTheDocument();
    expect(screen.getByText('Cargos adicionales')).toBeInTheDocument();

    // Múltiples responsables en el periodo con sus intervalos visibles
    expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument();
    expect(screen.getByText(/María López/)).toBeInTheDocument();
  });

  it('ejecuta conciliación histórica al pulsar el botón correspondiente', async () => {
    vi.spyOn(api, 'get').mockImplementation(mockRouterApi);
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        idFactura: 1,
        estadoConciliacion: 'CONCILIADO',
        totalDetalles: 2,
        items: mockDetallesPage.items,
      },
    });

    wrapper(
      <Routes>
        <Route path="/telefonia/facturas/:id" element={<FacturaDetailPage />} />
      </Routes>,
      '/telefonia/facturas/1',
    );

    const conciliarBtn = await screen.findByRole('button', { name: /Ejecutar Conciliación/i });
    await userEvent.click(conciliarBtn);

    expect(postSpy).toHaveBeenCalledWith('/telefonia/facturas/1/conciliar');
  });

  it('permite registrar una nueva factura con detalle estructurado', async () => {
    vi.spyOn(api, 'get').mockImplementation(mockRouterApi);
    wrapper(<NuevaFacturaPage />, '/telefonia/facturas/nueva');

    expect(screen.getByRole('heading', { name: 'Nueva Factura de Telefonía' })).toBeInTheDocument();
    expect(screen.getByText('Desglose de Líneas Facturadas (1)')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Guardar y Procesar Factura/i });
    await userEvent.click(submitBtn);

    // Validación de campos obligatorios
    expect(await screen.findByText(/Debe seleccionar el operador móvil/i)).toBeInTheDocument();
  });
});
