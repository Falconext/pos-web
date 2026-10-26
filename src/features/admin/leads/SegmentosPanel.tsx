import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import useAlertStore from '@/zustand/alert'
import { fetchEtiquetas, type EtiquetaCatalogo } from '@/services/leads.service'
import {
  eliminarSegmento,
  fetchOpcionesSegmento,
  fetchSegmentos,
  guardarSegmento,
  type FiltrosSegmento,
  type OpcionesSegmento,
  type PrevisualizacionSegmento,
  type SegmentoGuardado,
} from '@/services/envios.service'
import { SegmentoEditor, VistaPreviaSegmento, cuantosFiltros } from './SegmentoEditor'

/**
 * Segmentos guardados: grupos de contactos con nombre ("Compraron perfume",
 * "Inactivos 30 días") para reutilizarlos en cada envío.
 */
export function SegmentosPanel() {
  const { alert } = useAlertStore()
  const [segmentos, setSegmentos] = useState<SegmentoGuardado[]>([])
  const [etiquetas, setEtiquetas] = useState<EtiquetaCatalogo[]>([])
  const [opciones, setOpciones] = useState<OpcionesSegmento | null>(null)
  const [abierto, setAbierto] = useState<number | 'nuevo'>('nuevo')
  const [nombre, setNombre] = useState('')
  const [filtros, setFiltros] = useState<FiltrosSegmento>({})
  const [guardando, setGuardando] = useState(false)
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const [cuenta, setCuenta] = useState<PrevisualizacionSegmento | null>(null)

  const cargar = useCallback(async () => {
    try {
      setSegmentos(await fetchSegmentos())
    } catch (e: any) {
      alert(e.message, 'error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    cargar()
    fetchEtiquetas().then(setEtiquetas).catch(() => undefined)
    fetchOpcionesSegmento().then(setOpciones).catch(() => undefined)
  }, [cargar])

  const abrir = (s: SegmentoGuardado | 'nuevo') => {
    setConfirmarBorrar(false)
    if (s === 'nuevo') {
      setAbierto('nuevo')
      setNombre('')
      setFiltros({})
      return
    }
    setAbierto(s.id)
    setNombre(s.nombre)
    setFiltros(s.filtrosJson ?? {})
  }

  const guardar = async () => {
    if (!nombre.trim()) return alert('Ponle un nombre al segmento', 'error')
    setGuardando(true)
    try {
      const s = await guardarSegmento({
        ...(abierto !== 'nuevo' ? { id: abierto } : {}),
        nombre: nombre.trim(),
        filtros,
      })
      await cargar()
      setAbierto(s.id)
      alert('Segmento guardado', 'success')
    } catch (e: any) {
      alert(e.message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async () => {
    if (abierto === 'nuevo') return
    try {
      await eliminarSegmento(abierto)
      await cargar()
      abrir('nuevo')
      alert('Segmento borrado', 'success')
    } catch (e: any) {
      alert(e.message, 'error')
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_340px]">
      {/* Guardados */}
      <aside className="space-y-1">
        <button
          type="button"
          onClick={() => abrir('nuevo')}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
            abierto === 'nuevo'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'
          }`}
        >
          <Icon icon="solar:add-circle-linear" width={16} />
          Nuevo segmento
        </button>
        {segmentos.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => abrir(s)}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
              abierto === s.id
                ? 'bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'
            }`}
          >
            <Icon icon="solar:users-group-rounded-linear" width={16} className="flex-none opacity-70" />
            <span className="min-w-0 flex-1 truncate">{s.nombre}</span>
            <span className="text-[11px] tabular-nums text-gray-400">{cuantosFiltros(s.filtrosJson)}</span>
          </button>
        ))}
        {segmentos.length === 0 && (
          <p className="px-3 py-2 text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
            Guarda los grupos que más uses para elegirlos en un clic al hacer un envío.
          </p>
        )}
      </aside>

      {/* Filtros */}
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200/70 bg-white p-3 dark:border-slate-800 dark:bg-[#111827]">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={60}
            placeholder="Nombre del segmento, ej. Compraron perfume"
            aria-label="Nombre del segmento"
            className="min-w-0 flex-1 rounded-xl bg-gray-100/80 px-3 py-2.5 text-[13.5px] font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gray-900 px-4 text-[13px] font-semibold text-white transition hover:bg-black disabled:opacity-50 dark:bg-white dark:text-gray-900"
          >
            <Icon icon="solar:diskette-linear" width={16} />
            Guardar
          </button>
          {abierto !== 'nuevo' &&
            (confirmarBorrar ? (
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConfirmarBorrar(false)}
                  className="rounded-xl px-3 py-2 text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={borrar}
                  className="rounded-xl bg-red-600 px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-red-700"
                >
                  Borrar segmento
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmarBorrar(true)}
                aria-label="Borrar segmento"
                className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <Icon icon="solar:trash-bin-minimalistic-linear" width={18} />
              </button>
            ))}
        </div>
        <SegmentoEditor filtros={filtros} onCambiar={setFiltros} etiquetas={etiquetas} opciones={opciones} />
      </div>

      {/* Cuenta en vivo */}
      <div className="lg:col-span-2 xl:col-span-1">
        <div className="xl:sticky xl:top-4">
          <VistaPreviaSegmento filtros={filtros} onResultado={setCuenta} />
        </div>
      </div>

      {/* En pantallas angostas la cuenta queda debajo de todos los filtros:
          una barra fija la deja a la vista mientras se filtra. */}
      {cuenta && (
        <div className="sticky bottom-0 z-10 -mx-2 border-t lg:col-span-2 border-gray-200 bg-white/95 px-4 py-3 backdrop-blur xl:hidden dark:border-slate-800 dark:bg-[#0A0D14]/95">
          <p className="text-[13px] text-gray-600 dark:text-gray-300">
            Recibirán <b className="text-[16px] tabular-nums text-gray-900 dark:text-white">{cuenta.recibiran}</b> de{' '}
            {cuenta.cumplen} que cumplen el filtro
          </p>
        </div>
      )}
    </div>
  )
}
