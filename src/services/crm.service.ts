/**
 * E — CRM de la IA de ventas: embudo, BI y 360° por cliente.
 *
 * Los tipos espejan lo que devuelve el backend. No se inventan campos: lo
 * que no viene de la API no se pinta, para que la pantalla nunca muestre un
 * número que nadie calculó.
 */
import apiClient from '@/utils/apiClient'

export type EtapaCrm =
  | 'NUEVO'
  | 'DIAGNOSTICADO'
  | 'COTIZADO'
  | 'DATOS_COMPLETOS'
  | 'PENDIENTE_VALIDACION_PAGO'
  | 'POR_DESPACHAR'
  | 'EN_RUTA'
  | 'ENTREGADO'
  | 'REPROGRAMADO'
  | 'FRIO'
  | 'NO_CONTESTA'
  | 'CONSULTADO_NO_HABIDO'

export interface ComprobantePagoLead {
  id: number
  url: string | null
  recibidoEn: string
  validadoEn?: string | null
  validadoPor?: string | null
  rechazadoEn?: string | null
  rechazadoMotivo?: string | null
}

export interface PedidoEnEmbudo {
  id: number
  telefonoProspecto: string
  nombreProspecto: string | null
  etapaEn: string
  puntaje: number
  estado: string
  conversacion?: { id: number } | null
  comprobantesPago: ComprobantePagoLead[]
}

export interface ColumnaEmbudo {
  etapa: EtapaCrm
  etiqueta: string
  total: number
  pedidos: PedidoEnEmbudo[]
}

export interface Tablero {
  pagosPorValidar: number
  columnas: ColumnaEmbudo[]
}

export interface MovimientoEtapa {
  desde: EtapaCrm | null
  hacia: EtapaCrm
  actor: string
  nota: string | null
  creadoEn: string
}

export interface ConteoTexto {
  texto: string
  veces: number
}

export interface ReporteBi {
  productos: {
    disponibles: ConteoTexto[]
    noHabidos: ConteoTexto[]
    totalConsultas: number
    porcentajeSinStock: number
  }
  malestares: ConteoTexto[]
  conversaciones: number
  pedidos: number
  tasaConversion: number
  vendido: number
  ticketPromedio: number
  descuentosOtorgados: number
  pesoDescuentos: number
  porEtapa: { etapa: EtapaCrm; total: number }[]
  demografia: {
    sexo: { hombres: number; mujeres: number; sinDato: number }
    edades: { etiqueta: string; total: number }[]
    ubicacion: { lima: number; provincia: number; recojo: number; sinDato: number }
    topDistritos: { lugar: string; total: number }[]
  }
}

export interface ConsultaCliente {
  texto: string
  tipo: 'PRODUCTO' | 'MALESTAR'
  hubo: boolean
  disponibilidad?: string | null
  creadoEn: string
}

export interface Ficha360 {
  cliente: {
    id: number
    telefonoProspecto: string
    nombreProspecto: string | null
    etapa: EtapaCrm
    etapaEn: string
    estado: string
    puntaje: number
    sexo: string | null
    edad: number | null
    resumen: string | null
    puntosClave: string[]
    dni: string | null
    telefonos: string[]
    unidoPorDni: boolean
    conversacionId: number
  }
  pedidos: {
    comprobanteId: number | null
    comprobante: string | null
    monto: number
    descuento: number
    estadoPago: string | null
    fecha: string | null
    destino: string | null
  }[]
  resumenCompras: {
    cantidad: number
    gastado: number
    ticketPromedio: number
    ultimaCompra: string | null
  }
  consultasDeSalud: ConsultaCliente[]
  productosConsultados: ConsultaCliente[]
  noHabidos: ConsultaCliente[]
  historialEtapas: MovimientoEtapa[]
  comprobantesPago: ComprobantePagoLead[]
}

/**
 * Saca el payload del sobre `{ code, message, data }` del backend.
 *
 * Mira si la clave `data` EXISTE, no si tiene valor: con `?? ` un `data: null`
 * legítimo —el 360° de un teléfono desconocido— se devolvía como el sobre
 * entero, que es un objeto y por tanto "verdadero". La pantalla creía tener
 * una ficha y reventaba al leer sus campos en vez de decir "sin historial".
 */
const datos = <T,>(r: { data: unknown }): T => {
  const sobre = r.data
  if (sobre && typeof sobre === 'object' && 'data' in sobre) {
    return (sobre as { data: T }).data
  }
  return sobre as T
}

