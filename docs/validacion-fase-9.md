# Validación de Fase 9

Verificado el 7 de octubre de 2026 (America/Lima).

## Alcance

Se implementaron exclusivamente los dos módulos definidos para la **Fase 9** del sistema "Gestión TI" de Grupo Pecuario:
1. **Mantenimiento de Activos** (control de intervenciones preventivas y correctivas).
2. **Inventario Físico** (campañas de constatación física, snapshot de activos esperados y contrastación de diferencias).

Ambos módulos se integraron sobre el monolito modular existente, sin ORM, sin migraciones automáticas y respetando con exactitud el esquema de base de datos de SQL Server (`DB_GP_GestionTI`).

La funcionalidad de QR **no** fue implementada como módulo dependiente en esta fase, sino que la lógica de verificación física fue desacoplada en el backend para permitir su reutilización directa cuando se implemente el módulo transversal de QR.

---

## Permisos Existentes Utilizados

No se crearon permisos nuevos; se utilizaron estrictamente los permisos ya existentes en `dbo.permisos`:

| Permiso | Descripción | Ámbito de uso |
| --- | --- | --- |
| `MANTENIMIENTO_VER` | Ver mantenimientos | Listar intervenciones, ver detalle técnico e historial de mantenimientos por activo en `/activos/:id`. |
| `MANTENIMIENTO_EDITAR` | Gestionar mantenimientos | Registrar intervenciones, editar datos de servicio y ejecutar la finalización formal de la intervención. |
| `INVENTARIO_VER` | Ver inventarios | Listar campañas de inventario, consultar avance/resumen KPI y ver el detalle paginado de activos constatados. |
| `INVENTARIO_GESTIONAR` | Gestionar inventarios físicos | Apertura de campaña (generación de snapshot), registro de verificación física y cierre de inventario. |

---

## Tablas y Restricciones de Base de Datos

### 1. `dbo.mantenimientos`
- `id_mantenimiento` (int, IDENTITY, PK)
- `id_activo` (int, FK a `dbo.activos`)
- `tipo` (varchar(30), CHECK `tipo IN ('CORRECTIVO', 'PREVENTIVO')`)
- `fecha_programada` (date, null)
- `fecha_inicio` (datetime2, null)
- `fecha_fin` (datetime2, null)
- `problema_reportado` (varchar(1500), null)
- `diagnostico` (varchar(1500), null)
- `trabajo_realizado` (varchar(2500), null)
- `costo` (decimal(12,2), null)
- `proveedor` (varchar(200), null)
- `estado` (varchar(30), CHECK `estado IN ('PENDIENTE', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO')`)
- `proximo_mantenimiento` (date, null)
- `observaciones` (varchar(1500), null)
- `usuario_registro` (int, FK a `dbo.usuarios_sistema`)

### 2. `dbo.inventarios`
- `id_inventario` (int, IDENTITY, PK)
- `nombre` (varchar(200), NOT NULL)
- `id_sede` (int, FK a `dbo.sedes`, NULL para campañas globales)
- `fecha_inicio` (datetime2, NOT NULL, DEFAULT `SYSDATETIME()`)
- `fecha_fin` (datetime2, null)
- `estado` (varchar(30), CHECK `estado IN ('ABIERTO', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO')`)
- `observaciones` (varchar(1500), null)
- `usuario_registro` (int, FK a `dbo.usuarios_sistema`)

### 3. `dbo.inventario_detalle`
- `id_inventario_detalle` (int, IDENTITY, PK)
- `id_inventario` (int, FK a `dbo.inventarios`)
- `id_activo` (int, FK a `dbo.activos`)
- `id_ubicacion_esperada` (int, FK a `dbo.ubicaciones`, null)
- `id_ubicacion_encontrada` (int, FK a `dbo.ubicaciones`, null)
- `estado_verificacion` (varchar(30), CHECK `estado_verificacion IN ('PENDIENTE', 'ENCONTRADO', 'NO_ENCONTRADO', 'CAMBIO_UBICACION', 'OBSERVADO')`)
- `fecha_verificacion` (datetime2, null)
- `usuario_verificacion` (int, FK a `dbo.usuarios_sistema`)
- `observaciones` (varchar(700), null)
- Restricción de unicidad: `UQ_inventario_activo (id_inventario, id_activo)`.

---

## Endpoints del Backend

### Módulo de Mantenimientos (`/api/v1/mantenimientos`)

