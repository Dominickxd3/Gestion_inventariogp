# Validación de Fase 8

Verificado el 7 de octubre de 2026 (America/Lima).

## Alcance

Se implementó el módulo de **Facturación de Telefonía y Conciliación Histórica Mensual** para el sistema "Gestión TI" de Grupo Pecuario, sin alterar el esquema de base de datos de SQL Server, sin ORM y manteniendo la arquitectura monolítica modular.

El alcance incluye:
- Registro e importación estructurada de facturas mensuales y su detalle de líneas.
- Preservación estricta del snapshot original facturado (número de línea, importes, conceptos recibidos del operador).
- Motor de conciliación histórica mensual basado en intervalos de fechas (`periodo_inicio` y `periodo_fin`), sin depender del estado activo actual (`activo = 1`).
- Detección precisa de anomalías de negocio:
  - Líneas no registradas en el catálogo.
  - Líneas sin responsable asignado en el periodo.
  - Líneas sin equipo celular vinculado en el periodo.
  - Múltiples colaboradores responsables dentro del mismo mes con visualización de sus intervalos.
  - Múltiples equipos celulares asociados dentro del mismo mes con visualización de sus intervalos.
  - Discordancia entre el responsable de la línea y la tenencia física real del equipo en el periodo.
  - Desvíos entre el cargo fijo del plan facturado y el precio pactado en el catálogo.
  - Detección de cargos adicionales, cargos por equipos, prorrateos y descuentos.
- Separación formal entre **Estado Persistido de Gestión** (`PENDIENTE`, `CONFORME`, `OBSERVADO`, `CORREGIDO`) y **Diagnósticos Calculados**.
- Reglas estrictas de cierre de periodo con justificación obligatoria en presencia de observaciones.
- Vinculación explícita con cuotas existentes de financiamiento de equipos (`dbo.financiamientos_cuotas`).
- Auditoría transaccional de cada acción en `dbo.auditoria`.
- Frontend interactivo con KPIs de conciliación, filtros combinados, tabla de líneas facturadas con diagnósticos y modales de corrección y cierre.

---

## Endpoints y Permisos

Se utilizan exclusivamente los permisos existentes en el sistema: `LINEAS_VER` para consultas y `LINEAS_CONCILIAR` para mutaciones y cierres (sin utilizar `LINEAS_EDITAR` para conciliación).

| Método y Ruta | Permiso | Descripción |
| --- | --- | --- |
| `GET /api/v1/telefonia/facturas` | `LINEAS_VER` | Listado paginado de facturas con filtros por operador, estado de conciliación, rango de fechas y búsqueda. |
| `GET /api/v1/telefonia/facturas/:id` | `LINEAS_VER` | Cabecera de factura, resumen estadístico de conciliación, totales calculados y cuotas vinculadas. |
| `GET /api/v1/telefonia/facturas/:id/detalle` | `LINEAS_VER` | Listado paginado de líneas facturadas con filtros por estado de gestión y búsqueda. |
| `GET /api/v1/telefonia/facturas/:id/resumen-conciliacion` | `LINEAS_VER` | Resumen de métricas de conciliación y desglose financiero de diferencias. |
| `POST /api/v1/telefonia/facturas` | `LINEAS_CONCILIAR` | Alta transaccional de factura con cabecera y desglose de líneas facturadas. |
| `POST /api/v1/telefonia/facturas/:id/conciliar` | `LINEAS_CONCILIAR` | Ejecución del motor de conciliación histórica set-based sobre el intervalo del periodo. |
| `PATCH /api/v1/telefonia/facturas/:id/detalle/:idDetalle` | `LINEAS_CONCILIAR` | Corrección u observación de una línea (permite vincular `id_linea` sin tocar el número original facturado). |
| `POST /api/v1/telefonia/facturas/:id/cerrar` | `LINEAS_CONCILIAR` | Cierre formal de la factura. Exige motivo justificado si hay líneas pendientes u observadas. |
| `POST /api/v1/telefonia/facturas/:id/cuotas` | `LINEAS_CONCILIAR` | Vinculación explícita de una cuota de financiamiento existente a la factura. |

---

## Tablas y Restricciones Verificadas

