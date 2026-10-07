# Validación de Fase 5

Verificado el 7 de octubre de 2026 (America/Lima).

## Alcance

Se implementó exclusivamente el módulo CRUD de activos, sin eliminación física: listado, búsqueda, filtros, ordenamiento, paginación SQL, detalle, creación, edición, datos técnicos de PC/Laptop y Celular, catálogos y auditoría transaccional. No se implementaron asignaciones, devoluciones ni otros módulos operativos.

## Endpoints y permisos

| Endpoint | Permiso |
| --- | --- |
| `GET /api/v1/activos` | `ACTIVOS_VER` |
| `GET /api/v1/activos/:id` | `ACTIVOS_VER` |
| `POST /api/v1/activos` | `ACTIVOS_CREAR` |
| `PATCH /api/v1/activos/:id` | `ACTIVOS_EDITAR` |

Catálogos autenticados de sólo lectura:

- `GET /api/v1/catalogos/tipos-activo`
- `GET /api/v1/catalogos/estados-activo`
- `GET /api/v1/catalogos/sedes`
- `GET /api/v1/catalogos/areas?idSede=`
- `GET /api/v1/catalogos/ubicaciones?idSede=&idArea=`

## Listado

`GET /activos` acepta `search`, `idTipo`, `idEstado`, `idSede`, `idArea`, `page`, `pageSize`, `sortBy` y `sortDirection`. La búsqueda parametrizada cubre código, marca, modelo, serie, IMEI, hostname, IP y MAC. La paginación usa `OFFSET/FETCH` y `COUNT(*) OVER()`; no carga todo en memoria.

El ordenamiento sólo permite el mapa interno: código, marca, modelo, tipo, estado y fecha de creación. Ningún nombre de columna aportado por el cliente se concatena sin whitelist.

## Reglas y DTO

- Tipo, estado y ubicación se validan contra registros reales.
- `ASIGNADO` no puede establecerse sin asignación activa ni retirarse manualmente mientras exista una asignación vigente.
- `BAJA` se rechaza si existe asignación vigente.
- Cambiar entre categorías técnicas se bloquea cuando ya existen especificaciones incompatibles.
- PC y Laptop escriben exclusivamente `dbo.activos_computo`; Celular escribe `dbo.activos_celulares`.
- IP usa validación IPv4/IPv6; MAC acepta `:` o `-`; IMEI acepta 8–20 dígitos para compatibilidad histórica.
- Código e IMEI se validan previamente y también se traducen los errores concurrentes 2601/2627 a HTTP 409.
- No se impuso unicidad a número de serie.

El código se ingresa manualmente. No se inventó generación automática porque no existe `.env` local para inspeccionar registros reales y confirmar un patrón.

## Transacciones y auditoría

La creación/edición, escritura técnica y auditoría se ejecutan dentro de una transacción `mssql`. Cualquier error, incluida auditoría, provoca rollback.

Se registra en `dbo.auditoria`:

- `ACTIVO_CREAR` con estado anterior nulo.
- `ACTIVO_EDITAR` con snapshots JSON anterior y posterior.
- Usuario efectivo, módulo `ACTIVOS`, tabla, identificador e IP de `FastifyRequest.ip`.

No se confía directamente en `X-Forwarded-For`. Al desplegar detrás de IIS deberá configurarse explícitamente el proxy confiable antes de usar cabeceras reenviadas.

## Frontend

- `/activos`: DataTable PrimeReact con paginación y sorting server-side, filtros reales y permisos de acciones.
- `/activos/nuevo`: formulario por secciones con React Hook Form.
- `/activos/:id`: resumen y especificaciones reales.
- `/activos/:id/editar`: edición con catálogos y datos actuales.
- Área depende de sede y ubicación depende de sede/área.
- TanStack Query administra listado, detalle, catálogos y mutaciones; Zustand sigue limitado a sesión.
- Crear/editar invalida `activos`, detalle y `dashboard`, sin recarga completa.
- Los estados usan un mapeo central y texto además de color.

## Archivos

- Backend: `src/activos/`, `src/catalogos/` y soporte transaccional en `DatabaseService`.
- Frontend: `src/features/activos/`, rutas lazy y `_assets.scss`.
- Pruebas: `activos.service.spec.ts`, HTTP/database ampliadas y `assets.test.tsx`.

## Pruebas y validación

Se cubren autorización, listado, query validation, búsqueda/filtros mediante parámetros, reglas de creación general/PC/Laptop/Celular, referencias inválidas, conflictos de código/IMEI, edición, 404, cambios técnicos, ASIGNADO, BAJA, propagación de usuario/IP a auditoría y rollback.

Frontend cubre loading, datos API, vacío, búsqueda, visibilidad de Nuevo/Editar, campos técnicos y llamada real de mutación. No se usan credenciales ni SQL real.

## Bundle

El bundle inicial queda aproximadamente en 327 kB (100 kB gzip), sin warning de 500 kB. Activos se carga por rutas lazy: listado ~233 kB, formulario ~12 kB y detalle ~3 kB, todos minificados.

## Limitaciones

- No hay `.env` local; no se ejecutaron lecturas ni escrituras contra SQL Server.
- No se crearon datos de demostración.
- La consistencia de sede/área/ubicación se garantiza seleccionando ubicación real y validándola activa; los endpoints de catálogo filtran relaciones reales.
- La IP detrás de IIS requiere configuración futura de proxy confiable.
