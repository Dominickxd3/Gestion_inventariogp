# Graph Report - Gestion_inventariogp  (2026-10-07)

## Corpus Check
- 268 files · ~100,028 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1961 nodes · 3971 edges · 135 communities (97 shown, 31 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 237 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `19c99b08`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CreateActivoDto
- auth.store.ts
- http.spec.ts
- AuthUser
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
- Permissions
- compilerOptions
- DevolverAsignacionDto
- QueryAsignacionesDto
- tsconfig.build.json
- ResizeObserverMock
- telefonia.module.ts
- lineas.controller.ts
- QueryLineasDto
- What You Must Do When Invoked
- devDependencies
- LineasRepository
- .transaction
- App.tsx
- DashboardRepository
- Inspección inicial · 6 de octubre de 2026
- Validación de Fase 4
- Validación de Fase 5
- Validación de Fase 6
- frontend/package.json
- api.ts
- Validación de Fase 3
- backend/package.json
- graphify reference: extra exports and benchmark
- Validación de Fase 2
- AsignacionesRepository
- FacturacionController
- useMantenimientos.ts
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
- documentos.service.ts
- QueryAuditoriaDto
- @nestjs/core
- @nestjs/jwt
- QrService
- nestjs-pino
- @nestjs/platform-fastify
- @nestjs/throttler
- reflect-metadata
- DatabaseService
- react-dom
- @testing-library/user-event
- .request
- Política y Guía de Hardening de Seguridad (Fase 10)
- extraction-spec.md
- HealthController
- DashboardController
- AdminController
- facturacion.controller.ts
- AuthRepository
- CreateFacturaDto
- Validación de Fase 8
- QueryFacturaDetalleDto
- InventariosService
- qr.test.tsx
- admin.repository.ts
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
- admin.api.ts
- mantenimientos.repository.ts
- CreateMantenimientoDto
- MantenimientosRepository
- QueryInventariosDto
- CreateInventarioDto
- QueryMantenimientosDto
- UpdateMantenimientoDto
- QueryInventarioDetalleDto
- CerrarInventarioDto
- Manual de Operaciones y Mantenimiento (Fase 10)
- app.module.ts
- 1. Alcance Implementado en Fase 10
- CrearFinanciamientoDto
- AuditoriaPage.tsx
- Manual de Despliegue en Producción (Fase 10)
- Arquitectura y Mecanismo de Autenticación Corporativa ERP (Fase 10)
- Arquitectura y Especificación de Códigos QR Transversales (Fase 10)
- QueryUsuariosDto
- FinanciamientosController
- asignaciones.repository.ts
- VincularCuotaDto
- ModulePlaceholder.tsx
- Estado de las Fases del Proyecto — Gestión TI
- class-transformer
- @nestjs/common
- passport-jwt
- pdfkit
- pino
- qrcode
- @types/pdfkit
- @tanstack/react-query
- @testing-library/jest-dom

## God Nodes (most connected - your core abstractions)
1. `Permissions()` - 74 edges
2. `useAuthStore` - 51 edges
3. `AuthUser` - 48 edges
4. `DatabaseService` - 46 edges
5. `api` - 26 edges
6. `CreateActivoDto` - 22 edges
7. `CreateMantenimientoDto` - 20 edges
8. `ActivosRepository` - 19 edges
9. `Environment` - 19 edges
10. `QueryAsignacionesDto` - 18 edges

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

## Communities (135 total, 31 thin omitted)

### Community 0 - "CreateActivoDto"
Cohesion: 0.05
Nodes (42): ActivosController, Body, Controller, Get, Param, Patch, Post, Query (+34 more)

### Community 1 - "auth.store.ts"
Cohesion: 0.09
Nodes (25): AuthenticatedLayout, LoginPage, AuthenticatedLayout(), ValidationState, NavigationItem, navigationItems, NavigationSection, navigationSections (+17 more)

### Community 2 - "http.spec.ts"
Cohesion: 0.24
Nodes (6): AppModule, Module, createApplication(), ApiExceptionFilter, main(), Catch

### Community 3 - "AuthUser"
Cohesion: 0.09
Nodes (21): AuthController, ApiBearerAuth, ApiTags, Body, Controller, Get, Post, Req (+13 more)

### Community 4 - "useTelefonia.ts"
Cohesion: 0.07
Nodes (60): LineaDetailPage, NuevaLineaPage, TelefoniaPage, telefoniaApi, useFacturas(), invalidateTelefonia(), useAsignarResponsable(), useAsociarEquipo() (+52 more)

### Community 5 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, esModuleInterop, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 6 - "InventarioDetailPage.tsx"
Cohesion: 0.06
Nodes (54): ActivoFormPage, ActivosPage, InventarioDetailPage, NuevoInventarioPage, activosApi, catalogosApi, AssetStatusTag(), severities (+46 more)

### Community 7 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @fastify/helmet, @fastify/static, mssql, @nestjs/config, @nestjs/passport, @nestjs/swagger, passport (+11 more)

### Community 8 - "DashboardPage.tsx"
Cohesion: 0.09
Nodes (24): DashboardPage, getDashboardSummary(), AlertsPanel(), definitions, formatter, AssetsByStatusCard(), colors, formatter (+16 more)

### Community 9 - "CatalogosRepository"
Cohesion: 0.11
Nodes (9): CatalogosController, Controller, Get, Query, UseGuards, CatalogosModule, Module, CatalogosRepository (+1 more)

### Community 10 - "useAsignaciones.ts"
Cohesion: 0.10
Nodes (34): AsignacionDetailPage, AsignacionesPage, DevolverAsignacionPage, asignacionesApi, invalidate(), useAccessories(), useAsignacion(), useAsignaciones() (+26 more)

### Community 11 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, axios, html5-qrcode, primeicons, primereact, react, react-hook-form, react-router-dom (+11 more)

### Community 12 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, jest, @nestjs/testing, ts-jest, @types/jest, @types/mssql, @types/node, @types/passport (+11 more)

### Community 13 - "scripts"
Cohesion: 0.08
Nodes (23): eslint, eslint-plugin-react-hooks, devDependencies, eslint, eslint-plugin-react-hooks, typescript-eslint, engines, node (+15 more)

### Community 14 - "telefonia/types/facturacion.types.ts"
Cohesion: 0.08
Nodes (41): FacturaDetailPage, NuevaFacturaPage, facturacionApi, useCerrarFactura(), useConciliarFactura(), useCreateFactura(), useFactura(), useFacturaDetalles() (+33 more)

### Community 15 - "CreateAsignacionDto"
Cohesion: 0.27
Nodes (11): AccesorioEntregaDto, CreateAsignacionDto, ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, MaxLength (+3 more)

### Community 17 - "Permissions"
Cohesion: 0.26
Nodes (11): Permissions(), LineasController, Body, Controller, Get, Param, Patch, Post (+3 more)

### Community 18 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, module, moduleResolution, outDir, skipLibCheck (+6 more)

### Community 19 - "DevolverAsignacionDto"
Cohesion: 0.21
Nodes (12): AccesorioDevolucionDto, DevolverAsignacionDto, ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString (+4 more)

### Community 20 - "QueryAsignacionesDto"
Cohesion: 0.13
Nodes (12): Get, Query, QueryAsignacionesDto, IsIn, IsInt, IsOptional, IsString, Max (+4 more)

### Community 21 - "tsconfig.build.json"
Cohesion: 0.25
Nodes (7): compilerOptions, rootDir, exclude, extends, **/*.spec.ts, test, ./tsconfig.json

### Community 28 - "telefonia.module.ts"
Cohesion: 0.11
Nodes (14): QueryFinanciamientosDto, IsIn, IsInt, IsOptional, Max, Min, Transform, Type (+6 more)

### Community 29 - "lineas.controller.ts"
Cohesion: 0.10
Nodes (26): AsignarResponsableDto, IsInt, IsOptional, IsString, MaxLength, Min, AsociarCelularDto, IsInt (+18 more)

### Community 30 - "QueryLineasDto"
Cohesion: 0.08
Nodes (26): CreateLineaDto, IsInt, IsOptional, IsString, MaxLength, Min, QueryLineasDto, IsBoolean (+18 more)

### Community 31 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 32 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, jsdom, sass, @testing-library/react, @types/react, @types/react-dom, typescript, vite (+11 more)

### Community 33 - "LineasRepository"
Cohesion: 0.16
Nodes (4): LineasRepository, Injectable, LineasService, Injectable

### Community 34 - ".transaction"
Cohesion: 0.23
Nodes (4): RelacionesRepository, Injectable, RelacionesService, Injectable

### Community 35 - "App.tsx"
Cohesion: 0.11
Nodes (19): ActivoDetailPage, App(), InventariosPage, MantenimientoDetailPage, MantenimientoFormPage, MantenimientosPage, NuevaAsignacionPage, UsuariosPage (+11 more)

### Community 36 - "DashboardRepository"
Cohesion: 0.18
Nodes (10): ActivityRow, DashboardRepository, Injectable, DashboardService, Injectable, DashboardActivity, DashboardAlerts, DashboardDistribution (+2 more)

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

### Community 42 - "api.ts"
Cohesion: 0.19
Nodes (10): DocumentosPage, documentosApi, DocumentosPage(), DocumentoListItem, GenerarDocumentoPayload, PaginatedDocumentosResponse, QueryDocumentosParams, api (+2 more)

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
Nodes (7): Alcance implementado, Flujo vigente, Riesgos conocidos, Seguridad y compatibilidad, Validación, Validación de Fase 2, Variables

### Community 48 - "FacturacionController"
Cohesion: 0.22
Nodes (10): FacturacionController, Body, Controller, Get, Param, Patch, Post, Query (+2 more)

### Community 49 - "useMantenimientos.ts"
Cohesion: 0.13
Nodes (26): mantenimientosApi, MantenimientoStatusTag(), Props, useCreateMantenimiento(), useFinalizarMantenimiento(), useMantenimiento(), useMantenimientos(), useUpdateMantenimiento() (+18 more)

### Community 50 - "Validación de Fase 7"
Cohesion: 0.29
Nodes (6): Alcance, Arquitectura y Concurrencia, Endpoints y Permisos, Frontend, Validación Automatizada, Validación de Fase 7

### Community 51 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 52 - "AsignacionesController"
Cohesion: 0.25
Nodes (7): AsignacionesController, Body, Controller, Param, Post, Req, UseGuards

### Community 53 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 54 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 61 - "documentos.service.ts"
Cohesion: 0.06
Nodes (38): DocumentosController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, Param (+30 more)

### Community 62 - "QueryAuditoriaDto"
Cohesion: 0.09
Nodes (26): AuditoriaController, ApiBearerAuth, ApiOperation, ApiTags, Controller, Get, Param, Query (+18 more)

### Community 65 - "QrService"
Cohesion: 0.11
Nodes (16): ApiResponse, QrController, ApiBearerAuth, ApiOperation, ApiTags, Controller, Get, Param (+8 more)

### Community 70 - "DatabaseService"
Cohesion: 0.14
Nodes (8): LocalAccessRow, PermissionRow, ResultRow, Environment, validateEnvironment(), DatabaseService, Injectable, valid

### Community 73 - ".request"
Cohesion: 0.19
Nodes (4): AdminRepository, Injectable, AdminService, Injectable

### Community 74 - "Política y Guía de Hardening de Seguridad (Fase 10)"
Cohesion: 0.10
Nodes (19): 1. Modelo de Autenticación y Autorización, 2. Prevención de Vulnerabilidades Web, 3. Configuración de Red, Transporte y Encabezados, 4. Auditoría Inmutable, 5. Deuda Técnica de TLS y Bloqueador Detectado, 6. Reporte de Auditoría de Dependencias (`npm audit`), A. Autenticación Corporativa y Desacoplamiento Local, A. Helmets y Encabezados HTTP (+11 more)

### Community 78 - "HealthController"
Cohesion: 0.18
Nodes (8): ApiOkResponse, ApiServiceUnavailableResponse, HealthController, HealthResponse, ApiProperty, ApiTags, Controller, Get

### Community 79 - "DashboardController"
Cohesion: 0.14
Nodes (12): DashboardController, ApiBearerAuth, ApiTags, Controller, Get, Query, UseGuards, DashboardQueryDto (+4 more)

### Community 80 - "AdminController"
Cohesion: 0.16
Nodes (13): AdminController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, Param (+5 more)

### Community 81 - "facturacion.controller.ts"
Cohesion: 0.30
Nodes (5): JwtAuthGuard, Injectable, PERMISSIONS_KEY, PermissionsGuard, Injectable

### Community 82 - "AuthRepository"
Cohesion: 0.25
Nodes (3): AuthRepository, Injectable, Permission

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
Cohesion: 0.17
Nodes (8): InventariosController, Controller, Get, Param, Query, UseGuards, InventariosService, Injectable

### Community 87 - "qr.test.tsx"
Cohesion: 0.19
Nodes (11): QrScanPage, qrApi, QrModal(), QrModalProps, QrScanPage(), QrGenerationResult, QrResolvedActivo, mockGeneratedQr (+3 more)

### Community 88 - "admin.repository.ts"
Cohesion: 0.22
Nodes (11): PermisoItem, RolItem, sortMap, UsuarioDetail, UsuarioListItem, IsBoolean, IsInt, IsOptional (+3 more)

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
Cohesion: 0.20
Nodes (11): IsIn, IsInt, IsOptional, IsString, MaxLength, Min, Type, VerificarActivoDto (+3 more)

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
Cohesion: 0.24
Nodes (8): InventariosRepository, Injectable, EstadoInventario, InventarioDetalleItemDto, InventarioDetalleRow, InventarioItemDto, InventarioResumenDto, InventarioRow

### Community 101 - "FinalizarMantenimientoDto"
Cohesion: 0.16
Nodes (11): FinalizarMantenimientoDto, IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min, Type (+3 more)

### Community 102 - "admin.api.ts"
Cohesion: 0.23
Nodes (11): adminApi, UsuariosPage(), PaginatedUsuariosResponse, PermisoItem, QueryUsuariosParams, RolItem, UpdateUsuarioAccesoPayload, UsuarioDetail (+3 more)

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
Cohesion: 0.22
Nodes (9): QueryInventariosDto, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min (+1 more)

### Community 107 - "CreateInventarioDto"
Cohesion: 0.25
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
Cohesion: 0.20
Nodes (8): CerrarInventarioDto, IsBoolean, IsOptional, IsString, MaxLength, Body, Post, Req

### Community 112 - "Manual de Operaciones y Mantenimiento (Fase 10)"
Cohesion: 0.12
Nodes (15): 1. Control del Servicio de Backend, 2. Gestión de Logs y Rotación, 3. Monitoreo Continuo y Health Checks, 4. Política de Copias de Seguridad (Backups de Base de Datos), 5. Almacenamiento de Documentos PDF y Cuotas, 6. Procedimientos ante Incidentes Operativos, A. Ubicación de Archivos de Log, B. Formato de Logs de Aplicación (+7 more)

### Community 113 - "app.module.ts"
Cohesion: 0.14
Nodes (17): ActivosModule, Module, AdminModule, Module, AsignacionesModule, Module, AuthModule, Module (+9 more)

### Community 114 - "1. Alcance Implementado en Fase 10"
Cohesion: 0.12
Nodes (15): 1. Alcance Implementado en Fase 10, 2. Resultados de Validación Automatizada, 3. Bloqueadores de Producción Identificados (`PRODUCTION BLOCKERS`), 4. Estado de Archivos y Cierre, A. Pruebas Unitarias Backend (Jest), B. Pruebas Frontend (Vitest), Bloque A — QR Transversal, Bloque B — Administración de Usuarios y Accesos (+7 more)

### Community 115 - "CrearFinanciamientoDto"
Cohesion: 0.15
Nodes (12): CrearFinanciamientoDto, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength (+4 more)

### Community 116 - "AuditoriaPage.tsx"
Cohesion: 0.24
Nodes (9): AuditoriaPage, auditoriaApi, AuditoriaPage(), modulosList, AuditoriaDetail, AuditoriaListItem, PaginatedAuditoriaResponse, QueryAuditoriaParams (+1 more)

### Community 117 - "Manual de Despliegue en Producción (Fase 10)"
Cohesion: 0.14
Nodes (13): 1. Arquitectura de Despliegue Institucional, 2. Prerrequisitos del Servidor, 3. Preparación de Artefactos de Compilación, 4. Configuración de IIS, 5. Configuración de Variables de Entorno de Backend, 6. Instalación del Backend como Servicio de Windows (NSSM), 7. Verificación de Salud del Sistema (Health Checks), 8. Procedimiento de Rollback (Plan de Contingencia) (+5 more)

### Community 118 - "Arquitectura y Mecanismo de Autenticación Corporativa ERP (Fase 10)"
Cohesion: 0.18
Nodes (10): 1. Resumen Ejecutivo y Deuda de Fase 2, 2. Fuente Oficial del ERP Corporativo, 3. Sincronización de Identidad (`dbo.sp_sincronizar_usuarios_erp`), 4. Modos de Ejecución: `AUTH_MODE`, 5. Respuestas de Seguridad y Códigos HTTP, 6. Estado de Producción y Bloqueador Detectado, Arquitectura y Mecanismo de Autenticación Corporativa ERP (Fase 10), Datos de Control Local Exclusivo (+2 more)

### Community 119 - "Arquitectura y Especificación de Códigos QR Transversales (Fase 10)"
Cohesion: 0.18
Nodes (10): 1. Objetivo y Filosofía de Diseño, 2. Principios de Seguridad y Privacidad, 3. Endpoints del API, 4. Integraciones Transversales, 5. Impresión de Etiquetas, A. Resolución de Token QR, Arquitectura y Especificación de Códigos QR Transversales (Fase 10), B. Generación de Etiqueta QR (+2 more)

### Community 120 - "QueryUsuariosDto"
Cohesion: 0.22
Nodes (8): QueryUsuariosDto, IsIn, IsInt, IsOptional, IsString, Max, Min, Type

### Community 121 - "FinanciamientosController"
Cohesion: 0.25
Nodes (6): FinanciamientosController, Controller, Get, Param, Query, UseGuards

### Community 123 - "VincularCuotaDto"
Cohesion: 0.50
Nodes (3): IsInt, Min, VincularCuotaDto

## Knowledge Gaps
- **391 isolated node(s):** `name`, `version`, `private`, `build`, `dev` (+386 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 817 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Permissions()` connect `Permissions` to `CreateActivoDto`, `QrService`, `MantenimientosService`, `FinalizarMantenimientoDto`, `DashboardController`, `AdminController`, `facturacion.controller.ts`, `CerrarInventarioDto`, `FacturacionController`, `QueryAsignacionesDto`, `AsignacionesController`, `InventariosService`, `CrearFinanciamientoDto`, `lineas.controller.ts`, `FinanciamientosController`, `documentos.service.ts`, `QueryAuditoriaDto`, `inventarios.controller.ts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `DatabaseService` connect `DatabaseService` to `CreateActivoDto`, `http.spec.ts`, `CatalogosRepository`, `telefonia.module.ts`, `lineas.controller.ts`, `QueryLineasDto`, `LineasRepository`, `.transaction`, `DashboardRepository`, `AsignacionesRepository`, `documentos.service.ts`, `QueryAuditoriaDto`, `QrService`, `.request`, `HealthController`, `AuthRepository`, `admin.repository.ts`, `QueryFacturasDto`, `ConciliacionRepository`, `conciliacion.repository.ts`, `inventarios.controller.ts`, `mantenimientos.repository.ts`, `app.module.ts`, `asignaciones.repository.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `AuthUser` connect `AuthUser` to `CreateActivoDto`, `MantenimientosService`, `FinalizarMantenimientoDto`, `DatabaseService`, `CerrarInventarioDto`, `AdminController`, `facturacion.controller.ts`, `AuthRepository`, `FacturacionController`, `AsignacionesController`, `CrearFinanciamientoDto`, `lineas.controller.ts`, `Permissions`, `documentos.service.ts`, `inventarios.controller.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _391 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CreateActivoDto` be split into smaller, more focused modules?**
  _Cohesion score 0.054340396445659606 - nodes in this community are weakly interconnected._
- **Should `auth.store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08819345661450925 - nodes in this community are weakly interconnected._
- **Should `AuthUser` be split into smaller, more focused modules?**
  _Cohesion score 0.09475806451612903 - nodes in this community are weakly interconnected._