Se utilizaron las definiciones reales de SQL Server:
- **`dbo.facturas_telefonia`**:
  - PK: `id_factura` (identity).
  - FKs: `id_operador` (`operadores_moviles`), `usuario_importacion` y `usuario_cierre` (`usuarios_sistema`).
  - Restricción `CK_factura_periodo`: `periodo_fin >= periodo_inicio`.
  - Restricción `CK_factura_estado`: `'PENDIENTE'`, `'EN_REVISION'`, `'CONCILIADO'`, `'CERRADO'`.
- **`dbo.facturas_telefonia_detalle`**:
  - PK: `id_detalle` (identity).
  - FKs: `id_factura` (`facturas_telefonia`), `id_linea` (`lineas_moviles`, nullable).
  - Clave única `UQ_factura_numero_linea`: `(id_factura, numero_linea)`.
  - Restricción `CK_factura_detalle_estado`: `'PENDIENTE'`, `'CONFORME'`, `'OBSERVADO'`, `'CORREGIDO'`.
- **`dbo.financiamientos_cuotas`**:
  - FK `id_factura` vinculable a `dbo.facturas_telefonia`.
  - Estados permitidos: `'PENDIENTE'`, `'FACTURADA'`, `'PAGADA'`, `'CANCELADA'`.

---

## Algoritmo de Conciliación Histórica

### 1. Resolución por Intervalo de Fechas
Para una factura con `[periodo_inicio, periodo_fin]`, una relación histórica aplica si y solo si:
```sql
fecha_inicio <= @periodo_fin
AND (fecha_fin IS NULL OR fecha_fin >= @periodo_inicio)
```
Se aplica estrictamente tanto a `dbo.asignaciones_linea` como a `dbo.linea_equipo_historial`. Esto asegura que si una línea cambió de titular el día 15 del mes, no se seleccione arbitrariamente uno solo, sino que se capturen ambos periodos.

### 2. Dos Dimensiones Diferenciadas
- **Estado de Gestión Persistido**:
  - `PENDIENTE`: Estado inicial al importar la factura.
  - `CONFORME`: Línea validada automáticamente por el motor sin discrepancias.
  - `OBSERVADO`: Línea con alguna anomalía que requiere revisión de TI.
  - `CORREGIDO`: Línea ajustada manualmente por un operador de TI (se preserva en sucesivas ejecuciones de conciliación).
- **Diagnósticos Calculados**:
  - `CONFORME`: Línea registrada con un responsable y un equipo aplicable en el periodo.
  - `LINEA_NO_REGISTRADA`: Número facturado no existe en `dbo.lineas_moviles`.
  - `SIN_RESPONSABLE`: La línea existe pero no tuvo asignación a trabajador en el mes.
  - `SIN_EQUIPO`: La línea existe pero no tuvo equipo celular asociado en el mes.
  - `MULTIPLES_RESPONSABLES_PERIODO`: Más de un trabajador tuvo la línea en el mes (se devuelven todos los intervalos con fechas).
  - `MULTIPLES_EQUIPOS_PERIODO`: Más de un celular estuvo asociado a la línea en el mes.
  - `RESPONSABLE_INCONSISTENTE`: El responsable asignado a la línea difiere de la posesión física histórica del celular (`dbo.asignaciones_activo`).
  - `MONTO_PLAN_DIFERENTE`: El cargo fijo del plan facturado difiere del precio pactado en `dbo.planes_moviles`.
  - `CARGOS_ADICIONALES`: La línea presenta consumos adicionales no incluidos en el plan.
  - `CARGO_EQUIPO`: Presenta cuotas o cargos por compra de terminal.
  - `PRORRATEO` / `DESCUENTO` / `SALDO_ANTERIOR`: Variaciones explícitas de cobro.

### 3. Preservación del Snapshot Original
Al ejecutar la conciliación o al corregir manualmente:
- El valor `numero_linea` recibido del operador **nunca se sobrescribe**.
- Los importes facturados (`cargo_plan`, `cargos_adicionales`, `monto_total`) permanecen inalterables.
- Si se subsana una línea no registrada, se actualiza `id_linea`, se fija `estado_conciliacion = 'CORREGIDO'` y se agrega la observación explicativa en `observaciones`.

