import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PermissionRoute } from './PermissionRoute';
import { ProtectedRoute } from './ProtectedRoute';

const LoginPage = lazy(() => import('../features/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const AuthenticatedLayout = lazy(() => import('./AuthenticatedLayout').then(module => ({ default: module.AuthenticatedLayout })));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const ActivosPage = lazy(() => import('../features/activos/pages/ActivosPage'));
const ActivoFormPage = lazy(() => import('../features/activos/pages/ActivoFormPage'));
const ActivoDetailPage = lazy(() => import('../features/activos/pages/ActivoDetailPage'));
const AsignacionesPage = lazy(() => import('../features/asignaciones/pages/AsignacionesPage'));
const NuevaAsignacionPage = lazy(() => import('../features/asignaciones/pages/NuevaAsignacionPage'));
const AsignacionDetailPage = lazy(() => import('../features/asignaciones/pages/AsignacionDetailPage'));
const DevolverAsignacionPage = lazy(() => import('../features/asignaciones/pages/DevolverAsignacionPage'));
const TelefoniaPage = lazy(() => import('../features/telefonia/pages/TelefoniaPage'));
const NuevaLineaPage = lazy(() => import('../features/telefonia/pages/NuevaLineaPage'));
const LineaDetailPage = lazy(() => import('../features/telefonia/pages/LineaDetailPage'));
const NuevaFacturaPage = lazy(() => import('../features/telefonia/pages/NuevaFacturaPage'));
const FacturaDetailPage = lazy(() => import('../features/telefonia/pages/FacturaDetailPage'));

// Fase 9: Mantenimientos & Inventarios
const MantenimientosPage = lazy(() => import('../features/mantenimientos/pages/MantenimientosPage'));
const MantenimientoFormPage = lazy(() => import('../features/mantenimientos/pages/MantenimientoFormPage'));
const MantenimientoDetailPage = lazy(() => import('../features/mantenimientos/pages/MantenimientoDetailPage'));
const InventariosPage = lazy(() => import('../features/inventarios/pages/InventariosPage'));
const NuevoInventarioPage = lazy(() => import('../features/inventarios/pages/NuevoInventarioPage'));
const InventarioDetailPage = lazy(() => import('../features/inventarios/pages/InventarioDetailPage'));

// Fase 10: Admin, Auditoría, Documentos & QR
const UsuariosPage = lazy(() => import('../features/admin/pages/UsuariosPage'));
const AuditoriaPage = lazy(() => import('../features/auditoria/pages/AuditoriaPage'));
const DocumentosPage = lazy(() => import('../features/documentos/pages/DocumentosPage'));
const QrScanPage = lazy(() => import('../features/qr/pages/QrScanPage'));

export function App() {
  return (
    <Suspense fallback={<main className="route-loading" aria-label="Cargando página" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route index element={<Navigate to="/inicio" replace />} />
            <Route element={<PermissionRoute permission="DASHBOARD_VER" />}>
              <Route path="inicio" element={<DashboardPage />} />
            </Route>

            {/* Activos */}
            <Route element={<PermissionRoute permission="ACTIVOS_VER" />}>
              <Route path="activos" element={<ActivosPage />} />
              <Route path="activos/:id" element={<ActivoDetailPage />} />
            </Route>
            <Route element={<PermissionRoute permission="ACTIVOS_CREAR" />}>
              <Route path="activos/nuevo" element={<ActivoFormPage />} />
            </Route>
            <Route element={<PermissionRoute permission="ACTIVOS_EDITAR" />}>
              <Route path="activos/:id/editar" element={<ActivoFormPage />} />
            </Route>

            {/* Asignaciones */}
            <Route element={<PermissionRoute permission="ASIGNACIONES_VER" />}>
              <Route path="asignaciones" element={<AsignacionesPage />} />
              <Route path="asignaciones/:id" element={<AsignacionDetailPage />} />
            </Route>
            <Route element={<PermissionRoute permission="ASIGNACIONES_CREAR" />}>
              <Route path="asignaciones/nueva" element={<NuevaAsignacionPage />} />
            </Route>
            <Route element={<PermissionRoute permission="ASIGNACIONES_DEVOLVER" />}>
              <Route path="asignaciones/:id/devolver" element={<DevolverAsignacionPage />} />
            </Route>

            {/* Telefonía */}
            <Route element={<PermissionRoute permission="LINEAS_VER" />}>
              <Route path="telefonia" element={<TelefoniaPage />} />
              <Route path="telefonia/:id" element={<LineaDetailPage />} />
              <Route path="telefonia/facturas/:id" element={<FacturaDetailPage />} />
            </Route>
            <Route element={<PermissionRoute permission="LINEAS_EDITAR" />}>
              <Route path="telefonia/nueva" element={<NuevaLineaPage />} />
            </Route>
            <Route element={<PermissionRoute permission="LINEAS_CONCILIAR" />}>
              <Route path="telefonia/facturas/nueva" element={<NuevaFacturaPage />} />
            </Route>

            {/* Mantenimientos (Fase 9) */}
            <Route element={<PermissionRoute permission="MANTENIMIENTO_VER" />}>
              <Route path="mantenimientos" element={<MantenimientosPage />} />
              <Route path="mantenimientos/:id" element={<MantenimientoDetailPage />} />
            </Route>
            <Route element={<PermissionRoute permission="MANTENIMIENTO_EDITAR" />}>
              <Route path="mantenimientos/nuevo" element={<MantenimientoFormPage />} />
              <Route path="mantenimientos/:id/editar" element={<MantenimientoFormPage />} />
            </Route>

            {/* Inventarios (Fase 9) */}
            <Route element={<PermissionRoute permission="INVENTARIO_VER" />}>
              <Route path="inventarios" element={<InventariosPage />} />
              <Route path="inventarios/:id" element={<InventarioDetailPage />} />
            </Route>
            <Route element={<PermissionRoute permission="INVENTARIO_GESTIONAR" />}>
              <Route path="inventarios/nuevo" element={<NuevoInventarioPage />} />
            </Route>

            {/* Documentos (Fase 10) */}
            <Route element={<PermissionRoute permission="DOCUMENTOS_VER" />}>
              <Route path="documentos" element={<DocumentosPage />} />
            </Route>

            {/* QR Scanner (Fase 10) */}
            <Route element={<PermissionRoute permission="ACTIVOS_VER" />}>
              <Route path="qr" element={<QrScanPage />} />
              <Route path="scan" element={<QrScanPage />} />
            </Route>

            {/* Administración: Usuarios & Auditoría (Fase 10) */}
            <Route element={<PermissionRoute permission="USUARIOS_VER" />}>
              <Route path="usuarios" element={<UsuariosPage />} />
              <Route path="admin/usuarios" element={<UsuariosPage />} />
            </Route>
            <Route element={<PermissionRoute permission="AUDITORIA_VER" />}>
              <Route path="auditoria" element={<AuditoriaPage />} />
              <Route path="admin/auditoria" element={<AuditoriaPage />} />
            </Route>

            <Route path="403" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
