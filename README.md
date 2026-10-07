# Gestión TI · Grupo Pecuario

Base técnica de un sistema interno sobre **DB_GP_GestionTI existente**. Fase 1 implementada; autenticación y módulos de negocio pendientes.

Lee [la inspección y arquitectura](docs/inspeccion-y-arquitectura.md) antes de extender el proyecto.

## Ejecutar

Node.js 22 o superior; npm workspaces.

```powershell
npm ci
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env
```

Completa DB_USER y DB_PASSWORD en el archivo local o mediante variables de entorno. Ajusta la confianza del certificado según la configuración de SQL Server. No se proporcionan credenciales por defecto ni se recrea el esquema.

En terminales separadas:

```powershell
npm run dev:backend
npm run dev:frontend
```

Frontend: http://localhost:5173. API: http://localhost:3000/api/v1.
Liveness: GET /api/v1/health. Readiness SQL: GET /api/v1/health/ready (503 cuando no hay conexión).
Swagger: http://localhost:3000/api/docs, habilitado en desarrollo y deshabilitado en producción por defecto.

El pool se conecta al primer acceso SQL; la API puede iniciar durante una caída de SQL y readiness comunica la indisponibilidad. Los repositorios deberán usar request.input(...) para todos los valores aportados por el usuario.

## Verificación

```powershell
npm run build
npm run lint
npm test
```

Las pruebas automatizadas usan dobles de SQL y no modifican la base corporativa. Los endpoints de esta fase no entregan datos empresariales.

## Referencias técnicas

- [NestJS con Fastify](https://docs.nestjs.com/techniques/performance)
- [Helmet y seguridad](https://docs.nestjs.com/security/helmet)
- [mssql y connection pools](https://tediousjs.github.io/node-mssql/)

