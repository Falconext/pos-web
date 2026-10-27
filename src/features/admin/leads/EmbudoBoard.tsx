/**
 * E1 — el tablero del embudo.
 *
 * Doce columnas en el orden que definió el cliente. Lo primero que se ve
 * arriba es cuántos pagos esperan validación, porque es lo único del tablero
 * que bloquea plata: mientras nadie mire el voucher, el pedido no sale.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'
import { nombreVisible, contactoVisible, rutaAlChat } from './LeadsModel'
import moment from 'moment'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import useAlertStore from '@/zustand/alert'
import {
  crmService,
  ETAPA_META,
  ETAPAS_MANUALES,
  type ColumnaEmbudo,
  type ComprobantePagoLead,
  type EtapaCrm,
  type PedidoEnEmbudo,
  type Tablero,
} from '@/services/crm.service'
import { iniciales, tonoAvatar } from '@/components/Datatable/columnas'
import './embudo.css'

interface Props {
  /** Abre la ficha 360° del cliente. */
  onVerCliente?: (telefono: string) => void
}

/**
 * "hace 16 horas" en vez de "16 hours ago".
 *
 * `moment` arranca en inglés si nadie le fija el idioma, y acá nadie se lo
 * fijaba: el tablero mostraba las antigüedades en inglés dentro de un panel que
 * está todo en español. Se usa `date-fns`, que ya viene con el locale cargado
 * en este archivo, en vez de arrastrar el paquete de idiomas de moment.
 */
function fechaRelativa(valor: string | Date | null | undefined): string {
  if (!valor) return ''
  return formatDistanceToNow(new Date(valor), { addSuffix: true, locale: es })
}

