import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import { api } from '../services/api';
import { DashboardSummary } from '../features/dashboard/types/dashboard.types';

const data: DashboardSummary = {
  kpis: { totalActivos: 37, asignados: 18, disponibles: 10, mantenimiento: 3, observados: 2, lineasActivas: 21 },
  activosPorTipo: [{ label: 'LAPTOP', count: 12 }], activosPorEstado: [{ label: 'Asignado', count: 18 }],
  alertas: { lineasSinResponsable: 4, lineasSinEquipo: 5, mantenimientosPendientes: 6, inventariosAbiertos: 1 },
  actividadReciente: [{ id: 1, type: 'ASIGNACION', description: 'ACT-001 asignado', date: '2026-10-07T12:00:00.000Z', asset: { code: 'ACT-001', brand: null, model: null }, destinationWorker: 'Persona Prueba', user: 'Usuario Prueba' }],
};
function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><DashboardPage /></QueryClientProvider>);
}
describe('DashboardPage', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('muestra skeleton durante la carga', () => {
    vi.spyOn(api, 'get').mockReturnValue(new Promise(() => undefined));
    renderDashboard(); expect(screen.getByLabelText('Cargando resumen')).toBeInTheDocument();
  });
  it('renderiza KPIs, alertas y actividad provenientes del API', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data }); renderDashboard();
    expect(await screen.findByText('37')).toBeInTheDocument();
    expect(screen.getByText('Líneas sin responsable')).toBeInTheDocument();
    expect(screen.getByText('ACT-001 asignado')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/dashboard/resumen');
  });
  it('presenta ceros y estados vacíos correctamente', async () => {
    const empty: DashboardSummary = { ...data, kpis: Object.fromEntries(Object.keys(data.kpis).map(key => [key, 0])) as unknown as DashboardSummary['kpis'], activosPorTipo: [], activosPorEstado: [], actividadReciente: [], alertas: { lineasSinResponsable: 0, lineasSinEquipo: 0, mantenimientosPendientes: 0, inventariosAbiertos: 0 } };
    vi.spyOn(api, 'get').mockResolvedValue({ data: empty }); renderDashboard();
    expect((await screen.findAllByText('0')).length).toBeGreaterThan(5);
    expect(screen.getAllByText('No hay activos registrados.')).toHaveLength(2);
    expect(screen.getByText('No hay actividad reciente.')).toBeInTheDocument();
  });
  it('muestra error y permite reintentar', async () => {
    const request = vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data });
    renderDashboard(); const retry = await screen.findByRole('button', { name: 'Reintentar' });
    await userEvent.click(retry); expect(await screen.findByText('37')).toBeInTheDocument(); expect(request).toHaveBeenCalledTimes(2);
  });
});
