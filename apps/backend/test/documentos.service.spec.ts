import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentosService } from '../src/documentos/documentos.service';
import { DocumentosRepository, AsignacionHistoricalData, DocumentoListItem } from '../src/documentos/documentos.repository';
import { Environment } from '../src/config/environment';

describe('DocumentosService', () => {
  let service: DocumentosService;
  let repository: jest.Mocked<DocumentosRepository>;
  let config: jest.Mocked<ConfigService<Environment, true>>;
  let logger: jest.Mocked<PinoLogger>;

  const testStorageDir = path.resolve(__dirname, 'test-storage-docs');

  const mockAsignacion: AsignacionHistoricalData = {
    idAsignacion: 10,
    activo: true,
    fechaEntrega: new Date('2026-02-01T10:00:00Z'),
    estadoEntrega: 'NUEVO',
    motivoEntrega: 'INGRESO LABORAL',
    observacionEntrega: 'Equipo en caja sellada',
    usuarioEntregaNombre: 'Admin TI',
    fechaDevolucion: null,
    estadoDevolucion: null,
    motivoDevolucion: null,
    observacionDevolucion: null,
    usuarioDevolucionNombre: null,
    activoItem: {
      id: 50,
      codigo: 'ACT-00050',
      tipo: 'LAPTOP',
      marca: 'DELL',
      modelo: 'LATITUDE 5420',
      serie: 'SN-987654',
      color: 'GRIS',
    },
    trabajadorItem: {
      id: 8,
      dni: '78901234',
      nombreCompleto: 'MARIA RODRIGUEZ',
      cargo: 'JEFA CONTABILIDAD',
      area: 'CONTABILIDAD',
      sede: 'LIMA',
    },
    accesorios: [
      {
        tipo: 'CARGADOR',
        codigo: 'ACC-001',
        marca: 'DELL',
        modelo: '65W USB-C',
        serie: 'CARG-123',
        estado: 'NUEVO',
      },
    ],
  };

  const sampleDoc: DocumentoListItem = {
    id: 1,
    tipoDocumento: 'ACTA_ENTREGA',
    idActivo: 50,
    activoCodigo: 'ACT-00050',
    activoTipo: 'LAPTOP',
    idAsignacion: 10,
    idTrabajador: 8,
    trabajadorDni: '78901234',
    trabajadorNombre: 'MARIA RODRIGUEZ',
    nombreArchivo: 'DOC_ENT_10_123456.pdf',
    rutaArchivo: path.join(testStorageDir, 'DOC_ENT_10_123456.pdf'),
    hashArchivo: 'fake-sha256-hash',
    fechaDocumento: new Date(),
    fechaRegistro: new Date(),
    usuarioRegistroNombre: 'Admin TI',
    observaciones: null,
  };

  beforeAll(() => {
    if (!fs.existsSync(testStorageDir)) {
      fs.mkdirSync(testStorageDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    repository = {
      findDocumentos: jest.fn(),
      findDocumentoById: jest.fn(),
      findAsignacionForDocument: jest.fn(),
      insertDocumento: jest.fn(),
      audit: jest.fn(),
    } as unknown as jest.Mocked<DocumentosRepository>;

    config = {
      get: jest.fn((key: string) => {
        if (key === 'DOCUMENTOS_STORAGE_PATH') return testStorageDir;
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService<Environment, true>>;

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<PinoLogger>;

    service = new DocumentosService(repository, config, logger);
  });

  it('debe generar acta de entrega en PDF, calcular hash SHA-256 e insertarla en BD', async () => {
    repository.findAsignacionForDocument.mockResolvedValue(mockAsignacion);
    repository.insertDocumento.mockResolvedValue(1);
    repository.findDocumentoById.mockResolvedValue(sampleDoc);

    const doc = await service.generar(
      { tipoDocumento: 'ACTA_ENTREGA', idAsignacion: 10, observaciones: 'Entrega conforme' },
      1,
      '127.0.0.1',
      'Admin TI',
    );

    expect(doc).toBeDefined();
    expect(repository.insertDocumento).toHaveBeenCalledWith(
      expect.objectContaining({
        tipoDocumento: 'ACTA_ENTREGA',
        idActivo: 50,
        idAsignacion: 10,
        idTrabajador: 8,
        hashArchivo: expect.any(String),
      }),
    );
    expect(repository.audit).toHaveBeenCalledWith(
      1,
      'DOCUMENTO_GENERAR',
      '1',
      expect.any(Object),
      '127.0.0.1',
    );
  });

  it('debe rechazar generar constancia de devolución si la asignación sigue vigente y no ha sido devuelta', async () => {
    repository.findAsignacionForDocument.mockResolvedValue(mockAsignacion); // activo: true, fechaDevolucion: null

    await expect(
      service.generar({ tipoDocumento: 'CONSTANCIA_DEVOLUCION', idAsignacion: 10 }, 1, '127.0.0.1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe proteger contra Path Traversal al solicitar descarga de un documento', async () => {
    const maliciousDoc: DocumentoListItem = {
      ...sampleDoc,
      rutaArchivo: path.join(testStorageDir, '..', '..', 'windows', 'system32', 'cmd.exe'),
    };
    repository.findDocumentoById.mockResolvedValue(maliciousDoc);

    await expect(service.getArchivoDescarga(1)).rejects.toThrow(ForbiddenException);
  });

  it('debe lanzar NotFoundException si el archivo físico no existe en disco', async () => {
    const nonExistentDoc: DocumentoListItem = {
      ...sampleDoc,
      rutaArchivo: path.join(testStorageDir, 'archivo_que_no_existe.pdf'),
    };
    repository.findDocumentoById.mockResolvedValue(nonExistentDoc);

    await expect(service.getArchivoDescarga(1)).rejects.toThrow(NotFoundException);
  });
});
