import { Injectable } from '@nestjs/common';
import { Int, MAX, NVarChar, VarChar } from 'mssql';
import { DatabaseService } from '../database/database.service';
import { CerrarInventarioDto } from './dto/cerrar-inventario.dto';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { QueryInventarioDetalleDto } from './dto/query-inventario-detalle.dto';
import { QueryInventariosDto } from './dto/query-inventarios.dto';
import { VerificarActivoDto } from './dto/verificar-activo.dto';
import {
  InventarioDetalleItemDto,
  InventarioDetalleRow,
  InventarioItemDto,
  InventarioResumenDto,
  InventarioRow,
} from './types/inventarios.types';

@Injectable()
export class InventariosRepository {
  constructor(private readonly database: DatabaseService) {}

  private mapDetalleItem(row: InventarioDetalleRow): InventarioDetalleItemDto {
    return {
      id: row.id_inventario_detalle,
      idInventario: row.id_inventario,
      idActivo: row.id_activo,
      activo: {
        codigo: row.codigo_activo,
        marca: row.marca_activo ?? null,
        modelo: row.modelo_activo ?? null,
        numeroSerie: row.serie_activo ?? null,
        tipo: row.tipo_activo,
        estado: {
          codigo: row.estado_activo_codigo,
          nombre: row.estado_activo_nombre,
        },
      },
      idUbicacionEsperada: row.id_ubicacion_esperada,
      ubicacionEsperada: row.ubicacion_esperada_texto ?? null,
      idUbicacionEncontrada: row.id_ubicacion_encontrada,
      ubicacionEncontrada: row.ubicacion_encontrada_texto ?? null,
      estadoVerificacion: row.estado_verificacion,
      fechaVerificacion: row.fecha_verificacion ? new Date(row.fecha_verificacion).toISOString() : null,
      usuarioVerificacion: row.usuario_verificacion
        ? {
            id: row.usuario_verificacion,
            nombre: row.usuario_verificacion_nombre ?? `Usuario #${row.usuario_verificacion}`,
          }
        : null,
      observaciones: row.observaciones ?? null,
    };
  }

  async list(q: QueryInventariosDto): Promise<{
    items: InventarioItemDto[];
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
      where.push(`(I.nombre LIKE @search OR S.nombre LIKE @search OR I.observaciones LIKE @search)`);
    }

    if (q.estado) {
      request.input('estado', VarChar(30), q.estado);
      where.push('I.estado = @estado');
    }

    if (q.idSede) {
      request.input('idSede', Int, q.idSede);
      where.push('I.id_sede = @idSede');
    }

    if (q.fechaDesde) {
      request.input('fechaDesde', VarChar(30), q.fechaDesde);
      where.push('I.fecha_inicio >= @fechaDesde');
    }

    if (q.fechaHasta) {
      request.input('fechaHasta', VarChar(30), q.fechaHasta);
      where.push('I.fecha_inicio <= @fechaHasta');
    }

    const sortMap: Record<string, string> = {
      id_inventario: 'I.id_inventario',
      nombre: 'I.nombre',
      fecha_inicio: 'I.fecha_inicio',
      fecha_fin: 'I.fecha_fin',
      estado: 'I.estado',
    };

    const sortColumn = sortMap[q.sortBy] || 'I.id_inventario';
    const sortDirection = q.sortDirection === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = where.join(' AND ');

    request.input('offset', Int, offset);
    request.input('limit', Int, pageSize);

