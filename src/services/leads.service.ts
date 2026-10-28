import { get, patch, post, del } from '@/utils/fetch'
import apiClient from '@/utils/apiClient'

// ─── Tipos del módulo IA de Ventas / Filtro de Leads ────────────────────────

export type EstadoLeadProspecto =
  | 'FRIO'
  | 'TIBIO'
  | 'CALIENTE'
  | 'CONVERTIDO'
  | 'PERDIDO'

export type EstadoLeadConversacion =
  | 'ACTIVA'
  | 'CALIFICADA'
  | 'CERRADA'
  | 'TRANSFERIDA'

export type RolLeadMensaje = 'USUARIO' | 'ASISTENTE' | 'SISTEMA'

export interface LeadProspecto {
  id: number
  empresaId: number
  telefonoProspecto: string
  nombreProspecto: string | null
  puntaje: number
  estado: EstadoLeadProspecto
  presupuesto: number | null
  autoridad: number | null
  necesidad: number | null
  plazo: number | null
  resumen: string | null
  puntosClave: string[]
  proximaAccion: string | null
  botActivo: boolean
  notificadoEn: string | null
  clienteId: number | null
  cotizacionId: number | null
  /** Cotización (COT) que la IA generó desde el chat, si aplica. */
  cotizacion: { id: number; codigo: string } | null
  /** Último anuncio de Facebook/Instagram por el que llegó a escribir. */
  anuncio?: AnuncioDeOrigen | null
  /** Etiquetas que el negocio le puso al chat ("mayorista", "compró perfume"). */
  etiquetas?: EtiquetaLead[]
  conversacionId: number
  creadoEn: string
  actualizadoEn: string
}

/** Claves de la paleta; el backend rechaza cualquier otra. */
export type ColorEtiqueta =
  | 'gris'
  | 'violeta'
  | 'azul'
  | 'verde'
  | 'amarillo'
  | 'naranja'
  | 'rojo'
  | 'rosa'

export interface EtiquetaLead {
  id: number
  nombre: string
  color: ColorEtiqueta
}

/** Etiqueta del catálogo, con cuántos chats la tienen. */
export interface EtiquetaCatalogo extends EtiquetaLead {
  contactos: number
}

export interface AnuncioDeOrigen {
  anuncioId: string
  tipo: string | null
  titulo: string | null
  texto: string | null
  url: string | null
  creadoEn: string
}

export interface LeadConversacion {
  id: number
  telefonoProspecto: string
  nombreProspecto: string | null
  estado: EstadoLeadConversacion
  cantidadMensajes: number
  numeroWhatsappId: string | null
  /** Por qué red escribe: WHATSAPP, INSTAGRAM o MESSENGER. */
  canal?: 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER'
  /** false = alguien tomó el chat y la IA no responde en ESTA conversación. */
  botActivo: boolean
  actualizadoEn: string
  creadoEn: string
  prospecto?: { puntaje: number; estado: EstadoLeadProspecto } | null
  etiquetas?: EtiquetaLead[]
}

export interface LeadMensaje {
  id: number
  rol: RolLeadMensaje
  contenido: string
  esAudio: boolean
  /** Imagen mandada por el vendedor desde el chat del panel. */
  imagenUrl?: string | null
  /** Nota de voz mandada por el vendedor desde el chat del panel (OGG). */
  audioUrl?: string | null
  creadoEn: string
}

export interface LeadConversacionDetalle extends LeadConversacion {
  mensajes: LeadMensaje[]
  prospecto?: LeadProspecto | null
}

export type ResumenProspectos = Record<EstadoLeadProspecto, number>

export interface LeadsConfig {
  iaVentasActiva: boolean
  iaVentasContexto: string
  iaVentasSeguimiento: boolean
  iaVentasCotizacion: boolean
  iaVentasBrochureUrl: string
  /** El negocio entrega demos por rubro (Krezka): se ve la pestaña Demos. */
  tieneDemos?: boolean
  /** La IA ofrece el link de Mercado Pago para pagar lo cotizado. */
  cobroConLink?: boolean
  /** El negocio tiene su Mercado Pago conectado (sin eso no hay link). */
  mpConectado?: boolean
  // ─── "Mi vendedor" ─────────────────────────────────────────────────────────
  // Solo llegan de un servidor que ya tiene la pantalla nueva: que `vendedor`
  // venga en la respuesta es lo que habilita guardarla.
  /** Nombre con el que se presenta ("Ana"). Vacío = habla como el negocio. */
  asesor?: string
  vendedor?: PerfilVendedor
  envio?: ConfigEnvio
  mediosPagoLista?: MedioPago[]
  /**
   * Mensaje al cerrar la conversación: venta cerrada, "lo consulto con mi
   * médico" o reenganche sin respuesta a las 2 h. Sale tal cual.
   */
  despedida?: { activa: boolean; texto: string }
  /**
   * La tienda física, para quien dice que va a ir. Al agendar la visita se le
   * manda la ubicación, la foto de la fachada y las indicaciones.
   */
  tienda?: ConfigTienda
}

