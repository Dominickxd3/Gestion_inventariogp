# Validación de Fase 3

Verificado el 7 de octubre de 2026 (America/Lima).

## Alcance implementado

Se implementó exclusivamente el shell autenticado: layout definitivo, marca reutilizable, navegación centralizada, sidebar por permisos, rutas protegidas, páginas 403/404, placeholders sin datos simulados, menú de sesión, logout, restauración segura de sesión y comportamiento responsive. No se implementaron módulos de negocio ni dashboard real.

## Rutas y permisos

| Ruta | Permiso |
| --- | --- |
| `/inicio` | `DASHBOARD_VER` |
| `/activos` | `ACTIVOS_VER` |
| `/asignaciones` | `ASIGNACIONES_VER` |
| `/telefonia` | `LINEAS_VER` |
| `/mantenimientos` | `MANTENIMIENTO_VER` |
| `/inventarios` | `INVENTARIO_VER` |
| `/usuarios` | `USUARIOS_VER` |
| `/auditoria` | `AUDITORIA_VER` |

`/login`, `/403` y el fallback 404 no requieren un permiso funcional. Todas las rutas internas requieren sesión. Trabajadores permanece oculto y sin ruta porque no existe un permiso real específico.

## Navegación y layout

- `navigation.config.ts` concentra la configuración tipada del menú.
- El sidebar sólo muestra opciones incluidas en los permisos efectivos de Zustand y omite secciones vacías.
- En escritorio inicia expandido y puede contraerse a iconos; la preferencia no sensible se guarda en `localStorage`.
- Los iconos contraídos conservan tooltip y navegación.
- En móvil la barra fija se oculta y se usa el componente `Sidebar` de PrimeReact 10 como drawer lateral. En esta versión de PrimeReact el componente equivalente todavía se denomina `Sidebar`, no `Drawer`.
- El contenido utiliza todo el ancho disponible y queda preparado para tablas amplias futuras.

## Sesión y logout

Al restaurar una sesión se muestra primero un estado de carga y se valida `GET /auth/me`. Sólo después se renderiza el contenido protegido y se actualizan usuario y permisos. Un fallo limpia la sesión y redirige al login.

El logout limpia usuario, token, permisos, estado autenticado, `sessionStorage` y la caché de TanStack Query, y luego redirige a `/login`.

El menú inferior usa nombre, rol e iniciales reales. “Mi sesión” presenta nombre, usuario, correo, rol y cantidad de permisos sin edición.

## Accesibilidad

Se usan `nav` y enlaces semánticos, botones reales para acciones, etiquetas accesibles en botones de icono, foco visible, tooltips en modo contraído y contraste sobrio.

## Archivos principales

- `src/app/App.tsx`, `AuthenticatedLayout.tsx`, `PermissionRoute.tsx` y `ProtectedRoute.tsx`.
- `src/app/navigation/navigation.config.ts`.
- `src/components/navigation/Brand.tsx`, `SidebarContent.tsx` y `UserMenu.tsx`.
- `src/components/feedback/SessionLoading.tsx` y `src/components/ui/ModulePlaceholder.tsx`.
- `src/pages/ForbiddenPage.tsx` y `NotFoundPage.tsx`.
- Parciales SCSS de variables, layout, tipografía, utilidades y ajustes PrimeReact.
- `src/test/app.test.tsx` y configuración de Vitest/Testing Library.

## Pruebas y validación

Las pruebas frontend cubren: acceso sin sesión, entrada a Inicio, menú permitido/oculto, secciones vacías, 403 por URL manual, 404, datos reales del usuario, logout y preferencia de sidebar. La restauración verifica explícitamente la llamada a `/auth/me`. No se usaron credenciales reales.

Se ejecutaron builds de backend y frontend, ESLint, Jest backend y Vitest frontend. La actualización de Vitest eliminó los dos avisos críticos que introducía su primera versión instalada. `npm audit` conserva los 25 avisos heredados ya documentados en Fase 2 (24 moderados y 1 alto); sus correcciones propuestas implican cambios mayores de NestJS/Jest o una regresión de `mssql`, por lo que no se aplicó `--force`.

## Limitaciones y decisiones

- La captura de BoletasGP anunciada no estuvo disponible en el contexto. Por instrucción, no se inventó el refinamiento visual detallado; se siguieron únicamente las pautas escritas y la familia visual existente.
- Vite advierte que el bundle principal minificado supera 500 kB (aproximadamente 526 kB, 161 kB gzip). Es un aviso de rendimiento, no un error de build; conviene introducir división por rutas cuando los módulos reales empiecen a agregarse.
- Los módulos futuros usan un placeholder común sin métricas, tablas ni datos falsos.
- La página Inicio muestra sólo datos reales de sesión. No consulta health para evitar presentar disponibilidad duplicada o no requerida.
- No se modificó SQL Server, el backend de autenticación ni los permisos existentes.
