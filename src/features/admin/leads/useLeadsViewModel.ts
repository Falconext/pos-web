import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAlertStore from '@/zustand/alert'
import { useDebounce } from '@/hooks/useDebounce'
import * as api from '@/services/leads.service'
import type {
  LeadProspecto,
  LeadConversacion,
  LeadConversacionDetalle,
  ResumenProspectos,
  LeadsConfig,
  EstadoLeadProspecto,
  LeadDocumento,
  TipoLeadDocumento,
} from '@/services/leads.service'

const RESUMEN_VACIO: ResumenProspectos = {
  FRIO: 0,
  TIBIO: 0,
  CALIENTE: 0,
  CONVERTIDO: 0,
  PERDIDO: 0,
}

export function useLeadsViewModel() {
  const alertStore = useAlertStore()

  const [config, setConfig] = useState<LeadsConfig>({
    iaVentasActiva: false,
    iaVentasContexto: '',
    iaVentasSeguimiento: true,
    iaVentasCotizacion: false,
    iaVentasBrochureUrl: '',
  })
  const [resumen, setResumen] = useState<ResumenProspectos>(RESUMEN_VACIO)
  const [prospectos, setProspectos] = useState<LeadProspecto[]>([])
  /**
   * Chats que no son leads: las pruebas del propio negocio.
   *
   * Desde que los números internos quedaron fuera del embudo, esas
   * conversaciones no tienen prospecto y por lo tanto no salen en ninguna
   * columna del tablero. Sin esta lista serían invisibles — y quien las creó
   * no podría ni leerlas ni borrarlas.
   */
  const [chatsDePrueba, setChatsDePrueba] = useState<LeadConversacion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)

  // Detalle de conversación (panel lateral tipo chat).
  const [conversacion, setConversacion] = useState<LeadConversacionDetalle | null>(null)
  const [loadingConversacion, setLoadingConversacion] = useState(false)

  // Modal de configuración de la IA.
  const [configOpen, setConfigOpen] = useState(false)
  /**
   * Si la configuración ya llegó del servidor.
   *
   * Hasta que llega, `config` tiene el default —todo apagado— y la pantalla
   * anunciaba en rojo "La IA está desactivada: el bot no responde" en cada
   * carga, aunque estuviera encendida. Dos segundos de una mentira que
   * asusta al dueño del negocio.
   */
  const [configCargada, setConfigCargada] = useState(false)

  // Entrenamiento (RAG).
  const [entrenarOpen, setEntrenarOpen] = useState(false)
  const [ficha360, setFicha360] = useState<string | null>(null)
  const [documentos, setDocumentos] = useState<LeadDocumento[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [guardandoDoc, setGuardandoDoc] = useState(false)

  // Id de la conversación abierta (para el auto-refresco en vivo del chat).
  const convAbiertaRef = useRef<number | null>(null)

  const cargarProspectos = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const [pros, res, convs] = await Promise.all([
        api.fetchProspectos({ search: debouncedSearch || undefined }),
        api.fetchResumen(),
        api.fetchConversaciones().catch(() => [] as LeadConversacion[]),
      ])
      setProspectos(pros)
      setResumen(res)
      setChatsDePrueba(convs.filter((c) => !c.prospecto))
    } catch (e: any) {
      if (!silent) alertStore.alert(e.message || 'Error al cargar prospectos', 'error')
    } finally {
      if (!silent) setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    cargarProspectos()
  }, [cargarProspectos])

  // Auto-refresco en vivo (cada 4s): trae leads nuevos y los mensajes/respuestas
  // de la IA de la conversación abierta sin recargar la página ni mostrar spinner.
  useEffect(() => {
    const t = setInterval(() => {
      cargarProspectos(true)
      const id = convAbiertaRef.current
      if (id != null) {
        api
          .fetchConversacion(id)
          .then((det) =>
            setConversacion((prev) =>
              // Evita parpadeo: solo reemplaza si cambió el nº de mensajes o el prospecto.
              prev &&
              prev.mensajes?.length === det.mensajes?.length &&
              prev.prospecto?.puntaje === det.prospecto?.puntaje
                ? prev
                : det,
            ),
          )
          .catch(() => {})
      }
    }, 4000)
    return () => clearInterval(t)
  }, [cargarProspectos])

  useEffect(() => {
    api
      .fetchConfig()
      .then((c) => {
        setConfig(c)
        setConfigCargada(true)
      })
      .catch(() => {
        /* silencioso: si falla, queda el default off */
      })
  }, [])

  // ─── Acciones ──────────────────────────────────────────────────────────────

  const abrirConversacion = async (conversacionId: number) => {
    convAbiertaRef.current = conversacionId
    setLoadingConversacion(true)
    try {
      const detalle = await api.fetchConversacion(conversacionId)
      setConversacion(detalle)
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al abrir la conversación', 'error')
    } finally {
      setLoadingConversacion(false)
    }
  }

  // Enlace directo a un chat (?conv=ID o ?tel=NUMERO), desde el embudo, la
  // ficha o una notificación. Se consume y se borra de la URL para que
  // cerrar el chat no lo vuelva a abrir.
  const [params, setParams] = useSearchParams()
  const convParam = params.get('conv')
  const telParam = params.get('tel')
  useEffect(() => {
    if (!convParam && !telParam) return
    setParams(
      (prev) => {
        const sig = new URLSearchParams(prev)
        sig.delete('conv')
        sig.delete('tel')
        return sig
      },
      { replace: true },
    )
    if (convParam && Number(convParam) > 0) {
      abrirConversacion(Number(convParam))
      return
    }
    if (telParam) {
      api
        .fetchConversacionPorTelefono(telParam)
        .then((c) => {
          if (c) abrirConversacion(c.id)
          else alertStore.alert('Ese cliente todavía no tiene un chat de WhatsApp.', 'warning')
        })
        .catch((e) => alertStore.alert(e.message || 'No se pudo abrir el chat', 'error'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convParam, telParam])

  const cerrarConversacion = () => {
    convAbiertaRef.current = null
    setConversacion(null)
  }

  const [borrandoChat, setBorrandoChat] = useState(false)

  /**
   * Borra el chat abierto para poder volver a probarlo desde cero.
   *
   * Lo pide quien prueba la IA: hasta ahora cada prueba quedaba pegada y la
   * siguiente arrancaba con el historial de la anterior, así que no se podía
   * volver a ver el saludo inicial ni repetir el mismo flujo.
   *
   * Cierra el chat y recarga el tablero: la tarjeta del prospecto se va con
   * la conversación, y dejarla en pantalla haría creer que el borrado falló.
   */
  const borrarConversacion = async (conversacionId: number) => {
    setBorrandoChat(true)
    try {
      await api.eliminarConversacion(conversacionId)
      cerrarConversacion()
      await cargarProspectos()
      alertStore.alert('Chat borrado. Puedes volver a escribir desde cero.', 'success')
      return true
    } catch (e: any) {
      alertStore.alert(e.message || 'No se pudo borrar el chat', 'error')
      return false
    } finally {
      setBorrandoChat(false)
    }
  }

  /**
   * Tomar el chat (o devolvérselo a la IA).
   *
   * Se identifica por CONVERSACIÓN: los chats de prueba del propio negocio no
   * tienen prospecto —no se califican para no ensuciar el embudo— y eran los
   * únicos donde no aparecía el interruptor, justo los que usa el dueño para
   * probar su bot.
   */
  const toggleBot = async (conversacionId: number, activo: boolean) => {
    try {
      await api.setBotActivo(conversacionId, activo)
      alertStore.alert(
        activo ? 'IA reactivada en este chat' : 'IA pausada — tomaste el chat',
        'success',
      )
      // Refrescar lo que ya está en pantalla: el chat abierto, la lista y los
      // chats de prueba, que se pintan de tres sitios distintos.
      setConversacion((prev) =>
        prev?.id === conversacionId
          ? {
              ...prev,
              botActivo: activo,
              prospecto: prev.prospecto
                ? { ...prev.prospecto, botActivo: activo }
                : prev.prospecto,
            }
          : prev,
      )
      setProspectos((prev) =>
        prev.map((p) =>
          p.conversacionId === conversacionId ? { ...p, botActivo: activo } : p,
        ),
      )
      setChatsDePrueba((prev) =>
        prev.map((c) => (c.id === conversacionId ? { ...c, botActivo: activo } : c)),
      )
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al cambiar el bot', 'error')
    }
  }

  const [enviandoMensaje, setEnviandoMensaje] = useState(false)

  /**
   * Responde a mano en el chat abierto. El mensaje se agrega al historial solo
   * si salió de verdad, y si este envío fue el que tomó el chat, la IA queda
   * pausada también en pantalla.
   */
  const enviarMensajeManual = async (texto: string) => {
    const conv = conversacion
    if (!conv) return false
    const contenido = texto.trim()
    if (!contenido || enviandoMensaje) return false

    setEnviandoMensaje(true)
    try {
      const { mensaje, botPausado } = await api.enviarMensajeManual(conv.id, contenido)
      setConversacion((prev) =>
        prev && prev.id === conv.id
          ? {
              ...prev,
              mensajes: [...prev.mensajes, mensaje],
              cantidadMensajes: prev.cantidadMensajes + 1,
              prospecto: prev.prospecto
                ? { ...prev.prospecto, botActivo: false }
                : prev.prospecto,
            }
          : prev,
      )
      if (botPausado) {
        const prospectoId = conv.prospecto?.id
        if (prospectoId)
          setProspectos((prev) =>
            prev.map((p) => (p.id === prospectoId ? { ...p, botActivo: false } : p)),
          )
        alertStore.alert('Mensaje enviado — IA pausada, tomaste el chat', 'success')
      }
      return true
    } catch (e: any) {
      alertStore.alert(e.message || 'No se pudo enviar el mensaje', 'error')
      return false
    } finally {
      setEnviandoMensaje(false)
    }
  }

  /** Manda una imagen (con pie opcional) o una nota de voz en el chat abierto. */
  const enviarAdjuntoManual = async (
    tipo: 'imagen' | 'audio',
    enviarlo: (conversacionId: number) => Promise<api.EnvioManualResult>,
  ) => {
    const conv = conversacion
    if (!conv || enviandoMensaje) return false
    setEnviandoMensaje(true)
    const nombre = tipo === 'imagen' ? 'Imagen enviada' : 'Nota de voz enviada'
    try {
      const { mensaje, botPausado } = await enviarlo(conv.id)
      setConversacion((prev) =>
        prev && prev.id === conv.id
          ? {
              ...prev,
              mensajes: [...prev.mensajes, mensaje],
              cantidadMensajes: prev.cantidadMensajes + 1,
              prospecto: prev.prospecto
                ? { ...prev.prospecto, botActivo: false }
                : prev.prospecto,
            }
          : prev,
      )
      if (botPausado) {
        const prospectoId = conv.prospecto?.id
        if (prospectoId)
          setProspectos((prev) =>
            prev.map((p) => (p.id === prospectoId ? { ...p, botActivo: false } : p)),
          )
      }
      alertStore.alert(
        botPausado ? `${nombre} — IA pausada, tomaste el chat` : nombre,
        'success',
      )
      return true
    } catch (e: any) {
      alertStore.alert(
        e.message || (tipo === 'imagen' ? 'No se pudo enviar la imagen' : 'No se pudo enviar la nota de voz'),
        'error',
      )
      return false
    } finally {
      setEnviandoMensaje(false)
    }
  }
  const enviarImagenManual = (archivo: File, texto?: string) =>
    enviarAdjuntoManual('imagen', (id) => api.enviarImagenManual(id, archivo, texto))
  const enviarAudioManual = (archivo: File, segundos?: number) =>
    enviarAdjuntoManual('audio', (id) => api.enviarAudioManual(id, archivo, segundos))

  const [convirtiendo, setConvirtiendo] = useState(false)

  const convertirCliente = async (prospectoId: number) => {
    setConvirtiendo(true)
    try {
      const res = await api.convertirACliente(prospectoId)
      alertStore.alert(
        res.yaExistia
          ? 'Este prospecto ya era cliente'
          : `Cliente creado: ${res.cliente.nombre} ✅`,
        'success',
      )
      // Reflejar en el chat abierto y refrescar el kanban.
      setConversacion((prev) =>
        prev?.prospecto?.id === prospectoId
          ? {
              ...prev,
              prospecto: {
                ...prev.prospecto,
                clienteId: res.cliente.id,
                estado: 'CONVERTIDO',
              },
            }
          : prev,
      )
      await cargarProspectos()
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al convertir a cliente', 'error')
    } finally {
      setConvirtiendo(false)
    }
  }

  const guardarConfig = async (data: Partial<LeadsConfig>) => {
    alertStore.load(true)
    try {
      const actualizado = await api.updateConfig(data)
      setConfig(actualizado)
      alertStore.alert('Configuración de la IA guardada', 'success')
      setConfigOpen(false)
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al guardar la configuración', 'error')
    } finally {
      alertStore.load(false)
    }
  }

  /** Vuelve a leer la configuración (p. ej. tras subir la foto de la tienda, que el servidor ya guardó). */
  const recargarConfig = async () => {
    try {
      setConfig(await api.fetchConfig())
    } catch {
      /* silencioso: queda la que había */
    }
  }

  const toggleIaVentas = async (activa: boolean) => {
    // Optimista: refleja el switch de inmediato.
    setConfig((c) => ({ ...c, iaVentasActiva: activa }))
    try {
      const actualizado = await api.updateConfig({ iaVentasActiva: activa })
      setConfig(actualizado)
      alertStore.alert(
        activa ? 'IA de ventas activada' : 'IA de ventas desactivada',
        'success',
      )
    } catch (e: any) {
      setConfig((c) => ({ ...c, iaVentasActiva: !activa })) // revertir
      alertStore.alert(e.message || 'Error al cambiar el estado de la IA', 'error')
    }
  }

  // ─── Entrenamiento (RAG) ─────────────────────────────────────────────────

  const abrirEntrenar = async () => {
    setEntrenarOpen(true)
    setLoadingDocs(true)
    try {
      setDocumentos(await api.fetchDocumentos())
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al cargar documentos', 'error')
    } finally {
      setLoadingDocs(false)
    }
  }

  const crearDocumento = async (body: {
    tipo: TipoLeadDocumento
    titulo?: string
    contenido?: string
    url?: string
  }): Promise<boolean> => {
    setGuardandoDoc(true)
    try {
      const doc = await api.crearDocumento(body)
      setDocumentos((prev) => [doc, ...prev])
      alertStore.alert(
        doc.estado === 'INDEXADO'
          ? 'Documento entrenado ✅'
          : 'Documento guardado, indexando…',
        doc.estado === 'ERROR' ? 'error' : 'success',
      )
      return true
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al entrenar el documento', 'error')
      return false
    } finally {
      setGuardandoDoc(false)
    }
  }

  /**
   * Reintenta indexar un documento que quedó en error. Antes la única salida
   * era borrarlo y volver a subirlo, y con un PDF largo eso es rehacer el
   * trabajo por un fallo que casi siempre es pasajero.
   */
  const reindexarDocumento = async (id: number) => {
    try {
      const doc = await api.reindexarDocumento(id)
      setDocumentos((prev) => prev.map((d) => (d.id === id ? doc : d)))
      alertStore.alert(
        doc.estado === 'INDEXADO'
          ? 'Documento entrenado'
          : 'Reintentando… si vuelve a fallar, revisa la cuota de Gemini',
        doc.estado === 'INDEXADO' ? 'success' : 'warning',
      )
    } catch (e: any) {
      alertStore.alert(
        e?.response?.data?.message ?? e?.message ?? 'No se pudo reintentar',
        'error',
      )
    }
  }

  const eliminarDocumento = async (id: number) => {
    try {
      await api.eliminarDocumento(id)
      setDocumentos((prev) => prev.filter((d) => d.id !== id))
      alertStore.alert('Documento eliminado', 'success')
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al eliminar', 'error')
    }
  }

  // Agrupar prospectos por estado para el kanban.
  const porEstado = (estado: EstadoLeadProspecto): LeadProspecto[] =>
    prospectos.filter((p) => p.estado === estado)

  return {
    config,
    resumen,
    prospectos,
    isLoading,
    search,
    setSearch,
    conversacion,
    loadingConversacion,
    borrandoChat,
    chatsDePrueba,
    configOpen,
    configCargada,
    setConfigOpen,
    entrenarOpen,
    setEntrenarOpen,
    /// Teléfono cuya ficha 360° está abierta. Vive acá y no en la vista
    /// porque se abre desde dos sitios: el tablero del embudo y el chat.
    ficha360,
    setFicha360,
    documentos,
    loadingDocs,
    guardandoDoc,
    convirtiendo,
    enviandoMensaje,
    porEstado,
    actions: {
      recargar: cargarProspectos,
      abrirConversacion,
      cerrarConversacion,
      borrarConversacion,
      toggleBot,
      enviarMensajeManual,
      enviarImagenManual,
      enviarAudioManual,
      convertirCliente,
      guardarConfig,
      recargarConfig,
      toggleIaVentas,
      abrirEntrenar,
      crearDocumento,
      eliminarDocumento,
      reindexarDocumento,
    },
  }
}
