# Validación de Fase 7

Verificado el 7 de octubre de 2026 (America/Lima).

## Alcance

Se implementó el módulo de Telefonía Móvil y Financiamientos de Equipos para "Gestión TI" sin alterar el esquema de base de datos ni romper la modularidad monolítica del sistema.

El alcance incluye:
- Administración de líneas móviles (alta, listado con filtros, detalle y actualización de metadatos).
- Asignación, cambio y liberación de colaboradores responsables de línea con preservación completa de historial.
- Asociación, cambio y desvinculación de equipos celulares asociados a líneas con preservación histórica.
- Consulta de equipos disponibles para asociar a una línea (diferenciando posesión física de asignación a línea).
- Catálogos de operadores móviles y planes móviles centralizados en `CatalogosModule`.
- Administración de financiamientos de equipos (separado de facturación/conciliación mensual, reservada para Fase 8).
- Auditoría transaccional de operaciones en `dbo.auditoria`.
- Detección de inconsistencias/advertencias en tiempo de consulta (línea sin responsable, línea sin equipo, discrepancia entre responsable de línea y tenedor del celular).

---

## Endpoints y Permisos

| Método y Ruta | Permiso | Descripción |
| --- | --- | --- |
| `GET /api/v1/telefonia/lineas` | `LINEAS_VER` | Listado paginado con búsqueda, ordenamiento y filtros (operador, plan, estado, con/sin responsable, con/sin celular). |
| `GET /api/v1/telefonia/lineas/:id` | `LINEAS_VER` | Detalle enriquecido completo en una sola petición (datos de línea, responsable actual, equipo actual, financiamiento activo, advertencias e historial completo). |
| `GET /api/v1/telefonia/equipos-disponibles?search=` | `LINEAS_VER` | Equipos celulares no vinculados a ninguna línea activa. |
| `POST /api/v1/telefonia/lineas` | `LINEAS_EDITAR` | Alta de nueva línea móvil (número único de 9 dígitos, operador, plan, ICCID). |
| `PATCH /api/v1/telefonia/lineas/:id` | `LINEAS_EDITAR` | Actualización de estado, plan, ICCID u observaciones de la línea. |
| `POST /api/v1/telefonia/lineas/:id/responsable` | `LINEAS_EDITAR` | Asigna colaborador responsable vigente a la línea. |
| `POST /api/v1/telefonia/lineas/:id/cambiar-responsable` | `LINEAS_EDITAR` | Cierra la responsabilidad vigente y abre una nueva en una transacción con bloqueo. |
| `POST /api/v1/telefonia/lineas/:id/liberar-responsable` | `LINEAS_EDITAR` | Cierra la asignación del responsable vigente y registra fecha y motivo de fin. |
| `POST /api/v1/telefonia/lineas/:id/equipo` | `LINEAS_EDITAR` | Asocia un celular disponible a la línea. |
| `POST /api/v1/telefonia/lineas/:id/cambiar-equipo` | `LINEAS_EDITAR` | Desvincula el celular previo y asocia uno nuevo atómicamente. |
| `POST /api/v1/telefonia/lineas/:id/retirar-equipo` | `LINEAS_EDITAR` | Desvincula el equipo celular de la línea y lo devuelve a estado disponible para línea. |
| `GET /api/v1/catalogos/operadores-moviles` | JWT | Catálogo de operadores celulares activos. |
| `GET /api/v1/catalogos/planes-moviles?idOperador=` | JWT | Catálogo de planes filtrables por operador. |
| `GET /api/v1/telefonia/financiamientos` | `LINEAS_VER` | Listado paginado de contratos de financiamiento de equipos. |
| `GET /api/v1/telefonia/financiamientos/:id` | `LINEAS_VER` | Detalle de un financiamiento y sus cuotas asociadas. |
| `POST /api/v1/telefonia/financiamientos` | `LINEAS_EDITAR` | Registro de contrato de financiamiento para un equipo celular. |

---

## Arquitectura y Concurrencia

