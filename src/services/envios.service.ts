import { get, post, del } from '@/utils/fetch'

// ─── Envíos masivos de la IA de Ventas: segmentos, plantillas y envíos ─────

export type CanalEnvio = 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER'
export type Exclusion = 'BAJA' | 'TOPE' | 'SIN_VENTANA' | 'INTERNO'

export interface FiltrosSegmento {
  etiquetas?: { incluir?: number[]; modo?: 'alguna' | 'todas'; excluir?: number[] }
  temperaturas?: string[]
  etapas?: string[]
  canales?: CanalEnvio[]
  actividad?: { minDias?: number; maxDias?: number }
  compras?: {
    estado?: 'compro' | 'no_compro'
    dias?: number
    productoIds?: number[]
    categoriaIds?: number[]
  }
  consultas?: { productoIds?: number[]; soloNoHabidos?: boolean; dias?: number }
  anuncioIds?: string[]
}

export interface PrevisualizacionSegmento {
  cumplen: number
  recibiran: number
  excluidos: Record<Exclusion, number>
  porCanal: Partial<Record<CanalEnvio, number>>
  muestra: {
    conversacionId: number
    nombre: string | null
    telefono: string
    canal: CanalEnvio
    ultimoMensajeDelCliente: string | null
    /** null = le llega. */
    motivo: string | null
  }[]
}

export interface SegmentoGuardado {
  id: number
  nombre: string
  filtrosJson: FiltrosSegmento
  actualizadoEn: string
}

export interface OpcionesSegmento {
  etapas: string[]
  anuncios: { id: string; titulo: string; contactos: number }[]
  categorias: { id: number; nombre: string }[]
}

export interface ProductoBuscado {
  id: number
  descripcion: string
}

function datos<T>(r: { success: boolean; data?: T; error?: string }, error: string): T {
  if (!r.success || r.data === undefined) throw new Error(r.error || error)
  return r.data
}

export async function previsualizarSegmento(filtros: FiltrosSegmento) {
  return datos(
    await post<PrevisualizacionSegmento>('/leads/segmentos/previsualizar', { filtros }),
    'No se pudo calcular el segmento',
  )
}

export async function fetchSegmentos() {
  return datos(await get<SegmentoGuardado[]>('/leads/segmentos'), 'No se pudieron cargar los segmentos')
}

export async function guardarSegmento(s: { id?: number; nombre: string; filtros: FiltrosSegmento }) {
  return datos(await post<SegmentoGuardado>('/leads/segmentos', s), 'No se pudo guardar el segmento')
}

export async function eliminarSegmento(id: number) {
  const r = await del(`/leads/segmentos/${id}`)
  if (!r.success) throw new Error(r.error || 'No se pudo borrar el segmento')
}

export async function fetchOpcionesSegmento() {
  return datos(await get<OpcionesSegmento>('/leads/segmentos/opciones'), 'No se pudieron cargar las opciones')
}

export async function buscarProductos(q: string) {
  return datos(
    await get<ProductoBuscado[]>(`/leads/segmentos/productos?q=${encodeURIComponent(q)}`),
    'No se pudo buscar productos',
  )
}

/** Nombres de productos ya elegidos (al abrir un segmento guardado). */
export async function productosPorId(ids: number[]) {
  if (!ids.length) return []
  return datos(
    await get<ProductoBuscado[]>(`/leads/segmentos/productos?ids=${ids.join(',')}`),
    'No se pudieron cargar los productos',
  )
}
