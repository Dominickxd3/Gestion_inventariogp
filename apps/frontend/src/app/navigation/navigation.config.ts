export type NavigationSection = 'GENERAL' | 'GESTIÓN' | 'ADMINISTRACIÓN';

export interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  permission: string;
  section: NavigationSection;
}

export const navigationItems: readonly NavigationItem[] = [
  { label: 'Inicio', path: '/inicio', icon: 'pi pi-home', permission: 'DASHBOARD_VER', section: 'GENERAL' },
  { label: 'Activos', path: '/activos', icon: 'pi pi-desktop', permission: 'ACTIVOS_VER', section: 'GESTIÓN' },
  { label: 'Asignaciones', path: '/asignaciones', icon: 'pi pi-arrow-right-arrow-left', permission: 'ASIGNACIONES_VER', section: 'GESTIÓN' },
  { label: 'Telefonía', path: '/telefonia', icon: 'pi pi-mobile', permission: 'LINEAS_VER', section: 'GESTIÓN' },
  { label: 'Mantenimientos', path: '/mantenimientos', icon: 'pi pi-wrench', permission: 'MANTENIMIENTO_VER', section: 'GESTIÓN' },
  { label: 'Inventarios', path: '/inventarios', icon: 'pi pi-box', permission: 'INVENTARIO_VER', section: 'GESTIÓN' },
  { label: 'Documentos', path: '/documentos', icon: 'pi pi-file-pdf', permission: 'DOCUMENTOS_VER', section: 'GESTIÓN' },
  { label: 'Escaneo QR', path: '/qr', icon: 'pi pi-qrcode', permission: 'ACTIVOS_VER', section: 'GESTIÓN' },
  { label: 'Usuarios y accesos', path: '/usuarios', icon: 'pi pi-users', permission: 'USUARIOS_VER', section: 'ADMINISTRACIÓN' },
  { label: 'Auditoría', path: '/auditoria', icon: 'pi pi-history', permission: 'AUDITORIA_VER', section: 'ADMINISTRACIÓN' },
];

export const navigationSections: readonly NavigationSection[] = ['GENERAL', 'GESTIÓN', 'ADMINISTRACIÓN'];
