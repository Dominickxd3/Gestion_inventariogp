import { Injectable } from '@nestjs/common';
import { Int } from 'mssql';
import { DatabaseService } from '../database/database.service';

export interface ActivoQrRow {
  id_activo: number;
  codigo: string;
  tipo_nombre: string;
  tipo_codigo: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  estado_nombre: string;
  estado_codigo: string;
  ubicacion_nombre: string | null;
  ubicacion_codigo: string | null;
  responsable_id: number | null;
  responsable_dni: string | null;
  responsable_nombre: string | null;
  responsable_cargo: string | null;
  responsable_area: string | null;
  responsable_sede: string | null;
  asignacion_id: number | null;
  fecha_asignacion: Date | null;
}

@Injectable()
export class QrRepository {
  constructor(private readonly database: DatabaseService) {}

  async findActivoForQr(idActivo: number): Promise<ActivoQrRow | null> {
    const request = await this.database.request();
    request.input('idActivo', Int, idActivo);
    const result = await request.query<ActivoQrRow>(`
      SELECT
        A.id_activo,
        A.codigo,
        TA.nombre AS tipo_nombre,
        TA.codigo AS tipo_codigo,
        A.marca,
        A.modelo,
        A.color,
        EA.nombre AS estado_nombre,
        EA.codigo AS estado_codigo,
        U.nombre AS ubicacion_nombre,
        U.codigo AS ubicacion_codigo,
        T.id_trabajador AS responsable_id,
        T.dni AS responsable_dni,
        CONCAT_WS(' ', T.nombres, T.apellidos) AS responsable_nombre,
        T.cargo AS responsable_cargo,
        AR.nombre AS responsable_area,
        S.nombre AS responsable_sede,
        AA.id_asignacion AS asignacion_id,
        AA.fecha_entrega AS fecha_asignacion
      FROM dbo.activos A
      INNER JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
      INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
      LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion = A.id_ubicacion
      LEFT JOIN dbo.asignaciones_activo AA ON AA.id_activo = A.id_activo AND AA.activo = 1
      LEFT JOIN dbo.trabajadores T ON T.id_trabajador = AA.id_trabajador
      LEFT JOIN dbo.areas AR ON AR.id_area = T.id_area
      LEFT JOIN dbo.sedes S ON S.id_sede = AR.id_sede
      WHERE A.id_activo = @idActivo
    `);
    return result.recordset[0] ?? null;
  }

  async findActivoByCodigo(codigo: string): Promise<ActivoQrRow | null> {
    const request = await this.database.request();
    request.input('codigo', codigo);
    const result = await request.query<ActivoQrRow>(`
      SELECT
        A.id_activo,
        A.codigo,
        TA.nombre AS tipo_nombre,
        TA.codigo AS tipo_codigo,
        A.marca,
        A.modelo,
        A.color,
        EA.nombre AS estado_nombre,
        EA.codigo AS estado_codigo,
        U.nombre AS ubicacion_nombre,
        U.codigo AS ubicacion_codigo,
        T.id_trabajador AS responsable_id,
        T.dni AS responsable_dni,
        CONCAT_WS(' ', T.nombres, T.apellidos) AS responsable_nombre,
        T.cargo AS responsable_cargo,
        AR.nombre AS responsable_area,
        S.nombre AS responsable_sede,
        AA.id_asignacion AS asignacion_id,
        AA.fecha_entrega AS fecha_asignacion
      FROM dbo.activos A
      INNER JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
      INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
      LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion = A.id_ubicacion
      LEFT JOIN dbo.asignaciones_activo AA ON AA.id_activo = A.id_activo AND AA.activo = 1
      LEFT JOIN dbo.trabajadores T ON T.id_trabajador = AA.id_trabajador
      LEFT JOIN dbo.areas AR ON AR.id_area = T.id_area
      LEFT JOIN dbo.sedes S ON S.id_sede = AR.id_sede
      WHERE A.codigo = @codigo
    `);
    return result.recordset[0] ?? null;
  }
}
