/**
 * Avisar a Meta las ventas de los anuncios (API de Conversiones, 2026-10-29).
 *
 * Cuando alguien que llegó por un anuncio de clic a WhatsApp compra, el
 * servidor le manda a Meta "este clic terminó en compra" con el monto. Con eso
 * el negocio puede optimizar la campaña por compras (Meta busca gente parecida
 * a la que compró) y ver su ROAS real en el Administrador de anuncios.
 *
 * Como el reporte diario, se guarda al tocar el interruptor: es aparte del
 * "Guardar" del formulario.
 */
import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import apiClient from '@/utils/apiClient'
import useAlertStore from '@/zustand/alert'

interface EventoAvisado {
  id: number
  evento: 'Purchase' | 'LeadSubmitted'
  valor: number | null
  moneda: string | null
  estado: 'PENDIENTE' | 'ENVIADO' | 'ERROR' | 'OMITIDO'
  error: string | null
  ocurridoEn: string
  comprobante: string | null
  cliente: string | null
}

interface EstadoConversiones {
  activo: boolean
  conectado: boolean
  datasetId: string | null
  ultimoError: string | null
  ultimos30Dias: {
    comprasAvisadas: number
    montoAvisado: number
    leadsAvisados: number
    pendientes: number
    conError: number
  }
  ultimos: EventoAvisado[]
}