export function EmbudoBoard({ onVerCliente }: Props) {
  const { alert } = useAlertStore()
  const [tablero, setTablero] = useState<Tablero | null>(null)
  const [cargando, setCargando] = useState(true)
  const [moviendo, setMoviendo] = useState<number | null>(null)
  const [voucher, setVoucher] = useState<{
    pago: ComprobantePagoLead
    pedido: PedidoEnEmbudo
  } | null>(null)
  // Qué tarjeta se está arrastrando: lo sabe el tablero porque la columna que
  // recibe el drop no es la misma que inició el arrastre.
  const [arrastrando, setArrastrando] = useState<PedidoEnEmbudo | null>(null)

  const cargar = useCallback(async () => {
    try {
      setTablero(await crmService.tablero())
    } catch {
      alert('No se pudo cargar el embudo', 'error')
    } finally {
      setCargando(false)
    }
  }, [alert])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const mover = async (pedido: PedidoEnEmbudo, etapa: EtapaCrm) => {
    setMoviendo(pedido.id)
    try {
      await crmService.mover(pedido.id, etapa)
      await cargar()
      alert(`Movido a ${ETAPA_META[etapa].label}`, 'success')
    } catch (e: any) {
      // El mensaje del backend explica el candado con sus palabras; se
      // muestra tal cual en vez de un "no se pudo" que no enseña nada.
      alert(e?.response?.data?.message ?? 'No se pudo mover', 'error')
    } finally {
      setMoviendo(null)
    }
  }

  const validar = async (pago: ComprobantePagoLead) => {
    try {
      await crmService.validarPago(pago.id)
      setVoucher(null)
      await cargar()
      alert('Pago validado: el pedido pasó a despacho', 'success')
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'No se pudo validar', 'error')
    }
  }

  const rechazar = async (pago: ComprobantePagoLead) => {
    const motivo = window.prompt(
      '¿Por qué se rechaza? El equipo necesita saber qué pedirle al cliente.',
    )
    if (!motivo?.trim()) return
    try {
      await crmService.rechazarPago(pago.id, motivo.trim())
      setVoucher(null)
      await cargar()
      alert('Pago rechazado', 'success')
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'No se pudo rechazar', 'error')
    }
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-[#978f86]">
        <Icon icon="eos-icons:loading" className="animate-spin text-3xl" />
        <p className="text-sm">Cargando el embudo…</p>
      </div>
    )
  }
  if (!tablero) return null

  // La etapa final va aparte, a la derecha, como el panel "Funded" de Hearth.
  const columnas = tablero.columnas.filter((c) => c.etapa !== ETAPA_FINAL)
  const final = tablero.columnas.find((c) => c.etapa === ETAPA_FINAL)
  const totalEmbudo = columnas.reduce((acc, c) => acc + c.total, 0)
  const mayor = Math.max(1, ...columnas.map((c) => c.total))
  const calientes = columnas.reduce(
    (acc, c) => acc + c.pedidos.filter((p) => temperatura(p.estado) === 'is-hot').length,
    0,
  )

  return (
    <div className="krk-emb">
      <div className="krk-emb__stats">
        <Indicador icon="solar:users-group-rounded-linear" valor={totalEmbudo} label="Clientes en el embudo" />
        <Indicador icon="solar:fire-linear" valor={calientes} label="Calientes ahora" />
        <Indicador
          icon="solar:wallet-money-linear"
          valor={tablero.pagosPorValidar}
          label="Pagos esperando revisión"
          tag={tablero.pagosPorValidar > 0 ? 'Bloquea despacho' : undefined}
        />
      </div>

      {/* Lo único que bloquea plata */}
      {tablero.pagosPorValidar > 0 && (
        <div data-testid="aviso-pagos" className="krk-emb__warn">
          <Icon icon="solar:wallet-money-linear" className="mt-px flex-none text-base" />
          <span>
            <b>
              {tablero.pagosPorValidar} pago
              {tablero.pagosPorValidar === 1 ? '' : 's'} por validar
            </b>
            . Ningún pedido pasa a despacho hasta que alguien revise el comprobante.
          </span>
        </div>
      )}

      <div className="krk-emb__board">
        <div className="krk-emb__cols">
          {columnas.map((col) => (
            <Columna
              key={col.etapa}
              col={col}
              total={totalEmbudo}
              mayor={mayor}
              moviendo={moviendo}
              onMover={mover}
              onVerVoucher={(pago, pedido) => setVoucher({ pago, pedido })}
              onVerCliente={onVerCliente}
              arrastrando={arrastrando}
              onArrastrar={setArrastrando}
            />
          ))}
        </div>
        {final && <PanelFinal col={final} onVerCliente={onVerCliente} />}
      </div>

      {voucher && (
        <ModalVoucher
          pago={voucher.pago}
          pedido={voucher.pedido}
          onCerrar={() => setVoucher(null)}
          onValidar={() => validar(voucher.pago)}
          onRechazar={() => rechazar(voucher.pago)}
        />
      )}
    </div>
  )
}

/** Etapa que cierra el embudo: la pone la logística, no se suelta a mano. */
const ETAPA_FINAL: EtapaCrm = 'ENTREGADO'

/** Tono de cada columna (punto, barra y resaltado al soltar). */
const TONO: Record<EtapaCrm, string> = {
  NUEVO: '',
  DIAGNOSTICADO: 'krk-t-iris',
  COTIZADO: 'krk-t-iris',
  DATOS_COMPLETOS: 'krk-t-saffron',
  PENDIENTE_VALIDACION_PAGO: 'krk-t-saffron',
  POR_DESPACHAR: 'krk-t-ember',
  EN_RUTA: 'krk-t-ember',
  ENTREGADO: 'krk-t-spruce',
  REPROGRAMADO: 'krk-t-saffron',
  FRIO: '',
  NO_CONTESTA: '',
  CONSULTADO_NO_HABIDO: 'krk-t-ember',
}

/** CALIENTE / TIBIO / FRÍO del prospecto → clase del punto de color. */
function temperatura(estado: string): string {
  const e = String(estado || '').toUpperCase()
  if (e.includes('CALIENTE')) return 'is-hot'
  if (e.includes('TIBIO')) return 'is-warm'
  if (e.includes('FRIO') || e.includes('FRÍO')) return 'is-cold'
  return ''
}

