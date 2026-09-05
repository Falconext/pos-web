import { useState, useEffect, useCallback, useRef } from 'react'
import useAlertStore from '@/zustand/alert'
import { useDebounce } from '@/hooks/useDebounce'
import * as api from '@/services/leads.service'
import type {
  LeadProspecto,
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
  const [isLoading, setIsLoading] = useState(false)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)

  // Detalle de conversación (panel lateral tipo chat).
  const [conversacion, setConversacion] = useState<LeadConversacionDetalle | null>(null)
  const [loadingConversacion, setLoadingConversacion] = useState(false)

  // Modal de configuración de la IA.
  const [configOpen, setConfigOpen] = useState(false)

  // Entrenamiento (RAG).
  const [entrenarOpen, setEntrenarOpen] = useState(false)
  const [documentos, setDocumentos] = useState<LeadDocumento[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [guardandoDoc, setGuardandoDoc] = useState(false)

  // Id de la conversación abierta (para el auto-refresco en vivo del chat).
  const convAbiertaRef = useRef<number | null>(null)

  const cargarProspectos = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const [pros, res] = await Promise.all([
        api.fetchProspectos({ search: debouncedSearch || undefined }),
        api.fetchResumen(),
      ])
      setProspectos(pros)
      setResumen(res)
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
      .then(setConfig)
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

  const cerrarConversacion = () => {
    convAbiertaRef.current = null
    setConversacion(null)
  }

  const toggleBot = async (prospectoId: number, activo: boolean) => {
    try {
      await api.setBotActivo(prospectoId, activo)
      alertStore.alert(
        activo ? 'IA reactivada en este chat' : 'IA pausada — tomaste el chat',
        'success',
      )
      // Refrescar el prospecto en memoria (lista + detalle abierto).
      setProspectos((prev) =>
        prev.map((p) => (p.id === prospectoId ? { ...p, botActivo: activo } : p)),
      )
      setConversacion((prev) =>
        prev?.prospecto?.id === prospectoId
          ? { ...prev, prospecto: { ...prev.prospecto, botActivo: activo } }
          : prev,
      )
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al cambiar el bot', 'error')
    }
  }

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
    configOpen,
    setConfigOpen,
    entrenarOpen,
    setEntrenarOpen,
    documentos,
    loadingDocs,
    guardandoDoc,
    convirtiendo,
    porEstado,
    actions: {
      recargar: cargarProspectos,
      abrirConversacion,
      cerrarConversacion,
      toggleBot,
      convertirCliente,
      guardarConfig,
      toggleIaVentas,
      abrirEntrenar,
      crearDocumento,
      eliminarDocumento,
    },
  }
}
