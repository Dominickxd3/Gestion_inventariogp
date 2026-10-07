import { Injectable } from '@nestjs/common';
import { Int, Request } from 'mssql';
import { DatabaseService } from '../database/database.service';
import { DashboardAlerts, DashboardDistribution, DashboardKpis } from './dashboard.types';

export interface ActivityRow {
  id: number; type: string; description: string | null; date: Date;
  assetCode: string; brand: string | null; model: string | null;
  destinationWorker: string | null; userName: string | null;
}

@Injectable()
export class DashboardRepository {
  constructor(private readonly database: DatabaseService) {}

  private withSite(request: Request, idSede?: number): Request {
    if (idSede !== undefined) request.input('idSede', Int, idSede);
    return request;
  }

  async siteIsActive(idSede: number): Promise<boolean> {
    const request = await this.database.request();
    request.input('idSede', Int, idSede);
    const result = await request.query<{ found: number }>('SELECT COUNT(*) AS found FROM dbo.sedes WHERE id_sede = @idSede AND estado = 1');
    return Number(result.recordset[0]?.found ?? 0) > 0;
  }

  async getKpis(idSede?: number): Promise<DashboardKpis> {
    const request = this.withSite(await this.database.request(), idSede);
    const siteFilter = idSede === undefined ? '' : ' AND U.id_sede = @idSede';
    const result = await request.query<DashboardKpis>(`SELECT
      (SELECT COUNT(*) FROM dbo.activos A LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion = A.id_ubicacion WHERE 1=1${siteFilter}) AS totalActivos,
      (SELECT COUNT(*) FROM dbo.activos A INNER JOIN dbo.estados_activo E ON E.id_estado_activo=A.id_estado_activo LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion=A.id_ubicacion WHERE E.codigo='ASIGNADO'${siteFilter}) AS asignados,
      (SELECT COUNT(*) FROM dbo.activos A INNER JOIN dbo.estados_activo E ON E.id_estado_activo=A.id_estado_activo LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion=A.id_ubicacion WHERE E.codigo='DISPONIBLE'${siteFilter}) AS disponibles,
      (SELECT COUNT(*) FROM dbo.activos A INNER JOIN dbo.estados_activo E ON E.id_estado_activo=A.id_estado_activo LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion=A.id_ubicacion WHERE E.codigo='MANTENIMIENTO'${siteFilter}) AS mantenimiento,
      (SELECT COUNT(*) FROM dbo.activos A INNER JOIN dbo.estados_activo E ON E.id_estado_activo=A.id_estado_activo LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion=A.id_ubicacion WHERE E.codigo='OBSERVADO'${siteFilter}) AS observados,
      (SELECT COUNT(*) FROM dbo.lineas_moviles WHERE estado='ACTIVA') AS lineasActivas`);
    return result.recordset[0] ?? { totalActivos: 0, asignados: 0, disponibles: 0, mantenimiento: 0, observados: 0, lineasActivas: 0 };
  }

  async getAssetsByType(idSede?: number): Promise<DashboardDistribution[]> {
    const request = this.withSite(await this.database.request(), idSede);
    const siteFilter = idSede === undefined ? '' : ' WHERE U.id_sede = @idSede';
    const result = await request.query<{ label: string; count: number }>(`SELECT T.nombre AS label, COUNT(A.id_activo) AS count FROM dbo.tipos_activo T LEFT JOIN dbo.activos A ON A.id_tipo_activo=T.id_tipo_activo LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion=A.id_ubicacion${siteFilter} GROUP BY T.id_tipo_activo,T.nombre ORDER BY count DESC,T.nombre`);
    return result.recordset.map(row => ({ label: row.label, count: Number(row.count) }));
  }

  async getAssetsByStatus(idSede?: number): Promise<DashboardDistribution[]> {
    const request = this.withSite(await this.database.request(), idSede);
    const siteFilter = idSede === undefined ? '' : ' AND EXISTS (SELECT 1 FROM dbo.ubicaciones U WHERE U.id_ubicacion=A.id_ubicacion AND U.id_sede=@idSede)';
    const result = await request.query<{ label: string; count: number }>(`SELECT E.nombre AS label, COUNT(A.id_activo) AS count FROM dbo.estados_activo E LEFT JOIN dbo.activos A ON A.id_estado_activo=E.id_estado_activo${siteFilter} GROUP BY E.id_estado_activo,E.nombre ORDER BY count DESC,E.nombre`);
    return result.recordset.map(row => ({ label: row.label, count: Number(row.count) }));
  }

  async getAlerts(idSede?: number): Promise<DashboardAlerts> {
    const request = this.withSite(await this.database.request(), idSede);
    const maintenanceSite = idSede === undefined ? '' : ' AND U.id_sede=@idSede';
    const inventorySite = idSede === undefined ? '' : ' AND I.id_sede=@idSede';
    const result = await request.query<DashboardAlerts>(`SELECT
      (SELECT COUNT(*) FROM dbo.vw_lineas_sin_responsable) AS lineasSinResponsable,
      (SELECT COUNT(*) FROM dbo.lineas_moviles L WHERE L.estado='ACTIVA' AND NOT EXISTS (SELECT 1 FROM dbo.linea_equipo_historial H WHERE H.id_linea=L.id_linea AND H.activo=1)) AS lineasSinEquipo,
      (SELECT COUNT(*) FROM dbo.mantenimientos M INNER JOIN dbo.activos A ON A.id_activo=M.id_activo LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion=A.id_ubicacion WHERE M.estado IN ('PENDIENTE','EN_PROCESO')${maintenanceSite}) AS mantenimientosPendientes,
      (SELECT COUNT(*) FROM dbo.inventarios I WHERE I.estado IN ('ABIERTO','EN_PROCESO')${inventorySite}) AS inventariosAbiertos`);
    return result.recordset[0] ?? { lineasSinResponsable: 0, lineasSinEquipo: 0, mantenimientosPendientes: 0, inventariosAbiertos: 0 };
  }

  async getRecentActivity(idSede?: number): Promise<ActivityRow[]> {
    const request = this.withSite(await this.database.request(), idSede);
    const siteFilter = idSede === undefined ? '' : ' WHERE UB.id_sede=@idSede';
    const result = await request.query<ActivityRow>(`SELECT TOP (10) M.id_movimiento AS id,M.tipo_movimiento AS type,M.descripcion AS description,M.fecha_movimiento AS date,
      A.codigo AS assetCode,A.marca AS brand,A.modelo AS model,
      NULLIF(LTRIM(RTRIM(CONCAT(T.nombres,' ',T.apellidos))),'') AS destinationWorker,U.user_fullname AS userName
      FROM dbo.movimientos_activo M INNER JOIN dbo.activos A ON A.id_activo=M.id_activo
      LEFT JOIN dbo.ubicaciones UB ON UB.id_ubicacion=A.id_ubicacion
      LEFT JOIN dbo.trabajadores T ON T.id_trabajador=M.id_trabajador_destino
      LEFT JOIN dbo.usuarios_sistema U ON U.id_usuario_sistema=M.id_usuario${siteFilter}
      ORDER BY M.fecha_movimiento DESC,M.id_movimiento DESC`);
    return result.recordset;
  }
}
