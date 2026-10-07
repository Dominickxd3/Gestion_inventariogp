import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { AuthUser } from '../auth/auth.types';
import { AdminService } from './admin.service';
import { QueryUsuariosDto } from './dto/query-usuarios.dto';
import { UpdateUsuarioAccesoDto } from './dto/update-usuario-acceso.dto';

@ApiTags('Administración')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('usuarios')
  @Permissions('USUARIOS_VER')
  @ApiOperation({ summary: 'Listar usuarios con filtros y paginación' })
  async listUsuarios(@Query() query: QueryUsuariosDto) {
    return this.adminService.listUsuarios(query);
  }

  @Get('usuarios/:id')
  @Permissions('USUARIOS_VER')
  @ApiOperation({ summary: 'Obtener detalle de usuario, rol y permisos efectivos' })
  async getUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUsuario(id);
  }

  @Patch('usuarios/:id')
  @Permissions('USUARIOS_EDITAR')
  @ApiOperation({ summary: 'Actualizar acceso, estado local y rol de un usuario' })
  async updateUsuarioAcceso(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioAccesoDto,
    @Req() req: FastifyRequest & { user: AuthUser },
  ) {
    return this.adminService.updateUsuarioAcceso(id, dto, req.user.id, req.ip);
  }

  @Post('usuarios/sincronizar')
  @Permissions('USUARIOS_EDITAR')
  @ApiOperation({ summary: 'Sincronizar identidad y estado de usuarios desde el ERP' })
  async sincronizarErp(@Req() req: FastifyRequest & { user: AuthUser }) {
    return this.adminService.sincronizarErp(req.user.id, req.ip);
  }

  @Get('roles')
  @Permissions('USUARIOS_VER')
  @ApiOperation({ summary: 'Listar catálogo de roles activos' })
  async listRoles() {
    return this.adminService.listRoles();
  }

  @Get('permisos')
  @Permissions('USUARIOS_VER')
  @ApiOperation({ summary: 'Listar catálogo de permisos del sistema' })
  async listPermisos() {
    return this.adminService.listPermisos();
  }
}
