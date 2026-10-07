export type TipoMantenimiento = 'CORRECTIVO' | 'PREVENTIVO';
export type EstadoMantenimiento = 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADO' | 'CANCELADO';

export interface MantenimientoRow {
  id_mantenimiento: number;
  id_activo: number;
  tipo: TipoMantenimiento;
  fecha_programada: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  problema_reportado: string | null;
  diagnostico: string | null;
  trabajo_realizado: string | null;
  costo: number | null;
  proveedor: string | null;
  estado: EstadoMantenimiento;
  proximo_mantenimiento: string | null;
  observaciones: string | null;
  usuario_registro: number | null;
  // Joins
  codigo_activo?: string;
  marca_activo?: string;
  modelo_activo?: string;
  serie_activo?: string;
  tipo_activo?: string;
  estado_activo_codigo?: string;
  estado_activo_nombre?: string;
  sede_nombre?: string;
  area_nombre?: string;
  usuario_registro_nombre?: string;
  responsable_actual?: string;
}

export interface MantenimientoItemDto {
  id: number;
  idActivo: number;
  activo: {
    codigo: string;
    marca?: string | null;
    modelo?: string | null;
    numeroSerie?: string | null;
    tipo: string;
    estado: {
      codigo: string;
      nombre: string;
    };
    sede?: string | null;
    area?: string | null;
  };
  tipo: TipoMantenimiento;
  fechaProgramada: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  problemaReportado: string | null;
  diagnostico: string | null;
  trabajoRealizado: string | null;
  costo: number | null;
  proveedor: string | null;
  estado: EstadoMantenimiento;
  proximoMantenimiento: string | null;
  observaciones: string | null;
  usuarioRegistro?: {
    id: number;
    nombre: string;
  } | null;
}

export interface MantenimientoDetailDto extends MantenimientoItemDto {
  activoCompleto: {
    id: number;
    codigo: string;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
    tipo: string;
    estado: {
      codigo: string;
      nombre: string;
    };
    ubicacionTexto?: string | null;
    responsableActual?: string | null;
  };
}
