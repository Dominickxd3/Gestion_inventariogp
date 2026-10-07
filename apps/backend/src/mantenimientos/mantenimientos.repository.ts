import { Injectable } from '@nestjs/common';
import { Date as SqlDate, DateTime2, Decimal, Int, MAX, NVarChar, VarChar } from 'mssql';
import { DatabaseService } from '../database/database.service';
import { CreateMantenimientoDto } from './dto/create-mantenimiento.dto';
import { FinalizarMantenimientoDto } from './dto/finalizar-mantenimiento.dto';
import { QueryMantenimientosDto } from './dto/query-mantenimientos.dto';
import { UpdateMantenimientoDto } from './dto/update-mantenimiento.dto';
import {
  MantenimientoDetailDto,
  MantenimientoItemDto,
  MantenimientoRow,
} from './types/mantenimientos.types';

@Injectable()
export class MantenimientosRepository {
  constructor(private readonly database: DatabaseService) {}

  private mapItem(row: MantenimientoRow): MantenimientoItemDto {
    return {
      id: row.id_mantenimiento,
      idActivo: row.id_activo,
      activo: {
        codigo: row.codigo_activo ?? '',
        marca: row.marca_activo ?? null,
        modelo: row.modelo_activo ?? null,
        numeroSerie: row.serie_activo ?? null,
        tipo: row.tipo_activo ?? '',
        estado: {
          codigo: row.estado_activo_codigo ?? '',
          nombre: row.estado_activo_nombre ?? '',
        },
        sede: row.sede_nombre ?? null,
        area: row.area_nombre ?? null,
      },
      tipo: row.tipo,
      fechaProgramada: row.fecha_programada ? String(row.fecha_programada).slice(0, 10) : null,
      fechaInicio: row.fecha_inicio ? new Date(row.fecha_inicio).toISOString() : null,
      fechaFin: row.fecha_fin ? new Date(row.fecha_fin).toISOString() : null,
      problemaReportado: row.problema_reportado ?? null,
      diagnostico: row.diagnostico ?? null,
      trabajoRealizado: row.trabajo_realizado ?? null,
      costo: row.costo !== null && row.costo !== undefined ? Number(row.costo) : null,
      proveedor: row.proveedor ?? null,
      estado: row.estado,
      proximoMantenimiento: row.proximo_mantenimiento ? String(row.proximo_mantenimiento).slice(0, 10) : null,
      observaciones: row.observaciones ?? null,
      usuarioRegistro: row.usuario_registro
        ? {
            id: row.usuario_registro,
            nombre: row.usuario_registro_nombre ?? `Usuario #${row.usuario_registro}`,
          }
        : null,
    };
  }

