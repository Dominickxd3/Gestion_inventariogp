interface ModulePlaceholderProps { title: string; icon: string }
export function ModulePlaceholder({ title, icon }: ModulePlaceholderProps) {
  return <><header className="page-header"><p className="eyebrow">GESTIÓN TI</p><h1>{title}</h1></header><section className="module-placeholder"><i className={icon} aria-hidden="true" /><div><h2>Módulo en preparación</h2><p>Esta funcionalidad se implementará en una fase posterior.</p></div></section></>;
}
