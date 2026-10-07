import 'reflect-metadata';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DatabaseService } from '../src/database/database.service';
import { createApplication } from '../src/bootstrap';

describe('Infraestructura HTTP', () => {
  let app: NestFastifyApplication;
  const previous = { ...process.env };
  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: 'production', DB_SERVER: 'localhost', DB_USER: 'test', DB_PASSWORD: 'test',
      CORS_ORIGINS: 'http://localhost:5173', LOG_LEVEL: 'silent', SWAGGER_ENABLED: 'false',
    });
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => { await app.close(); process.env = previous; });
  it('expone liveness con cabeceras de seguridad', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
  it('no expone Swagger en producción por defecto', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/docs' })).statusCode).toBe(404);
  });
  it('autoriza solamente el origen CORS configurado', async () => {
    const allowed = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'http://localhost:5173' } });
    const denied = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'https://other.example' } });
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('devuelve 503 sin revelar detalles de SQL cuando falla readiness', async () => {
    jest.spyOn(app.get(DatabaseService), 'isReady').mockResolvedValue(false);
    const response = await app.inject({ method: 'GET', url: '/api/v1/health/ready' });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ statusCode: 503, message: 'Error interno del servidor' });
    expect(response.body).not.toContain('stack');
  });
  it('devuelve readiness cuando SQL responde', async () => {
    jest.spyOn(app.get(DatabaseService), 'isReady').mockResolvedValue(true);
    expect((await app.inject({ method: 'GET', url: '/api/v1/health/ready' })).statusCode).toBe(200);
  });
  it('limita requests repetidos', async () => {
    let status = 200;
    for (let index = 0; index < 121; index++) {
      status = (await app.inject({ method: 'GET', url: '/api/v1/health', remoteAddress: '192.0.2.55' })).statusCode;
    }
    expect(status).toBe(429);
  });
});

