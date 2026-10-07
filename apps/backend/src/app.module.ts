import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { Environment, validateEnvironment } from './config/environment';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { ActivosModule } from './activos/activos.module';
import { AsignacionesModule } from './asignaciones/asignaciones.module';
import { TelefoniaModule } from './telefonia/telefonia.module';
import { MantenimientosModule } from './mantenimientos/mantenimientos.module';
import { InventariosModule } from './inventarios/inventarios.module';
import { QrModule } from './qr/qr.module';
import { AdminModule } from './admin/admin.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { DocumentosModule } from './documentos/documentos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['apps/backend/.env', '.env'], validate: validateEnvironment }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL'),
          redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'], censor: '[REDACTED]' },
          serializers: {
            req: (req: { id: string; method: string; url: string }) => ({ id: req.id, method: req.method, url: req.url?.split('?')[0] }),
            res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
            err: () => ({ message: 'Error de solicitud' }),
          },
        },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    DatabaseModule,
    AuthModule,
    DashboardModule,
    CatalogosModule,
    ActivosModule, AsignacionesModule, TelefoniaModule, MantenimientosModule, InventariosModule,
    QrModule, AdminModule, AuditoriaModule, DocumentosModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

