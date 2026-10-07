import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Environment } from '../config/environment';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { PermissionsGuard } from './permissions.guard';

@Module({
  imports: [PassportModule, JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService<Environment, true>) => ({
    secret: config.get('JWT_SECRET'), signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') as never,
      issuer: config.get('JWT_ISSUER'), audience: config.get('JWT_AUDIENCE') },
  }) })],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService, JwtStrategy, JwtAuthGuard, PermissionsGuard],
  exports: [JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
