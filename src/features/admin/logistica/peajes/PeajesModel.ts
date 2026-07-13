export interface IPeaje {
  id: number;
  vehiculoId?: number;
  tipo: string;
  estado: string;
  fecha: string; // ISO
  monto: number | string;
  lugar?: string;
  descripcion?: string;
  placa?: string;
  comprobanteUrl?: string;
  reciboPagoUrl?: string;
  notas?: string;
  creadoEn: string;
  vehiculo?: { id: number; placa: string; marca: string; modelo?: string };
}

export interface IResumenPeaje {
  pendientesCount: number;
  montoPendiente: number;
  montoPagado: number;
  montoTotal: number;
}

export const TIPOS_PEAJE = [
  { value: 'PEAJE', label: 'Peaje', color: 'blue' },
  { value: 'MULTA', label: 'Multa', color: 'rose' },
  { value: 'INFRACCION', label: 'Infracción', color: 'amber' },
];

export const ESTADOS_PEAJE = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'amber' },
  { value: 'PAGADO', label: 'Pagado', color: 'green' },
  { value: 'ANULADO', label: 'Anulado', color: 'gray' },
];

export const BADGE_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};
