import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { ESTADO_META, colorAvatar, colorPuntaje, nombreVisible, iniciales, canalDe, contactoVisible } from './LeadsModel'
import type {
  LeadProspecto,
  LeadConversacion,
  EtiquetaCatalogo,
  ColorEtiqueta,
} from '@/services/leads.service'
import { AdministrarEtiquetas, ChipEtiqueta, EtiquetasDelChat, FiltroEtiqueta } from './Etiquetas'
import { useThemeStore } from '@/zustand/theme'
import { useNumerosWhatsapp } from './useNumerosWhatsapp'

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
 *
 * Paleta (22-10): blanco, verde menta para lo del cliente y negro para la
 * acción principal, como una bandeja de mensajería; el morado quedó para el
 * resto del panel.
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
  etiquetas: EtiquetaCatalogo[]
  onPonerEtiqueta: (
    conversacionId: number,
    datos: { etiquetaId: number } | { nombre: string; color?: ColorEtiqueta },
  ) => void
  onQuitarEtiqueta: (conversacionId: number, etiquetaId: number) => void
  onCrearEtiqueta: (nombre: string, color: ColorEtiqueta) => Promise<boolean>
  onEditarEtiqueta: (id: number, datos: { nombre?: string; color?: ColorEtiqueta }) => Promise<boolean>
  onEliminarEtiqueta: (id: number) => void
}

/** Cuántas etiquetas caben en la fila antes del "+N". */
const ETIQUETAS_EN_FILA = 2

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
/**
 * El zoom del panel (100/90/82/75 %) es CSS `zoom` en un contenedor: la
 * posición en pantalla ya viene achicada, pero la altura que se le pone al
 * elemento se achica DESPUÉS. Sin dividir por el zoom, al 90% la bandeja
 * quedaba un 10% más corta y dejaba una franja vacía abajo (22-10).
 */
function zoomDe(el: HTMLElement): number {
  let z = 1
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const v = parseFloat(getComputedStyle(n).zoom)
    if (v > 0 && Number.isFinite(v)) z *= v
  }
  return z
}

/** ¿La pantalla llega a `lg`? Plegar la lista solo tiene sentido ahí: más angosto, la lista ya va sola. */
function useDesde(px: number): boolean {
  const consulta = `(min-width: ${px}px)`
  const [si, setSi] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(consulta).matches)
  useLayoutEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia(consulta)
    const cambio = () => setSi(mq.matches)
    cambio()
    mq.addEventListener('change', cambio)
    return () => mq.removeEventListener('change', cambio)
  }, [consulta])
  return si
}

