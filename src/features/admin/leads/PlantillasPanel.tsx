import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import useAlertStore from '@/zustand/alert'
import { useDebounce } from '@/hooks/useDebounce'
import {
  datosDePlantilla,
  duplicarPlantilla,
  eliminarPlantilla,
  enviarPlantillaARevision,
  fetchPlantillas,
  guardarPlantilla,
  sincronizarPlantilla,
  subirImagenPlantilla,
  validarPlantilla,
  type BotonPlantilla,
  type DatosPlantilla,
  type EstadoPlantilla,
  type Plantilla,
} from '@/services/envios.service'

/**
 * Plantillas de WhatsApp propias: el texto de cada envío masivo.
 *
 * Fuera de las 24 h WhatsApp solo deja escribir con plantillas aprobadas por
 * Meta. Acá se escriben, se ve cómo le llegan al cliente y se mandan a
 * revisión. Las reglas de Meta se muestran mientras se escribe: un rechazo
 * tarda horas y su motivo es críptico.
 */

export const PIE_BAJA = 'Responde BAJA para no recibir más avisos'

export const ESTADO_PLANTILLA: Record<EstadoPlantilla, { label: string; clase: string; icono: string }> = {
  BORRADOR: { label: 'Borrador', clase: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300', icono: 'solar:pen-2-linear' },
  PENDIENTE: { label: 'En revisión', clase: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icono: 'solar:clock-circle-linear' },
  APROBADA: { label: 'Aprobada', clase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icono: 'solar:check-circle-bold' },
  RECHAZADA: { label: 'Rechazada', clase: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icono: 'solar:close-circle-bold' },
  PAUSADA: { label: 'Pausada por Meta', clase: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icono: 'solar:pause-circle-linear' },
  DESACTIVADA: { label: 'Desactivada', clase: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400', icono: 'solar:forbidden-circle-linear' },
}

const VARIABLES = [
  { id: 'nombre', label: 'Nombre del cliente' },
  { id: 'dato1', label: 'Dato 1' },
  { id: 'dato2', label: 'Dato 2' },
] as const

const VACIA: DatosPlantilla = {
  titulo: '',
  categoria: 'MARKETING',
  cabeceraTipo: 'NINGUNA',
  cabeceraTexto: '',
  cabeceraImagenUrl: '',
  cuerpo: '',
  pie: '',
  botones: [],
  ejemplos: {},
}

const EDITABLES: EstadoPlantilla[] = ['BORRADOR', 'RECHAZADA']

export function EstadoPlantillaChip({ estado }: { estado: EstadoPlantilla }) {
  const m = ESTADO_PLANTILLA[estado]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.clase}`}>
      <Icon icon={m.icono} width={12} />
      {m.label}
    </span>
  )
}

/** El cuerpo con las variables reemplazadas por un ejemplo, como lo vería el cliente. */
function conEjemplos(texto: string, d: DatosPlantilla) {
  return texto.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, v: string) => {
    const k = v.toLowerCase()
    if (k === 'nombre') return 'María'
    if (k === 'dato1' || k === 'dato2') return d.ejemplos[k] || `[${k}]`
    return `{{${v}}}`
  })
}

/** Burbuja estilo WhatsApp con la plantilla. */
export function BurbujaWhatsapp({ d }: { d: DatosPlantilla }) {
  const pie = d.categoria === 'MARKETING' ? PIE_BAJA : d.pie
  return (
    <div className="rounded-[22px] bg-[#e7ddd3] p-4 dark:bg-[#0b141a]">
      <div className="max-w-[300px] overflow-hidden rounded-xl rounded-tl-sm bg-white shadow-sm dark:bg-[#202c33]">
        {d.cabeceraTipo === 'IMAGEN' &&
          (d.cabeceraImagenUrl ? (
            <img src={d.cabeceraImagenUrl} alt="" className="aspect-[1.91/1] w-full object-cover" />
          ) : (
            <div className="flex aspect-[1.91/1] items-center justify-center bg-gray-100 text-gray-400 dark:bg-slate-700">
              <Icon icon="solar:gallery-wide-linear" width={28} />
            </div>
          ))}
        <div className="px-3 pb-2 pt-2">
          {d.cabeceraTipo === 'TEXTO' && d.cabeceraTexto && (
            <p className="mb-1 text-[14px] font-bold text-gray-900 dark:text-gray-100">{d.cabeceraTexto}</p>
          )}
          <p className="whitespace-pre-wrap break-words text-[13.5px] leading-snug text-gray-900 dark:text-gray-100">
            {d.cuerpo ? conEjemplos(d.cuerpo, d) : <span className="text-gray-400">Tu mensaje aparece acá…</span>}
          </p>
          {pie && <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">{pie}</p>}
          <p className="mt-0.5 text-right text-[10px] text-gray-400">10:24</p>
        </div>
        {d.botones.map((b, i) => (
          <div
            key={i}
            className="flex items-center justify-center gap-1.5 border-t border-gray-100 py-2 text-[13px] font-medium text-[#00a5f4] dark:border-slate-700"
          >
            <Icon icon={b.tipo === 'URL' ? 'solar:square-arrow-right-up-linear' : 'solar:reply-linear'} width={14} />
            {b.texto || 'Botón'}
          </div>
        ))}
      </div>
    </div>
  )
}

function Campo({ label, ayuda, children }: { label: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12.5px] font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      {children}
      {ayuda && <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">{ayuda}</p>}
    </div>
  )
}

const claseInput =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13.5px] text-gray-900 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-emerald-900/40 dark:disabled:bg-slate-800/60'

function Opcion({ activa, onClick, titulo, texto, disabled }: { activa: boolean; onClick: () => void; titulo: string; texto: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={activa}
      className={`flex-1 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed ${
        activa
          ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-slate-800'
          : 'border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600'
      }`}
    >
      <p className="text-[13px] font-bold text-gray-900 dark:text-white">{titulo}</p>
      <p className="mt-0.5 text-[11.5px] leading-snug text-gray-500 dark:text-gray-400">{texto}</p>
    </button>
  )
}

export function PlantillasPanel() {
  const { alert } = useAlertStore()
  const [lista, setLista] = useState<Plantilla[]>([])
  const [abierta, setAbierta] = useState<Plantilla | null>(null)
  const [d, setD] = useState<DatosPlantilla>(VACIA)
  const [errores, setErrores] = useState<string[]>([])
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const cuerpoRef = useRef<HTMLTextAreaElement>(null)

  const editable = !abierta || EDITABLES.includes(abierta.estado)

  const cargar = useCallback(async () => {
    try {
      setLista(await fetchPlantillas())
    } catch (e: any) {
      alert(e.message, 'error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Las que están en revisión se refrescan solas mientras la pantalla está abierta.
  useEffect(() => {
    if (!lista.some((p) => p.estado === 'PENDIENTE')) return
    const t = setInterval(cargar, 30000)
    return () => clearInterval(t)
  }, [lista, cargar])

  const abrir = (p: Plantilla | null) => {
    setConfirmarBorrar(false)
    setAbierta(p)
    setD(p ? datosDePlantilla(p) : VACIA)
  }

  // Al recargar la lista, la abierta toma su estado nuevo (aprobada, rechazada).
  useEffect(() => {
    if (!abierta) return
    const nueva = lista.find((p) => p.id === abierta.id)
    if (nueva && nueva.estado !== abierta.estado) setAbierta(nueva)
  }, [lista, abierta])

  const clave = JSON.stringify(d)
  const claveDeb = useDebounce(clave, 450)
  useEffect(() => {
    if (!editable) return setErrores([])
    const datos = JSON.parse(claveDeb) as DatosPlantilla
    if (!datos.titulo && !datos.cuerpo) return setErrores([])
    let vivo = true
    validarPlantilla(datos)
      .then((r) => vivo && setErrores(r.errores))
      .catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [claveDeb, editable])

  const set = (cambio: Partial<DatosPlantilla>) => setD((prev) => ({ ...prev, ...cambio }))

  const insertarVariable = (v: string) => {
    const el = cuerpoRef.current
    const marca = `{{${v}}}`
    if (!el) return set({ cuerpo: d.cuerpo + marca })
    const ini = el.selectionStart ?? d.cuerpo.length
    const fin = el.selectionEnd ?? ini
    const nuevo = d.cuerpo.slice(0, ini) + marca + d.cuerpo.slice(fin)
    set({ cuerpo: nuevo })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(ini + marca.length, ini + marca.length)
    })
  }

  const usaVariable = (v: string) => new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, 'i').test(d.cuerpo)

  const setBoton = (i: number, cambio: Partial<BotonPlantilla>) =>
    set({ botones: d.botones.map((b, j) => (j === i ? { ...b, ...cambio } : b)) })

  const accion = async (nombre: string, fn: () => Promise<void>) => {
    setOcupado(nombre)
    try {
      await fn()
    } catch (e: any) {
      alert(e.message, 'error')
    } finally {
      setOcupado(null)
    }
  }

  const guardar = () =>
    accion('guardar', async () => {
      const p = await guardarPlantilla(d, abierta?.id)
      await cargar()
      setAbierta(p)
      alert('Plantilla guardada', 'success')
    })

  const enviar = () =>
    accion('enviar', async () => {
      const guardada = await guardarPlantilla(d, abierta?.id)
      const p = await enviarPlantillaARevision(guardada.id)
      await cargar()
      setAbierta(p)
      alert(
        p.estado === 'APROBADA' ? 'Meta aprobó la plantilla' : 'Enviada a Meta. Suele tardar de minutos a unas horas.',
        'success',
      )
    })

  const subirImagen = (archivo?: File) =>
    archivo &&
    accion('imagen', async () => {
      set({ cabeceraImagenUrl: await subirImagenPlantilla(archivo) })
    })

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_340px]">
      <aside className="space-y-1">
        <button
          type="button"
          onClick={() => abrir(null)}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
            !abierta ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'
          }`}
        >
          <Icon icon="solar:add-circle-linear" width={16} />
          Nueva plantilla
        </button>
        {lista.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => abrir(p)}
            className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
              abierta?.id === p.id ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="block truncate text-[13px] font-semibold text-gray-800 dark:text-gray-200">{p.titulo}</span>
            <span className="mt-1 flex items-center gap-1.5">
              <EstadoPlantillaChip estado={p.estado} />
              <span className="text-[10.5px] text-gray-400">{p.categoria === 'MARKETING' ? 'Promoción' : 'Servicio'}</span>
            </span>
          </button>
        ))}
        {lista.length === 0 && (
          <p className="px-3 py-2 text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
            Escribe tu primera plantilla. Meta la revisa y, cuando la aprueba, puedes usarla en tus envíos.
          </p>
        )}
      </aside>

      <div className="min-w-0 space-y-4 rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
        {abierta && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <EstadoPlantillaChip estado={abierta.estado} />
              <span className="font-mono text-[11px] text-gray-400">{abierta.nombreMeta}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {abierta.estado !== 'BORRADOR' && (
                <button
                  type="button"
                  onClick={() => accion('sync', async () => {
                    const p = await sincronizarPlantilla(abierta.id)
                    await cargar()
                    setAbierta(p)
                  })}
                  disabled={!!ocupado}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-slate-800"
                >
                  <Icon icon={ocupado === 'sync' ? 'svg-spinners:180-ring' : 'solar:refresh-linear'} width={14} />
                  Consultar a Meta
                </button>
              )}
              <button
                type="button"
                onClick={() => accion('duplicar', async () => {
                  const p = await duplicarPlantilla(abierta.id)
                  await cargar()
                  abrir(p)
                })}
                disabled={!!ocupado}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                <Icon icon="solar:copy-linear" width={14} />
                Duplicar
              </button>
              {confirmarBorrar ? (
                <button
                  type="button"
                  onClick={() => accion('borrar', async () => {
                    await eliminarPlantilla(abierta.id)
                    await cargar()
                    abrir(null)
                    alert('Plantilla borrada', 'success')
                  })}
                  className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-red-700"
                >
                  {abierta.estado === 'BORRADOR' ? 'Sí, borrar' : 'Sí, borrar también en Meta'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmarBorrar(true)}
                  aria-label="Borrar plantilla"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                >
                  <Icon icon="solar:trash-bin-minimalistic-linear" width={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {abierta?.estado === 'RECHAZADA' && (
          <div className="rounded-xl bg-red-50 p-3 text-[12.5px] text-red-800 dark:bg-red-900/20 dark:text-red-200">
            <b>Meta la rechazó.</b> {abierta.motivoRechazo} Corrígela y vuelve a enviarla.
          </div>
        )}
        {abierta?.estado === 'PENDIENTE' && (
          <div className="rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            Meta la está revisando. Suele tardar de minutos a unas horas; esta pantalla se actualiza sola.
          </div>
        )}
        {abierta && !editable && abierta.estado !== 'PENDIENTE' && (
          <p className="text-[12px] text-gray-500 dark:text-gray-400">
            Una plantilla enviada a Meta no se puede editar. Usa <b>Duplicar</b> para hacer una versión nueva.
          </p>
        )}

        <Campo label="Nombre (solo lo ves tú)">
          <input
            value={d.titulo}
            onChange={(e) => set({ titulo: e.target.value })}
            disabled={!editable}
            maxLength={60}
            placeholder="ej. Cyber Wow fragancias"
            className={claseInput}
          />
        </Campo>

        <Campo label="Tipo de mensaje">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Opcion
              activa={d.categoria === 'MARKETING'}
              onClick={() => set({ categoria: 'MARKETING' })}
              disabled={!editable}
              titulo="Promoción"
              texto="Ofertas, novedades, lanzamientos. Lleva el pie para darse de baja."
            />
            <Opcion
              activa={d.categoria === 'UTILITY'}
              onClick={() => set({ categoria: 'UTILITY' })}
              disabled={!editable}
              titulo="Aviso de servicio"
              texto="Sobre un pedido o trámite del cliente. Sin promociones: Meta lo rechaza."
            />
          </div>
        </Campo>

        <Campo label="Cabecera">
          <div className="flex flex-wrap gap-1.5">
            {(['NINGUNA', 'TEXTO', 'IMAGEN'] as const).map((t) => (
              <button
                key={t}
                type="button"
                disabled={!editable}
                aria-pressed={d.cabeceraTipo === t}
                onClick={() => set({ cabeceraTipo: t })}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-60 ${
                  d.cabeceraTipo === t
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300'
                }`}
              >
                {t === 'NINGUNA' ? 'Sin cabecera' : t === 'TEXTO' ? 'Título' : 'Imagen'}
              </button>
            ))}
          </div>
          {d.cabeceraTipo === 'TEXTO' && (
            <input
              value={d.cabeceraTexto ?? ''}
              onChange={(e) => set({ cabeceraTexto: e.target.value })}
              disabled={!editable}
              maxLength={60}
              placeholder="ej. ¡Cyber Wow!"
              aria-label="Título de la cabecera"
              className={`${claseInput} mt-2`}
            />
          )}
          {d.cabeceraTipo === 'IMAGEN' && editable && (
            <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-3 text-[12.5px] text-gray-600 hover:border-gray-400 dark:border-slate-600 dark:text-gray-300">
              <Icon icon={ocupado === 'imagen' ? 'svg-spinners:180-ring' : 'solar:upload-linear'} width={18} />
              {d.cabeceraImagenUrl ? 'Cambiar imagen' : 'Subir imagen (JPG o PNG, hasta 5 MB)'}
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => subirImagen(e.target.files?.[0])}
              />
            </label>
          )}
        </Campo>

        <Campo label="Mensaje" ayuda={`${d.cuerpo.length}/1024`}>
          <textarea
            ref={cuerpoRef}
            value={d.cuerpo}
            onChange={(e) => set({ cuerpo: e.target.value })}
            disabled={!editable}
            rows={6}
            maxLength={1024}
            placeholder="Hola {{nombre}}, este fin de semana tenemos {{dato1}} en toda la tienda. ¿Te separo el tuyo?"
            className={`${claseInput} resize-y leading-relaxed`}
          />
          {editable && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11.5px] text-gray-500 dark:text-gray-400">Insertar:</span>
              {VARIABLES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => insertarVariable(v.id)}
                  className="rounded-full bg-violet-50 px-2.5 py-1 text-[11.5px] font-semibold text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300"
                >
                  {`{{${v.id}}}`} · {v.label}
                </button>
              ))}
            </div>
          )}
        </Campo>

        {(['dato1', 'dato2'] as const).filter(usaVariable).map((v) => (
          <Campo
            key={v}
            label={`Ejemplo para {{${v}}}`}
            ayuda="Meta lo usa para revisar la plantilla. Al enviar escribes el valor real (ej. el descuento del día)."
          >
            <input
              value={d.ejemplos[v] ?? ''}
              onChange={(e) => set({ ejemplos: { ...d.ejemplos, [v]: e.target.value } })}
              disabled={!editable}
              maxLength={60}
              placeholder={v === 'dato1' ? 'ej. 20% de descuento' : 'ej. hasta el domingo'}
              className={claseInput}
            />
          </Campo>
        ))}

        <Campo
          label="Pie"
          ayuda={d.categoria === 'MARKETING' ? 'En promociones va siempre: quien responde BAJA deja de recibir.' : 'Opcional.'}
        >
          <input
            value={d.categoria === 'MARKETING' ? PIE_BAJA : d.pie ?? ''}
            onChange={(e) => set({ pie: e.target.value })}
            disabled={!editable || d.categoria === 'MARKETING'}
            maxLength={60}
            placeholder="ej. Tienda Bulldog"
            className={claseInput}
          />
        </Campo>

        <Campo label="Botones" ayuda="Hasta 3 de respuesta y 1 de enlace.">
          <div className="space-y-2">
            {d.botones.map((b, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-slate-800">
                  <Icon icon={b.tipo === 'URL' ? 'solar:link-linear' : 'solar:reply-linear'} width={16} />
                </span>
                <input
                  value={b.texto}
                  onChange={(e) => setBoton(i, { texto: e.target.value })}
                  disabled={!editable}
                  maxLength={25}
                  placeholder={b.tipo === 'URL' ? 'Ver catálogo' : 'Lo quiero'}
                  aria-label={`Texto del botón ${i + 1}`}
                  className={`${claseInput} min-w-0 flex-1`}
                />
                {b.tipo === 'URL' && (
                  <input
                    value={b.url ?? ''}
                    onChange={(e) => setBoton(i, { url: e.target.value })}
                    disabled={!editable}
                    placeholder="https://"
                    aria-label={`Enlace del botón ${i + 1}`}
                    className={`${claseInput} min-w-0 flex-[2]`}
                  />
                )}
                {editable && (
                  <button
                    type="button"
                    onClick={() => set({ botones: d.botones.filter((_, j) => j !== i) })}
                    aria-label={`Quitar botón ${i + 1}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800"
                  >
                    <Icon icon="solar:close-circle-linear" width={18} />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={d.botones.filter((b) => b.tipo === 'RESPUESTA').length >= 3}
                  onClick={() => set({ botones: [...d.botones, { tipo: 'RESPUESTA', texto: '' }] })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:border-gray-400 disabled:opacity-40 dark:border-slate-600 dark:text-gray-300"
                >
                  <Icon icon="solar:reply-linear" width={14} />
                  Respuesta rápida
                </button>
                <button
                  type="button"
                  disabled={d.botones.some((b) => b.tipo === 'URL')}
                  onClick={() => set({ botones: [...d.botones, { tipo: 'URL', texto: '', url: 'https://' }] })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:border-gray-400 disabled:opacity-40 dark:border-slate-600 dark:text-gray-300"
                >
                  <Icon icon="solar:link-linear" width={14} />
                  Enlace
                </button>
              </div>
            )}
          </div>
        </Campo>

        {editable && errores.length > 0 && (
          <ul className="space-y-1 rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-900 dark:bg-amber-900/20 dark:text-amber-200" aria-live="polite">
            {errores.map((e) => (
              <li key={e} className="flex gap-2">
                <Icon icon="solar:danger-triangle-linear" width={15} className="mt-0.5 flex-none" />
                {e}
              </li>
            ))}
          </ul>
        )}

        {editable && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={guardar}
              disabled={!!ocupado || !d.titulo.trim() || !d.cuerpo.trim()}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-slate-800"
            >
              Guardar borrador
            </button>
            <button
              type="button"
              onClick={enviar}
              disabled={!!ocupado || errores.length > 0 || !d.titulo.trim() || !d.cuerpo.trim()}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gray-900 px-4 text-[13px] font-semibold text-white hover:bg-black disabled:opacity-40 dark:bg-white dark:text-gray-900"
            >
              <Icon icon={ocupado === 'enviar' ? 'svg-spinners:180-ring' : 'solar:plain-2-linear'} width={16} />
              Enviar a revisión de Meta
            </button>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 xl:col-span-1">
        <div className="space-y-2 xl:sticky xl:top-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">Así le llega</p>
          <BurbujaWhatsapp d={d} />
        </div>
      </div>
    </div>
  )
}
