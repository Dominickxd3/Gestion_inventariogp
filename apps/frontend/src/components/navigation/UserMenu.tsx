import { useRef, useState } from 'react';
import { Avatar } from 'primereact/avatar';
import { Dialog } from 'primereact/dialog';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { User } from '../../types/auth';

interface UserMenuProps { user: User; collapsed: boolean; onLogout: () => void }
function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
}
export function UserMenu({ user, collapsed, onLogout }: UserMenuProps) {
  const menu = useRef<Menu>(null);
  const [visible, setVisible] = useState(false);
  const items: MenuItem[] = [
    { label: 'Mi sesión', icon: 'pi pi-user', command: () => setVisible(true) },
    { separator: true },
    { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: onLogout },
  ];
  return <div className="user-area">
    <button type="button" className="user-trigger" onClick={event => menu.current?.toggle(event)} aria-label="Abrir menú de usuario" aria-haspopup="menu">
      <Avatar label={initials(user.name)} shape="circle" />
      {!collapsed && <span className="user-copy"><strong title={user.name}>{user.name}</strong><small>{user.role}</small></span>}
      {!collapsed && <i className="pi pi-ellipsis-v" aria-hidden="true" />}
    </button>
    <Menu model={items} popup ref={menu} />
    <Dialog header="Mi sesión" visible={visible} onHide={() => setVisible(false)} className="session-dialog" dismissableMask>
      <dl className="session-details"><div><dt>Nombre</dt><dd>{user.name}</dd></div><div><dt>Usuario</dt><dd>{user.username}</dd></div><div><dt>Correo</dt><dd>{user.email ?? 'No registrado'}</dd></div><div><dt>Rol</dt><dd>{user.role}</dd></div><div><dt>Permisos activos</dt><dd>{user.permissions.length}</dd></div></dl>
    </Dialog>
  </div>;
}