function useAltoHastaElBorde() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [alto, setAlto] = useState<number | undefined>(undefined)
  const zoomLevel = useThemeStore((st) => st.zoomLevel)

  useLayoutEffect(() => {
    const medir = () => {
      const el = ref.current
      if (!el) return
      const zoom = zoomDe(el)
      const arriba = el.getBoundingClientRect().top
      setAlto(Math.max(360, (window.innerHeight - arriba) / zoom - AIRE_ABAJO))
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
  }, [zoomLevel])

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
  compacta = false,
  linea = null,
}: {
  p: LeadProspecto
  activa: boolean
  onAbrir: () => void
  /** Lista plegada: solo el avatar, con el nombre al pasar el mouse. */
  compacta?: boolean
  /** Número de la empresa al que escribió (solo si la empresa tiene varios). */
  linea?: string | null
}) {
  const meta = ESTADO_META[p.estado]
  if (compacta) {
    return (
      <button
        type="button"
        onClick={onAbrir}
        title={nombreVisible(p.nombreProspecto, p.telefonoProspecto)}
        aria-label={nombreVisible(p.nombreProspecto, p.telefonoProspecto)}
        className={`flex w-full justify-center border-l-[3px] py-2.5 transition-colors ${
          activa
            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10'
            : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <span
          className={`relative flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold ${colorAvatar(p.telefonoProspecto)}`}
        >
          {iniciales(p.nombreProspecto, p.telefonoProspecto)}
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white dark:ring-[#111827] ${
              p.botActivo ? 'bg-emerald-500' : 'bg-orange-500'
            }`}
          />
        </span>
      </button>
    )
  }
  // El resumen de la IA dice más que el último mensaje suelto: "quiere 3
  // frascos, pregunta por envío a Arequipa" contra "ok".
  const resumen = p.proximaAccion || p.resumen || contactoVisible(p.telefonoProspecto)

  return (
    <button
      type="button"
      onClick={onAbrir}
      className={`flex w-full gap-3 border-l-[3px] px-4 py-3.5 text-left transition-colors ${
        activa
          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10'
          : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <span
        className={`relative flex h-11 w-11 flex-none items-center justify-center rounded-full text-[13px] font-bold ${colorAvatar(p.telefonoProspecto)}`}
      >
        {iniciales(p.nombreProspecto, p.telefonoProspecto)}
        {p.botActivo ? (
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111827]"
            title="La IA atiende este chat"
          />
        ) : (
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
          <span className="truncate text-[14px] font-semibold text-gray-900 dark:text-white">
            {nombreVisible(p.nombreProspecto, p.telefonoProspecto)}
          </span>
          <span className="flex-none text-[11px] tabular-nums text-gray-400">
            {haceCuanto(p.actualizadoEn)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-[12.5px] text-gray-500 dark:text-gray-400">{resumen}</span>
          <span
            className="flex h-5 min-w-[20px] flex-none items-center justify-center rounded-full bg-gray-900 px-1.5 text-[10px] font-bold tabular-nums text-white dark:bg-white dark:text-gray-900"
            title="Puntaje BANT"
          >
            {p.puntaje}
          </span>
        </span>
        {(meta || p.anuncio || !!p.etiquetas?.length || !!linea) && (
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {linea && (
              <span
                className="inline-flex min-w-0 items-center gap-1 truncate rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                title="Número de tu empresa al que escribió"
              >
                <Icon icon="mdi:whatsapp" width={10} className="flex-none" />
                {linea}
              </span>
            )}
            {meta && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
                <Icon icon={meta.icon} width={10} />
                {meta.label}
              </span>
            )}
            {p.anuncio && (
              <span
                className="inline-flex min-w-0 items-center gap-1 truncate rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                title={p.anuncio.titulo || 'Llegó por un anuncio'}
              >
                <Icon icon="mdi:bullhorn" width={10} className="flex-none" />
                Anuncio
              </span>
            )}
            {p.etiquetas?.slice(0, ETIQUETAS_EN_FILA).map((e) => (
              <ChipEtiqueta key={e.id} etiqueta={e} chico />
            ))}
            {(p.etiquetas?.length ?? 0) > ETIQUETAS_EN_FILA && (
              <span
                className="text-[10px] font-semibold text-gray-400"
                title={p.etiquetas!.slice(ETIQUETAS_EN_FILA).map((e) => e.nombre).join(', ')}
              >
                +{p.etiquetas!.length - ETIQUETAS_EN_FILA}
              </span>
            )}
          </span>
        )}
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
        <span className="text-[12px] text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-[11px] font-semibold tabular-nums text-gray-500 dark:text-gray-400">
          {valor ?? 0}/{max}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500 motion-safe:transition-[width] motion-safe:duration-500"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

/** Fila de dato con su ícono en cuadrito pastel, como los ajustes de un chat. */
function Dato({
  icon,
  tono,
  label,
  children,
}: {
  icon: string
  tono: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 px-3 py-2.5 dark:bg-slate-800/40">
      <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${tono}`}>
        <Icon icon={icon} width={16} />
      </span>
      <span className="flex-1 text-[13px] font-semibold text-gray-800 dark:text-gray-200">{label}</span>
      <span className="text-[12.5px] text-gray-500 dark:text-gray-400">{children}</span>
    </div>
  )
}

