# Inspección inicial · 6 de octubre de 2026

La carpeta Gestion_inventariogp estaba vacía, sin frontend, backend, SQL, Git ni AGENTS.md en el proyecto o en los directorios padre revisados. No se reemplazó código existente.

Se inspeccionó SQL Server en 10.10.1.6:1433 mediante consultas de solo lectura. La base DB_GP_GestionTI contiene **32 tablas, 8 vistas y 4 procedimientos**. DB_GP_Trabajos_TEST existe en la misma instancia; se revisaron las definiciones de sp_login_usuario y vw_ERP_Usuarios. No se ejecutaron login, sincronización, asignación ni devolución; estos SP modifican datos. No se consultaron contraseñas, User_PassBin ni registros personales.

El inventario de columnas, tipos, nulabilidad, valores predeterminados y definiciones de objetos está en schema-inspection.txt. Índices únicos, restricciones CHECK y claves foráneas están en schema-constraints.txt. Son evidencias del esquema, no scripts de migración.

## Diferencias y decisiones

| Hallazgo verificado | Adaptación prevista |
| --- | --- |
| roles tiene codigo y nombre; rol_codigo es alias en la vista y el SP | Usar los nombres reales sin renombrar columnas |
| sp_devolver_activo recibe @id_activo, no @id_asignacion | Resolver y validar la asignación vigente desde la API antes de ejecutar el SP |
| sp_asignar_activo recibe @motivo, @observacion, @id_usuario | Mapear los DTO a estos parámetros reales |
| sp_asignar_activo no devuelve el identificador creado y no valida el estado disponible | Validar disponibilidad en el servicio y obtener la asignación en una transacción con bloqueo |
| Hay índices únicos filtrados para activo, línea y relación equipo/línea vigentes | Conservarlos y manejar conflictos concurrentes sin sobrescribir historia |
| vw_conciliacion_lineas une asignaciones con activo=1, no por periodo de factura | Usarla para diagnóstico actual; consultar intervalos históricos para conciliación de periodos anteriores |
| El resultado de conciliación y el estado almacenado del detalle son conceptos distintos | Resultado: CONFORME/SIN_RESPONSABLE/SIN_EQUIPO/LINEA_NO_REGISTRADA. Estado persistido: PENDIENTE/CONFORME/OBSERVADO/CORREGIDO |
| vw_usuarios_permisos filtra acceso local y permiso activo, pero no estado ERP o rol activo | Volver a verificar estado ERP, acceso local y rol en backend en cada sesión protegida |
| sp_validar_acceso_sistema comprueba estado ERP, acceso y rol asignado, sin comprobar roles.estado | Complementar la autorización con rol activo |
| Login corporativo consulta TBL_USUARIOS; sincronización consulta vw_ERP_Usuarios sobre un linked server | Verificar correspondencia de User_Logon y Usuario antes de pruebas de autenticación |
| Sincronización no elimina permisos de usuarios desaparecidos de la vista ERP | Revisar política de bajas antes de automatizarla; mantener sincronización manual confirmada |
| vw_ERP_Usuarios expone User_PassBin | Seleccionar solamente los cuatro campos autorizados; nunca copiar ni devolver ese campo |

La captura de BoletasGP no estaba adjunta. La pantalla inicial sigue el lenguaje visual descrito; el ajuste a la referencia queda pendiente.

## Estructura y secuencia

Monorepo npm, sin ORM, contenedores ni servicios adicionales:

```text
apps/
  backend/
    src/
      app.module.ts
      bootstrap.ts
      config/
      common/filters/
      database/
      health/
    test/
  frontend/
    src/
      app/
      services/
      styles/
docs/
```

El backend crecerá con auth, usuarios, trabajadores, sedes, areas, ubicaciones, activos, asignaciones, accesorios, telefonia, conciliaciones, mantenimientos, incidentes, inventarios, documentos y auditoria. Cada módulo tendrá controller, service, repository, dto y tipos según necesidad.

El frontend crecerá con app/router, app/providers, app/layouts; components/ui, tables, forms, feedback; features por dominio; stores, hooks, types y utils. No se crean módulos vacíos para simular avances.

Fase 1 implementada: workspace, TypeScript strict, NestJS/Fastify, pool mssql reutilizable con recuperación tras fallo de conexión, health/liveness y readiness, Swagger, Pino, Helmet para Fastify, CORS explícito, throttling global, validation pipe y manejo de errores. El frontend contiene únicamente una pantalla de estado; no simula datos ni acceso autenticado.

Fase 2: login corporativo, autorización local, JWT/Passport, guards y permisos. Fase 3: login y layout con navegación por permisos. Después dashboard, activos, asignaciones, telefonía, conciliación, mantenimiento/inventarios y documentos/auditoría, validando cada fase.

## Dependencias

Instaladas en backend: NestJS 11, Fastify mediante adaptador, mssql, Config, Swagger, Pino, Helmet, Throttler, class-validator, class-transformer, reflect-metadata y rxjs. Desarrollo: TypeScript, ESLint y Jest/ts-jest.

Instaladas en frontend: React 18, TypeScript, PrimeReact 10, SCSS/Sass, React Router, Axios, Zustand, TanStack Query y React Hook Form. PrimeReact 10 mantiene la API de componentes descrita en el requerimiento.

Para Fase 2: @nestjs/passport, passport, passport-jwt, @nestjs/jwt y @types/passport-jwt. Se instalarán al implementar el flujo real.

## Variables

apps/backend/.env.example documenta HOST, PORT, NODE_ENV, CORS_ORIGINS, LOG_LEVEL, SWAGGER_ENABLED; DB_SERVER, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE; DB_ENCRYPT, DB_TRUST_SERVER_CERTIFICATE, timeouts y máximo del pool.

Las credenciales entregadas no se guardan. Configurarlas en el entorno del proceso o en .env excluido de Git. Por defecto se exige TLS con certificado verificable; para la instancia interna con certificado no confiable, activar DB_TRUST_SERVER_CERTIFICATE solo en el entorno correspondiente.

Fase 2 agregará JWT_SECRET, JWT_EXPIRES_IN, JWT_ISSUER y JWT_AUDIENCE. No hace falta un segundo pool corporativo porque las bases están en la misma instancia.

Frontend: VITE_API_URL. No debe contener secretos.

## Despliegue posterior

Backend enlazado a 127.0.0.1 por defecto, compatible con reverse proxy IIS. Configurar servicio Windows con reinicio automático, variables, TLS en IIS y rutas /api; servir dist del frontend con fallback a index.html. No se configura un servicio ni se publica en esta fase.

