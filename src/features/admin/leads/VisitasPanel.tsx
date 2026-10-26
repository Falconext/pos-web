/**
 * Visitas a la tienda física (26-10).
 *
 * Hierba Sana está dentro del Mercado La Merced: clientes que dicen por
 * WhatsApp "mañana paso" y luego "los vengo buscando una hora". El asesor ya
 * registra la visita y le manda la ubicación, la foto y las indicaciones; acá
 * el negocio ve quién viene y cuándo, si dejó reserva, y marca si vino.
 *
 * Se usa mucho desde el celular, parado en el mostrador: cada fila es una
 * tarjeta que se lee de arriba abajo y los botones tienen alto de dedo.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useAlertStore from '@/zustand/alert'
import type { ConfigTienda } from '@/services/leads.service'
import {
  visitasService,
  type EstadoVisita,
  type FiltroVisitas,
  type VisitaTienda,
} from '@/services/crm.service'
import { colorAvatar, contactoVisible, iniciales, nombreVisible, rutaAlChat } from './LeadsModel'

const PESTANAS: { id: FiltroVisitas; label: string; icon: string; vacio: string }[] = [
  {
    id: 'proximas',
    label: 'Próximas',
    icon: 'solar:calendar-mark-linear',
    vacio:
      'Nadie tiene día para venir. Cuando un cliente le diga al asesor "el sábado paso por la tienda", aparece acá con su día y le llega cómo encontrarte.',
  },
  {
    id: 'sin_fecha',
    label: 'Dicen que vendrán',
    icon: 'solar:walking-linear',
    vacio:
      'Aquí van los que dicen que van a pasar pero sin decir cuándo ("un día de estos voy"). Por ahora no hay ninguno.',
  },
  {
    id: 'con_reserva',
    label: 'Con reserva',
    icon: 'solar:wallet-money-linear',
    vacio:
      'Nadie dejó un adelanto para recoger en tienda. Cuando manden su voucher antes de venir, lo verás acá con el monto.',
  },
  {
    id: 'pasadas',
    label: 'Pasadas',
    icon: 'solar:history-linear',
    vacio: 'Todavía no hay visitas de días anteriores.',
  },
]

const ESTADO_META: Record<EstadoVisita, { label: string; chip: string }> = {
  AGENDADA: {
    label: 'Por venir',
    chip: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  },
  VINO: {
    label: 'Vino',
    chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  NO_VINO: {
    label: 'No vino',
    chip: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  CANCELADA: {
    label: 'Cancelada',
    chip: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400',
  },
}

/** "Hoy" en Lima, como 'YYYY-MM-DD' (el servidor guarda la fecha así). */
export function hoyEnLima(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(ahora)
}

const sumarDias = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** "Hoy", "Mañana" o "Jueves 29 de octubre". */
export function etiquetaDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return 'Hoy'
  if (fecha === sumarDias(hoy, 1)) return 'Mañana'
  if (fecha === sumarDias(hoy, -1)) return 'Ayer'
  const [y, m, d] = fecha.split('-').map(Number)
  const texto = format(new Date(y, m - 1, d), "EEEE d 'de' MMMM", { locale: es })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Agrupa por día conservando el orden en que vienen del servidor. */
export function agruparPorDia(
  visitas: VisitaTienda[],
  hoy: string,
): { clave: string; titulo: string; visitas: VisitaTienda[] }[] {
  const grupos: { clave: string; titulo: string; visitas: VisitaTienda[] }[] = []
  for (const v of visitas) {
    const clave = v.fecha ?? 'sin-fecha'
    let g = grupos.find((x) => x.clave === clave)
    if (!g) {
      g = { clave, titulo: v.fecha ? etiquetaDia(v.fecha, hoy) : 'Sin día', visitas: [] }
      grupos.push(g)
    }
    g.visitas.push(v)
  }
  return grupos
}

