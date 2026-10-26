import { useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import useOutsideClick from '@/hooks/useOutsideClick'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import type { ColorEtiqueta, EtiquetaCatalogo, EtiquetaLead } from '@/services/leads.service'

/**
 * Etiquetas de contactos: los chips, el editor del chat, el filtro de la
 * bandeja y el administrador del catálogo.
 *
 * Son la base de los envíos masivos —"mandarle la promo a los que compraron
 * perfume"—, así que lo que más se cuida es no fabricar duplicados: al
 * escribir, primero se ofrece la etiqueta que ya existe y el servidor
 * reutiliza la que solo cambia en mayúsculas o tildes.
 */

export const COLORES: { id: ColorEtiqueta; chip: string; punto: string }[] = [
  { id: 'gris', chip: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300', punto: 'bg-gray-400' },
  { id: 'violeta', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', punto: 'bg-violet-500' },
  { id: 'azul', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', punto: 'bg-sky-500' },
  { id: 'verde', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', punto: 'bg-emerald-500' },
  { id: 'amarillo', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', punto: 'bg-amber-400' },
  { id: 'naranja', chip: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', punto: 'bg-orange-500' },
  { id: 'rojo', chip: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', punto: 'bg-red-500' },
  { id: 'rosa', chip: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300', punto: 'bg-pink-500' },
]

const colorDe = (c: string) => COLORES.find((x) => x.id === c) ?? COLORES[0]

/** Igual que en el servidor: sin mayúsculas ni tildes. */
const clave = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/** La etiqueta nueva toma el siguiente color de la paleta, para que no salgan todas grises. */
const colorSiguiente = (cuantas: number): ColorEtiqueta => COLORES[1 + (cuantas % (COLORES.length - 1))].id

export function ChipEtiqueta({
  etiqueta,
  onQuitar,
  chico = false,
}: {
  etiqueta: EtiquetaLead
  onQuitar?: () => void
  chico?: boolean
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full font-semibold ${colorDe(etiqueta.color).chip} ${
        chico ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11.5px]'
      }`}
    >
      <span className="truncate">{etiqueta.nombre}</span>
      {onQuitar && (
        <button
          type="button"
          onClick={onQuitar}
          aria-label={`Quitar la etiqueta ${etiqueta.nombre}`}
          className="-mr-1 flex h-4 w-4 flex-none items-center justify-center rounded-full opacity-60 transition hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
        >
          <Icon icon="solar:close-small-linear" width={14} />
        </button>
      )}
    </span>
  )
}

function PaletaColores({
  valor,
  onCambiar,
}: {
  valor: ColorEtiqueta
  onCambiar: (c: ColorEtiqueta) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Color de la etiqueta">
      {COLORES.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={valor === c.id}
          aria-label={c.id}
          title={c.id}
          onClick={() => onCambiar(c.id)}
          className={`h-6 w-6 rounded-full ${c.punto} transition ${
            valor === c.id
              ? 'ring-2 ring-gray-900 ring-offset-2 dark:ring-white dark:ring-offset-[#111827]'
              : 'hover:scale-110'
          }`}
        />
      ))}
    </div>
  )
}

/**
 * Las etiquetas del chat abierto, con el buscador para agregar.
 *
 * Escribir y dar Enter pone la primera que coincide; si ninguna coincide
 * exacto, ofrece crearla. Así etiquetar un chat es tipear dos letras.
 */
export function EtiquetasDelChat({
  actuales,
  catalogo,
  onPoner,
  onQuitar,
  onAdministrar,
}: {
  actuales: EtiquetaLead[]
  catalogo: EtiquetaCatalogo[]
  onPoner: (datos: { etiquetaId: number } | { nombre: string; color?: ColorEtiqueta }) => void
  onQuitar: (etiquetaId: number) => void
  onAdministrar: () => void
}) {
  const [abierto, setAbierto, ref] = useOutsideClick(false)
  const [texto, setTexto] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEscapeKey(() => setAbierto(false), abierto)

  const tiene = new Set(actuales.map((e) => e.id))
  const q = clave(texto)
  const opciones = catalogo.filter((e) => !tiene.has(e.id) && (!q || clave(e.nombre).includes(q)))
  const exacta = q ? catalogo.find((e) => clave(e.nombre) === q) : undefined
  const puedeCrear = q.length > 0 && !exacta
  // Las que coinciden pero el chat ya tiene: se muestran para que "compro"
  // no termine creando una etiqueta nueva al lado de "Compró perfume".
  const yaTiene = q ? actuales.filter((e) => clave(e.nombre).includes(q)) : []

  const elegir = (datos: { etiquetaId: number } | { nombre: string; color?: ColorEtiqueta }) => {
    onPoner(datos)
    setTexto('')
    input.current?.focus()
  }

  /**
   * Enter pone la que coincide. Crear con Enter solo cuando no hay nada
   * parecido: si el chat ya tiene una que coincide, crear es un clic a
   * propósito en "Crear «…»", no un accidente.
   */
  const enter = () => {
    if (exacta) {
      if (!tiene.has(exacta.id)) elegir({ etiquetaId: exacta.id })
      return
    }
    if (opciones[0]) return elegir({ etiquetaId: opciones[0].id })
    if (puedeCrear && !yaTiene.length) elegir({ nombre: texto.trim(), color: colorSiguiente(catalogo.length) })
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {actuales.map((e) => (
          <ChipEtiqueta key={e.id} etiqueta={e} onQuitar={() => onQuitar(e.id)} />
        ))}
        <button
          type="button"
          onClick={() => {
            setAbierto(!abierto)
            setTimeout(() => input.current?.focus(), 0)
          }}
          aria-expanded={abierto}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-[11.5px] font-semibold text-gray-500 transition hover:border-gray-400 hover:text-gray-800 dark:border-slate-600 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Icon icon="solar:add-circle-linear" width={13} />
          {actuales.length ? 'Agregar' : 'Agregar etiqueta'}
        </button>
      </div>

      {abierto && (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-[#0f172a]">
          <div className="border-b border-gray-100 p-2 dark:border-slate-800">
            <input
              ref={input}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  enter()
                }
              }}
              maxLength={40}
              placeholder="Buscar o crear etiqueta"
              aria-label="Buscar o crear etiqueta"
              className="w-full rounded-lg bg-gray-100/80 px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/50"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {opciones.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => elegir({ etiquetaId: e.id })}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
              >
                <span className={`h-2.5 w-2.5 flex-none rounded-full ${colorDe(e.color).punto}`} />
                <span className="min-w-0 flex-1 truncate">{e.nombre}</span>
                <span className="text-[11px] tabular-nums text-gray-400">{e.contactos}</span>
              </button>
            ))}
            {yaTiene.map((e) => (
              <p
                key={e.id}
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-400 dark:text-gray-500"
              >
                <Icon icon="solar:check-circle-bold" width={14} className="flex-none text-emerald-500" />
                <span className="min-w-0 flex-1 truncate">{e.nombre}</span>
                <span className="text-[11px]">ya la tiene</span>
              </p>
            ))}
            {puedeCrear && (
              <button
                type="button"
                onClick={() => elegir({ nombre: texto.trim(), color: colorSiguiente(catalogo.length) })}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
              >
                <Icon icon="solar:add-circle-bold" width={15} />
                <span className="truncate">Crear «{texto.trim()}»</span>
              </button>
            )}
            {!opciones.length && !puedeCrear && !yaTiene.length && (
              <p className="px-3 py-3 text-[12px] text-gray-500 dark:text-gray-400">
                {catalogo.length ? 'Ya tiene todas las que coinciden.' : 'Escribe un nombre para crear la primera.'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setAbierto(false)
              onAdministrar()
            }}
            className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 dark:border-slate-800 dark:text-gray-400 dark:hover:bg-slate-800"
          >
            <Icon icon="solar:settings-linear" width={14} />
            Administrar etiquetas
          </button>
        </div>
      )}
    </div>
  )
}

/** El filtro por etiqueta de la lista de chats. `null` = todas. */
export function FiltroEtiqueta({
  catalogo,
  valor,
  onCambiar,
  onAdministrar,
}: {
  catalogo: EtiquetaCatalogo[]
  valor: number | null
  onCambiar: (id: number | null) => void
  onAdministrar: () => void
}) {
  const [abierto, setAbierto, ref] = useOutsideClick(false)
  useEscapeKey(() => setAbierto(false), abierto)
  const elegida = catalogo.find((e) => e.id === valor) ?? null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        aria-label="Filtrar por etiqueta"
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
          elegida
            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700'
        }`}
      >
        <Icon icon="solar:tag-linear" width={13} />
        <span className="max-w-[90px] truncate">{elegida ? elegida.nombre : 'Etiqueta'}</span>
        <Icon icon="solar:alt-arrow-down-linear" width={12} />
      </button>

      {abierto && (
        <div className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-[#0f172a]">
          <div className="max-h-64 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onCambiar(null)
                setAbierto(false)
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-gray-50 dark:hover:bg-slate-800 ${
                valor == null ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <Icon icon="solar:list-linear" width={14} className="text-gray-400" />
              Todas
            </button>
            {catalogo.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  onCambiar(e.id)
                  setAbierto(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-gray-50 dark:hover:bg-slate-800 ${
                  valor === e.id ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className={`h-2.5 w-2.5 flex-none rounded-full ${colorDe(e.color).punto}`} />
                <span className="min-w-0 flex-1 truncate">{e.nombre}</span>
                <span className="text-[11px] tabular-nums text-gray-400">{e.contactos}</span>
              </button>
            ))}
            {!catalogo.length && (
              <p className="px-3 py-3 text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
                Todavía no hay etiquetas. Ponlas desde la ficha del chat.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setAbierto(false)
              onAdministrar()
            }}
            className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 dark:border-slate-800 dark:text-gray-400 dark:hover:bg-slate-800"
          >
            <Icon icon="solar:settings-linear" width={14} />
            Administrar etiquetas
          </button>
        </div>
      )}
    </div>
  )
}

function FilaEtiqueta({
  etiqueta,
  onEditar,
  onEliminar,
}: {
  etiqueta: EtiquetaCatalogo
  onEditar: (datos: { nombre?: string; color?: ColorEtiqueta }) => Promise<boolean>
  onEliminar: () => void
}) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(etiqueta.nombre)
  const [confirmar, setConfirmar] = useState(false)

  const guardar = async () => {
    const limpio = nombre.trim()
    if (!limpio || limpio === etiqueta.nombre) return setEditando(false)
    if (await onEditar({ nombre: limpio })) setEditando(false)
  }

  if (confirmar) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 dark:bg-red-900/20">
        <p className="min-w-0 flex-1 text-[12.5px] text-red-800 dark:text-red-200">
          ¿Borrar «{etiqueta.nombre}»?
          {etiqueta.contactos > 0 && ` Se quita de ${etiqueta.contactos} chat${etiqueta.contactos === 1 ? '' : 's'}.`}
        </p>
        <button
          type="button"
          onClick={() => setConfirmar(false)}
          className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onEliminar}
          className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-red-700"
        >
          Borrar
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/50">
      <div className="flex items-center gap-2">
        {editando ? (
          <input
            autoFocus
            value={nombre}
            maxLength={40}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') guardar()
              if (e.key === 'Escape') {
                e.stopPropagation()
                setNombre(etiqueta.nombre)
                setEditando(false)
              }
            }}
            onBlur={guardar}
            aria-label="Nombre de la etiqueta"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="min-w-0 flex-1 text-left"
            title="Cambiar el nombre"
          >
            <ChipEtiqueta etiqueta={etiqueta} />
          </button>
        )}
        <span className="flex-none text-[11px] tabular-nums text-gray-400" title="Chats con esta etiqueta">
          {etiqueta.contactos} chat{etiqueta.contactos === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={() => setConfirmar(true)}
          aria-label={`Borrar la etiqueta ${etiqueta.nombre}`}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
        >
          <Icon icon="solar:trash-bin-minimalistic-linear" width={16} />
        </button>
      </div>
      <div className="mt-2">
        <PaletaColores valor={etiqueta.color} onCambiar={(color) => onEditar({ color })} />
      </div>
    </div>
  )
}

/** Crear, renombrar, cambiar de color y borrar etiquetas. */
export function AdministrarEtiquetas({
  catalogo,
  onCrear,
  onEditar,
  onEliminar,
  onCerrar,
}: {
  catalogo: EtiquetaCatalogo[]
  onCrear: (nombre: string, color: ColorEtiqueta) => Promise<boolean>
  onEditar: (id: number, datos: { nombre?: string; color?: ColorEtiqueta }) => Promise<boolean>
  onEliminar: (id: number) => void
  onCerrar: () => void
}) {
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState<ColorEtiqueta>(() => colorSiguiente(catalogo.length))
  const [guardando, setGuardando] = useState(false)
  useEscapeKey(onCerrar)

  const ordenadas = useMemo(
    () => [...catalogo].sort((a, b) => b.contactos - a.contactos || a.nombre.localeCompare(b.nombre)),
    [catalogo],
  )

  const crear = async () => {
    if (!nombre.trim() || guardando) return
    setGuardando(true)
    if (await onCrear(nombre.trim(), color)) {
      setNombre('')
      setColor(colorSiguiente(catalogo.length + 1))
    }
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 z-[1000001] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-etiquetas"
        className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-white sm:rounded-2xl dark:bg-[#111827]"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 id="titulo-etiquetas" className="text-[16px] font-bold text-gray-900 dark:text-white">
              Etiquetas
            </h2>
            <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
              Marca a tus contactos para encontrarlos y, más adelante, mandarles promociones por grupo.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mr-2 flex h-9 w-9 flex-none items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <Icon icon="solar:close-circle-linear" width={20} />
          </button>
        </div>

        <div className="border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div className="flex gap-2">
            <input
              value={nombre}
              maxLength={40}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && crear()}
              placeholder="Nueva etiqueta, ej. Mayorista"
              aria-label="Nombre de la nueva etiqueta"
              className="min-w-0 flex-1 rounded-xl bg-gray-100/80 px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/50"
            />
            <button
              type="button"
              onClick={crear}
              disabled={!nombre.trim() || guardando}
              className="flex-none rounded-xl bg-gray-900 px-4 text-[13px] font-semibold text-white transition hover:bg-black disabled:opacity-40 dark:bg-white dark:text-gray-900"
            >
              Crear
            </button>
          </div>
          <div className="mt-3">
            <PaletaColores valor={color} onCambiar={setColor} />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {ordenadas.map((e) => (
            <FilaEtiqueta
              key={`${e.id}-${e.nombre}`}
              etiqueta={e}
              onEditar={(datos) => onEditar(e.id, datos)}
              onEliminar={() => onEliminar(e.id)}
            />
          ))}
          {!ordenadas.length && (
            <p className="px-3 py-8 text-center text-[12.5px] text-gray-500 dark:text-gray-400">
              Aún no creaste etiquetas.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
