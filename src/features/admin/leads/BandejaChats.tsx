import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { ESTADO_META, colorPuntaje, nombreVisible, iniciales } from './LeadsModel'
import type { LeadProspecto, LeadConversacion } from '@/services/leads.service'

/**
 * Bandeja de conversaciones en tres columnas: lista, chat y ficha del cliente.
 *
 * Antes el chat se abría en un cajón flotante sobre un tablero kanban. Eso traía
 * tres problemas que se ven apenas se usa un rato: el tablero repetía lo que ya
 * muestra la pestaña Embudo; había que cerrar un chat para abrir otro; y la
 * ficha del cliente se abría en OTRO cajón que quedaba tapado por el primero.
 *
 * Con las tres columnas a la vista, saltar entre conversaciones es un clic y la
 * ficha deja de ser un modal: está siempre al costado, que es donde se mira
 * mientras se lee el chat.
 *
 * La columna derecha se esconde por debajo de 1280px y la lista por debajo de
 * 1024px, para que en una tablet quede el chat, que es lo que importa.
 */

export interface BandejaProps {
  prospectos: LeadProspecto[]
  chatsDePrueba: LeadConversacion[]
  conversacionAbiertaId: number | null
  cargando: boolean
  busqueda: string
  onBuscar: (v: string) => void
  onAbrir: (conversacionId: number) => void
  onVerHistorial: (telefono: string) => void
  chat: React.ReactNode
  prospectoActivo: LeadProspecto | null
}

type Filtro = 'todos' | 'pausados' | 'calientes'

/** Lo que el layout deja de aire debajo del contenido (p-5 de AdminLayout). */
const AIRE_ABAJO = 20

/**
 * Alto para que la bandeja llegue justo al borde de la ventana.
 *
 * Se mide la posición real del elemento en vez de restar una constante al
 * 100vh: encima de la bandeja hay un título, unas pestañas y a veces el aviso
 * de suscripción, así que cualquier número fijo sobra o falta — sobraba, y
 * quedaba una franja muerta abajo.
 */
function useAltoHastaElBorde() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [alto, setAlto] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const medir = () => {
      const el = ref.current
      if (!el) return
      const arriba = el.getBoundingClientRect().top
      setAlto(Math.max(360, window.innerHeight - arriba - AIRE_ABAJO))
    }
    medir()
    window.addEventListener('resize', medir)
    // Lo de arriba puede crecer después del primer render (el aviso de
    // suscripción llega por API): volver a medir cuando eso pase.
    const obs = new ResizeObserver(medir)
    if (ref.current?.parentElement) obs.observe(ref.current.parentElement)
    return () => {
      window.removeEventListener('resize', medir)
      obs.disconnect()
    }
  }, [])

  return { ref, alto }
}

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'calientes', label: 'Calientes' },
  { id: 'pausados', label: 'En pausa' },
]

