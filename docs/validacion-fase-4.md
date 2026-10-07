# Validación de Fase 4

Verificado el 7 de octubre de 2026 (America/Lima).

## Alcance implementado

Se implementó exclusivamente el dashboard real de Gestión TI. La página `/inicio` consume una única respuesta del backend mediante TanStack Query y no almacena datos del dashboard en Zustand. No se añadieron CRUD, datos simulados, permisos, roles, migraciones ni cambios en SQL Server.

## Endpoint y permiso

`GET /api/v1/dashboard/resumen` requiere JWT y `DASHBOARD_VER` mediante `JwtAuthGuard`, `PermissionsGuard` y `@Permissions('DASHBOARD_VER')`.

Acepta opcionalmente `idSede`, validado como entero positivo y comprobado contra una sede activa. El valor se envía a SQL exclusivamente con `request.input('idSede', Int, valor)`.

## Fuentes SQL

| Información | Fuente |
| --- | --- |
| Total de activos | `dbo.activos` |
| Asignados, disponibles, mantenimiento y observados | `dbo.activos` + `dbo.estados_activo.codigo` |
| Líneas activas | `dbo.lineas_moviles`, estado `ACTIVA` |
| Activos por tipo | `dbo.activos` + `dbo.tipos_activo` |
| Activos por estado | `dbo.estados_activo` + `dbo.activos`, incluyendo estados configurados con cero |
| Líneas sin responsable | `dbo.vw_lineas_sin_responsable` |
| Líneas sin equipo | `dbo.lineas_moviles` sin relación activa en `dbo.linea_equipo_historial` |
| Mantenimientos pendientes | `dbo.mantenimientos`, estados `PENDIENTE` y `EN_PROCESO` |
| Inventarios abiertos | `dbo.inventarios`, estados `ABIERTO` y `EN_PROCESO` |
| Actividad reciente | Últimos 10 de `dbo.movimientos_activo`, con activo, trabajador destino y usuario |

Las fechas de actividad se serializan en ISO. El frontend las presenta con `Intl.DateTimeFormat('es-PE')` y formatea cantidades con `Intl.NumberFormat('es-PE')`.

## Filtro de sede

El filtro se aplica a activos, distribuciones, actividad, mantenimientos relacionados con el activo e inventarios. Las métricas de telefonía permanecen globales porque el esquema no ofrece una relación directa y confiable entre línea y sede. No se añadió selector frontend porque no existe un endpoint real de sedes para poblarlo sin hardcodear datos.

## Frontend

Se crearon componentes separados para cabecera, KPIs, distribuciones por tipo/estado, alertas, actividad, skeleton y estados de error/vacío. Los seis KPI muestran únicamente valores recibidos desde el API. Las alertas no enlazan todavía a módulos placeholder.

Los gráficos usan únicamente `recharts`. Además de la visualización incluyen listas textuales con etiquetas y cantidades, por lo que el color o el gráfico no son la única representación de los datos.

## Code splitting y bundle

`LoginPage`, `AuthenticatedLayout` y `DashboardPage` se cargan con `React.lazy` y `Suspense`. Recharts queda aislado en el chunk del dashboard.

El bundle principal pasó de aproximadamente 526 kB minificado en Fase 3 a 321 kB (99 kB gzip). El dashboard genera un chunk separado de aproximadamente 406 kB (118 kB gzip). Vite ya no muestra el aviso de chunks superiores a 500 kB.

## Archivos principales

- Backend: `src/dashboard/dashboard.module.ts`, controller, service, repository, DTO y tipos.
- Frontend: `src/features/dashboard/api`, `hooks`, `types`, `components` y `pages`.
- Rutas actualizadas en `src/app/App.tsx`.
- Estilos en `src/styles/_dashboard.scss`.
- Pruebas backend en `dashboard.service.spec.ts`, `dashboard.repository.spec.ts` y pruebas HTTP ampliadas.
- Pruebas frontend en `src/test/dashboard.test.tsx` y pruebas del shell adaptadas.

## Estados de interfaz

- Carga: skeletons estables para KPI, gráficos, alertas y actividad.
- Sin datos: valores KPI en cero y mensajes explícitos para distribuciones/actividad vacías.
- Error: panel sobrio con acción `Reintentar`, conectada a `refetch` de TanStack Query.
- Responsive: seis, tres o dos KPI por fila según ancho; paneles analíticos pasan a una columna en tablet/móvil.

## Pruebas y builds

- Backend: 7 suites, 37 pruebas Jest.
- Frontend: 2 archivos, 11 pruebas Vitest.
- Cubierto: 401, 403, 200, métricas, ceros, sede válida/inválida, parametrización, error SQL, loading, KPIs desde API, alertas, actividad, vacíos, error y retry.
- Builds backend/frontend: correctos.
- ESLint: correcto.
- `git diff --check`: correcto.

## Limitaciones

- No existen archivos `.env` locales, por lo que no se ejecutó el endpoint contra la instancia real desde esta máquina. Las consultas son de sólo lectura y fueron validadas por compilación y pruebas con dobles; la comprobación integrada requiere configurar credenciales localmente.
- La captura visual de BoletasGP no estuvo disponible; se conservó el lenguaje visual de Fase 3 sin inventar detalles.
- Permanecen los avisos heredados de auditoría asociados al backend cuando se evalúa el workspace completo; no se aplicaron actualizaciones mayores forzadas.
