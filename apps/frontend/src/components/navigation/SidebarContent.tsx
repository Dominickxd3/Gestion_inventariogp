import { NavLink } from 'react-router-dom';
import { Divider } from 'primereact/divider';
import { Tooltip } from 'primereact/tooltip';
import { navigationItems, navigationSections } from '../../app/navigation/navigation.config';
import { User } from '../../types/auth';
import { Brand } from './Brand';
import { UserMenu } from './UserMenu';

interface SidebarContentProps { user: User; permissions: string[]; collapsed: boolean; onNavigate?: () => void; onLogout: () => void }
export function SidebarContent({ user, permissions, collapsed, onNavigate, onLogout }: SidebarContentProps) {
  const allowed = navigationItems.filter(item => permissions.includes(item.permission));
  return <div className="sidebar-content">
    <Brand collapsed={collapsed} />
    <Divider />
    <nav aria-label="Navegación principal" className="sidebar-nav">
      {navigationSections.map(section => {
        const items = allowed.filter(item => item.section === section);
        if (items.length === 0) return null;
        return <div className="nav-section" key={section}><div className="nav-label">{section}</div>{items.map(item =>
          <NavLink key={item.path} to={item.path} onClick={onNavigate} className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} data-pr-tooltip={collapsed ? item.label : undefined} data-pr-position="right">
            <i className={item.icon} aria-hidden="true" />{!collapsed && <span>{item.label}</span>}
          </NavLink>)}</div>;
      })}
    </nav>
    <UserMenu user={user} collapsed={collapsed} onLogout={onLogout} />
    {collapsed && <Tooltip target=".nav-link[data-pr-tooltip]" />}
  </div>;
}
