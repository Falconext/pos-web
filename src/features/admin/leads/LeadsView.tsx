import { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { format, isSameDay, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import ModalConfirm from '@/components/ModalConfirm'
import { useLeadsViewModel } from './useLeadsViewModel'
import useAlertStore from '@/zustand/alert'
import { EmbudoBoard } from './EmbudoBoard'
import { BiPanel } from './BiPanel'
import { DisparadoresPanel } from './DisparadoresPanel'
import { DemosPanel } from './DemosPanel'
import { Ficha360 } from './Ficha360'
import { formatoDuracion, MAX_SEGUNDOS_NOTA, textoDeNotaDeVoz, useGrabadoraNota } from './notaDeVoz'
import { BandejaChats } from './BandejaChats'
import {
  ESTADO_META,
  nombreVisible,
  iniciales,
} from './LeadsModel'
import type {
  LeadProspecto,
  LeadDocumento,
  TipoLeadDocumento,
} from '@/services/leads.service'

type Vista = 'conversaciones' | 'embudo' | 'analitica' | 'avisos' | 'demos'

const VISTAS: { id: Vista; label: string; icon: string }[] = [
  { id: 'conversaciones', label: 'Conversaciones', icon: 'solar:chat-round-dots-bold-duotone' },
  { id: 'embudo', label: 'Embudo', icon: 'solar:filter-bold-duotone' },
  { id: 'analitica', label: 'Analítica', icon: 'solar:chart-2-bold-duotone' },
  { id: 'avisos', label: 'Avisos', icon: 'solar:bell-bold-duotone' },
  // Solo para quien entrega demos por WhatsApp (Krezka): ver `tieneDemos`.
  { id: 'demos', label: 'Demos', icon: 'solar:monitor-smartphone-bold-duotone' },
]

export default function LeadsView() {
  const vm = useLeadsViewModel()
  const [vista, setVista] = useState<Vista>('conversaciones')

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
          {/* El interruptor aparece cuando sabemos en qué posición va. Un
              "IA apagada" de dos segundos en cada carga es tan falso como el
              aviso rojo de abajo. */}
          {vm.configCargada && (
            <SwitchIa
              activa={vm.config.iaVentasActiva}
              onChange={vm.actions.toggleIaVentas}
            />
          )}
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

      {/* Aviso si la IA está apagada.
          Solo cuando ya sabemos que lo está: antes salía en cada carga,
          mientras la configuración viajaba, diciéndole al dueño que su bot no
          responde cuando sí responde. */}
      {vm.configCargada && !vm.config.iaVentasActiva && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          <Icon icon="solar:info-circle-bold" className="mt-0.5 text-lg" />
          <span>
            La IA está <b>desactivada</b>: se guardan los mensajes entrantes pero el bot no
            responde. Actívala arriba cuando quieras que empiece a atender y calificar.
          </span>
        </div>
      )}

      {/* Conmutador de vistas */}
      <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800/60 w-fit">
        {VISTAS.filter((v) => v.id !== 'demos' || vm.config.tieneDemos).map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVista(v.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
              vista === v.id
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-[#111827] dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon icon={v.icon} className="text-base" />
            {v.label}
          </button>
        ))}
      </div>

      {vista === 'embudo' && <EmbudoBoard onVerCliente={vm.setFicha360} />}
      {vista === 'analitica' && <BiPanel />}
      {vista === 'avisos' && <DisparadoresPanel />}
      {vista === 'demos' && <DemosPanel />}
      {vm.ficha360 && (
        <Ficha360 telefono={vm.ficha360} onCerrar={() => vm.setFicha360(null)} />
      )}

      {/* La bandeja: lista, chat y ficha a la vista.
          Antes esto era un tablero kanban con el chat en un cajón flotante.
          El tablero ya vive en la pestaña Embudo, abrir otro chat obligaba a
          cerrar el anterior, y la ficha del cliente se abría en un segundo
          cajón que quedaba tapado por el primero. */}
      {vista === 'conversaciones' && (
        <BandejaChats
          prospectos={vm.prospectos}
          chatsDePrueba={vm.chatsDePrueba}
          conversacionAbiertaId={vm.conversacion?.id ?? null}
          cargando={vm.isLoading}
          busqueda={vm.search}
          onBuscar={vm.setSearch}
          onAbrir={vm.actions.abrirConversacion}
          onVerHistorial={vm.setFicha360}
          prospectoActivo={
            vm.prospectos.find((p) => p.conversacionId === vm.conversacion?.id) ?? null
          }
          chat={
            vm.conversacion || vm.loadingConversacion ? (
              <ChatPanel vm={vm} />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                <Icon
                  icon="solar:chat-round-dots-bold-duotone"
                  width={46}
                  className="opacity-25"
                />
                <p className="text-sm font-semibold">Elige una conversación</p>
                <p className="-mt-2 text-xs">Sus mensajes y su ficha aparecen acá</p>
              </div>
            )
          }
        />
      )}

      {/* Los modales viven fuera de la vista: "Configurar" y "Entrenar" se
          abren desde el encabezado, que está en las tres pestañas. */}
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

function ChatPanel({ vm }: { vm: ReturnType<typeof useLeadsViewModel> }) {
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const conv = vm.conversacion
  // Un chat se abre por lo último que dijeron, no por el primer mensaje de
  // hace tres semanas. Sin esto hay que arrastrar la barra hasta el fondo en
  // cada conversación que se abre.
  const finDelChat = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    finDelChat.current?.scrollIntoView({ block: 'end' })
  }, [conv?.id, conv?.mensajes.length])
  if (vm.loadingConversacion && !conv) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-gray-400">
        <Icon icon="svg-spinners:180-ring" width={28} />
      </div>
    )
  }
  if (!conv) return null
  const prospecto = conv.prospecto
  // La pausa es de la conversación. Antes se leía del prospecto y en los chats
  // de prueba —que no tienen— el interruptor no aparecía: el empresario
  // preguntó "¿dónde está?, no lo veo" justo en uno de esos.
  const botActivo = conv.botActivo ?? true

  const meta = prospecto ? ESTADO_META[prospecto.estado] : null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Cabecera */}
      <div className="sticky top-0 z-10 flex flex-none items-center gap-2.5 border-b border-gray-100 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-[#111827]">
        {/* Volver a la lista. Solo en pantalla chica: ahí la lista se oculta
            para que el chat ocupe todo el ancho, así que sin esto no hay
            manera de salir del chat. */}
        <button
          type="button"
          onClick={vm.actions.cerrarConversacion}
          aria-label="Volver a la lista"
          className="flex h-11 w-9 flex-none items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-slate-800"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={20} />
        </button>

        <span className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-xs font-bold text-white">
          {iniciales(conv.nombreProspecto, conv.telefonoProspecto)}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-white dark:ring-[#111827]">
            <Icon icon="mdi:whatsapp" width={9} className="text-white" />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-gray-900 dark:text-white">
            {nombreVisible(conv.nombreProspecto, conv.telefonoProspecto)}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {conv.telefonoProspecto}
            </span>
            {meta && (
              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${meta.badge}`}>
                <Icon icon={meta.icon} width={9} />
                {meta.label}
              </span>
            )}
            {!prospecto && (
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                · chat de prueba, no cuenta como lead
              </span>
            )}
          </div>
        </div>

        {/* "Tomar chat": el interruptor de la IA.
            Es la acción de la que depende todo lo demás — mientras la IA
            responda, lo que escriba el vendedor se le cruza al cliente — así
            que va arriba y en color, no escondida al final de la cabecera. */}
        <div className="flex flex-none flex-col items-end">
          <button
            type="button"
            onClick={() => vm.actions.toggleBot(conv.id, !botActivo)}
            aria-pressed={!botActivo}
            title={
              botActivo
                ? 'La IA deja de responder y contestas tú'
                : 'La IA vuelve a responder sola'
            }
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold transition-colors ${
              botActivo
                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:hover:bg-orange-900/60'
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60'
            }`}
          >
            <Icon icon={botActivo ? 'solar:hand-stars-bold' : 'solar:play-bold'} width={15} />
            {botActivo ? 'Tomar chat' : 'Devolver a la IA'}
          </button>
          {/* La consecuencia, pegada al botón que la provoca. Vivía encima del
              campo de escribir, a media pantalla de distancia del interruptor
              que explica. */}
          <span className="mt-0.5 hidden text-[10px] leading-tight text-gray-500 xl:block dark:text-gray-400">
            {botActivo ? 'o escribe abajo y lo tomas' : 'la IA no responde acá'}
          </span>
        </div>

        {/* Convertir y borrar son de una vez: van en el menú, no en la barra. */}
        <div className="relative flex-none">
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Más acciones"
            aria-expanded={menuAbierto}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
          >
            <Icon icon="solar:menu-dots-bold" width={18} />
          </button>
          {menuAbierto && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuAbierto(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-[#1b2434]">
                {prospecto &&
                  (prospecto.estado === 'CONVERTIDO' || prospecto.clienteId ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
                      <Icon icon="solar:user-check-bold" width={15} />
                      Ya es cliente
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={vm.convirtiendo}
                      onClick={() => {
                        setMenuAbierto(false)
                        vm.actions.convertirCliente(prospecto.id)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:text-gray-200 dark:hover:bg-slate-800"
                    >
                      <Icon icon="solar:user-plus-bold" width={15} className="text-violet-500" />
                      {vm.convirtiendo ? 'Convirtiendo…' : 'Convertir a cliente'}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false)
                    vm.setFicha360(conv.telefonoProspecto)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
                >
                  <Icon
                    icon="solar:clipboard-list-bold-duotone"
                    width={15}
                    className="text-indigo-500"
                  />
                  Ver su historial
                </button>
                {/* Borrar el chat es lo que permite repetir una prueba desde
                    cero. Pide confirmación porque no se deshace, y dice
                    cuántos mensajes se lleva: no es lo mismo tirar un "hola"
                    que una venta cerrada. */}
                <button
                  type="button"
                  disabled={vm.borrandoChat}
                  onClick={() => {
                    setMenuAbierto(false)
                    setConfirmarBorrado(true)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <Icon
                    icon={vm.borrandoChat ? 'svg-spinners:180-ring' : 'solar:trash-bin-trash-bold'}
                    width={15}
                  />
                  {vm.borrandoChat ? 'Borrando…' : 'Borrar chat'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ModalConfirm
        isOpenModal={confirmarBorrado}
        setIsOpenModal={setConfirmarBorrado}
        title="¿Borrar esta conversación?"
        information={`Se borrarán los ${conv.mensajes.length} mensaje${conv.mensajes.length === 1 ? '' : 's'} de ${nombreVisible(conv.nombreProspecto, conv.telefonoProspecto)}. Podrá volver a escribir y la IA lo atenderá desde cero. No se puede deshacer.`}
        confirmText="Borrar chat"
        confirmLoading={vm.borrandoChat}
        confirmSubmit={() => {
          setConfirmarBorrado(false)
          vm.actions.borrarConversacion(conv.id)
        }}
      />

      {/* Mensajes — estilo chat */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6f7fb] px-5 py-4 dark:bg-[#0b0f17]">
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
            // SISTEMA = lo escribió el vendedor a mano desde el panel.
            const esManual = m.rol === 'SISTEMA'
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
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                        esManual
                          ? 'text-emerald-600 dark:text-emerald-300'
                          : 'text-violet-500 dark:text-violet-300'
                      }`}
                    >
                      <Icon
                        icon={esManual ? 'solar:user-bold' : 'solar:magic-stick-3-bold'}
                        width={11}
                      />
                      {esManual ? 'Tú' : 'Asistente IA'}
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
                        : `rounded-2xl bg-gradient-to-br text-white ${
                            esManual
                              ? 'from-emerald-600 to-emerald-500'
                              : 'from-violet-600 to-violet-500'
                          } ${nuevoGrupo ? 'rounded-br-md' : ''}`
                    }`}
                  >
                    {m.imagenUrl && (
                      <a href={m.imagenUrl} target="_blank" rel="noreferrer" className="-mx-1 -mt-0.5 mb-1 block">
                        <img
                          src={m.imagenUrl}
                          alt="Imagen enviada"
                          loading="lazy"
                          className="max-h-64 w-full rounded-xl object-cover"
                        />
                      </a>
                    )}
                    {m.audioUrl && (
                      <audio
                        controls
                        preload="none"
                        src={m.audioUrl}
                        aria-label="Nota de voz enviada"
                        className="mb-1 h-10 w-64 max-w-full"
                      />
                    )}
                    {(() => {
                      // Las marcas "📷 [Imagen]" y "[Nota de voz]" son para la
                      // IA; acá ya se ve la foto o el reproductor.
                      const texto = m.imagenUrl
                        ? m.contenido.replace(/^📷 \[Imagen\]\s*/, '')
                        : m.audioUrl
                          ? textoDeNotaDeVoz(m.contenido)
                          : m.contenido
                      return texto ? (
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{texto}</p>
                      ) : null
                    })()}
                    <span
                      className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        esUsuario
                          ? 'text-gray-400'
                          : esManual
                            ? 'text-emerald-100/80'
                            : 'text-violet-100/80'
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
        {/* Ancla invisible: el chat se abre mostrando esto, o sea el final. */}
        <div ref={finDelChat} />
      </div>

      <Composer vm={vm} botActivo={botActivo} />

    </div>
  )
}

/**
 * Caja para responder a mano en la conversación. Enviar un mensaje toma el chat:
 * la IA queda pausada hasta que el vendedor la reactive.
 */
export function Composer({
  vm,
  botActivo,
}: {
  vm: ReturnType<typeof useLeadsViewModel>
  botActivo: boolean
}) {
  const [texto, setTexto] = useState('')
  // Imagen elegida y todavía sin enviar; el texto pasa a ser su pie.
  const [imagen, setImagen] = useState<{ archivo: File; vista: string } | null>(null)
  const inputImagen = useRef<HTMLInputElement>(null)
  const enviando = vm.enviandoMensaje
  const puedeEnviar = (!!imagen || texto.trim().length > 0) && !enviando
  const { alert: alertar } = useAlertStore()
  const avisarError = useCallback((mensaje: string) => alertar(mensaje, 'error'), [alertar])
  const grabadora = useGrabadoraNota(avisarError)
  const conNota = grabadora.grabando || !!grabadora.pendiente

  const enviarNota = async () => {
    const nota = await grabadora.detener()
    if (!nota) return
    await vm.actions.enviarAudioManual(nota.archivo, nota.segundos)
  }

  const elegirImagen = (archivo: File | undefined | null) => {
    if (!archivo || !archivo.type.startsWith('image/')) return
    setImagen((prev) => {
      if (prev) URL.revokeObjectURL(prev.vista)
      return { archivo, vista: URL.createObjectURL(archivo) }
    })
  }
  const quitarImagen = () => {
    setImagen((prev) => {
      if (prev) URL.revokeObjectURL(prev.vista)
      return null
    })
  }

  const enviar = async () => {
    if (!puedeEnviar) return
    const ok = imagen
      ? await vm.actions.enviarImagenManual(imagen.archivo, texto)
      : await vm.actions.enviarMensajeManual(texto)
    if (ok) {
      setTexto('')
      quitarImagen()
    }
  }

  return (
    <div className="flex-none border-t border-gray-100 px-4 pb-3 pt-3 dark:border-slate-800">
      {imagen && (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-slate-700 dark:bg-slate-800/60">
          <img src={imagen.vista} alt="" className="h-14 w-14 flex-none rounded-lg object-cover" />
          <div className="min-w-0 flex-1 text-xs text-gray-500 dark:text-gray-400">
            <p className="truncate font-semibold text-gray-700 dark:text-gray-200">{imagen.archivo.name}</p>
            <p>Lo que escribas abajo va como texto de la imagen.</p>
          </div>
          <button
            type="button"
            onClick={quitarImagen}
            disabled={enviando}
            title="Quitar imagen"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-slate-700"
          >
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>
      )}
      {conNota ? (
        <div className="flex items-center gap-2" data-testid="grabando-nota">
          <button
            type="button"
            onClick={grabadora.cancelar}
            disabled={enviando}
            title="Descartar la nota de voz"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
          >
            <Icon icon="solar:trash-bin-minimalistic-linear" width={19} />
          </button>
          <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
            {grabadora.grabando ? (
              <span className="h-2.5 w-2.5 flex-none animate-pulse rounded-full bg-rose-500" />
            ) : (
              <Icon icon="solar:microphone-3-bold" width={16} />
            )}
            <span className="font-semibold tabular-nums">
              {formatoDuracion(grabadora.pendiente ? grabadora.pendiente.segundos : grabadora.segundos)}
            </span>
            <span className="truncate text-xs text-rose-600/80 dark:text-rose-300/80">
              {grabadora.grabando
                ? `Grabando… máximo ${formatoDuracion(MAX_SEGUNDOS_NOTA)}`
                : 'Llegó al máximo. Envíala o descártala.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void enviarNota()}
            disabled={enviando}
            title="Enviar la nota de voz"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon icon={enviando ? 'svg-spinners:180-ring' : 'solar:plain-bold'} width={18} />
          </button>
        </div>
      ) : (
      <div className="flex items-end gap-2">
        <input
          ref={inputImagen}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            elegirImagen(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputImagen.current?.click()}
          disabled={enviando}
          title="Enviar una imagen"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-violet-300 hover:text-violet-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
        >
          <Icon icon="solar:gallery-add-linear" width={19} />
        </button>
        {!imagen && !texto.trim() && (
          <button
            type="button"
            onClick={() => void grabadora.empezar()}
            disabled={enviando}
            title="Grabar una nota de voz"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-violet-300 hover:text-violet-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
          >
            <Icon icon="solar:microphone-3-linear" width={19} />
          </button>
        )}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            // Enter envía; Shift+Enter hace salto de línea.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void enviar()
            }
          }}
          onPaste={(e) => {
            // Pegar una captura (Ctrl+V) también la adjunta.
            const archivo = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'))
            if (archivo) {
              e.preventDefault()
              elegirImagen(archivo)
            }
          }}
          rows={1}
          maxLength={imagen ? 1024 : 4096}
          disabled={enviando}
          placeholder={imagen ? 'Texto de la imagen (opcional)…' : 'Escribe tu respuesta…'}
          className="max-h-28 min-h-[40px] flex-1 resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:ring-violet-900/40"
        />
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={!puedeEnviar}
          title="Enviar por WhatsApp"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon
            icon={enviando ? 'svg-spinners:180-ring' : 'solar:plain-bold'}
            width={18}
          />
        </button>
      </div>
      )}
    </div>
  )
}

function etiquetaDia(d: Date): string {
  if (isToday(d)) return 'Hoy'
  if (isYesterday(d)) return 'Ayer'
  return format(d, "d 'de' MMMM", { locale: es })
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
              <DocRow
                key={d.id}
                d={d}
                onDelete={() => vm.actions.eliminarDocumento(d.id)}
                onReintentar={() => vm.actions.reindexarDocumento(d.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DocRow({
  d,
  onDelete,
  onReintentar,
}: {
  d: LeadDocumento
  onDelete: () => void
  onReintentar: () => void
}) {
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
      {/* Un documento en error no tenía salida: había que borrarlo y volver a
          subirlo. El texto ya está guardado, así que reintentar basta. */}
      {d.estado === 'ERROR' && (
        <button
          type="button"
          onClick={onReintentar}
          data-testid={`reintentar-${d.id}`}
          className="rounded-lg px-2 py-1 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          title="Volver a entrenar este documento"
        >
          Reintentar
        </button>
      )}
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

export function ConfigForm({
  initial,
  onSave,
  onToggle,
}: {
  initial: {
    iaVentasActiva: boolean
    iaVentasContexto: string
    iaVentasSeguimiento: boolean
    iaVentasCotizacion: boolean
    iaVentasBrochureUrl: string
    cobroConLink?: boolean
    mpConectado?: boolean
  }
  onSave: (data: {
    iaVentasContexto: string
    iaVentasSeguimiento: boolean
    iaVentasCotizacion: boolean
    iaVentasBrochureUrl: string
    cobroConLink: boolean
  }) => void
  onToggle: (v: boolean) => void
}) {
  const [contexto, setContexto] = useState(initial.iaVentasContexto)
  const [activa, setActiva] = useState(initial.iaVentasActiva)
  const [seguimiento, setSeguimiento] = useState(initial.iaVentasSeguimiento)
  const [cotizacion, setCotizacion] = useState(initial.iaVentasCotizacion)
  const [cobroConLink, setCobroConLink] = useState(initial.cobroConLink ?? false)
  const [brochure, setBrochure] = useState(initial.iaVentasBrochureUrl)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContexto(initial.iaVentasContexto)
    setActiva(initial.iaVentasActiva)
    setSeguimiento(initial.iaVentasSeguimiento)
    setCotizacion(initial.iaVentasCotizacion)
    setCobroConLink(initial.cobroConLink ?? false)
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

      <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-slate-800">
        <div className="pr-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Cotización automática
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cuando el prospecto confirma qué productos y cantidades quiere, la IA arma un borrador de cotización (sin afectar stock ni caja) y lo deja listo en el panel.
          </p>
        </div>
        <SwitchIa activa={cotizacion} onChange={setCotizacion} />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-slate-800">
        <div className="pr-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Cobrar con link de Mercado Pago
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Al cotizar, la IA le ofrece al cliente un link para pagar con tarjeta. Cuando Mercado Pago confirma el pago, queda validado solo, sin revisar capturas. Mercado Pago cobra su comisión por cada venta; el Yape sigue disponible.
          </p>
          {!initial.mpConectado && (
            <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              Primero conecta tu Mercado Pago en Mi perfil → Medios de pago.
            </p>
          )}
        </div>
        <SwitchIa
          activa={cobroConLink && Boolean(initial.mpConectado)}
          onChange={(v) => {
            if (initial.mpConectado) setCobroConLink(v)
          }}
        />
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
              iaVentasCotizacion: cotizacion,
              iaVentasBrochureUrl: brochure,
              cobroConLink,
            })
          }
        >
          Guardar
        </Button>
      </div>
    </div>
  )
}
