import { Injectable } from '@nestjs/common';
import { Int, NVarChar, Request, Transaction, VarChar } from 'mssql';
import { DatabaseService } from '../../database/database.service';
import { AsignarResponsableDto } from '../dto/asignar-responsable.dto';
import { AsociarCelularDto } from '../dto/asociar-celular.dto';
import { CambiarResponsableDto } from '../dto/cambiar-responsable.dto';
import { LiberarResponsableDto } from '../dto/liberar-responsable.dto';
import { RetirarCelularDto } from '../dto/retirar-celular.dto';
import { LineasRepository } from '../lineas/lineas.repository';

@Injectable()
export class RelacionesRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly lineasRepo: LineasRepository,
  ) {}

  private request(tx?: Transaction): Promise<Request> {
    return tx ? Promise.resolve(new Request(tx)) : this.database.request();
  }

  // Valida que el activo sea tipo CELULAR (sin hardcodear id_tipo)
  private async validateCelular(idActivo: number, tx: Transaction): Promise<void> {
    const r = await this.request(tx);
    r.input('activo', Int, idActivo);
    const row = (await r.query(
      `SELECT UPPER(RTRIM(LTRIM(TA.nombre))) AS tipoNombre
       FROM dbo.activos A
       JOIN dbo.tipos_activo TA ON TA.id_tipo_activo = A.id_tipo_activo
       WHERE A.id_activo = @activo`,
    )).recordset[0];
    if (!row) throw Object.assign(new Error('ACTIVO_NOT_FOUND'), { code: 'ACTIVO_NOT_FOUND' });
    if (row.tipoNombre !== 'CELULAR') throw Object.assign(new Error('NOT_CELULAR'), { code: 'NOT_CELULAR' });
  }

  // ─── RESPONSABLE ──────────────────────────────────────────────────────────

  async asignarResponsable(idLinea: number, d: AsignarResponsableDto, userId: number, ip: string) {
    return this.database.transaction(async tx => {
      const lock = await this.request(tx); lock.input('id', Int, idLinea);
      const existing = (await lock.query(
        `SELECT COUNT(*) AS cnt FROM dbo.asignaciones_linea WITH (UPDLOCK,HOLDLOCK) WHERE id_linea=@id AND activo=1`,
      )).recordset[0];
      if (Number(existing.cnt) > 0) throw Object.assign(new Error('ALREADY_HAS_RESPONSABLE'), { code: 'ALREADY_HAS_RESPONSABLE' });

      const wc = await this.request(tx); wc.input('trab', Int, d.idTrabajador);
      const wRow = (await wc.query(`SELECT estado FROM dbo.trabajadores WHERE id_trabajador=@trab`)).recordset[0];
      if (!wRow) throw Object.assign(new Error('TRABAJADOR_NOT_FOUND'), { code: 'TRABAJADOR_NOT_FOUND' });
      if (wRow.estado !== 'ACTIVO') throw Object.assign(new Error('TRABAJADOR_INACTIVE'), { code: 'TRABAJADOR_INACTIVE' });

      const ins = await this.request(tx);
      ins.input('linea', Int, idLinea).input('trab', Int, d.idTrabajador)
        .input('motivo', VarChar(500), d.motivo ?? null)
        .input('obs', NVarChar(1000), d.observaciones ?? null)
        .input('usr', Int, userId);
      await ins.query(
        `INSERT dbo.asignaciones_linea(id_linea,id_trabajador,fecha_inicio,motivo,observaciones,activo,usuario_registro)
         VALUES(@linea,@trab,GETDATE(),@motivo,@obs,1,@usr)`,
      );

      const after = await this.lineasRepo.detail(idLinea, tx);
      await this.audit(tx, idLinea, userId, 'LINEA_ASIGNAR_RESPONSABLE', null, after, ip);
      return after;
    });
  }

  async cambiarResponsable(idLinea: number, d: CambiarResponsableDto, userId: number, ip: string) {
    return this.database.transaction(async tx => {
      const lock = await this.request(tx); lock.input('id', Int, idLinea);
      const current = (await lock.query(
        `SELECT id_asignacion_linea AS idAsg FROM dbo.asignaciones_linea WITH (UPDLOCK,HOLDLOCK) WHERE id_linea=@id AND activo=1`,
      )).recordset[0];
      if (!current) throw Object.assign(new Error('NO_RESPONSABLE'), { code: 'NO_RESPONSABLE' });

      const wc = await this.request(tx); wc.input('trab', Int, d.idTrabajador);
      const wRow = (await wc.query(`SELECT estado FROM dbo.trabajadores WHERE id_trabajador=@trab`)).recordset[0];
      if (!wRow) throw Object.assign(new Error('TRABAJADOR_NOT_FOUND'), { code: 'TRABAJADOR_NOT_FOUND' });
      if (wRow.estado !== 'ACTIVO') throw Object.assign(new Error('TRABAJADOR_INACTIVE'), { code: 'TRABAJADOR_INACTIVE' });

      const before = await this.lineasRepo.detail(idLinea, tx);

      const close = await this.request(tx); close.input('asg', Int, current.idAsg);
      await close.query(`UPDATE dbo.asignaciones_linea SET activo=0,fecha_fin=GETDATE() WHERE id_asignacion_linea=@asg`);

      const ins = await this.request(tx);
      ins.input('linea', Int, idLinea).input('trab', Int, d.idTrabajador)
        .input('motivo', VarChar(500), d.motivo ?? null)
        .input('obs', NVarChar(1000), d.observaciones ?? null)
        .input('usr', Int, userId);
      await ins.query(
        `INSERT dbo.asignaciones_linea(id_linea,id_trabajador,fecha_inicio,motivo,observaciones,activo,usuario_registro)
         VALUES(@linea,@trab,GETDATE(),@motivo,@obs,1,@usr)`,
      );

      const after = await this.lineasRepo.detail(idLinea, tx);
      await this.audit(tx, idLinea, userId, 'LINEA_CAMBIAR_RESPONSABLE', before, after, ip);
      return after;
    });
  }

  async liberarResponsable(idLinea: number, d: LiberarResponsableDto, userId: number, ip: string) {
    return this.database.transaction(async tx => {
      const lock = await this.request(tx); lock.input('id', Int, idLinea);
      const current = (await lock.query(
        `SELECT id_asignacion_linea AS idAsg FROM dbo.asignaciones_linea WITH (UPDLOCK,HOLDLOCK) WHERE id_linea=@id AND activo=1`,
      )).recordset[0];
      if (!current) throw Object.assign(new Error('NO_RESPONSABLE'), { code: 'NO_RESPONSABLE' });

      const before = await this.lineasRepo.detail(idLinea, tx);

      const close = await this.request(tx);
      close.input('asg', Int, current.idAsg)
        .input('motivo', VarChar(500), d.motivo ?? null)
        .input('obs', NVarChar(1000), d.observaciones ?? null);
      await close.query(
        `UPDATE dbo.asignaciones_linea
         SET activo=0, fecha_fin=GETDATE(),
             motivo=ISNULL(@motivo,motivo), observaciones=ISNULL(@obs,observaciones)
         WHERE id_asignacion_linea=@asg`,
      );

      const after = await this.lineasRepo.detail(idLinea, tx);
      await this.audit(tx, idLinea, userId, 'LINEA_LIBERAR_RESPONSABLE', before, after, ip);
      return after;
    });
  }

  // ─── EQUIPO ───────────────────────────────────────────────────────────────

  async asociarEquipo(idLinea: number, d: AsociarCelularDto, userId: number, ip: string) {
    return this.database.transaction(async tx => {
      await this.validateCelular(d.idActivo, tx);

      const lockL = await this.request(tx); lockL.input('id', Int, idLinea);
      const existL = (await lockL.query(
        `SELECT COUNT(*) AS cnt FROM dbo.linea_equipo_historial WITH (UPDLOCK,HOLDLOCK) WHERE id_linea=@id AND activo=1`,
      )).recordset[0];
      if (Number(existL.cnt) > 0) throw Object.assign(new Error('LINEA_ALREADY_HAS_EQUIPO'), { code: 'LINEA_ALREADY_HAS_EQUIPO' });

      const lockA = await this.request(tx); lockA.input('activo', Int, d.idActivo);
      const existA = (await lockA.query(
        `SELECT COUNT(*) AS cnt FROM dbo.linea_equipo_historial WITH (UPDLOCK,HOLDLOCK) WHERE id_activo=@activo AND activo=1`,
      )).recordset[0];
      if (Number(existA.cnt) > 0) throw Object.assign(new Error('EQUIPO_ALREADY_IN_LINEA'), { code: 'EQUIPO_ALREADY_IN_LINEA' });

      const ins = await this.request(tx);
      ins.input('linea', Int, idLinea).input('activo', Int, d.idActivo)
        .input('obs', NVarChar(1000), d.observaciones ?? null).input('usr', Int, userId);
      await ins.query(
        `INSERT dbo.linea_equipo_historial(id_linea,id_activo,fecha_inicio,activo,observaciones,usuario_registro)
         VALUES(@linea,@activo,GETDATE(),1,@obs,@usr)`,
      );

      const after = await this.lineasRepo.detail(idLinea, tx);
      await this.audit(tx, idLinea, userId, 'LINEA_ASOCIAR_EQUIPO', null, after, ip);
      return after;
    });
  }

  async cambiarEquipo(idLinea: number, d: AsociarCelularDto, userId: number, ip: string) {
    return this.database.transaction(async tx => {
      await this.validateCelular(d.idActivo, tx);

      const lockL = await this.request(tx); lockL.input('id', Int, idLinea);
      const currentL = (await lockL.query(
        `SELECT id_linea_equipo AS idReg FROM dbo.linea_equipo_historial WITH (UPDLOCK,HOLDLOCK) WHERE id_linea=@id AND activo=1`,
      )).recordset[0];
      if (!currentL) throw Object.assign(new Error('LINEA_NO_EQUIPO'), { code: 'LINEA_NO_EQUIPO' });

      const lockA = await this.request(tx); lockA.input('activo', Int, d.idActivo);
      const existA = (await lockA.query(
        `SELECT COUNT(*) AS cnt FROM dbo.linea_equipo_historial WITH (UPDLOCK,HOLDLOCK) WHERE id_activo=@activo AND activo=1`,
      )).recordset[0];
      if (Number(existA.cnt) > 0) throw Object.assign(new Error('EQUIPO_ALREADY_IN_LINEA'), { code: 'EQUIPO_ALREADY_IN_LINEA' });

      const before = await this.lineasRepo.detail(idLinea, tx);

      const close = await this.request(tx); close.input('reg', Int, currentL.idReg);
      await close.query(`UPDATE dbo.linea_equipo_historial SET activo=0,fecha_fin=GETDATE() WHERE id_linea_equipo=@reg`);

      const ins = await this.request(tx);
      ins.input('linea', Int, idLinea).input('activo', Int, d.idActivo)
        .input('obs', NVarChar(1000), d.observaciones ?? null).input('usr', Int, userId);
      await ins.query(
        `INSERT dbo.linea_equipo_historial(id_linea,id_activo,fecha_inicio,activo,observaciones,usuario_registro)
         VALUES(@linea,@activo,GETDATE(),1,@obs,@usr)`,
      );

      const after = await this.lineasRepo.detail(idLinea, tx);
      await this.audit(tx, idLinea, userId, 'LINEA_CAMBIAR_EQUIPO', before, after, ip);
      return after;
    });
  }

  async retirarEquipo(idLinea: number, d: RetirarCelularDto, userId: number, ip: string) {
    return this.database.transaction(async tx => {
      const lock = await this.request(tx); lock.input('id', Int, idLinea);
      const current = (await lock.query(
        `SELECT id_linea_equipo AS idReg FROM dbo.linea_equipo_historial WITH (UPDLOCK,HOLDLOCK) WHERE id_linea=@id AND activo=1`,
      )).recordset[0];
      if (!current) throw Object.assign(new Error('LINEA_NO_EQUIPO'), { code: 'LINEA_NO_EQUIPO' });

      const before = await this.lineasRepo.detail(idLinea, tx);

      const close = await this.request(tx);
      close.input('reg', Int, current.idReg).input('obs', NVarChar(1000), d.observaciones ?? null);
      await close.query(
        `UPDATE dbo.linea_equipo_historial
         SET activo=0, fecha_fin=GETDATE(), observaciones=ISNULL(@obs,observaciones)
         WHERE id_linea_equipo=@reg`,
      );

      const after = await this.lineasRepo.detail(idLinea, tx);
      await this.audit(tx, idLinea, userId, 'LINEA_RETIRAR_EQUIPO', before, after, ip);
      return after;
    });
  }

  private async audit(tx: Transaction, idLinea: number, user: number, action: string, before: unknown, after: unknown, ip: string) {
    const r = await this.request(tx);
    r.input('user', Int, user).input('action', VarChar(100), action)
      .input('id', VarChar(100), String(idLinea))
      .input('before', NVarChar(4000), before ? JSON.stringify(before) : null)
      .input('after', NVarChar(4000), JSON.stringify(after))
      .input('ip', VarChar(45), ip);
    await r.query(
      `INSERT dbo.auditoria(id_usuario,modulo,accion,tabla_afectada,registro_id,datos_anteriores,datos_nuevos,direccion_ip)
       VALUES(@user,'TELEFONIA',@action,'lineas_moviles',@id,@before,@after,@ip)`,
    );
  }
}
