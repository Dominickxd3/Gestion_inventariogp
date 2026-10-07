import { Injectable } from '@nestjs/common';
import { Int, MAX, NVarChar, VarChar, DateTime2 } from 'mssql';
import { DatabaseService } from '../database/database.service';
import { QueryDocumentosDto } from './dto/query-documentos.dto';

export interface DocumentoListItem {
  id: number;
  tipoDocumento: string;
  idActivo: number | null;
  activoCodigo: string | null;
  activoTipo: string | null;
  idAsignacion: number | null;
  idTrabajador: number | null;
  trabajadorDni: string | null;
  trabajadorNombre: string | null;
  nombreArchivo: string;
  rutaArchivo: string;
  hashArchivo: string | null;
  fechaDocumento: Date | null;
  fechaRegistro: Date;
  usuarioRegistroNombre: string | null;
  observaciones: string | null;
}

export interface AsignacionHistoricalData {
  idAsignacion: number;
  activo: boolean;
  fechaEntrega: Date;
  estadoEntrega: string | null;
  motivoEntrega: string | null;
  observacionEntrega: string | null;
  usuarioEntregaNombre: string | null;
  fechaDevolucion: Date | null;
  estadoDevolucion: string | null;
  motivoDevolucion: string | null;
  observacionDevolucion: string | null;
  usuarioDevolucionNombre: string | null;
  activoItem: {
    id: number;
    codigo: string;
    tipo: string;
    marca: string | null;
    modelo: string | null;
    serie: string | null;
    color: string | null;
  };
  trabajadorItem: {
    id: number;
    dni: string | null;
    nombreCompleto: string;
    cargo: string | null;
    area: string | null;
    sede: string | null;
  };
  accesorios: Array<{
    tipo: string;
    codigo: string | null;
    marca: string | null;
    modelo: string | null;
    serie: string | null;
    estado: string | null;
  }>;
}

const sortMap: Record<string, string> = {
  fecha_documento: 'D.fecha_documento',
  fecha_registro: 'D.fecha_registro',
  tipo_documento: 'D.tipo_documento',
  id_documento: 'D.id_documento',
};

@Injectable()
export class DocumentosRepository {
  constructor(private readonly database: DatabaseService) {}

