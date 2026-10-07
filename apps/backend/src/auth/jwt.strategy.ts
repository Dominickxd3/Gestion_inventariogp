import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Environment } from '../config/environment';
import { AuthService } from './auth.service';
import { AuthUser, JwtPayload } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<Environment, true>, private readonly auth: AuthService) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'), issuer: config.get('JWT_ISSUER'), audience: config.get('JWT_AUDIENCE') });
  }
  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!Number.isInteger(payload.sub) || !payload.username) throw new UnauthorizedException('Token invÃ¡lido');
    const user = await this.auth.getEffectiveUser(payload.sub);
    if (user.username !== payload.username || user.role !== payload.rol) throw new UnauthorizedException('La sesiÃ³n ya no es vÃ¡lida');
    return user;
  }
}
