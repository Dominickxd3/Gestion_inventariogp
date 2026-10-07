import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { Environment } from './config/environment';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

export async function createApplication(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ bodyLimit: 1048576 }), { bufferLogs: true, abortOnError: false });
  const config = app.get(ConfigService<Environment, true>);
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');
  await app.register(helmet);
  app.enableCors({ origin: config.get('CORS_ORIGINS'), methods: ['GET', 'POST', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new ApiExceptionFilter(await app.resolve(PinoLogger)));
  app.enableShutdownHooks();
  if (config.get('SWAGGER_ENABLED')) {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder()
      .setTitle('Grupo Pecuario · Gestión TI').setDescription('API interna. Fase 1: infraestructura.')
      .setVersion('0.1.0').addBearerAuth().build());
    SwaggerModule.setup('api/docs', app, document);
  }
  return app;
}