export interface ConfigTienda {
  direccion: string
  /** Link de Google Maps que pegó el dueño. */
  mapsUrl: string
  /** Las saca el servidor del link; null = el link no las trae y va como enlace. */
  lat: number | null
  lng: number | null
  indicaciones: string
  fotoUrl: string
  /** Plano para llegar adentro (mercado, galería). Va antes que la foto. */
  croquisUrl?: string
}

export type TipoImagenTienda = 'foto' | 'croquis'

/** Del 1 (muy conciso) al 5 (muy detallado). */
export type LongitudRespuesta = 1 | 2 | 3 | 4 | 5

export type CategoriaConocimiento =
  | 'PRODUCTOS'
  | 'HORARIOS'
  | 'ENVIOS'
  | 'PAGOS'
  | 'DEVOLUCIONES'
  | 'OTROS'

export interface TemaConocimiento {
  categoria: CategoriaConocimiento
  titulo: string
  texto: string
}

export interface PerfilVendedor {
  audiencia?: string
  reglas?: string
  estiloComunicacion?: string
  estiloVentas?: string
  longitud?: LongitudRespuesta
  emojis?: boolean
  emojisPermitidos?: string[]
  signosApertura?: boolean
  palabrasEvitar?: string[]
  mensajeBienvenida?: string
  mensajeDerivacion?: string
  conocimiento?: TemaConocimiento[]
}

export type TipoZona = 'DOMICILIO' | 'AGENCIA' | 'RECOJO'

export interface LugarZona {
  nombre: string
  /** Como lo escribe la gente ("SJL"). El panel no los edita pero los conserva. */
  alias?: string[]
}

export interface ZonaEnvio {
  nombre: string
  tipo: TipoZona
  tarifa: number
  lugares?: LugarZona[]
  notaPago?: string
  courier?: string
}

export interface ConfigEnvio {
  zonas: ZonaEnvio[]
  zonaPorDefecto: string
}

export interface MedioPago {
  nombre: string
  detalle: string
  titular?: string
}

// ─── Llamadas a la API (todas scoped por empresa del token) ──────────────────

export async function fetchResumen(): Promise<ResumenProspectos> {
  const r = await get<ResumenProspectos>('/leads/prospectos/resumen')
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cargar resumen')
  return r.data
}

export async function fetchProspectos(opts: {
  estado?: EstadoLeadProspecto
  search?: string
}): Promise<LeadProspecto[]> {
  const qs = new URLSearchParams()
  if (opts.estado) qs.set('estado', opts.estado)
  if (opts.search) qs.set('search', opts.search)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const r = await get<LeadProspecto[]>(`/leads/prospectos${suffix}`)
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cargar prospectos')
  return r.data
}

export async function fetchConversaciones(): Promise<LeadConversacion[]> {
  const r = await get<LeadConversacion[]>('/leads/conversaciones')
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cargar conversaciones')
  return r.data
}

// ─── Etiquetas de contactos ─────────────────────────────────────────────────

export async function fetchEtiquetas(): Promise<EtiquetaCatalogo[]> {
  const r = await get<EtiquetaCatalogo[]>('/leads/etiquetas')
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cargar las etiquetas')
  return r.data
}

export async function crearEtiqueta(datos: {
  nombre: string
  color?: ColorEtiqueta
}): Promise<EtiquetaLead> {
  const r = await post<EtiquetaLead>('/leads/etiquetas', datos)
  if (!r.success || !r.data) throw new Error(r.error || 'No se pudo crear la etiqueta')
  return r.data
}

export async function editarEtiqueta(
  id: number,
  datos: { nombre?: string; color?: ColorEtiqueta },
): Promise<EtiquetaLead> {
  const r = await patch<EtiquetaLead>(`/leads/etiquetas/${id}`, datos)
  if (!r.success || !r.data) throw new Error(r.error || 'No se pudo editar la etiqueta')
  return r.data
}

export async function eliminarEtiqueta(id: number): Promise<void> {
  const r = await del(`/leads/etiquetas/${id}`)
  if (!r.success) throw new Error(r.error || 'No se pudo borrar la etiqueta')
}

/**
 * Le pone una etiqueta al chat: una existente o una por nombre, que el
 * servidor crea si no existe (sin duplicar por mayúsculas o tildes).
 * Devuelve las etiquetas con las que quedó el chat.
 */
export async function ponerEtiqueta(
  conversacionId: number,
  datos: { etiquetaId: number } | { nombre: string; color?: ColorEtiqueta },
): Promise<EtiquetaLead[]> {
  const r = await post<EtiquetaLead[]>(`/leads/conversaciones/${conversacionId}/etiquetas`, datos)
  if (!r.success || !r.data) throw new Error(r.error || 'No se pudo poner la etiqueta')
  return r.data
}

