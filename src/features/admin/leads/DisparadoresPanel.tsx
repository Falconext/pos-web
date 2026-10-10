/**
 * F — la pantalla de los disparadores.
 *
 * Lo que el dueño necesita ver acá no es "qué avisos existen": es qué está
 * por salirle a sus clientes, qué ya salió y —sobre todo— qué NO salió y por
 * qué. Un aviso que no salió sin explicación es un reclamo que nadie puede
 * responder.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import moment from 'moment'
import { useAlertStore } from '@/zustand/alert'
import {
  disparosService,
  DISPARO_META,
  ESTADO_DISPARO_META,
  type ConfigDisparadores,
  type Disparo,
  type EstadoDisparo,
  type ListadoDisparos,
  type TipoDisparo,
} from '@/services/crm.service'

const ORDEN_TIPOS: TipoDisparo[] = [
  'VUELTA_DISPONIBILIDAD',
  'RECUPERAR_COTIZACION',
  'CARRITO_EN_ESPERA',
  'POST_ENTREGA',
  'RECOMPRA',
  'REACTIVACION',
]

export function DisparadoresPanel() {
  const { alert } = useAlertStore()
  const [datos, setDatos] = useState<ListadoDisparos | null>(null)
  const [config, setConfig] = useState<ConfigDisparadores | null>(null)
  const [cargando, setCargando] = useState(true)
  const [estado, setEstado] = useState<EstadoDisparo | ''>('')
  const [altaPlantillas, setAltaPlantillas] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const [l, c] = await Promise.all([
        disparosService.listar(estado ? { estado } : {}),
        disparosService.config(),
      ])
      setDatos(l)
      setConfig(c)
    } catch {
      alert('No se pudieron cargar los avisos', 'error')
    } finally {
      setCargando(false)
    }
  }, [alert, estado])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const enviarAhora = async (d: Disparo) => {
    try {
      const r = await disparosService.enviarAhora(d.id)
      await cargar()
      // Si una regla lo frenó, el motivo es la información útil: el botón no
      // es una puerta trasera, y el dueño tiene que entender por qué no salió.
      alert(
        r.enviado ? `Enviado por ${r.via}` : r.motivo ?? 'No se envió',
        r.enviado ? 'success' : 'warning',
      )
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'No se pudo enviar', 'error')
    }
  }

  /**
   * Da de alta las plantillas en la cuenta de WhatsApp del negocio.
   *
   * Es el paso que faltaba para que los avisos de 25 y 45 días puedan salir:
   * fuera de la ventana de 24 h Meta solo entrega plantillas aprobadas, y la
   * aprobación la da Meta, no nosotros. El botón las CREA; la aprobación
   * tarda, y las comerciales más.
   */
  const crearPlantillas = async () => {
    setAltaPlantillas(true)
    try {
      const r = await disparosService.crearPlantillas()
      const partes = [
        r.creadas.length ? `${r.creadas.length} enviadas a aprobación` : '',
        r.existentes.length ? `${r.existentes.length} ya estaban` : '',
        r.errores.length ? `${r.errores.length} con error` : '',
      ].filter(Boolean)
      alert(
        `Plantillas: ${partes.join(', ')}. Meta tarda en aprobarlas; hasta entonces los avisos fuera de 24 h no salen.`,
        r.errores.length ? 'warning' : 'success',
      )
    } catch (e: any) {
      alert(
        e?.response?.data?.message ??
          'No se pudieron dar de alta las plantillas',
        'error',
      )
    } finally {
      setAltaPlantillas(false)
    }
  }

  const darDeBaja = async (d: Disparo) => {
    try {
      const r = await disparosService.darDeBaja(d.telefono)
      await cargar()
      alert(
        `Listo: no se le volverá a escribir. Se cancelaron ${r.cancelados} avisos pendientes.`,
        'success',
      )
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'No se pudo dar de baja', 'error')
    }
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
        <Icon icon="eos-icons:loading" className="animate-spin text-3xl text-indigo-500" />
        <p className="text-sm">Cargando…</p>
      </div>
    )
  }
  if (!datos || !config) return null

  const activos = new Set(config.activos)

  return (
    <div className="space-y-5">
      {/* El requisito que nadie adivina: sin plantillas aprobadas, los avisos
          que caen fuera de la ventana de 24 h no salen. Va arriba porque es
          lo primero que hay que hacer, una sola vez. */}
      <div className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 sm:flex-row sm:items-center dark:border-indigo-900/40 dark:bg-indigo-900/10">
        <Icon
          icon="solar:document-add-bold-duotone"
          className="text-2xl text-indigo-500"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-gray-900 dark:text-white">
            Plantillas de WhatsApp
          </p>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Un aviso que sale más de 24 horas después del último mensaje del
            cliente solo puede ir como plantilla aprobada por Meta. Dalas de
            alta una vez; la aprobación la da Meta y tarda (las comerciales,
            más). Hasta que aprueben, esos avisos no se envían y acá abajo
            dice por qué.
          </p>
        </div>
        <button
          type="button"
          data-testid="btn-plantillas"
          onClick={crearPlantillas}
          disabled={altaPlantillas}
          className="h-10 flex-shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {altaPlantillas ? 'Enviando…' : 'Dar de alta las plantillas'}
        </button>
      </div>

      {/* Qué está encendido y qué cuesta */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#111827]">
        <div className="mb-3 flex items-center gap-2">
          <Icon icon="solar:bolt-bold-duotone" className="text-lg text-amber-500" />
          <h3 className="text-sm font-black text-gray-900 dark:text-white">
            Avisos automáticos
          </h3>
          <span className="ml-auto text-[11px] font-bold text-gray-400">
            {config.horaDesde}:00 a {config.horaHasta}:00 · máximo{' '}
            {config.topeMarketing} comerciales cada {config.topeMarketingDias} días
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {ORDEN_TIPOS.map((t) => {
            const meta = DISPARO_META[t]
            const encendido = activos.has(t)
            return (
              <div
                key={t}
                data-testid={`disparador-${t}`}
                className={`flex items-start gap-2.5 rounded-xl border p-3 ${
                  encendido
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-900/10'
                    : 'border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/20'
                }`}
              >
                <Icon
                  icon={meta.icon}
                  className={`mt-0.5 text-lg ${encendido ? 'text-emerald-600' : 'text-gray-400'}`}
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-black text-gray-900 dark:text-white">
                    {meta.label}
                    {meta.marketing && (
                      <span
                        title="Cuenta para el tope y lleva el pie de baja"
                        className="rounded bg-amber-100 px-1 text-[9px] font-black text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        COMERCIAL
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{meta.detalle}</p>
                  <p
                    className={`mt-0.5 text-[10px] font-bold ${encendido ? 'text-emerald-600' : 'text-gray-400'}`}
                  >
                    {encendido ? 'Encendido' : 'Apagado'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* La baja no es un detalle legal: es lo que mantiene vivo el número
            de WhatsApp del negocio. */}
        <p className="mt-3 border-t border-gray-100 pt-3 text-[11px] text-gray-500 dark:border-gray-800">
          <b>{datos.bajas}</b> cliente{datos.bajas === 1 ? '' : 's'} pidió no
          recibir avisos. A esos números no se les escribe ni por error: es lo
          que evita que reporten el número del negocio.
        </p>
      </div>

      {/* El historial */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEstado('')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
              estado === ''
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Todos
          </button>
          {datos.porEstado.map((p) => (
            <button
              key={p.estado}
              type="button"
              onClick={() => setEstado(p.estado)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                estado === p.estado
                  ? ESTADO_DISPARO_META[p.estado]?.chip
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {ESTADO_DISPARO_META[p.estado]?.label ?? p.estado} · {p.total}
            </button>
          ))}
        </div>

        {datos.disparos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-800">
            Todavía no hay avisos programados. Aparecen solos cuando alguien
            cotiza, posterga o recibe su pedido.
          </p>
        ) : (
          <div className="space-y-2">
            {datos.disparos.map((d) => (
              <Fila
                key={d.id}
                d={d}
                onEnviar={() => enviarAhora(d)}
                onBaja={() => darDeBaja(d)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Fila({
  d,
  onEnviar,
  onBaja,
}: {
  d: Disparo
  onEnviar: () => void
  onBaja: () => void
}) {
  const meta = DISPARO_META[d.tipo]
  const estadoMeta = ESTADO_DISPARO_META[d.estado]
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-[#111827]">
      <div className="flex flex-wrap items-center gap-2">
        <Icon icon={meta?.icon ?? 'solar:bell-bold-duotone'} className="text-base text-gray-400" />
        <span className="text-xs font-black text-gray-900 dark:text-white">
          {meta?.label ?? d.tipo}
        </span>
        <span className="font-mono text-[11px] text-gray-400">{d.telefono}</span>
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${estadoMeta?.chip}`}>
          {estadoMeta?.label ?? d.estado}
        </span>
        <span className="ml-auto text-[10px] text-gray-400">
          {d.enviadoEn
            ? `Enviado ${moment(d.enviadoEn).format('DD/MM HH:mm')}`
            : `Para ${moment(d.programadoPara).format('DD/MM HH:mm')}`}
        </span>
      </div>

      {/* El motivo es lo más útil de toda la fila cuando algo no salió. */}
      {d.motivo && (
        <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400">{d.motivo}</p>
      )}
      {d.plantilla && (
        <p className="mt-1 text-[10px] text-gray-400">
          Se envió con la plantilla <span className="font-mono">{d.plantilla}</span>, porque
          la conversación llevaba más de 24 h sin mensajes del cliente.
        </p>
      )}
      {d.textoEnviado && (
        <p className="mt-1 text-[11px] italic text-gray-500 dark:text-gray-400">
          "{d.textoEnviado}"
        </p>
      )}

      {d.estado === 'PROGRAMADO' && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onEnviar}
            className="rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300"
          >
            Enviar ahora
          </button>
          <button
            type="button"
            onClick={onBaja}
            className="rounded-lg px-2 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            No escribirle más
          </button>
        </div>
      )}
    </div>
  )
}
