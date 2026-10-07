# Política y Guía de Hardening de Seguridad (Fase 10)

## 1. Modelo de Autenticación y Autorización

### A. Autenticación Corporativa y Desacoplamiento Local
* La autenticación reside en el ERP institucional (`[DB_GP_Trabajos_TEST].[dbo].[vw_ERP_Usuarios]`).
* Las contraseñas, hashes o binarios (`User_PassBin`) **nunca se almacenan ni se transmiten** hacia la base de datos de Gestión TI.
* Los tokens JWT se firman con HMAC-SHA256 utilizando un secreto criptográfico de al menos 32 caracteres (`JWT_SECRET`), con expiración limitada (8 horas), validación estricta de emisor (`JWT_ISSUER`) y audiencia (`JWT_AUDIENCE`).
* En cada petición protegida, el `JwtAuthGuard` y `PermissionsGuard` verifican que el usuario siga habilitado localmente (`permitir_acceso = 1`, `estado_local = 1`, `user_estado_erp = 0`) y que su rol continúe activo en `dbo.roles`.

### B. Matriz de Control de Acceso Basado en Permisos (RBAC Granular)
Los permisos son granulares y se consultan dinámicamente desde `dbo.vw_usuarios_permisos`:

| Permiso | Módulo | Descripción | Endpoints Backend |
| :--- | :--- | :--- | :--- |
| `ACTIVOS_VER` | ACTIVOS | Consulta de catálogo y QR | `GET /activos`, `GET /activos/:id`, `GET /qr/:token`, `GET /activos/:id/qr` |
| `ACTIVOS_CREAR` | ACTIVOS | Alta de nuevo activo | `POST /activos` |
| `ACTIVOS_EDITAR` | ACTIVOS | Modificación técnica de activo | `PATCH /activos/:id` |
| `ASIGNACIONES_VER` | ASIGNACIONES | Consulta de asignaciones | `GET /asignaciones`, `GET /asignaciones/:id` |
| `ASIGNACIONES_CREAR` | ASIGNACIONES | Entrega de bien a trabajador | `POST /asignaciones` |
| `ASIGNACIONES_DEVOLVER`| ASIGNACIONES | Devolución y retorno a almacén | `POST /asignaciones/:id/devolver` |
| `MANTENIMIENTO_VER` | MANTENIMIENTO | Consulta de órdenes técnicas | `GET /mantenimientos`, `GET /mantenimientos/:id` |
| `MANTENIMIENTO_EDITAR`| MANTENIMIENTO | Registro y cierre de OT | `POST /mantenimientos`, `PATCH /mantenimientos/:id` |
| `INVENTARIO_VER` | INVENTARIO | Consulta de tomas de inventario | `GET /inventarios`, `GET /inventarios/:id` |
| `INVENTARIO_GESTIONAR`| INVENTARIO | Apertura, verificación y cierre | `POST /inventarios`, `POST /inventarios/:id/verificar`, `POST /inventarios/:id/cerrar` |
| `DOCUMENTOS_VER` | DOCUMENTOS | Consulta y descarga de actas PDF | `GET /documentos`, `GET /documentos/:id`, `GET /documentos/:id/descargar` |
| `DOCUMENTOS_GENERAR` | DOCUMENTOS | Emisión de cargos de entrega | `POST /documentos/generar` |
| `USUARIOS_VER` | SEGURIDAD | Consulta de usuarios y roles | `GET /admin/usuarios`, `GET /admin/roles`, `GET /admin/permisos` |
| `USUARIOS_EDITAR` | SEGURIDAD | Modificación de accesos y sync | `PATCH /admin/usuarios/:id`, `POST /admin/usuarios/sincronizar` |
| `AUDITORIA_VER` | AUDITORIA | Consulta de logs de auditoría | `GET /auditoria`, `GET /auditoria/:id` |

---

## 2. Prevención de Vulnerabilidades Web

### A. Prevención de Inyección SQL (SQLi)
* **Parametrización Obligatoria:** Todas las consultas SQL utilizan `mssql.Request.input(...)` con tipos de datos explícitos (`Int`, `VarChar`, `Bit`, `DateTime2`).
* **Whitelisting de Ordenamiento (`ORDER BY`):** Los campos de ordenación provienen de diccionarios inmutables estrictos en el repositorio (ej. `sortMap`). Nunca se concatena la entrada del usuario en cláusulas `ORDER BY`.

### B. Prevención de Mass Assignment
* En `bootstrap.ts`, NestJS configura globalmente:
  ```typescript
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  ```
* Cualquier propiedad adicional no declarada explícitamente en el DTO correspondiente genera un rechazo inmediato (HTTP 400 Bad Request).

### C. Prevención de Referencias Inseguras a Objetos Directos (IDOR)
* Todas las operaciones de modificación (`PATCH`, `POST`) validan en la capa de servicio el estado del registro, la pertenencia a la empresa y los permisos del operador antes de alterar el estado.
* La ruta de administración de accesos (`/admin/usuarios/:id`) bloquea explícitamente la auto-revocación del administrador y la eliminación del último administrador activo.

