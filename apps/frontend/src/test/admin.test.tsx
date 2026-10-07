import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import UsuariosPage from '../features/admin/pages/UsuariosPage';

const mockUsuariosList = {
  items: [
    {
      id: 1,
      userLogon: 'carlos.mendoza',
      userFullname: 'Carlos Mendoza',
      userEmail: 'cmendoza@grupopeuario.com',
      userEstadoErp: 0,
      permitirAcceso: true,
      estadoLocal: true,
      idRol: 1,
      rolCodigo: 'ADMIN',
      rol: 'Administrador',
      ultimaSincronizacion: '2026-10-07T08:00:00Z',
      ultimoAcceso: '2026-10-07T12:00:00Z',
    },
    {
      id: 2,
      userLogon: 'ana.torres',
      userFullname: 'Ana Torres',
      userEmail: 'atorres@grupopeuario.com',
      userEstadoErp: 0,
      permitirAcceso: false,
      estadoLocal: true,
      idRol: 2,
      rolCodigo: 'CONSULTA',
      rol: 'Consulta',
      ultimaSincronizacion: '2026-10-07T08:00:00Z',
      ultimoAcceso: null,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 2,
    totalPages: 1,
  },
};

const mockRolesList = [
  { id: 1, codigo: 'ADMIN', nombre: 'Administrador', descripcion: null, estado: true },
  { id: 2, codigo: 'CONSULTA', nombre: 'Consulta', descripcion: null, estado: true },
];

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Módulo de Administración de Usuarios y Accesos (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'carlos.mendoza',
        name: 'Carlos Mendoza',
        role: 'ADMIN',
        permissions: [
          { code: 'USUARIOS_VER', name: 'Ver usuarios', module: 'SEGURIDAD' },
          { code: 'USUARIOS_EDITAR', name: 'Editar usuarios', module: 'SEGURIDAD' },
        ],
      },
      accessToken: 'dummy-token',
      permissions: ['USUARIOS_VER', 'USUARIOS_EDITAR'],
      isAuthenticated: true,
    });

    vi.spyOn(api, 'get').mockImplementation((url: string) => {
      if (url === '/admin/usuarios') return Promise.resolve({ data: mockUsuariosList });
      if (url === '/admin/roles') return Promise.resolve({ data: mockRolesList });
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    });

    vi.spyOn(api, 'post').mockImplementation((url: string) => {
      if (url === '/admin/usuarios/sincronizar') return Promise.resolve({ data: { sincronizados: 3 } });
      return Promise.reject(new Error(`Unhandled POST ${url}`));
    });
  });

  it('debe renderizar el título y listado de usuarios con roles y accesos', async () => {
    renderWithProviders(<UsuariosPage />);

    expect(screen.getByText('Administración de Usuarios y Accesos')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('carlos.mendoza')).toBeInTheDocument();
      expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
      expect(screen.getByText('ana.torres')).toBeInTheDocument();
      expect(screen.getByText('PERMITIDO')).toBeInTheDocument();
      expect(screen.getByText('DENEGADO')).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón de Sincronizar con ERP si tiene permiso USUARIOS_EDITAR', async () => {
    renderWithProviders(<UsuariosPage />);

    const syncBtn = screen.getByRole('button', { name: /Sincronizar con ERP/i });
    expect(syncBtn).toBeInTheDocument();
  });
});