/** "ahora" / "hace 3 h" / "hace 5 d": cabe en la píldora de la tarjeta. */
function haceCorto(valor: string | Date | null | undefined): string {
  if (!valor) return ''
  const min = Math.max(0, Math.round((Date.now() - new Date(valor).getTime()) / 60_000))
  if (min < 60) return min < 1 ? 'ahora' : `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} d`
}

// Nunca el id interno ig:/fb: de Instagram o Messenger: ver nombreVisible.
const nombreDe = (p: PedidoEnEmbudo) => nombreVisible(p.nombreProspecto, p.telefonoProspecto).toLowerCase()

function Avatar({ texto }: { texto: string }) {
  return (
    <span className={`krk-emb__av av${tonoAvatar(texto)}`} aria-hidden="true">
      {iniciales(texto)}
    </span>
  )
}

function Indicador({ icon, valor, label, tag }: { icon: string; valor: number; label: string; tag?: string }) {
  return (
    <div className="krk-emb__stat">
      <span className="krk-emb__stat-ico">
        <Icon icon={icon} width={18} />
      </span>
      <div>
        <b>
          {valor}
          {tag && <span className="krk-emb__tag">{tag}</span>}
        </b>
        <small>{label}</small>
      </div>
    </div>
  )
}

function Columna({
  col,
  total,
  mayor,
  moviendo,
  onMover,
  onVerVoucher,
  onVerCliente,
  arrastrando,
  onArrastrar,
}: {
  col: ColumnaEmbudo
  total: number
  mayor: number
  moviendo: number | null
  onMover: (p: PedidoEnEmbudo, e: EtapaCrm) => void
  onVerVoucher: (pago: ComprobantePagoLead, pedido: PedidoEnEmbudo) => void
  onVerCliente?: (telefono: string) => void
  arrastrando: PedidoEnEmbudo | null
  onArrastrar: (p: PedidoEnEmbudo | null) => void
}) {
  const meta = ETAPA_META[col.etapa]
  const [encima, setEncima] = useState(false)
  // Solo se puede soltar donde el backend acepta un movimiento a mano, y nunca
  // sobre la columna de la que salió la tarjeta.
  const aceptaDrop =
    !!arrastrando &&
    ETAPAS_MANUALES.includes(col.etapa) &&
    !col.pedidos.some((p) => p.id === arrastrando.id)
  const porcentaje = total > 0 ? Math.round((col.total / total) * 100) : 0

  return (
    <section
      onDragOver={(e) => {
        if (!aceptaDrop) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setEncima(true)
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        setEncima(false)
        if (!aceptaDrop || !arrastrando) return
        e.preventDefault()
        onMover(arrastrando, col.etapa)
        onArrastrar(null)
      }}
      className={`krk-emb__col ${TONO[col.etapa]} ${encima && aceptaDrop ? 'is-over' : ''} ${arrastrando && !aceptaDrop ? 'is-off' : ''}`}
    >
      <header className="krk-emb__head">
        <span className="krk-emb__dot" />
        <h3 className="krk-emb__name">{meta.label}</h3>
        <span className="krk-emb__count">{col.total}</span>
        <span className="krk-emb__vol">
          {porcentaje}%<small>del embudo</small>
        </span>
      </header>
      <span className="krk-emb__bar" aria-hidden="true">
        <i style={{ width: `${Math.round((col.total / mayor) * 100)}%` }} />
      </span>

      <div className="krk-emb__body">
        {col.pedidos.length === 0 && (
          <div className="krk-emb__empty">
            <span>Vacío</span>
            <small>Arrastra un pedido aquí</small>
          </div>
        )}
        {col.pedidos.map((p) => (
          <Tarjeta
            key={p.id}
            pedido={p}
            etapa={col.etapa}
            ocupado={moviendo === p.id}
            arrastrandoEsta={arrastrando?.id === p.id}
            onMover={onMover}
            onVerVoucher={onVerVoucher}
            onVerCliente={onVerCliente}
            onArrastrar={onArrastrar}
          />
        ))}
        {col.total > col.pedidos.length && (
          <p className="krk-emb__more">y {col.total - col.pedidos.length} más…</p>
        )}
      </div>
    </section>
  )
}

