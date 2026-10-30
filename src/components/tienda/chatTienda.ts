/**
 * Chat de la tienda con la IA de Ventas: reglas puras del widget
 * (ChatTiendaIa.tsx). El servidor es `public/store/:slug/chat`.
 */
import { esRutaDeTiendaPublica } from '@/lib/seoTienda/inyectarSeo'

export interface MensajeChat {
  id: string
  de: 'cliente' | 'tienda'
  tipo: string
  texto: string | null
  url: string | null
  productoId: number | null
  opciones: { id: string; titulo: string; descripcion?: string }[] | null
  clienteId: string | null
  creadoEn: string
  /** Solo los del navegador que el servidor todavía no confirmó. */
  pendiente?: boolean
}

/** En qué tienda y qué producto está mirando, según la URL. */
export function ubicacionEnTienda(pathname: string): { slug: string; productoId: number | null; enCheckout: boolean } | null {
  if (!esRutaDeTiendaPublica(pathname)) return null
  const partes = pathname.split('/').filter(Boolean) // ['tienda', slug, ...]
  const slug = decodeURIComponent(partes[1] || '')
  if (!slug) return null
  const id = partes[2] === 'producto' ? Number(partes[3]) : NaN
  return {
    slug,
    productoId: Number.isInteger(id) && id > 0 ? id : null,
    enCheckout: partes[2] === 'checkout',
  }
}

/** Id de sesión del chat en esta tienda, el mismo al recargar. */
export function sesionDelChat(slug: string): string {
  const clave = `tienda:${slug}:chat`
  try {
    const guardada = localStorage.getItem(clave)
    if (guardada && /^[a-z0-9-]{16,64}$/.test(guardada)) return guardada
  } catch {}
  const nueva =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  try {
    localStorage.setItem(clave, nueva)
  } catch {}
  return nueva
}

/**
 * Lo que vino del servidor + lo enviado que aún no aparece allá. Un mensaje
 * propio deja de estar "pendiente" cuando el servidor lo devuelve con el mismo
 * id que le dio al enviarlo.
 */
export function unirMensajes(servidor: MensajeChat[], pendientes: MensajeChat[]): MensajeChat[] {
  const confirmados = new Set(servidor.map((m) => m.clienteId).filter(Boolean))
  return [...servidor, ...pendientes.filter((p) => !p.clienteId || !confirmados.has(p.clienteId))]
}

export type Trozo = { tipo: 'texto' | 'negrita' | 'enlace'; valor: string }

/**
 * Texto con el formato de WhatsApp (*negrita*) y enlaces, en trozos para
 * pintarlos sin `dangerouslySetInnerHTML`: lo escribe una IA y el cliente.
 */
export function trozosDeTexto(texto: string): Trozo[] {
  const trozos: Trozo[] = []
  const patron = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?])|\*([^*\n]+)\*/g
  let ultimo = 0
  let m: RegExpExecArray | null
  while ((m = patron.exec(texto))) {
    if (m.index > ultimo) trozos.push({ tipo: 'texto', valor: texto.slice(ultimo, m.index) })
    if (m[1]) trozos.push({ tipo: 'enlace', valor: m[1] })
    else trozos.push({ tipo: 'negrita', valor: m[2] })
    ultimo = m.index + m[0].length
  }
  if (ultimo < texto.length) trozos.push({ tipo: 'texto', valor: texto.slice(ultimo) })
  return trozos
}

/** Sugerencias para arrancar, según dónde está. */
export function sugerencias(enProducto: boolean): string[] {
  return enProducto
    ? ['¿Tienen stock de este?', '¿Cuánto cuesta el envío?', '¿Cómo puedo pagar?']
    : ['Busco un producto', '¿Hacen envíos?', '¿Cómo puedo pagar?']
}
