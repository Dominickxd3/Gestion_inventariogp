import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface PermissionRouteProps { permission: string }
export function PermissionRoute({ permission }: PermissionRouteProps) {
  const permissions = useAuthStore(state => state.permissions);
  return permissions.includes(permission) ? <Outlet /> : <Navigate to="/403" replace />;
}