  async list(q: QueryMantenimientosDto): Promise<{
    items: MantenimientoItemDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, q.page || 1);
    const pageSize = Math.min(100, Math.max(1, q.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const request = await this.database.request();
    const where: string[] = ['1=1'];

    if (q.search) {
      request.input('search', VarChar(202), `%${q.search.trim()}%`);
      where.push(
        `(A.codigo LIKE @search OR A.marca LIKE @search OR A.modelo LIKE @search OR A.numero_serie LIKE @search OR M.proveedor LIKE @search OR M.problema_reportado LIKE @search)`
      );
    }

    if (q.estado) {
      request.input('estado', VarChar(30), q.estado);
      where.push('M.estado = @estado');
    }

    if (q.idActivo) {
      request.input('idActivo', Int, q.idActivo);
      where.push('M.id_activo = @idActivo');
    }

    if (q.tipo) {
      request.input('tipo', VarChar(30), q.tipo);
      where.push('M.tipo = @tipo');
    }

    if (q.idSede) {
      request.input('idSede', Int, q.idSede);
      where.push('U.id_sede = @idSede');
    }

    if (q.fechaDesde) {
      request.input('fechaDesde', VarChar(30), q.fechaDesde);
      where.push('COALESCE(M.fecha_inicio, M.fecha_programada) >= @fechaDesde');
    }

    if (q.fechaHasta) {
      request.input('fechaHasta', VarChar(30), q.fechaHasta);
      where.push('COALESCE(M.fecha_inicio, M.fecha_programada) <= @fechaHasta');
    }

    const sortMap: Record<string, string> = {
      id_mantenimiento: 'M.id_mantenimiento',
      fecha_inicio: 'M.fecha_inicio',
      fecha_programada: 'M.fecha_programada',
      costo: 'M.costo',
      estado: 'M.estado',
      tipo: 'M.tipo',
      codigo: 'A.codigo',
    };

    const sortColumn = sortMap[q.sortBy] || 'M.id_mantenimiento';
    const sortDirection = q.sortDirection === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = where.join(' AND ');

    request.input('offset', Int, offset);
    request.input('limit', Int, pageSize);

    const query = `
      SELECT COUNT(*) AS total
      FROM dbo.mantenimientos M
      INNER JOIN dbo.activos A ON A.id_activo = M.id_activo
      INNER JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
      INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
      LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion = A.id_ubicacion
      WHERE ${whereClause};

      SELECT
        M.id_mantenimiento,
        M.id_activo,
        M.tipo,
        M.fecha_programada,
        M.fecha_inicio,
        M.fecha_fin,
        M.problema_reportado,
        M.diagnostico,
        M.trabajo_realizado,
        M.costo,
        M.proveedor,
        M.estado,
        M.proximo_mantenimiento,
        M.observaciones,
        M.usuario_registro,
        A.codigo AS codigo_activo,
        A.marca AS marca_activo,
        A.modelo AS modelo_activo,
        A.numero_serie AS serie_activo,
        TA.nombre AS tipo_activo,
        EA.codigo AS estado_activo_codigo,
        EA.nombre AS estado_activo_nombre,
        S.nombre AS sede_nombre,
        AR.nombre AS area_nombre,
        US.user_fullname AS usuario_registro_nombre
      FROM dbo.mantenimientos M
      INNER JOIN dbo.activos A ON A.id_activo = M.id_activo
      INNER JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
      INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
      LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion = A.id_ubicacion
      LEFT JOIN dbo.sedes S ON S.id_sede = U.id_sede
      LEFT JOIN dbo.areas AR ON AR.id_area = U.id_area
      LEFT JOIN dbo.usuarios_sistema US ON US.id_usuario_sistema = M.usuario_registro
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const result = await request.query<MantenimientoRow>(query);
    const total = (result.recordsets[0][0] as unknown as { total: number })?.total || 0;
    const items = (result.recordsets[1] || []).map(row => this.mapItem(row));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async detail(id: number): Promise<MantenimientoDetailDto | null> {
    const request = await this.database.request();
    request.input('id', Int, id);

    const query = `
      SELECT
        M.id_mantenimiento,
        M.id_activo,
        M.tipo,
        M.fecha_programada,
        M.fecha_inicio,
        M.fecha_fin,
        M.problema_reportado,
        M.diagnostico,
        M.trabajo_realizado,
        M.costo,
        M.proveedor,
        M.estado,
        M.proximo_mantenimiento,
        M.observaciones,
        M.usuario_registro,
        A.codigo AS codigo_activo,
        A.marca AS marca_activo,
        A.modelo AS modelo_activo,
        A.numero_serie AS serie_activo,
        TA.nombre AS tipo_activo,
        EA.codigo AS estado_activo_codigo,
        EA.nombre AS estado_activo_nombre,
        S.nombre AS sede_nombre,
        AR.nombre AS area_nombre,
        US.user_fullname AS usuario_registro_nombre,
        CONCAT_WS(' / ', S.nombre, AR.nombre, U.piso, U.zona, U.puesto) AS ubicacion_texto,
        (
          SELECT TOP 1 CONCAT(TR.nombres, ' ', TR.apellidos)
          FROM dbo.asignaciones_activo AA
          INNER JOIN dbo.trabajadores TR ON TR.id_trabajador = AA.id_trabajador
          WHERE AA.id_activo = M.id_activo AND AA.activo = 1
        ) AS responsable_actual
      FROM dbo.mantenimientos M
      INNER JOIN dbo.activos A ON A.id_activo = M.id_activo
      INNER JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
      INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
      LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion = A.id_ubicacion
      LEFT JOIN dbo.sedes S ON S.id_sede = U.id_sede
      LEFT JOIN dbo.areas AR ON AR.id_area = U.id_area
      LEFT JOIN dbo.usuarios_sistema US ON US.id_usuario_sistema = M.usuario_registro
      WHERE M.id_mantenimiento = @id;
    `;

    const result = await request.query<MantenimientoRow & { ubicacion_texto?: string }>(query);
    const row = result.recordset[0];
    if (!row) return null;

    const base = this.mapItem(row);
    return {
      ...base,
      activoCompleto: {
        id: row.id_activo,
        codigo: row.codigo_activo ?? '',
        marca: row.marca_activo ?? null,
        modelo: row.modelo_activo ?? null,
        numeroSerie: row.serie_activo ?? null,
        tipo: row.tipo_activo ?? '',
        estado: {
          codigo: row.estado_activo_codigo ?? '',
          nombre: row.estado_activo_nombre ?? '',
        },
        ubicacionTexto: row.ubicacion_texto || null,
        responsableActual: row.responsable_actual || null,
      },
    };
  }

  async historyByAsset(idActivo: number): Promise<MantenimientoItemDto[]> {
    const request = await this.database.request();
    request.input('idActivo', Int, idActivo);

    const query = `
      SELECT
        M.id_mantenimiento,
        M.id_activo,
        M.tipo,
        M.fecha_programada,
        M.fecha_inicio,
        M.fecha_fin,
        M.problema_reportado,
        M.diagnostico,
        M.trabajo_realizado,
        M.costo,
        M.proveedor,
        M.estado,
        M.proximo_mantenimiento,
        M.observaciones,
        M.usuario_registro,
        A.codigo AS codigo_activo,
        A.marca AS marca_activo,
        A.modelo AS modelo_activo,
        A.numero_serie AS serie_activo,
        TA.nombre AS tipo_activo,
        EA.codigo AS estado_activo_codigo,
        EA.nombre AS estado_activo_nombre,
        S.nombre AS sede_nombre,
        AR.nombre AS area_nombre,
        US.user_fullname AS usuario_registro_nombre
      FROM dbo.mantenimientos M
      INNER JOIN dbo.activos A ON A.id_activo = M.id_activo
      INNER JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
      INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
      LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion = A.id_ubicacion
      LEFT JOIN dbo.sedes S ON S.id_sede = U.id_sede
      LEFT JOIN dbo.areas AR ON AR.id_area = U.id_area
      LEFT JOIN dbo.usuarios_sistema US ON US.id_usuario_sistema = M.usuario_registro
      WHERE M.id_activo = @idActivo
      ORDER BY M.id_mantenimiento DESC;
    `;

    const result = await request.query<MantenimientoRow>(query);
    return result.recordset.map(row => this.mapItem(row));
  }

  async create(d: CreateMantenimientoDto, userId: number, ip: string): Promise<MantenimientoDetailDto> {
    return this.database.transaction(async tx => {
      const lockReq = tx.request();
      lockReq.input('idActivo', Int, d.idActivo);

      const assetCheck = await lockReq.query<{
        id_activo: number;
        estado_codigo: string;
        tiene_asignacion: number;
      }>(`
        SELECT
          A.id_activo,
          EA.codigo AS estado_codigo,
          (SELECT COUNT(*) FROM dbo.asignaciones_activo WHERE id_activo = A.id_activo AND activo = 1) AS tiene_asignacion
        FROM dbo.activos A WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
        WHERE A.id_activo = @idActivo;
      `);

      const asset = assetCheck.recordset[0];
      if (!asset) {
        throw new Error('ACTIVO_NOT_FOUND');
      }
      if (asset.estado_codigo === 'DE_BAJA' || asset.estado_codigo === 'BAJA') {
        throw new Error('ACTIVO_DE_BAJA');
      }

      const estadoMantenimiento = d.estado || 'PENDIENTE';

      // Coexistence & state transition:
      // If user requested changing asset state or if maintenance starts EN_PROCESO:
      // If asset is DISPONIBLE, move to MANTENIMIENTO.
      // If asset is ASIGNADO, keep assignment active and do NOT break it.
      if (d.cambiarEstadoActivo || estadoMantenimiento === 'EN_PROCESO') {
        if (asset.estado_codigo === 'DISPONIBLE') {
          const updateAssetReq = tx.request();
          updateAssetReq.input('idActivo', Int, d.idActivo);
          await updateAssetReq.query(`
            UPDATE dbo.activos
            SET id_estado_activo = (SELECT id_estado_activo FROM dbo.estados_activo WHERE codigo = 'MANTENIMIENTO'),
                fecha_actualizacion = SYSDATETIME()
            WHERE id_activo = @idActivo;
          `);
        }
      }

      const insertReq = tx.request();
      insertReq.input('idActivo', Int, d.idActivo);
      insertReq.input('tipo', VarChar(30), d.tipo);
      insertReq.input('fechaProgramada', SqlDate, d.fechaProgramada || null);
      insertReq.input('fechaInicio', DateTime2, d.fechaInicio || null);
      insertReq.input('problemaReportado', VarChar(1500), d.problemaReportado || null);
      insertReq.input('diagnostico', VarChar(1500), d.diagnostico || null);
      insertReq.input('trabajoRealizado', VarChar(2500), d.trabajoRealizado || null);
      insertReq.input('costo', Decimal(12, 2), d.costo !== undefined && d.costo !== null ? d.costo : null);
      insertReq.input('proveedor', VarChar(200), d.proveedor || null);
      insertReq.input('estado', VarChar(30), estadoMantenimiento);
      insertReq.input('proximoMantenimiento', SqlDate, d.proximoMantenimiento || null);
      insertReq.input('observaciones', VarChar(1500), d.observaciones || null);
      insertReq.input('userId', Int, userId);

      const insertResult = await insertReq.query<{ id_mantenimiento: number }>(`
        INSERT INTO dbo.mantenimientos (
          id_activo,
          tipo,
          fecha_programada,
          fecha_inicio,
          problema_reportado,
          diagnostico,
          trabajo_realizado,
          costo,
          proveedor,
          estado,
          proximo_mantenimiento,
          observaciones,
          usuario_registro
        )
        OUTPUT INSERTED.id_mantenimiento
        VALUES (
          @idActivo,
          @tipo,
          @fechaProgramada,
          @fechaInicio,
          @problemaReportado,
          @diagnostico,
          @trabajoRealizado,
          @costo,
          @proveedor,
          @estado,
          @proximoMantenimiento,
          @observaciones,
          @userId
        );
      `);

      const idMantenimiento = insertResult.recordset[0].id_mantenimiento;

      // Register asset movement for timeline/dashboard
      const movReq = tx.request();
      movReq.input('idActivo', Int, d.idActivo);
      movReq.input('tipo', VarChar(100), 'MANTENIMIENTO');
      movReq.input(
        'descripcion',
        VarChar(1500),
        `Mantenimiento ${d.tipo} (#${idMantenimiento}): ${d.problemaReportado || 'Registro de intervención'}`
      );
      movReq.input('userId', Int, userId);
      await movReq.query(`
        INSERT INTO dbo.movimientos_activo (
          id_activo,
          tipo_movimiento,
          descripcion,
          id_usuario
        )
        VALUES (
          @idActivo,
          @tipo,
          @descripcion,
          @userId
        );
      `);

      // Audit log
      const auditReq = tx.request();
      auditReq.input('userId', Int, userId);
      auditReq.input('action', VarChar(100), 'MANTENIMIENTO_CREAR');
      auditReq.input('recordId', VarChar(100), String(idMantenimiento));
      auditReq.input('after', NVarChar(MAX), JSON.stringify(d));
      auditReq.input('ip', VarChar(45), ip);
      await auditReq.query(`
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
          'MANTENIMIENTO',
          @action,
          'mantenimientos',
          @recordId,
          NULL,
          @after,
          @ip
        );
      `);

      // Detail fetch
      const detail = await this.detail(idMantenimiento);
      return detail!;
    });
  }

  async update(id: number, d: UpdateMantenimientoDto, userId: number, ip: string): Promise<MantenimientoDetailDto> {
    return this.database.transaction(async tx => {
      const lockReq = tx.request();
      lockReq.input('id', Int, id);

      const currentRes = await lockReq.query<MantenimientoRow>(`
        SELECT *
        FROM dbo.mantenimientos WITH (UPDLOCK, HOLDLOCK)
        WHERE id_mantenimiento = @id;
      `);

      const current = currentRes.recordset[0];
      if (!current) {
        throw new Error('MANTENIMIENTO_NOT_FOUND');
      }

      if (current.estado === 'FINALIZADO' || current.estado === 'CANCELADO') {
        throw new Error('MANTENIMIENTO_CLOSED');
      }

      const updateReq = tx.request();
      updateReq.input('id', Int, id);

      const sets: string[] = [];

      if (d.tipo !== undefined) {
        updateReq.input('tipo', VarChar(30), d.tipo);
        sets.push('tipo = @tipo');
      }
      if (d.fechaProgramada !== undefined) {
        updateReq.input('fechaProgramada', SqlDate, d.fechaProgramada || null);
        sets.push('fecha_programada = @fechaProgramada');
      }
      if (d.fechaInicio !== undefined) {
        updateReq.input('fechaInicio', DateTime2, d.fechaInicio || null);
        sets.push('fecha_inicio = @fechaInicio');
      }
      if (d.problemaReportado !== undefined) {
        updateReq.input('problemaReportado', VarChar(1500), d.problemaReportado || null);
        sets.push('problema_reportado = @problemaReportado');
      }
      if (d.diagnostico !== undefined) {
        updateReq.input('diagnostico', VarChar(1500), d.diagnostico || null);
        sets.push('diagnostico = @diagnostico');
      }
      if (d.trabajoRealizado !== undefined) {
        updateReq.input('trabajoRealizado', VarChar(2500), d.trabajoRealizado || null);
        sets.push('trabajo_realizado = @trabajoRealizado');
      }
      if (d.costo !== undefined) {
        updateReq.input('costo', Decimal(12, 2), d.costo !== null ? d.costo : null);
        sets.push('costo = @costo');
      }
      if (d.proveedor !== undefined) {
        updateReq.input('proveedor', VarChar(200), d.proveedor || null);
        sets.push('proveedor = @proveedor');
      }
      if (d.estado !== undefined) {
        updateReq.input('estado', VarChar(30), d.estado);
        sets.push('estado = @estado');
      }
      if (d.proximoMantenimiento !== undefined) {
        updateReq.input('proximoMantenimiento', SqlDate, d.proximoMantenimiento || null);
        sets.push('proximo_mantenimiento = @proximoMantenimiento');
      }
      if (d.observaciones !== undefined) {
        updateReq.input('observaciones', VarChar(1500), d.observaciones || null);
        sets.push('observaciones = @observaciones');
      }

      if (sets.length > 0) {
        await updateReq.query(`
          UPDATE dbo.mantenimientos
          SET ${sets.join(', ')}
          WHERE id_mantenimiento = @id;
        `);
      }

      // Audit log
      const auditReq = tx.request();
      auditReq.input('userId', Int, userId);
      auditReq.input('action', VarChar(100), 'MANTENIMIENTO_EDITAR');
      auditReq.input('recordId', VarChar(100), String(id));
      auditReq.input('before', NVarChar(MAX), JSON.stringify(current));
      auditReq.input('after', NVarChar(MAX), JSON.stringify(d));
      auditReq.input('ip', VarChar(45), ip);
      await auditReq.query(`
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
          'MANTENIMIENTO',
          @action,
          'mantenimientos',
          @recordId,
          @before,
          @after,
          @ip
        );
      `);

      const detail = await this.detail(id);
      return detail!;
    });
  }

  async finalizar(id: number, d: FinalizarMantenimientoDto, userId: number, ip: string): Promise<MantenimientoDetailDto> {
    return this.database.transaction(async tx => {
      const lockReq = tx.request();
      lockReq.input('id', Int, id);

      const currentRes = await lockReq.query<MantenimientoRow>(`
        SELECT *
        FROM dbo.mantenimientos WITH (UPDLOCK, HOLDLOCK)
        WHERE id_mantenimiento = @id;
      `);

      const current = currentRes.recordset[0];
      if (!current) {
        throw new Error('MANTENIMIENTO_NOT_FOUND');
      }

      if (current.estado === 'FINALIZADO' || current.estado === 'CANCELADO') {
        throw new Error('MANTENIMIENTO_ALREADY_FINISHED');
      }

      const updateReq = tx.request();
      updateReq.input('id', Int, id);
      updateReq.input('fechaFin', DateTime2, d.fechaFin || null);
      updateReq.input('trabajoRealizado', VarChar(2500), d.trabajoRealizado ?? current.trabajo_realizado);
      updateReq.input('diagnostico', VarChar(1500), d.diagnostico ?? current.diagnostico);
      updateReq.input(
        'costo',
        Decimal(12, 2),
        d.costo !== undefined && d.costo !== null ? d.costo : current.costo
      );
      updateReq.input('proximoMantenimiento', SqlDate, d.proximoMantenimiento || current.proximo_mantenimiento);
      updateReq.input('observaciones', VarChar(1500), d.observaciones ?? current.observaciones);

      await updateReq.query(`
        UPDATE dbo.mantenimientos
        SET estado = 'FINALIZADO',
            fecha_fin = COALESCE(@fechaFin, SYSDATETIME()),
            trabajo_realizado = @trabajoRealizado,
            diagnostico = @diagnostico,
            costo = @costo,
            proximo_mantenimiento = @proximoMantenimiento,
            observaciones = @observaciones
        WHERE id_mantenimiento = @id;
      `);

      // Restore coherent asset state:
      // If asset is currently in MANTENIMIENTO state, check if active assignment exists.
      // If assigned -> ASIGNADO, else -> DISPONIBLE.
      const assetStateReq = tx.request();
      assetStateReq.input('idActivo', Int, current.id_activo);
      const assetCheck = await assetStateReq.query<{
        codigo_estado: string;
        tiene_asignacion: number;
      }>(`
        SELECT
          EA.codigo AS codigo_estado,
          (SELECT COUNT(*) FROM dbo.asignaciones_activo WHERE id_activo = A.id_activo AND activo = 1) AS tiene_asignacion
        FROM dbo.activos A WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
        WHERE A.id_activo = @idActivo;
      `);

      const assetRow = assetCheck.recordset[0];
      if (assetRow && assetRow.codigo_estado === 'MANTENIMIENTO') {
        const nextState = assetRow.tiene_asignacion > 0 ? 'ASIGNADO' : 'DISPONIBLE';
        const restoreReq = tx.request();
        restoreReq.input('idActivo', Int, current.id_activo);
        restoreReq.input('nextState', VarChar(50), nextState);
        await restoreReq.query(`
          UPDATE dbo.activos
          SET id_estado_activo = (SELECT id_estado_activo FROM dbo.estados_activo WHERE codigo = @nextState),
              fecha_actualizacion = SYSDATETIME()
          WHERE id_activo = @idActivo;
        `);
      }

      // Record movement
      const movReq = tx.request();
      movReq.input('idActivo', Int, current.id_activo);
      movReq.input('tipo', VarChar(100), 'MANTENIMIENTO_FIN');
      movReq.input(
        'descripcion',
        VarChar(1500),
        `Mantenimiento finalizado (#${id}). ${d.trabajoRealizado ? 'Trabajo: ' + d.trabajoRealizado : ''}`
      );
      movReq.input('userId', Int, userId);
      await movReq.query(`
        INSERT INTO dbo.movimientos_activo (
          id_activo,
          tipo_movimiento,
          descripcion,
          id_usuario
        )
        VALUES (
          @idActivo,
          @tipo,
          @descripcion,
          @userId
        );
      `);

      // Audit log
      const auditReq = tx.request();
      auditReq.input('userId', Int, userId);
      auditReq.input('action', VarChar(100), 'MANTENIMIENTO_FINALIZAR');
      auditReq.input('recordId', VarChar(100), String(id));
      auditReq.input('before', NVarChar(MAX), JSON.stringify(current));
      auditReq.input('after', NVarChar(MAX), JSON.stringify(d));
      auditReq.input('ip', VarChar(45), ip);
      await auditReq.query(`
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
          'MANTENIMIENTO',
          @action,
          'mantenimientos',
          @recordId,
          @before,
          @after,
          @ip
        );
      `);

      const detail = await this.detail(id);
      return detail!;
    });
  }
}
