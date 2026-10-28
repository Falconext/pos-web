import { get, post, patch, del } from '@/utils/fetch'
import apiClient from '@/utils/apiClient'

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

// ─── Plantillas ─────────────────────────────────────────────────────────────

export type EstadoPlantilla = 'BORRADOR' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'PAUSADA' | 'DESACTIVADA'
export type CategoriaPlantilla = 'MARKETING' | 'UTILITY'
export type TipoCabecera = 'NINGUNA' | 'TEXTO' | 'IMAGEN'

export interface BotonPlantilla {
  tipo: 'RESPUESTA' | 'URL'
  texto: string
  url?: string
}

export interface DatosPlantilla {
  titulo: string
  categoria: CategoriaPlantilla
  cabeceraTipo: TipoCabecera
  cabeceraTexto?: string | null
  cabeceraImagenUrl?: string | null
  cuerpo: string
  pie?: string | null
  botones: BotonPlantilla[]
  ejemplos: { dato1?: string; dato2?: string }
}

export interface Plantilla {
  id: number
  titulo: string
  nombreMeta: string
  categoria: CategoriaPlantilla
  cabeceraTipo: TipoCabecera
  cabeceraTexto: string | null
  cabeceraImagenUrl: string | null
  cuerpo: string
  pie: string | null
  botonesJson: BotonPlantilla[] | null
  ejemplosJson: { dato1?: string; dato2?: string } | null
  estado: EstadoPlantilla
  motivoRechazo: string | null
  enviadaEn: string | null
  revisadaEn: string | null
  actualizadoEn: string
}

export function datosDePlantilla(p: Plantilla): DatosPlantilla {
  return {
    titulo: p.titulo,
    categoria: p.categoria,
    cabeceraTipo: p.cabeceraTipo,
    cabeceraTexto: p.cabeceraTexto,
    cabeceraImagenUrl: p.cabeceraImagenUrl,
    cuerpo: p.cuerpo,
    pie: p.pie,
    botones: p.botonesJson ?? [],
    ejemplos: p.ejemplosJson ?? {},
  }
}

export async function fetchPlantillas() {
  return datos(await get<Plantilla[]>('/leads/plantillas'), 'No se pudieron cargar las plantillas')
}

export async function validarPlantilla(plantilla: DatosPlantilla) {
  return datos(
    await post<{ errores: string[]; vistaPrevia: string; pie: string | null }>('/leads/plantillas/validar', { plantilla }),
    'No se pudo revisar la plantilla',
  )
}

export async function guardarPlantilla(plantilla: DatosPlantilla, id?: number) {
  const r = id
    ? await patch<Plantilla>(`/leads/plantillas/${id}`, { plantilla })
    : await post<Plantilla>('/leads/plantillas', { plantilla })
  return datos(r, 'No se pudo guardar la plantilla')
}

export async function enviarPlantillaARevision(id: number) {
  return datos(await post<Plantilla>(`/leads/plantillas/${id}/enviar`, {}), 'No se pudo enviar a Meta')
}

export async function sincronizarPlantilla(id: number) {
  return datos(await post<Plantilla>(`/leads/plantillas/${id}/sincronizar`, {}), 'No se pudo consultar a Meta')
}

export async function duplicarPlantilla(id: number) {
  return datos(await post<Plantilla>(`/leads/plantillas/${id}/duplicar`, {}), 'No se pudo duplicar')
}

export async function eliminarPlantilla(id: number) {
  const r = await del(`/leads/plantillas/${id}`)
  if (!r.success) throw new Error(r.error || 'No se pudo borrar la plantilla')
}

export async function subirImagenPlantilla(archivo: File): Promise<string> {
  const fd = new FormData()
  fd.append('archivo', archivo)
  try {
    const resp = await apiClient.post('/leads/plantillas/imagen', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return resp.data?.data?.url
  } catch (e: any) {
    throw new Error(e?.response?.data?.message || 'No se pudo subir la imagen')
  }
}

// ─── Envíos ─────────────────────────────────────────────────────────────────

export type EstadoEnvio = 'PROGRAMADO' | 'ENVIANDO' | 'TERMINADO' | 'CANCELADO'
export type EstadoDestinatario = 'PROGRAMADO' | 'ENVIADO' | 'OMITIDO' | 'FALLIDO' | 'CANCELADO'

export interface ConteosEnvio {
  total: number
  pendientes: number
  enviados: number
  omitidos: number
  fallidos: number
  cancelados: number
}

export interface EnvioResumen {
  id: number
  nombre: string
  estado: EstadoEnvio
  programadoPara: string
  iniciadoEn: string | null
  terminadoEn: string | null
  porMinuto: number
  nota: string | null
  plantilla: { id: number; titulo: string }
  conteos: ConteosEnvio
  /** Lo que avisa Meta y lo que hizo el cliente después. */
  resultados?: ResultadosEnvio
  creadoEn: string
}

export interface ResultadosEnvio {
  entregados: number
  leidos: number
  respondieron: number
  /** Solo en el detalle. */
  compraron?: number
  ventas?: number
}

export interface DestinatarioEnvio {
  id: number
  telefono: string
  conversacionId: number | null
  nombre: string | null
  canal: CanalEnvio
  estado: EstadoDestinatario
  motivo: string | null
  enviadoEn: string | null
  entregadoEn: string | null
  leidoEn: string | null
  textoEnviado: string | null
  respondio: boolean
  /** Monto comprado dentro de los 7 días, o null. */
  compra: number | null
}

export interface EnvioDetalle extends EnvioResumen {
  plantillaJson: DatosPlantilla & { titulo: string; nombreMeta: string }
  valores: { dato1?: string; dato2?: string } | null
  filtros: FiltrosSegmento
  destinatarios: DestinatarioEnvio[]
}

export interface NuevoEnvio {
  nombre?: string
  segmentoId?: number
  filtros?: FiltrosSegmento
  plantillaId: number
  valores?: { dato1?: string; dato2?: string }
  programadoPara?: string | null
  porMinuto?: number
}

export async function fetchEnvios() {
  return datos(await get<EnvioResumen[]>('/leads/envios'), 'No se pudieron cargar los envíos')
}

export async function fetchEnvio(id: number, estado?: EstadoDestinatario) {
  return datos(
    await get<EnvioDetalle>(`/leads/envios/${id}${estado ? `?estado=${estado}` : ''}`),
    'No se pudo cargar el envío',
  )
}

export async function crearEnvio(e: NuevoEnvio) {
  return datos(await post<EnvioDetalle>('/leads/envios', e), 'No se pudo programar el envío')
}

export async function cancelarEnvio(id: number) {
  return datos(await post<EnvioDetalle>(`/leads/envios/${id}/cancelar`, {}), 'No se pudo detener el envío')
}

export async function probarEnvio(plantillaId: number, valores?: { dato1?: string; dato2?: string }) {
  return datos(
    await post<{ resultados: { telefono: string; ok: boolean; error?: string }[] }>('/leads/envios/prueba', {
      plantillaId,
      valores,
    }),
    'No se pudo mandar la prueba',
  )
}

export async function fetchNivelMensajeria() {
  return datos(await get<{ nivel: number | null }>('/leads/envios/nivel'), 'No se pudo consultar el nivel')
}
