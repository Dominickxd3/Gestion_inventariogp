import { BadRequestException, Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';
import { DashboardSummary } from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getSummary(idSede?: number): Promise<DashboardSummary> {
    if (idSede !== undefined && !(await this.repository.siteIsActive(idSede))) {
      throw new BadRequestException('La sede indicada no existe o está deshabilitada');
    }
    const [kpis, activosPorTipo, activosPorEstado, alertas, activity] = await Promise.all([
      this.repository.getKpis(idSede), this.repository.getAssetsByType(idSede),
      this.repository.getAssetsByStatus(idSede), this.repository.getAlerts(idSede),
      this.repository.getRecentActivity(idSede),
    ]);
    return {
      kpis: {
        totalActivos: Number(kpis.totalActivos ?? 0), asignados: Number(kpis.asignados ?? 0),
        disponibles: Number(kpis.disponibles ?? 0), mantenimiento: Number(kpis.mantenimiento ?? 0),
        observados: Number(kpis.observados ?? 0), lineasActivas: Number(kpis.lineasActivas ?? 0),
      },
      activosPorTipo, activosPorEstado,
      alertas: {
        lineasSinResponsable: Number(alertas.lineasSinResponsable ?? 0), lineasSinEquipo: Number(alertas.lineasSinEquipo ?? 0),
        mantenimientosPendientes: Number(alertas.mantenimientosPendientes ?? 0), inventariosAbiertos: Number(alertas.inventariosAbiertos ?? 0),
      },
      actividadReciente: activity.map(item => ({
        id: Number(item.id), type: item.type, description: item.description,
        date: item.date.toISOString(), asset: { code: item.assetCode, brand: item.brand, model: item.model },
        destinationWorker: item.destinationWorker, user: item.userName,
      })),
    };
  }
}
