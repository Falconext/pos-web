export interface IMantenimientoVehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo?: string;
}

export interface IMantenimiento {
  id: number;
  vehiculoId: number;
  tipo: string;
  estado: string;
  descripcion: string;
  taller?: string;
  fechaProgramada: string; // ISO
  fechaRealizado?: string; // ISO
  costo: number | string;
  odometroKm?: number;
  proximoMantenimientoKm?: number;
  proximoMantenimientoFecha?: string; // ISO
  evidenciaUrl?: string;
  notas?: string;
  creadoEn: string;
  vehiculo?: IMantenimientoVehiculo;
}

export interface IResumenMantenimiento {
  programados: number;
  enProceso: number;
  completados: number;
  cancelados: number;
  pendientes: number;
  costoTotalCompletados: number;
}

export const TIPOS_MANTENIMIENTO = [
  { value: 'PREVENTIVO', label: 'Preventivo', color: 'blue' },
  { value: 'CORRECTIVO', label: 'Correctivo', color: 'amber' },
  { value: 'EMERGENCIA', label: 'Emergencia', color: 'rose' },
  { value: 'INSPECCION', label: 'Inspección', color: 'violet' },
];

export const ESTADOS_MANTENIMIENTO = [
  { value: 'PROGRAMADO', label: 'Programado', color: 'blue' },
  { value: 'EN_PROCESO', label: 'En Proceso', color: 'amber' },
  { value: 'COMPLETADO', label: 'Completado', color: 'green' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'gray' },
];

export const BADGE_COLORS: Record<string, string> = {
  green:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  amber:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  violet:
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};