export async function quitarEtiqueta(
  conversacionId: number,
  etiquetaId: number,
): Promise<EtiquetaLead[]> {
  const r = await del<EtiquetaLead[]>(
    `/leads/conversaciones/${conversacionId}/etiquetas/${etiquetaId}`,
  )
  if (!r.success || !r.data) throw new Error(r.error || 'No se pudo quitar la etiqueta')
  return r.data
}

/** La conversación de un teléfono con el resumen del prospecto; null si nunca escribió. */
export interface ConversacionDeTelefono {
  id: number
  telefonoProspecto: string
  nombreProspecto: string | null
  actualizadoEn: string
  prospecto: {
    id: number
    estado: EstadoLeadProspecto
    etapa: string
    puntaje: number
    resumen: string | null
    proximaAccion: string | null
    sintomas: string | null
  } | null
}

export async function fetchConversacionPorTelefono(
  telefono: string,
): Promise<ConversacionDeTelefono | null> {
  const r = await get<ConversacionDeTelefono | null>(
    `/leads/conversaciones/por-telefono/${encodeURIComponent(telefono)}`,
  )
  if (!r.success) throw new Error(r.error || 'Error al buscar la conversación')
  return r.data ?? null
}

export async function fetchConversacion(id: number): Promise<LeadConversacionDetalle> {
  const r = await get<LeadConversacionDetalle>(`/leads/conversaciones/${id}`)
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cargar la conversación')
  return r.data
}

export interface BorradoConversacion {
  eliminada: boolean
  telefono: string
  mensajes: number
}

/**
 * Borra la conversación entera. Es lo que permite volver a probar el mismo
 * flujo desde cero: sin esto, cada prueba arrastra el historial de la
 * anterior y no se puede ver otra vez el saludo inicial.
 */
export async function eliminarConversacion(
  id: number,
): Promise<BorradoConversacion> {
  const r = await del<BorradoConversacion>(`/leads/conversaciones/${id}`)
  if (!r.success) throw new Error(r.error || 'No se pudo borrar la conversación')
  return (r.data ?? { eliminada: true, telefono: '', mensajes: 0 })
}

/**
 * Tomar (o devolver) el chat: la IA deja de responder en esta conversación.
 *
 * Va por conversación y no por prospecto porque los chats de prueba del propio
 * negocio no generan prospecto —para no ensuciar el embudo— y eran justo los
 * únicos donde no había manera de apagar la IA.
 */
export async function setBotActivo(
  conversacionId: number,
  activo: boolean,
): Promise<LeadConversacion> {
  const r = await patch<LeadConversacion>(
    `/leads/conversaciones/${conversacionId}/bot`,
    { activo },
  )
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cambiar el bot')
  return r.data
}

export interface EnvioManualResult {
  mensaje: LeadMensaje
  /** true si este envío fue el que pausó la IA (ya estaba pausada => false). */
  botPausado: boolean
}

/**
 * Responde a mano en la conversación, desde el WhatsApp de la empresa.
 * Tomar el chat pausa la IA automáticamente.
 */
export async function enviarMensajeManual(
  conversacionId: number,
  texto: string,
): Promise<EnvioManualResult> {
  const r = await post<EnvioManualResult>(
    `/leads/conversaciones/${conversacionId}/mensaje`,
    { texto },
  )
  if (!r.success || !r.data) throw new Error(r.error || 'No se pudo enviar el mensaje')
  return r.data
}

/**
 * Manda una imagen en la conversación (con pie opcional). Como el texto, toma
 * el chat y pausa la IA.
 */
