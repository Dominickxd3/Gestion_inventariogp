import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app/App';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import { User } from '../types/auth';

const dashboardUser: User = { id: 96, username: 'dortiz', name: 'Dominick Ortiz', email: 'dortiz@example.test', role: 'ADMIN', permissions: [{ code: 'DASHBOARD_VER', name: 'Ver dashboard', module: 'DASHBOARD' }] };
const assetsUser: User = { ...dashboardUser, permissions: [...dashboardUser.permissions, { code: 'ACTIVOS_VER', name: 'Ver activos', module: 'ACTIVOS' }] };
const summary = { kpis: { totalActivos: 0, asignados: 0, disponibles: 0, mantenimiento: 0, observados: 0, lineasActivas: 0 }, activosPorTipo: [], activosPorEstado: [], alertas: { lineasSinResponsable: 0, lineasSinEquipo: 0, mantenimientosPendientes: 0, inventariosAbiertos: 0 }, actividadReciente: [] };

function authenticated(user: User): void {
  useAuthStore.getState().setSession('test-token', user);
}
function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></QueryClientProvider>);
}
function mockApi(user: User) {
  return vi.spyOn(api, 'get').mockImplementation(async url => ({ data: url === '/auth/me' ? user : summary }));
}

describe('shell autenticado', () => {
  beforeEach(() => {
    sessionStorage.clear(); localStorage.clear();
    useAuthStore.setState({ user: null, accessToken: null, permissions: [], isAuthenticated: false });
    vi.restoreAllMocks();
  });

  it('envía al login al usuario no autenticado que intenta una ruta protegida', async () => {
    renderAt('/inicio');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('restaura la sesión con auth/me antes de mostrar Inicio y datos reales', async () => {
    authenticated(dashboardUser);
    const request = mockApi(dashboardUser);
    renderAt('/inicio');
    expect(screen.getByLabelText('Cargando página')).toBeInTheDocument();
    expect(await screen.findByText('Resumen general de infraestructura tecnológica', {}, { timeout: 15000 })).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith('/auth/me');
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('muestra opciones permitidas, oculta las no permitidas y secciones vacías', async () => {
    authenticated(assetsUser);
    mockApi(assetsUser);
    renderAt('/inicio');
    expect(await screen.findByRole('link', { name: 'Activos' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Asignaciones' })).not.toBeInTheDocument();
    expect(screen.queryByText('ADMINISTRACIÓN')).not.toBeInTheDocument();
  });

  it('redirige a 403 al ingresar manualmente sin permiso', async () => {
    authenticated(dashboardUser);
    mockApi(dashboardUser);
    renderAt('/activos');
    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
  });

  it('muestra 404 para una ruta inexistente', async () => {
    authenticated(dashboardUser);
    mockApi(dashboardUser);
    renderAt('/ruta-inexistente');
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
  });

  it('el logout limpia sesión, caché y vuelve al login', async () => {
    authenticated(dashboardUser);
    mockApi(dashboardUser);
    renderAt('/inicio');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Abrir menú de usuario' }));
    await user.click(await screen.findByText('Cerrar sesión'));
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
    expect(sessionStorage.getItem('gp-session')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('permite contraer el sidebar y conserva la preferencia', async () => {
    authenticated(dashboardUser);
    mockApi(dashboardUser);
    renderAt('/inicio');
    fireEvent.click(await screen.findByRole('button', { name: 'Contraer barra lateral' }));
    expect(localStorage.getItem('gp-sidebar-collapsed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Expandir barra lateral' })).toBeInTheDocument();
  });
});
