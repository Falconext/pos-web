/**
 * El banco de prospectos que pidieron demo por WhatsApp (Krezka, 20-10).
 *
 * Es la lista de llamadas de los vendedores: quién dejó sus datos, qué demo
 * se llevó y si contestó al "¿qué tal te pareció?" de las 3 horas. El filtro
 * por defecto deja arriba a los que no contestaron, que son a quienes hay
 * que llamar.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import moment from 'moment'
import useAlertStore from '@/zustand/alert'
import { fetchDemos, type LeadDemo } from '@/services/leads.service'

type Filtro = 'todos' | 'llamar' | 'contestaron'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'llamar', label: 'Por llamar' },
  { id: 'contestaron', label: 'Contestaron' },
  { id: 'todos', label: 'Todos' },
]

/** Cómo va el seguimiento, en palabras del vendedor. */
function estadoSeguimiento(d: LeadDemo): { label: string; chip: string } {
  if (d.respondioSeguimiento) {
    return {
      label: 'Contestó',
      chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    }
  }
  const s = d.seguimiento
  if (s?.estado === 'PROGRAMADO') {
    return {
      label: `Se le escribe ${moment(s.programadoPara).format('DD/MM HH:mm')}`,
      chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    }
  }
  if (s?.estado === 'ENVIADO') {
    return {
      label: 'Sin respuesta',
      chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    }
  }
  if (s?.estado === 'OMITIDO' && d.ultimoMensajeEn) {
    return {
      label: 'Siguió conversando',
      chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    }
  }
  return {
    label: 'Sin seguimiento',
    chip: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  }
}

/** Quién falta llamar: le preguntamos qué le pareció y no contestó. */
const porLlamar = (d: LeadDemo) =>
  !d.respondioSeguimiento && d.seguimiento?.estado !== 'PROGRAMADO' &&
  estadoSeguimiento(d).label !== 'Siguió conversando'

const celularDe = (d: LeadDemo) => (d.celular || d.telefono).replace(/\D/g, '')
const enlaceWhatsApp = (d: LeadDemo) => {
  const n = celularDe(d)
  return `https://wa.me/${n.length === 9 ? `51${n}` : n}`
}

/** CSV con punto y coma y BOM: así lo abre bien Excel en español. */
function descargarCsv(filas: LeadDemo[]) {
  const columnas: [string, (d: LeadDemo) => string][] = [
    ['Fecha', (d) => moment(d.creadoEn).format('DD/MM/YYYY HH:mm')],
    ['Nombre', (d) => d.nombre],
    ['Celular', (d) => d.celular || d.telefono],
    ['Correo', (d) => d.correo ?? ''],
    ['RUC', (d) => d.ruc ?? ''],
    ['Razón social', (d) => d.razonSocial ?? ''],
    ['Nombre comercial', (d) => d.nombreComercial ?? ''],
    ['Rubro', (d) => d.rubro ?? ''],
    ['Demo', (d) => `${d.demo}${d.aproximada ? ' (la más parecida)' : ''}`],
    ['Seguimiento', (d) => estadoSeguimiento(d).label],
  ]
  const celda = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [
    columnas.map(([c]) => celda(c)).join(';'),
    ...filas.map((d) => columnas.map(([, f]) => celda(f(d))).join(';')),
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `demos-${moment().format('YYYY-MM-DD')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function DemosPanel() {
  const { alert } = useAlertStore()
  const [demos, setDemos] = useState<LeadDemo[] | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('llamar')
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    try {
      setDemos(await fetchDemos())
    } catch {
      alert('No se pudieron cargar las demos', 'error')
      setDemos([])
    }
  }, [alert])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return (demos ?? [])
      .filter((d) =>
        filtro === 'llamar' ? porLlamar(d) : filtro === 'contestaron' ? !porLlamar(d) : true,
      )
      .filter(
        (d) =>
          !q ||
          [d.nombre, d.nombreComercial, d.razonSocial, d.rubro, d.correo, d.ruc, d.celular, d.telefono]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
      )
  }, [demos, filtro, busqueda])

  const cuenta = (f: Filtro) =>
    (demos ?? []).filter((d) =>
      f === 'llamar' ? porLlamar(d) : f === 'contestaron' ? !porLlamar(d) : true,
    ).length

  if (!demos) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
        <Icon icon="svg-spinners:ring-resize" className="text-3xl" />
        <span className="text-sm">Cargando demos…</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800/60 w-fit">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                filtro === f.id
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-[#111827] dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {f.label} · {cuenta(f.id)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Icon
            icon="solar:magnifer-linear"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar nombre, RUC, rubro…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-800 dark:bg-[#111827] dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => descargarCsv(visibles)}
          disabled={!visibles.length}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:bg-[#111827] dark:text-gray-200 sm:ml-auto"
        >
          <Icon icon="solar:download-minimalistic-bold" className="text-base" />
          Descargar Excel
        </button>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400 dark:border-gray-800">
          {demos.length === 0
            ? 'Todavía nadie pidió una demo por WhatsApp.'
            : 'No hay prospectos con este filtro.'}
        </div>
      ) : (
        <div className="grid gap-2">
          {visibles.map((d) => {
            const estado = estadoSeguimiento(d)
            return (
              <div
                key={d.id}
                className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-[#111827]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-gray-900 dark:text-white">{d.nombre}</span>
                  {d.nombreComercial && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">· {d.nombreComercial}</span>
                  )}
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${estado.chip}`}>
                    {estado.label}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-400">
                    {moment(d.creadoEn).format('DD/MM/YYYY HH:mm')}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <a
                    href={enlaceWhatsApp(d)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    <Icon icon="logos:whatsapp-icon" className="text-sm" />
                    {d.celular || d.telefono}
                  </a>
                  {d.correo && (
                    <a href={`mailto:${d.correo}`} className="flex items-center gap-1 hover:underline">
                      <Icon icon="solar:letter-linear" className="text-sm text-gray-400" />
                      {d.correo}
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:document-text-linear" className="text-sm text-gray-400" />
                    {d.ruc ? `RUC ${d.ruc}${d.razonSocial ? ` · ${d.razonSocial}` : ''}` : 'Sin RUC'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {d.rubro && <span>Rubro: {d.rubro}</span>}
                  <span>
                    Demo: <b className="text-gray-700 dark:text-gray-200">{d.demo}</b>
                    {d.aproximada && ' (la más parecida)'}
                  </span>
                  {d.ultimoMensajeEn && (
                    <span>Último mensaje: {moment(d.ultimoMensajeEn).fromNow()}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
