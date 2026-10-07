export interface Environment {
  NODE_ENV: string; HOST: string; PORT: number; CORS_ORIGINS: string[];
  LOG_LEVEL: string; SWAGGER_ENABLED: boolean;
  DB_SERVER: string; DB_PORT: number; DB_USER: string; DB_PASSWORD: string;
  DB_DATABASE: string; DB_ENCRYPT: boolean; DB_TRUST_SERVER_CERTIFICATE: boolean;
  DB_CONNECTION_TIMEOUT_MS: number; DB_REQUEST_TIMEOUT_MS: number; DB_POOL_MAX: number;
}
export function validateEnvironment(raw: Record<string, unknown>): Environment {
  const required = (key: string): string => {
    const value = raw[key];
    if (typeof value !== 'string' || value.trim() === '') throw new Error(`Configuración requerida: ${key}`);
    return value;
  };
  const str = (key: string, fallback: string): string => String(raw[key] ?? fallback);
  const integer = (key: string, fallback: number, max = 2147483647): number => {
    const value = Number(raw[key] ?? fallback);
    if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`Configuración inválida: ${key}`);
    return value;
  };
  const boolean = (key: string, fallback: boolean): boolean => {
    const value = raw[key] ?? String(fallback);
    if (value !== 'true' && value !== 'false') throw new Error(`Configuración inválida: ${key}`);
    return value === 'true';
  };
  const nodeEnv = str('NODE_ENV', 'development');
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('NODE_ENV inválido');
  const origins = required('CORS_ORIGINS').split(',').map(origin => origin.trim());
  for (const origin of origins) {
    let url: URL;
    try { url = new URL(origin); } catch { throw new Error('CORS_ORIGINS inválido'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) throw new Error('CORS_ORIGINS debe contener orígenes explícitos');
  }
  const database = str('DB_DATABASE', 'DB_GP_GestionTI');
  if (database !== 'DB_GP_GestionTI') throw new Error('DB_DATABASE debe ser DB_GP_GestionTI');
  const logLevel = str('LOG_LEVEL', 'info');
  if (!['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'].includes(logLevel)) throw new Error('LOG_LEVEL inválido');
  return {
    NODE_ENV: nodeEnv, HOST: str('HOST', '127.0.0.1'), PORT: integer('PORT', 3000, 65535),
    CORS_ORIGINS: origins, LOG_LEVEL: logLevel, SWAGGER_ENABLED: boolean('SWAGGER_ENABLED', nodeEnv !== 'production'),
    DB_SERVER: required('DB_SERVER'), DB_PORT: integer('DB_PORT', 1433, 65535),
    DB_USER: required('DB_USER'), DB_PASSWORD: required('DB_PASSWORD'), DB_DATABASE: database,
    DB_ENCRYPT: boolean('DB_ENCRYPT', true), DB_TRUST_SERVER_CERTIFICATE: boolean('DB_TRUST_SERVER_CERTIFICATE', false),
    DB_CONNECTION_TIMEOUT_MS: integer('DB_CONNECTION_TIMEOUT_MS', 10000),
    DB_REQUEST_TIMEOUT_MS: integer('DB_REQUEST_TIMEOUT_MS', 15000), DB_POOL_MAX: integer('DB_POOL_MAX', 10, 100),
  };
}

