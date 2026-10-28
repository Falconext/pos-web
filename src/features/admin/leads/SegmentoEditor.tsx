import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { useDebounce } from '@/hooks/useDebounce'
import { ETAPA_META } from '@/services/crm.service'
import { ESTADO_META } from './LeadsModel'
import { ChipEtiqueta } from './Etiquetas'
import type { EtiquetaCatalogo, EstadoLeadProspecto } from '@/services/leads.service'
import {
  buscarProductos,
  previsualizarSegmento,
  productosPorId,
  type CanalEnvio,
  type FiltrosSegmento,
  type OpcionesSegmento,
  type PrevisualizacionSegmento,
  type ProductoBuscado,
} from '@/services/envios.service'

/**
 * Armar un segmento: los filtros a la izquierda y, al lado, cuántos cumplen
 * y cuántos de verdad van a recibir el mensaje.
 *
 * La cuenta se recalcula sola al cambiar cualquier filtro. Lo que importa es
 * que el empresario vea ANTES de mandar por qué a alguien no le llega
 * (pidió la baja, ya recibió el máximo del mes, es de Instagram y no escribió
 * hace un día), no que lo descubra cuando las ventas no llegan.
 */

const CANALES: { id: CanalEnvio; label: string; icono: string }[] = [
  { id: 'WHATSAPP', label: 'WhatsApp', icono: 'logos:whatsapp-icon' },
  { id: 'INSTAGRAM', label: 'Instagram', icono: 'skill-icons:instagram' },
  { id: 'MESSENGER', label: 'Messenger', icono: 'logos:messenger' },
]

const ATAJOS_ACTIVIDAD: { label: string; valor: FiltrosSegmento['actividad'] }[] = [
  { label: 'Últimos 7 días', valor: { maxDias: 7 } },
  { label: 'Últimos 30 días', valor: { maxDias: 30 } },
  { label: 'Hace más de 30 días', valor: { minDias: 30 } },
  { label: 'Hace más de 90 días', valor: { minDias: 90 } },
]

const TEXTO_CANAL: Record<CanalEnvio, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  MESSENGER: 'Messenger',
}

const MOTIVOS: { id: keyof PrevisualizacionSegmento['excluidos']; label: string }[] = [
  { id: 'BAJA', label: 'Pidieron la baja' },
  { id: 'TOPE', label: 'Ya recibieron el máximo del mes' },
  { id: 'SIN_VENTANA', label: 'Instagram/Messenger sin mensaje en 24 h' },
  { id: 'INTERNO', label: 'Números del negocio' },
]

function alternar<T>(lista: T[] | undefined, v: T): T[] | undefined {
  const l = lista ?? []
  const nueva = l.includes(v) ? l.filter((x) => x !== v) : [...l, v]
  return nueva.length ? nueva : undefined
}

/** Saca las claves vacías para que "sin filtro" sea `{}` y no un objeto lleno de undefined. */
export function limpiarFiltros(f: FiltrosSegmento): FiltrosSegmento {
  const out = JSON.parse(JSON.stringify(f)) as Record<string, unknown>
  for (const [k, v] of Object.entries(out)) {
    if (v == null || (Array.isArray(v) && !v.length)) delete out[k]
    else if (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v as object).length) delete out[k]
  }
  return out as FiltrosSegmento
}

export function cuantosFiltros(f: FiltrosSegmento): number {
  return Object.keys(limpiarFiltros(f)).length
}

