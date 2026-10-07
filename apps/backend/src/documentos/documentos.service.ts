import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { Environment } from '../config/environment';
import {
  DocumentosRepository,
  DocumentoListItem,
} from './documentos.repository';
import { QueryDocumentosDto } from './dto/query-documentos.dto';
import { GenerarDocumentoDto } from './dto/generar-documento.dto';
import { buildDocumentoPdf, DocumentoPdfData } from './documentos.pdf-builder';

@Injectable()
export class DocumentosService {
  private readonly storageDir: string;

  constructor(
    private readonly repository: DocumentosRepository,
    private readonly config: ConfigService<Environment, true>,
    private readonly logger: PinoLogger,
  ) {
    const rawPath = this.config.get('DOCUMENTOS_STORAGE_PATH');
    this.storageDir = path.resolve(rawPath);
    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (err) {
        this.logger.error({ err, path: this.storageDir }, 'No se pudo crear el directorio de documentos');
      }
    }
  }

  async list(q: QueryDocumentosDto): Promise<{
    items: DocumentoListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const { items, total } = await this.repository.findDocumentos(q);
    const totalPages = total > 0 ? Math.ceil(total / q.pageSize) : 0;
    return {
      items,
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages,
      },
    };
  }

  async getById(id: number): Promise<DocumentoListItem> {
    const item = await this.repository.findDocumentoById(id);
    if (!item) {
      throw new NotFoundException('Documento no encontrado');
    }
    return item;
  }

  async generar(
    dto: GenerarDocumentoDto,
    userId: number,
    ip: string,
    userFullname?: string,
  ): Promise<DocumentoListItem> {
    const asig = await this.repository.findAsignacionForDocument(dto.idAsignacion);
    if (!asig) {
      throw new NotFoundException('La asignación especificada no existe');
    }

    if (dto.tipoDocumento === 'CONSTANCIA_DEVOLUCION' && asig.activo && !asig.fechaDevolucion) {
      throw new BadRequestException(
        'No se puede generar constancia de devolución para una asignación que aún se encuentra vigente',
      );
    }

    const timestamp = Date.now();
    const isEntrega = dto.tipoDocumento === 'ACTA_ENTREGA';
    const subTipo = isEntrega ? 'ENT' : 'DEV';
    const codigoDoc = `${asig.activoItem.codigo}-${subTipo}-${timestamp.toString().slice(-6)}`;
    const fechaDoc = isEntrega ? asig.fechaEntrega : (asig.fechaDevolucion ?? new Date());

    const pdfData: DocumentoPdfData = {
      tipo: dto.tipoDocumento,
      codigoDocumento: codigoDoc,
      fecha: fechaDoc,
      trabajador: asig.trabajadorItem,
      activo: asig.activoItem,
      accesorios: asig.accesorios,
      motivo: isEntrega ? asig.motivoEntrega : asig.motivoDevolucion,
      observaciones: dto.observaciones ?? (isEntrega ? asig.observacionEntrega : asig.observacionDevolucion),
      usuarioResponsable: userFullname ?? (isEntrega ? asig.usuarioEntregaNombre : asig.usuarioDevolucionNombre),
    };

    const pdfBuffer = await buildDocumentoPdf(pdfData);
    const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    const sanitizedBaseName = `DOC_${subTipo}_${asig.idAsignacion}_${timestamp}.pdf`;
    const safeFilePath = path.join(this.storageDir, sanitizedBaseName);

    // Asegurar directorio y escribir archivo de forma atómica
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    fs.writeFileSync(safeFilePath, pdfBuffer);

    const docId = await this.repository.insertDocumento({
      tipoDocumento: dto.tipoDocumento,
      idActivo: asig.activoItem.id,
      idAsignacion: asig.idAsignacion,
      idTrabajador: asig.trabajadorItem.id,
      nombreArchivo: sanitizedBaseName,
      rutaArchivo: safeFilePath,
      hashArchivo: hash,
      fechaDocumento: fechaDoc,
      usuarioRegistro: userId,
      observaciones: dto.observaciones,
    });

    const created = await this.repository.findDocumentoById(docId);
    if (!created) {
      throw new NotFoundException('Documento creado pero no encontrado');
    }

    await this.repository.audit(
      userId,
      'DOCUMENTO_GENERAR',
      String(docId),
      {
        idDocumento: docId,
        tipoDocumento: dto.tipoDocumento,
        idAsignacion: asig.idAsignacion,
        idActivo: asig.activoItem.id,
        nombreArchivo: sanitizedBaseName,
        hash,
      },
      ip,
    );

    this.logger.info(
      { docId, tipo: dto.tipoDocumento, idAsignacion: asig.idAsignacion },
      'Documento operativo generado exitosamente',
    );

    return created;
  }

  async getArchivoDescarga(id: number): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    const doc = await this.repository.findDocumentoById(id);
    if (!doc) {
      throw new NotFoundException('Documento no encontrado');
    }

    const resolvedPath = path.resolve(doc.rutaArchivo);
    const baseDir = this.storageDir;

    // Protección estricta contra Path Traversal
    const relative = path.relative(baseDir, resolvedPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      this.logger.warn({ resolvedPath, baseDir }, 'Intento de Path Traversal bloqueado');
      throw new ForbiddenException('Ruta de archivo no autorizada');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new NotFoundException('El archivo físico del documento no existe en el almacenamiento');
    }

    return {
      filePath: resolvedPath,
      fileName: doc.nombreArchivo,
      mimeType: 'application/pdf',
    };
  }
}
