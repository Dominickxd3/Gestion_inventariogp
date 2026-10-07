import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { AuditoriaService } from './auditoria.service';
import { QueryAuditoriaDto } from './dto/query-auditoria.dto';

@ApiTags('Auditoría')
@ApiBearerAuth()
@Controller('auditoria')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @Permissions('AUDITORIA_VER')
  @ApiOperation({ summary: 'Consultar listado paginado y filtrado de auditoría' })
  async list(@Query() query: QueryAuditoriaDto) {
    return this.auditoriaService.list(query);
  }

  @Get(':id')
  @Permissions('AUDITORIA_VER')
  @ApiOperation({ summary: 'Obtener detalle y snapshots JSON de un registro de auditoría' })
  async getById(@Param('id') id: string) {
    return this.auditoriaService.getById(id);
  }
}