const soles = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`

const tieneComoLlegar = (t: ConfigTienda) =>
  t.lat != null || !!t.mapsUrl?.trim() || !!t.fotoUrl?.trim() || !!t.indicaciones?.trim()

interface Props {
  /**
   * La tienda configurada en Mi vendedor. undefined = la config aún no llegó
   * (no se avisa nada); null o vacía = no hay qué mandarle al cliente.
   */
  tienda?: ConfigTienda | null
}

export function VisitasPanel({ tienda }: Props) {
  const { alert } = useAlertStore()
  const [filtro, setFiltro] = useState<FiltroVisitas>('proximas')
  const [visitas, setVisitas] = useState<VisitaTienda[] | null>(null)
  const [error, setError] = useState(false)
  // Qué fila está esperando al servidor: evita el doble toque en el celular.
  const [ocupada, setOcupada] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    try {
      setVisitas(await visitasService.listar(filtro))
      setError(false)
    } catch {
      setError(true)
    }
  }, [filtro])

  useEffect(() => {
    setVisitas(null)
    void cargar()
  }, [cargar])

  const marcar = async (v: VisitaTienda, estado: EstadoVisita) => {
    setOcupada(v.id)
    try {
      await visitasService.marcar(v.id, estado)
      await cargar()
      alert(
        estado === 'VINO'
          ? `Listo: ${nombreVisible(v.nombre, v.telefono)} vino a la tienda`
          : estado === 'NO_VINO'
            ? 'Marcada como "no vino"'
            : 'Vuelve a estar por venir',
        'success',
      )
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'No se pudo marcar la visita', 'error')
    } finally {
      setOcupada(null)
    }
  }

  const reenviar = async (v: VisitaTienda) => {
    setOcupada(v.id)
    try {
      await visitasService.reenviarComoLlegar(v.id)
      await cargar()
      alert('Le reenviamos la ubicación y cómo llegar', 'success')
    } catch (e: any) {
      // El motivo del servidor dice exactamente qué falta (la ubicación, o
      // que pasaron las 24 h): un "no se pudo" a secas no sirve de nada.
      alert(e?.response?.data?.message ?? 'No se pudo reenviar cómo llegar', 'error')
    } finally {
      setOcupada(null)
    }
  }

  const pestana = PESTANAS.find((p) => p.id === filtro) ?? PESTANAS[0]
  const hoy = hoyEnLima()
  const sinComoLlegar = tienda !== undefined && (!tienda || !tieneComoLlegar(tienda))

  return (
    <div className="space-y-4">
      {/* Sin ubicación ni indicaciones, el asesor registra la visita pero no
          tiene qué mandarle al cliente: justo lo que hace que se pierda. */}
      {sinComoLlegar && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center dark:border-amber-900/40 dark:bg-amber-900/15">
          <Icon icon="solar:map-point-search-bold-duotone" className="flex-none text-2xl text-amber-600 dark:text-amber-400" />
          <p className="min-w-0 flex-1 text-[13px] text-amber-900 dark:text-amber-200">
            <b>Aún no le dices al asesor cómo llegar a tu tienda.</b> Agrega la dirección, el link de Google Maps,
            una foto de la fachada y las indicaciones; se le mandan solas a quien dice que va a ir.
          </p>
          <Link
            to="/administrador/leads/vendedor?tab=entrega"
            className="inline-flex min-h-[40px] flex-none items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 text-[13px] font-semibold text-white hover:bg-amber-700"
          >
            <Icon icon="solar:map-point-add-linear" width={17} />
            Configurar mi tienda
          </Link>
        </div>
      )}

      <nav
        className="-mx-2 flex gap-1 overflow-x-auto px-2 pb-1 sm:mx-0 sm:px-0"
        aria-label="Filtrar visitas"
      >
        <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-[0_1px_2px_rgba(16,24,40,.06)] dark:bg-[#111827]">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFiltro(p.id)}
              aria-current={filtro === p.id ? 'page' : undefined}
              className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13.5px] font-semibold transition ${
                filtro === p.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-slate-800'
              }`}
            >
              <Icon icon={p.icon} width={17} />
              {p.label}
            </button>
          ))}
        </div>
      </nav>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-sm text-gray-600 dark:text-gray-300">No se pudieron cargar las visitas.</p>
          <button
            type="button"
            onClick={() => void cargar()}
            className="rounded-xl bg-gray-900 px-4 py-2 text-[13px] font-semibold text-white dark:bg-white dark:text-gray-900"
          >
            Reintentar
          </button>
        </div>
      ) : visitas === null ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
          <Icon icon="eos-icons:loading" className="animate-spin text-3xl text-emerald-500" />
          <p className="text-sm">Cargando…</p>
        </div>
      ) : visitas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-slate-700">
          <Icon icon="solar:shop-2-linear" width={34} className="text-gray-300 dark:text-slate-600" />
          <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-200">Sin visitas aquí</p>
          <p className="max-w-md text-[13px] text-gray-500 dark:text-gray-400">{pestana.vacio}</p>
        </div>
      ) : filtro === 'proximas' ? (
        <div className="space-y-5">
          {agruparPorDia(visitas, hoy).map((g) => (
            <section key={g.clave} aria-label={g.titulo}>
              <h3 className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <span className={g.titulo === 'Hoy' ? 'text-emerald-600 dark:text-emerald-400' : ''}>{g.titulo}</span>
                <span className="rounded-full bg-gray-100 px-1.5 text-[11px] tabular-nums text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                  {g.visitas.length}
                </span>
              </h3>
              <div className="space-y-2">
                {g.visitas.map((v) => (
                  <FilaVisita
                    key={v.id}
                    v={v}
                    hoy={hoy}
                    mostrarFecha={false}
                    ocupada={ocupada === v.id}
                    onMarcar={(e) => marcar(v, e)}
                    onReenviar={() => reenviar(v)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {visitas.map((v) => (
            <FilaVisita
              key={v.id}
              v={v}
              hoy={hoy}
              mostrarFecha
              ocupada={ocupada === v.id}
              onMarcar={(e) => marcar(v, e)}
              onReenviar={() => reenviar(v)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ icon, children, className }: { icon: string; children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${className}`}>
      <Icon icon={icon} width={13} />
      {children}
    </span>
  )
}

function FilaVisita({
  v,
  hoy,
  mostrarFecha,
  ocupada,
  onMarcar,
  onReenviar,
}: {
  v: VisitaTienda
  hoy: string
  mostrarFecha: boolean
  ocupada: boolean
  onMarcar: (estado: EstadoVisita) => void
  onReenviar: () => void
}) {
  const porVenir = v.estado === 'AGENDADA'
  const estado = ESTADO_META[v.estado] ?? ESTADO_META.AGENDADA
  const botonBase =
    'inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold transition disabled:opacity-50'

  return (
    <article
      data-testid={`visita-${v.id}`}
      className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] dark:border-slate-800 dark:bg-[#111827]"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-[13px] font-bold ${colorAvatar(v.telefono)}`}
        >
          {iniciales(v.nombre, v.telefono)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="truncate text-[15px] font-bold text-gray-900 dark:text-white">
              {nombreVisible(v.nombre, v.telefono)}
            </p>
            {!porVenir && (
              <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${estado.chip}`}>{estado.label}</span>
            )}
          </div>
          <p className="font-mono text-[12px] text-gray-400">{contactoVisible(v.telefono)}</p>

          {/* Lo que dijo el cliente pesa más que la fecha calculada: si la
              fecha salió mal, el texto deja ver qué quiso decir. */}
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px] text-gray-700 dark:text-gray-300">
            <Icon icon="solar:clock-circle-linear" width={15} className="flex-none text-gray-400" />
            <span>“{v.cuando || 'Sin decir cuándo'}”</span>
            {mostrarFecha && v.fecha && (
              <span className="text-gray-400">· {etiquetaDia(v.fecha, hoy)}</span>
            )}
          </p>

          {(v.conPedido || v.reserva || v.indicacionesEnviadas) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {v.conPedido && (
                <Chip
                  icon="solar:bag-check-linear"
                  className="bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                >
                  Con pedido
                </Chip>
              )}
              {v.reserva && (
                <Chip
                  icon="solar:wallet-money-linear"
                  className={
                    v.reserva.validada
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                  }
                >
                  Reserva {soles(v.reserva.monto)} ({v.reserva.validada ? 'validada' : 'por validar'})
                </Chip>
              )}
              {v.indicacionesEnviadas && (
                <Chip
                  icon="solar:map-point-linear"
                  className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                >
                  Ubicación enviada
                </Chip>
              )}
            </div>
          )}

          {v.resumen && (
            <p className="mt-2 line-clamp-2 text-[12.5px] text-gray-500 dark:text-gray-400">{v.resumen}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
        <Link
          to={rutaAlChat({ conversacionId: v.conversacionId, telefono: v.telefono })}
          className={`${botonBase} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40`}
        >
          <Icon icon="solar:chat-round-dots-linear" width={16} />
          Abrir chat
        </Link>
        {porVenir ? (
          <>
            <button
              type="button"
              disabled={ocupada}
              onClick={() => onMarcar('VINO')}
              className={`${botonBase} bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900`}
            >
              <Icon icon="solar:check-circle-linear" width={16} />
              Vino
            </button>
            <button
              type="button"
              disabled={ocupada}
              onClick={() => onMarcar('NO_VINO')}
              className={`${botonBase} border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800`}
            >
              <Icon icon="solar:close-circle-linear" width={16} />
              No vino
            </button>
            <button
              type="button"
              disabled={ocupada}
              onClick={onReenviar}
              className={`${botonBase} text-sky-700 hover:bg-sky-50 sm:ml-auto dark:text-sky-300 dark:hover:bg-sky-900/20`}
            >
              <Icon icon="solar:map-arrow-right-linear" width={16} />
              Reenviar cómo llegar
            </button>
          </>
        ) : (
          // Un toque equivocado en el celular no tiene que quedar así.
          <button
            type="button"
            disabled={ocupada}
            onClick={() => onMarcar('AGENDADA')}
            className={`${botonBase} text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800`}
          >
            <Icon icon="solar:undo-left-linear" width={16} />
            Deshacer
          </button>
        )}
      </div>
    </article>
  )
}