| Método y Ruta | Permiso | Descripción |
| --- | --- | --- |
| `GET /api/v1/mantenimientos` | `MANTENIMIENTO_VER` | Listado paginado con filtros combinados (search, estado, tipo, idActivo, idSede, fechas) y ordenamiento seguro por whitelist. |
| `GET /api/v1/mantenimientos/:id` | `MANTENIMIENTO_VER` | Detalle completo de la intervención, activo intervenido, responsable actual, usuario de registro y diagnóstico. |
| `GET /api/v1/activos/:id/mantenimientos` | `MANTENIMIENTO_VER` | Historial cronológico de mantenimientos de un activo particular (integrado en `/activos/:id`). |
| `POST /api/v1/mantenimientos` | `MANTENIMIENTO_EDITAR` | Registro transaccional de mantenimiento. Si se solicita y el activo está `DISPONIBLE`, pasa a `MANTENIMIENTO`; si está `ASIGNADO`, se preserva la asignación activa sin romperla. Registra movimiento en `dbo.movimientos_activo` y audita `MANTENIMIENTO_CREAR`. |
| `PATCH /api/v1/mantenimientos/:id` | `MANTENIMIENTO_EDITAR` | Edición controlada de costos, proveedor, observaciones o fechas. Bloqueado si el mantenimiento está `FINALIZADO` o `CANCELADO` (HTTP 409). Audita `MANTENIMIENTO_EDITAR`. |
| `POST /api/v1/mantenimientos/:id/finalizar` | `MANTENIMIENTO_EDITAR` | Operación explícita de cierre. Registra fecha final, trabajo realizado y costo. Restaura el estado coherente del activo: `ASIGNADO` si tiene asignación vigente (`activo = 1`), o `DISPONIBLE` si no. Registra `MANTENIMIENTO_FIN` en `dbo.movimientos_activo` y audita `MANTENIMIENTO_FINALIZAR`. |

### Módulo de Inventarios Físicos (`/api/v1/inventarios`)

| Método y Ruta | Permiso | Descripción |
| --- | --- | --- |
| `GET /api/v1/inventarios` | `INVENTARIO_VER` | Listado paginado de campañas con cálculo en base de datos de avance físico (`% progreso`), esperados, verificados y pendientes. |
| `GET /api/v1/inventarios/:id` | `INVENTARIO_VER` | Cabecera del inventario con métricas consolidadas (encontrados, cambio de ubicación, no encontrados, observados). |
| `GET /api/v1/inventarios/:id/resumen` | `INVENTARIO_VER` | Resumen estadístico de la campaña para paneles de control y auditoría. |
| `GET /api/v1/inventarios/:id/detalle` | `INVENTARIO_VER` | Detalle paginado de activos contrastados con filtros por `estadoVerificacion`, `search`, tipo y área. |
| `POST /api/v1/inventarios` | `INVENTARIO_GESTIONAR` | Apertura de campaña. Inserta cabecera y genera transaccionalmente el snapshot de activos en `dbo.inventario_detalle` según sede o alcance global con estado `PENDIENTE`. Audita `INVENTARIO_CREAR`. |
| `POST /api/v1/inventarios/:id/verificar` | `INVENTARIO_GESTIONAR` | Verificación de activo con control de concurrencia (`UPDLOCK, HOLDLOCK`). Si el activo ya fue verificado, responde HTTP 409. Si aparece un activo no esperado en el snapshot, lo incorpora con advertencia. Si la ubicación encontrada difiere de la esperada, asigna `CAMBIO_UBICACION`. Audita `INVENTARIO_VERIFICAR_ACTIVO`. |
| `POST /api/v1/inventarios/:id/cerrar` | `INVENTARIO_GESTIONAR` | Cierre formal de la campaña. Si existen activos pendientes de verificación, exige confirmación explícita y motivo justificado (HTTP 400 sin confirmación). Un inventario cerrado bloquea verificaciones posteriores (HTTP 409). Audita `INVENTARIO_CERRAR`. |

---

## Reglas de Negocio Implementadas

1. **Coexistencia y Trazabilidad del Activo en Mantenimiento:**
   - Si un activo ingresa a mantenimiento y está en estado `DISPONIBLE`, su estado pasa a `MANTENIMIENTO`.
   - Si un activo está `ASIGNADO` a un colaborador, **no se rompe** la asignación física en `dbo.asignaciones_activo`. La coexistencia queda documentada en el historial de intervenciones.
   - Al finalizar la intervención, el sistema consulta si el activo tiene asignación activa (`activo = 1`). Si es así, su estado vuelve a `ASIGNADO`; de lo contrario, regresa a `DISPONIBLE`.