### 4. Reglas de Cierre de Periodo
- Estados de cabecera: `PENDIENTE` → `EN_REVISION` (al conciliar con observaciones) / `CONCILIADO` (al conciliar con 100% conformes o corregidos) → `CERRADO`.
- Una factura con líneas `PENDIENTE` u `OBSERVADO` **no puede cerrarse** sin ingresar obligatoriamente un `motivoCierre` justificado.
- Una vez en estado `CERRADO`:
  - Se bloquea la re-ejecución de conciliación (HTTP 400).
  - Se bloquea la modificación de estados u observaciones de detalle (HTTP 400).
  - Se bloquea la vinculación de cuotas (HTTP 400).

---

## Rendimiento y Escalabilidad (Sin N+1)

El motor de conciliación [conciliacion.repository.ts](file:///d:/Gestion_inventariogp/apps/backend/src/telefonia/facturacion/conciliacion.repository.ts) fue diseñado de forma *set-based*:
1. Pre-vinculación de líneas mediante un único `UPDATE ... FROM JOIN`.
2. Tres consultas en bloque recuperan: (a) todas las líneas facturadas, (b) todos los responsables en el intervalo, (c) todos los equipos en el intervalo, y (d) todas las asignaciones físicas de activos.
3. Evaluación en memoria y actualización masiva por lotes mediante sentencias `CASE ... WHEN`.
4. El proceso escala de manera óptima para facturas corporativas con cientos de líneas sin saturar SQL Server.

---

## Frontend

- **Pestaña Facturación en Telefonía**: Integrada en [TelefoniaPage.tsx](file:///d:/Gestion_inventariogp/apps/frontend/src/features/telefonia/pages/TelefoniaPage.tsx), con KPIs de facturación, filtros por operador y estado, tabla paginada y navegación a detalle.
- **Detalle de Factura y Visor de Conciliación**: [FacturaDetailPage.tsx](file:///d:/Gestion_inventariogp/apps/frontend/src/features/telefonia/pages/FacturaDetailPage.tsx) muestra:
  - KPIs de líneas conformes, observadas, corregidas y montos.
  - Botón "Ejecutar Conciliación" con spinner de carga.
  - Tabla de líneas con desglose de importes, badges de diagnóstico y visualización de múltiples responsables en el periodo con sus fechas de inicio y fin.
  - Modales interactivos para corrección de línea, vinculación de cuotas y cierre de periodo con justificación.
- **Alta de Factura Estructurada**: [NuevaFacturaPage.tsx](file:///d:/Gestion_inventariogp/apps/frontend/src/features/telefonia/pages/NuevaFacturaPage.tsx) permite registrar cabecera y tabla dinámica de líneas con cálculo reactivo del monto total.
- **Rutas Lazy**: En [App.tsx](file:///d:/Gestion_inventariogp/apps/frontend/src/app/App.tsx) bajo permisos `LINEAS_VER` y `LINEAS_CONCILIAR`. Chunks optimizados < 500 kB.

---

## Pruebas y Validación Automatizada

1. **Backend (Jest)**:
   - 11 suites de prueba superadas, **101 tests pasando** en total.
   - [facturacion.service.spec.ts](file:///d:/Gestion_inventariogp/apps/backend/test/facturacion.service.spec.ts) cubre: creación transaccional, duplicidad de factura (409), líneas repetidas (400), detalle paginado, resolución histórica de responsable y equipo, detección de múltiples responsables y equipos en el mes, desvíos de plan, bloqueo de facturas cerradas, cierre justificado y vinculación de cuotas.
2. **Frontend (Vitest)**:
   - 6 suites de prueba superadas, **31 tests pasando** en total.
   - [facturacion.test.tsx](file:///d:/Gestion_inventariogp/apps/frontend/src/test/facturacion.test.tsx) valida navegación de pestañas, renderizado de KPIs, visualización de diagnósticos y múltiples responsables, ejecución de conciliación y validaciones del formulario de alta.
3. **Calidad y Compilación**:
   - `npm run lint` (ESLint): 0 errores en todo el proyecto.
   - Compilación exitosa en backend (`tsc`) y frontend (`vite build`).

---

## Limitaciones

- No se implementó OCR ni scraping automático de portales de operadores (fuera del alcance de Fase 8). La importación se realiza mediante entrada estructurada asegurando la integridad de los datos.
- Las pruebas se ejecutaron mediante dobles y mocks de base de datos; la verificación con datos reales de SQL Server requerirá pruebas de lectura previa en el entorno autorizado.
