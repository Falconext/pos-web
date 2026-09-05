import { get, patch, post, del } from '@/utils/fetch'

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
  conversacionId: number
  creadoEn: string
  actualizadoEn: string
}

export interface LeadConversacion {
  id: number
  telefonoProspecto: string
  nombreProspecto: string | null
  estado: EstadoLeadConversacion
  cantidadMensajes: number
  numeroWhatsappId: string | null
  actualizadoEn: string
  creadoEn: string
  prospecto?: { puntaje: number; estado: EstadoLeadProspecto } | null
}

export interface LeadMensaje {
  id: number
  rol: RolLeadMensaje
  contenido: string
  esAudio: boolean
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

export async function fetchConversacion(id: number): Promise<LeadConversacionDetalle> {
  const r = await get<LeadConversacionDetalle>(`/leads/conversaciones/${id}`)
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cargar la conversación')
  return r.data
}

export async function setBotActivo(
  prospectoId: number,
  activo: boolean,
): Promise<LeadProspecto> {
  const r = await patch<LeadProspecto>(`/leads/prospectos/${prospectoId}/bot`, {
    activo,
  })
  if (!r.success || !r.data) throw new Error(r.error || 'Error al cambiar el bot')
  return r.data
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

export async function eliminarDocumento(id: number): Promise<void> {
  const r = await del(`/leads/entrenamiento/${id}`)
  if (!r.success) throw new Error(r.error || 'Error al eliminar el documento')
}
