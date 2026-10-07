# Validación de Fase 1

Verificado el 6 de octubre de 2026 (America/Bogota).

- Build de backend y frontend: correcto.
- ESLint: correcto.
- Jest: 3 suites, 16 pruebas correctas. Configuración, pool compartido y recuperación, health, cabeceras Helmet, CORS, ausencia de Swagger en producción, throttling y errores sin stack.
- Swagger real en desarrollo: /api/docs y /api/docs-json responden HTTP 200.
- Inspección real de SQL Server con sqlcmd: correcta, sin cambios de datos ni esquema.
- Readiness real con mssql: HTTP 200 al probar DB_ENCRYPT=false. Se cerró el pool tras la comprobación.

## Limitaciones pendientes

La conexión mssql cifrada con DB_ENCRYPT=true falla con ESOCKET / unsupported protocol al negociar TLS con 10.10.1.6. Aceptar el certificado no resuelve la incompatibilidad del protocolo. El proyecto mantiene el cifrado habilitado por defecto. Revisar TLS de SQL Server/Windows antes de producción; no se cambió la configuración del servidor. La prueba sin cifrado fue temporal y no se guardaron credenciales.

npm audit registra 25 avisos: 24 moderados y 1 alto, incluyendo dependencias transitivas de Fastify, Jest, js-yaml y tedious/sprintf-js. Las actualizaciones compatibles de Jest redujeron los avisos iniciales. No aplicar npm audit fix --force: propone cambios mayores e incluso una versión antigua de mssql. La revisión de estas dependencias queda pendiente antes del despliegue.

Todavía no se implementaron autenticación, permisos ni módulos de negocio. No publicar esta fase como sistema operativo completo. La interfaz inicial muestra disponibilidad, sin datos empresariales.