### D. Prevención de Path Traversal en Archivos y Documentos
* En `documentos.service.ts`, las rutas de archivo se resuelven con `path.resolve` y se comprueba mediante `path.relative` que el archivo objetivo esté estrictamente confinado dentro del directorio configurado (`DOCUMENTOS_STORAGE_PATH`).
* Si la ruta resultante intenta escapar (`../`), la solicitud es rechazada con `HTTP 403 Forbidden`.

---

## 3. Configuración de Red, Transporte y Encabezados

### A. Helmets y Encabezados HTTP
* Fastify registra `@fastify/helmet` con encabezados estándar de la industria (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy`, `Strict-Transport-Security`).

### B. CORS Restrictivo
* La configuración rechaza orígenes comodín (`*`) cuando se usan credenciales.
* En producción, la variable `CORS_ORIGINS` contiene únicamente el dominio institucional explícito (ej. `https://gestionti.grupopeuario.local`).

### C. Rate Limiting (Protección contra DoS y Brute Force)
* Límite general de 120 peticiones por minuto por cliente implementado con `@nestjs/throttler`.
* Límite estricto de 5 intentos por minuto en el endpoint `/api/v1/auth/login`.

### D. Configuración de Trust Proxy (Auditoría de IP Real)
* `FastifyAdapter` se inicializa con `trustProxy: process.env.TRUST_PROXY || '127.0.0.1'`.
* Solo se confía en proxies inversos conocidos (IIS en `127.0.0.1`), garantizando que la dirección IP registrada en la tabla `dbo.auditoria` no sea falsificada mediante encabezados `X-Forwarded-For` arbitrarios.

### E. Swagger en Producción
* La documentación interactiva de Swagger `/api/docs` está deshabilitada automáticamente en ambiente de producción (`SWAGGER_ENABLED=false`).

---

## 4. Auditoría Inmutable

* La tabla `dbo.auditoria` registra: `id_usuario`, `modulo`, `accion`, `tabla_afectada`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `direccion_ip`, `fecha`.
* **Inmutabilidad Garantizada:** El backend no contiene rutas `PUT`, `PATCH` ni `DELETE` sobre la tabla de auditoría.
* **Privacidad de Logs (Pino Redact):** Pino Logger redacta automáticamente encabezados de autorización (`authorization`), cookies de sesión y cualquier dato sensible.

---

## 5. Deuda Técnica de TLS y Bloqueador Detectado

> [!WARNING]
> ### PRODUCTION BLOCKER: SQL Server TLS y Configuración de Certificados
>
> * **Antecedente:** Durante la Fase 1 se identificó que el motor SQL Server del entorno requería `DB_ENCRYPT=false` o `DB_TRUST_SERVER_CERTIFICATE=true` para establecer conexión con el controlador Node.js `mssql`.
> * **Riesgo:** Transmitir tráfico SQL sin cifrado de transporte en redes no confiables puede exponer datos institucionales ante escuchas pasivas.
> * **Recomendación para Producción:**
>   1. Instalar y asociar un certificado TLS válido firmado por la Autoridad Certificadora interna (CA) en la instancia SQL Server mediante *SQL Server Configuration Manager*.
>   2. Configurar en el archivo `.env` de producción:
>      ```dotenv
>      DB_ENCRYPT=true
>      DB_TRUST_SERVER_CERTIFICATE=false
>      ```
>   3. En caso de requerir temporalmente `DB_TRUST_SERVER_CERTIFICATE=true` durante la migración, la red entre el servidor de aplicaciones y la base de datos debe ser un segmento LAN dedicado y aislado.

---

## 6. Reporte de Auditoría de Dependencias (`npm audit`)

Al ejecutar `npm audit` se identificaron 25 avisos de dependencias indirectas (24 moderadas, 1 alta):

* **Alta:** `fastify <= 5.12.4` (requerida por `@nestjs/platform-fastify@11.2.7`).
* **Moderadas:** `js-yaml` (herramientas de prueba Jest/Istanbul) y `sprintf-js` (dependencia interna de `tedious/mssql`).

### Evaluación de Impacto en Runtime
1. **Fastify:** Las vulnerabilidades reportadas afectan rutas con sub-schemas dinámicos y proxies multidominio. En Gestión TI, las rutas son fijas, los DTOs están protegidos por `class-validator` en NestJS (previo a Fastify) y el reverse proxy es local cerrado (`127.0.0.1`).
2. **Jest / Istanbul:** Son dependencias exclusivas de desarrollo y ejecución de pruebas automatizadas; no se incluyen en el artefacto de ejecución en producción.
3. **Plan de Actualización:** Aplicar la actualización mayor a NestJS 12 y Fastify 5.2+ en el ciclo de mantenimiento programado post-lanzamiento, evitando el uso de `npm audit fix --force` que provocaría rupturas de compatibilidad con NestJS v11.
