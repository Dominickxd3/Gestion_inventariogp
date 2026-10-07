# Graph Report - Gestion_inventariogp  (2026-10-07)

## Corpus Check
- 217 files · ~79,617 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1592 nodes · 3254 edges · 114 communities (80 shown, 27 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 185 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `19c99b08`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- activos.controller.ts
- AuthenticatedLayout.tsx
- app.module.ts
- AuthController
- useTelefonia.ts
- compilerOptions
- InventarioDetailPage.tsx
- dependencies
- DashboardPage.tsx
- CatalogosRepository
- useAsignaciones.ts
- dependencies
- devDependencies
- scripts
- telefonia/types/facturacion.types.ts
- CreateAsignacionDto
- AsignacionesService
- AuthUser
- compilerOptions
- asignaciones.repository.ts
- QueryAsignacionesDto
- tsconfig.build.json
- ResizeObserverMock
- CrearFinanciamientoDto
- lineas.controller.ts
- UpdateLineaDto
- What You Must Do When Invoked
- devDependencies
- LineasRepository
- RelacionesRepository
- App.tsx
- .request
- Inspección inicial · 6 de octubre de 2026
- Validación de Fase 4
- Validación de Fase 5
- Validación de Fase 6
- frontend/package.json
- useAuthStore
- Validación de Fase 3
- backend/package.json
- graphify reference: extra exports and benchmark
- Validación de Fase 2
- AsignacionesRepository
- Permissions
- api
- Validación de Fase 7
- graphify reference: query, path, explain
- AsignacionesController
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- Validación de Fase 1
- AGENTS.md
- class-validator
- @fastify/helmet
- @nestjs/config
- @nestjs/core
- @nestjs/jwt
- @nestjs/passport
- nestjs-pino
- @nestjs/platform-fastify
- @nestjs/throttler
- reflect-metadata
- rxjs
- react-dom
- @testing-library/user-event
- typescript
- @vitejs/plugin-react
- extraction-spec.md
- DatabaseService
- DashboardController
- AsociarCelularDto
- facturacion.controller.ts
- auth.module.ts
- CreateFacturaDto
- Validación de Fase 8
- QueryFacturaDetalleDto
- InventariosService
- QueryLineasDto
- TelefoniaPage.tsx
- QueryFacturasDto
- ConciliacionRepository
- FacturacionRepository
- Validación de Fase 9
- conciliacion.repository.ts
- UpdateDetalleEstadoDto
- inventarios.controller.ts
- CatalogQuery
- FacturacionService
- CerrarFacturaDto
- MantenimientosService
- InventariosRepository
- FinalizarMantenimientoDto
- facturacion.test.tsx
- mantenimientos.repository.ts
- CreateMantenimientoDto
- MantenimientosRepository
- QueryInventariosDto
- CreateInventarioDto
- QueryMantenimientosDto
- UpdateMantenimientoDto
- QueryInventarioDetalleDto
- CerrarInventarioDto
- CambiarResponsableDto
- DashboardModule

## God Nodes (most connected - your core abstractions)
1. `Permissions()` - 56 edges
2. `AuthUser` - 43 edges
3. `useAuthStore` - 41 edges
4. `DatabaseService` - 37 edges
5. `CreateActivoDto` - 22 edges
6. `CreateMantenimientoDto` - 20 edges
7. `ActivosRepository` - 19 edges
8. `QueryAsignacionesDto` - 18 edges
9. `UpdateMantenimientoDto` - 18 edges
10. `CreateFacturaDto` - 18 edges

## Surprising Connections (you probably didn't know these)
- `AuthenticatedLayout()` --calls--> `useAuthStore`  [EXTRACTED]
  apps/frontend/src/app/AuthenticatedLayout.tsx → apps/frontend/src/stores/auth.store.ts
- `LoginPage()` --calls--> `useAuthStore`  [EXTRACTED]
  apps/frontend/src/features/auth/LoginPage.tsx → apps/frontend/src/stores/auth.store.ts
- `DashboardController` --references--> `Permissions()`  [EXTRACTED]
  apps/backend/src/dashboard/dashboard.controller.ts → apps/backend/src/auth/permissions.decorator.ts
- `main()` --calls--> `createApplication()`  [EXTRACTED]
  apps/backend/src/main.ts → apps/backend/src/bootstrap.ts
- `CreateMantenimientoDto` --references--> `EstadoMantenimiento`  [EXTRACTED]
  apps/backend/src/mantenimientos/dto/create-mantenimiento.dto.ts → apps/backend/src/mantenimientos/types/mantenimientos.types.ts

## Import Cycles
- None detected.

## Communities (114 total, 27 thin omitted)

### Community 0 - "activos.controller.ts"
Cohesion: 0.06
Nodes (42): ActivosController, Body, Controller, Get, Param, Patch, Post, Query (+34 more)

### Community 1 - "AuthenticatedLayout.tsx"
Cohesion: 0.11
Nodes (22): AuthenticatedLayout, LoginPage, AuthenticatedLayout(), ValidationState, NavigationItem, navigationItems, NavigationSection, navigationSections (+14 more)

### Community 2 - "app.module.ts"
Cohesion: 0.09
Nodes (24): ActivosModule, Module, AppModule, Module, AsignacionesModule, Module, createApplication(), ApiExceptionFilter (+16 more)

### Community 3 - "AuthController"
Cohesion: 0.11
Nodes (15): AuthController, ApiBearerAuth, ApiTags, Body, Controller, Get, Post, Req (+7 more)

### Community 4 - "useTelefonia.ts"
Cohesion: 0.09
Nodes (44): LineaDetailPage, telefoniaApi, invalidateTelefonia(), useAsignarResponsable(), useAsociarEquipo(), useCambiarEquipo(), useCambiarResponsable(), useCreateFinanciamiento() (+36 more)

### Community 5 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, esModuleInterop, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 6 - "InventarioDetailPage.tsx"
Cohesion: 0.06
Nodes (57): ActivoDetailPage, InventarioDetailPage, InventariosPage, activosApi, catalogosApi, AssetStatusTag(), severities, ComputerFields() (+49 more)

### Community 7 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-transformer, @fastify/static, mssql, @nestjs/common, @nestjs/swagger, passport, passport-jwt (+9 more)

### Community 8 - "DashboardPage.tsx"
Cohesion: 0.09
Nodes (25): DashboardPage, getDashboardSummary(), AlertsPanel(), definitions, formatter, AssetsByStatusCard(), colors, formatter (+17 more)

### Community 9 - "CatalogosRepository"
Cohesion: 0.11
Nodes (9): CatalogosController, Controller, Get, Query, UseGuards, CatalogosModule, Module, CatalogosRepository (+1 more)

### Community 10 - "useAsignaciones.ts"
Cohesion: 0.13
Nodes (28): AsignacionesPage, DevolverAsignacionPage, NuevaAsignacionPage, invalidate(), useAccessories(), useAsignacion(), useAsignaciones(), useAvailableAssets() (+20 more)

### Community 11 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, axios, primeicons, primereact, react, react-hook-form, react-router-dom, recharts (+11 more)

### Community 12 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, jest, @nestjs/testing, ts-jest, @types/jest, @types/mssql, @types/node, @types/passport (+11 more)

### Community 13 - "scripts"
Cohesion: 0.08
Nodes (23): eslint, eslint-plugin-react-hooks, devDependencies, eslint, eslint-plugin-react-hooks, typescript-eslint, engines, node (+15 more)

### Community 14 - "telefonia/types/facturacion.types.ts"
Cohesion: 0.12
Nodes (32): facturacionApi, useCerrarFactura(), useConciliarFactura(), useFactura(), useFacturaDetalles(), useResumenConciliacion(), useUpdateDetalleEstado(), useVincularCuota() (+24 more)

### Community 15 - "CreateAsignacionDto"
Cohesion: 0.26
Nodes (11): AccesorioEntregaDto, CreateAsignacionDto, ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, MaxLength (+3 more)

### Community 17 - "AuthUser"
Cohesion: 0.25
Nodes (11): AuthUser, LineasController, Body, Controller, Get, Param, Patch, Post (+3 more)

### Community 18 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, module, moduleResolution, outDir, skipLibCheck (+6 more)

### Community 19 - "asignaciones.repository.ts"
Cohesion: 0.16
Nodes (13): sort, AccesorioDevolucionDto, DevolverAsignacionDto, ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional (+5 more)

### Community 20 - "QueryAsignacionesDto"
Cohesion: 0.18
Nodes (10): QueryAsignacionesDto, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min (+2 more)

### Community 21 - "tsconfig.build.json"
Cohesion: 0.25
Nodes (7): compilerOptions, rootDir, exclude, extends, **/*.spec.ts, test, ./tsconfig.json

### Community 28 - "CrearFinanciamientoDto"
Cohesion: 0.06
Nodes (30): CrearFinanciamientoDto, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength (+22 more)

### Community 29 - "lineas.controller.ts"
Cohesion: 0.16
Nodes (14): AsignarResponsableDto, IsInt, IsOptional, IsString, MaxLength, Min, LiberarResponsableDto, IsOptional (+6 more)

### Community 30 - "UpdateLineaDto"
Cohesion: 0.14
Nodes (15): CreateLineaDto, IsInt, IsOptional, IsString, MaxLength, Min, IsIn, IsInt (+7 more)

### Community 31 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, jsdom, sass, @testing-library/jest-dom, @testing-library/react, @types/react, @types/react-dom, vite (+9 more)

### Community 33 - "LineasRepository"
Cohesion: 0.17
Nodes (4): LineasRepository, Injectable, LineasService, Injectable

### Community 35 - "App.tsx"
Cohesion: 0.10
Nodes (15): ActivoFormPage, ActivosPage, App(), AsignacionDetailPage, FacturaDetailPage, MantenimientosPage, NuevoInventarioPage, ModulePlaceholder() (+7 more)

### Community 36 - ".request"
Cohesion: 0.16
Nodes (12): AuthModule, Module, ActivityRow, DashboardRepository, Injectable, DashboardService, Injectable, DashboardActivity (+4 more)

### Community 37 - "Inspección inicial · 6 de octubre de 2026"
Cohesion: 0.17
Nodes (10): Dependencias, Despliegue posterior, Diferencias y decisiones, Estructura y secuencia, Inspección inicial · 6 de octubre de 2026, Variables, Ejecutar, Gestión TI · Grupo Pecuario (+2 more)

### Community 38 - "Validación de Fase 4"
Cohesion: 0.17
Nodes (11): Alcance implementado, Archivos principales, Code splitting y bundle, Endpoint y permiso, Estados de interfaz, Filtro de sede, Frontend, Fuentes SQL (+3 more)

### Community 39 - "Validación de Fase 5"
Cohesion: 0.17
Nodes (11): Alcance, Archivos, Bundle, Endpoints y permisos, Frontend, Limitaciones, Listado, Pruebas y validación (+3 more)

### Community 40 - "Validación de Fase 6"
Cohesion: 0.18
Nodes (10): Accesorios, transacciones y atomicidad, Alcance, Auditoría, DTO y validaciones, Endpoints y permisos, Frontend, Limitaciones, Stored procedures, movimientos e historial (+2 more)

### Community 41 - "frontend/package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, preview, test, type (+1 more)

### Community 42 - "useAuthStore"
Cohesion: 0.21
Nodes (10): PermissionRoute(), PermissionRouteProps, ProtectedRoute(), AsignacionDetailPage(), date(), show(), HomePage(), useAuthStore (+2 more)

### Community 43 - "Validación de Fase 3"
Cohesion: 0.20
Nodes (9): Accesibilidad, Alcance implementado, Archivos principales, Limitaciones y decisiones, Navegación y layout, Pruebas y validación, Rutas y permisos, Sesión y logout (+1 more)

### Community 44 - "backend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, start, test, version

### Community 45 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 46 - "Validación de Fase 2"
Cohesion: 0.25
Nodes (7): Alcance implementado, Archivos, Flujo real, Riesgos e inconsistencias, Validación, Validación de Fase 2, Variables nuevas

### Community 48 - "Permissions"
Cohesion: 0.25
Nodes (11): Permissions(), FacturacionController, Body, Controller, Get, Param, Patch, Post (+3 more)

### Community 49 - "api"
Cohesion: 0.11
Nodes (29): MantenimientoDetailPage, MantenimientoFormPage, mantenimientosApi, MantenimientoStatusTag(), Props, useCreateMantenimiento(), useFinalizarMantenimiento(), useMantenimiento() (+21 more)

### Community 50 - "Validación de Fase 7"
Cohesion: 0.29
Nodes (6): Alcance, Arquitectura y Concurrencia, Endpoints y Permisos, Frontend, Validación Automatizada, Validación de Fase 7

### Community 51 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 52 - "AsignacionesController"
Cohesion: 0.18
Nodes (9): AsignacionesController, Body, Controller, Get, Param, Post, Query, Req (+1 more)

### Community 53 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 54 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 78 - "DatabaseService"
Cohesion: 0.12
Nodes (8): ApiOkResponse, ApiServiceUnavailableResponse, DatabaseService, Injectable, HealthController, ApiTags, Controller, Get

### Community 79 - "DashboardController"
Cohesion: 0.14
Nodes (12): DashboardController, ApiBearerAuth, ApiTags, Controller, Get, Query, UseGuards, DashboardQueryDto (+4 more)

### Community 80 - "AsociarCelularDto"
Cohesion: 0.17
Nodes (8): AsociarCelularDto, IsInt, IsOptional, IsString, MaxLength, Min, RelacionesService, Injectable

### Community 81 - "facturacion.controller.ts"
Cohesion: 0.22
Nodes (8): JwtAuthGuard, Injectable, PERMISSIONS_KEY, PermissionsGuard, Injectable, IsInt, Min, VincularCuotaDto

### Community 82 - "auth.module.ts"
Cohesion: 0.15
Nodes (11): AuthRepository, LocalAccessRow, PermissionRow, ResultRow, Injectable, AuthService, Injectable, JwtPayload (+3 more)

### Community 83 - "CreateFacturaDto"
Cohesion: 0.19
Nodes (13): CreateFacturaDetalleDto, CreateFacturaDto, IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString (+5 more)

### Community 84 - "Validación de Fase 8"
Cohesion: 0.14
Nodes (13): 1. Resolución por Intervalo de Fechas, 2. Dos Dimensiones Diferenciadas, 3. Preservación del Snapshot Original, 4. Reglas de Cierre de Periodo, Alcance, Algoritmo de Conciliación Histórica, Endpoints y Permisos, Frontend (+5 more)

### Community 85 - "QueryFacturaDetalleDto"
Cohesion: 0.17
Nodes (10): QueryFacturaDetalleDto, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min (+2 more)

### Community 86 - "InventariosService"
Cohesion: 0.14
Nodes (11): InventariosController, Body, Controller, Get, Param, Post, Query, Req (+3 more)

### Community 87 - "QueryLineasDto"
Cohesion: 0.17
Nodes (11): QueryLineasDto, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength (+3 more)

### Community 88 - "TelefoniaPage.tsx"
Cohesion: 0.15
Nodes (16): NuevaLineaPage, TelefoniaPage, useFacturas(), useCreateLinea(), useFinanciamientos(), useLineas(), useOperadores(), usePlanes() (+8 more)

### Community 89 - "QueryFacturasDto"
Cohesion: 0.14
Nodes (12): QueryFacturasDto, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min (+4 more)

### Community 90 - "ConciliacionRepository"
Cohesion: 0.20
Nodes (4): ConciliacionRepository, Injectable, ConciliacionService, Injectable

### Community 92 - "Validación de Fase 9"
Cohesion: 0.10
Nodes (19): 1. `dbo.mantenimientos`, 2. `dbo.inventarios`, 3. `dbo.inventario_detalle`, Alcance, Backend (`@gp/backend`), Calidad de Código, Conclusión, Endpoints del Backend (+11 more)

### Community 93 - "conciliacion.repository.ts"
Cohesion: 0.39
Nodes (7): DetalleConciliadoResultado, CuotaFacturaItem, DiagnosticoConciliacion, EstadoConciliacionDetalle, EstadoConciliacionFactura, IntervaloEquipoHistorico, IntervaloResponsableHistorico

### Community 94 - "UpdateDetalleEstadoDto"
Cohesion: 0.22
Nodes (8): IsIn, IsInt, IsOptional, IsString, MaxLength, Min, Transform, UpdateDetalleEstadoDto

### Community 95 - "inventarios.controller.ts"
Cohesion: 0.23
Nodes (9): IsIn, IsInt, IsOptional, IsString, MaxLength, Min, Type, VerificarActivoDto (+1 more)

### Community 96 - "CatalogQuery"
Cohesion: 0.29
Nodes (7): CatalogQuery, IsInt, IsOptional, IsString, MaxLength, Min, Type

### Community 98 - "CerrarFacturaDto"
Cohesion: 0.40
Nodes (4): CerrarFacturaDto, IsOptional, IsString, MaxLength

### Community 99 - "MantenimientosService"
Cohesion: 0.14
Nodes (9): MantenimientosController, Controller, Get, Param, Patch, Query, UseGuards, MantenimientosService (+1 more)

### Community 100 - "InventariosRepository"
Cohesion: 0.25
Nodes (8): InventariosRepository, Injectable, EstadoInventario, InventarioDetalleItemDto, InventarioDetalleRow, InventarioItemDto, InventarioResumenDto, InventarioRow

### Community 101 - "FinalizarMantenimientoDto"
Cohesion: 0.16
Nodes (11): FinalizarMantenimientoDto, IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min, Type (+3 more)

### Community 102 - "facturacion.test.tsx"
Cohesion: 0.20
Nodes (8): NuevaFacturaPage, useCreateFactura(), NuevaFacturaPage(), CreateFacturaDetalleInput, mockDetallesPage, mockFacturaDetail, mockFacturasPage, mockResumenConciliacion

### Community 103 - "mantenimientos.repository.ts"
Cohesion: 0.45
Nodes (3): EstadoMantenimiento, MantenimientoRow, TipoMantenimiento

### Community 104 - "CreateMantenimientoDto"
Cohesion: 0.18
Nodes (11): CreateMantenimientoDto, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString (+3 more)

### Community 105 - "MantenimientosRepository"
Cohesion: 0.40
Nodes (4): MantenimientosRepository, Injectable, MantenimientoDetailDto, MantenimientoItemDto

### Community 106 - "QueryInventariosDto"
Cohesion: 0.20
Nodes (9): QueryInventariosDto, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min (+1 more)

### Community 107 - "CreateInventarioDto"
Cohesion: 0.22
Nodes (8): CreateInventarioDto, IsInt, IsOptional, IsString, MaxLength, Min, Type, IsNotEmpty

### Community 108 - "QueryMantenimientosDto"
Cohesion: 0.22
Nodes (9): QueryMantenimientosDto, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min (+1 more)

### Community 109 - "UpdateMantenimientoDto"
Cohesion: 0.22
Nodes (9): IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, Type (+1 more)

### Community 110 - "QueryInventarioDetalleDto"
Cohesion: 0.25
Nodes (8): QueryInventarioDetalleDto, IsIn, IsInt, IsOptional, IsString, Max, Min, Type

### Community 111 - "CerrarInventarioDto"
Cohesion: 0.33
Nodes (5): CerrarInventarioDto, IsBoolean, IsOptional, IsString, MaxLength

### Community 112 - "CambiarResponsableDto"
Cohesion: 0.33
Nodes (6): CambiarResponsableDto, IsInt, IsOptional, IsString, MaxLength, Min

## Knowledge Gaps
- **314 isolated node(s):** `name`, `version`, `private`, `build`, `dev` (+309 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 658 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Permissions()` connect `Permissions` to `activos.controller.ts`, `MantenimientosService`, `FinalizarMantenimientoDto`, `DashboardController`, `facturacion.controller.ts`, `AuthUser`, `AsignacionesController`, `InventariosService`, `CrearFinanciamientoDto`, `lineas.controller.ts`, `inventarios.controller.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `AuthUser` connect `AuthUser` to `activos.controller.ts`, `AuthController`, `MantenimientosService`, `FinalizarMantenimientoDto`, `Permissions`, `facturacion.controller.ts`, `auth.module.ts`, `AsignacionesController`, `InventariosService`, `CrearFinanciamientoDto`, `lineas.controller.ts`, `inventarios.controller.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `DatabaseService` connect `DatabaseService` to `activos.controller.ts`, `LineasRepository`, `app.module.ts`, `RelacionesRepository`, `.request`, `mantenimientos.repository.ts`, `CatalogosRepository`, `AsignacionesRepository`, `auth.module.ts`, `asignaciones.repository.ts`, `lineas.controller.ts`, `QueryFacturasDto`, `ConciliacionRepository`, `CrearFinanciamientoDto`, `conciliacion.repository.ts`, `UpdateLineaDto`, `inventarios.controller.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _314 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `activos.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05760905760905761 - nodes in this community are weakly interconnected._
- **Should `AuthenticatedLayout.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1103448275862069 - nodes in this community are weakly interconnected._
- **Should `app.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08558558558558559 - nodes in this community are weakly interconnected._