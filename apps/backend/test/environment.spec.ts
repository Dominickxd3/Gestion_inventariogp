import { validateEnvironment } from '../src/config/environment';
const valid = { DB_SERVER: 'localhost', DB_USER: 'test', DB_PASSWORD: 'secret', CORS_ORIGINS: 'http://localhost:5173', JWT_SECRET: 'test-only-secret-with-at-least-32-characters' };
describe('Configuración', () => {
  it('requiere contraseña sin exponer su contenido', () => {
    expect(() => validateEnvironment({ ...valid, DB_PASSWORD: '' })).toThrow('DB_PASSWORD');
  });
  it.each(['*', 'http://localhost:5173/path', 'null'])('rechaza origen CORS %s', CORS_ORIGINS => {
    expect(() => validateEnvironment({ ...valid, CORS_ORIGINS })).toThrow();
  });
  it('deshabilita Swagger por defecto en producción', () => {
    expect(validateEnvironment({ ...valid, NODE_ENV: 'production' }).SWAGGER_ENABLED).toBe(false);
  });
  it('rechaza otra base y puertos fuera de rango', () => {
    expect(() => validateEnvironment({ ...valid, DB_DATABASE: 'otra' })).toThrow();
    expect(() => validateEnvironment({ ...valid, DB_PORT: '65536' })).toThrow();
  });
  it('no convierte silenciosamente un booleano inválido', () => {
    expect(() => validateEnvironment({ ...valid, DB_ENCRYPT: 'yes' })).toThrow();
  });
});

