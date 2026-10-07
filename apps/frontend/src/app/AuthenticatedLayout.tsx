import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { Sidebar as MobileDrawer } from 'primereact/sidebar';
import { SidebarContent } from '../components/navigation/SidebarContent';
import { SessionLoading } from '../components/feedback/SessionLoading';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import { User } from '../types/auth';
import { navigationItems } from './navigation/navigation.config';

type ValidationState = 'checking' | 'valid' | 'invalid';
const SIDEBAR_PREFERENCE = 'gp-sidebar-collapsed';

export function AuthenticatedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, permissions, setUser, logout } = useAuthStore();
  const [validation, setValidation] = useState<ValidationState>('checking');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_PREFERENCE) === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const validate = async () => {
      try {
        const { data } = await api.get<User>('/auth/me');
        if (active) { setUser(data); setValidation('valid'); }
      } catch {
        if (active) { logout(); setValidation('invalid'); navigate('/login', { replace: true }); }
      }
    };
    void validate();
    return () => { active = false; };
  }, [logout, navigate, setUser]);

  const toggleSidebar = () => setCollapsed(previous => {
    const next = !previous;
    localStorage.setItem(SIDEBAR_PREFERENCE, String(next));
    return next;
  });
  const signOut = () => {
    queryClient.clear();
    logout();
    navigate('/login', { replace: true });
  };

  if (validation !== 'valid' || !user) return <SessionLoading />;
  const context = navigationItems.find(item => item.path === location.pathname)?.label ?? 'Gestión TI';
  return <div className={`app-shell${collapsed ? ' app-shell--collapsed' : ''}`}>
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}><SidebarContent user={user} permissions={permissions} collapsed={collapsed} onLogout={signOut} /></aside>
    <MobileDrawer visible={mobileOpen} onHide={() => setMobileOpen(false)} position="left" className="mobile-drawer" showCloseIcon={false}>
      <SidebarContent user={user} permissions={permissions} collapsed={false} onNavigate={() => setMobileOpen(false)} onLogout={signOut} />
    </MobileDrawer>
    <div className="app-workspace">
      <header className="app-toolbar">
        <Button icon="pi pi-bars" text rounded aria-label="Abrir navegación" className="mobile-menu-button" onClick={() => setMobileOpen(true)} />
        <Button icon={collapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'} text rounded aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'} className="collapse-button" onClick={toggleSidebar} />
        <span className="toolbar-context">{context}</span>
      </header>
      <main className="main-content"><Outlet /></main>
    </div>
  </div>;
}
