import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { Environment } from '../config/environment';
import { QrRepository } from './qr.repository';

export interface QrResolvedActivo {
  id: number;
  codigo: string;
  tipo: string;
  tipoCodigo: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  estado: string;
  estadoCodigo: string;
  ubicacion: string | null;
  ubicacionCodigo: string | null;
  responsableActual: {
    id: number;
    dni: string | null;
    nombreCompleto: string;
    cargo: string | null;
    area: string | null;
    sede: string | null;
    asignacionId: number;
    fechaAsignacion: Date | null;
  } | null;
  navigation: {
    activoUrl: string;
    asignacionesUrl: string;
    mantenimientoUrl: string;
    inventarioUrl: string;
  };
}

export interface QrGenerationResult {
  token: string;
  url: string;
  codigoActivo: string;
  dataUrl: string;
  svg: string;
  activo: {
    id: number;
    codigo: string;
    tipo: string;
    marca: string | null;
    modelo: string | null;
    estado: string;
  };
}

@Injectable()
export class QrService {
  private readonly secret: string;
  private readonly appUrl: string;

  constructor(
    private readonly qrRepository: QrRepository,
    private readonly config: ConfigService<Environment, true>,
  ) {
    this.secret = this.config.get('JWT_SECRET');
    this.appUrl = this.config.get('PUBLIC_APP_URL').replace(/\/+$/, '');
  }

  generateToken(idActivo: number, codigo: string): string {
    const hmac = crypto
      .createHmac('sha256', this.secret)
      .update(`${idActivo}:${codigo}`)
      .digest('hex')
      .substring(0, 16);
    return Buffer.from(`${idActivo}.${hmac}`).toString('base64url');
  }

  extractIdFromToken(token: string): number | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const parts = decoded.split('.');
      if (parts.length !== 2) return null;
      const id = parseInt(parts[0], 10);
      if (isNaN(id) || id <= 0) return null;
      return id;
    } catch {
      return null;
    }
  }

  async resolveToken(token: string): Promise<QrResolvedActivo> {
    const idActivo = this.extractIdFromToken(token);
    if (!idActivo) {
      throw new BadRequestException('Formato de token QR inválido');
    }

    const row = await this.qrRepository.findActivoForQr(idActivo);
    if (!row) {
      throw new NotFoundException('Activo no encontrado');
    }

    // Verificar firma criptográfica del token
    const expectedToken = this.generateToken(row.id_activo, row.codigo);
    if (token !== expectedToken) {
      throw new BadRequestException('Firma de token QR inválida');
    }

    return {
      id: row.id_activo,
      codigo: row.codigo,
      tipo: row.tipo_nombre,
      tipoCodigo: row.tipo_codigo,
      marca: row.marca,
      modelo: row.modelo,
      color: row.color,
      estado: row.estado_nombre,
      estadoCodigo: row.estado_codigo,
      ubicacion: row.ubicacion_nombre,
      ubicacionCodigo: row.ubicacion_codigo,
      responsableActual: row.responsable_id
        ? {
            id: row.responsable_id,
            dni: row.responsable_dni,
            nombreCompleto: row.responsable_nombre ?? '',
            cargo: row.responsable_cargo,
            area: row.responsable_area,
            sede: row.responsable_sede,
            asignacionId: row.asignacion_id!,
            fechaAsignacion: row.fecha_asignacion,
          }
        : null,
      navigation: {
        activoUrl: `/activos/${row.id_activo}`,
        asignacionesUrl: `/asignaciones?idActivo=${row.id_activo}`,
        mantenimientoUrl: `/mantenimientos?idActivo=${row.id_activo}`,
        inventarioUrl: `/inventarios?search=${encodeURIComponent(row.codigo)}`,
      },
    };
  }

  async generateActivoQr(idActivo: number): Promise<QrGenerationResult> {
    const row = await this.qrRepository.findActivoForQr(idActivo);
    if (!row) {
      throw new NotFoundException('Activo no encontrado');
    }

    const token = this.generateToken(row.id_activo, row.codigo);
    const targetUrl = `${this.appUrl}/qr/${token}`;

    const [dataUrl, svg] = await Promise.all([
      QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
        color: { dark: '#000000', light: '#ffffff' },
      }),
      QRCode.toString(targetUrl, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
      }),
    ]);

    return {
      token,
      url: targetUrl,
      codigoActivo: row.codigo,
      dataUrl,
      svg,
      activo: {
        id: row.id_activo,
        codigo: row.codigo,
        tipo: row.tipo_nombre,
        marca: row.marca,
        modelo: row.modelo,
        estado: row.estado_nombre,
      },
    };
  }
}
