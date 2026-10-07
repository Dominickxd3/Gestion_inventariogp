import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QrService } from '../src/qr/qr.service';
import { QrRepository, ActivoQrRow } from '../src/qr/qr.repository';
import { Environment } from '../src/config/environment';

describe('QrService', () => {
  let service: QrService;
  let repository: jest.Mocked<QrRepository>;
  let config: jest.Mocked<ConfigService<Environment, true>>;

  const mockSecret = 'super-secret-key-at-least-32-chars-long-12345';
  const mockAppUrl = 'http://127.0.0.1:5173';

  const sampleActivo: ActivoQrRow = {
    id_activo: 101,
    codigo: 'ACT-000101',
    tipo_nombre: 'LAPTOP',
    tipo_codigo: 'LAPTOP',
    marca: 'LENOVO',
    modelo: 'THINKPAD T14',
    color: 'NEGRO',
    estado_nombre: 'OPERATIVO',
    estado_codigo: 'OPERATIVO',
    ubicacion_nombre: 'OFICINA PRINCIPAL',
    ubicacion_codigo: 'UBI-LIM-01',
    responsable_id: 5,
    responsable_dni: '45678901',
    responsable_nombre: 'CARLOS MENDOZA',
    responsable_cargo: 'ANALISTA TI',
    responsable_area: 'TI',
    responsable_sede: 'LIMA',
    asignacion_id: 12,
    fecha_asignacion: new Date('2026-01-15T00:00:00Z'),
  };

  beforeEach(() => {
    repository = {
      findActivoForQr: jest.fn(),
      findActivoByCodigo: jest.fn(),
    } as unknown as jest.Mocked<QrRepository>;

    config = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return mockSecret;
        if (key === 'PUBLIC_APP_URL') return mockAppUrl;
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService<Environment, true>>;

    service = new QrService(repository, config);
  });

  it('debe generar un token opaco y no secuencial mediante HMAC-SHA256', () => {
    const token = service.generateToken(sampleActivo.id_activo, sampleActivo.codigo);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    // El token no debe ser un entero secuencial simple
    expect(token).not.toEqual(String(sampleActivo.id_activo));
    // Debe extraer el ID correcto internamente
    const extractedId = service.extractIdFromToken(token);
    expect(extractedId).toEqual(101);
  });

  it('debe resolver un QR válido y devolver solo metadata segura sin datos sensibles (no IMEI, IP, MAC)', async () => {
    repository.findActivoForQr.mockResolvedValue(sampleActivo);
    const token = service.generateToken(sampleActivo.id_activo, sampleActivo.codigo);

    const result = await service.resolveToken(token);

    expect(result.id).toEqual(101);
    expect(result.codigo).toEqual('ACT-000101');
    expect(result.tipo).toEqual('LAPTOP');
    expect(result.marca).toEqual('LENOVO');
    expect(result.modelo).toEqual('THINKPAD T14');
    expect(result.estado).toEqual('OPERATIVO');
    expect(result.responsableActual).toBeDefined();
    expect(result.responsableActual?.nombreCompleto).toEqual('CARLOS MENDOZA');
    expect(result.navigation.activoUrl).toEqual('/activos/101');
    expect(result.navigation.inventarioUrl).toContain('ACT-000101');

    // Confirmar que NO existen campos sensibles en el resultado
    const resAny = result as unknown as Record<string, unknown>;
    expect(resAny['imei']).toBeUndefined();
    expect(resAny['direccionIp']).toBeUndefined();
    expect(resAny['direccionMac']).toBeUndefined();
    expect(resAny['numeroSerie']).toBeUndefined();
  });

  it('debe rechazar un token alterado o manipulado con BadRequestException', async () => {
    repository.findActivoForQr.mockResolvedValue(sampleActivo);
    // Alterar firma del token
    const tamperedToken = Buffer.from(`101.badhash12345678`).toString('base64url');

    await expect(service.resolveToken(tamperedToken)).rejects.toThrow(BadRequestException);
  });

  it('debe rechazar un token malformado con BadRequestException', async () => {
    await expect(service.resolveToken('token-invalido-sin-punto')).rejects.toThrow(BadRequestException);
    await expect(service.resolveToken('not_base64_???')).rejects.toThrow(BadRequestException);
  });

  it('debe lanzar NotFoundException si el activo no existe', async () => {
    repository.findActivoForQr.mockResolvedValue(null);
    const token = service.generateToken(999, 'ACT-999');

    await expect(service.resolveToken(token)).rejects.toThrow(NotFoundException);
  });

  it('debe generar imagen QR en Base64 DataURL y SVG para el activo', async () => {
    repository.findActivoForQr.mockResolvedValue(sampleActivo);

    const result = await service.generateActivoQr(sampleActivo.id_activo);

    expect(result.token).toBeDefined();
    expect(result.url).toContain(`${mockAppUrl}/qr/${result.token}`);
    expect(result.codigoActivo).toEqual('ACT-000101');
    expect(result.dataUrl).toContain('data:image/png;base64,');
    expect(result.svg).toContain('<svg');
  });
});
