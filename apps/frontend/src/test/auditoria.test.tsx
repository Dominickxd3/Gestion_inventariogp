import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import AuditoriaPage from '../features/auditoria/pages/AuditoriaPage';

const mockAuditoriaList = {
  items: [
    {
      id: '501',
      idUsuario: 1,
      usuarioLogon: 'admin.user',
      usuarioNombre: 'Admin TI',
      modulo: 'ACTIVOS',
      accion: 'ACTIVO_CREAR',
      tablaAfectada: 'activos',
      registroId: '10',
      direccionIp: '192.168.1.50',
      fecha: '2026-10-07T10:30:00Z',
    },
    {
      id: '502',
      idUsuario: 1,
      usuarioLogon: 'admin.user',
      usuarioNombre: 'Admin TI',
      modulo: 'SEGURIDAD',
      accion: 'USUARIO_ACCESO_EDITAR',
      tablaAfectada: 'usuarios_sistema',
      registroId: '2',
      direccionIp: '192.168.1.50',
      fecha: '2026-10-07T11:15:00Z',
    },
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 2,
    totalPages: 1,
  },
};

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Módulo de Auditoría (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: 'dummy-token',
      permissions: ['AUDITORIA_VER'],
      isAuthenticated: true,
    });

    vi.spyOn(api, 'get').mockImplementation((url: string) => {
      if (url === '/auditoria') return Promise.resolve({ data: mockAuditoriaList });
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    });
  });

  it('debe renderizar el título y registros de auditoría', async () => {
    renderWithProviders(<AuditoriaPage />);

    expect(screen.getByText('Auditoría y Trazabilidad del Sistema')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ACTIVO_CREAR')).toBeInTheDocument();
      expect(screen.getByText('USUARIO_ACCESO_EDITAR')).toBeInTheDocument();
      expect(screen.getAllByText('Admin TI')[0]).toBeInTheDocument();
    });
  });
});
