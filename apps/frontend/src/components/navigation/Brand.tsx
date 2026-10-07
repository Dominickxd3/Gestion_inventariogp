interface BrandProps { collapsed?: boolean }
export function Brand({ collapsed = false }: BrandProps) {
  return <div className="brand"><span className="brand-mark" aria-hidden="true">GP</span>{!collapsed && <div><strong>Gestión TI</strong><small>Grupo Pecuario</small></div>}</div>;
}
