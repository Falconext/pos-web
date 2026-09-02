import type { EstadoLeadProspecto } from '@/services/leads.service'

/** Metadatos visuales por estado de prospecto (kanban + badges). */
export interface EstadoMeta {
  label: string
  icon: string
  /** Clases para el punto/acento del estado. */
  dot: string
  /** Clases para el badge (fondo + texto). */
  badge: string
  /** Clases para el encabezado de la columna del kanban. */
  header: string
}

export const ESTADOS_KANBAN: EstadoLeadProspecto[] = [
  'FRIO',
  'TIBIO',
  'CALIENTE',
  'CONVERTIDO',
  'PERDIDO',
]

export const ESTADO_META: Record<EstadoLeadProspecto, EstadoMeta> = {
  FRIO: {
    label: 'Frío',
    icon: 'solar:snowflake-bold',
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    header: 'text-sky-600 dark:text-sky-400',
  },
  TIBIO: {
    label: 'Tibio',
    icon: 'solar:bolt-bold',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    header: 'text-amber-600 dark:text-amber-400',
  },
  CALIENTE: {
    label: 'Caliente',
    icon: 'solar:fire-bold',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    header: 'text-rose-600 dark:text-rose-400',
  },
  CONVERTIDO: {
    label: 'Convertido',
    icon: 'solar:check-circle-bold',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    header: 'text-emerald-600 dark:text-emerald-400',
  },
  PERDIDO: {
    label: 'Perdido',
    icon: 'solar:close-circle-bold',
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    header: 'text-gray-500 dark:text-gray-400',
  },
}

/** Color del puntaje BANT (0-100). */
export function colorPuntaje(p: number): string {
  if (p >= 71) return 'text-rose-600 dark:text-rose-400'
  if (p >= 41) return 'text-amber-600 dark:text-amber-400'
  return 'text-sky-600 dark:text-sky-400'
}

/** Nombre a mostrar del prospecto (nombre o teléfono). */
export function nombreVisible(nombre: string | null, telefono: string): string {
  return nombre?.trim() || telefono
}

/** Iniciales para el avatar. */
export function iniciales(nombre: string | null, telefono: string): string {
  const base = nombre?.trim() || telefono
  const partes = base.split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase()
  return base.slice(-2).toUpperCase()
}