/** La etapa final: panel verde punteado con la lista de quienes ya recibieron. */
function PanelFinal({ col, onVerCliente }: { col: ColumnaEmbudo; onVerCliente?: (telefono: string) => void }) {
  const meta = ETAPA_META[col.etapa]
  const visibles = col.pedidos.slice(0, 8)
  return (
    // Es un <section> como las demás columnas: recibe el drag pero no acepta
    // el drop (la entrega la marca la logística).
    <section className="krk-emb__fund">
      <div className="krk-emb__fund-core">
        <span className="krk-emb__fund-ico">
          <Icon icon="solar:cup-star-linear" width={22} />
        </span>
        <h3 className="krk-emb__fund-name">{meta.label}</h3>
        <div className="krk-emb__fund-sum">
          <b>{col.total}</b>
          <small>pedidos entregados</small>
        </div>
      </div>
      <div className="krk-emb__fund-list">
        {col.pedidos.length === 0 && <p className="krk-emb__fund-empty">Vacío</p>}
        {visibles.map((p) => (
          <button
            key={p.id}
            type="button"
            className="krk-emb__fund-row"
            onClick={() => onVerCliente?.(p.telefonoProspecto)}
          >
            <Avatar texto={nombreDe(p)} />
            <span>
              <b>{nombreDe(p)}</b>
              <small>{haceCorto(p.etapaEn)}</small>
            </span>
          </button>
        ))}
        {col.total > visibles.length && (
          <p className="krk-emb__more">+{col.total - visibles.length} más</p>
        )}
      </div>
    </section>
  )
}

