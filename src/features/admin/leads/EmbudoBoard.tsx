/**
 * E1 — el tablero del embudo.
 *
 * Doce columnas en el orden que definió el cliente. Lo primero que se ve
 * arriba es cuántos pagos esperan validación, porque es lo único del tablero
 * que bloquea plata: mientras nadie mire el voucher, el pedido no sale.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { nombreVisible, contactoVisible } from './LeadsModel'
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
      <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
        <Icon icon="eos-icons:loading" className="animate-spin text-3xl text-indigo-500" />
        <p className="text-sm">Cargando el embudo…</p>
      </div>
    )
  }
  if (!tablero) return null

  return (
    <div>
      {/* Lo único que bloquea plata */}
      {tablero.pagosPorValidar > 0 && (
        <div
          data-testid="aviso-pagos"
          className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <Icon icon="solar:wallet-money-bold-duotone" className="mt-0.5 text-lg" />
          <span>
            <b>
              {tablero.pagosPorValidar} pago
              {tablero.pagosPorValidar === 1 ? '' : 's'} por validar
            </b>
            . Ningún pedido pasa a despacho hasta que alguien revise el comprobante.
          </span>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {tablero.columnas.map((col) => (
          <Columna
            key={col.etapa}
            col={col}
            moviendo={moviendo}
            onMover={mover}
            onVerVoucher={(pago, pedido) => setVoucher({ pago, pedido })}
            onVerCliente={onVerCliente}
            arrastrando={arrastrando}
            onArrastrar={setArrastrando}
          />
        ))}
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

function Columna({
  col,
  moviendo,
  onMover,
  onVerVoucher,
  onVerCliente,
  arrastrando,
  onArrastrar,
}: {
  col: ColumnaEmbudo
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

  return (
    // Mismo armado que el tablero de Conversaciones: la columna lleva el fondo
    // y las tarjetas van blancas encima.
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
      className={`flex min-h-[9rem] w-[248px] flex-shrink-0 flex-col rounded-2xl transition-colors duration-150 ${
        encima && aceptaDrop
          ? 'bg-violet-100 ring-2 ring-violet-400 dark:bg-violet-900/30 dark:ring-violet-600'
          : 'bg-gray-100/80 dark:bg-slate-900/60'
      } ${arrastrando && !aceptaDrop ? 'opacity-50' : ''}`}
    >
      <header className="flex items-center gap-2 px-3 py-2.5">
        <span className={`h-2 w-2 flex-none rounded-full ${meta.acento}`} />
        <h3 className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
          {meta.label}
        </h3>
        <span className="ml-auto flex-none text-xs font-semibold text-gray-400 dark:text-gray-500">
          {col.total}
        </span>
      </header>

      <div className="flex flex-col gap-2 px-2 pb-2">
        {col.pedidos.length === 0 && (
          <p className="flex flex-1 items-center justify-center pb-4 text-xs text-gray-400 dark:text-gray-600">
            Vacío
          </p>
        )}
        {col.pedidos.map((p) => (
          <Tarjeta
            key={p.id}
            pedido={p}
            etapa={col.etapa}
            ocupado={moviendo === p.id}
            onMover={onMover}
            onVerVoucher={onVerVoucher}
            onVerCliente={onVerCliente}
            onArrastrar={onArrastrar}
          />
        ))}
        {col.total > col.pedidos.length && (
          <p className="px-1 text-[11px] text-gray-400">
            y {col.total - col.pedidos.length} más…
          </p>
        )}
      </div>
    </section>
  )
}

function Tarjeta({
  pedido,
  etapa,
  ocupado,
  onMover,
  onVerVoucher,
  onVerCliente,
  onArrastrar,
}: {
  pedido: PedidoEnEmbudo
  etapa: EtapaCrm
  ocupado: boolean
  onMover: (p: PedidoEnEmbudo, e: EtapaCrm) => void
  onVerVoucher: (pago: ComprobantePagoLead, pedido: PedidoEnEmbudo) => void
  onVerCliente?: (telefono: string) => void
  onArrastrar: (p: PedidoEnEmbudo | null) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const pendiente = pedido.comprobantesPago?.[0]

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
      className={`rounded-xl border border-gray-200 bg-white p-2.5 transition-colors duration-150 hover:border-violet-300 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-violet-700 ${
        ocupado ? 'opacity-50' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <button
        type="button"
        onClick={() => onVerCliente?.(pedido.telefonoProspecto)}
        className="block w-full text-left"
      >
        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
          {nombreVisible(pedido.nombreProspecto, pedido.telefonoProspecto)}
        </p>
        <p className="font-mono text-[11px] text-gray-400">{contactoVisible(pedido.telefonoProspecto)}</p>
      </button>

      {pendiente && (
        <button
          type="button"
          onClick={() => onVerVoucher(pendiente, pedido)}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <Icon icon="solar:eye-bold-duotone" className="text-sm" />
          Revisar el comprobante
        </button>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {fechaRelativa(pedido.etapaEn)}
        </span>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => setAbierto((v) => !v)}
          className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
        >
          {ocupado ? '…' : 'Mover'}
        </button>
      </div>

      {abierto && (
        <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-2 dark:border-gray-800">
          {ETAPAS_MANUALES.filter((e) => e !== etapa).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setAbierto(false)
                onMover(pedido, e)
              }}
              className="block w-full rounded-md px-1.5 py-1 text-left text-[11px] text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
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
      <div className="absolute inset-0 bg-black/60" onClick={onCerrar} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-[#111827]">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Comprobante de pago
        </p>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">
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
            className="h-10 flex-1 rounded-xl bg-emerald-500 text-sm font-black text-white hover:bg-emerald-600"
          >
            El pago está bien
          </button>
          <button
            type="button"
            onClick={onRechazar}
            className="h-10 rounded-xl border border-rose-200 px-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-900/20"
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
