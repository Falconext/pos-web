/**
 * Chat de la tienda online con el vendedor IA (2026-10-30).
 *
 * El cliente que navega la tienda le escribe al mismo vendedor que atiende el
 * WhatsApp del negocio: con el catálogo real, sus reglas y su tono, y si toma
 * el chat una persona desde la bandeja, le responde ella. El negocio lo
 * enciende en IA de Ventas → Mi vendedor → Ajustes.
 *
 * Se monta una sola vez en App (como SeoTienda) y aparece en todas las
 * plantillas. Sabe qué producto está mirando el cliente, y las fotos que manda
 * el vendedor traen un botón para agregar ese producto al carrito.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Icon } from '@iconify/react'
import {
  type MensajeChat,
  sesionDelChat,
  sugerencias,
  trozosDeTexto,
  ubicacionEnTienda,
  unirMensajes,
} from './chatTienda'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api'
const datos = <T,>(r: { data: any }): T => (r.data?.data ?? r.data) as T

interface TiendaChat {
  nombre: string
  color: string
  logo: string | null
  asesor: string | null
  conWhatsapp: boolean
}

// Una vez por tienda: la configuración no cambia mientras navega.
const cacheTiendas = new Map<string, Promise<TiendaChat | null>>()

function tiendaDelChat(slug: string): Promise<TiendaChat | null> {
  if (!cacheTiendas.has(slug)) {
    cacheTiendas.set(
      slug,
      axios
        .get(`${BASE_URL}/public/store/${encodeURIComponent(slug)}`)
        .then((r) => {
          const t = datos<any>(r)
          if (!t?.chatIa?.activo) return null
          return {
            nombre: t.nombreComercial || t.razonSocial || 'la tienda',
            color: t.colorPrimario || t.diseno?.colorPrimario || '#111827',
            logo: t.logo || t.logoUrl || null,
            asesor: t.chatIa.asesor || null,
            conWhatsapp: Boolean(t.whatsappTienda ?? t.diseno?.whatsappTienda),
          }
        })
        .catch(() => null),
    )
  }
  return cacheTiendas.get(slug)!
}

function Texto({ texto }: { texto: string }) {
  return (
    <>
      {trozosDeTexto(texto).map((t, i) =>
        t.tipo === 'negrita' ? (
          <strong key={i}>{t.valor}</strong>
        ) : t.tipo === 'enlace' ? (
          <a key={i} href={t.valor} target="_blank" rel="noopener noreferrer" className="break-all underline">
            {t.valor}
          </a>
        ) : (
          <span key={i}>{t.valor}</span>
        ),
      )}
    </>
  )
}

export default function ChatTiendaIa() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const lugar = useMemo(() => ubicacionEnTienda(pathname), [pathname])
  const slug = lugar?.slug ?? null

  const [tienda, setTienda] = useState<TiendaChat | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [servidor, setServidor] = useState<MensajeChat[]>([])
  const [pendientes, setPendientes] = useState<MensajeChat[]>([])
  const [escribiendo, setEscribiendo] = useState(false)
  const [atiendePersona, setAtiendePersona] = useState(false)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [noLeidos, setNoLeidos] = useState(0)
  const finRef = useRef<HTMLDivElement>(null)
  const vistosRef = useRef(0)

  const sesion = useMemo(() => (slug && tienda ? sesionDelChat(slug) : null), [slug, tienda])

  useEffect(() => {
    setTienda(null)
    setServidor([])
    setPendientes([])
    if (!slug) return
    let vigente = true
    tiendaDelChat(slug).then((t) => vigente && setTienda(t))
    return () => {
      vigente = false
    }
  }, [slug])

  const cargar = useCallback(async () => {
    if (!slug || !sesion) return
    try {
      const r = await axios.get(`${BASE_URL}/public/store/${encodeURIComponent(slug)}/chat`, { params: { sesion } })
      const d = datos<{ mensajes: MensajeChat[]; escribiendo: boolean; atiendePersona: boolean }>(r)
      setServidor(d.mensajes ?? [])
      setEscribiendo(Boolean(d.escribiendo))
      setAtiendePersona(Boolean(d.atiendePersona))
    } catch {
      /* sin red: se reintenta en el próximo turno */
    }
  }, [slug, sesion])

  // Al entrar, por si ya conversó antes en esta tienda.
  useEffect(() => {
    cargar()
  }, [cargar])

  // Abierto, o esperando respuesta: se consulta seguido. Cerrado, cada tanto
  // (para avisar que respondieron).
  useEffect(() => {
    if (!sesion) return
    const esperando = escribiendo || pendientes.length > 0
    const cada = abierto || esperando ? 2500 : 20000
    const t = setInterval(cargar, cada)
    return () => clearInterval(t)
  }, [sesion, abierto, escribiendo, pendientes.length, cargar])

  const mensajes = useMemo(() => unirMensajes(servidor, pendientes), [servidor, pendientes])
  const deLaTienda = mensajes.filter((m) => m.de === 'tienda').length

  useEffect(() => {
    if (abierto) {
      vistosRef.current = deLaTienda
      setNoLeidos(0)
    } else {
      setNoLeidos(Math.max(0, deLaTienda - vistosRef.current))
    }
  }, [abierto, deLaTienda])

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [abierto, mensajes.length, escribiendo])

  if (!lugar || lugar.enCheckout || !tienda || !sesion) return null

  const enviar = async (contenido: string) => {
    const limpio = contenido.trim()
    if (!limpio) return
    setError(null)
    setTexto('')
    const temporal: MensajeChat = {
      id: `p${Date.now()}`,
      de: 'cliente',
      tipo: 'TEXTO',
      texto: limpio,
      url: null,
      productoId: null,
      opciones: null,
      clienteId: null,
      creadoEn: new Date().toISOString(),
      pendiente: true,
    }
    setPendientes((p) => [...p, temporal])
    try {
      const r = await axios.post(`${BASE_URL}/public/store/${encodeURIComponent(lugar.slug)}/chat`, {
        sesion,
        texto: limpio,
        ...(lugar.productoId ? { productoId: lugar.productoId } : {}),
      })
      const { clienteId } = datos<{ clienteId: string }>(r)
      setPendientes((p) => p.map((m) => (m.id === temporal.id ? { ...m, clienteId } : m)))
      setEscribiendo(true)
    } catch (e: any) {
      setPendientes((p) => p.filter((m) => m.id !== temporal.id))
      setTexto(limpio)
      setError(e?.response?.data?.message || 'No se pudo enviar. Inténtalo de nuevo.')
    }
  }

  const agregarAlCarrito = (productoId: number) => {
    // La portada de la tienda agrega con su propia lógica (precio, opciones
    // del producto) y abre el carrito.
    if (window.innerWidth < 640) setAbierto(false)
    navigate(`/tienda/${encodeURIComponent(lugar.slug)}?product=${productoId}&carrito=1`)
  }

  const nombreVendedor = tienda.asesor || tienda.nombre
  const abajo = tienda.conWhatsapp ? 'bottom-[5.5rem]' : 'bottom-5'

  return (
    <>
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label={`Chatear con ${nombreVendedor}`}
          data-testid="chat-tienda-abrir"
          className={`fixed ${abajo} right-5 z-[61] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95`}
          style={{ backgroundColor: tienda.color }}
        >
          <Icon icon="solar:chat-round-dots-bold" width={28} />
          {noLeidos > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
              {noLeidos}
            </span>
          )}
        </button>
      )}

      {abierto && (
        <section
          role="dialog"
          aria-label={`Chat con ${nombreVendedor}`}
          data-testid="chat-tienda"
          className="fixed inset-0 z-[70] flex flex-col bg-white sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[560px] sm:max-h-[calc(100vh-2.5rem)] sm:w-[380px] sm:overflow-hidden sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-black/5"
        >
          <header className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: tienda.color }}>
            {tienda.logo ? (
              <img src={tienda.logo} alt="" className="h-9 w-9 flex-none rounded-full bg-white object-cover" />
            ) : (
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                {nombreVendedor.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{nombreVendedor}</p>
              <p className="flex items-center gap-1 text-[11px] opacity-90">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {atiendePersona ? 'Te atiende una persona del equipo' : 'En línea · responde al instante'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15"
            >
              <Icon icon="solar:close-circle-linear" width={22} />
            </button>
          </header>

          <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 px-3 py-4" data-testid="chat-tienda-mensajes">
            {mensajes.length === 0 && (
              <div className="space-y-3">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm text-gray-800 shadow-sm">
                  ¡Hola! 👋 Soy {nombreVendedor}. ¿En qué te ayudo{lugar.productoId ? ' con este producto' : ''}?
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sugerencias(Boolean(lugar.productoId)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => enviar(s)}
                      className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      style={{ borderColor: tienda.color }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensajes.map((m) =>
              m.de === 'cliente' ? (
                <div key={m.id} className="flex justify-end">
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white ${m.pendiente && !m.clienteId ? 'opacity-70' : ''}`}
                    style={{ backgroundColor: tienda.color }}
                  >
                    {m.texto}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div className="max-w-[85%] space-y-2 rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm text-gray-800 shadow-sm">
                    {m.tipo === 'IMAGEN' && m.url && (
                      <img src={m.url} alt={m.texto ?? ''} className="max-h-60 w-full rounded-lg object-cover" loading="lazy" />
                    )}
                    {m.tipo === 'VIDEO' && m.url && <video src={m.url} controls className="w-full rounded-lg" />}
                    {m.tipo === 'DOCUMENTO' && m.url ? (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium underline">
                        <Icon icon="solar:document-text-bold-duotone" width={18} />
                        {m.texto || 'Ver documento'}
                      </a>
                    ) : (
                      m.texto && (
                        <p className="whitespace-pre-wrap break-words">
                          <Texto texto={m.texto} />
                        </p>
                      )
                    )}
                    {m.tipo === 'IMAGEN' && m.productoId && (
                      <button
                        type="button"
                        onClick={() => agregarAlCarrito(m.productoId!)}
                        data-testid="chat-tienda-agregar"
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white"
                        style={{ backgroundColor: tienda.color }}
                      >
                        <Icon icon="solar:cart-plus-bold" width={16} />
                        Agregar al carrito
                      </button>
                    )}
                    {m.tipo === 'MENU' && m.opciones?.length ? (
                      <div className="flex flex-col gap-1.5 pt-1">
                        {m.opciones.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => enviar(o.titulo)}
                            className="rounded-lg border px-3 py-1.5 text-left text-xs font-medium hover:bg-gray-50"
                            style={{ borderColor: tienda.color, color: tienda.color }}
                          >
                            {o.titulo}
                            {o.descripcion && <span className="block font-normal text-gray-500">{o.descripcion}</span>}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
            )}

            {escribiendo && (
              <div className="flex justify-start" data-testid="chat-tienda-escribiendo">
                <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-white px-3 py-3 shadow-sm">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={finRef} />
          </div>

          {error && <p className="bg-rose-50 px-4 py-1.5 text-xs text-rose-700">{error}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              enviar(texto)
            }}
            className="flex items-end gap-2 border-t border-gray-100 bg-white p-3"
          >
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, 1000))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  enviar(texto)
                }
              }}
              rows={1}
              placeholder="Escribe tu mensaje…"
              aria-label="Mensaje"
              data-testid="chat-tienda-texto"
              className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
            />
            <button
              type="submit"
              disabled={!texto.trim()}
              aria-label="Enviar"
              data-testid="chat-tienda-enviar"
              className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-white disabled:opacity-40"
              style={{ backgroundColor: tienda.color }}
            >
              <Icon icon="solar:plain-bold" width={18} />
            </button>
          </form>
        </section>
      )}
    </>
  )
}