function Seccion({ icon, titulo, children }: { icon: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="flex items-center gap-2 text-[13px] font-bold text-gray-900 dark:text-white">
        <Icon icon={icon} width={16} className="text-gray-500 dark:text-gray-400" />
        {titulo}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function FichaLateral({
  p,
  prueba,
  onVerHistorial,
  etiquetas,
}: {
  p: LeadProspecto | null
  /** El chat abierto cuando no tiene lead detrás (una prueba del negocio). */
  prueba: LeadConversacion | null
  onVerHistorial: (telefono: string) => void
  /** El editor de etiquetas del chat, ya armado por la bandeja. */
  etiquetas: React.ReactNode
}) {
  if (!p) {
    // Un chat de prueba no tiene BANT que mostrar, pero tampoco merece una
    // columna vacía al lado: se explica por qué no se califica, que es
    // exactamente lo que pregunta quien lo ve por primera vez.
    if (prueba) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-900/30">
            <Icon icon="solar:test-tube-bold-duotone" width={28} />
          </span>
          <p className="text-[15px] font-bold text-gray-900 dark:text-white">
            {nombreVisible(prueba.nombreProspecto, prueba.telefonoProspecto)}
          </p>
          <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">
            {prueba.telefonoProspecto}
          </p>
          <p className="text-[12px] leading-relaxed text-gray-600 dark:text-gray-400">
            Este número es del negocio, así que la IA le responde pero no lo
            califica ni lo cuenta como lead. Sirve para probar sin ensuciar el
            embudo.
          </p>
        </div>
      )
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-gray-500 dark:text-gray-400">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-800">
          <Icon icon="solar:user-id-bold-duotone" width={28} className="opacity-50" />
        </span>
        <p className="text-[13px]">Abre una conversación para ver la ficha del cliente</p>
      </div>
    )
  }
  const meta = ESTADO_META[p.estado]

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-14 w-14 flex-none items-center justify-center rounded-full text-lg font-bold ${colorAvatar(p.telefonoProspecto)}`}
        >
          {iniciales(p.nombreProspecto, p.telefonoProspecto)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-bold text-gray-900 dark:text-white">
            {nombreVisible(p.nombreProspecto, p.telefonoProspecto)}
          </p>
          <span className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium ${canalDe(p.telefonoProspecto).insignia}`}>
            <Icon icon={canalDe(p.telefonoProspecto).icono} width={13} />
            {contactoVisible(p.telefonoProspecto)}
          </span>
        </div>
      </div>

      {/* Lo que vio antes de escribir: el vendedor responde sabiendo qué
          producto o promoción le interesó. */}
      {p.anuncio && (
        <div
          className="mt-4 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20"
          data-testid="ficha-anuncio"
        >
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <Icon icon="mdi:bullhorn" width={12} />
            Llegó por {p.anuncio.tipo === 'post' ? 'una publicación' : 'un anuncio'}
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-900 dark:text-amber-100">
            {p.anuncio.titulo || 'Sin título'}
          </p>
          {p.anuncio.texto && (
            <p className="mt-0.5 line-clamp-2 text-[11px] text-amber-800/80 dark:text-amber-200/80">{p.anuncio.texto}</p>
          )}
          {p.anuncio.url && (
            <a
              href={p.anuncio.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-[10px] font-bold text-amber-700 hover:underline dark:text-amber-300"
            >
              Ver {p.anuncio.tipo === 'post' ? 'publicación' : 'anuncio'}
            </a>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => onVerHistorial(p.telefonoProspecto)}
        className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 text-[13px] font-semibold text-white transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
      >
        <Icon icon="solar:clipboard-list-bold-duotone" width={16} />
        Ver su historial de compras
      </button>

      <div className="mt-4 space-y-2">
        <Dato icon="solar:pulse-2-bold" tono="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300" label="Estado">
          {meta ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-200">
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          ) : '—'}
        </Dato>
        <Dato icon="solar:chart-square-bold" tono="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300" label="Puntaje">
          <span className={`text-[15px] font-black tabular-nums ${colorPuntaje(p.puntaje)}`}>{p.puntaje}</span>
        </Dato>
        <Dato icon="solar:clock-circle-bold" tono="bg-rose-100 text-rose-500 dark:bg-rose-900/40 dark:text-rose-300" label="Último contacto">
          hace {haceCuanto(p.actualizadoEn)}
        </Dato>
        <Dato icon="solar:bill-list-bold" tono="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300" label="Cotización">
          {p.cotizacion ? (
            <span className="font-semibold text-gray-700 dark:text-gray-200">{p.cotizacion.codigo}</span>
          ) : '—'}
        </Dato>
      </div>

      <Seccion icon="solar:tag-linear" titulo="Etiquetas">
        {etiquetas}
      </Seccion>

      {p.proximaAccion && (
        <Seccion icon="solar:bell-linear" titulo="Próxima acción">
          <div className="flex gap-3">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
              <Icon icon="solar:target-linear" width={16} />
            </span>
            <p className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">{p.proximaAccion}</p>
          </div>
        </Seccion>
      )}

      <Seccion icon="solar:chart-2-linear" titulo="Calificación BANT">
        <div className="space-y-3">
          <Barra label="Presupuesto" valor={p.presupuesto} max={30} />
          <Barra label="Autoridad" valor={p.autoridad} max={20} />
          <Barra label="Necesidad" valor={p.necesidad} max={25} />
          <Barra label="Plazo" valor={p.plazo} max={25} />
        </div>
      </Seccion>

      {p.resumen && (
        <Seccion icon="solar:document-text-linear" titulo="Resumen">
          <p className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">{p.resumen}</p>
        </Seccion>
      )}

      {p.puntosClave?.length > 0 && (
        <Seccion icon="solar:checklist-minimalistic-linear" titulo="Puntos clave">
          <ul className="space-y-2">
            {p.puntosClave.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-gray-700 dark:text-gray-300">
                <Icon icon="solar:check-circle-bold" width={15} className="mt-0.5 flex-none text-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
        </Seccion>
      )}
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
  etiquetas,
  onPonerEtiqueta,
  onQuitarEtiqueta,
  onCrearEtiqueta,
  onEditarEtiqueta,
  onEliminarEtiqueta,
}: BandejaProps) {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [etiquetaFiltro, setEtiquetaFiltro] = useState<number | null>(null)
  const { numeros, varios: variosNumeros, nombreDe } = useNumerosWhatsapp()
  // Filtro por número de la empresa (solo aparece con dos o más números).
  const [numeroFiltro, setNumeroFiltro] = useState<string | null>(null)
  const [administrando, setAdministrando] = useState(false)
  // Si borran la etiqueta del filtro, el filtro no puede quedar escondiendo todo.
  const filtroVigente = etiquetas.some((e) => e.id === etiquetaFiltro) ? etiquetaFiltro : null
  const { ref, alto } = useAltoHastaElBorde()
  // Plegar la lista deja una columna de avatares y le da el ancho al chat.
  // Se recuerda por navegador: quien la pliega suele querer seguir así.
  const [plegada, setPlegada] = useState<boolean>(() => {
    try {
      return localStorage.getItem('LEADS_LISTA_PLEGADA') === '1'
    } catch {
      return false
    }
  })
  const pantallaAncha = useDesde(1024)
  const compacta = plegada && pantallaAncha
  const alternarLista = () =>
    setPlegada((v) => {
      try {
        localStorage.setItem('LEADS_LISTA_PLEGADA', v ? '0' : '1')
      } catch {
        /* sin almacenamiento: igual se pliega en esta visita */
      }
      return !v
    })

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return prospectos
      .filter((p) => {
        if (filtro === 'pausados' && p.botActivo) return false
        if (filtro === 'calientes' && p.puntaje < 70) return false
        if (filtroVigente != null && !p.etiquetas?.some((e) => e.id === filtroVigente)) return false
        if (numeroFiltro && p.numeroWhatsappId !== numeroFiltro) return false
        if (!q) return true
        return (
          (p.nombreProspecto || '').toLowerCase().includes(q) ||
          p.telefonoProspecto.includes(q)
        )
      })
      .sort((a, b) => +new Date(b.actualizadoEn) - +new Date(a.actualizadoEn))
  }, [prospectos, busqueda, filtro, filtroVigente, numeroFiltro])

  const enPausa = prospectos.filter((p) => !p.botActivo).length

  return (
    <div
      ref={ref}
      style={{ height: alto }}
      className={`grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-[grid-template-columns] duration-200 dark:border-slate-800 dark:bg-[#111827] ${
        compacta
          ? 'lg:grid-cols-[76px_1fr] xl:grid-cols-[76px_1fr_320px]'
          : 'lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_320px]'
      }`}>

      {/* ── Columna 1: la lista ── */}
      <aside
        className={`min-h-0 flex-col border-r border-gray-100 dark:border-slate-800 lg:flex ${
          conversacionAbiertaId ? 'hidden' : 'flex'
        }`}
      >
        <div className={compacta ? 'flex justify-center py-3' : 'px-4 pb-3 pt-4'}>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={alternarLista}
              aria-label={compacta ? 'Mostrar la lista de chats' : 'Plegar la lista de chats'}
              aria-expanded={!compacta}
              title={compacta ? 'Mostrar la lista' : 'Plegar la lista'}
              className={`${compacta ? '' : '-ml-1.5 '}hidden h-9 w-9 flex-none items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 lg:flex dark:text-gray-200 dark:hover:bg-slate-800`}
            >
              <Icon icon={compacta ? 'solar:hamburger-menu-linear' : 'solar:sidebar-minimalistic-linear'} width={20} />
            </button>
            {!compacta && (
              <p className="flex items-center gap-2 text-[17px] font-bold text-gray-900 dark:text-white">
                Chats
                <span className="text-[13px] font-medium text-gray-400">{prospectos.length}</span>
              </p>
            )}
          </div>
          {!compacta && (
          <>
          <div className="relative mt-3">
            <Icon
              icon="solar:magnifer-linear"
              width={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={busqueda}
              onChange={(e) => onBuscar(e.target.value)}
              placeholder="Buscar por nombre o teléfono"
              aria-label="Buscar conversación"
              className="w-full rounded-xl border border-transparent bg-gray-100/80 py-2.5 pl-9 pr-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                aria-pressed={filtro === f.id}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
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
            <FiltroEtiqueta
              catalogo={etiquetas}
              valor={filtroVigente}
              onCambiar={setEtiquetaFiltro}
              onAdministrar={() => setAdministrando(true)}
            />
          </div>
          {variosNumeros && (
            <div className="mt-2 flex flex-wrap gap-1.5" data-testid="filtro-numeros">
              {[{ phoneNumberId: null as string | null, nombre: 'Todos los números' }, ...numeros.map((n) => ({ phoneNumberId: n.phoneNumberId as string | null, nombre: nombreDe(n.phoneNumberId) || n.phoneNumberId }))].map((n) => (
                <button
                  key={n.phoneNumberId ?? 'todos'}
                  type="button"
                  onClick={() => setNumeroFiltro(n.phoneNumberId)}
                  aria-pressed={numeroFiltro === n.phoneNumberId}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    numeroFiltro === n.phoneNumberId
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300'
                  }`}
                >
                  {n.phoneNumberId && <Icon icon="mdi:whatsapp" width={11} />}
                  {n.nombre}
                </button>
              ))}
            </div>
          )}
          </>
          )}
        </div>

        <div className="min-h-0 flex-1 divide-y divide-gray-100/80 overflow-y-auto border-t border-gray-100 dark:divide-slate-800/60 dark:border-slate-800">
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
                compacta={compacta}
                linea={nombreDe(p.numeroWhatsappId)}
              />
            ))
          )}

          {/* Los chats del propio negocio van al final y rotulados: son pruebas,
              no clientes, y mezclarlos con el embudo fue justo lo que se vino a
              arreglar. Pero tienen que poder abrirse y borrarse. */}
          {chatsDePrueba.length > 0 && !compacta && (
            <div className="bg-gray-50/60 px-3 py-2.5 dark:bg-slate-900/40">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
                      ? 'bg-emerald-100/70 dark:bg-emerald-500/20'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon icon={canalDe(c.telefonoProspecto).icono} width={12} className={`flex-none ${canalDe(c.telefonoProspecto).color}`} />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-gray-700 dark:text-gray-300">
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
          etiquetas={
            prospectoActivo && (
              <EtiquetasDelChat
                actuales={prospectoActivo.etiquetas ?? []}
                catalogo={etiquetas}
                onPoner={(datos) => onPonerEtiqueta(prospectoActivo.conversacionId, datos)}
                onQuitar={(id) => onQuitarEtiqueta(prospectoActivo.conversacionId, id)}
                onAdministrar={() => setAdministrando(true)}
              />
            )
          }
        />
      </aside>

      {administrando && (
        <AdministrarEtiquetas
          catalogo={etiquetas}
          onCrear={onCrearEtiqueta}
          onEditar={onEditarEtiqueta}
          onEliminar={onEliminarEtiqueta}
          onCerrar={() => setAdministrando(false)}
        />
      )}
    </div>
  )
}