2. **Snapshot Inmutable de Inventario:**
   - La campaña fija una fotografía histórica de los activos y sus ubicaciones al momento de la apertura (`id_ubicacion_esperada`).
   - La contrastación física registra `id_ubicacion_encontrada` sin modificar el maestro de activos de forma automática, preservando la evidencia de auditoría patrimonial.

3. **Prevención de Doble Verificación Concurrente:**
   - El endpoint de verificación aplica bloqueo transaccional (`UPDLOCK, HOLDLOCK`) tanto en la cabecera como en la fila de detalle.
   - Si dos auditores intentan verificar simultáneamente el mismo activo, el segundo intento recibe `409 Conflict: El activo ya fue verificado previamente en esta campaña`.

4. **Preparación Transversal para QR:**
   - El servicio `InventariosService.verificarActivo` recibe directamente los parámetros de identificación del activo y ubicación, desacoplado de la interfaz de usuario.
   - En una fase futura, el lector QR resolverá el activo escaneado y llamará a este mismo servicio sin duplicación de lógica ni dependencias circulares.

5. **Auditoría Transaccional:**
   - Todos los eventos de escritura se registran en `dbo.auditoria`:
     - `MANTENIMIENTO_CREAR`
     - `MANTENIMIENTO_EDITAR`
     - `MANTENIMIENTO_FINALIZAR`
     - `INVENTARIO_CREAR`
     - `INVENTARIO_VERIFICAR_ACTIVO`
     - `INVENTARIO_CERRAR`

---

## Frontend Implementado

### Rutas Lazy Registradas (`apps/frontend/src/app/App.tsx`)

| Ruta | Permiso Requerido | Componente |
| --- | --- | --- |
| `/mantenimientos` | `MANTENIMIENTO_VER` | `MantenimientosPage` |
| `/mantenimientos/nuevo` | `MANTENIMIENTO_EDITAR` | `MantenimientoFormPage` |
| `/mantenimientos/:id` | `MANTENIMIENTO_VER` | `MantenimientoDetailPage` |
| `/mantenimientos/:id/editar` | `MANTENIMIENTO_EDITAR` | `MantenimientoFormPage` |
| `/inventarios` | `INVENTARIO_VER` | `InventariosPage` |
| `/inventarios/nuevo` | `INVENTARIO_GESTIONAR` | `NuevoInventarioPage` |
| `/inventarios/:id` | `INVENTARIO_VER` | `InventarioDetailPage` |

### Integración en Vistas Existentes
- En `ActivoDetailPage.tsx` se incorporó la sección **Historial de mantenimientos**, que lista todas las intervenciones del activo y permite navegar directamente a `/mantenimientos/:id`.

---

## Resultados de Pruebas y Compilación

### Backend (`@gp/backend`)
- **Compilación TypeScript**: `tsc -p tsconfig.build.json` ejecutado sin errores (código 0).
- **Pruebas Unitarias (Jest)**: 13 suites pasadas, 137 pruebas totales aprobadas (100%).
  - `test/mantenimientos.service.spec.ts` (14 pruebas).
  - `test/inventarios.service.spec.ts` (13 pruebas).
  - Pruebas existentes de Fases 1 a 8 intactas y pasando.

### Frontend (`@gp/frontend`)
- **Compilación y Empaquetado**: `tsc -b && vite build` completado en 8.50s (código 0). Chunks optimizados < 500 kB.
- **Pruebas de Componentes (Vitest)**: 8 suites pasadas, 41 pruebas totales aprobadas (100%).
  - `src/test/mantenimientos.test.tsx` (5 pruebas).
  - `src/test/inventarios.test.tsx` (5 pruebas).
  - Pruebas existentes de Fases 1 a 8 intactas y pasando.

### Calidad de Código
- **ESLint**: `npx eslint apps` ejecutado con 0 errores y 0 advertencias.
- **Git Diff Check**: `git diff --check` limpio sin conflictos ni caracteres residuales.

---

## Conclusión

La Fase 9 se encuentra **100% implementada y validada**.
El sistema queda a la espera de aprobación para continuar con fases posteriores según la hoja de ruta.
