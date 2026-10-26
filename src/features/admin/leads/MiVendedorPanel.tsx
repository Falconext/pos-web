import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { useSearchParams } from 'react-router-dom'
import type {
  CategoriaConocimiento,
  LeadsConfig,
  ConfigEnvio,
  LongitudRespuesta,
  MedioPago,
  PerfilVendedor,
  TemaConocimiento,
  TipoZona,
  ZonaEnvio,
} from '@/services/leads.service'
import type { useLeadsViewModel } from './useLeadsViewModel'
import { ConfigForm, EntrenarPanel } from './LeadsView'
import { PLANTILLA_CONTEXTO, SECCIONES_CONTEXTO } from './LeadsModel'
import { TextoWhatsapp } from './textoWhatsapp'

/**
 * "Mi vendedor" (22-10): todo lo que define cómo atiende la IA, en una sola
 * pantalla ordenada por pestañas.
 *
 * Antes era un modal con un cuadro de texto libre y otro modal aparte para
 * entrenar; la mayoría de negocios no sabía qué escribir y dejaba la IA con
 * la plantilla genérica. Con campos concretos —a quién le vendes, cómo
 * hablas, qué palabras no usar, cómo saludas— el dueño completa lo que ya
 * sabe de su negocio, y ve al lado cómo saluda su vendedor.
 *
 * Personalidad, temas, envíos y pagos se guardan juntos con un solo botón.
 * Ajustes (encender la IA, seguimiento, cotización, contexto general) y los
 * documentos de entrenamiento mantienen su propio guardado, como antes.
 */

type Vm = ReturnType<typeof useLeadsViewModel>
type Pestana = 'personalidad' | 'conocimiento' | 'entrega' | 'pagos' | 'ajustes'

const PESTANAS: { id: Pestana; label: string; icon: string }[] = [
  { id: 'personalidad', label: 'Personalidad', icon: 'solar:user-speak-rounded-linear' },
  { id: 'conocimiento', label: 'Conocimiento', icon: 'solar:notebook-bookmark-linear' },
  { id: 'entrega', label: 'Entrega', icon: 'solar:delivery-linear' },
  { id: 'pagos', label: 'Pagos', icon: 'solar:card-linear' },
  { id: 'ajustes', label: 'Ajustes', icon: 'solar:tuning-2-linear' },
]

interface Borrador {
  /** Texto general del negocio (iaVentasContexto). Lo de Hierba Sana vive aquí, intacto. */
  contexto: string
  /** PDF o imagen que la IA envía cuando piden más información. */
  brochure: string
  asesor: string
  vendedor: PerfilVendedor
  envio: ConfigEnvio
  medios: MedioPago[]
  despedida: { activa: boolean; texto: string }
}

const ENVIO_VACIO: ConfigEnvio = { zonas: [], zonaPorDefecto: '' }

function borradorDe(config: Vm['config']): Borrador {
  return {
    contexto: config.iaVentasContexto ?? '',
    brochure: config.iaVentasBrochureUrl ?? '',
    asesor: config.asesor ?? '',
    vendedor: config.vendedor ?? {},
    envio: config.envio ?? ENVIO_VACIO,
    medios: config.mediosPagoLista ?? [],
    despedida: config.despedida ?? { activa: false, texto: '' },
  }
}

// ─── Piezas de formulario ───────────────────────────────────────────────────