  async findDocumentos(q: QueryDocumentosDto): Promise<{ items: DocumentoListItem[]; total: number }> {
    const request = await this.database.request();
    const where: string[] = [];

    if (q.search) {
      request.input('search', VarChar(150), `%${q.search.trim()}%`);
      where.push(`(D.nombre_archivo LIKE @search OR A.codigo LIKE @search OR T.dni LIKE @search OR CONCAT(T.nombres, ' ', T.apellidos) LIKE @search)`);
    }

    if (q.tipo) {
      request.input('tipo', VarChar(100), q.tipo.trim());
      where.push(`D.tipo_documento = @tipo`);
    }

    if (q.idActivo) {
      request.input('idActivo', Int, q.idActivo);
      where.push(`D.id_activo = @idActivo`);
    }

    if (q.idAsignacion) {
      request.input('idAsignacion', Int, q.idAsignacion);
      where.push(`D.id_asignacion = @idAsignacion`);
    }

    if (q.idTrabajador) {
      request.input('idTrabajador', Int, q.idTrabajador);
      where.push(`D.id_trabajador = @idTrabajador`);
    }

    if (q.fechaDesde) {
      request.input('fechaDesde', VarChar(50), q.fechaDesde);
      where.push(`D.fecha_documento >= TRY_CAST(@fechaDesde AS DATETIME2)`);
    }

    if (q.fechaHasta) {
      request.input('fechaHasta', VarChar(50), q.fechaHasta);
      where.push(`D.fecha_documento <= TRY_CAST(@fechaHasta AS DATETIME2)`);
    }

    const sortCol = sortMap[q.sortBy] ?? 'D.fecha_documento';
    const sortDir = q.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (q.page - 1) * q.pageSize;

    request.input('offset', Int, offset);
    request.input('pageSize', Int, q.pageSize);

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const result = await request.query<{
      id_documento: number;
      tipo_documento: string;
      id_activo: number | null;
      activo_codigo: string | null;
      activo_tipo: string | null;
      id_asignacion: number | null;
      id_trabajador: number | null;
      trabajador_dni: string | null;
      trabajador_nombre: string | null;
      nombre_archivo: string;
      ruta_archivo: string;
      hash_archivo: string | null;
      fecha_documento: Date | null;
      fecha_registro: Date;
      usuario_registro_nombre: string | null;
      observaciones: string | null;
      total: number;
    }>(`
      SELECT
        D.id_documento,
        D.tipo_documento,
        D.id_activo,
        A.codigo AS activo_codigo,
        TA.nombre AS activo_tipo,
        D.id_asignacion,
        D.id_trabajador,
        T.dni AS trabajador_dni,
        CONCAT_WS(' ', T.nombres, T.apellidos) AS trabajador_nombre,
        D.nombre_archivo,
        D.ruta_archivo,
        D.hash_archivo,
        D.fecha_documento,
        D.fecha_registro,
        U.user_fullname AS usuario_registro_nombre,
        D.observaciones,
        COUNT(*) OVER() AS total
      FROM dbo.documentos D
      LEFT JOIN dbo.activos A ON A.id_activo = D.id_activo
      LEFT JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
      LEFT JOIN dbo.trabajadores T ON T.id_trabajador = D.id_trabajador
      LEFT JOIN dbo.usuarios_sistema U ON U.id_usuario_sistema = D.usuario_registro
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `);

    const total = Number(result.recordset[0]?.total ?? 0);
    const items: DocumentoListItem[] = result.recordset.map((r) => ({
      id: r.id_documento,
      tipoDocumento: r.tipo_documento,
      idActivo: r.id_activo,
      activoCodigo: r.activo_codigo,
      activoTipo: r.activo_tipo,
      idAsignacion: r.id_asignacion,
      idTrabajador: r.id_trabajador,
      trabajadorDni: r.trabajador_dni,
      trabajadorNombre: r.trabajador_nombre,
      nombreArchivo: r.nombre_archivo,
      rutaArchivo: r.ruta_archivo,
      hashArchivo: r.hash_archivo,
      fechaDocumento: r.fecha_documento,
      fechaRegistro: r.fecha_registro,
      usuarioRegistroNombre: r.usuario_registro_nombre,
      observaciones: r.observaciones,
    }));

    return { items, total };
  }

  async findDocumentoById(id: number): Promise<DocumentoListItem | null> {
    const request = await this.database.request();
    request.input('id', Int, id);

    const result = await request.query<{
      id_documento: number;
      tipo_documento: string;
      id_activo: number | null;
      activo_codigo: string | null;
      activo_tipo: string | null;
      id_asignacion: number | null;
      id_trabajador: number | null;
      trabajador_dni: string | null;
      trabajador_nombre: string | null;
      nombre_archivo: string;
      ruta_archivo: string;
      hash_archivo: string | null;
      fecha_documento: Date | null;
      fecha_registro: Date;
      usuario_registro_nombre: string | null;
      observaciones: string | null;
    }>(`
      SELECT
        D.id_documento,
        D.tipo_documento,
        D.id_activo,
        A.codigo AS activo_codigo,
        TA.nombre AS activo_tipo,
        D.id_asignacion,
        D.id_trabajador,
        T.dni AS trabajador_dni,
        CONCAT_WS(' ', T.nombres, T.apellidos) AS trabajador_nombre,
        D.nombre_archivo,
        D.ruta_archivo,
        D.hash_archivo,
        D.fecha_documento,
        D.fecha_registro,
        U.user_fullname AS usuario_registro_nombre,
        D.observaciones
      FROM dbo.documentos D
      LEFT JOIN dbo.activos A ON A.id_activo = D.id_activo
      LEFT JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
      LEFT JOIN dbo.trabajadores T ON T.id_trabajador = D.id_trabajador
      LEFT JOIN dbo.usuarios_sistema U ON U.id_usuario_sistema = D.usuario_registro
      WHERE D.id_documento = @id
    `);

    const r = result.recordset[0];
    if (!r) return null;

    return {
      id: r.id_documento,
      tipoDocumento: r.tipo_documento,
      idActivo: r.id_activo,
      activoCodigo: r.activo_codigo,
      activoTipo: r.activo_tipo,
      idAsignacion: r.id_asignacion,
      idTrabajador: r.id_trabajador,
      trabajadorDni: r.trabajador_dni,
      trabajadorNombre: r.trabajador_nombre,
      nombreArchivo: r.nombre_archivo,
      rutaArchivo: r.ruta_archivo,
      hashArchivo: r.hash_archivo,
      fechaDocumento: r.fecha_documento,
      fechaRegistro: r.fecha_registro,
      usuarioRegistroNombre: r.usuario_registro_nombre,
      observaciones: r.observaciones,
    };
  }

