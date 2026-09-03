import { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { format, isSameDay, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import Button from '@/components/Button'
import InputPro from '@/components/InputPro'
import Modal from '@/components/Modal'
import { useLeadsViewModel } from './useLeadsViewModel'
import {
  ESTADOS_KANBAN,
  ESTADO_META,
  colorPuntaje,
  nombreVisible,
  iniciales,
} from './LeadsModel'
import type {
  LeadProspecto,
  LeadDocumento,
  TipoLeadDocumento,
} from '@/services/leads.service'

export default function LeadsView() {
  const vm = useLeadsViewModel()

  return (
    <div className="min-h-screen px-2 pb-4 dark:bg-[#0A0D14]">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            IA de Ventas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tu asesor por WhatsApp califica prospectos con BANT y te avisa cuando están calientes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SwitchIa
            activa={vm.config.iaVentasActiva}
            onChange={vm.actions.toggleIaVentas}
          />
          <Button
            color="secondary"
            onClick={() => vm.actions.abrirEntrenar()}
            className="flex items-center gap-2"
          >
            <Icon icon="solar:book-bold-duotone" className="text-lg" />
            Entrenar IA
          </Button>
          <Button
            color="secondary"
            onClick={() => vm.setConfigOpen(true)}
            className="flex items-center gap-2"
          >
            <Icon icon="solar:settings-bold-duotone" className="text-lg" />
            Configurar IA
          </Button>
        </div>
      </div>

      {/* Aviso si la IA está apagada */}
      {!vm.config.iaVentasActiva && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          <Icon icon="solar:info-circle-bold" className="mt-0.5 text-lg" />
          <span>
            La IA está <b>desactivada</b>: se guardan los mensajes entrantes pero el bot no
            responde. Actívala arriba cuando quieras que empiece a atender y calificar.
          </span>
        </div>
      )}

      {/* Resumen por estado */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ESTADOS_KANBAN.map((estado) => {
          const meta = ESTADO_META[estado]
          return (
            <div
              key={estado}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111827]"
            >
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.badge}`}>
                  <Icon icon={meta.icon} width={18} />
                </span>
                <span className={`text-xs font-semibold uppercase tracking-wide ${meta.header}`}>
                  {meta.label}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {vm.resumen[estado] ?? 0}
              </p>
            </div>
          )
        })}
      </div>

      {/* Búsqueda */}
      <div className="mb-4 max-w-md">
        <InputPro
          name="search"
          placeholder="Buscar por nombre o teléfono..."
          value={vm.search}
          onChange={(e) => vm.setSearch(e.target.value)}
        />
      </div>

      {/* Kanban */}
      {vm.isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Icon icon="svg-spinners:180-ring" width={32} />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ESTADOS_KANBAN.map((estado) => {
            const meta = ESTADO_META[estado]
            const items = vm.porEstado(estado)
            return (
              <div key={estado} className="flex w-72 flex-none flex-col">
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <span className={`text-sm font-semibold ${meta.header}`}>
                      {meta.label}
                    </span>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-xs text-gray-400 dark:border-slate-800">
                      Sin prospectos
                    </div>
                  )}
                  {items.map((p) => (
                    <ProspectoCard
                      key={p.id}
                      p={p}
                      onClick={() => vm.actions.abrirConversacion(p.conversacionId)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Drawer de conversación */}
      <Modal
        isOpenModal={!!vm.conversacion || vm.loadingConversacion}
        closeModal={vm.actions.cerrarConversacion}
        position="right"
        width="440px"
        title="Conversación"
      >
        <ChatPanel vm={vm} />
      </Modal>

      {/* Modal de configuración */}
      <Modal
        isOpenModal={vm.configOpen}
        closeModal={() => vm.setConfigOpen(false)}
        title="Configurar IA de Ventas"
        width="560px"
        height="auto"
      >
        <ConfigForm
          initial={vm.config}
          onSave={vm.actions.guardarConfig}
          onToggle={vm.actions.toggleIaVentas}
        />
      </Modal>

      {/* Modal de entrenamiento (RAG) */}
      <Modal
        isOpenModal={vm.entrenarOpen}
        closeModal={() => vm.setEntrenarOpen(false)}
        title="Entrenar la IA"
        width="600px"
        height="auto"
      >
        <EntrenarPanel vm={vm} />
      </Modal>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SwitchIa({
  activa,
  onChange,
}: {
  activa: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!activa)}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        activa
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300'
          : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400'
      }`}
    >
      <span
        className={`relative h-4 w-7 rounded-full transition ${
          activa ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
            activa ? 'left-3.5' : 'left-0.5'
          }`}
        />
      </span>
      {activa ? 'IA activa' : 'IA apagada'}
    </button>
  )
}

function ProspectoCard({
  p,
  onClick,
}: {
  p: LeadProspecto
  onClick: () => void
}) {
  const meta = ESTADO_META[p.estado]
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md dark:border-slate-800 dark:bg-[#111827] dark:hover:border-violet-900/50"
    >
      <div className="flex items-start gap-2.5">
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg text-xs font-bold ${meta.badge}`}>
          {iniciales(p.nombreProspecto, p.telefonoProspecto)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
            {nombreVisible(p.nombreProspecto, p.telefonoProspecto)}
          </p>
          <p className="truncate text-xs text-gray-400">{p.telefonoProspecto}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-sm font-extrabold ${colorPuntaje(p.puntaje)}`}>
            {p.puntaje}
          </span>
          <span className="text-[10px] text-gray-400">score</span>
        </div>
      </div>
      {p.resumen && (
        <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
          {p.resumen}
        </p>
      )}
      {!p.botActivo && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          <Icon icon="solar:pause-bold" width={11} /> IA pausada
        </span>
      )}
    </button>
  )
}

