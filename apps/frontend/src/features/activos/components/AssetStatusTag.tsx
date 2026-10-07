import { Tag } from 'primereact/tag';
const severities:Record<string,'success'|'info'|'warning'|'danger'|'secondary'>={DISPONIBLE:'success',ASIGNADO:'info',PRESTADO:'info',MANTENIMIENTO:'warning',REPARACION:'warning',OBSERVADO:'warning',PERDIDO:'danger',ROBADO:'danger',BAJA:'secondary'};
export function AssetStatusTag({code,label}:{code:string;label:string}){return <Tag value={label} severity={severities[code]??'secondary'} />;}
