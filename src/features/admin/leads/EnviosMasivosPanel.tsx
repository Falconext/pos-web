import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import useAlertStore from '@/zustand/alert'
import { fetchEtiquetas, type EtiquetaCatalogo } from '@/services/leads.service'
import {
  cancelarEnvio,
  crearEnvio,
  datosDePlantilla,
  fetchEnvio,
  fetchEnvios,
  fetchNivelMensajeria,
  fetchOpcionesSegmento,
  fetchPlantillas,
  fetchSegmentos,
  probarEnvio,
  type EnvioDetalle,
  type EnvioResumen,
  type EstadoDestinatario,
  type EstadoEnvio,
  type FiltrosSegmento,
  type OpcionesSegmento,
  type Plantilla,
  type PrevisualizacionSegmento,
  type SegmentoGuardado,
} from '@/services/envios.service'
import { SegmentoEditor, VistaPreviaSegmento, cuantosFiltros } from './SegmentoEditor'
import { BurbujaWhatsapp } from './PlantillasPanel'
import { canalDe, nombreVisible, rutaAlChat } from './LeadsModel'

/**
 * Envíos masivos: la lista, el asistente para armar uno nuevo y el detalle
 * con lo que salió, lo que no salió y por qué.
 */

const ESTADO_ENVIO: Record<EstadoEnvio, { label: string; clase: string; icono: string }> = {
  PROGRAMADO: { label: 'Programado', clase: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300', icono: 'solar:calendar-linear' },
  ENVIANDO: { label: 'Enviando', clase: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', icono: 'svg-spinners:pulse-2' },
  TERMINADO: { label: 'Terminado', clase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icono: 'solar:check-circle-bold' },
  CANCELADO: { label: 'Detenido', clase: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300', icono: 'solar:stop-circle-linear' },
}

const ESTADO_DEST: Record<EstadoDestinatario, { label: string; clase: string }> = {
  PROGRAMADO: { label: 'Pendiente', clase: 'text-sky-600 dark:text-sky-300' },
  ENVIADO: { label: 'Enviado', clase: 'text-emerald-600 dark:text-emerald-300' },
  OMITIDO: { label: 'No se envió', clase: 'text-gray-500 dark:text-gray-400' },
  FALLIDO: { label: 'Falló', clase: 'text-red-600 dark:text-red-400' },
  CANCELADO: { label: 'Detenido', clase: 'text-gray-500 dark:text-gray-400' },
}

const fecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })
    : '—'

function ChipEstadoEnvio({ estado }: { estado: EstadoEnvio }) {
  const m = ESTADO_ENVIO[estado]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.clase}`}>
      <Icon icon={m.icono} width={12} />
      {m.label}
    </span>
  )
}

function Progreso({ c }: { c: EnvioResumen['conteos'] }) {
  const hechos = c.total - c.pendientes
  const pct = c.total ? Math.round((hechos / c.total) * 100) : 0
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[11.5px] text-gray-500 dark:text-gray-400">
        <b className="text-gray-800 dark:text-gray-200">{c.enviados}</b> enviados
        {c.pendientes > 0 && <> · {c.pendientes} pendientes</>}
        {c.omitidos + c.cancelados > 0 && <> · {c.omitidos + c.cancelados} no se enviaron</>}
        {c.fallidos > 0 && <> · <span className="text-red-600 dark:text-red-400">{c.fallidos} fallaron</span></>}
      </p>
    </div>
  )
}

// ─── Lista ───────────────────────────────────────────────────────────────────

function ListaEnvios({ onNuevo, onAbrir }: { onNuevo: () => void; onAbrir: (id: number) => void }) {
  const { alert } = useAlertStore()
  const [envios, setEnvios] = useState<EnvioResumen[] | null>(null)

  const cargar = useCallback(() => {
    fetchEnvios()
      .then(setEnvios)
      .catch((e) => alert(e.message, 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    if (!envios?.some((e) => e.estado === 'ENVIANDO' || e.estado === 'PROGRAMADO')) return
    const t = setInterval(cargar, 8000)
    return () => clearInterval(t)
  }, [envios, cargar])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-gray-500 dark:text-gray-400">
          Cada envío respeta las bajas, el tope de mensajes comerciales y el horario de tus avisos.
        </p>
        <button
          type="button"
          onClick={onNuevo}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gray-900 px-4 text-[13px] font-semibold text-white hover:bg-black dark:bg-white dark:text-gray-900"
        >
          <Icon icon="solar:plain-2-linear" width={16} />
          Nuevo envío
        </button>
      </div>

      {envios === null ? (
        <div className="flex justify-center py-12 text-gray-400">
          <Icon icon="svg-spinners:180-ring" width={24} />
        </div>
      ) : envios.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-slate-700">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">
            <Icon icon="solar:plain-2-bold-duotone" width={28} />
          </span>
          <p className="text-[15px] font-bold text-gray-900 dark:text-white">Todavía no hiciste envíos</p>
          <p className="max-w-md text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
            Elige a quién (por ejemplo, los que compraron perfume), una plantilla aprobada por Meta y cuándo. Las
            respuestas llegan a tus chats y las atiende tu asesor IA.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {envios.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onAbrir(e.id)}
              className="rounded-2xl border border-gray-200/70 bg-white p-4 text-left transition hover:border-gray-300 hover:shadow-sm dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-[14px] font-bold text-gray-900 dark:text-white">{e.nombre}</p>
                <ChipEstadoEnvio estado={e.estado} />
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                <Icon icon="solar:document-text-linear" width={13} />
                {e.plantilla.titulo}
                <span className="text-gray-300 dark:text-slate-600">·</span>
                {fecha(e.iniciadoEn ?? e.programadoPara)}
              </p>
              <div className="mt-3">
                <Progreso c={e.conteos} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Asistente ───────────────────────────────────────────────────────────────

type Paso = 0 | 1 | 2 | 3
const PASOS = ['A quién', 'Qué mensaje', 'Cuándo', 'Confirmar']

const RITMOS = [
  { valor: 15, label: 'Suave', texto: '15 por minuto' },
  { valor: 30, label: 'Normal', texto: '30 por minuto' },
  { valor: 60, label: 'Rápido', texto: '60 por minuto' },
]

/** El valor para un <input type="datetime-local"> en hora de Lima. */
function ahoraLocal(minutos = 60) {
  const d = new Date(Date.now() + minutos * 60_000)
  const lima = new Date(d.toLocaleString('en-US', { timeZone: 'America/Lima' }))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${lima.getFullYear()}-${p(lima.getMonth() + 1)}-${p(lima.getDate())}T${p(lima.getHours())}:${p(lima.getMinutes())}`
}

