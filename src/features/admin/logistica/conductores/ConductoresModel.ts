export interface IConductor {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  celular?: string;
  email?: string;
  nroLicencia?: string;
  tipoLicencia?: string;
  vencimientoLicencia?: string; // ISO
  tipoEmpleo?: string;
  scoreGps?: number;
  activo: boolean;
  estado: string;
  lat?: number;
  lng?: number;
  creadoEn: string;
}

export const ESTADOS_CONDUCTOR = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'green' },
  { value: 'EN_RUTA', label: 'En Ruta', color: 'blue' },
  { value: 'INACTIVO', label: 'Inactivo', color: 'gray' }
];

export const TIPOS_LICENCIA = [
  { value: 'A-I', label: 'A-I' },
  { value: 'A-IIa', label: 'A-IIa' },
  { value: 'A-IIb', label: 'A-IIb' },
  { value: 'A-IIIa', label: 'A-IIIa' },
  { value: 'A-IIIb', label: 'A-IIIb' },
  { value: 'A-IIIc', label: 'A-IIIc' },
  { value: 'B-I', label: 'B-I' },
  { value: 'B-IIa', label: 'B-IIa' },
  { value: 'B-IIb', label: 'B-IIb' },
  { value: 'B-IIc', label: 'B-IIc' }
];

export const TIPOS_EMPLEO = [
  { value: 'PLANILLA', label: 'Planilla' },
  { value: 'RECIBOS', label: 'Recibos por Honorarios' },
  { value: 'TERCERO', label: 'Tercero / Externo' },
  { value: 'EVENTUAL', label: 'Eventual' }
];
