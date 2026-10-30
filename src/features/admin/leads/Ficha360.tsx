/**
 * E3 — historial 360° por cliente.
 *
 * Todo lo que se sabe de una persona en una sola pantalla: lo que compró, con
 * qué malestar llegó, qué pidió y no había, por dónde pasó su pedido y los
 * comprobantes de pago que mandó.
 *
 * La llave es el teléfono, porque en WhatsApp no hay otra. Si el cliente
 * escribió desde dos números con el mismo DNI, se ven juntos y se dice en
 * pantalla — si no, los pedidos "de otro chat" parecerían un error.
 */
import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'
import { rutaAlChat } from './LeadsModel'
import moment from 'moment'
import { crmService, ETAPA_META, type Ficha360 as Ficha, type GuiaConsumo } from '@/services/crm.service'
import DrawerHearth, {
  DRAWER_H3,
  DRAWER_MONTO_STYLE,
  DRAWER_ROW,
  DRAWER_WELL,
  DrawerCargando,
  DrawerDato,
  DrawerEstado,
  DrawerHeader,
} from '@/components/DrawerHearth'

const soles = (n: number) => `S/ ${Number(n ?? 0).toFixed(2)}`

export function Ficha360({
  telefono,
  onCerrar,
}: {
  telefono: string
  onCerrar: () => void
}) {
  const [ficha, setFicha] = useState<Ficha | null>(null)
  const [cargando, setCargando] = useState(true)
  const [duplicados, setDuplicados] = useState<
    { telefono: string; nombre: string; parecido: number }[]
  >([])

  useEffect(() => {
    let vivo = true
    setCargando(true)
    crmService
      .ficha360(telefono)
      .then((f) => vivo && setFicha(f))
      .catch(() => undefined)
      .finally(() => vivo && setCargando(false))
    crmService
      .posiblesDuplicados(telefono)
      .then((d) => vivo && setDuplicados(d))
      .catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [telefono])

  const nombre = ficha?.cliente.nombreProspecto || telefono

  return (
    // Por encima del cajón de conversación (z-999999 del Modal compartido):
    // la ficha se abre DESDE el chat, así que si queda debajo el usuario
    // pulsa "Ver su historial" y no pasa nada visible.
    <DrawerHearth
      isOpen
      onClose={onCerrar}
      label="Historial del cliente"
      contentKey={ficha ? telefono : cargando ? 'cargando' : 'vacio'}
      zIndex={1000001}
    >
      {cargando && <DrawerCargando texto="Cargando…" />}

      {!cargando && !ficha && (
        <div data-drawer-stagger className="flex flex-col gap-6">
          <DrawerHeader icon="solar:user-rounded-linear" title={telefono} subtitle="Historial del cliente" />
          <p className="py-12 text-center text-sm text-[#978f86]">
            Este número todavía no tiene historial.
          </p>
        </div>
      )}

      {ficha && (
        <div data-drawer-stagger className="flex flex-col gap-6">
          <DrawerHeader
            icon="solar:user-rounded-linear"
            title={<span className="capitalize">{String(nombre).toLowerCase()}</span>}
            subtitle={
              <>
                <span className="tabular-nums">{telefono}</span>
                <span aria-hidden>·</span>
                <DrawerEstado label={ETAPA_META[ficha.cliente.etapa].label} tone={TONO_ETAPA[ficha.cliente.etapa] ?? 'plain'} />
              </>
            }
          />

          <Link
            to={rutaAlChat({ telefono, conversacionId: ficha.cliente.conversacionId })}
            onClick={onCerrar}
            className="-mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300"
          >
            <Icon icon="solar:chat-round-dots-bold-duotone" className="text-sm" />
            Abrir chat
          </Link>

          {(ficha.cliente.dni || ficha.cliente.edad != null) && (
            <p className="-mt-1 text-[15px] text-[#4a443d] dark:text-slate-300">
              {ficha.cliente.dni && <>DNI <b className="font-bold text-[#1d1915] dark:text-slate-100">{ficha.cliente.dni}</b></>}
              {ficha.cliente.dni && ficha.cliente.edad != null && ' · '}
              {ficha.cliente.edad != null && <>{ficha.cliente.edad} años</>}
            </p>
          )}

          {ficha.cliente.unidoPorDni && (
            <div
              data-testid="aviso-union"
              className="flex items-start gap-2 rounded-xl bg-[#e8e6fb] px-3 py-2.5 text-[13px] font-semibold text-[#4a41c4] dark:bg-[#7a72e6]/20 dark:text-[#aaa4f5]"
            >
              <Icon icon="solar:link-linear" className="mt-0.5 flex-none" />
              <span>
                Escribe desde {ficha.cliente.telefonos.length} números con el mismo DNI:{' '}
                {ficha.cliente.telefonos.join(', ')}. El historial está unido.
              </span>
            </div>
          )}

          {/* Lo comprado, como el bloque "Last sync" de Hearth */}
          <div className={DRAWER_WELL}>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#6b645c] dark:text-slate-400">Gastado</p>
              <p className="text-[24px] font-bold leading-tight tabular-nums text-[#1d1915] dark:text-slate-100" style={DRAWER_MONTO_STYLE}>
                {soles(ficha.resumenCompras.gastado)}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-5 text-right">
              <DrawerDato label="Pedidos" value={String(ficha.resumenCompras.cantidad)} />
              <DrawerDato label="Promedio" value={soles(ficha.resumenCompras.ticketPromedio)} />
            </dl>
          </div>

          <Seccion titulo="Compras">
            {ficha.pedidos.length === 0 ? (
              <p className={VACIO}>Todavía no compró.</p>
            ) : (
              ficha.pedidos.map((p) => (
                <div key={`${p.comprobanteId}`} className={DRAWER_ROW}>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-[#1d1915] dark:text-slate-100">{p.comprobante ?? '—'}</p>
                    {p.destino && <p className="mt-0.5 text-[13px] text-[#6b645c] dark:text-slate-400">{p.destino}</p>}
                  </div>
                  <span className="shrink-0 text-[15px] font-bold tabular-nums text-[#1d1915] dark:text-slate-100">
                    {soles(p.monto)}
                  </span>
                </div>
              ))
            )}
          </Seccion>

          <Seccion titulo="Con qué llegó">
            {/* Lo que contó de su malestar, en sus palabras. Es el dato
                con el que se arma la guía de consumo, así que va primero
                y entero, no como etiqueta recortada. */}
            {ficha.cliente.sintomas && (
              <p className="mb-2 rounded-xl bg-[#f8ecd2] px-3 py-2.5 text-[13.5px] leading-relaxed text-[#8f600a] dark:bg-amber-500/15 dark:text-amber-200">
                {ficha.cliente.sintomas}
              </p>
            )}
            {ficha.consultasDeSalud.length === 0 ? (
              !ficha.cliente.sintomas && <p className={VACIO}>Sin consultas de salud registradas.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {ficha.consultasDeSalud.map((c, i) => (
                  <span key={i} title={moment(c.creadoEn).format('DD/MM/YYYY')} className={`${CHIP} bg-[#e8e6fb] text-[#4a41c4] dark:bg-[#7a72e6]/20 dark:text-[#aaa4f5]`}>
                    {c.texto}
                  </span>
                ))}
              </div>
            )}
          </Seccion>

          <Seccion titulo="Guía de consumo">
            <GuiaDeConsumo conversacionId={ficha.cliente.conversacionId} />
          </Seccion>

          <Seccion titulo="Pidió y no teníamos">
            {ficha.noHabidos.length === 0 ? (
              <p className={VACIO}>Nada: siempre encontró lo que buscaba.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {ficha.noHabidos.map((c, i) => (
                    <span key={i} title={moment(c.creadoEn).format('DD/MM/YYYY')} className={`${CHIP} bg-[#fbe6dd] text-[#b53f19] dark:bg-orange-500/15 dark:text-orange-300`}>
                      {c.texto}
                    </span>
                  ))}
                </div>
                {/* Es la razón de ser de esta lista: cuando llegue, hay a
                    quién avisarle. */}
                <p className="mt-2 text-[13px] text-[#6b645c] dark:text-slate-400">
                  Cuando entre stock de algo de esta lista, este cliente lo
                  estaba buscando.
                </p>
              </>
            )}
          </Seccion>

          {ficha.comprobantesPago.length > 0 && (
            <Seccion titulo="Comprobantes de pago">
              {ficha.comprobantesPago.map((p) => (
                <div key={p.id} className={DRAWER_ROW}>
                  <div className="min-w-0">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[15px] font-bold text-[#1d1915] underline-offset-2 hover:underline dark:text-slate-100">
                        Ver imagen
                      </a>
                    ) : (
                      <span className="text-[15px] font-bold text-[#978f86]">Sin imagen</span>
                    )}
                    <p className="mt-0.5 text-[13px] text-[#6b645c] dark:text-slate-400">{moment(p.recibidoEn).format('DD/MM HH:mm')}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-bold">
                    {p.validadoEn ? (
                      <DrawerEstado label={`Validado por ${p.validadoPor}`} tone="spruce" />
                    ) : p.rechazadoEn ? (
                      <DrawerEstado label={`Rechazado: ${p.rechazadoMotivo}`} tone="ember" />
                    ) : (
                      <DrawerEstado label="Por revisar" tone="saffron" />
                    )}
                  </span>
                </div>
              ))}
            </Seccion>
          )}

          <Seccion titulo="Por dónde pasó">
            {ficha.historialEtapas.length === 0 ? (
              <p className={VACIO}>Sin movimientos todavía.</p>
            ) : (
              [...ficha.historialEtapas].reverse().map((m, i) => (
                <div key={i} className={DRAWER_ROW}>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-[#1d1915] dark:text-slate-100">
                      {ETAPA_META[m.hacia]?.label ?? m.hacia}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#6b645c] dark:text-slate-400">
                      {m.actor === 'bot' ? 'automático' : m.actor}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#6b645c] dark:text-slate-400">
                    {moment(m.creadoEn).format('DD/MM HH:mm')}
                  </span>
                </div>
              ))
            )}
          </Seccion>

          {duplicados.length > 0 && (
            <Seccion titulo="¿Es el mismo cliente?">
              {/* Por nombre parecido se SUGIERE, nunca se une solo: "Rosa
                  Quispe" hay muchas, y mezclar dos clientes les mostraría
                  el historial de salud del otro. */}
              <p className="mb-1 text-[13px] text-[#6b645c] dark:text-slate-400">
                Estos números tienen un nombre parecido. Revísalos antes de
                tratarlos como la misma persona: solo el DNI une solo.
              </p>
              {duplicados.map((d) => (
                <div key={d.telefono} className={DRAWER_ROW}>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-[#1d1915] dark:text-slate-100">{d.nombre}</p>
                    <p className="mt-0.5 text-[13px] tabular-nums text-[#6b645c] dark:text-slate-400">{d.telefono}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold text-[#6b645c] dark:text-slate-400">
                    {Math.round(Number(d.parecido) * 100)}% parecido
                  </span>
                </div>
              ))}
            </Seccion>
          )}
        </div>
      )}
    </DrawerHearth>
  )
}

/**
 * La guía se arma con el "cómo se toma" de cada producto y lo que contó el
 * cliente; el negocio la revisa y la envía. Nunca sale sola: es tema de
 * salud. Lo guardado lo repite la IA cuando el cliente pregunta.
 */
function GuiaDeConsumo({ conversacionId }: { conversacionId: number }) {
  const [guia, setGuia] = useState<GuiaConsumo | null>(null)
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'guardando' | 'enviando'>('cargando')
  const [aviso, setAviso] = useState<{ tono: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    let vivo = true
    setEstado('cargando')
    crmService
      .guia(conversacionId)
      .then((g) => {
        if (!vivo) return
        setGuia(g)
        setTexto(g.guardada?.texto || g.borrador || '')
      })
      .catch(() => undefined)
      .finally(() => vivo && setEstado('listo'))
    return () => {
      vivo = false
    }
  }, [conversacionId])

  const guardar = async (enviar: boolean) => {
    setEstado(enviar ? 'enviando' : 'guardando')
    setAviso(null)
    try {
      const r = await crmService.guardarGuia(conversacionId, texto, enviar)
      setGuia((g) => (g ? { ...g, guardada: r.guardada } : g))
      setAviso({ tono: 'ok', texto: enviar ? 'Enviada por WhatsApp y guardada.' : 'Guardada. La IA ya la usa.' })
    } catch (e: any) {
      const m = e?.response?.data?.message ?? e?.message
      setAviso({ tono: 'error', texto: Array.isArray(m) ? m.join(' · ') : m || 'No se pudo guardar.' })
    } finally {
      setEstado('listo')
    }
  }

  if (estado === 'cargando') return <p className={VACIO}>Cargando…</p>
  const ocupado = estado !== 'listo'

  return (
    <div className="flex flex-col gap-2" data-testid="guia-consumo">
      {guia?.guardada ? (
        <p className="text-[12.5px] text-[#6b645c] dark:text-slate-400">
          Guardada el {moment(guia.guardada.en).format('DD/MM/YYYY')}. La IA la repite si pregunta cómo tomarlo.
        </p>
      ) : guia?.borrador ? (
        <p className="text-[12.5px] text-[#6b645c] dark:text-slate-400">
          Borrador con su última compra. Revísalo antes de enviarlo.
        </p>
      ) : (
        <p className={VACIO}>
          {guia?.productos.length
            ? 'Ningún producto de su última compra tiene "Modo de uso". Escríbelo en el producto o arma la guía aquí.'
            : 'Todavía no compró. Puedes escribirla aquí igual.'}
        </p>
      )}
      {guia && guia.sinModoDeUso.length > 0 && (guia.borrador || guia.guardada) && (
        <p className="rounded-xl bg-[#f8ecd2] px-3 py-2 text-[12.5px] text-[#8f600a] dark:bg-amber-500/15 dark:text-amber-200">
          Sin modo de uso (no entran en el borrador): {guia.sinModoDeUso.join(', ')}.
        </p>
      )}
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={8}
        maxLength={4096}
        placeholder="Cómo debe tomar cada producto…"
        data-testid="guia-texto"
        className="w-full rounded-xl border border-[rgba(40,30,20,0.12)] bg-[#fffdfa] px-3 py-2 text-[13.5px] text-[#1d1915] outline-none focus:border-[rgba(40,30,20,0.32)] dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
      />
      {aviso && (
        <p className={`text-[12.5px] font-semibold ${aviso.tono === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
          {aviso.texto}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => guardar(false)}
          disabled={ocupado}
          data-testid="guia-guardar"
          className="rounded-xl border border-[rgba(40,30,20,0.15)] px-3 py-2 text-[13px] font-bold text-[#1d1915] hover:bg-[#f3eee6] disabled:opacity-50 dark:border-white/15 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {estado === 'guardando' ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => guardar(true)}
          disabled={ocupado || !texto.trim()}
          data-testid="guia-enviar"
          className="flex items-center gap-1.5 rounded-xl bg-[#1f7a4d] px-3 py-2 text-[13px] font-bold text-white hover:bg-[#19663f] disabled:opacity-50"
        >
          <Icon icon="ic:baseline-whatsapp" />
          {estado === 'enviando' ? 'Enviando…' : 'Guardar y enviar por WhatsApp'}
        </button>
      </div>
    </div>
  )
}

const VACIO = 'text-[13.5px] text-[#978f86]'
const CHIP = 'rounded-full px-2.5 py-1 text-[12px] font-bold'

/** Tono del punto de estado según la etapa del embudo. */
const TONO_ETAPA: Partial<Record<string, 'spruce' | 'iris' | 'saffron' | 'ember' | 'plain'>> = {
  DIAGNOSTICADO: 'iris',
  COTIZADO: 'iris',
  DATOS_COMPLETOS: 'saffron',
  PENDIENTE_VALIDACION_PAGO: 'saffron',
  POR_DESPACHAR: 'ember',
  EN_RUTA: 'ember',
  ENTREGADO: 'spruce',
  REPROGRAMADO: 'saffron',
  CONSULTADO_NO_HABIDO: 'ember',
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className={DRAWER_H3}>{titulo}</h3>
      {children}
    </section>
  )
}
