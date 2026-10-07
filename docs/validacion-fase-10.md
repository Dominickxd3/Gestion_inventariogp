# Validación de Fase 10 — Cierre del Sistema para Preparación Productiva

**Fecha de Validación:** 7 de octubre de 2026 (America/Lima)
**Sistema:** Gestión TI — Grupo Pecuario
**Estado:** Fase 10 IMPLEMENTADA Y VALIDADA AL 100%

---

## 1. Alcance Implementado en Fase 10

### Bloque A — QR Transversal
* **Generación Criptográfica Segura:** Token determinístico opaco HMAC-SHA256 derivado de `id_activo` y `codigo`, sin alterar el esquema de la base de datos y sin exponer IDs secuenciales.
* **Privacidad Estricta:** El código QR no contiene datos personales ni sensibles (sin IMEI, IP, MAC, serie completa, ubicación ni trabajador).
* **Resolución (`GET /api/v1/qr/:token`):** Endpoint protegido (`ACTIVOS_VER`) que verifica la firma HMAC en $O(1)$ y resuelve el activo, estado, ubicación, responsable actual y rutas de navegación.
* **Generación Gráfica (`GET /api/v1/activos/:id/qr`):** Devuelve URL, DataURL PNG Base64 y SVG vectorial.
* **Frontend (`/qr`):** Lector de cámara mediante `html5-qrcode` y entrada manual, con navegación directa a *Ver Ficha*, *Registrar Mantenimiento*, *Verificar en Inventario* y *Ver Asignaciones*.
* **Impresión de Etiquetas:** Modal con diseño industrial listo para rotulado físico mediante `@media print`.

### Bloque B — Administración de Usuarios y Accesos
* **Gestión Local sobre `dbo.usuarios_sistema`:**
  * `GET /api/v1/admin/usuarios` con paginación server-side, búsqueda y filtros por estado ERP, estado local y rol.
  * `GET /api/v1/admin/usuarios/:id` con detalle institucional y lista de permisos efectivos de `dbo.vw_usuarios_permisos`.
  * `PATCH /api/v1/admin/usuarios/:id` limitado estrictamente a `permitir_acceso`, `estado_local`, `id_rol` y observaciones (Mass Assignment protegido).
  * `POST /api/v1/admin/usuarios/sincronizar` para ejecución controlada de `dbo.sp_sincronizar_usuarios_erp`.
* **Protección contra Auto-Bloqueo:** Prohíbe que un administrador revoque su propio acceso, inhabilite su cuenta local, cambie su propio rol de ADMIN o inhabilite al último administrador activo del sistema.
* **Auditoría de Accesos:** Registro inmutable de eventos `USUARIO_ACCESO_EDITAR`, `USUARIO_ROL_EDITAR` y `USUARIOS_SINCRONIZAR`.

### Bloque C — Autenticación ERP Definitiva
* **Mecanismo Corporativo Oficial:** Autenticación de solo lectura contra `[DB_GP_Trabajos_TEST].[dbo].[vw_ERP_Usuarios]` (Linked Server hacia `10.10.1.3 / dbGP_2024_GP.dbo.MAA001020`).
* **Protección de Credenciales:** Prohibición absoluta de clonar contraseñas a la base local; `User_PassBin` se utiliza únicamente en el predicado SQL de comparación.
* **Soporte Dual con Feature Flag:**
  * `AUTH_MODE=ERP` (Producción obligatoria).
  * `AUTH_MODE=LOCAL_TEST` (Solo desarrollo local; aborta el arranque si se intenta en producción).
* **Documentación Completa:** Detallada en `docs/AUTH_ERP.md`.

### Bloque D — Auditoría Consultable
* **Consultas Parametrizadas:** `GET /api/v1/auditoria` con filtros por rango de fechas, módulo, acción, usuario, tabla, registro ID y texto libre.
* **Inmutabilidad:** Sin rutas de edición o borrado en el API.
* **Frontend Legible:** Página `/admin/auditoria` con tabla comparativa de diferencias (diff) entre valores anteriores y nuevos, además de visor de JSON estructurado.

### Bloque E — Documentos Operativos
* **Persistencia en `dbo.documentos`:** Registro oficial de `tipo_documento`, `id_activo`, `id_asignacion`, `id_trabajador`, `nombre_archivo`, `ruta_archivo`, `hash_archivo`, `fecha_documento` y `usuario_registro`.
* **Generación de PDFs con PDFKit:** Emisión de actas oficiales de entrega y constancias de devolución con datos históricos inmutables, accesorios, cláusula legal y casillas para firmas.
* **Almacenamiento y Protección Anti-Path Traversal:** Validación estricta de rutas relativas confinadas dentro de `DOCUMENTOS_STORAGE_PATH` y cálculo de hash SHA-256. Descargas protegidas en `/api/v1/documentos/:id/descargar`.

