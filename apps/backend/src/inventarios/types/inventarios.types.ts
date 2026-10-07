export type EstadoInventario = 'ABIERTO' | 'EN_PROCESO' | 'FINALIZADO' | 'CANCELADO';
export type EstadoVerificacion = 'PENDIENTE' | 'ENCONTRADO' | 'NO_ENCONTRADO' | 'CAMBIO_UBICACION' | 'OBSERVADO';

export interface InventarioRow {
  id_inventario: number;
  nombre: string;
  id_sede: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: EstadoInventario;
  observaciones: string | null;
  usuario_registro: number | null;
  sede_nombre?: string | null;
  usuario_registro_nombre?: string | null;
  total_esperados?: number;
  verificados?: number;
  pendientes?: number;
  encontrados?: number;
  no_encontrados?: number;
  cambio_ubicacion?: number;
  observados?: number;
}

export interface InventarioItemDto {
  id: number;
  nombre: string;
  idSede: number | null;
  sedeNombre: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoInventario;
  observaciones: string | null;
  usuarioRegistro: {
    id: number;
    nombre: string;
  } | null;
  totalEsperados: number;
  verificados: number;
  pendientes: number;
  progreso: number;
}

export interface InventarioResumenDto {
  idInventario: number;
  totalEsperados: number;
  verificados: number;
  pendientes: number;
  encontrados: number;
  noEncontrados: number;
  cambioUbicacion: number;
  observados: number;
  progreso: number;
}

export interface InventarioDetalleRow {
  id_inventario_detalle: number;
  id_inventario: number;
  id_activo: number;
  id_ubicacion_esperada: number | null;
  id_ubicacion_encontrada: number | null;
  estado_verificacion: EstadoVerificacion;
  fecha_verificacion: string | null;
  usuario_verificacion: number | null;
  observaciones: string | null;
  codigo_activo: string;
  marca_activo: string | null;
  modelo_activo: string | null;
  serie_activo: string | null;
  tipo_activo: string;
  estado_activo_codigo: string;
  estado_activo_nombre: string;
  ubicacion_esperada_texto: string | null;
  ubicacion_encontrada_texto: string | null;
  usuario_verificacion_nombre: string | null;
}

export interface InventarioDetalleItemDto {
  id: number;
  idInventario: number;
  idActivo: number;
  activo: {
    codigo: string;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
    tipo: string;
    estado: {
      codigo: string;
      nombre: string;
    };
  };
  idUbicacionEsperada: number | null;
  ubicacionEsperada: string | null;
  idUbicacionEncontrada: number | null;
  ubicacionEncontrada: string | null;
  estadoVerificacion: EstadoVerificacion;
  fechaVerificacion: string | null;
  usuarioVerificacion: {
    id: number;
    nombre: string;
  } | null;
  observaciones: string | null;
}
