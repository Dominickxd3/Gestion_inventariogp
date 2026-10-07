export interface QrResolvedActivo {
  id: number;
  codigo: string;
  tipo: string;
  tipoCodigo: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  estado: string;
  estadoCodigo: string;
  ubicacion: string | null;
  ubicacionCodigo: string | null;
  responsableActual: {
    id: number;
    dni: string | null;
    nombreCompleto: string;
    cargo: string | null;
    area: string | null;
    sede: string | null;
    asignacionId: number;
    fechaAsignacion: string | null;
  } | null;
  navigation: {
    activoUrl: string;
    asignacionesUrl: string;
    mantenimientoUrl: string;
    inventarioUrl: string;
  };
}

export interface QrGenerationResult {
  token: string;
  url: string;
  codigoActivo: string;
  dataUrl: string;
  svg: string;
  activo: {
    id: number;
    codigo: string;
    tipo: string;
    marca: string | null;
    modelo: string | null;
    estado: string;
  };
}
