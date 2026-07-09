export interface IConductor {
  id: number;
  nombre: string;
  apellido: string;
  nroDocumento: string;
  tipoDocumento: string;
  licenciaNro?: string;
  licenciaVencimiento?: string;
  telefono?: string;
  scoreGps?: number;
  activo: boolean;
  estado: string; // 'DISPONIBLE', 'EN_RUTA', 'INACTIVO'
  lat?: number;
  lng?: number;
  creadoEn: string;
}

export const ESTADOS_CONDUCTOR = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'green' },
  { value: 'EN_RUTA', label: 'En Ruta', color: 'blue' },
  { value: 'INACTIVO', label: 'Inactivo', color: 'gray' }
];
