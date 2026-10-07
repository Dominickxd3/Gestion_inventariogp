# Validación de Fase 6

Verificado el 7 de octubre de 2026 (America/Lima).

## Alcance

Se implementó el módulo de asignaciones y devoluciones de activos sin modificar el esquema de SQL Server. No se implementaron telefonía, facturación, mantenimiento, inventario físico, documentos, usuarios administrativos ni QR.

## Endpoints y permisos

| Método y ruta | Permiso |
| --- | --- |
| `GET /api/v1/asignaciones` | `ASIGNACIONES_VER` |
| `GET /api/v1/asignaciones/:id` | `ASIGNACIONES_VER` |
| `GET /api/v1/activos/:id/asignaciones` | `ASIGNACIONES_VER` |
| `GET /api/v1/asignaciones/activos-disponibles?search=` | `ASIGNACIONES_CREAR` |
| `POST /api/v1/asignaciones` | `ASIGNACIONES_CREAR` |
| `POST /api/v1/asignaciones/:id/devolucion` | `ASIGNACIONES_DEVOLVER` |
| `GET /api/v1/catalogos/trabajadores?search=&idArea=` | JWT |
| `GET /api/v1/catalogos/accesorios?search=` | JWT |

El listado admite `search`, `estado`, `idTrabajador`, `idTipo`, `idSede`, `page`, `pageSize`, `sortBy` y `sortDirection`. La paginación es SQL, usa 20 registros por defecto y limita a 100. Las columnas de ordenamiento se resuelven mediante whitelist.

## DTO y validaciones

La creación recibe activo, trabajador, estado/motivo/observación de entrega y hasta 50 accesorios. La devolución recibe los datos descriptivos de devolución y un resultado `DEVUELTO`, `MALOGRADO` o `PERDIDO` para cada accesorio vinculado. El identificador del usuario nunca se acepta en el body: procede de `req.user.id`.

Antes de asignar se comprueba existencia y estado `DISPONIBLE` del activo, inexistencia de asignación vigente, existencia y estado `ACTIVO` del trabajador, accesorios no repetidos, existentes y disponibles. Dentro de la transacción se repiten las comprobaciones sensibles con `UPDLOCK, HOLDLOCK`. Los conflictos únicos 2601/2627 y los cambios concurrentes se traducen a HTTP 409.

Antes de devolver se recupera la asignación por `id_asignacion`, se verifica que continúa vigente y se obtiene su `id_activo`. El procedimiento recibe ese `id_activo`; nunca se envía `id_asignacion` a `sp_devolver_activo`. Una segunda devolución responde 409 con `La asignación ya fue devuelta.`

## Stored procedures, movimientos e historial

Se utilizan las firmas verificadas:

- `dbo.sp_asignar_activo(@id_activo, @id_trabajador, @estado_entrega, @motivo, @observacion, @id_usuario)`.
- `dbo.sp_devolver_activo(@id_activo, @estado_devolucion, @motivo, @observacion, @id_usuario)`.

Ambos procedimientos actualizan el estado del activo e insertan respectivamente los movimientos `ASIGNACION` y `DEVOLUCION`. El backend no duplica esos movimientos.

Como `sp_asignar_activo` no devuelve el identificador, después de ejecutarlo se consulta exactamente `id_activo = @activo AND activo = 1`. La recuperación es determinista por el índice filtrado único `UX_asignacion_activo_actual`; no se usa `TOP 1` arbitrario. El historial se conserva y nunca se actualiza ni elimina para simular una asignación nueva.

## Accesorios, transacciones y atomicidad

La llamada al SP, el alta/devolución de accesorios y la auditoría se ejecutan en una transacción exterior de `mssql`. SQL Server no crea transacciones físicas independientes para `BEGIN TRANSACTION` anidados: el `COMMIT` interno reduce `@@TRANCOUNT`, mientras el commit físico queda en manos de la transacción exterior. Por ello, un fallo al registrar accesorios revierte también los efectos del SP. Si el SP falla y ejecuta su `ROLLBACK`, el wrapper tolera que la transacción ya esté abortada y propaga el error mapeado.

Los accesorios se bloquean y revalidan dentro de la transacción. Al entregar pasan a `ASIGNADO`. En la devolución:

- `DEVUELTO`: asociación `devuelto = 1`, accesorio `DISPONIBLE`.
- `MALOGRADO`: asociación `devuelto = 1`, accesorio `MALOGRADO`.
- `PERDIDO`: asociación `devuelto = 1`, accesorio `PERDIDO`.

Se interpreta `devuelto` como operación de devolución resuelta/cerrada, no exclusivamente como recepción física. Esto evita que un accesorio perdido quede pendiente indefinidamente; el resultado físico se conserva explícitamente en el estado `PERDIDO` y en `estado_devolucion`. No se elimina ninguna asociación.

## Auditoría

Las operaciones registran un único evento principal en `dbo.auditoria`: `ASIGNACION_CREAR` o `ASIGNACION_DEVOLVER`. El snapshot contiene asignación, activo, trabajador, entrega/devolución y accesorios. Se guarda usuario e IP; no se registra JWT. La auditoría participa en la misma transacción.

## Frontend

Se reemplazó el placeholder con rutas lazy:

- `/asignaciones`
- `/asignaciones/nueva`
- `/asignaciones/:id`
- `/asignaciones/:id/devolver`

El listado usa DataTable con paginación, filtros y ordenamiento remotos. El alta presenta cinco pasos para trabajador, activo, accesorios, entrega y confirmación. Las búsquedas consultan datos reales y no precargan todos los trabajadores. La devolución exige resultado para cada accesorio. Los botones se muestran según permisos y los submits quedan bloqueados durante la mutación.

TanStack Query administra asignaciones, detalle, trabajadores, activos y accesorios disponibles. Crear o devolver invalida asignaciones, activos, activo afectado, historial, dashboard y disponibilidad de accesorios/activos; no se recarga la página. Zustand continúa reservado a la sesión.

El detalle de Activos muestra historial solo con `ASIGNACIONES_VER`; de lo contrario presenta un mensaje de permiso insuficiente.

## Validación

Las pruebas usan dobles y no una base real. Cubren autorización HTTP, validación del query, reglas de activo/trabajador/accesorios, duplicados, conflictos concurrentes, devolución repetida, propagación de usuario/IP, listado, loading, vacío, filtros, permisos, selección guiada, detalle y accesorios.

No existe `.env` local. No se ejecutaron `sp_asignar_activo`, `sp_devolver_activo` ni escrituras reales. Tampoco se crearon datos de demostración.

La validación final ejecuta build backend/frontend, ESLint, Jest, Vitest y `git diff --check`. El bundle permanece dividido por rutas lazy y ningún chunk JavaScript supera 500 kB.

## Limitaciones

- La verificación fue estática y mediante dobles; antes de operar en producción se requiere una prueba read-only con configuración autorizada y una posterior prueba de escritura expresamente aprobada.
- El esquema no posee un índice filtrado que impida por sí solo asignar simultáneamente el mismo accesorio en asignaciones distintas. La implementación mitiga la carrera bloqueando la fila del accesorio y actualizándola condicionalmente dentro de la transacción.
- No se modificaron los SP. La estrategia transaccional depende del comportamiento estándar de transacciones anidadas de SQL Server y de `XACT_ABORT ON` ya presente en ellos.