export async function enviarImagenManual(
  conversacionId: number,
  archivo: File,
  texto?: string,
): Promise<EnvioManualResult> {
  const fd = new FormData()
  fd.append('archivo', archivo)
  if (texto?.trim()) fd.append('texto', texto.trim())
  try {
    const resp = await apiClient.post(`/leads/conversaciones/${conversacionId}/imagen`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const data = resp.data?.data as EnvioManualResult | undefined
    if (!data?.mensaje) throw new Error('No se pudo enviar la imagen')
    return data
  } catch (e: any) {
    throw new Error(e?.response?.data?.message || e?.message || 'No se pudo enviar la imagen')
  }
}

/**
 * Manda una nota de voz grabada en el panel. El servidor la pasa a OGG/Opus
 * para que WhatsApp la muestre como nota de voz. Toma el chat como el texto.
 */
export async function enviarAudioManual(
  conversacionId: number,
  archivo: File,
  segundos?: number,
): Promise<EnvioManualResult> {
  const fd = new FormData()
  fd.append('archivo', archivo)
  if (segundos && segundos > 0) fd.append('duracion', String(Math.round(segundos)))
  try {
    const resp = await apiClient.post(`/leads/conversaciones/${conversacionId}/audio`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const data = resp.data?.data as EnvioManualResult | undefined
    if (!data?.mensaje) throw new Error('No se pudo enviar la nota de voz')
    return data
  } catch (e: any) {
    throw new Error(e?.response?.data?.message || e?.message || 'No se pudo enviar la nota de voz')
  }
}

export interface ConvertirResult {
  cliente: { id: number; nombre: string; nroDoc: string }
  yaExistia: boolean
}

export async function convertirACliente(
  prospectoId: number,
): Promise<ConvertirResult> {
  const r = await post<ConvertirResult>(`/leads/prospectos/${prospectoId}/convertir`, {})
  if (!r.success || !r.data) throw new Error(r.error || 'Error al convertir a cliente')
  return r.data
}

export async function fetchConfig(): Promise<LeadsConfig> {
  const r = await get<LeadsConfig>('/leads/config')
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cargar la configuración')
  return r.data
}

export async function updateConfig(
  data: Partial<LeadsConfig>,
): Promise<LeadsConfig> {
  const r = await patch<LeadsConfig>('/leads/config', data)
  if (!r.success || !r.data) throw new Error(r.error || 'Error al guardar la configuración')
  return r.data
}

/**
 * Sube la foto de la fachada o del stand, o el croquis (JPG/PNG, máx. 5 MB).
 * El servidor ya la deja guardada en la configuración: no hace falta tocar
 * "Guardar".
 */
export async function subirFotoTienda(archivo: File, tipo: TipoImagenTienda = 'foto'): Promise<string> {
  const fd = new FormData()
  fd.append('archivo', archivo)
  try {
    const resp = await apiClient.post(`/leads/tienda-foto${tipo === 'croquis' ? '?tipo=croquis' : ''}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const url = resp.data?.data?.[tipo === 'croquis' ? 'croquisUrl' : 'fotoUrl'] as string | undefined
    if (!url) throw new Error('No se pudo subir la foto')
    return url
  } catch (e: any) {
    throw new Error(e?.response?.data?.message || e?.message || 'No se pudo subir la foto')
  }
}

// ─── Entrenamiento de la IA (RAG) ────────────────────────────────────────────

export type TipoLeadDocumento = 'TEXTO' | 'URL' | 'PDF'
export type EstadoLeadDocumento = 'PENDIENTE' | 'INDEXADO' | 'ERROR'

export interface LeadDocumento {
  id: number
  tipo: TipoLeadDocumento
  titulo: string
  origen: string | null
  estado: EstadoLeadDocumento
  error: string | null
  creadoEn: string
  _count?: { fragmentos: number }
}

export async function fetchDocumentos(): Promise<LeadDocumento[]> {
  const r = await get<LeadDocumento[]>('/leads/entrenamiento')
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cargar documentos')
  return r.data
}

export async function crearDocumento(body: {
  tipo: TipoLeadDocumento
  titulo?: string
  contenido?: string
  url?: string
}): Promise<LeadDocumento> {
  const r = await post<LeadDocumento>('/leads/entrenamiento', body)
  if (!r.success || !r.data) throw new Error(r.error || 'Error al entrenar el documento')
  return r.data
}

/**
 * Reintenta indexar un documento que quedó en error, sin borrarlo ni volver
 * a subirlo. El texto ya está guardado: solo se rehacen los embeddings.
 */
export async function reindexarDocumento(id: number): Promise<LeadDocumento> {
  const r = await post<LeadDocumento>(`/leads/entrenamiento/${id}/reindexar`, {})
  if (!r.success) throw new Error(r.error || 'No se pudo reintentar')
  return r.data as LeadDocumento
}

export async function eliminarDocumento(id: number): Promise<void> {
  const r = await del(`/leads/entrenamiento/${id}`)
  if (!r.success) throw new Error(r.error || 'Error al eliminar el documento')
}

// ─── Banco de prospectos que pidieron demo ────────────────────────────────

export interface LeadDemo {
  id: number
  telefono: string
  nombre: string
  celular: string | null
  correo: string | null
  ruc: string | null
  razonSocial: string | null
  nombreComercial: string | null
  rubro: string | null
  demo: string
  aproximada: boolean
  creadoEn: string
  ultimoMensajeEn: string | null
  seguimiento: {
    estado: 'PROGRAMADO' | 'ENVIADO' | 'CANCELADO' | 'OMITIDO' | 'FALLIDO'
    programadoPara: string
    enviadoEn: string | null
    motivo: string | null
  } | null
  respondioSeguimiento: boolean
}

export async function fetchDemos(): Promise<LeadDemo[]> {
  const r = await get<LeadDemo[]>('/leads/demos')
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cargar las demos')
  return r.data
}