const inputBase =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[14px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-emerald-900/40'

function Seccion({
  icon,
  titulo,
  descripcion,
  accion,
  children,
}: {
  icon: string
  titulo: string
  descripcion?: string
  accion?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)] sm:p-6 dark:border-slate-800 dark:bg-[#111827]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Icon icon={icon} width={19} />
          </span>
          <div>
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">{titulo}</h3>
            {descripcion && (
              <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{descripcion}</p>
            )}
          </div>
        </div>
        {accion}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Campo({
  label,
  ayuda,
  contador,
  children,
}: {
  label: string
  ayuda?: ReactNode
  contador?: { actual: number; max: number }
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{label}</span>
        {contador && (
          <span
            className={`text-[11px] tabular-nums ${
              contador.actual > contador.max ? 'text-rose-500' : 'text-gray-400'
            }`}
          >
            {contador.actual}/{contador.max}
          </span>
        )}
      </span>
      {children}
      {ayuda && <span className="mt-1.5 block text-[12px] text-gray-500 dark:text-gray-400">{ayuda}</span>}
    </label>
  )
}

function Interruptor({
  activo,
  onChange,
  label,
  ayuda,
}: {
  activo: boolean
  onChange: (v: boolean) => void
  label: string
  ayuda: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => onChange(!activo)}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
        activo
          ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-900/20'
          : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <span
        className={`relative h-6 w-11 flex-none rounded-full transition ${
          activo ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            activo ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
      <span>
        <span className="block text-[13.5px] font-semibold text-gray-900 dark:text-white">{label}</span>
        <span className="block text-[12px] text-gray-500 dark:text-gray-400">{ayuda}</span>
      </span>
    </button>
  )
}

/** Etiquetas que se agregan con Enter o coma; pegar una lista separada por comas también sirve. */
function Etiquetas({
  valores,
  onChange,
  placeholder,
  sugerencias = [],
  max = 40,
}: {
  valores: string[]
  onChange: (v: string[]) => void
  placeholder: string
  sugerencias?: string[]
  max?: number
}) {
  const [texto, setTexto] = useState('')
  const agregar = (crudo: string) => {
    const nuevos = crudo
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean)
    if (!nuevos.length) return
    const vistos = new Set(valores.map((v) => v.toLowerCase()))
    const sumar = nuevos.filter((n) => !vistos.has(n.toLowerCase()) && vistos.add(n.toLowerCase()))
    onChange([...valores, ...sumar].slice(0, max))
    setTexto('')
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      agregar(texto)
    } else if (e.key === 'Backspace' && !texto && valores.length) {
      onChange(valores.slice(0, -1))
    }
  }
  const pendientes = sugerencias.filter(
    (s) => !valores.some((v) => v.toLowerCase() === s.toLowerCase()),
  )
  return (
    <div>
      <div className="flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-2 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-emerald-900/40">
        {valores.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 py-1 pl-2.5 pr-1 text-[12.5px] font-medium text-gray-700 dark:bg-slate-800 dark:text-gray-200"
          >
            {v}
            <button
              type="button"
              aria-label={`Quitar ${v}`}
              onClick={() => onChange(valores.filter((x) => x !== v))}
              className="flex h-5 w-5 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-slate-700"
            >
              <Icon icon="mdi:close" width={13} />
            </button>
          </span>
        ))}
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => agregar(texto)}
          onPaste={(e) => {
            const t = e.clipboardData.getData('text')
            if (/[,\n]/.test(t)) {
              e.preventDefault()
              agregar(t)
            }
          }}
          placeholder={valores.length ? '' : placeholder}
          className="min-w-[160px] flex-1 border-0 bg-transparent px-1 py-1 text-[13.5px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
        />
      </div>
      {pendientes.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] text-gray-400">Sugeridas:</span>
          {pendientes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => agregar(s)}
              className="rounded-full border border-dashed border-gray-300 px-2.5 py-0.5 text-[11.5px] text-gray-500 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-600 dark:text-gray-400"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Personalidad ───────────────────────────────────────────────────────────

const LONGITUDES: { valor: LongitudRespuesta; label: string }[] = [
  { valor: 1, label: 'Muy conciso' },
  { valor: 2, label: 'Conciso' },
  { valor: 3, label: 'Equilibrado' },
  { valor: 4, label: 'Detallado' },
  { valor: 5, label: 'Muy detallado' },
]

const PLANTILLAS_ESTILO: { nombre: string; comunicacion: string; ventas: string }[] = [
  {
    nombre: 'Cercano',
    comunicacion: 'Cálido, cercano y amable. Habla de tú, con frases cortas y naturales, como un vendedor de confianza.',
    ventas: 'Primero pregunta qué necesita, luego recomienda una opción concreta con su precio y propone el siguiente paso.',
  },
  {
    nombre: 'Profesional',
    comunicacion: 'Formal y respetuoso, trata de usted. Claro y preciso, sin jergas.',
    ventas: 'Consultivo: entiende el caso, explica los beneficios con datos y propone el siguiente paso sin presionar.',
  },
  {
    nombre: 'Experto',
    comunicacion: 'Habla como un especialista que guía sin abrumar, con lenguaje simple y claro.',
    ventas: 'Educativo: explica en una línea por qué recomienda cada opción y ayuda al cliente a elegir.',
  },
  {
    nombre: 'Juvenil',
    comunicacion: 'Relajado y entusiasta, cercano, con expresiones peruanas suaves.',
    ventas: 'Directo: muestra opciones rápido, destaca lo más pedido y facilita cerrar el pedido.',
  },
]

const PALABRAS_SUGERIDAS = ['asistente virtual', 'bot', 'oferta imperdible', 'compra ya', 'último aviso']

function VistaPrevia({ negocio, b }: { negocio: string; b: Borrador }) {
  const p = b.vendedor
  const nombre = b.asesor.trim()
  const saludo =
    p.mensajeBienvenida?.trim() ||
    (nombre
      ? `Hola! Soy ${nombre} de ${negocio}. En qué te puedo ayudar?`
      : `Hola! Bienvenido a ${negocio}. En qué te puedo ayudar?`)
  // Sin signos de apertura, la muestra se ve como escribiría el vendedor.
  const texto = p.signosApertura === false ? saludo.replace(/[¿¡]/g, '') : saludo
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)] dark:border-slate-800 dark:bg-[#111827]">
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-slate-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-[13px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          {(nombre || negocio).slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-gray-900 dark:text-white">{nombre || negocio}</p>
          <p className="flex items-center gap-1 text-[11.5px] text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> en línea
          </p>
        </div>
        <Icon icon="mdi:whatsapp" width={20} className="ml-auto text-[#25D366]" />
      </div>
      <div className="space-y-3 bg-[#F4F1EC] px-4 py-5 dark:bg-[#0b0f17]">
        <div className="flex justify-end">
          <span className="rounded-2xl rounded-br-md bg-[#D9FDD3] px-3.5 py-2 text-[13px] text-gray-800 shadow-sm dark:bg-emerald-900/50 dark:text-gray-100">
            Hola, quiero info
          </span>
        </div>
        <div className="flex">
          <span className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-800 shadow-sm dark:bg-slate-800 dark:text-gray-100">
            {typeof texto === 'string' ? <TextoWhatsapp texto={texto} /> : texto}
          </span>
        </div>
      </div>
      <div className="space-y-1.5 px-4 py-3.5 text-[12px] text-gray-500 dark:text-gray-400">
        <p className="flex items-center gap-1.5">
          <Icon icon="solar:ruler-linear" width={14} />
          {LONGITUDES.find((l) => l.valor === (p.longitud ?? 2))?.label} ·{' '}
          {p.emojis === false ? 'sin emojis' : 'con emojis'}
        </p>
        {!!p.palabrasEvitar?.length && (
          <p className="flex items-center gap-1.5">
            <Icon icon="solar:forbidden-circle-linear" width={14} />
            Nunca dirá {p.palabrasEvitar.length} palabra{p.palabrasEvitar.length === 1 ? '' : 's'}
          </p>
        )}
        <p className="pt-1 text-[11.5px] text-gray-400">
          Es una muestra del saludo. La IA lo adapta para responder también lo que te preguntan.
        </p>
      </div>
    </div>
  )
}

function TabPersonalidad({
  b,
  set,
  negocio,
}: {
  b: Borrador
  set: (fn: (b: Borrador) => Borrador) => void
  negocio: string
}) {
  const p = b.vendedor
  const setP = (cambio: Partial<PerfilVendedor>) =>
    set((x) => ({ ...x, vendedor: { ...x.vendedor, ...cambio } }))

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <Seccion icon="solar:user-id-linear" titulo="Información básica" descripcion="Quién atiende a tus clientes.">
          <Campo
            label="Nombre del vendedor"
            ayuda="Un nombre corto genera confianza. Déjalo vacío si prefieres que hable como el negocio."
          >
            <input
              value={b.asesor}
              maxLength={40}
              onChange={(e) => set((x) => ({ ...x, asesor: e.target.value }))}
              placeholder="Ej. Ana"
              className={inputBase}
            />
          </Campo>
        </Seccion>

        <Seccion
          icon="solar:users-group-rounded-linear"
          titulo="Audiencia e instrucciones"
          descripcion="Lo que sabes de tus clientes y lo que tu vendedor nunca debe olvidar."
        >
          <Campo label="¿A quién le vendes?" contador={{ actual: (p.audiencia ?? '').length, max: 300 }}>
            <input
              value={p.audiencia ?? ''}
              onChange={(e) => setP({ audiencia: e.target.value })}
              placeholder="Ej. Mamás de 25 a 45 años que buscan productos naturales para su familia"
              className={inputBase}
            />
          </Campo>
          <Campo
            label="Reglas para tu vendedor"
            ayuda={
              <>
                Escribe una regla por línea usando <b>SIEMPRE</b> y <b>NUNCA</b>. Ej. "NUNCA ofrezcas descuentos que no estén
                en la lista".
              </>
            }
          >
            <textarea
              value={p.reglas ?? ''}
              onChange={(e) => setP({ reglas: e.target.value })}
              rows={4}
              placeholder={'SIEMPRE pregunta para qué lo necesita antes de recomendar.\nNUNCA prometas entregas el mismo día.'}
              className={`${inputBase} resize-y leading-relaxed`}
            />
          </Campo>
        </Seccion>

        <Seccion
          icon="solar:chat-round-like-linear"
          titulo="Personalidad"
          descripcion="Cómo habla y cómo vende."
          accion={
            <div className="hidden gap-1 sm:flex">
              {PLANTILLAS_ESTILO.map((pl) => (
                <button
                  key={pl.nombre}
                  type="button"
                  onClick={() => setP({ estiloComunicacion: pl.comunicacion, estiloVentas: pl.ventas })}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-[11.5px] font-semibold text-gray-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300"
                  title="Usar esta plantilla"
                >
                  {pl.nombre}
                </button>
              ))}
            </div>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Campo label="Estilo de comunicación" contador={{ actual: (p.estiloComunicacion ?? '').length, max: 300 }}>
              <textarea
                value={p.estiloComunicacion ?? ''}
                onChange={(e) => setP({ estiloComunicacion: e.target.value })}
                rows={4}
                placeholder="Ej. Cálido y cercano, como un barista que guía sin abrumar"
                className={`${inputBase} resize-y leading-relaxed`}
              />
            </Campo>
            <Campo label="Estilo de ventas" contador={{ actual: (p.estiloVentas ?? '').length, max: 300 }}>
              <textarea
                value={p.estiloVentas ?? ''}
                onChange={(e) => setP({ estiloVentas: e.target.value })}
                rows={4}
                placeholder="Ej. Primero entiende el gusto del cliente, luego recomienda"
                className={`${inputBase} resize-y leading-relaxed`}
              />
            </Campo>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-gray-800 dark:text-gray-200">Largo de las respuestas</p>
            <div className="grid grid-cols-5 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
              {LONGITUDES.map((l) => {
                const activo = (p.longitud ?? 2) === l.valor
                return (
                  <button
                    key={l.valor}
                    type="button"
                    onClick={() => setP({ longitud: l.valor })}
                    aria-pressed={activo}
                    className={`rounded-lg px-1 py-2 text-[11.5px] font-semibold transition sm:text-[12.5px] ${
                      activo
                        ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900'
                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {l.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-[12px] text-gray-500 dark:text-gray-400">
              Para productos de consumo funciona mejor "Conciso". Cursos o servicios suelen necesitar más detalle.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Interruptor
              activo={p.emojis !== false}
              onChange={(v) => setP({ emojis: v })}
              label="Usar emojis"
              ayuda="Hacen la conversación menos fría"
            />
            <Interruptor
              activo={p.signosApertura !== false}
              onChange={(v) => setP({ signosApertura: v })}
              label="Usar ¿ y ¡ de apertura"
              ayuda="Apágalo para escribir como en WhatsApp"
            />
          </div>

          {p.emojis !== false && (
            <Campo label="Emojis permitidos" ayuda="Opcional. Si eliges algunos, solo usará esos.">
              <Etiquetas
                valores={p.emojisPermitidos ?? []}
                onChange={(v) => setP({ emojisPermitidos: v })}
                placeholder="Escribe o pega emojis y presiona Enter"
                sugerencias={['😊', '🙌', '✨', '📦', '💚']}
                max={20}
              />
            </Campo>
          )}

          <Campo label="Palabras a evitar" ayuda="Tu vendedor nunca las va a escribir.">
            <Etiquetas
              valores={p.palabrasEvitar ?? []}
              onChange={(v) => setP({ palabrasEvitar: v })}
              placeholder="Escribe una palabra y presiona Enter"
              sugerencias={PALABRAS_SUGERIDAS}
            />
          </Campo>
        </Seccion>

        <Seccion
          icon="solar:chat-square-like-linear"
          titulo="Mensajes clave"
          descripcion="Termínalos con una pregunta: así el cliente sigue la conversación."
        >
          <Campo
            label="Saludo de bienvenida"
            ayuda="Evita promociones en el primer mensaje: Meta lo puede tomar como spam."
          >
            <textarea
              value={p.mensajeBienvenida ?? ''}
              onChange={(e) => setP({ mensajeBienvenida: e.target.value })}
              rows={3}
              placeholder={`Hola! Soy Ana de ${negocio} 😊 Estoy aquí para ayudarte. Qué estás buscando?`}
              className={`${inputBase} resize-y leading-relaxed`}
            />
          </Campo>
          <Campo label="Cuando pasa el chat a una persona" ayuda="Se usa cuando la IA necesita que alguien del equipo intervenga.">
            <textarea
              value={p.mensajeDerivacion ?? ''}
              onChange={(e) => setP({ mensajeDerivacion: e.target.value })}
              rows={2}
              placeholder="Para atenderte mejor, te paso con una persona del equipo. Te escribe en un momento 🙌"
              className={`${inputBase} resize-y leading-relaxed`}
            />
          </Campo>
        </Seccion>

        <Seccion
          icon="solar:hand-shake-linear"
          titulo="Mensaje de despedida"
          descripcion="Se manda una vez, tal cual lo escribas, cuando la conversación termina."
        >
          <Interruptor
            activo={b.despedida.activa}
            onChange={(activa) => set((x) => ({ ...x, despedida: { ...x.despedida, activa } }))}
            label="Despedirse al cerrar la conversación"
            ayuda="Venta cerrada, cuando dice que lo consultará (con su médico o su familia), o si no contesta el seguimiento en 2 horas."
          />
          <Campo
            label="Texto de la despedida"
            ayuda="Pon aquí tus redes y el link de tu catálogo. Solo sale dentro de las 24 h desde el último mensaje del cliente."
            contador={{ actual: b.despedida.texto.length, max: 1000 }}
          >
            <textarea
              value={b.despedida.texto}
              onChange={(e) => set((x) => ({ ...x, despedida: { ...x.despedida, texto: e.target.value } }))}
              rows={6}
              placeholder={`¡Un gusto ayudarte! Quedamos a tu disposición 😊\n\nGuarda nuestro número para no perderte nuestras promos y mira nuestro catálogo:\n👉 https://…`}
              className={`${inputBase} resize-y leading-relaxed`}
            />
          </Campo>
        </Seccion>
      </div>

      <div className="xl:sticky xl:top-4 xl:self-start">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-gray-400">Así saluda tu vendedor</p>
        <VistaPrevia negocio={negocio} b={b} />
      </div>
    </div>
  )
}

// ─── Conocimiento ───────────────────────────────────────────────────────────

const CATEGORIAS: { id: CategoriaConocimiento; label: string; icon: string }[] = [
  { id: 'PRODUCTOS', label: 'Productos', icon: 'solar:box-linear' },
  { id: 'HORARIOS', label: 'Horarios', icon: 'solar:clock-circle-linear' },
  { id: 'ENVIOS', label: 'Envíos', icon: 'solar:delivery-linear' },
  { id: 'PAGOS', label: 'Pagos', icon: 'solar:card-linear' },
  { id: 'DEVOLUCIONES', label: 'Devoluciones', icon: 'solar:restart-linear' },
  { id: 'OTROS', label: 'Otros', icon: 'solar:question-circle-linear' },
]
const metaCategoria = (c: CategoriaConocimiento) => CATEGORIAS.find((x) => x.id === c) ?? CATEGORIAS[5]

const TEMA_VACIO: TemaConocimiento = { categoria: 'OTROS', titulo: '', texto: '' }

function EditorTema({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial: TemaConocimiento
  onGuardar: (t: TemaConocimiento) => void
  onCancelar: () => void
}) {
  const [t, setT] = useState(inicial)
  const listo = t.titulo.trim() && t.texto.trim()
  return (
    <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-800/50 dark:bg-emerald-900/10">
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setT({ ...t, categoria: c.id })}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${
              t.categoria === c.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-gray-300'
            }`}
          >
            <Icon icon={c.icon} width={13} />
            {c.label}
          </button>
        ))}
      </div>
      <input
        value={t.titulo}
        onChange={(e) => setT({ ...t, titulo: e.target.value })}
        maxLength={80}
        placeholder="Título (ej. Horario de atención)"
        className={inputBase}
        autoFocus
      />
      <textarea
        value={t.texto}
        onChange={(e) => setT({ ...t, texto: e.target.value })}
        rows={4}
        placeholder="Ej. Atendemos de lunes a sábado de 9am a 8pm. Domingos solo por WhatsApp."
        className={`${inputBase} resize-y leading-relaxed`}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-xl px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!listo}
          onClick={() => onGuardar({ ...t, titulo: t.titulo.trim(), texto: t.texto.trim() })}
          className="rounded-xl bg-gray-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-black disabled:opacity-40 dark:bg-white dark:text-gray-900"
        >
          Listo
        </button>
      </div>
    </div>
  )
}

function TextoGeneral({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  // Plegado por defecto: lo principal son los temas. Quien ya tiene su
  // información escrita (como Hierba Sana) la abre y la ve completa.
  const [abierto, setAbierto] = useState(false)
  const palabras = valor.trim() ? valor.trim().split(/\s+/).length : 0
  const insertar = (snippet: string) => {
    const base = valor.replace(/\s+$/, '')
    onChange((base ? base + '\n\n' : '') + snippet)
  }
  return (
    <div className="rounded-2xl border border-gray-200/80 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300">
          <Icon icon="solar:document-text-linear" width={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-gray-900 dark:text-white">Texto general</span>
          <span className="block truncate text-[12.5px] text-gray-500 dark:text-gray-400">
            {palabras
              ? `${palabras.toLocaleString('es-PE')} palabras · ${valor.trim().slice(0, 90)}…`
              : '¿Ya tienes tu información escrita? Pégala aquí: guiones, respuestas oficiales, políticas.'}
          </span>
        </span>
        <Icon
          icon="solar:alt-arrow-down-linear"
          width={18}
          className={`flex-none text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </button>
      {abierto && (
        <div className="space-y-2 border-t border-gray-100 px-4 pb-4 pt-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            {SECCIONES_CONTEXTO.map((sec) => (
              <button
                key={sec.label}
                type="button"
                onClick={() => insertar(sec.snippet)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[12px] font-medium text-gray-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300"
              >
                <Icon icon={sec.icon} width={13} /> {sec.label}
              </button>
            ))}
          </div>
          <textarea
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            rows={14}
            placeholder="Ej. Somos una tienda de productos naturales en La Merced. Delivery en Lima en 24 horas…"
            className={`${inputBase} max-h-[560px] min-h-[220px] resize-y leading-relaxed`}
          />
          <div className="flex items-center justify-between">
            {!valor.trim() ? (
              <button
                type="button"
                onClick={() => onChange(PLANTILLA_CONTEXTO)}
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <Icon icon="solar:magic-stick-3-linear" width={14} /> Usar plantilla sugerida
              </button>
            ) : (
              <span />
            )}
            <span className="text-[11.5px] tabular-nums text-gray-400">
              {palabras.toLocaleString('es-PE')} palabras · {valor.length.toLocaleString('es-PE')} caracteres
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function TabConocimiento({ b, set, vm }: { b: Borrador; set: (fn: (b: Borrador) => Borrador) => void; vm: Vm }) {
  const temas = b.vendedor.conocimiento ?? []
  const [filtro, setFiltro] = useState<CategoriaConocimiento | 'TODAS'>('TODAS')
  // null = cerrado; -1 = tema nuevo; n = editando el tema n.
  const [editando, setEditando] = useState<number | null>(null)

  // Los documentos de entrenamiento se cargan al entrar a la pestaña.
  useEffect(() => {
    void vm.actions.abrirEntrenar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setTemas = (t: TemaConocimiento[]) =>
    set((x) => ({ ...x, vendedor: { ...x.vendedor, conocimiento: t } }))
  const visibles = temas
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => filtro === 'TODAS' || t.categoria === filtro)

  return (
    <div className="space-y-5">
      <div className="grid gap-2 rounded-2xl bg-white p-4 text-[12.5px] text-gray-600 shadow-[0_1px_2px_rgba(16,24,40,.04)] sm:grid-cols-3 dark:bg-[#111827] dark:text-gray-300">
        {[
          { icon: 'solar:notebook-bookmark-linear', t: 'Temas', d: 'datos puntuales: horarios, cambios, promociones.' },
          { icon: 'solar:document-text-linear', t: 'Texto general', d: 'guiones y respuestas que ya tienes escritas.' },
          { icon: 'solar:document-add-linear', t: 'Documentos', d: 'material largo: catálogos, PDFs o tu web.' },
        ].map((x) => (
          <p key={x.t} className="flex items-start gap-2">
            <Icon icon={x.icon} width={16} className="mt-0.5 flex-none text-emerald-600" />
            <span>
              <b className="text-gray-900 dark:text-white">{x.t}</b> para {x.d}
            </span>
          </p>
        ))}
      </div>

      <Seccion
        icon="solar:notebook-bookmark-linear"
        titulo="Temas"
        descripcion="Lo que tu vendedor necesita saber. No lo copia tal cual: lo usa para responder lo que pregunten."
        accion={
          <button
            type="button"
            onClick={() => setEditando(-1)}
            className="inline-flex flex-none items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-black dark:bg-white dark:text-gray-900"
          >
            <Icon icon="solar:add-circle-linear" width={16} />
            Agregar tema
          </button>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {[{ id: 'TODAS' as const, label: 'Todas', icon: 'solar:widget-linear' }, ...CATEGORIAS].map((c) => {
            const n = c.id === 'TODAS' ? temas.length : temas.filter((t) => t.categoria === c.id).length
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFiltro(c.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  filtro === c.id
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300'
                }`}
              >
                <Icon icon={c.icon} width={14} />
                {c.label}
                {n > 0 && <span className="tabular-nums opacity-60">{n}</span>}
              </button>
            )
          })}
        </div>

        {editando === -1 && (
          <EditorTema
            inicial={{ ...TEMA_VACIO, categoria: filtro === 'TODAS' ? 'OTROS' : filtro }}
            onCancelar={() => setEditando(null)}
            onGuardar={(t) => {
              setTemas([...temas, t])
              setEditando(null)
            }}
          />
        )}

        {visibles.length === 0 && editando !== -1 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center dark:border-slate-700">
            <Icon icon="solar:notebook-minimalistic-linear" width={30} className="text-gray-300" />
            <p className="text-[13.5px] font-semibold text-gray-700 dark:text-gray-200">Todavía no hay temas aquí</p>
            <p className="max-w-md text-[12.5px] text-gray-500 dark:text-gray-400">
              Agrega tus horarios, cómo funcionan los cambios y devoluciones, promociones o las preguntas que más te hacen.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visibles.map(({ t, i }) =>
              editando === i ? (
                <div key={i} className="md:col-span-2">
                  <EditorTema
                    inicial={t}
                    onCancelar={() => setEditando(null)}
                    onGuardar={(nuevo) => {
                      setTemas(temas.map((x, j) => (j === i ? nuevo : x)))
                      setEditando(null)
                    }}
                  />
                </div>
              ) : (
                <article
                  key={i}
                  className="group rounded-2xl border border-gray-200/80 p-4 transition hover:border-gray-300 hover:shadow-sm dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">{t.titulo}</h4>
                    <div className="flex gap-0.5 opacity-60 transition group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="Editar tema"
                        onClick={() => setEditando(i)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                      >
                        <Icon icon="solar:pen-linear" width={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Quitar tema"
                        onClick={() => setTemas(temas.filter((_, j) => j !== i))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                      >
                        <Icon icon="solar:trash-bin-minimalistic-linear" width={15} />
                      </button>
                    </div>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                    <Icon icon={metaCategoria(t.categoria).icon} width={12} />
                    {metaCategoria(t.categoria).label}
                  </span>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
                    {t.texto}
                  </p>
                </article>
              ),
            )}
          </div>
        )}
      </Seccion>

      <TextoGeneral valor={b.contexto} onChange={(v) => set((x) => ({ ...x, contexto: v }))} />

      <Seccion
        icon="solar:document-add-linear"
        titulo="Documentos y páginas web"
        descripcion="Sube textos largos o el enlace de tu web: la IA busca ahí lo que le pregunten. Se guardan al instante."
      >
        <EntrenarPanel vm={vm} />
      </Seccion>

      <Seccion
        icon="solar:gallery-send-linear"
        titulo="Material que envía"
        descripcion="Un PDF o imagen (brochure, catálogo, carta) que la IA manda cuando el cliente pide más información."
      >
        <Campo label="Enlace del brochure o catálogo">
          <input
            type="url"
            value={b.brochure}
            onChange={(e) => set((x) => ({ ...x, brochure: e.target.value }))}
            placeholder="https://tuweb.com/catalogo.pdf"
            className={inputBase}
          />
        </Campo>
      </Seccion>
    </div>
  )
}

// ─── Entrega ────────────────────────────────────────────────────────────────

const TIPOS_ZONA: { id: TipoZona; label: string; icon: string }[] = [
  { id: 'DOMICILIO', label: 'A domicilio', icon: 'solar:home-2-linear' },
  { id: 'AGENCIA', label: 'A agencia', icon: 'solar:shop-2-linear' },
  { id: 'RECOJO', label: 'Recojo en tienda', icon: 'solar:bag-4-linear' },
]

const COURIERS: { id: string; label: string }[] = [
  { id: '', label: 'Sin courier' },
  { id: 'PROPIOS', label: 'Reparto propio' },
  { id: 'SHALOM_PRO', label: 'Shalom' },
  { id: 'SHALOM_COD', label: 'Shalom contraentrega' },
  { id: 'OLVA', label: 'Olva' },
  { id: 'URBANO', label: 'Urbano' },
  { id: 'CRUZ_SUR', label: 'Cruz del Sur' },
  { id: 'OTRO', label: 'Otro' },
]

function TarjetaZona({
  z,
  porDefecto,
  onChange,
  onQuitar,
  onPorDefecto,
}: {
  z: ZonaEnvio
  porDefecto: boolean
  onChange: (z: ZonaEnvio) => void
  onQuitar: () => void
  onPorDefecto: () => void
}) {
  const nombres = (z.lugares ?? []).map((l) => l.nombre)
  // Los alias se cargaron a mano y el panel no los muestra: al cambiar la
  // lista se conservan los de cada lugar que sigue estando.
  const setNombres = (lista: string[]) => {
    const previo = new Map((z.lugares ?? []).map((l) => [l.nombre.toLowerCase(), l]))
    onChange({ ...z, lugares: lista.map((n) => previo.get(n.toLowerCase()) ?? { nombre: n }) })
  }
  return (
    <div className="rounded-2xl border border-gray-200/80 p-4 sm:p-5 dark:border-slate-700">
      <div className="mb-4 flex items-center justify-between gap-2">
        <input
          value={z.nombre}
          onChange={(e) => onChange({ ...z, nombre: e.target.value })}
          placeholder="Nombre de la zona (ej. Lima Metropolitana)"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] font-bold text-gray-900 outline-none placeholder:font-medium placeholder:text-gray-400 dark:text-white"
        />
        <button
          type="button"
          aria-label="Quitar zona"
          onClick={onQuitar}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
        >
          <Icon icon="solar:trash-bin-minimalistic-linear" width={17} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_160px_200px]">
        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-gray-800 dark:text-gray-200">Cómo llega</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
            {TIPOS_ZONA.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ ...z, tipo: t.id })}
                aria-pressed={z.tipo === t.id}
                className={`flex items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11.5px] font-semibold transition ${
                  z.tipo === t.id
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                <Icon icon={t.icon} width={14} className="hidden sm:block" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <Campo label="Costo de envío">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">S/</span>
            <input
              type="number"
              min={0}
              step="0.5"
              inputMode="decimal"
              value={Number.isFinite(z.tarifa) ? z.tarifa : 0}
              onChange={(e) => onChange({ ...z, tarifa: Math.max(0, Number(e.target.value) || 0) })}
              className={`${inputBase} pl-9 tabular-nums`}
            />
          </div>
        </Campo>
        <Campo label="Courier">
          <select
            value={z.courier ?? ''}
            onChange={(e) => onChange({ ...z, courier: e.target.value || undefined })}
            className={inputBase}
          >
            {COURIERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="mt-4 space-y-4">
        <Campo
          label="Distritos o ciudades que cubre"
          ayuda="Presiona Enter o pega la lista separada por comas. Puedes copiarla de Google."
        >
          <Etiquetas valores={nombres} onChange={setNombres} placeholder="Miraflores, San Isidro, Surco…" max={300} />
        </Campo>
        <Campo label="Cómo se paga en esta zona" ayuda="Lo que la IA le dice al cliente. Ej. adelanto del 50% y el resto contraentrega.">
          <input
            value={z.notaPago ?? ''}
            onChange={(e) => onChange({ ...z, notaPago: e.target.value })}
            placeholder="Ej. Pago adelantado por Yape o transferencia"
            className={inputBase}
          />
        </Campo>
        <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-gray-700 dark:text-gray-300">
          <input
            type="radio"
            checked={porDefecto}
            onChange={onPorDefecto}
            className="h-4 w-4 accent-emerald-600"
          />
          Usar esta zona cuando el destino no esté en ninguna lista
        </label>
      </div>
    </div>
  )
}

function TabEntrega({ b, set }: { b: Borrador; set: (fn: (b: Borrador) => Borrador) => void }) {
  const { zonas, zonaPorDefecto } = b.envio
  const setEnvio = (e: ConfigEnvio) => set((x) => ({ ...x, envio: e }))
  return (
    <Seccion
      icon="solar:delivery-linear"
      titulo="Zonas de entrega"
      descripcion="Con esto tu vendedor cotiza el envío y sabe qué datos pedir. Sin zonas, pasa el chat a una persona."
      accion={
        <button
          type="button"
          onClick={() =>
            setEnvio({
              zonas: [...zonas, { nombre: '', tipo: 'DOMICILIO', tarifa: 0 }],
              zonaPorDefecto,
            })
          }
          className="inline-flex flex-none items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-black dark:bg-white dark:text-gray-900"
        >
          <Icon icon="solar:add-circle-linear" width={16} />
          Agregar zona
        </button>
      }
    >
      {zonas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center dark:border-slate-700">
          <Icon icon="solar:map-point-wave-linear" width={30} className="text-gray-300" />
          <p className="text-[13.5px] font-semibold text-gray-700 dark:text-gray-200">Aún no tienes zonas</p>
          <p className="max-w-md text-[12.5px] text-gray-500 dark:text-gray-400">
            Ej. "Lima Metropolitana" a domicilio por S/ 10 y "Provincia" a agencia Shalom por S/ 15.
          </p>
        </div>
      ) : (
        zonas.map((z, i) => (
          <TarjetaZona
            key={i}
            z={z}
            porDefecto={!!z.nombre && z.nombre === zonaPorDefecto}
            onChange={(nueva) =>
              setEnvio({
                zonas: zonas.map((x, j) => (j === i ? nueva : x)),
                // Renombrar la zona por defecto no la deja huérfana.
                zonaPorDefecto: zonaPorDefecto === z.nombre ? nueva.nombre : zonaPorDefecto,
              })
            }
            onQuitar={() =>
              setEnvio({
                zonas: zonas.filter((_, j) => j !== i),
                zonaPorDefecto: zonaPorDefecto === z.nombre ? '' : zonaPorDefecto,
              })
            }
            onPorDefecto={() => setEnvio({ zonas, zonaPorDefecto: z.nombre })}
          />
        ))
      )}
    </Seccion>
  )
}

// ─── Pagos ──────────────────────────────────────────────────────────────────

const METODOS_RAPIDOS = ['Yape', 'Plin', 'BCP', 'Interbank', 'BBVA', 'Scotiabank']

function TabPagos({
  b,
  set,
  irAAjustes,
  cobroConLink,
}: {
  b: Borrador
  set: (fn: (b: Borrador) => Borrador) => void
  irAAjustes: () => void
  cobroConLink: boolean
}) {
  const medios = b.medios
  const setMedios = (m: MedioPago[]) => set((x) => ({ ...x, medios: m }))
  const vista = medios
    .filter((m) => m.nombre.trim() && m.detalle.trim())
    .map((m) => `${m.nombre}: ${m.detalle}${m.titular?.trim() ? ` (titular: ${m.titular.trim()})` : ''}`)

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Seccion
        icon="solar:card-linear"
        titulo="Métodos de pago"
        descripcion="Los datos que tu vendedor da para pagar un pedido."
        accion={
          <button
            type="button"
            onClick={() => setMedios([...medios, { nombre: '', detalle: '' }])}
            className="inline-flex flex-none items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-black dark:bg-white dark:text-gray-900"
          >
            <Icon icon="solar:add-circle-linear" width={16} />
            Agregar
          </button>
        }
      >
        {medios.length === 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-gray-200 px-5 py-6 dark:border-slate-700">
            <span className="text-[13px] text-gray-500 dark:text-gray-400">Empieza con:</span>
            {METODOS_RAPIDOS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMedios([{ nombre: m, detalle: '' }])}
                className="rounded-full border border-gray-200 px-3 py-1 text-[12.5px] font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:text-gray-200"
              >
                {m}
              </button>
            ))}
          </div>
        )}
        {medios.map((m, i) => {
          const cambiar = (c: Partial<MedioPago>) => setMedios(medios.map((x, j) => (j === i ? { ...x, ...c } : x)))
          return (
            <div key={i} className="grid gap-3 rounded-2xl border border-gray-200/80 p-4 md:grid-cols-[150px_1fr_1fr_auto] md:items-end dark:border-slate-700">
              <Campo label="Método">
                <input
                  value={m.nombre}
                  onChange={(e) => cambiar({ nombre: e.target.value })}
                  list="krz-metodos-pago"
                  placeholder="Yape"
                  className={inputBase}
                />
              </Campo>
              <Campo label="Número o cuenta">
                <input
                  value={m.detalle}
                  onChange={(e) => cambiar({ detalle: e.target.value })}
                  placeholder="987 654 321"
                  className={`${inputBase} tabular-nums`}
                />
              </Campo>
              <Campo label="A nombre de">
                <input
                  value={m.titular ?? ''}
                  onChange={(e) => cambiar({ titular: e.target.value })}
                  placeholder="Nombre del titular"
                  className={inputBase}
                />
              </Campo>
              <button
                type="button"
                aria-label="Quitar método"
                onClick={() => setMedios(medios.filter((_, j) => j !== i))}
                className="flex h-[46px] w-[46px] items-center justify-center rounded-xl text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
              >
                <Icon icon="solar:trash-bin-minimalistic-linear" width={17} />
              </button>
            </div>
          )
        })}
        <datalist id="krz-metodos-pago">
          {METODOS_RAPIDOS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[12.5px] text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <Icon icon="solar:shield-check-linear" width={16} className="mt-0.5 flex-none" />
          Pon siempre el nombre del titular: el cliente lo compara antes de pagar y el sistema lo usa para revisar los
          comprobantes que te envían.
        </p>
      </Seccion>

      <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <div className="rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-gray-400">Vista previa</p>
          {vista.length ? (
            <div className="rounded-2xl rounded-bl-md bg-[#F4F1EC] px-3.5 py-3 text-[13px] leading-relaxed text-gray-800 dark:bg-slate-800 dark:text-gray-100">
              Puedes pagar por:
              {vista.map((v) => (
                <span key={v} className="block">
                  • {v}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-gray-500 dark:text-gray-400">Agrega un método para ver cómo lo recibe el cliente.</p>
          )}
        </div>
        <button
          type="button"
          onClick={irAAjustes}
          className="flex w-full items-center gap-3 rounded-2xl border border-gray-200/70 bg-white p-4 text-left transition hover:border-gray-300 dark:border-slate-800 dark:bg-[#111827]"
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/30">
            <Icon icon="simple-icons:mercadopago" width={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold text-gray-900 dark:text-white">Link de pago con tarjeta</span>
            <span className="block text-[12px] text-gray-500 dark:text-gray-400">
              {cobroConLink ? 'Activado: la IA envía el link de Mercado Pago' : 'Actívalo en Ajustes'}
            </span>
          </span>
          <Icon icon="solar:alt-arrow-right-linear" width={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  )
}

// ─── La página ──────────────────────────────────────────────────────────────

export function MiVendedorPanel({ vm, negocio }: { vm: Vm; negocio: string }) {
  const [params, setParams] = useSearchParams()
  const pestana = (PESTANAS.find((p) => p.id === params.get('tab'))?.id ?? 'personalidad') as Pestana
  const irA = (id: Pestana) => setParams(id === 'personalidad' ? {} : { tab: id }, { replace: true })

  // El servidor de antes no devuelve `vendedor`: la pantalla se ve pero no se
  // guarda, para no mandar campos que se perderían.
  const soportado = vm.configCargada && vm.config.vendedor !== undefined
  const original = useMemo(() => borradorDe(vm.config), [vm.config])
  const [b, setB] = useState<Borrador>(original)
  useEffect(() => setB(original), [original])
  const sucio = JSON.stringify(b) !== JSON.stringify(original)
  const { contexto: _c, brochure: _b, ...nuevos } = b
  const { contexto: _oc, brochure: _ob, ...nuevosOriginal } = original
  // Con el servidor de antes solo se pueden guardar el texto general y el
  // brochure; si se tocó algo más, no se guarda para no perderlo en silencio.
  const tocoLoNuevo = JSON.stringify(nuevos) !== JSON.stringify(nuevosOriginal)
  const puedeGuardar = sucio && (soportado || !tocoLoNuevo)
  const set = (fn: (b: Borrador) => Borrador) => setB(fn)

  // Solo se manda lo que cambió. Antes se reenviaba todo y, al guardar el
  // nombre del vendedor, también se reescribían envíos y pagos que nadie tocó
  // (los medios de pago escritos como un solo texto podían quedar cortados).
  const guardar = () => {
    const distinto = (x: unknown, y: unknown) => JSON.stringify(x) !== JSON.stringify(y)
    const cambios: Partial<LeadsConfig> = {}
    if (b.contexto !== original.contexto) cambios.iaVentasContexto = b.contexto
    if (b.brochure !== original.brochure) cambios.iaVentasBrochureUrl = b.brochure.trim()
    if (soportado) {
      if (b.asesor !== original.asesor) cambios.asesor = b.asesor.trim()
      if (distinto(b.vendedor, original.vendedor)) cambios.vendedor = b.vendedor
      if (distinto(b.envio, original.envio)) {
        cambios.envio = {
          zonas: b.envio.zonas.filter((z) => z.nombre.trim()),
          zonaPorDefecto: b.envio.zonaPorDefecto,
        }
      }
      if (distinto(b.medios, original.medios)) {
        cambios.mediosPagoLista = b.medios.filter((m) => m.nombre.trim() && m.detalle.trim())
      }
      if (distinto(b.despedida, original.despedida)) cambios.despedida = b.despedida
    }
    return vm.actions.guardarConfig(cambios)
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-20 -mx-2 flex flex-wrap items-center justify-between gap-3 bg-[#F7F8FA]/90 px-2 py-2 backdrop-blur dark:bg-[#0A0D14]/90">
        <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-[0_1px_2px_rgba(16,24,40,.06)] dark:bg-[#111827]" aria-label="Secciones de Mi vendedor">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => irA(p.id)}
              aria-current={pestana === p.id ? 'page' : undefined}
              className={`flex flex-none items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13.5px] font-semibold transition ${
                pestana === p.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-slate-800'
              }`}
            >
              <Icon icon={p.icon} width={17} />
              {p.label}
            </button>
          ))}
        </nav>
        {pestana !== 'ajustes' && (
          <div className="flex items-center gap-3">
            {sucio && (
              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Cambios sin guardar
              </span>
            )}
            {sucio && (
              <button
                type="button"
                onClick={() => setB(original)}
                className="rounded-xl px-3 py-2 text-[13px] font-semibold text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-slate-800"
              >
                Descartar
              </button>
            )}
            <button
              type="button"
              onClick={guardar}
              disabled={!puedeGuardar}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gray-900 px-4 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-gray-900"
            >
              <Icon icon={sucio ? 'solar:diskette-linear' : 'solar:check-circle-linear'} width={17} />
              {sucio ? 'Guardar cambios' : 'Guardado'}
            </button>
          </div>
        )}
      </div>

      {vm.configCargada && !soportado && pestana !== 'ajustes' && (
        <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] text-sky-800 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-200">
          <Icon icon="solar:info-circle-linear" width={18} className="mt-0.5 flex-none" />
          <span>
            Personalidad, temas, entrega y pagos se activan con la próxima actualización del sistema. Mientras tanto
            ya puedes editar y guardar el texto general y el material que envía (en Conocimiento), y los interruptores
            en{' '}
            <button type="button" onClick={() => irA('ajustes')} className="font-semibold underline">
              Ajustes
            </button>
            .
          </span>
        </div>
      )}

      {pestana === 'personalidad' && <TabPersonalidad b={b} set={set} negocio={negocio} />}
      {pestana === 'conocimiento' && <TabConocimiento b={b} set={set} vm={vm} />}
      {pestana === 'entrega' && <TabEntrega b={b} set={set} />}
      {pestana === 'pagos' && (
        <TabPagos b={b} set={set} irAAjustes={() => irA('ajustes')} cobroConLink={!!vm.config.cobroConLink} />
      )}
      {pestana === 'ajustes' && (
        <Seccion
          icon="solar:tuning-2-linear"
          titulo="Ajustes de la IA"
          descripcion="Encender la IA, seguimientos, cotizaciones y link de pago. Lo que la IA sabe está en Conocimiento."
        >
          <ConfigForm initial={vm.config} onSave={vm.actions.guardarConfig} onToggle={vm.actions.toggleIaVentas} />
        </Seccion>
      )}
    </div>
  )
}
