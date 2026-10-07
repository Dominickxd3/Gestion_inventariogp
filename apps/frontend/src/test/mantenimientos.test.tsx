import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import MantenimientosPage from '../features/mantenimientos/pages/MantenimientosPage';
import MantenimientoDetailPage from '../features/mantenimientos/pages/MantenimientoDetailPage';
import MantenimientoFormPage from '../features/mantenimientos/pages/MantenimientoFormPage';

const mockMantenimientosList = {
  items: [
    {
      id: 1,
      idActivo: 10,
      activo: {
        codigo: 'LAP-001',
        marca: 'Dell',
        modelo: 'Latitude 5420',
        numeroSerie: 'SN123456',
        tipo: 'LAPTOP',
        estado: { codigo: 'MANTENIMIENTO', nombre: 'En Mantenimiento' },
        sede: 'Sede Central',
        area: 'Sistemas',
      },
      tipo: 'CORRECTIVO',
      fechaProgramada: null,
      fechaInicio: '2026-10-07T09:00:00Z',
      fechaFin: null,
      problemaReportado: 'Batería inflada y recalentamiento',
      diagnostico: 'Celda dañada',
      trabajoRealizado: null,
      costo: 280.0,
      proveedor: 'Dell Soporte Perú',
      estado: 'EN_PROCESO',
      proximoMantenimiento: null,
      observaciones: 'En espera de repuesto',
      usuarioRegistro: { id: 1, nombre: 'Admin TI' },
    },
  ],
  total: 1,
  page: 1,
  pageSize: 15,
  totalPages: 1,
};

const mockMantenimientoDetail = {
  ...mockMantenimientosList.items[0],
  activoCompleto: {
    id: 10,
    codigo: 'LAP-001',
    marca: 'Dell',
    modelo: 'Latitude 5420',
    numeroSerie: 'SN123456',
    tipo: 'LAPTOP',
    estado: { codigo: 'MANTENIMIENTO', nombre: 'En Mantenimiento' },
    ubicacionTexto: 'Sede Central / Sistemas / Piso 2',
    responsableActual: 'Carlos Paredes',
  },
};

function wrapper(ui: React.ReactNode, path = '/mantenimientos') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Módulo de Mantenimientos (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: 'dummy',
      permissions: ['MANTENIMIENTO_VER', 'MANTENIMIENTO_EDITAR'],
      isAuthenticated: true,
    });

    vi.spyOn(api, 'get').mockImplementation((url: string) => {
      if (url === '/mantenimientos') return Promise.resolve({ data: mockMantenimientosList });
      if (url === '/mantenimientos/1') return Promise.resolve({ data: mockMantenimientoDetail });
      if (url === '/activos') return Promise.resolve({ data: { items: [], pagination: { total: 0 } } });
      return Promise.resolve({ data: [] });
    });
  });

  it('renderiza la lista de mantenimientos y muestra datos del activo', async () => {
    wrapper(<MantenimientosPage />);

    expect(screen.getByText('Mantenimientos')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('LAP-001')).toBeInTheDocument();
      expect(screen.getByText('Batería inflada y recalentamiento')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
    });
  });

  it('permite filtrar por estado y búsqueda', async () => {
    const user = userEvent.setup();
    wrapper(<MantenimientosPage />);

    const searchInput = screen.getByPlaceholderText('Buscar por código, marca, problema o proveedor...');
    await user.type(searchInput, 'Dell');
    await user.click(screen.getByRole('button', { name: /Filtrar/i }));

    expect(api.get).toHaveBeenCalledWith(
      '/mantenimientos',
      expect.objectContaining({
        params: expect.objectContaining({ search: 'Dell' }),
      })
    );
  });

  it('renderiza el detalle de mantenimiento con activo, fechas y botón de finalizar', async () => {
    wrapper(
      <Routes>
        <Route path="/mantenimientos/:id" element={<MantenimientoDetailPage />} />
      </Routes>,
      '/mantenimientos/1'
    );

    await waitFor(() => {
      expect(screen.getByText('Intervención #1')).toBeInTheDocument();
      expect(screen.getByText('Dell Latitude 5420')).toBeInTheDocument();
      expect(screen.getByText('Carlos Paredes')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Finalizar mantenimiento/i })).toBeInTheDocument();
    });
  });

  it('abre el diálogo de finalización al presionar Finalizar mantenimiento', async () => {
    const user = userEvent.setup();
    wrapper(
      <Routes>
        <Route path="/mantenimientos/:id" element={<MantenimientoDetailPage />} />
      </Routes>,
      '/mantenimientos/1'
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Finalizar mantenimiento/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Finalizar mantenimiento/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Trabajo realizado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar Finalización/i })).toBeInTheDocument();
  });

  it('renderiza el formulario de nuevo mantenimiento', async () => {
    wrapper(<MantenimientoFormPage />, '/mantenimientos/nuevo');
    expect(screen.getByText('Nuevo Mantenimiento')).toBeInTheDocument();
    expect(screen.getByText(/Activo e Intervención/i)).toBeInTheDocument();
  });
});