function Tarjeta({
  pedido,
  etapa,
  ocupado,
  arrastrandoEsta,
  onMover,
  onVerVoucher,
  onVerCliente,
  onArrastrar,
}: {
  pedido: PedidoEnEmbudo
  etapa: EtapaCrm
  ocupado: boolean
  arrastrandoEsta: boolean
  onMover: (p: PedidoEnEmbudo, e: EtapaCrm) => void
  onVerVoucher: (pago: ComprobantePagoLead, pedido: PedidoEnEmbudo) => void
  onVerCliente?: (telefono: string) => void
  onArrastrar: (p: PedidoEnEmbudo | null) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const pendiente = pedido.comprobantesPago?.[0]
  const nombre = nombreDe(pedido)
  const puntaje = Math.max(0, Math.min(100, Number(pedido.puntaje) || 0))
  // Más de 2 días quieto en la misma etapa: se marca como el "cierra hoy" de Hearth.
  const atrasado = pedido.etapaEn ? Date.now() - new Date(pedido.etapaEn).getTime() > 2 * 86_400_000 : false
  const temp = temperatura(pedido.estado)

  return (
    <div
      // Arrastrar es un atajo, no el único camino: el menú "Mover" sigue ahí
      // para quien usa teclado o pantalla táctil, donde el drag nativo no va.
      draggable={!ocupado}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        // Se viaja el id y la etapa de origen para poder descartar el drop
        // sobre la misma columna sin ir al servidor.
        e.dataTransfer.setData(
          'application/x-pedido',
          JSON.stringify({ id: pedido.id, desde: etapa }),
        )
        onArrastrar(pedido)
      }}
      onDragEnd={() => onArrastrar(null)}
      // Clic en la tarjeta (fuera de sus botones) abre la ficha del cliente.
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, a')) return
        onVerCliente?.(pedido.telefonoProspecto)
      }}
      className={`krk-emb__card ${ocupado ? 'is-busy' : ''} ${arrastrandoEsta ? 'is-dragging' : ''}`}
    >
      <div className="krk-emb__top">
        <Avatar texto={nombre} />
        <button
          type="button"
          onClick={() => onVerCliente?.(pedido.telefonoProspecto)}
          className="krk-emb__who"
        >
          <b>{nombre}</b>
          <small>{contactoVisible(pedido.telefonoProspecto)}</small>
        </button>
      </div>

      <div className="krk-emb__score">
        <span className="krk-emb__meter" aria-hidden="true">
          <i style={{ width: `${puntaje}%` }} />
        </span>
        <small>Interés {puntaje}</small>
        {temp && (
          <span className={`krk-emb__temp ${temp}`}>
            {temp === 'is-hot' ? 'Caliente' : temp === 'is-warm' ? 'Tibio' : 'Frío'}
          </span>
        )}
      </div>

      <div className="krk-emb__foot">
        <span className={`krk-emb__chip ${atrasado ? 'is-late' : ''}`}>
          <Icon icon="solar:clock-circle-linear" width={13} />
          {haceCorto(pedido.etapaEn)}
        </span>
        <span className="ml-auto mr-1">
          <Link
            to={rutaAlChat({ telefono: pedido.telefonoProspecto, conversacionId: pedido.conversacion?.id })}
            title="Abrir su chat"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
          >
            <Icon icon="solar:chat-round-dots-bold-duotone" className="text-sm" />
            Chat
          </Link>
        </span>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => setAbierto((v) => !v)}
          className="krk-emb__mover"
        >
          {ocupado ? '…' : 'Mover'}
        </button>
      </div>

      {pendiente && (
        <button
          type="button"
          onClick={() => onVerVoucher(pendiente, pedido)}
          className="krk-emb__voucher justify-self-start"
        >
          <Icon icon="solar:eye-linear" width={13} />
          Revisar el comprobante
        </button>
      )}

      {abierto && (
        <div className="krk-emb__menu">
          {ETAPAS_MANUALES.filter((e) => e !== etapa).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setAbierto(false)
                onMover(pedido, e)
              }}
            >
              {ETAPA_META[e].label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * El voucher, en grande. Validar sin ver la imagen no es validar, así que
 * cuando no se pudo bajar la foto se dice en claro en vez de dejar un hueco.
 */
function ModalVoucher({
  pago,
  pedido,
  onCerrar,
  onValidar,
  onRechazar,
}: {
  pago: ComprobantePagoLead
  pedido: PedidoEnEmbudo
  onCerrar: () => void
  onValidar: () => void
  onRechazar: () => void
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(29,25,21,0.28)] backdrop-blur-[6px]" onClick={onCerrar} />
      <div className="relative w-full max-w-sm rounded-[24px] bg-[#fffdfa] p-6 shadow-[0_24px_60px_-18px_rgba(40,30,20,0.32)] dark:bg-slate-900">
        <p className="text-[12.5px] font-bold text-[#6b645c] dark:text-slate-400">
          Comprobante de pago
        </p>
        <h3 className="text-[22px] font-bold capitalize text-[#1d1915] dark:text-slate-100">
          {nombreVisible(pedido.nombreProspecto, pedido.telefonoProspecto)}
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          Enviado {moment(pago.recibidoEn).format('DD/MM/YYYY HH:mm')}
        </p>

        {pago.url && /\.pdf$/i.test(pago.url) ? (
          // La constancia de una transferencia llega en PDF: no es una imagen.
          <a
            href={pago.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-6 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            Ver comprobante (PDF)
          </a>
        ) : pago.url ? (
          <a href={pago.url} target="_blank" rel="noopener noreferrer">
            <img
              src={pago.url}
              alt="Comprobante de pago"
              className="max-h-72 w-full rounded-xl border border-gray-200 object-contain dark:border-gray-800"
            />
          </a>
        ) : (
          <p className="rounded-xl bg-amber-50 px-3 py-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            La imagen no se pudo guardar. Ábrela en el chat de WhatsApp antes de
            validar: aprobar un pago sin verlo es lo que este paso evita.
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onValidar}
            className="h-11 flex-1 rounded-xl bg-[#0a8f74] text-sm font-bold text-white hover:bg-[#0a7a63]"
          >
            El pago está bien
          </button>
          <button
            type="button"
            onClick={onRechazar}
            className="h-11 rounded-xl bg-[#fbe6dd] px-4 text-sm font-bold text-[#b53f19] hover:bg-[#f7d6c8] dark:bg-orange-500/15 dark:text-orange-300"
          >
            Rechazar
          </button>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600"
        >
          Revisarlo después
        </button>
      </div>
    </div>
  )
}
