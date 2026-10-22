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

/**
 * Fondo pastel del avatar, fijo por teléfono: el mismo cliente sale siempre del
 * mismo color y la lista no es un muro de círculos iguales.
 */
const PASTELES = [
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
]

export function colorAvatar(telefono: string): string {
  let h = 0
  for (const c of telefono) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PASTELES[h % PASTELES.length]
}

/** Vistas del módulo: cada una es una página con su entrada en el menú lateral. */
export type VistaLeads = 'conversaciones' | 'embudo' | 'analitica' | 'avisos' | 'demos' | 'vendedor'

export const VISTA_POR_RUTA: Record<string, VistaLeads> = {
  chats: 'conversaciones',
  embudo: 'embudo',
  analitica: 'analitica',
  avisos: 'avisos',
  demos: 'demos',
  vendedor: 'vendedor',
}

export const VISTA_META: Record<VistaLeads, { titulo: string; descripcion: string }> = {
  conversaciones: {
    titulo: 'Chats',
    descripcion: 'Las conversaciones de WhatsApp que atiende tu asesor IA, con la ficha de cada cliente.',
  },
  embudo: {
    titulo: 'Embudo',
    descripcion: 'Cada pedido por etapa: desde el primer mensaje hasta la cotización, el pago y la entrega.',
  },
  analitica: {
    titulo: 'Analítica',
    descripcion: 'Lo que tus clientes piden y no tienes, conversión, ticket promedio y quién te compra.',
  },
  avisos: {
    titulo: 'Avisos',
    descripcion: 'Los mensajes que salen solos a tus clientes: qué está por salir, qué salió y qué no salió y por qué.',
  },
  vendedor: {
    titulo: 'Mi vendedor',
    descripcion: 'Cómo habla, qué sabe y cómo cobra tu asesor de WhatsApp.',
  },
  demos: {
    titulo: 'Demos',
    descripcion: 'Prospectos que pidieron una demo del sistema.',
  },
}

// Secciones de inserción rápida para el contexto (texto plano — la IA lo consume tal cual).
export const SECCIONES_CONTEXTO: { label: string; icon: string; snippet: string }[] = [
  { label: 'Qué vendemos', icon: 'solar:box-bold-duotone', snippet: 'QUÉ VENDEMOS:\n- ' },
  { label: 'Precios', icon: 'solar:tag-price-bold-duotone', snippet: 'PRECIOS:\n- Producto/plan: S/00 (qué incluye)\n- ' },
  { label: 'Planes', icon: 'solar:layers-bold-duotone', snippet: 'PLANES:\n- Básico: ...\n- Pro: ...\n' },
  { label: 'FAQs', icon: 'solar:question-circle-bold-duotone', snippet: 'PREGUNTAS FRECUENTES:\n- ¿...? R: ...\n- ' },
  { label: 'Objeciones', icon: 'solar:shield-warning-bold-duotone', snippet: 'OBJECIONES Y RESPUESTAS:\n- "Es caro" → ...\n- ' },
  { label: 'Tono', icon: 'solar:chat-round-line-bold-duotone', snippet: 'TONO Y ESTILO: cercano, profesional, respuestas cortas. Nunca inventes precios ni prometas lo que no existe.\n' },
  { label: 'Horario', icon: 'solar:clock-circle-bold-duotone', snippet: 'HORARIO DE ATENCIÓN: Lun-Sáb 9am-7pm. Fuera de horario, avisa que responderás pronto.\n' },
]

export const PLANTILLA_CONTEXTO = `NEGOCIO: (nombre y a qué se dedica)

QUÉ VENDEMOS: (productos o servicios principales)

PRECIOS:
- ...

OBJETIVO DE LA IA: calificar al prospecto y llevarlo a (comprar / agendar demo / dejar sus datos).

PREGUNTAS FRECUENTES:
- ¿...? R: ...

OBJECIONES:
- "..." → ...

TONO: cercano, profesional, respuestas cortas. Nunca inventes precios ni prometas lo que no existe.`