    const query = `
      SELECT COUNT(*) AS total
      FROM dbo.inventarios I
      LEFT JOIN dbo.sedes S ON S.id_sede = I.id_sede
      WHERE ${whereClause};

      SELECT
        I.id_inventario,
        I.nombre,
        I.id_sede,
        I.fecha_inicio,
        I.fecha_fin,
        I.estado,
        I.observaciones,
        I.usuario_registro,
        S.nombre AS sede_nombre,
        US.user_fullname AS usuario_registro_nombre,
        COUNT(ID.id_inventario_detalle) AS total_esperados,
        COUNT(CASE WHEN ID.estado_verificacion <> 'PENDIENTE' THEN 1 END) AS verificados,
        COUNT(CASE WHEN ID.estado_verificacion = 'PENDIENTE' THEN 1 END) AS pendientes
      FROM dbo.inventarios I
      LEFT JOIN dbo.sedes S ON S.id_sede = I.id_sede
      LEFT JOIN dbo.usuarios_sistema US ON US.id_usuario_sistema = I.usuario_registro
      LEFT JOIN dbo.inventario_detalle ID ON ID.id_inventario = I.id_inventario
      WHERE ${whereClause}
      GROUP BY
        I.id_inventario,
        I.nombre,
        I.id_sede,
        I.fecha_inicio,
        I.fecha_fin,
        I.estado,
        I.observaciones,
        I.usuario_registro,
        S.nombre,
        US.user_fullname
      ORDER BY ${sortColumn} ${sortDirection}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const result = await request.query<InventarioRow>(query);
    const total = (result.recordsets[0][0] as unknown as { total: number })?.total || 0;
    const rows = result.recordsets[1] || [];

    const items: InventarioItemDto[] = rows.map(r => {
      const totalEsperados = Number(r.total_esperados) || 0;
      const verificados = Number(r.verificados) || 0;
      const pendientes = Number(r.pendientes) || 0;
      const progreso = totalEsperados > 0 ? Math.round((verificados * 100.0) / totalEsperados * 10) / 10 : 0;

      return {
        id: r.id_inventario,
        nombre: r.nombre,
        idSede: r.id_sede,
        sedeNombre: r.sede_nombre ?? null,
        fechaInicio: new Date(r.fecha_inicio).toISOString(),
        fechaFin: r.fecha_fin ? new Date(r.fecha_fin).toISOString() : null,
        estado: r.estado,
        observaciones: r.observaciones ?? null,
        usuarioRegistro: r.usuario_registro
          ? {
              id: r.usuario_registro,
              nombre: r.usuario_registro_nombre ?? `Usuario #${r.usuario_registro}`,
            }
          : null,
        totalEsperados,
        verificados,
        pendientes,
        progreso,
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async detail(id: number): Promise<(InventarioItemDto & { resumen: InventarioResumenDto }) | null> {
    const request = await this.database.request();
    request.input('id', Int, id);

    const query = `
      SELECT
        I.id_inventario,
        I.nombre,
        I.id_sede,
        I.fecha_inicio,
        I.fecha_fin,
        I.estado,
        I.observaciones,
        I.usuario_registro,
        S.nombre AS sede_nombre,
        US.user_fullname AS usuario_registro_nombre,
        COUNT(ID.id_inventario_detalle) AS total_esperados,
        COUNT(CASE WHEN ID.estado_verificacion <> 'PENDIENTE' THEN 1 END) AS verificados,
        COUNT(CASE WHEN ID.estado_verificacion = 'PENDIENTE' THEN 1 END) AS pendientes,
        COUNT(CASE WHEN ID.estado_verificacion = 'ENCONTRADO' THEN 1 END) AS encontrados,
        COUNT(CASE WHEN ID.estado_verificacion = 'NO_ENCONTRADO' THEN 1 END) AS no_encontrados,
        COUNT(CASE WHEN ID.estado_verificacion = 'CAMBIO_UBICACION' THEN 1 END) AS cambio_ubicacion,
        COUNT(CASE WHEN ID.estado_verificacion = 'OBSERVADO' THEN 1 END) AS observados
      FROM dbo.inventarios I
      LEFT JOIN dbo.sedes S ON S.id_sede = I.id_sede
      LEFT JOIN dbo.usuarios_sistema US ON US.id_usuario_sistema = I.usuario_registro
      LEFT JOIN dbo.inventario_detalle ID ON ID.id_inventario = I.id_inventario
      WHERE I.id_inventario = @id
      GROUP BY
        I.id_inventario,
        I.nombre,
        I.id_sede,
        I.fecha_inicio,
        I.fecha_fin,
        I.estado,
        I.observaciones,
        I.usuario_registro,
        S.nombre,
        US.user_fullname;
    `;

    const result = await request.query<InventarioRow>(query);
    const r = result.recordset[0];
    if (!r) return null;

    const totalEsperados = Number(r.total_esperados) || 0;
    const verificados = Number(r.verificados) || 0;
    const pendientes = Number(r.pendientes) || 0;
    const encontrados = Number(r.encontrados) || 0;
    const noEncontrados = Number(r.no_encontrados) || 0;
    const cambioUbicacion = Number(r.cambio_ubicacion) || 0;
    const observados = Number(r.observados) || 0;
    const progreso = totalEsperados > 0 ? Math.round((verificados * 100.0) / totalEsperados * 10) / 10 : 0;

    return {
      id: r.id_inventario,
      nombre: r.nombre,
      idSede: r.id_sede,
      sedeNombre: r.sede_nombre ?? null,
      fechaInicio: new Date(r.fecha_inicio).toISOString(),
      fechaFin: r.fecha_fin ? new Date(r.fecha_fin).toISOString() : null,
      estado: r.estado,
      observaciones: r.observaciones ?? null,
      usuarioRegistro: r.usuario_registro
        ? {
            id: r.usuario_registro,
            nombre: r.usuario_registro_nombre ?? `Usuario #${r.usuario_registro}`,
          }
        : null,
      totalEsperados,
      verificados,
      pendientes,
      progreso,
      resumen: {
        idInventario: r.id_inventario,
        totalEsperados,
        verificados,
        pendientes,
        encontrados,
        noEncontrados,
        cambioUbicacion,
        observados,
        progreso,
      },
    };
  }

  async resumen(id: number): Promise<InventarioResumenDto | null> {
    const detail = await this.detail(id);
    return detail ? detail.resumen : null;
  }

  async detallePaginado(
    idInventario: number,
    q: QueryInventarioDetalleDto
  ): Promise<{
    items: InventarioDetalleItemDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, q.page || 1);
    const pageSize = Math.min(100, Math.max(1, q.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const request = await this.database.request();
    request.input('idInventario', Int, idInventario);

    const where: string[] = ['ID.id_inventario = @idInventario'];

    if (q.search) {
      request.input('search', VarChar(202), `%${q.search.trim()}%`);
      where.push(
        `(A.codigo LIKE @search OR A.marca LIKE @search OR A.modelo LIKE @search OR A.numero_serie LIKE @search OR ID.observaciones LIKE @search)`
      );
    }

    if (q.estadoVerificacion) {
      request.input('estadoVerificacion', VarChar(30), q.estadoVerificacion);
      where.push('ID.estado_verificacion = @estadoVerificacion');
    }

    if (q.idTipo) {
      request.input('idTipo', Int, q.idTipo);
      where.push('A.id_tipo_activo = @idTipo');
    }

    if (q.idArea) {
      request.input('idArea', Int, q.idArea);
      where.push('(UE.id_area = @idArea OR UF.id_area = @idArea)');
    }

    const whereClause = where.join(' AND ');

    request.input('offset', Int, offset);
    request.input('limit', Int, pageSize);

    const query = `
      SELECT COUNT(*) AS total
      FROM dbo.inventario_detalle ID
      INNER JOIN dbo.activos A ON A.id_activo = ID.id_activo
      LEFT JOIN dbo.ubicaciones UE ON UE.id_ubicacion = ID.id_ubicacion_esperada
      LEFT JOIN dbo.ubicaciones UF ON UF.id_ubicacion = ID.id_ubicacion_encontrada
      WHERE ${whereClause};

      SELECT
        ID.id_inventario_detalle,
        ID.id_inventario,
        ID.id_activo,
        ID.id_ubicacion_esperada,
        ID.id_ubicacion_encontrada,
        ID.estado_verificacion,
        ID.fecha_verificacion,
        ID.usuario_verificacion,
        ID.observaciones,
        A.codigo AS codigo_activo,
        A.marca AS marca_activo,
        A.modelo AS modelo_activo,
        A.numero_serie AS serie_activo,
        TA.nombre AS tipo_activo,
        EA.codigo AS estado_activo_codigo,
        EA.nombre AS estado_activo_nombre,
        CONCAT_WS(' / ', SE.nombre, AE.nombre, UE.piso, UE.zona, UE.puesto) AS ubicacion_esperada_texto,
        CONCAT_WS(' / ', SF.nombre, AF.nombre, UF.piso, UF.zona, UF.puesto) AS ubicacion_encontrada_texto,
        UV.user_fullname AS usuario_verificacion_nombre
      FROM dbo.inventario_detalle ID
      INNER JOIN dbo.activos A ON A.id_activo = ID.id_activo
      INNER JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
      INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
      LEFT JOIN dbo.ubicaciones UE ON UE.id_ubicacion = ID.id_ubicacion_esperada
      LEFT JOIN dbo.sedes SE ON SE.id_sede = UE.id_sede
      LEFT JOIN dbo.areas AE ON AE.id_area = UE.id_area
      LEFT JOIN dbo.ubicaciones UF ON UF.id_ubicacion = ID.id_ubicacion_encontrada
      LEFT JOIN dbo.sedes SF ON SF.id_sede = UF.id_sede
      LEFT JOIN dbo.areas AF ON AF.id_area = UF.id_area
      LEFT JOIN dbo.usuarios_sistema UV ON UV.id_usuario_sistema = ID.usuario_verificacion
      WHERE ${whereClause}
      ORDER BY ID.id_inventario_detalle ASC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const result = await request.query<InventarioDetalleRow>(query);
    const total = (result.recordsets[0][0] as unknown as { total: number })?.total || 0;
    const rows = result.recordsets[1] || [];

    const items = rows.map(r => this.mapDetalleItem(r));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async create(d: CreateInventarioDto, userId: number, ip: string): Promise<InventarioItemDto & { resumen: InventarioResumenDto }> {
    return this.database.transaction(async tx => {
      // If idSede provided, validate exists
      if (d.idSede) {
        const sedeReq = tx.request();
        sedeReq.input('idSede', Int, d.idSede);
        const sedeRes = await sedeReq.query<{ id_sede: number }>(`
          SELECT id_sede FROM dbo.sedes WHERE id_sede = @idSede;
        `);
        if (!sedeRes.recordset[0]) {
          throw new Error('SEDE_NOT_FOUND');
        }
      }

      // Insert header
      const insertReq = tx.request();
      insertReq.input('nombre', VarChar(200), d.nombre);
      insertReq.input('idSede', Int, d.idSede || null);
      insertReq.input('observaciones', VarChar(1500), d.observaciones || null);
      insertReq.input('userId', Int, userId);

      const headerRes = await insertReq.query<{ id_inventario: number }>(`
        INSERT INTO dbo.inventarios (
          nombre,
          id_sede,
          fecha_inicio,
          estado,
          observaciones,
          usuario_registro
        )
        OUTPUT INSERTED.id_inventario
        VALUES (
          @nombre,
          @idSede,
          SYSDATETIME(),
          'ABIERTO',
          @observaciones,
          @userId
        );
      `);

      const idInventario = headerRes.recordset[0].id_inventario;

      // Populate snapshot of expected assets into dbo.inventario_detalle
      const snapshotReq = tx.request();
      snapshotReq.input('idInventario', Int, idInventario);
      if (d.idSede) {
        snapshotReq.input('idSede', Int, d.idSede);
      }

      const sedeFilter = d.idSede ? 'AND U.id_sede = @idSede' : '';

      await snapshotReq.query(`
        INSERT INTO dbo.inventario_detalle (
          id_inventario,
          id_activo,
          id_ubicacion_esperada,
          estado_verificacion
        )
        SELECT
          @idInventario,
          A.id_activo,
          A.id_ubicacion,
          'PENDIENTE'
        FROM dbo.activos A
        INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
        LEFT JOIN dbo.ubicaciones U ON U.id_ubicacion = A.id_ubicacion
        WHERE EA.codigo NOT IN ('DE_BAJA', 'BAJA')
          ${sedeFilter}
        ORDER BY A.id_activo;
      `);

      // Audit log
      const auditReq = tx.request();
      auditReq.input('userId', Int, userId);
      auditReq.input('action', VarChar(100), 'INVENTARIO_CREAR');
      auditReq.input('recordId', VarChar(100), String(idInventario));
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
          'INVENTARIO',
          @action,
          'inventarios',
          @recordId,
          NULL,
          @after,
          @ip
        );
      `);

      const detail = await this.detail(idInventario);
      return detail!;
    });
  }

  async verificarActivo(
    idInventario: number,
    d: VerificarActivoDto,
    userId: number,
    ip: string
  ): Promise<InventarioDetalleItemDto> {
    return this.database.transaction(async tx => {
      // 1. Lock header
      const lockReq = tx.request();
      lockReq.input('idInventario', Int, idInventario);
      const invRes = await lockReq.query<{ estado: string }>(`
        SELECT estado
        FROM dbo.inventarios WITH (UPDLOCK, HOLDLOCK)
        WHERE id_inventario = @idInventario;
      `);

      const inventario = invRes.recordset[0];
      if (!inventario) {
        throw new Error('INVENTARIO_NOT_FOUND');
      }
      if (inventario.estado === 'FINALIZADO' || inventario.estado === 'CANCELADO') {
        throw new Error('INVENTARIO_CLOSED');
      }

      // If 'ABIERTO', transition to 'EN_PROCESO'
      if (inventario.estado === 'ABIERTO') {
        const updateStateReq = tx.request();
        updateStateReq.input('idInventario', Int, idInventario);
        await updateStateReq.query(`
          UPDATE dbo.inventarios
          SET estado = 'EN_PROCESO'
          WHERE id_inventario = @idInventario;
        `);
      }

      // 2. Lock and check existing detail line
      const detailReq = tx.request();
      detailReq.input('idInventario', Int, idInventario);
      detailReq.input('idActivo', Int, d.idActivo);

      const existingRes = await detailReq.query<{
        id_inventario_detalle: number;
        estado_verificacion: string;
        id_ubicacion_esperada: number | null;
      }>(`
        SELECT id_inventario_detalle, estado_verificacion, id_ubicacion_esperada
        FROM dbo.inventario_detalle WITH (UPDLOCK, HOLDLOCK)
        WHERE id_inventario = @idInventario AND id_activo = @idActivo;
      `);

      let idDetalle: number;
      const existing = existingRes.recordset[0];

      if (existing) {
        if (existing.estado_verificacion !== 'PENDIENTE') {
          throw new Error('ACTIVO_ALREADY_VERIFIED');
        }

        idDetalle = existing.id_inventario_detalle;

        // Auto-detect CAMBIO_UBICACION if found location differs from expected and user passed ENCONTRADO
        let finalEstado = d.estadoVerificacion;
        if (
          d.estadoVerificacion === 'ENCONTRADO' &&
          d.idUbicacionEncontrada !== undefined &&
          existing.id_ubicacion_esperada !== null &&
          d.idUbicacionEncontrada !== existing.id_ubicacion_esperada
        ) {
          finalEstado = 'CAMBIO_UBICACION';
        }

        const updateReq = tx.request();
        updateReq.input('idDetalle', Int, idDetalle);
        updateReq.input('idUbicacionEncontrada', Int, d.idUbicacionEncontrada || null);
        updateReq.input('estadoVerificacion', VarChar(30), finalEstado);
        updateReq.input('observaciones', VarChar(700), d.observaciones || null);
        updateReq.input('userId', Int, userId);

        await updateReq.query(`
          UPDATE dbo.inventario_detalle
          SET id_ubicacion_encontrada = @idUbicacionEncontrada,
              estado_verificacion = @estadoVerificacion,
              fecha_verificacion = SYSDATETIME(),
              usuario_verificacion = @userId,
              observaciones = @observaciones
          WHERE id_inventario_detalle = @idDetalle;
        `);
      } else {
        // Unexpected asset found during physical check!
        // Verify asset exists in dbo.activos
        const assetReq = tx.request();
        assetReq.input('idActivo', Int, d.idActivo);
        const assetRes = await assetReq.query<{ id_activo: number; id_ubicacion: number | null }>(`
          SELECT id_activo, id_ubicacion
          FROM dbo.activos
          WHERE id_activo = @idActivo;
        `);

        const asset = assetRes.recordset[0];
        if (!asset) {
          throw new Error('ACTIVO_NOT_FOUND');
        }

        let finalEstado = d.estadoVerificacion;
        if (
          d.estadoVerificacion === 'ENCONTRADO' &&
          d.idUbicacionEncontrada !== undefined &&
          asset.id_ubicacion !== null &&
          d.idUbicacionEncontrada !== asset.id_ubicacion
        ) {
          finalEstado = 'CAMBIO_UBICACION';
        }

        const insertDetReq = tx.request();
        insertDetReq.input('idInventario', Int, idInventario);
        insertDetReq.input('idActivo', Int, d.idActivo);
        insertDetReq.input('idUbicacionEsperada', Int, asset.id_ubicacion);
        insertDetReq.input('idUbicacionEncontrada', Int, d.idUbicacionEncontrada || null);
        insertDetReq.input('estadoVerificacion', VarChar(30), finalEstado);
        insertDetReq.input(
          'observaciones',
          VarChar(700),
          d.observaciones || 'Activo no esperado verificado durante la campaña física.'
        );
        insertDetReq.input('userId', Int, userId);

        const insertRes = await insertDetReq.query<{ id_inventario_detalle: number }>(`
          INSERT INTO dbo.inventario_detalle (
            id_inventario,
            id_activo,
            id_ubicacion_esperada,
            id_ubicacion_encontrada,
            estado_verificacion,
            fecha_verificacion,
            usuario_verificacion,
            observaciones
          )
          OUTPUT INSERTED.id_inventario_detalle
          VALUES (
            @idInventario,
            @idActivo,
            @idUbicacionEsperada,
            @idUbicacionEncontrada,
            @estadoVerificacion,
            SYSDATETIME(),
            @userId,
            @observaciones
          );
        `);

        idDetalle = insertRes.recordset[0].id_inventario_detalle;
      }

      // Audit log
      const auditReq = tx.request();
      auditReq.input('userId', Int, userId);
      auditReq.input('action', VarChar(100), 'INVENTARIO_VERIFICAR_ACTIVO');
      auditReq.input('recordId', VarChar(100), String(idDetalle));
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
          'INVENTARIO',
          @action,
          'inventario_detalle',
          @recordId,
          NULL,
          @after,
          @ip
        );
      `);

      // Fetch row representation
      const fetchReq = tx.request();
      fetchReq.input('idDetalle', Int, idDetalle);
      const rowRes = await fetchReq.query<InventarioDetalleRow>(`
        SELECT
          ID.id_inventario_detalle,
          ID.id_inventario,
          ID.id_activo,
          ID.id_ubicacion_esperada,
          ID.id_ubicacion_encontrada,
          ID.estado_verificacion,
          ID.fecha_verificacion,
          ID.usuario_verificacion,
          ID.observaciones,
          A.codigo AS codigo_activo,
          A.marca AS marca_activo,
          A.modelo AS modelo_activo,
          A.numero_serie AS serie_activo,
          TA.nombre AS tipo_activo,
          EA.codigo AS estado_activo_codigo,
          EA.nombre AS estado_activo_nombre,
          CONCAT_WS(' / ', SE.nombre, AE.nombre, UE.piso, UE.zona, UE.puesto) AS ubicacion_esperada_texto,
          CONCAT_WS(' / ', SF.nombre, AF.nombre, UF.piso, UF.zona, UF.puesto) AS ubicacion_encontrada_texto,
          UV.user_fullname AS usuario_verificacion_nombre
        FROM dbo.inventario_detalle ID
        INNER JOIN dbo.activos A ON A.id_activo = ID.id_activo
        INNER JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
        INNER JOIN dbo.estados_activo EA ON EA.id_estado_activo = A.id_estado_activo
        LEFT JOIN dbo.ubicaciones UE ON UE.id_ubicacion = ID.id_ubicacion_esperada
        LEFT JOIN dbo.sedes SE ON SE.id_sede = UE.id_sede
        LEFT JOIN dbo.areas AE ON AE.id_area = UE.id_area
        LEFT JOIN dbo.ubicaciones UF ON UF.id_ubicacion = ID.id_ubicacion_encontrada
        LEFT JOIN dbo.sedes SF ON SF.id_sede = UF.id_sede
        LEFT JOIN dbo.areas AF ON AF.id_area = UF.id_area
        LEFT JOIN dbo.usuarios_sistema UV ON UV.id_usuario_sistema = ID.usuario_verificacion
        WHERE ID.id_inventario_detalle = @idDetalle;
      `);

      return this.mapDetalleItem(rowRes.recordset[0]);
    });
  }

  async cerrar(
    idInventario: number,
    d: CerrarInventarioDto,
    userId: number,
    ip: string
  ): Promise<InventarioItemDto & { resumen: InventarioResumenDto }> {
    return this.database.transaction(async tx => {
      const lockReq = tx.request();
      lockReq.input('idInventario', Int, idInventario);

      const invRes = await lockReq.query<{ estado: string; observaciones: string | null }>(`
        SELECT estado, observaciones
        FROM dbo.inventarios WITH (UPDLOCK, HOLDLOCK)
        WHERE id_inventario = @idInventario;
      `);

      const inventario = invRes.recordset[0];
      if (!inventario) {
        throw new Error('INVENTARIO_NOT_FOUND');
      }
      if (inventario.estado === 'FINALIZADO') {
        throw new Error('INVENTARIO_ALREADY_CLOSED');
      }
      if (inventario.estado === 'CANCELADO') {
        throw new Error('INVENTARIO_CANCELLED');
      }

      // Check pending assets count
      const pendingReq = tx.request();
      pendingReq.input('idInventario', Int, idInventario);
      const pendingRes = await pendingReq.query<{ pendientes: number }>(`
        SELECT COUNT(*) AS pendientes
        FROM dbo.inventario_detalle
        WHERE id_inventario = @idInventario AND estado_verificacion = 'PENDIENTE';
      `);

      const pendientes = pendingRes.recordset[0]?.pendientes || 0;
      if (pendientes > 0 && !d.confirmarPendientes && !d.motivoCierre) {
        throw new Error(`INVENTARIO_HAS_PENDING:${pendientes}`);
      }

      const appendObs = d.motivoCierre
        ? `${inventario.observaciones ? inventario.observaciones + ' | ' : ''}Cierre justificado: ${d.motivoCierre}`
        : inventario.observaciones;

      const updateReq = tx.request();
      updateReq.input('idInventario', Int, idInventario);
      updateReq.input('observaciones', VarChar(1500), appendObs || null);

      await updateReq.query(`
        UPDATE dbo.inventarios
        SET estado = 'FINALIZADO',
            fecha_fin = SYSDATETIME(),
            observaciones = @observaciones
        WHERE id_inventario = @idInventario;
      `);

      // Audit log
      const auditReq = tx.request();
      auditReq.input('userId', Int, userId);
      auditReq.input('action', VarChar(100), 'INVENTARIO_CERRAR');
      auditReq.input('recordId', VarChar(100), String(idInventario));
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
          'INVENTARIO',
          @action,
          'inventarios',
          @recordId,
          NULL,
          @after,
          @ip
        );
      `);

      const detail = await this.detail(idInventario);
      return detail!;
    });
  }
}
