import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import InventariosPage from '../features/inventarios/pages/InventariosPage';
import InventarioDetailPage from '../features/inventarios/pages/InventarioDetailPage';
import NuevoInventarioPage from '../features/inventarios/pages/NuevoInventarioPage';

const mockInventariosList = {
  items: [
    {
      id: 1,
      nombre: 'Inventario Sede Central 2026',
      idSede: 1,
      sedeNombre: 'Sede Central',
      fechaInicio: '2026-10-07T08:00:00Z',
      fechaFin: null,
      estado: 'EN_PROCESO',
      observaciones: 'Auditoría patrimonial anual',
      usuarioRegistro: { id: 1, nombre: 'Admin TI' },
      totalEsperados: 20,
      verificados: 15,
      pendientes: 5,
      progreso: 75.0,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 15,
  totalPages: 1,
};

const mockInventarioDetail = {
  ...mockInventariosList.items[0],
  resumen: {
    idInventario: 1,
    totalEsperados: 20,
    verificados: 15,
    pendientes: 5,
    encontrados: 12,
    noEncontrados: 1,
    cambioUbicacion: 2,
    observados: 0,
    progreso: 75.0,
  },
};

const mockInventarioDetalleItems = {
  items: [
    {
      id: 101,
      idInventario: 1,
      idActivo: 5,
      activo: {
        codigo: 'PC-005',
        marca: 'Lenovo',
        modelo: 'ThinkCentre M720q',
        numeroSerie: 'MJ09XYZ',
        tipo: 'PC',
        estado: { codigo: 'ASIGNADO', nombre: 'Asignado' },
      },
      idUbicacionEsperada: 1,
      ubicacionEsperada: 'Sede Central / Sistemas / Piso 2',
      idUbicacionEncontrada: 1,
      ubicacionEncontrada: 'Sede Central / Sistemas / Piso 2',
      estadoVerificacion: 'ENCONTRADO',
      fechaVerificacion: '2026-10-07T10:30:00Z',
      usuarioVerificacion: { id: 1, nombre: 'Admin TI' },
      observaciones: 'En puesto de trabajo operativo',
    },
    {
      id: 102,
      idInventario: 1,
      idActivo: 6,
      activo: {
        codigo: 'MON-012',
        marca: 'LG',
        modelo: '24MK430H',
        numeroSerie: 'LG98765',
        tipo: 'MONITOR',
        estado: { codigo: 'DISPONIBLE', nombre: 'Disponible' },
      },
      idUbicacionEsperada: 1,
      ubicacionEsperada: 'Sede Central / Almacén TI',
      idUbicacionEncontrada: null,
      ubicacionEncontrada: null,
      estadoVerificacion: 'PENDIENTE',
      fechaVerificacion: null,
      usuarioVerificacion: null,
      observaciones: null,
    },
  ],
  total: 2,
  page: 1,
  pageSize: 15,
  totalPages: 1,
};

function wrapper(ui: React.ReactNode, path = '/inventarios') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Módulo de Inventarios Físicos (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: 'dummy',
      permissions: ['INVENTARIO_VER', 'INVENTARIO_GESTIONAR'],
      isAuthenticated: true,
    });

    vi.spyOn(api, 'get').mockImplementation((url: string) => {
      if (url === '/inventarios') return Promise.resolve({ data: mockInventariosList });
      if (url === '/inventarios/1') return Promise.resolve({ data: mockInventarioDetail });
      if (url === '/inventarios/1/detalle') return Promise.resolve({ data: mockInventarioDetalleItems });
      if (url === '/inventarios/1/resumen') return Promise.resolve({ data: mockInventarioDetail.resumen });
      if (url === '/catalogos/sedes') return Promise.resolve({ data: [{ id: 1, nombre: 'Sede Central' }] });
      if (url === '/catalogos/ubicaciones') return Promise.resolve({ data: [{ id: 1, nombre: 'Sede Central / Sistemas' }] });
      if (url === '/activos') return Promise.resolve({ data: { items: [], pagination: { total: 0 } } });
      return Promise.resolve({ data: [] });
    });
  });

  it('renderiza la lista de campañas con progreso y estado', async () => {
    wrapper(<InventariosPage />);

    expect(screen.getByText('Inventarios Físicos')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Inventario Sede Central 2026')).toBeInTheDocument();
      expect(screen.getByText('15 / 20')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nuevo inventario/i })).toBeInTheDocument();
    });
  });

  it('renderiza el detalle de inventario con KPIs y tabla de activos', async () => {
    wrapper(
      <Routes>
        <Route path="/inventarios/:id" element={<InventarioDetailPage />} />
      </Routes>,
      '/inventarios/1'
    );

    await waitFor(() => {
      expect(screen.getByText('Inventario Sede Central 2026')).toBeInTheDocument();
      expect(screen.getByText('Total Esperados')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('PC-005')).toBeInTheDocument();
      expect(screen.getByText('MON-012')).toBeInTheDocument();
    });
  });

  it('permite abrir el diálogo de verificación física de activo', async () => {
    const user = userEvent.setup();
    wrapper(
      <Routes>
        <Route path="/inventarios/:id" element={<InventarioDetailPage />} />
      </Routes>,
      '/inventarios/1'
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Verificar activo/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Verificar activo/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Verificar Activo Físico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrar Verificación/i })).toBeInTheDocument();
  });

  it('muestra advertencia de activos pendientes al abrir diálogo de cierre', async () => {
    const user = userEvent.setup();
    wrapper(
      <Routes>
        <Route path="/inventarios/:id" element={<InventarioDetailPage />} />
      </Routes>,
      '/inventarios/1'
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cerrar inventario/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Cerrar inventario/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/activos pendientes de verificación física/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmo que deseo cerrar el inventario/i)).toBeInTheDocument();
  });

  it('renderiza el formulario de nueva campaña de inventario', async () => {
    wrapper(<NuevoInventarioPage />, '/inventarios/nuevo');
    expect(screen.getByText('Nueva Campaña de Inventario')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de la campaña/i)).toBeInTheDocument();
    expect(screen.getByText(/Generación automática de snapshot esperado/i)).toBeInTheDocument();
  });
});
