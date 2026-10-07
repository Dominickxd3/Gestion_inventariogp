import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { QrService, QrResolvedActivo, QrGenerationResult } from './qr.service';

@ApiTags('QR')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get('qr/:token')
  @Permissions('ACTIVOS_VER')
  @ApiOperation({ summary: 'Resolver código QR opaco y retornar metadata mínima no sensible' })
  @ApiResponse({ status: 200, description: 'Activo resuelto exitosamente' })
  @ApiResponse({ status: 400, description: 'Token QR inválido o alterado' })
  @ApiResponse({ status: 404, description: 'Activo no encontrado' })
  async resolve(@Param('token') token: string): Promise<QrResolvedActivo> {
    return this.qrService.resolveToken(token);
  }

  @Get('activos/:id/qr')
  @Permissions('ACTIVOS_VER')
  @ApiOperation({ summary: 'Generar token QR y representación gráfica para un activo' })
  @ApiResponse({ status: 200, description: 'QR generado exitosamente' })
  @ApiResponse({ status: 404, description: 'Activo no encontrado' })
  async generate(@Param('id', ParseIntPipe) id: number): Promise<QrGenerationResult> {
    return this.qrService.generateActivoQr(id);
  }
}
