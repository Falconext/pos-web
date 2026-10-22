/**
 * Reporte diario por WhatsApp (2026-10-21): a las 9 p. m. le llega al dueño
 * cuánto vendió, lo más vendido, cómo le fue al chat y lo pendiente. Sale del
 * número de Krezka, así que funciona aunque el negocio no haya conectado su
 * WhatsApp.
 *
 * Se guarda al tocar el interruptor y no con el "Guardar" del formulario: es
 * un aviso aparte, y quien lo activa quiere probarlo ahí mismo.
 */
import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import apiClient from '@/utils/apiClient'
import useAlertStore from '@/zustand/alert'

interface EstadoReporte {
  activo: boolean
  hora: string
  ultimoEnvio: string | null
  destinatarios: { nombre: string; numero: string }[]
}

const datos = <T,>(r: { data: { data?: T } & T }): T => (r.data?.data ?? r.data) as T
const mensajeDe = (e: any, porDefecto: string) => e?.response?.data?.message ?? porDefecto

export function ReporteDiarioCard() {
  const { alert } = useAlertStore()
  const [estado, setEstado] = useState<EstadoReporte | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [probando, setProbando] = useState(false)

  useEffect(() => {
    apiClient
      .get('/leads/reporte-diario')
      .then((r) => setEstado(datos<EstadoReporte>(r)))
      .catch(() => setEstado(null))
  }, [])

  if (!estado) return null

  const cambiar = async (activo: boolean) => {
    setGuardando(true)
    try {
      setEstado(datos<EstadoReporte>(await apiClient.patch('/leads/reporte-diario', { activo })))
      alert(activo ? 'Listo: te llegará cada día a las 9 p. m.' : 'Reporte diario apagado', 'success')
    } catch (e) {
      alert(mensajeDe(e, 'No se pudo guardar'), 'error')
    } finally {
      setGuardando(false)
    }
  }

  const probar = async () => {
    setProbando(true)
    try {
      const r = datos<{ enviados: number }>(await apiClient.post('/leads/reporte-diario/probar'))
      alert(`Enviado a ${r.enviados} celular${r.enviados === 1 ? '' : 'es'}. Revisa tu WhatsApp.`, 'success')
    } catch (e) {
      alert(mensajeDe(e, 'No se pudo enviar'), 'error')
    } finally {
      setProbando(false)
    }
  }

  const sinCelulares = estado.destinatarios.length === 0

  return (
    <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-800" data-testid="reporte-diario">
      <div className="flex items-center justify-between">
        <div className="pr-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Reporte diario por WhatsApp</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cada día a las 9 p. m. te llega cuánto vendiste, lo que más salió, cómo le fue al chat y lo que
            quedó pendiente. Lo manda el WhatsApp de Krezka.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={estado.activo}
          data-testid="reporte-diario-switch"
          disabled={guardando || (sinCelulares && !estado.activo)}
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

      {sinCelulares ? (
        <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          Ningún administrador tiene un celular válido. Agrégalo en Usuarios para poder recibirlo.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">Llega a:</span>
          {estado.destinatarios.map((d) => (
            <span
              key={d.numero}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-slate-800 dark:text-gray-300"
            >
              <Icon icon="mdi:whatsapp" width={12} className="text-[#25D366]" />
              {d.nombre.split(' ')[0]} · {d.numero}
            </span>
          ))}
        </div>
      )}

      {estado.activo && (
        <button
          type="button"
          onClick={probar}
          disabled={probando}
          data-testid="reporte-diario-probar"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-60 dark:text-violet-400"
        >
          <Icon icon={probando ? 'eos-icons:loading' : 'solar:plain-bold-duotone'} width={14} className={probando ? 'animate-spin' : ''} />
          {probando ? 'Enviando…' : 'Mandarme el de hoy ahora'}
        </button>
      )}
    </div>
  )
}