function NuevoEnvioAsistente({ onCancelar, onCreado }: { onCancelar: () => void; onCreado: (id: number) => void }) {
  const { alert } = useAlertStore()
  const [paso, setPaso] = useState<Paso>(0)
  const [segmentos, setSegmentos] = useState<SegmentoGuardado[]>([])
  const [etiquetas, setEtiquetas] = useState<EtiquetaCatalogo[]>([])
  const [opciones, setOpciones] = useState<OpcionesSegmento | null>(null)
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [nivel, setNivel] = useState<number | null>(null)

  const [segmentoId, setSegmentoId] = useState<number | null>(null)
  const [filtros, setFiltros] = useState<FiltrosSegmento>({})
  const [cuenta, setCuenta] = useState<PrevisualizacionSegmento | null>(null)
  const [plantillaId, setPlantillaId] = useState<number | null>(null)
  const [valores, setValores] = useState<{ dato1?: string; dato2?: string }>({})
  const [cuando, setCuando] = useState<'ahora' | 'programar'>('ahora')
  const [fechaLocal, setFechaLocal] = useState(ahoraLocal())
  const [porMinuto, setPorMinuto] = useState(30)
  const [nombre, setNombre] = useState('')
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [prueba, setPrueba] = useState<{ telefono: string; ok: boolean; error?: string }[] | null>(null)

  useEffect(() => {
    fetchSegmentos().then(setSegmentos).catch(() => undefined)
    fetchEtiquetas().then(setEtiquetas).catch(() => undefined)
    fetchOpcionesSegmento().then(setOpciones).catch(() => undefined)
    fetchPlantillas().then(setPlantillas).catch(() => undefined)
    fetchNivelMensajeria().then((r) => setNivel(r.nivel)).catch(() => undefined)
  }, [])

  const aprobadas = plantillas.filter((p) => p.estado === 'APROBADA')
  const plantilla = aprobadas.find((p) => p.id === plantillaId) ?? null
  const datosPlantilla = plantilla ? datosDePlantilla(plantilla) : null
  const usa = (v: string) => !!plantilla && new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, 'i').test(plantilla.cuerpo)
  const faltanValores = (['dato1', 'dato2'] as const).some((v) => usa(v) && !valores[v]?.trim())

  // La vista previa con los valores reales del envío en vez de los ejemplos.
  const vistaConValores = useMemo(
    () =>
      datosPlantilla
        ? {
            ...datosPlantilla,
            ejemplos: {
              dato1: valores.dato1 || datosPlantilla.ejemplos.dato1,
              dato2: valores.dato2 || datosPlantilla.ejemplos.dato2,
            },
          }
        : null,
    [datosPlantilla, valores],
  )

  const porWhatsapp = cuenta?.porCanal.WHATSAPP ?? 0
  const excede = nivel !== null && porWhatsapp > nivel
  const minutos = cuenta ? Math.max(1, Math.ceil(cuenta.recibiran / porMinuto)) : 0

  const puedeSeguir =
    paso === 0 ? !!cuenta && cuenta.recibiran > 0 :
    paso === 1 ? !!plantilla && !faltanValores :
    paso === 2 ? cuando === 'ahora' || !!fechaLocal :
    !excede

  const elegirSegmento = (s: SegmentoGuardado | null) => {
    setSegmentoId(s?.id ?? null)
    setFiltros(s?.filtrosJson ?? {})
  }

  const mandarPrueba = async () => {
    if (!plantilla) return
    setOcupado('prueba')
    try {
      const r = await probarEnvio(plantilla.id, valores)
      setPrueba(r.resultados)
    } catch (e: any) {
      alert(e.message, 'error')
    } finally {
      setOcupado(null)
    }
  }

  const confirmar = async () => {
    if (!plantilla) return
    setOcupado('confirmar')
    try {
      // El datetime-local está en hora de Lima: se le agrega el -05:00.
      const programadoPara = cuando === 'programar' ? `${fechaLocal}:00-05:00` : null
      const e = await crearEnvio({
        nombre: nombre.trim() || undefined,
        ...(segmentoId ? { segmentoId } : { filtros }),
        plantillaId: plantilla.id,
        valores,
        programadoPara,
        porMinuto,
      })
      alert(cuando === 'ahora' ? 'Envío en marcha' : 'Envío programado', 'success')
      onCreado(e.id)
    } catch (e: any) {
      alert(e.message, 'error')
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Pasos */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="mr-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={14} />
          Envíos
        </button>
        {PASOS.map((p, i) => (
          <button
            key={p}
            type="button"
            disabled={i > paso}
            onClick={() => setPaso(i as Paso)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition ${
              i === paso
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : i < paso
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-gray-500'
            }`}
            aria-current={i === paso ? 'step' : undefined}
          >
            <span className="tabular-nums">{i < paso ? '✓' : i + 1}</span>
            {p}
          </button>
        ))}
      </div>

      {paso === 0 && (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-3">
            <div className="rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
              <p className="mb-2 text-[13.5px] font-bold text-gray-900 dark:text-white">Segmento</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => elegirSegmento(null)}
                  aria-pressed={segmentoId === null}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${segmentoId === null ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300'}`}
                >
                  Armar ahora
                </button>
                {segmentos.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => elegirSegmento(s)}
                    aria-pressed={segmentoId === s.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${segmentoId === s.id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300'}`}
                  >
                    <Icon icon="solar:users-group-rounded-linear" width={13} />
                    {s.nombre}
                    <span className="opacity-60">{cuantosFiltros(s.filtrosJson)}</span>
                  </button>
                ))}
              </div>
              {segmentoId !== null && (
                <p className="mt-2 text-[12px] text-gray-500 dark:text-gray-400">
                  Usas el segmento guardado tal como está. Para cambiarlo, elige «Armar ahora».
                </p>
              )}
            </div>
            {segmentoId === null && (
              <SegmentoEditor filtros={filtros} onCambiar={setFiltros} etiquetas={etiquetas} opciones={opciones} />
            )}
          </div>
          <div>
            <div className="xl:sticky xl:top-4">
              <VistaPreviaSegmento filtros={filtros} onResultado={setCuenta} />
            </div>
          </div>
        </div>
      )}

      {paso === 1 && (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-3">
            {aprobadas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center dark:border-slate-700">
                <p className="text-[14px] font-bold text-gray-900 dark:text-white">No tienes plantillas aprobadas</p>
                <p className="mt-1 text-[12.5px] text-gray-500 dark:text-gray-400">
                  Escribe una en la pestaña Plantillas y mándala a revisión de Meta.
                </p>
                <Link
                  to="/administrador/leads/envios?tab=plantillas"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2 text-[12.5px] font-semibold text-white dark:bg-white dark:text-gray-900"
                >
                  Ir a Plantillas
                </Link>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {aprobadas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPlantillaId(p.id)
                      setPrueba(null)
                    }}
                    aria-pressed={plantillaId === p.id}
                    className={`rounded-2xl border p-3 text-left transition ${
                      plantillaId === p.id
                        ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-slate-800'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-[#111827]'
                    }`}
                  >
                    <p className="text-[13.5px] font-bold text-gray-900 dark:text-white">{p.titulo}</p>
                    <p className="mt-1 line-clamp-2 text-[12px] text-gray-500 dark:text-gray-400">{p.cuerpo}</p>
                  </button>
                ))}
              </div>
            )}

            {plantilla && (usa('dato1') || usa('dato2')) && (
              <div className="space-y-3 rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
                <p className="text-[13.5px] font-bold text-gray-900 dark:text-white">Completa el mensaje</p>
                {(['dato1', 'dato2'] as const).filter(usa).map((v) => (
                  <label key={v} className="block">
                    <span className="mb-1 block text-[12.5px] font-semibold text-gray-700 dark:text-gray-300">{`{{${v}}}`}</span>
                    <input
                      value={valores[v] ?? ''}
                      onChange={(e) => setValores((prev) => ({ ...prev, [v]: e.target.value }))}
                      maxLength={100}
                      placeholder={datosPlantilla?.ejemplos[v] ? `ej. ${datosPlantilla.ejemplos[v]}` : ''}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </label>
                ))}
              </div>
            )}

            {plantilla && (
              <div className="rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[13.5px] font-bold text-gray-900 dark:text-white">Mándate una prueba</p>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">
                      Llega a los números del negocio (tu celular y los números internos de Mi vendedor).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={mandarPrueba}
                    disabled={!!ocupado || faltanValores}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
                  >
                    <Icon icon={ocupado === 'prueba' ? 'svg-spinners:180-ring' : 'solar:smartphone-linear'} width={15} />
                    Mandar prueba
                  </button>
                </div>
                {prueba && (
                  <ul className="mt-2 space-y-1">
                    {prueba.map((r) => (
                      <li key={r.telefono} className={`flex items-center gap-1.5 text-[12.5px] ${r.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
                        <Icon icon={r.ok ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} width={14} />
                        {r.telefono} {r.ok ? '— enviada' : `— ${r.error}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div>
            <div className="space-y-2 xl:sticky xl:top-4">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">Así le llega</p>
              {vistaConValores ? (
                <BurbujaWhatsapp d={vistaConValores} />
              ) : (
                <p className="text-[12.5px] text-gray-500 dark:text-gray-400">Elige una plantilla.</p>
              )}
              <p className="text-[11.5px] text-gray-500 dark:text-gray-400">«María» es un ejemplo: a cada cliente le llega su nombre.</p>
            </div>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="max-w-2xl space-y-3">
          <div className="rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
            <p className="mb-2 text-[13.5px] font-bold text-gray-900 dark:text-white">Cuándo</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {(['ahora', 'programar'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCuando(c)}
                  aria-pressed={cuando === c}
                  className={`flex-1 rounded-xl border p-3 text-left ${cuando === c ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-slate-800' : 'border-gray-200 dark:border-slate-700'}`}
                >
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{c === 'ahora' ? 'Ahora' : 'Programar'}</p>
                  <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
                    {c === 'ahora' ? 'Empieza en el próximo minuto.' : 'Elige día y hora (Lima).'}
                  </p>
                </button>
              ))}
            </div>
            {cuando === 'programar' && (
              <input
                type="datetime-local"
                value={fechaLocal}
                onChange={(e) => setFechaLocal(e.target.value)}
                aria-label="Fecha y hora del envío"
                className="mt-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13.5px] text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            )}
            <p className="mt-3 text-[12px] text-gray-500 dark:text-gray-400">
              Se envía solo dentro del horario de tus avisos. Si se hace tarde, sigue al día siguiente a la hora de abrir.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
            <p className="mb-2 text-[13.5px] font-bold text-gray-900 dark:text-white">Ritmo</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {RITMOS.map((r) => (
                <button
                  key={r.valor}
                  type="button"
                  onClick={() => setPorMinuto(r.valor)}
                  aria-pressed={porMinuto === r.valor}
                  className={`flex-1 rounded-xl border p-3 text-left ${porMinuto === r.valor ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-slate-800' : 'border-gray-200 dark:border-slate-700'}`}
                >
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{r.label}</p>
                  <p className="text-[11.5px] text-gray-500 dark:text-gray-400">{r.texto}</p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-gray-500 dark:text-gray-400">
              Más lento cuida la calificación de tu número y te deja atender las respuestas a medida que llegan.
            </p>
          </div>
        </div>
      )}

      {paso === 3 && cuenta && plantilla && (
        <div className="grid max-w-4xl gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3 rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-semibold text-gray-700 dark:text-gray-300">Nombre del envío</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={80}
                placeholder={`${plantilla.titulo} · ${new Date().toLocaleDateString('es-PE')}`}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13.5px] text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <dl className="divide-y divide-gray-100 text-[13px] dark:divide-slate-800">
              {[
                ['Recibirán', `${cuenta.recibiran} contactos${cuenta.cumplen > cuenta.recibiran ? ` (de ${cuenta.cumplen}; ${cuenta.cumplen - cuenta.recibiran} quedan fuera por baja, tope o canal)` : ''}`],
                ['Por WhatsApp', `${porWhatsapp}${nivel ? ` · tu número puede escribirle a ${nivel.toLocaleString('es-PE')} por día` : ''}`],
                ['Plantilla', plantilla.titulo],
                ['Cuándo', cuando === 'ahora' ? 'Ahora' : new Date(`${fechaLocal}:00-05:00`).toLocaleString('es-PE', { timeZone: 'America/Lima' })],
                ['Duración aproximada', `${minutos} min (${porMinuto} por minuto)`],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-wrap justify-between gap-2 py-2">
                  <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
                  <dd className="text-right font-semibold text-gray-900 dark:text-white">{v}</dd>
                </div>
              ))}
            </dl>
            {excede && (
              <p className="rounded-xl bg-red-50 p-3 text-[12.5px] text-red-800 dark:bg-red-900/20 dark:text-red-200">
                Son más contactos de WhatsApp de los que tu número puede escribir en un día. Divide el segmento (por
                ejemplo, por etiqueta) o espera a que Meta suba tu nivel.
              </p>
            )}
            <p className="rounded-xl bg-gray-50 p-3 text-[12px] leading-relaxed text-gray-600 dark:bg-slate-800/60 dark:text-gray-300">
              Meta cobra cada mensaje de plantilla de WhatsApp a tu cuenta de WhatsApp Business, según su tarifa para
              Perú. Por Instagram y Messenger no tiene costo, pero solo llega a quien te escribió en las últimas 24 h.
            </p>
          </div>
          {vistaConValores && <BurbujaWhatsapp d={vistaConValores} />}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4 dark:border-slate-800">
        {paso > 0 && (
          <button
            type="button"
            onClick={() => setPaso((paso - 1) as Paso)}
            className="min-h-[42px] rounded-xl px-4 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
          >
            Atrás
          </button>
        )}
        {paso < 3 ? (
          <button
            type="button"
            disabled={!puedeSeguir}
            onClick={() => setPaso((paso + 1) as Paso)}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gray-900 px-5 text-[13px] font-semibold text-white hover:bg-black disabled:opacity-40 dark:bg-white dark:text-gray-900"
          >
            Siguiente
            <Icon icon="solar:alt-arrow-right-linear" width={15} />
          </button>
        ) : (
          <button
            type="button"
            disabled={!puedeSeguir || !!ocupado}
            onClick={confirmar}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-emerald-600 px-5 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            <Icon icon={ocupado === 'confirmar' ? 'svg-spinners:180-ring' : 'solar:plain-2-bold'} width={16} />
            {cuando === 'ahora' ? `Enviar a ${cuenta?.recibiran ?? 0}` : 'Programar envío'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Detalle ─────────────────────────────────────────────────────────────────

function DetalleEnvio({ id, onVolver }: { id: number; onVolver: () => void }) {
  const { alert } = useAlertStore()
  const [envio, setEnvio] = useState<EnvioDetalle | null>(null)
  const [filtro, setFiltro] = useState<EstadoDestinatario | undefined>()
  const [confirmarDetener, setConfirmarDetener] = useState(false)

  const cargar = useCallback(() => {
    fetchEnvio(id, filtro)
      .then(setEnvio)
      .catch((e) => alert(e.message, 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, filtro])

  useEffect(() => {
    cargar()
  }, [cargar])

  const vivo = envio?.estado === 'ENVIANDO' || envio?.estado === 'PROGRAMADO'
  useEffect(() => {
    if (!vivo) return
    const t = setInterval(cargar, 5000)
    return () => clearInterval(t)
  }, [vivo, cargar])

  const detener = async () => {
    try {
      setEnvio(await cancelarEnvio(id))
      setConfirmarDetener(false)
      alert('Envío detenido', 'success')
    } catch (e: any) {
      alert(e.message, 'error')
    }
  }

  if (!envio) {
    return (
      <div className="flex justify-center py-12 text-gray-400">
        <Icon icon="svg-spinners:180-ring" width={24} />
      </div>
    )
  }

  const c = envio.conteos
  const filtros: { id?: EstadoDestinatario; label: string; n: number }[] = [
    { label: 'Todos', n: c.total },
    { id: 'ENVIADO', label: 'Enviados', n: c.enviados },
    { id: 'PROGRAMADO', label: 'Pendientes', n: c.pendientes },
    { id: 'OMITIDO', label: 'No se enviaron', n: c.omitidos },
    { id: 'FALLIDO', label: 'Fallaron', n: c.fallidos },
    { id: 'CANCELADO', label: 'Detenidos', n: c.cancelados },
  ]

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
      >
        <Icon icon="solar:alt-arrow-left-linear" width={14} />
        Envíos
      </button>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">{envio.nombre}</h2>
                  <ChipEstadoEnvio estado={envio.estado} />
                </div>
                <p className="mt-1 text-[12.5px] text-gray-500 dark:text-gray-400">
                  {envio.plantilla.titulo} · {envio.estado === 'PROGRAMADO' ? `sale el ${fecha(envio.programadoPara)}` : `empezó ${fecha(envio.iniciadoEn)}`}
                  {envio.terminadoEn && ` · terminó ${fecha(envio.terminadoEn)}`} · {envio.porMinuto} por minuto
                </p>
              </div>
              {vivo &&
                (confirmarDetener ? (
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={() => setConfirmarDetener(false)} className="rounded-xl px-3 py-2 text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800">
                      Seguir enviando
                    </button>
                    <button type="button" onClick={detener} className="rounded-xl bg-red-600 px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-red-700">
                      Sí, detener
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmarDetener(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-[12.5px] font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
                  >
                    <Icon icon="solar:stop-circle-linear" width={16} />
                    Detener envío
                  </button>
                ))}
            </div>
            {envio.nota && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">{envio.nota}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Enviados', c.enviados, 'text-emerald-600 dark:text-emerald-300'],
                ['Pendientes', c.pendientes, 'text-sky-600 dark:text-sky-300'],
                ['No se enviaron', c.omitidos + c.cancelados, 'text-gray-700 dark:text-gray-200'],
                ['Fallaron', c.fallidos, 'text-red-600 dark:text-red-400'],
              ].map(([k, v, cl]) => (
                <div key={k as string} className="rounded-xl bg-gray-50 p-3 dark:bg-slate-800/50">
                  <p className="text-[11.5px] text-gray-500 dark:text-gray-400">{k}</p>
                  <p className={`text-[22px] font-black tabular-nums ${cl}`}>{v as number}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Progreso c={c} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/70 bg-white dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-3 pt-3 dark:border-slate-800">
              {filtros.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFiltro(f.id)}
                  aria-pressed={filtro === f.id}
                  className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[12.5px] font-semibold ${
                    filtro === f.id ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                  }`}
                >
                  {f.label} <span className="tabular-nums opacity-60">{f.n}</span>
                </button>
              ))}
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {envio.destinatarios.map((d) => {
                const canal = canalDe(d.telefono)
                return (
                  <li key={d.id} className="flex items-start gap-3 px-4 py-3">
                    <Icon icon={canal.icono} width={16} className={`mt-0.5 flex-none ${canal.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">
                        {nombreVisible(d.nombre, d.telefono)}
                      </p>
                      {d.motivo && <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">{d.motivo}</p>}
                    </div>
                    <div className="flex flex-none flex-col items-end gap-1">
                      <span className={`text-[12px] font-semibold ${ESTADO_DEST[d.estado].clase}`}>{ESTADO_DEST[d.estado].label}</span>
                      {d.enviadoEn && <span className="text-[11px] tabular-nums text-gray-400">{fecha(d.enviadoEn)}</span>}
                    </div>
                    {d.conversacionId && (
                      <Link
                        to={rutaAlChat({ conversacionId: d.conversacionId })}
                        aria-label={`Ir al chat de ${nombreVisible(d.nombre, d.telefono)}`}
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800"
                      >
                        <Icon icon="solar:chat-round-line-linear" width={16} />
                      </Link>
                    )}
                  </li>
                )
              })}
              {envio.destinatarios.length === 0 && (
                <li className="px-4 py-8 text-center text-[12.5px] text-gray-500 dark:text-gray-400">Nadie en este estado.</li>
              )}
            </ul>
          </div>
        </div>
        <div>
          <div className="space-y-2 xl:sticky xl:top-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">El mensaje</p>
            <BurbujaWhatsapp
              d={{
                ...envio.plantillaJson,
                ejemplos: {
                  dato1: envio.valores?.dato1 ?? envio.plantillaJson.ejemplos?.dato1,
                  dato2: envio.valores?.dato2 ?? envio.plantillaJson.ejemplos?.dato2,
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** La pestaña: lista, asistente o detalle según la URL. */
export function EnviosMasivosPanel() {
  const [params, setParams] = useSearchParams()
  const envioId = Number(params.get('envio')) || null
  const nuevo = params.get('nuevo') === '1'

  const ir = (cambios: Record<string, string | null>) =>
    setParams((prev) => {
      const n = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(cambios)) {
        if (v === null) n.delete(k)
        else n.set(k, v)
      }
      return n
    })

  if (nuevo) {
    return (
      <NuevoEnvioAsistente
        onCancelar={() => ir({ nuevo: null })}
        onCreado={(id) => ir({ nuevo: null, envio: String(id) })}
      />
    )
  }
  if (envioId) return <DetalleEnvio id={envioId} onVolver={() => ir({ envio: null })} />
  return <ListaEnvios onNuevo={() => ir({ nuevo: '1' })} onAbrir={(id) => ir({ envio: String(id) })} />
}