/** "hace 5 min", "hace 2 h", "hace 3 d" — como cualquier bandeja de mensajes. */
function haceCuanto(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d} d` : `${Math.floor(d / 7)} sem`
}

function FilaConversacion({
  p,
  activa,
  onAbrir,
}: {
  p: LeadProspecto
  activa: boolean
  onAbrir: () => void
}) {
  const meta = ESTADO_META[p.estado]
  // El resumen de la IA dice más que el último mensaje suelto: "quiere 3
  // frascos, pregunta por envío a Arequipa" contra "ok".
  const resumen = p.proximaAccion || p.resumen || p.telefonoProspecto

  return (
    <button
      type="button"
      onClick={onAbrir}
      className={`flex w-full gap-3 border-l-[3px] px-3 py-3 text-left transition-colors ${
        activa
          ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-500/10'
          : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <span className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-xs font-bold text-white">
        {iniciales(p.nombreProspecto, p.telefonoProspecto)}
        {!p.botActivo && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 ring-2 ring-white dark:ring-[#111827]"
            title="IA en pausa"
          >
            <Icon icon="solar:pause-bold" width={9} className="text-white" />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-bold text-gray-900 dark:text-white">
            {nombreVisible(p.nombreProspecto, p.telefonoProspecto)}
          </span>
          <span className="flex-none text-[10px] text-gray-500 dark:text-gray-400">
            {haceCuanto(p.actualizadoEn)}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] text-gray-600 dark:text-gray-400">
          {resumen}
        </span>
        <span className="mt-1.5 flex items-center gap-1.5">
          {meta && (
            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${meta.badge}`}>
              <Icon icon={meta.icon} width={9} />
              {meta.label}
            </span>
          )}
          <span className={`text-[10px] font-black ${colorPuntaje(p.puntaje)}`}>{p.puntaje}</span>
        </span>
      </span>
    </button>
  )
}

/** Barra de un criterio BANT, igual que en la tarjeta del embudo. */
function Barra({ label, valor, max }: { label: string; valor: number | null; max: number }) {
  const pct = Math.round(((valor ?? 0) / max) * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-[10px] font-bold tabular-nums text-gray-700 dark:text-gray-300">
          {valor ?? 0}/{max}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-violet-500 motion-safe:transition-[width] motion-safe:duration-500"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

function FichaLateral({
  p,
  prueba,
  onVerHistorial,
}: {
  p: LeadProspecto | null
  /** El chat abierto cuando no tiene lead detrás (una prueba del negocio). */
  prueba: LeadConversacion | null
  onVerHistorial: (telefono: string) => void
}) {
  if (!p) {
    // Un chat de prueba no tiene BANT que mostrar, pero tampoco merece una
    // columna vacía al lado: se explica por qué no se califica, que es
    // exactamente lo que pregunta quien lo ve por primera vez.
    if (prueba) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <Icon
            icon="solar:test-tube-bold-duotone"
            width={34}
            className="text-gray-400 opacity-60"
          />
          <p className="text-[13px] font-bold text-gray-900 dark:text-white">
            {nombreVisible(prueba.nombreProspecto, prueba.telefonoProspecto)}
          </p>
          <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">
            {prueba.telefonoProspecto}
          </p>
          <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
            Este número es del negocio, así que la IA le responde pero no lo
            califica ni lo cuenta como lead. Sirve para probar sin ensuciar el
            embudo.
          </p>
        </div>
      )
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-gray-500 dark:text-gray-400">
        <Icon icon="solar:user-id-bold-duotone" width={34} className="opacity-30" />
        <p className="text-xs">Abre una conversación para ver la ficha del cliente</p>
      </div>
    )
  }
  const meta = ESTADO_META[p.estado]

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-5">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-lg font-bold text-white">
          {iniciales(p.nombreProspecto, p.telefonoProspecto)}
        </span>
        <p className="mt-2.5 text-[15px] font-bold text-gray-900 dark:text-white">
          {nombreVisible(p.nombreProspecto, p.telefonoProspecto)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{p.telefonoProspecto}</p>
        {meta && (
          <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.badge}`}>
            <Icon icon={meta.icon} width={11} />
            {meta.label}
          </span>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-gray-100 p-3 dark:border-slate-800">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Puntaje BANT
          </span>
          <span className={`text-xl font-black tabular-nums ${colorPuntaje(p.puntaje)}`}>{p.puntaje}</span>
        </div>
        <div className="mt-3 space-y-2.5">
          <Barra label="Presupuesto" valor={p.presupuesto} max={30} />
          <Barra label="Autoridad" valor={p.autoridad} max={20} />
          <Barra label="Necesidad" valor={p.necesidad} max={25} />
          <Barra label="Plazo" valor={p.plazo} max={25} />
        </div>
      </div>

      {p.proximaAccion && (
        <div className="mt-3 rounded-xl bg-violet-50 p-3 dark:bg-violet-900/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            Próxima acción
          </p>
          <p className="mt-1 text-xs leading-relaxed text-violet-900 dark:text-violet-200">{p.proximaAccion}</p>
        </div>
      )}

      {p.resumen && (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Resumen</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-700 dark:text-gray-300">{p.resumen}</p>
        </div>
      )}

      {p.puntosClave?.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Puntos clave
          </p>
          <ul className="mt-1.5 space-y-1">
            {p.puntosClave.map((t, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <Icon icon="solar:check-circle-bold" width={12} className="mt-0.5 flex-none text-violet-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {p.cotizacion && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800/40 dark:bg-emerald-900/20">
          <Icon icon="solar:bill-list-bold-duotone" width={16} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            Cotización {p.cotizacion.codigo}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => onVerHistorial(p.telefonoProspecto)}
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
      >
        <Icon icon="solar:clipboard-list-bold-duotone" width={14} />
        Ver su historial de compras
      </button>
    </div>
  )
}

export function BandejaChats({
  prospectos,
  chatsDePrueba,
  conversacionAbiertaId,
  cargando,
  busqueda,
  onBuscar,
  onAbrir,
  onVerHistorial,
  chat,
  prospectoActivo,
}: BandejaProps) {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const { ref, alto } = useAltoHastaElBorde()

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return prospectos
      .filter((p) => {
        if (filtro === 'pausados' && p.botActivo) return false
        if (filtro === 'calientes' && p.puntaje < 70) return false
        if (!q) return true
        return (
          (p.nombreProspecto || '').toLowerCase().includes(q) ||
          p.telefonoProspecto.includes(q)
        )
      })
      .sort((a, b) => +new Date(b.actualizadoEn) - +new Date(a.actualizadoEn))
  }, [prospectos, busqueda, filtro])

  const enPausa = prospectos.filter((p) => !p.botActivo).length

  return (
    <div
      ref={ref}
      style={{ height: alto }}
      className="grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_290px] dark:border-slate-800 dark:bg-[#111827]">

      {/* ── Columna 1: la lista ── */}
      <aside
        className={`min-h-0 flex-col border-r border-gray-100 dark:border-slate-800 lg:flex ${
          conversacionAbiertaId ? 'hidden' : 'flex'
        }`}
      >
        <div className="border-b border-gray-100 px-3 py-3 dark:border-slate-800">
          <div className="relative">
            <Icon
              icon="solar:magnifer-linear"
              width={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={busqueda}
              onChange={(e) => onBuscar(e.target.value)}
              placeholder="Buscar nombre o teléfono…"
              aria-label="Buscar conversación"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="mt-2 flex gap-1">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                aria-pressed={filtro === f.id}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  filtro === f.id
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
                {f.id === 'pausados' && enPausa > 0 && (
                  <span className="ml-1 tabular-nums opacity-70">{enPausa}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 divide-y divide-gray-50 overflow-y-auto dark:divide-slate-800/60">
          {cargando ? (
            <div className="flex justify-center py-10 text-gray-400">
              <Icon icon="svg-spinners:180-ring" width={24} />
            </div>
          ) : lista.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-gray-500 dark:text-gray-400">
              <Icon icon="solar:chat-round-line-linear" width={28} className="opacity-40" />
              <p className="text-xs">
                {prospectos.length === 0 ? 'Todavía no hay conversaciones' : 'Ninguna coincide'}
              </p>
            </div>
          ) : (
            lista.map((p) => (
              <FilaConversacion
                key={p.id}
                p={p}
                activa={p.conversacionId === conversacionAbiertaId}
                onAbrir={() => onAbrir(p.conversacionId)}
              />
            ))
          )}

          {/* Los chats del propio negocio van al final y rotulados: son pruebas,
              no clientes, y mezclarlos con el embudo fue justo lo que se vino a
              arreglar. Pero tienen que poder abrirse y borrarse. */}
          {chatsDePrueba.length > 0 && (
            <div className="bg-gray-50/60 px-3 py-2.5 dark:bg-slate-900/40">
              <p className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Icon icon="solar:test-tube-bold-duotone" width={11} />
                Pruebas · no son leads
              </p>
              {chatsDePrueba.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onAbrir(c.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                    c.id === conversacionAbiertaId
                      ? 'bg-violet-100 dark:bg-violet-500/20'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon icon="mdi:whatsapp" width={12} className="flex-none text-[#25D366]" />
                  <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-gray-700 dark:text-gray-300">
                    {nombreVisible(c.nombreProspecto, c.telefonoProspecto)}
                  </span>
                  <span className="flex-none text-[10px] tabular-nums text-gray-400">
                    {c.cantidadMensajes}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Columna 2: el chat ── */}
      <section
        className={`min-h-0 flex-col bg-white dark:bg-[#111827] lg:flex ${
          conversacionAbiertaId ? 'flex' : 'hidden'
        }`}
      >
        {chat}
      </section>

      {/* ── Columna 3: la ficha ── */}
      <aside className="hidden min-h-0 border-l border-gray-100 xl:block dark:border-slate-800">
        <FichaLateral
          p={prospectoActivo}
          prueba={
            !prospectoActivo
              ? (chatsDePrueba.find((c) => c.id === conversacionAbiertaId) ?? null)
              : null
          }
          onVerHistorial={onVerHistorial}
        />
      </aside>
    </div>
  )
}
