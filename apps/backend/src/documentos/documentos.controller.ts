import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { AuthUser } from '../auth/auth.types';
import { DocumentosService } from './documentos.service';
import { QueryDocumentosDto } from './dto/query-documentos.dto';
import { GenerarDocumentoDto } from './dto/generar-documento.dto';

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get()
  @Permissions('DOCUMENTOS_VER')
  @ApiOperation({ summary: 'Listar documentos operativos con filtros y paginación' })
  async list(@Query() query: QueryDocumentosDto) {
    return this.documentosService.list(query);
  }

  @Get(':id')
  @Permissions('DOCUMENTOS_VER')
  @ApiOperation({ summary: 'Obtener metadata de un documento operativo por ID' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.documentosService.getById(id);
  }

  @Get(':id/descargar')
  @Permissions('DOCUMENTOS_VER')
  @ApiOperation({ summary: 'Descargar archivo PDF del documento de forma segura' })
  async descargar(
    @Param('id', ParseIntPipe) id: number,
    @Res() reply: FastifyReply,
  ) {
    const { filePath, fileName, mimeType } = await this.documentosService.getArchivoDescarga(id);
    const stream = fs.createReadStream(filePath);
    reply.header('Content-Type', mimeType);
    reply.header('Content-Disposition', `attachment; filename="${fileName}"`);
    return reply.send(stream);
  }

  @Post('generar')
  @Permissions('DOCUMENTOS_GENERAR')
  @ApiOperation({ summary: 'Generar acta de entrega o constancia de devolución en PDF' })
  async generar(
    @Body() dto: GenerarDocumentoDto,
    @Req() req: FastifyRequest & { user: AuthUser },
  ) {
    return this.documentosService.generar(dto, req.user.id, req.ip, req.user.name);
  }
}