function ChatPanel({ vm }: { vm: ReturnType<typeof useLeadsViewModel> }) {
  const conv = vm.conversacion
  if (vm.loadingConversacion && !conv) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Icon icon="svg-spinners:180-ring" width={28} />
      </div>
    )
  }
  if (!conv) return null
  const prospecto = conv.prospecto
  const botActivo = prospecto?.botActivo ?? true

  const meta = prospecto ? ESTADO_META[prospecto.estado] : null
  const headerTint =
    (prospecto && HEADER_TINT[prospecto.estado]) || 'from-gray-50 dark:from-slate-800/30'

  return (
    <div className="flex h-full flex-col px-4">
      {/* Cabecera del prospecto */}
      <div className="border-b border-gray-100 pb-3 pt-1 dark:border-slate-800">
        <div className={`rounded-2xl bg-gradient-to-b ${headerTint} to-transparent p-3`}>
          <div className="flex items-start gap-3">
            <span className="relative flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-sm font-bold text-white shadow-md ring-2 ring-white dark:ring-[#111827]">
              {iniciales(conv.nombreProspecto, conv.telefonoProspecto)}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-white dark:ring-[#111827]">
                <Icon icon="mdi:whatsapp" width={10} className="text-white" />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold leading-tight text-gray-900 dark:text-white">
                {nombreVisible(conv.nombreProspecto, conv.telefonoProspecto)}
              </p>
              <p className="mt-0.5 truncate text-xs text-gray-400">{conv.telefonoProspecto}</p>
              {meta && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}
                  >
                    <Icon icon={meta.icon} width={11} />
                    {meta.label}
                  </span>
                  {!botActivo && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                      <Icon icon="solar:pause-bold" width={10} /> IA en pausa
                    </span>
                  )}
                </div>
              )}
            </div>
            {prospecto && (
              <div className="flex flex-none flex-col items-center gap-0.5">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm ${colorPuntaje(prospecto.puntaje)}`}
                  style={{
                    background: `conic-gradient(currentColor ${(prospecto.puntaje / 100) * 360}deg, rgba(148,163,184,0.16) 0deg)`,
                  }}
                >
                  <span className="flex h-[38px] w-[38px] flex-col items-center justify-center rounded-full bg-white dark:bg-[#111827]">
                    <span className="text-sm font-extrabold leading-none">{prospecto.puntaje}</span>
                    <span className="text-[7px] font-bold uppercase tracking-wider text-gray-400">BANT</span>
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {prospecto && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            <BantBar label="Presup." valor={prospecto.presupuesto} max={30} />
            <BantBar label="Autoridad" valor={prospecto.autoridad} max={20} />
            <BantBar label="Necesidad" valor={prospecto.necesidad} max={25} />
            <BantBar label="Plazo" valor={prospecto.plazo} max={25} />
          </div>
        )}

        {prospecto && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => vm.actions.toggleBot(prospecto.id, !botActivo)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold transition ${
                botActivo
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
              }`}
            >
              <Icon icon={botActivo ? 'solar:pause-bold' : 'solar:play-bold'} width={15} />
              {botActivo ? 'Tomar el chat' : 'Reactivar IA'}
            </button>
            {prospecto.estado === 'CONVERTIDO' || prospecto.clienteId ? (
              <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-[13px] font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                <Icon icon="solar:user-check-bold" width={15} />
                Ya es cliente
              </div>
            ) : (
              <button
                type="button"
                onClick={() => vm.actions.convertirCliente(prospecto.id)}
                disabled={vm.convirtiendo}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
              >
                <Icon icon="solar:user-plus-bold" width={15} />
                {vm.convirtiendo ? 'Convirtiendo…' : 'Convertir a cliente'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mensajes — estilo chat */}
      <div className="-mx-4 flex-1 overflow-y-auto bg-[#f6f7fb] px-5 py-4 dark:bg-[#0b0f17]">
        {conv.mensajes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
            <Icon icon="solar:chat-round-line-linear" width={32} />
            <p className="text-sm">Sin mensajes aún</p>
          </div>
        )}
        {(() => {
          let lastDay: Date | null = null
          let lastRol: string | null = null
          return conv.mensajes.map((m) => {
            const date = new Date(m.creadoEn)
            const esUsuario = m.rol === 'USUARIO'
            const showDay = !lastDay || !isSameDay(date, lastDay)
            const nuevoGrupo = showDay || m.rol !== lastRol
            lastDay = date
            lastRol = m.rol
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-white px-3 py-0.5 text-[11px] font-medium text-gray-500 shadow-sm dark:bg-slate-800 dark:text-gray-400">
                      {etiquetaDia(date)}
                    </span>
                  </div>
                )}
                {nuevoGrupo && !esUsuario && (
                  <div className="mb-1 flex justify-end pr-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-500 dark:text-violet-300">
                      <Icon icon="solar:magic-stick-3-bold" width={11} />
                      Asistente IA
                    </span>
                  </div>
                )}
                <div className={`flex items-end gap-2 ${nuevoGrupo ? 'mt-1' : 'mt-0.5'} ${esUsuario ? 'justify-start' : 'justify-end'}`}>
                  {esUsuario &&
                    (nuevoGrupo ? (
                      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gray-300 text-[9px] font-bold text-white dark:bg-slate-600">
                        {iniciales(conv.nombreProspecto, conv.telefonoProspecto)}
                      </span>
                    ) : (
                      <span className="w-6 flex-none" />
                    ))}
                  <div
                    className={`max-w-[74%] px-3 py-2 text-sm shadow-sm ${
                      esUsuario
                        ? `rounded-2xl bg-white text-gray-800 dark:bg-slate-800 dark:text-gray-100 ${nuevoGrupo ? 'rounded-bl-md' : ''}`
                        : `rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 text-white ${nuevoGrupo ? 'rounded-br-md' : ''}`
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.contenido}</p>
                    <span
                      className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        esUsuario ? 'text-gray-400' : 'text-violet-100/80'
                      }`}
                    >
                      {format(date, 'HH:mm')}
                      {!esUsuario && <Icon icon="mdi:check-all" width={13} />}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        })()}
      </div>

      {prospecto?.proximaAccion && (
        <div className="border-t border-gray-100 pt-3 dark:border-slate-800">
          <div className="flex gap-2.5 rounded-xl bg-violet-50 p-3 dark:bg-violet-900/20">
            <Icon
              icon="solar:target-bold-duotone"
              width={18}
              className="mt-0.5 flex-none text-violet-500 dark:text-violet-300"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                Próxima acción recomendada
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                {prospecto.proximaAccion}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const HEADER_TINT: Record<string, string> = {
  FRIO: 'from-sky-50 dark:from-sky-900/10',
  TIBIO: 'from-amber-50 dark:from-amber-900/10',
  CALIENTE: 'from-rose-50 dark:from-rose-900/10',
  CONVERTIDO: 'from-emerald-50 dark:from-emerald-900/10',
  PERDIDO: 'from-gray-50 dark:from-slate-800/30',
}

function etiquetaDia(d: Date): string {
  if (isToday(d)) return 'Hoy'
  if (isYesterday(d)) return 'Ayer'
  return format(d, "d 'de' MMMM", { locale: es })
}

function BantBar({
  label,
  valor,
  max,
}: {
  label: string
  valor: number | null
  max: number
}) {
  const pct = valor != null ? Math.min(100, Math.round((valor / max) * 100)) : 0
  const color =
    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : pct > 0 ? 'bg-orange-500' : 'bg-gray-300'
  return (
    <div className="rounded-lg bg-gray-50 px-2 py-1.5 dark:bg-slate-800/60">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-gray-900 dark:text-white">
          {valor ?? '—'}
          <span className="text-[9px] font-normal text-gray-400">/{max}</span>
        </span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[9px] uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  )
}

function EntrenarPanel({ vm }: { vm: ReturnType<typeof useLeadsViewModel> }) {
  const [tipo, setTipo] = useState<TipoLeadDocumento>('TEXTO')
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [url, setUrl] = useState('')

  const enviar = async () => {
    const ok = await vm.actions.crearDocumento(
      tipo === 'URL'
        ? { tipo, titulo, url }
        : { tipo, titulo, contenido },
    )
    if (ok) {
      setTitulo('')
      setContenido('')
      setUrl('')
    }
  }

  return (
    <div className="space-y-5 p-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Sube tu información de negocio (oferta, precios, FAQs, políticas). La IA la usa
        como conocimiento base para responder mejor y calificar prospectos.
      </p>

      {/* Formulario */}
      <div className="space-y-3 rounded-xl border border-gray-100 p-4 dark:border-slate-800">
        <div className="flex gap-2">
          {(['TEXTO', 'URL'] as TipoLeadDocumento[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                tipo === t
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300'
              }`}
            >
              {t === 'TEXTO' ? 'Texto' : 'Página web (URL)'}
            </button>
          ))}
        </div>

        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título (ej. Lista de precios)"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200"
        />

        {tipo === 'URL' ? (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tu-negocio.com/precios"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200"
          />
        ) : (
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={5}
            placeholder="Pega aquí tu información: productos, precios, condiciones, preguntas frecuentes…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200"
          />
        )}

        <div className="flex justify-end">
          <Button
            color="primary"
            onClick={enviar}
            disabled={vm.guardandoDoc || (tipo === 'URL' ? !url.trim() : !contenido.trim())}
          >
            {vm.guardandoDoc ? 'Entrenando…' : 'Entrenar'}
          </Button>
        </div>
      </div>

      {/* Lista de documentos */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Documentos entrenados
        </p>
        {vm.loadingDocs ? (
          <div className="flex justify-center py-8 text-gray-400">
            <Icon icon="svg-spinners:180-ring" width={24} />
          </div>
        ) : vm.documentos.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            Aún no has entrenado ningún documento.
          </p>
        ) : (
          <div className="space-y-2">
            {vm.documentos.map((d) => (
              <DocRow key={d.id} d={d} onDelete={() => vm.actions.eliminarDocumento(d.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DocRow({ d, onDelete }: { d: LeadDocumento; onDelete: () => void }) {
  const estadoMeta: Record<string, { label: string; cls: string; icon: string }> = {
    INDEXADO: {
      label: 'Entrenado',
      cls: 'text-emerald-600 dark:text-emerald-400',
      icon: 'solar:check-circle-bold',
    },
    PENDIENTE: {
      label: 'Indexando…',
      cls: 'text-amber-600 dark:text-amber-400',
      icon: 'svg-spinners:180-ring',
    },
    ERROR: {
      label: 'Error',
      cls: 'text-rose-600 dark:text-rose-400',
      icon: 'solar:danger-triangle-bold',
    },
  }
  const m = estadoMeta[d.estado] ?? estadoMeta.PENDIENTE
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-slate-800">
      <Icon
        icon={d.tipo === 'URL' ? 'solar:link-bold' : 'solar:document-text-bold'}
        className="text-lg text-gray-400"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {d.titulo}
        </p>
        <p className={`flex items-center gap-1 text-xs ${m.cls}`}>
          <Icon icon={m.icon} width={12} /> {m.label}
          {d._count ? ` · ${d._count.fragmentos} fragmentos` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
        title="Eliminar"
      >
        <Icon icon="solar:trash-bin-trash-bold" width={16} />
      </button>
    </div>
  )
}

// Secciones de inserción rápida para el contexto (texto plano — la IA lo consume tal cual).
const SECCIONES_CONTEXTO: { label: string; icon: string; snippet: string }[] = [
  { label: 'Qué vendemos', icon: 'solar:box-bold-duotone', snippet: 'QUÉ VENDEMOS:\n- ' },
  { label: 'Precios', icon: 'solar:tag-price-bold-duotone', snippet: 'PRECIOS:\n- Producto/plan: S/00 (qué incluye)\n- ' },
  { label: 'Planes', icon: 'solar:layers-bold-duotone', snippet: 'PLANES:\n- Básico: ...\n- Pro: ...\n' },
  { label: 'FAQs', icon: 'solar:question-circle-bold-duotone', snippet: 'PREGUNTAS FRECUENTES:\n- ¿...? R: ...\n- ' },
  { label: 'Objeciones', icon: 'solar:shield-warning-bold-duotone', snippet: 'OBJECIONES Y RESPUESTAS:\n- "Es caro" → ...\n- ' },
  { label: 'Tono', icon: 'solar:chat-round-line-bold-duotone', snippet: 'TONO Y ESTILO: cercano, profesional, respuestas cortas. Nunca inventes precios ni prometas lo que no existe.\n' },
  { label: 'Horario', icon: 'solar:clock-circle-bold-duotone', snippet: 'HORARIO DE ATENCIÓN: Lun-Sáb 9am-7pm. Fuera de horario, avisa que responderás pronto.\n' },
]

const PLANTILLA_CONTEXTO = `NEGOCIO: (nombre y a qué se dedica)

QUÉ VENDEMOS: (productos o servicios principales)

PRECIOS:
- ...

OBJETIVO DE LA IA: calificar al prospecto y llevarlo a (comprar / agendar demo / dejar sus datos).

PREGUNTAS FRECUENTES:
- ¿...? R: ...

OBJECIONES:
- "..." → ...

TONO: cercano, profesional, respuestas cortas. Nunca inventes precios ni prometas lo que no existe.`

function ConfigForm({
  initial,
  onSave,
  onToggle,
}: {
  initial: {
    iaVentasActiva: boolean
    iaVentasContexto: string
    iaVentasSeguimiento: boolean
    iaVentasBrochureUrl: string
  }
  onSave: (data: {
    iaVentasContexto: string
    iaVentasSeguimiento: boolean
    iaVentasBrochureUrl: string
  }) => void
  onToggle: (v: boolean) => void
}) {
  const [contexto, setContexto] = useState(initial.iaVentasContexto)
  const [activa, setActiva] = useState(initial.iaVentasActiva)
  const [seguimiento, setSeguimiento] = useState(initial.iaVentasSeguimiento)
  const [brochure, setBrochure] = useState(initial.iaVentasBrochureUrl)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContexto(initial.iaVentasContexto)
    setActiva(initial.iaVentasActiva)
    setSeguimiento(initial.iaVentasSeguimiento)
    setBrochure(initial.iaVentasBrochureUrl)
  }, [initial])

  // Auto-crecer el textarea según su contenido (tope de altura con scroll interno).
  const autoGrow = useCallback(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 460) + 'px'
  }, [])
  useEffect(() => {
    autoGrow()
  }, [contexto, autoGrow])

  // Inserta un bloque al final del contexto (texto plano).
  const insertar = (snippet: string) => {
    setContexto((prev) => {
      const base = prev.replace(/\s+$/, '')
      return (base ? base + '\n\n' : '') + snippet
    })
    // Devuelve el foco al textarea tras insertar.
    setTimeout(() => taRef.current?.focus(), 0)
  }

  const palabras = contexto.trim() ? contexto.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-slate-800">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            IA de ventas activa
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Si está apagada, el bot no responde los WhatsApp entrantes.
          </p>
        </div>
        <SwitchIa
          activa={activa}
          onChange={(v) => {
            setActiva(v)
            onToggle(v)
          }}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-slate-800">
        <div className="pr-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Seguimiento automático
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Si un prospecto deja de responder, la IA le manda un recordatorio (gratis, dentro de las 24h).
          </p>
        </div>
        <SwitchIa activa={seguimiento} onChange={setSeguimiento} />
      </div>

      <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-800">
        <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
          Contexto del negocio
        </label>
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          Describe tu oferta, precios, planes y preguntas frecuentes. La IA usa esto como
          conocimiento base para responder y calificar.
        </p>

        {/* Inserción rápida de secciones (texto plano, ideal para la IA) */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {SECCIONES_CONTEXTO.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => insertar(s.snippet)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-violet-700 dark:hover:bg-violet-900/20"
            >
              <Icon icon={s.icon} width={13} /> {s.label}
            </button>
          ))}
        </div>

        <textarea
          ref={taRef}
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={8}
          placeholder="Ej: Vendemos planes de software para restaurantes. Plan Básico S/99/mes, Plan Pro S/199/mes con delivery. Atendemos Lima y provincias..."
          className="block max-h-[460px] min-h-[180px] w-full resize-none overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:focus:ring-violet-900/30"
        />

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => insertar(PLANTILLA_CONTEXTO)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            <Icon icon="solar:magic-stick-3-bold-duotone" width={14} /> Usar plantilla sugerida
          </button>
          <span className="text-[11px] text-gray-400">
            {palabras} {palabras === 1 ? 'palabra' : 'palabras'} · {contexto.length} caracteres
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-800">
        <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
          Enlace de brochure / catálogo (opcional)
        </label>
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          PDF o imagen que la IA envía por WhatsApp cuando el prospecto pide más información.
        </p>
        <input
          type="url"
          value={brochure}
          onChange={(e) => setBrochure(e.target.value)}
          placeholder="https://tuweb.com/brochure.pdf"
          className="block w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:focus:ring-violet-900/30"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          color="primary"
          onClick={() =>
            onSave({
              iaVentasContexto: contexto,
              iaVentasSeguimiento: seguimiento,
              iaVentasBrochureUrl: brochure,
            })
          }
        >
          Guardar
        </Button>
      </div>
    </div>
  )
}
