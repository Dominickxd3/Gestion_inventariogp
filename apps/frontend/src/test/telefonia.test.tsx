import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import TelefoniaPage from '../features/telefonia/pages/TelefoniaPage';
import LineaDetailPage from '../features/telefonia/pages/LineaDetailPage';
import NuevaLineaPage from '../features/telefonia/pages/NuevaLineaPage';

const mockPage = {
  items: [
    {
      idLinea: 1,
      numero: '987654321',
      iccid: '8951100000',
      estado: 'ACTIVA',
      operador: { id: 1, nombre: 'Claro' },
      plan: { id: 2, nombre: 'Plan Max 69.90' },
      responsable: { id: 10, nombre: 'Carlos Mendoza', cargo: 'Supervisor' },
      celular: { id: 20, codigo: 'CEL-001', marca: 'Samsung', modelo: 'Galaxy A54' },
    },
  ],
  pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
};

const mockDetail = {
  idLinea: 1,
  numero: '987654321',
  iccid: '8951100000',
  estado: 'ACTIVA',
  fechaAlta: '2026-01-15T00:00:00',
  fechaBaja: null,
  observaciones: 'Línea de operaciones',
  operador: { id: 1, nombre: 'Claro' },
  plan: { id: 2, nombre: 'Plan Max 69.90', precioMensual: 69.9 },
  responsableActual: {
    idAsignacionLinea: 5,
    idTrabajador: 10,
    nombre: 'Carlos Mendoza',
    dni: '45678901',
    cargo: 'Supervisor',
    area: 'Operaciones',
    sede: 'Planta Huachipa',
    fechaInicio: '2026-02-01T08:00:00',
    motivo: 'Entrega por funciones',
  },
  equipoActual: {
    idLineaEquipo: 8,
    idActivo: 20,
    codigo: 'CEL-001',
    marca: 'Samsung',
    modelo: 'Galaxy A54',
    imei1: '358901234567890',
    imei2: null,
    fechaInicio: '2026-02-01T08:00:00',
    observaciones: 'Equipo con funda protectora',
  },
  historialResponsables: [],
  historialEquipos: [],
  advertencias: [
    { codigo: 'RESPONSABLE_DISTINTO', mensaje: 'El responsable de la línea no coincide con el responsable del celular.' },
  ],
  financiamientoActual: {
    idFinanciamiento: 3,
    numeroFolio: 'F-2026-001',
    fechaInicio: '2026-01-01',
    cantidadCuotas: 18,
    montoCuota: 85.5,
    montoTotal: 1539.0,
    estado: 'ACTIVO',
  },
};

const mockRouterApi = (url: string) => {
  if (url === '/telefonia/lineas') return Promise.resolve({ data: mockPage });
  if (url === '/telefonia/lineas/1') return Promise.resolve({ data: mockDetail });
  if (url === '/telefonia/financiamientos') return Promise.resolve({ data: { items: [], pagination: { total: 0 } } });
  if (url === '/catalogos/operadores-moviles') return Promise.resolve({ data: [{ id: 1, nombre: 'Claro' }] });
  if (url === '/catalogos/planes-moviles') return Promise.resolve({ data: [{ id: 2, nombre: 'Plan Max 69.90' }] });
  if (url === '/telefonia/equipos-disponibles') return Promise.resolve({ data: [] });
  if (url === '/catalogos/trabajadores') return Promise.resolve({ data: [] });
  return Promise.resolve({ data: [] });
};

function wrapper(ui: React.ReactNode, path = '/telefonia') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Módulo de Telefonía Móvil', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ permissions: ['LINEAS_VER'], isAuthenticated: true, accessToken: 'dummy', user: null });
  });

  it('muestra loading y luego el listado de líneas móviles', async () => {
    let resolve!: (x: unknown) => void;
    vi.spyOn(api, 'get').mockImplementation((url) => {
      if (url === '/telefonia/lineas') return new Promise((r) => { resolve = r; });
      return mockRouterApi(url);
    });

    const view = wrapper(<TelefoniaPage />);
    expect(view.container.querySelector('.p-skeleton')).toBeInTheDocument();
    resolve({ data: mockPage });
    expect(await screen.findByText('987654321')).toBeInTheDocument();
    expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
    expect(screen.getByText('CEL-001')).toBeInTheDocument();
  });

  it('respeta permisos de creación (LINEAS_EDITAR)', async () => {
    vi.spyOn(api, 'get').mockImplementation(mockRouterApi);
    const view = wrapper(<TelefoniaPage />);
    await screen.findByText('987654321');
    expect(screen.queryByText('Nueva línea')).not.toBeInTheDocument();

    view.unmount();
    useAuthStore.setState({ permissions: ['LINEAS_VER', 'LINEAS_EDITAR'] });
    wrapper(<TelefoniaPage />);
    expect(await screen.findByText('987654321')).toBeInTheDocument();
    expect(screen.getByText('Nueva línea')).toBeInTheDocument();
  });

  it('muestra detalle enriquecido con advertencias, responsable, equipo y financiamiento', async () => {
    vi.spyOn(api, 'get').mockImplementation(mockRouterApi);
    wrapper(
      <Routes>
        <Route path="/telefonia/:id" element={<LineaDetailPage />} />
      </Routes>,
      '/telefonia/1',
    );

    expect(await screen.findByRole('heading', { name: '987654321' })).toBeInTheDocument();
    expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
    expect(screen.getByText('CEL-001')).toBeInTheDocument();
    expect(screen.getByText('Samsung Galaxy A54')).toBeInTheDocument();
    // Advertencia presente
    expect(screen.getByText(/El responsable de la línea no coincide/)).toBeInTheDocument();
    // Financiamiento presente
    expect(screen.getByText('F-2026-001')).toBeInTheDocument();
    expect(screen.getByText('18 cuotas')).toBeInTheDocument();
  });

  it('permite navegación en formulario de nueva línea y valida número', async () => {
    vi.spyOn(api, 'get').mockImplementation(mockRouterApi);
    wrapper(<NuevaLineaPage />, '/telefonia/nueva');
    expect(screen.getByRole('heading', { name: 'Nueva Línea Móvil' })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: 'Crear Línea' });
    await userEvent.click(submitBtn);
    expect(await screen.findByText(/El número de línea es obligatorio/)).toBeInTheDocument();
  });
});
