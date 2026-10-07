import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { AuthRepository } from './auth.repository';
import { AuthUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthRepository, private readonly jwt: JwtService, private readonly logger: PinoLogger) {}

  async login(username: string, password: string): Promise<{ accessToken: string; user: AuthUser }> {
    const normalizedUsername = username.trim();
    const corporate = await this.repository.authenticateCorporate(normalizedUsername, password);
    if (!corporate.Success) {
      this.logger.warn({ username: normalizedUsername }, 'login rejected');
      throw new UnauthorizedException('Usuario o contraseÃ±a incorrectos');
    }
    const local = await this.repository.authorizeLocal(normalizedUsername);
    if (!local.Success) {
      this.logger.warn({ username: normalizedUsername, reason: 'local_authorization' }, 'login rejected');
      throw new ForbiddenException(local.Message ?? 'Acceso no autorizado');
    }
    if (!local.id_usuario_sistema || !local.id_rol || !local.user_logon || !local.rol_codigo) {
      this.logger.warn({ username: normalizedUsername, reason: 'incomplete_local_access' }, 'login rejected');
      throw new ForbiddenException('La autorizaciÃ³n local estÃ¡ incompleta');
    }
    if (!(await this.repository.isRoleActive(local.id_rol))) {
      this.logger.warn({ username: normalizedUsername, reason: 'disabled_role' }, 'login rejected');
      throw new ForbiddenException('El rol asignado estÃ¡ deshabilitado');
    }
    const user = await this.repository.findEffectiveUser(local.id_usuario_sistema);
    if (!user) throw new ForbiddenException('La autorizaciÃ³n ya no estÃ¡ vigente');
    const payload: JwtPayload = { sub: user.id, username: user.username, nombre: user.name, rol: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    this.logger.info({ userId: user.id, username: user.username }, 'login success');
    return { accessToken, user };
  }

  async getEffectiveUser(userId: number): Promise<AuthUser> {
    const user = await this.repository.findEffectiveUser(userId);
    if (!user) throw new UnauthorizedException('La sesiÃ³n ya no estÃ¡ autorizada');
    return user;
  }
}