### Bloques F, G y H — Seguridad, IIS y Operaciones
* **Autorización Granular:** Guards `@Permissions(...)` presentes en todos los módulos de backend.
* **Protección contra IDOR, Mass Assignment y SQLi:** Validación exhaustiva de DTOs y parametrización de consultas.
* **Pino Logger Redact:** Headers sensibles y tokens ocultos en logs.
* **Reverse Proxy IIS & TrustProxy:** Configuración de `trustProxy: '127.0.0.1'` para auditoría de IP fidedigna.
* **Manuales Operativos:** Redactados en `docs/DEPLOYMENT.md`, `docs/SECURITY.md` y `docs/OPERATIONS.md`.

---

## 2. Resultados de Validación Automatizada

### A. Pruebas Unitarias Backend (Jest)
```powershell
npm test --prefix apps/backend
```
* **Suites de Prueba:** 18 pasadas, 18 total (100%).
* **Pruebas Individuales:** 161 pasadas, 161 total (100%).
* **Tiempo de Ejecución:** ~6.5 segundos.
* **Cobertura Fase 10:**
  * `test/qr.service.spec.ts`: Generación token HMAC, resolución, datos no sensibles, rechazo de manipulación y DataURL/SVG.
  * `test/admin.service.spec.ts`: Listado, permisos, auto-bloqueo preventivo de ADMIN, bloqueo de último admin, sync ERP y auditoría.
  * `test/auditoria.service.spec.ts`: Listado paginado, filtros y detalle con snapshots parseados.
  * `test/documentos.service.spec.ts`: Generación PDF, hash SHA-256, validación de asignación vigente y path traversal bloqueado.
  * `test/auth.repository.spec.ts`: Modo ERP y modo LOCAL_TEST.

### B. Pruebas Frontend (Vitest)
```powershell
npm test --prefix apps/frontend
```
* **Suites de Prueba:** 12 pasadas, 12 total (100%).
* **Pruebas Individuales:** 48 pasadas, 48 total (100%).
* **Tiempo de Ejecución:** ~21 segundos.
* **Cobertura Fase 10:**
  * `src/test/admin.test.tsx`: UsuariosPage, roles, permisos y botón sync.
  * `src/test/auditoria.test.tsx`: AuditoriaPage, tabla y filtrado.
  * `src/test/qr.test.tsx`: QrScanPage, ingreso manual, acciones transversales y QrModal para rotulado.
  * `src/test/documentos.test.tsx`: DocumentosPage, tabla y descarga de actas.

### C. Compilación de Producción (Builds)
* **Backend:** `npm run build --prefix apps/backend` -> `tsc -p tsconfig.build.json` exitoso sin errores (Código 0).
* **Frontend:** `npm run build --prefix apps/frontend` -> `tsc -b && vite build` exitoso sin errores (Código 0). Todos los chunks JavaScript son menores a 400 kB (límite < 500 kB cumplido).

### D. Linters y Formato
* **ESLint:** `npx eslint apps` completado sin errores ni warnings (Código 0).
* **Git Whitespace:** `git diff --check` completado limpiamente (Código 0).

---

## 3. Bloqueadores de Producción Identificados (`PRODUCTION BLOCKERS`)

Conforme a la regla 83, se registran formalmente los siguientes bloqueadores de infraestructura antes del pase a producción definitiva:

1. **[PRODUCTION BLOCKER] Validación de Enlace de Red con Linked Server 10.10.1.3**
   * **Detalle:** El servidor `10.10.1.3` (que contiene `dbGP_2024_GP.dbo.MAA001020`) debe ser accesible en el puerto 1433 desde la máquina de SQL Server en producción, y el objeto linked server debe tener las credenciales corporativas validadas.
2. **[PRODUCTION BLOCKER] Instalación de Certificado TLS en SQL Server**
   * **Detalle:** La instancia SQL Server corporativa debe contar con un certificado de servidor válido para permitir `DB_ENCRYPT=true` y `DB_TRUST_SERVER_CERTIFICATE=false` en el `.env` de producción, mitigando cualquier riesgo de interceptación en la LAN.

---

## 4. Estado de Archivos y Cierre

* Todas las tareas de la Fase 10 han concluido satisfactoriamente.
* Se preservaron intactas las Fases 1 a 9.
* No se modificó el esquema de SQL Server.
* No se versionaron contraseñas ni secretos reales.