const datos = <T,>(r: { data: { data?: T } & T }): T => (r.data?.data ?? r.data) as T
const mensajeDe = (e: any, porDefecto: string) => e?.response?.data?.message ?? porDefecto
const soles = (n: number, moneda?: string | null) =>
  `${moneda === 'USD' ? 'US$' : 'S/'} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const ESTADO: Record<EventoAvisado['estado'], { texto: string; clase: string }> = {
  ENVIADO: { texto: 'Avisado', clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  PENDIENTE: { texto: 'Por avisar', clase: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300' },
  ERROR: { texto: 'Falló', clase: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  OMITIDO: { texto: 'Anulada', clase: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400' },
}

export function MetaConversionesCard() {
  const { alert } = useAlertStore()
  const [estado, setEstado] = useState<EstadoConversiones | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [probando, setProbando] = useState(false)
  const [verPrueba, setVerPrueba] = useState(false)
  const [codigo, setCodigo] = useState('')

  useEffect(() => {
    apiClient
      .get('/leads/meta-conversiones')
      .then((r) => setEstado(datos<EstadoConversiones>(r)))
      .catch(() => setEstado(null))
  }, [])

  // Un servidor sin esta función: la tarjeta no aparece.
  if (!estado) return null

  const cambiar = async (activo: boolean) => {
    setGuardando(true)
    try {
      const nuevo = datos<EstadoConversiones>(await apiClient.patch('/leads/meta-conversiones', { activo }))
      setEstado(nuevo)
      if (!activo) alert('Ya no se avisan las ventas a Meta', 'success')
      else if (nuevo.ultimoError) alert(nuevo.ultimoError, 'error')
      else alert('Listo: las ventas que traigan tus anuncios se avisarán a Meta', 'success')
    } catch (e) {
      alert(mensajeDe(e, 'No se pudo guardar'), 'error')
    } finally {
      setGuardando(false)
    }
  }

  const probar = async (testEventCode?: string) => {
    setProbando(true)
    try {
      const r = datos<EstadoConversiones & { enviados: number; prueba?: boolean }>(
        await apiClient.post('/leads/meta-conversiones/probar', testEventCode ? { testEventCode } : {}),
      )
      setEstado(r)
      alert(
        r.prueba
          ? 'Compra de prueba enviada. Revísala en Probar eventos del Administrador de eventos.'
          : r.enviados
            ? `Conexión correcta. Se avisaron ${r.enviados} evento${r.enviados === 1 ? '' : 's'}.`
            : 'Conexión correcta con Meta. No había nada pendiente.',
        'success',
      )
    } catch (e) {
      alert(mensajeDe(e, 'Meta no respondió'), 'error')
      apiClient
        .get('/leads/meta-conversiones')
        .then((r) => setEstado(datos<EstadoConversiones>(r)))
        .catch(() => {})
    } finally {
      setProbando(false)
    }
  }

  const s = estado.ultimos30Dias

  return (
    <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-800" data-testid="meta-conversiones">
      <div className="flex items-center justify-between">
        <div className="pr-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Avisar a Meta las ventas de tus anuncios</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cuando alguien que te escribió desde un anuncio de WhatsApp compra, le contamos a Meta cuánto compró. Así
            puedes optimizar tus campañas por compras —Meta busca gente parecida a la que compró— y ver cuánto vendió
            cada anuncio en el Administrador de anuncios.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={estado.activo}
          data-testid="meta-conversiones-switch"
          disabled={guardando || (!estado.conectado && !estado.activo)}
          onClick={() => cambiar(!estado.activo)}
          className={`relative h-5 w-9 flex-none rounded-full transition disabled:opacity-50 ${
            estado.activo ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
              estado.activo ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {!estado.conectado && (
        <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          Primero conecta el WhatsApp de tu negocio: Meta solo recibe las compras de la cuenta donde corren tus anuncios.
        </p>
      )}

      {estado.activo && (
        <>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]" data-testid="meta-conversiones-resumen">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {s.comprasAvisadas} compra{s.comprasAvisadas === 1 ? '' : 's'} avisada{s.comprasAvisadas === 1 ? '' : 's'} ·{' '}
              {soles(s.montoAvisado)}
            </span>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {s.leadsAvisados} lead{s.leadsAvisados === 1 ? '' : 's'} caliente{s.leadsAvisados === 1 ? '' : 's'}
            </span>
            {s.pendientes > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-slate-800 dark:text-gray-300">
                {s.pendientes} por avisar
              </span>
            )}
            <span className="text-gray-400 dark:text-gray-500">últimos 30 días</span>
          </div>

          {estado.ultimoError && (
            <p
              className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
              data-testid="meta-conversiones-error"
            >
              {estado.ultimoError}
            </p>
          )}

          {estado.ultimos.length > 0 && (
            <ul className="mt-2 divide-y divide-gray-100 dark:divide-slate-800" data-testid="meta-conversiones-ultimos">
              {estado.ultimos.slice(0, 5).map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                  <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">
                    <Icon
                      icon={u.evento === 'Purchase' ? 'solar:cart-large-2-bold-duotone' : 'solar:fire-bold-duotone'}
                      width={14}
                      className={`mr-1 inline ${u.evento === 'Purchase' ? 'text-emerald-500' : 'text-orange-500'}`}
                    />
                    {u.evento === 'Purchase' ? (u.comprobante ?? 'Compra') : 'Lead caliente'}
                    {u.cliente ? <span className="text-gray-400"> · {u.cliente}</span> : null}
                  </span>
                  <span className="flex flex-none items-center gap-1.5">
                    {u.valor != null && (
                      <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{soles(u.valor, u.moneda)}</span>
                    )}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ESTADO[u.estado].clase}`} title={u.error ?? undefined}>
                      {ESTADO[u.estado].texto}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => probar()}
              disabled={probando}
              data-testid="meta-conversiones-probar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-60 dark:text-violet-400"
            >
              <Icon icon={probando ? 'eos-icons:loading' : 'solar:refresh-circle-bold-duotone'} width={14} className={probando ? 'animate-spin' : ''} />
              {probando ? 'Revisando…' : 'Revisar conexión y avisar ahora'}
            </button>
            <button
              type="button"
              onClick={() => setVerPrueba((v) => !v)}
              className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
            >
              Probar en el Administrador de eventos
            </button>
          </div>

          {verPrueba && (
            <div className="mt-2 rounded-lg bg-gray-50 p-2.5 dark:bg-slate-800/60">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                En el Administrador de eventos de Meta, abre tu dataset de WhatsApp → Probar eventos y copia el código. Se
                manda una compra de prueba de S/ 1.00 que no cuenta como venta.
              </p>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="TEST12345"
                  data-testid="meta-conversiones-codigo"
                  className="h-8 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  disabled={!codigo.trim() || probando}
                  onClick={() => probar(codigo.trim())}
                  data-testid="meta-conversiones-enviar-prueba"
                  className="h-8 flex-none rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Enviar prueba
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
