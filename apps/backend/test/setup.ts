Object.assign(process.env, {
  NODE_ENV: 'production', DB_SERVER: 'localhost', DB_USER: 'test', DB_PASSWORD: 'test',
  CORS_ORIGINS: 'http://localhost:5173', LOG_LEVEL: 'silent', SWAGGER_ENABLED: 'false',
});