  async findAsignacionForDocument(idAsignacion: number): Promise<AsignacionHistoricalData | null> {
    const request = await this.database.request();
    request.input('id', Int, idAsignacion);

    const result = await request.query<{
      id_asignacion: number;
      activo: boolean;
      fecha_entrega: Date;
      estado_entrega: string | null;
      motivo_entrega: string | null;
      observacion_entrega: string | null;
      fecha_devolucion: Date | null;
      estado_devolucion: string | null;
      motivo_devolucion: string | null;
      observacion_devolucion: string | null;
      usuario_entrega_nombre: string | null;
      usuario_devolucion_nombre: string | null;
      id_activo: number;
      activo_codigo: string;
      activo_tipo: string;
      marca: string | null;
      modelo: string | null;
      numero_serie: string | null;
      color: string | null;
      id_trabajador: number;
      dni: string | null;
      nombres: string;
      apellidos: string;
      cargo: string | null;
      area: string | null;
      sede: string | null;
    }>(`
      SELECT
        AA.id_asignacion,
        AA.activo,
        AA.fecha_entrega,
        AA.estado_entrega,
        AA.motivo_entrega,
        AA.observacion_entrega,
        AA.fecha_devolucion,
        AA.estado_devolucion,
        AA.motivo_devolucion,
        AA.observacion_devolucion,
        UE.user_fullname AS usuario_entrega_nombre,
        UD.user_fullname AS usuario_devolucion_nombre,
        A.id_activo,
        A.codigo AS activo_codigo,
        TA.nombre AS activo_tipo,
        A.marca,
        A.modelo,
        A.numero_serie,
        A.color,
        T.id_trabajador,
        T.dni,
        T.nombres,
        T.apellidos,
        T.cargo,
        AR.nombre AS area,
        S.nombre AS sede
      FROM dbo.asignaciones_activo AA
      INNER JOIN dbo.activos A ON A.id_activo = AA.id_activo
      INNER JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
      INNER JOIN dbo.trabajadores T ON T.id_trabajador = AA.id_trabajador
      LEFT JOIN dbo.areas AR ON AR.id_area = T.id_area
      LEFT JOIN dbo.sedes S ON S.id_sede = AR.id_sede
      LEFT JOIN dbo.usuarios_sistema UE ON UE.id_usuario_sistema = AA.usuario_entrega
      LEFT JOIN dbo.usuarios_sistema UD ON UD.id_usuario_sistema = AA.usuario_devolucion
      WHERE AA.id_asignacion = @id
    `);

    const row = result.recordset[0];
    if (!row) return null;

    const accRequest = await this.database.request();
    accRequest.input('id', Int, idAsignacion);
    const accResult = await accRequest.query<{
      tipo: string;
      codigo: string | null;
      marca: string | null;
      modelo: string | null;
      numero_serie: string | null;
      estado_entrega: string | null;
    }>(`
      SELECT
        AC.tipo,
        AC.codigo,
        AC.marca,
        AC.modelo,
        AC.numero_serie,
        AX.estado_entrega
      FROM dbo.asignaciones_accesorios AX
      INNER JOIN dbo.accesorios AC ON AC.id_accesorio = AX.id_accesorio
      WHERE AX.id_asignacion = @id
      ORDER BY AC.tipo, AC.codigo
    `);

    return {
      idAsignacion: row.id_asignacion,
      activo: Boolean(row.activo),
      fechaEntrega: row.fecha_entrega,
      estadoEntrega: row.estado_entrega,
      motivoEntrega: row.motivo_entrega,
      observacionEntrega: row.observacion_entrega,
      usuarioEntregaNombre: row.usuario_entrega_nombre,
      fechaDevolucion: row.fecha_devolucion,
      estadoDevolucion: row.estado_devolucion,
      motivoDevolucion: row.motivo_devolucion,
      observacionDevolucion: row.observacion_devolucion,
      usuarioDevolucionNombre: row.usuario_devolucion_nombre,
      activoItem: {
        id: row.id_activo,
        codigo: row.activo_codigo,
        tipo: row.activo_tipo,
        marca: row.marca,
        modelo: row.modelo,
        serie: row.numero_serie,
        color: row.color,
      },
      trabajadorItem: {
        id: row.id_trabajador,
        dni: row.dni,
        nombreCompleto: `${row.nombres ?? ''} ${row.apellidos ?? ''}`.trim(),
        cargo: row.cargo,
        area: row.area,
        sede: row.sede,
      },
      accesorios: accResult.recordset.map((a) => ({
        tipo: a.tipo,
        codigo: a.codigo,
        marca: a.marca,
        modelo: a.modelo,
        serie: a.numero_serie,
        estado: a.estado_entrega,
      })),
    };
  }