function Seccion({
  icono,
  titulo,
  ayuda,
  activo,
  onLimpiar,
  children,
}: {
  icono: string
  titulo: string
  ayuda?: string
  activo: boolean
  onLimpiar: () => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13.5px] font-bold text-gray-900 dark:text-white">
            <Icon icon={icono} width={16} className="text-gray-500 dark:text-gray-400" />
            {titulo}
            {activo && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-label="filtro activo" />}
          </p>
          {ayuda && <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">{ayuda}</p>}
        </div>
        {activo && (
          <button
            type="button"
            onClick={onLimpiar}
            className="flex-none rounded-lg px-2 py-1 text-[11.5px] font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-slate-800 dark:hover:text-gray-200"
          >
            Quitar
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function Chip({
  activo,
  onClick,
  children,
  title,
}: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
        activo
          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

function NumeroDias({
  valor,
  onCambiar,
  etiqueta,
}: {
  valor: number | undefined
  onCambiar: (v: number | undefined) => void
  etiqueta: string
}) {
  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      value={valor ?? ''}
      onChange={(e) => onCambiar(e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))}
      aria-label={etiqueta}
      placeholder="—"
      className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-[13px] tabular-nums text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    />
  )
}

/** Buscador de productos con chips de los elegidos. */
function ElegirProductos({
  ids,
  nombres,
  onCambiar,
}: {
  ids: number[]
  nombres: Map<number, string>
  onCambiar: (ids: number[], elegido?: ProductoBuscado) => void
}) {
  const [q, setQ] = useState('')
  const qDeb = useDebounce(q, 300)
  const [resultados, setResultados] = useState<ProductoBuscado[]>([])

  useEffect(() => {
    if (qDeb.trim().length < 2) return setResultados([])
    let vivo = true
    buscarProductos(qDeb)
      .then((r) => vivo && setResultados(r))
      .catch(() => vivo && setResultados([]))
    return () => {
      vivo = false
    }
  }, [qDeb])

  return (
    <div>
      {ids.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <span
              key={id}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
            >
              <span className="truncate">{nombres.get(id) ?? `Producto #${id}`}</span>
              <button
                type="button"
                aria-label={`Quitar ${nombres.get(id) ?? id}`}
                onClick={() => onCambiar(ids.filter((x) => x !== id))}
                className="-mr-1 rounded-full opacity-60 hover:opacity-100"
              >
                <Icon icon="solar:close-small-linear" width={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
          className="w-full rounded-xl bg-gray-100/80 px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-slate-800 dark:text-white"
        />
        {resultados.length > 0 && (
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-[#0f172a]">
            {resultados.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={ids.includes(p.id)}
                onClick={() => {
                  onCambiar([...ids, p.id], p)
                  setQ('')
                  setResultados([])
                }}
                className="block w-full truncate px-3 py-2 text-left text-[13px] text-gray-800 hover:bg-gray-50 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-slate-800"
              >
                {p.descripcion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function SegmentoEditor({
  filtros,
  onCambiar,
  etiquetas,
  opciones,
}: {
  filtros: FiltrosSegmento
  onCambiar: (f: FiltrosSegmento) => void
  etiquetas: EtiquetaCatalogo[]
  opciones: OpcionesSegmento | null
}) {
  const f = filtros
  const set = (cambio: Partial<FiltrosSegmento>) => onCambiar(limpiarFiltros({ ...f, ...cambio }))

  // Nombres de los productos elegidos: los que se buscan se recuerdan; los de
  // un segmento guardado se piden una vez.
  const [nombres, setNombres] = useState<Map<number, string>>(new Map())
  const idsProductos = useMemo(
    () => [...new Set([...(f.compras?.productoIds ?? []), ...(f.consultas?.productoIds ?? [])])],
    [f.compras?.productoIds, f.consultas?.productoIds],
  )
  const pedidos = useRef(new Set<number>())
  useEffect(() => {
    const faltan = idsProductos.filter((id) => !nombres.has(id) && !pedidos.current.has(id))
    if (!faltan.length) return
    faltan.forEach((id) => pedidos.current.add(id))
    productosPorId(faltan)
      .then((ps) => setNombres((prev) => new Map([...prev, ...ps.map((p) => [p.id, p.descripcion] as const)])))
      .catch(() => undefined)
  }, [idsProductos, nombres])
  const recordar = (p?: ProductoBuscado) => p && setNombres((prev) => new Map(prev).set(p.id, p.descripcion))

  const incluir = f.etiquetas?.incluir ?? []
  const excluir = f.etiquetas?.excluir ?? []
  const setEtiquetas = (cambio: Partial<NonNullable<FiltrosSegmento['etiquetas']>>) => {
    const e = { ...f.etiquetas, ...cambio }
    set({
      etiquetas:
        e.incluir?.length || e.excluir?.length
          ? { ...(e.incluir?.length ? { incluir: e.incluir, modo: e.modo ?? 'alguna' } : {}), ...(e.excluir?.length ? { excluir: e.excluir } : {}) }
          : undefined,
    })
  }

  const compras = f.compras
  const setCompras = (cambio: Partial<NonNullable<FiltrosSegmento['compras']>>) => {
    const c = { ...compras, ...cambio }
    set({ compras: c.estado ? c : undefined })
  }

  return (
    <div className="space-y-3">
      <Seccion
        icono="solar:tag-linear"
        titulo="Etiquetas"
        activo={!!f.etiquetas}
        onLimpiar={() => set({ etiquetas: undefined })}
      >
        {etiquetas.length === 0 ? (
          <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
            Todavía no hay etiquetas. Ponlas desde la ficha de cada chat.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
                Tienen
                <select
                  value={f.etiquetas?.modo ?? 'alguna'}
                  onChange={(e) => setEtiquetas({ modo: e.target.value as 'alguna' | 'todas' })}
                  aria-label="Alguna o todas las etiquetas"
                  className="rounded-lg border border-gray-200 bg-white px-1.5 py-0.5 text-[12px] font-semibold text-gray-800 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200"
                >
                  <option value="alguna">alguna de</option>
                  <option value="todas">todas</option>
                </select>
                estas:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {etiquetas.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    aria-pressed={incluir.includes(e.id)}
                    onClick={() =>
                      setEtiquetas({
                        incluir: alternar(incluir, e.id),
                        excluir: excluir.filter((x) => x !== e.id),
                      })
                    }
                    className={`rounded-full transition ${incluir.includes(e.id) ? 'ring-2 ring-gray-900 ring-offset-1 dark:ring-white dark:ring-offset-[#111827]' : 'opacity-60 hover:opacity-100'}`}
                  >
                    <ChipEtiqueta etiqueta={e} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] text-gray-500 dark:text-gray-400">Y no tienen:</p>
              <div className="flex flex-wrap gap-1.5">
                {etiquetas.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    aria-pressed={excluir.includes(e.id)}
                    aria-label={`Excluir ${e.nombre}`}
                    onClick={() =>
                      setEtiquetas({
                        excluir: alternar(excluir, e.id),
                        incluir: incluir.filter((x) => x !== e.id),
                      })
                    }
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition ${
                      excluir.includes(e.id)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400'
                    }`}
                  >
                    <Icon icon="solar:forbidden-circle-linear" width={12} />
                    {e.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Seccion>

      <Seccion
        icono="solar:cart-large-2-linear"
        titulo="Compras"
        ayuda="En el chat o en caja, si el cliente tiene el mismo celular."
        activo={!!compras}
        onLimpiar={() => set({ compras: undefined })}
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip activo={!compras} onClick={() => set({ compras: undefined })}>
            Cualquiera
          </Chip>
          <Chip activo={compras?.estado === 'compro'} onClick={() => setCompras({ estado: 'compro' })}>
            Compraron
          </Chip>
          <Chip activo={compras?.estado === 'no_compro'} onClick={() => setCompras({ estado: 'no_compro' })}>
            No compraron
          </Chip>
        </div>
        {compras && (
          <div className="mt-3 space-y-3 border-t border-gray-100 pt-3 dark:border-slate-800">
            <label className="flex items-center gap-2 text-[12.5px] text-gray-600 dark:text-gray-300">
              en los últimos
              <NumeroDias
                valor={compras.dias}
                onCambiar={(dias) => setCompras({ dias })}
                etiqueta="Días de compras"
              />
              días <span className="text-gray-400">(vacío = siempre)</span>
            </label>
            {!!opciones?.categorias.length && (
              <div>
                <p className="mb-1.5 text-[12px] text-gray-500 dark:text-gray-400">De estas categorías:</p>
                <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {opciones.categorias.map((c) => (
                    <Chip
                      key={c.id}
                      activo={!!compras.categoriaIds?.includes(c.id)}
                      onClick={() => setCompras({ categoriaIds: alternar(compras.categoriaIds, c.id) })}
                    >
                      {c.nombre}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-[12px] text-gray-500 dark:text-gray-400">O de estos productos:</p>
              <ElegirProductos
                ids={compras.productoIds ?? []}
                nombres={nombres}
                onCambiar={(ids, p) => {
                  recordar(p)
                  setCompras({ productoIds: ids.length ? ids : undefined })
                }}
              />
            </div>
          </div>
        )}
      </Seccion>

      <Seccion
        icono="solar:clock-circle-linear"
        titulo="Último mensaje del cliente"
        activo={!!f.actividad}
        onLimpiar={() => set({ actividad: undefined })}
      >
        <div className="flex flex-wrap gap-1.5">
          {ATAJOS_ACTIVIDAD.map((a) => (
            <Chip
              key={a.label}
              activo={JSON.stringify(f.actividad) === JSON.stringify(a.valor)}
              onClick={() => set({ actividad: a.valor })}
            >
              {a.label}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-gray-600 dark:text-gray-300">
          entre
          <NumeroDias
            valor={f.actividad?.minDias}
            onCambiar={(minDias) => set({ actividad: { ...f.actividad, minDias } })}
            etiqueta="Mínimo de días"
          />
          y
          <NumeroDias
            valor={f.actividad?.maxDias}
            onCambiar={(maxDias) => set({ actividad: { ...f.actividad, maxDias } })}
            etiqueta="Máximo de días"
          />
          días atrás
        </div>
      </Seccion>

      <Seccion
        icono="solar:magnifer-linear"
        titulo="Preguntaron por"
        ayuda="Lo que consultaron en el chat."
        activo={!!f.consultas}
        onLimpiar={() => set({ consultas: undefined })}
      >
        <ElegirProductos
          ids={f.consultas?.productoIds ?? []}
          nombres={nombres}
          onCambiar={(ids, p) => {
            recordar(p)
            const c = { ...f.consultas, productoIds: ids.length ? ids : undefined }
            set({ consultas: c.productoIds || c.soloNoHabidos ? c : undefined })
          }}
        />
        <label className="mt-3 flex items-center gap-2 text-[12.5px] text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={!!f.consultas?.soloNoHabidos}
            onChange={(e) => {
              const c = { ...f.consultas, soloNoHabidos: e.target.checked || undefined }
              set({ consultas: c.productoIds || c.soloNoHabidos ? c : undefined })
            }}
            className="h-4 w-4 rounded border-gray-300 accent-emerald-600"
          />
          Solo lo que pidieron y no teníamos
        </label>
      </Seccion>

      <Seccion
        icono="solar:fire-linear"
        titulo="Temperatura y etapa"
        activo={!!f.temperaturas || !!f.etapas}
        onLimpiar={() => set({ temperaturas: undefined, etapas: undefined })}
      >
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(ESTADO_META) as EstadoLeadProspecto[]).map((t) => (
            <Chip
              key={t}
              activo={!!f.temperaturas?.includes(t)}
              onClick={() => set({ temperaturas: alternar(f.temperaturas, t) })}
            >
              <Icon icon={ESTADO_META[t].icon} width={12} />
              {ESTADO_META[t].label}
            </Chip>
          ))}
        </div>
        {!!opciones?.etapas.length && (
          <div className="mt-3">
            <p className="mb-1.5 text-[12px] text-gray-500 dark:text-gray-400">Etapa del embudo:</p>
            <div className="flex flex-wrap gap-1.5">
              {opciones.etapas.map((e) => (
                <Chip key={e} activo={!!f.etapas?.includes(e)} onClick={() => set({ etapas: alternar(f.etapas, e) })}>
                  {(ETAPA_META as Record<string, { label: string }>)[e]?.label ?? e}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </Seccion>

      <Seccion
        icono="solar:chat-round-line-linear"
        titulo="Canal"
        activo={!!f.canales}
        onLimpiar={() => set({ canales: undefined })}
      >
        <div className="flex flex-wrap gap-1.5">
          {CANALES.map((c) => (
            <Chip key={c.id} activo={!!f.canales?.includes(c.id)} onClick={() => set({ canales: alternar(f.canales, c.id) })}>
              <Icon icon={c.icono} width={13} />
              {c.label}
            </Chip>
          ))}
        </div>
      </Seccion>

      {!!opciones?.anuncios.length && (
        <Seccion
          icono="mdi:bullhorn-outline"
          titulo="Llegaron por un anuncio"
          activo={!!f.anuncioIds}
          onLimpiar={() => set({ anuncioIds: undefined })}
        >
          <div className="flex flex-wrap gap-1.5">
            {opciones.anuncios.map((a) => (
              <Chip
                key={a.id}
                activo={!!f.anuncioIds?.includes(a.id)}
                onClick={() => set({ anuncioIds: alternar(f.anuncioIds, a.id) })}
                title={`${a.contactos} contacto${a.contactos === 1 ? '' : 's'}`}
              >
                {a.titulo}
              </Chip>
            ))}
          </div>
        </Seccion>
      )}
    </div>
  )
}

/** La cuenta en vivo: cuántos cumplen, cuántos reciben y por qué no los demás. */
export function VistaPreviaSegmento({
  filtros,
  onResultado,
}: {
  filtros: FiltrosSegmento
  onResultado?: (r: PrevisualizacionSegmento | null) => void
}) {
  const clave = JSON.stringify(limpiarFiltros(filtros))
  const claveDeb = useDebounce(clave, 400)
  const [r, setR] = useState<PrevisualizacionSegmento | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const avisar = useRef(onResultado)
  avisar.current = onResultado

  useEffect(() => {
    let vivo = true
    setCargando(true)
    previsualizarSegmento(JSON.parse(claveDeb))
      .then((res) => {
        if (!vivo) return
        setR(res)
        setError(null)
        avisar.current?.(res)
      })
      .catch((e) => {
        if (!vivo) return
        setError(e.message)
        avisar.current?.(null)
      })
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [claveDeb])

  const excluidos = r ? MOTIVOS.filter((m) => r.excluidos[m.id] > 0) : []

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]" aria-live="polite">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">Recibirán el mensaje</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`text-[40px] font-black leading-none tabular-nums text-gray-900 dark:text-white ${cargando ? 'opacity-40' : ''}`}>
          {r?.recibiran ?? '—'}
        </span>
        {r && (
          <span className="text-[13px] text-gray-500 dark:text-gray-400">
            de {r.cumplen} que cumplen el filtro
          </span>
        )}
        {cargando && <Icon icon="svg-spinners:180-ring" width={16} className="text-gray-400" />}
      </div>
      {error && <p className="mt-2 text-[12.5px] text-red-600 dark:text-red-400">{error}</p>}

      {r && Object.keys(r.porCanal).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(Object.entries(r.porCanal) as [CanalEnvio, number][]).map(([canal, n]) => (
            <span key={canal} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11.5px] font-semibold text-gray-700 dark:bg-slate-800 dark:text-gray-300">
              <Icon icon={CANALES.find((c) => c.id === canal)?.icono ?? 'solar:chat-round-line-linear'} width={12} />
              {n} por {TEXTO_CANAL[canal]}
            </span>
          ))}
        </div>
      )}

      {excluidos.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 dark:border-slate-800">
          <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400">No les llega:</p>
          {excluidos.map((m) => (
            <p key={m.id} className="flex items-center justify-between gap-2 text-[12.5px] text-gray-600 dark:text-gray-300">
              <span>{m.label}</span>
              <span className="font-semibold tabular-nums">{r!.excluidos[m.id]}</span>
            </p>
          ))}
        </div>
      )}

      {r && r.muestra.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-slate-800">
          <p className="mb-2 text-[12px] font-semibold text-gray-500 dark:text-gray-400">
            {r.cumplen > r.muestra.length ? `Primeros ${r.muestra.length}` : 'Contactos'}
          </p>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {r.muestra.map((c) => (
              <li key={c.conversacionId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px]" title={c.motivo ?? undefined}>
                <Icon icon={CANALES.find((x) => x.id === c.canal)?.icono ?? 'solar:chat-round-line-linear'} width={13} className="flex-none" />
                <span className={`min-w-0 flex-1 truncate ${c.motivo ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                  {c.nombre || c.telefono}
                </span>
                {c.motivo && <Icon icon="solar:info-circle-linear" width={14} className="flex-none text-gray-400" aria-label={c.motivo} />}
              </li>
            ))}
          </ul>
        </div>
      )}
      {r && r.cumplen === 0 && !cargando && (
        <p className="mt-3 text-[12.5px] text-gray-500 dark:text-gray-400">Nadie cumple estos filtros todavía.</p>
      )}
    </div>
  )
}
