/**
 * E2 — BI y analítica operativa.
 *
 * Las seis cosas que pidió el anexo, en el orden en que sirven: primero lo
 * que se puede accionar hoy (lo que la gente pide y no hay), después lo que
 * explica el negocio (conversión, ticket, descuentos) y al final el perfil de
 * quién compra.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import useAlertStore from '@/zustand/alert'
import { crmService, type ReporteBi } from '@/services/crm.service'

const soles = (n: number) => `S/ ${Number(n ?? 0).toFixed(2)}`

export function BiPanel() {
  const { alert } = useAlertStore()
  const [bi, setBi] = useState<ReporteBi | null>(null)
  const [cargando, setCargando] = useState(true)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      setBi(await crmService.bi({ desde: desde || undefined, hasta: hasta || undefined }))
    } catch {
      alert('No se pudo cargar la analítica', 'error')
    } finally {
      setCargando(false)
    }
  }, [alert, desde, hasta])

  useEffect(() => {
    void cargar()
  }, [cargar])

  if (cargando && !bi) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
        <Icon icon="eos-icons:loading" className="animate-spin text-3xl text-indigo-500" />
        <p className="text-sm">Calculando…</p>
      </div>
    )
  }
  if (!bi) return null

  const sinNada = bi.productos.totalConsultas === 0 && bi.conversaciones === 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-bold text-gray-500">
          Desde
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="ml-2 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </label>
        <label className="text-xs font-bold text-gray-500">
          Hasta
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="ml-2 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </label>
        {(desde || hasta) && (
          <button
            type="button"
            onClick={() => {
              setDesde('')
              setHasta('')
            }}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Todo el histórico
          </button>
        )}
      </div>

      {sinNada && (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-800">
          Todavía no hay conversaciones en este rango. Los números aparecen
          solos a medida que la gente escribe.
        </p>
      )}

      {/* Lo accionable */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta
          titulo="Lo que piden y no tenemos"
          icono="solar:bag-cross-bold-duotone"
          acento="text-rose-500"
          pie={
            bi.productos.totalConsultas > 0
              ? `${bi.productos.porcentajeSinStock}% de las búsquedas se fueron sin nada`
              : undefined
          }
        >
          <Lista filas={bi.productos.noHabidos} vacio="Nada: todo lo que pidieron existe." />
        </Tarjeta>

        <Tarjeta
          titulo="Lo más consultado que sí tenemos"
          icono="solar:bag-check-bold-duotone"
          acento="text-emerald-500"
        >
          <Lista filas={bi.productos.disponibles} vacio="Sin consultas todavía." />
        </Tarjeta>

        <Tarjeta
          titulo="Con qué llega la gente"
          icono="solar:stethoscope-bold-duotone"
          acento="text-sky-500"
        >
          <Lista filas={bi.malestares} vacio="Sin consultas de salud todavía." />
        </Tarjeta>

        <Tarjeta titulo="El negocio" icono="solar:chart-2-bold-duotone" acento="text-indigo-500">
          <div className="grid grid-cols-2 gap-3">
            <Dato etiqueta="Conversaciones" valor={String(bi.conversaciones)} />
            <Dato etiqueta="Pedidos" valor={String(bi.pedidos)} />
            <Dato etiqueta="Conversión" valor={`${bi.tasaConversion}%`} />
            <Dato etiqueta="Ticket promedio" valor={soles(bi.ticketPromedio)} />
            <Dato etiqueta="Vendido" valor={soles(bi.vendido)} />
            <Dato
              etiqueta="Descuentos dados"
              valor={soles(bi.descuentosOtorgados)}
              nota={bi.pesoDescuentos > 0 ? `${bi.pesoDescuentos}% del total` : undefined}
            />
          </div>
        </Tarjeta>
      </div>

      {/* Quién compra */}
      <Tarjeta titulo="Quiénes compran" icono="solar:users-group-rounded-bold-duotone" acento="text-violet-500">
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Sexo
            </p>
            <Barra etiqueta="Mujeres" valor={bi.demografia.sexo.mujeres} />
            <Barra etiqueta="Hombres" valor={bi.demografia.sexo.hombres} />
            <Barra etiqueta="Sin dato" valor={bi.demografia.sexo.sinDato} apagado />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Edad
            </p>
            {bi.demografia.edades.map((e) => (
              <Barra
                key={e.etiqueta}
                etiqueta={e.etiqueta}
                valor={e.total}
                apagado={e.etiqueta === 'sin dato'}
              />
            ))}
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Dónde
            </p>
            <Barra etiqueta="Lima" valor={bi.demografia.ubicacion.lima} />
            <Barra etiqueta="Provincias" valor={bi.demografia.ubicacion.provincia} />
            <Barra etiqueta="Recojo en tienda" valor={bi.demografia.ubicacion.recojo} />
            <Barra etiqueta="Sin dato" valor={bi.demografia.ubicacion.sinDato} apagado />
          </div>
        </div>

        {bi.demografia.topDistritos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
            {bi.demografia.topDistritos.map((d) => (
              <span
                key={d.lugar}
                className="rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                {d.lugar} · {d.total}
              </span>
            ))}
          </div>
        )}

        {/* Sexo y edad solo se cuentan si el cliente los dijo: no se adivinan
            por el nombre. Decirlo evita que el dueño lea el "sin dato" como
            un error del sistema. */}
        {bi.demografia.sexo.sinDato > 0 && (
          <p className="mt-3 text-[11px] text-gray-400">
            "Sin dato" son los clientes que no dijeron su sexo o edad. No se
            adivinan: un número inventado no sirve para decidir.
          </p>
        )}
      </Tarjeta>
    </div>
  )
}

function Tarjeta({
  titulo,
  icono,
  acento,
  pie,
  children,
}: {
  titulo: string
  icono: string
  acento: string
  pie?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#111827]">
      <div className="mb-3 flex items-center gap-2">
        <Icon icon={icono} className={`text-lg ${acento}`} />
        <h3 className="text-sm font-black text-gray-900 dark:text-white">{titulo}</h3>
      </div>
      {children}
      {pie && <p className="mt-3 text-[11px] font-bold text-gray-400">{pie}</p>}
    </div>
  )
}

function Lista({ filas, vacio }: { filas: { texto: string; veces: number }[]; vacio: string }) {
  if (!filas.length) return <p className="text-xs text-gray-400">{vacio}</p>
  const tope = Math.max(...filas.map((f) => f.veces))
  return (
    <div className="space-y-1.5">
      {filas.slice(0, 10).map((f) => (
        <div key={f.texto} className="flex items-center gap-2">
          <span className="w-40 flex-shrink-0 truncate text-xs text-gray-700 dark:text-gray-300">
            {f.texto}
          </span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <span
              className="block h-full rounded-full bg-indigo-400"
              style={{ width: `${(f.veces / tope) * 100}%` }}
            />
          </span>
          <span className="w-6 text-right text-[11px] font-bold text-gray-500">{f.veces}</span>
        </div>
      ))}
    </div>
  )
}

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{etiqueta}</p>
      <p className="text-lg font-black text-gray-900 dark:text-white">{valor}</p>
      {nota && <p className="text-[10px] text-gray-400">{nota}</p>}
    </div>
  )
}

function Barra({
  etiqueta,
  valor,
  apagado,
}: {
  etiqueta: string
  valor: number
  apagado?: boolean
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span
        className={`w-28 flex-shrink-0 text-xs ${apagado ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}
      >
        {etiqueta}
      </span>
      <span className={`text-sm font-black ${apagado ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
        {valor}
      </span>
    </div>
  )
}