1. **Sub-modularidad en Backend:**
   - La carpeta `apps/backend/src/telefonia` se organizó en sub-módulos limpios:
     - `lineas/`: Repositorio, servicio y controlador de líneas móviles y consulta de equipos disponibles.
     - `relaciones/`: Repositorio y servicio transaccional para cambios de colaborador y cambios de celular.
     - `financiamientos/`: Repositorio, servicio y controlador de contratos de financiamiento.
     - `dto/`: DTOs fuertemente tipados con validación exhaustiva (`class-validator` y `class-transformer`).
   - Se integraron en `TelefoniaModule` e importaron en `AppModule`.

2. **Garantías Transaccionales y Bloqueos:**
   - Para evitar condiciones de carrera, las transacciones que modifican relaciones vigentes (`asignaciones_linea` y `linea_equipo_historial`) utilizan `UPDLOCK, HOLDLOCK`.
   - Se protegen por diseño los índices únicos filtrados existentes en la base de datos (`UX_asignacion_linea_actual` y `UX_linea_equipo_actual`), traduciendo errores 2601/2627 a códigos HTTP 409 legibles.
   - Preservación histórica garantizada: ninguna relación se sobreescribe o destruye físicamente; se actualiza `fecha_fin`, `activo = 0`, `motivo` y se inserta el nuevo registro correspondiente.

3. **Auditoría Centralizada:**
   - Cada operación de alta, edición o cambio de relación genera un registro en `dbo.auditoria` (`LINEA_CREAR`, `LINEA_ACTUALIZAR`, `LINEA_ASIGNAR_RESPONSABLE`, `LINEA_CAMBIAR_RESPONSABLE`, `LINEA_LIBERAR_RESPONSABLE`, `LINEA_ASOCIAR_EQUIPO`, etc.) conteniendo usuario actor (`req.user.id`), IP de origen y snapshots JSON de datos anteriores y posteriores.

---

## Frontend

1. **Rutas y Code-Splitting:**
   - Rutas lazy registradas en `App.tsx`:
     - `/telefonia` (protegida con `LINEAS_VER`)
     - `/telefonia/nueva` (protegida con `LINEAS_EDITAR`)
     - `/telefonia/:id` (protegida con `LINEAS_VER`)
   - Ningún chunk JavaScript supera los 500 kB (el bundle permanece ligero y segmentado por ruta).

2. **Página Principal (`TelefoniaPage`):**
   - Pestañas entre "Líneas Móviles" y "Financiamientos".
   - Tarjetas KPI con contadores de líneas totales, activas, con responsable y con celular.
   - Formulario de filtros avanzados: búsqueda por número o ICCID, operador, plan reactivo según operador seleccionado, estado y filtros booleanos de responsable/equipo.
   - DataTable PrimeReact lazy con paginación, ordenamiento remoto y badges de estado.

3. **Detalle Enriquecido (`LineaDetailPage`):**
   - Consulta completa en un solo request (`GET /telefonia/lineas/:id`).
   - Banner de advertencias de consistencia (sin responsable, sin celular, o responsable discordante con el celular).
   - Bloques claros: Información de línea, Responsable actual, Celular asociado y Financiamiento activo.
   - Diálogos interactivos integrados para Asignar, Cambiar y Liberar Responsable, Asociar, Cambiar y Retirar Equipo, y Editar la Línea.
   - Pestañas de historial cronológico para Colaboradores y Equipos.

4. **TanStack Query e Invalidación de Caché:**
   - La mutación de cualquier relación o metadato invalida reactivamente las queries correspondientes (`lineas`, `linea/:id`, `equipos-disponibles`, `financiamientos`, `activos`, `dashboard`) sin requerir recarga completa de página.

---

## Validación Automatizada

1. **Backend (Jest):**
   - 10/10 suites de prueba superadas (84/84 tests unitarios pasando).
   - Cobertura de autorización, validaciones DTO, códigos de error de dominio (400, 404, 409), bloqueos y propagación de usuario e IP.

2. **Frontend (Vitest):**
   - 5/5 suites de prueba superadas (27/27 tests pasando).
   - Pruebas de renderizado, skeletons de carga, verificación de permisos de edición, detalle enriquecido con advertencias y formularios de creación.

3. **Calidad de Código y Compilación:**
   - `npm run lint` (ESLint): 0 errores, 0 advertencias en todo el monorepo.
   - `tsc` en backend y `vite build` en frontend completados con código de salida 0.
