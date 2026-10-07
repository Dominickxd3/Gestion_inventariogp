import { BadRequestException } from '@nestjs/common';
import { DashboardRepository } from '../src/dashboard/dashboard.repository';
import { DashboardService } from '../src/dashboard/dashboard.service';

describe('DashboardService', () => {
  const repository = { siteIsActive: jest.fn(), getKpis: jest.fn(), getAssetsByType: jest.fn(), getAssetsByStatus: jest.fn(), getAlerts: jest.fn(), getRecentActivity: jest.fn() };
  const service = new DashboardService(repository as unknown as DashboardRepository);
  beforeEach(() => {
    jest.clearAllMocks(); repository.siteIsActive.mockResolvedValue(true);
    repository.getKpis.mockResolvedValue({ totalActivos: 12, asignados: 4, disponibles: 5, mantenimiento: 1, observados: 2, lineasActivas: 8 });
    repository.getAssetsByType.mockResolvedValue([{ label: 'LAPTOP', count: 7 }]); repository.getAssetsByStatus.mockResolvedValue([{ label: 'Disponible', count: 5 }]);
    repository.getAlerts.mockResolvedValue({ lineasSinResponsable: 1, lineasSinEquipo: 2, mantenimientosPendientes: 3, inventariosAbiertos: 1 });
    repository.getRecentActivity.mockResolvedValue([{ id: 5, type: 'ASIGNACION', description: 'Equipo asignado', date: new Date('2026-10-07T12:00:00.000Z'), assetCode: 'ACT-001', brand: 'Marca', model: 'Modelo', destinationWorker: 'Persona Prueba', userName: 'Usuario Prueba' }]);
  });
  it('compone métricas reales y serializa fechas ISO', async () => {
    const result = await service.getSummary();
    expect(result.kpis.totalActivos).toBe(12); expect(result.actividadReciente[0].date).toBe('2026-10-07T12:00:00.000Z');
  });
  it('conserva ceros cuando no existen registros', async () => {
    repository.getKpis.mockResolvedValue({ totalActivos: 0, asignados: 0, disponibles: 0, mantenimiento: 0, observados: 0, lineasActivas: 0 });
    repository.getAssetsByType.mockResolvedValue([]); repository.getAssetsByStatus.mockResolvedValue([]); repository.getRecentActivity.mockResolvedValue([]);
    const result = await service.getSummary();
    expect(result.kpis.totalActivos).toBe(0); expect(result.actividadReciente).toEqual([]);
  });
  it('aplica una sede válida a las consultas relacionadas', async () => {
    await service.getSummary(3); expect(repository.siteIsActive).toHaveBeenCalledWith(3); expect(repository.getKpis).toHaveBeenCalledWith(3); expect(repository.getAlerts).toHaveBeenCalledWith(3);
  });
  it('rechaza una sede inexistente o inactiva', async () => {
    repository.siteIsActive.mockResolvedValue(false); await expect(service.getSummary(99)).rejects.toBeInstanceOf(BadRequestException); expect(repository.getKpis).not.toHaveBeenCalled();
  });
  it('propaga el error SQL al filtro global', async () => {
    repository.getKpis.mockRejectedValue(new Error('technical sql detail')); await expect(service.getSummary()).rejects.toThrow('technical sql detail');
  });
});