export const crmService = {
  tablero: (porEtapa = 20) =>
    apiClient
      .get(`/leads/crm/embudo?porEtapa=${porEtapa}`)
      .then(datos<Tablero>),

  mover: (prospectoId: number, etapa: EtapaCrm, nota?: string) =>
    apiClient
      .patch(`/leads/crm/embudo/${prospectoId}`, { etapa, nota })
      .then(datos<{ movido: boolean; etapa: EtapaCrm }>),

  historial: (prospectoId: number) =>
    apiClient
      .get(`/leads/crm/embudo/${prospectoId}/historial`)
      .then(datos<MovimientoEtapa[]>),

  validarPago: (pagoId: number, pasarADespacho = true) =>
    apiClient
      .post(`/leads/crm/pagos/${pagoId}/validar`, { pasarADespacho })
      .then(datos<{ validado: boolean }>),

  rechazarPago: (pagoId: number, motivo: string) =>
    apiClient
      .post(`/leads/crm/pagos/${pagoId}/rechazar`, { motivo })
      .then(datos<{ rechazado: boolean }>),

  bi: (rango?: { desde?: string; hasta?: string }) => {
    const q = new URLSearchParams()
    if (rango?.desde) q.set('desde', rango.desde)
    if (rango?.hasta) q.set('hasta', rango.hasta)
    const qs = q.toString()
    return apiClient
      .get(`/leads/crm/bi${qs ? `?${qs}` : ''}`)
      .then(datos<ReporteBi>)
  },

  ficha360: (telefono: string) =>
    apiClient
      .get(`/leads/crm/cliente/${encodeURIComponent(telefono)}`)
      .then(datos<Ficha360 | null>),

  posiblesDuplicados: (telefono: string) =>
    apiClient
      .get(`/leads/crm/cliente/${encodeURIComponent(telefono)}/posibles-duplicados`)
      .then(datos<{ telefono: string; nombre: string; parecido: number }[]>),
}

/** Nombre y color de cada etapa. El orden es el del anexo del cliente. */
export const ETAPA_META: Record<
  EtapaCrm,
  { label: string; icon: string; acento: string; chip: string }
> = {
  NUEVO: {
    label: 'Nuevo',
    icon: 'solar:chat-round-dots-bold-duotone',
    acento: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  DIAGNOSTICADO: {
    label: 'Diagnosticado',
    icon: 'solar:stethoscope-bold-duotone',
    acento: 'bg-sky-400',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  },
  COTIZADO: {
    label: 'Cotizado',
    icon: 'solar:document-text-bold-duotone',
    acento: 'bg-indigo-400',
    chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
  DATOS_COMPLETOS: {
    label: 'Datos completos',
    icon: 'solar:user-check-rounded-bold-duotone',
    acento: 'bg-violet-400',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  },
  PENDIENTE_VALIDACION_PAGO: {
    label: 'Pago por validar',
    icon: 'solar:wallet-money-bold-duotone',
    acento: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  POR_DESPACHAR: {
    label: 'Por despachar',
    icon: 'solar:box-bold-duotone',
    acento: 'bg-orange-500',
    chip: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  },
  EN_RUTA: {
    label: 'En ruta',
    icon: 'solar:delivery-bold-duotone',
    acento: 'bg-blue-500',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  ENTREGADO: {
    label: 'Entregado',
    icon: 'solar:check-circle-bold-duotone',
    acento: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  REPROGRAMADO: {
    label: 'Reprogramado',
    icon: 'solar:calendar-bold-duotone',
    acento: 'bg-fuchsia-500',
    chip: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
  },
  FRIO: {
    label: 'Frío',
    icon: 'solar:snowflake-bold',
    acento: 'bg-cyan-400',
    chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  },
  NO_CONTESTA: {
    label: 'No contesta',
    icon: 'solar:phone-calling-bold-duotone',
    acento: 'bg-zinc-400',
    chip: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  },
  CONSULTADO_NO_HABIDO: {
    label: 'Pidió algo que no hay',
    icon: 'solar:bag-cross-bold-duotone',
    acento: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
}

/**
 * Etapas a las que una persona puede mover a mano desde el tablero.
 *
 * El backend es el que decide de verdad; esto solo evita ofrecer un botón
 * que va a fallar. EN_RUTA y ENTREGADO no están: los pone la logística
 * cuando el despacho avanza, y ponerlos a mano desincronizaría el envío.
 */
export const ETAPAS_MANUALES: EtapaCrm[] = [
  'NUEVO',
  'DIAGNOSTICADO',
  'COTIZADO',
  'DATOS_COMPLETOS',
  'PENDIENTE_VALIDACION_PAGO',
  'POR_DESPACHAR',
  'REPROGRAMADO',
  'FRIO',
  'NO_CONTESTA',
  'CONSULTADO_NO_HABIDO',
]