  async insertDocumento(data: {
    tipoDocumento: string;
    idActivo: number;
    idAsignacion: number;
    idTrabajador: number;
    nombreArchivo: string;
    rutaArchivo: string;
    hashArchivo: string;
    fechaDocumento: Date;
    usuarioRegistro: number;
    observaciones?: string;
  }): Promise<number> {
    const request = await this.database.request();
    request.input('tipo', VarChar(100), data.tipoDocumento);
    request.input('idActivo', Int, data.idActivo);
    request.input('idAsignacion', Int, data.idAsignacion);
    request.input('idTrabajador', Int, data.idTrabajador);
    request.input('nombre', VarChar(300), data.nombreArchivo);
    request.input('ruta', VarChar(1200), data.rutaArchivo);
    request.input('hash', VarChar(128), data.hashArchivo);
    request.input('fechaDoc', DateTime2, data.fechaDocumento);
    request.input('userReg', Int, data.usuarioRegistro);
    request.input('obs', VarChar(700), data.observaciones ?? null);

    const result = await request.query<{ id: number }>(`
      INSERT INTO dbo.documentos (
        tipo_documento,
        id_activo,
        id_asignacion,
        id_trabajador,
        nombre_archivo,
        ruta_archivo,
        hash_archivo,
        fecha_documento,
        fecha_registro,
        usuario_registro,
        observaciones
      )
      OUTPUT INSERTED.id_documento AS id
      VALUES (
        @tipo,
        @idActivo,
        @idAsignacion,
        @idTrabajador,
        @nombre,
        @ruta,
        @hash,
        @fechaDoc,
        SYSDATETIME(),
        @userReg,
        @obs
      )
    `);

    return Number(result.recordset[0]?.id);
  }

  async audit(
    userId: number,
    action: string,
    recordId: string,
    after: unknown,
    ip: string,
  ): Promise<void> {
    const request = await this.database.request();
    request.input('userId', Int, userId);
    request.input('modulo', VarChar(150), 'DOCUMENTOS');
    request.input('accion', VarChar(100), action);
    request.input('tabla', VarChar(150), 'documentos');
    request.input('recordId', VarChar(100), recordId);
    request.input('after', NVarChar(MAX), JSON.stringify(after));
    request.input('ip', VarChar(45), ip);

    await request.query(`
      INSERT INTO dbo.auditoria (
        id_usuario,
        modulo,
        accion,
        tabla_afectada,
        registro_id,
        datos_anteriores,
        datos_nuevos,
        direccion_ip
      )
      VALUES (
        @userId,
        @modulo,
        @accion,
        @tabla,
        @recordId,
        NULL,
        @after,
        @ip
      )
    `);
  }
}
