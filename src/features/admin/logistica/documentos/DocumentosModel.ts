export interface IDocumento {
  id: number;
  entidad: string; // VEHICULO | CONDUCTOR
  vehiculoId?: number;
  conductorId?: number;
  tipo: string;
  numero?: string;
  fechaEmision?: string; // ISO
  fechaVencimiento: string; // ISO
  archivoUrl?: string;
  notas?: string;
  creadoEn: string;
  estado?: 'VIGENTE' | 'POR_VENCER' | 'VENCIDO';
  diasRestantes?: number;
  vehiculo?: { id: number; placa: string; marca: string; modelo?: string };
  conductor?: { id: number; nombre: string; apellido: string; dni?: string };
}

export interface IResumenDocumentos {
  total: number;
  vencidos: number;
  porVencer: number;
  vigentes: number;
}

export const ENTIDADES_DOC = [
  { value: 'VEHICULO', label: 'Vehículo' },
  { value: 'CONDUCTOR', label: 'Conductor' },
];

export const TIPOS_DOC_VEHICULO = [
  { value: 'SOAT', label: 'SOAT' },
  { value: 'REVISION_TECNICA', label: 'Revisión Técnica' },
  { value: 'SEGURO', label: 'Seguro Vehicular' },
  { value: 'TARJETA_PROPIEDAD', label: 'Tarjeta de Propiedad' },
  { value: 'PERMISO_CIRCULACION', label: 'Permiso de Circulación' },
  { value: 'CERTIFICADO_GPS', label: 'Certificado GPS' },
];

export const TIPOS_DOC_CONDUCTOR = [
  { value: 'LICENCIA', label: 'Licencia de Conducir' },
  { value: 'DNI', label: 'DNI' },
  { value: 'CARNET_SANIDAD', label: 'Carnet de Sanidad' },
  { value: 'CERTIFICADO_MEDICO', label: 'Certificado Médico' },
  { value: 'ANTECEDENTES', label: 'Antecedentes' },
];

export const ESTADOS_DOC = [
  { value: 'VIGENTE', label: 'Vigente', color: 'green' },
  { value: 'POR_VENCER', label: 'Por vencer', color: 'amber' },
  { value: 'VENCIDO', label: 'Vencido', color: 'rose' },
];

export const BADGE_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

export const labelTipoDoc = (tipo: string): string =>
  [...TIPOS_DOC_VEHICULO, ...TIPOS_DOC_CONDUCTOR].find((t) => t.value === tipo)?.label ?? tipo;
