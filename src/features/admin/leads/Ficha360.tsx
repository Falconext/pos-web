/**
 * E3 — historial 360° por cliente.
 *
 * Todo lo que se sabe de una persona en una sola pantalla: lo que compró, con
 * qué malestar llegó, qué pidió y no había, por dónde pasó su pedido y los
 * comprobantes de pago que mandó.
 *
 * La llave es el teléfono, porque en WhatsApp no hay otra. Si el cliente
 * escribió desde dos números con el mismo DNI, se ven juntos y se dice en
 * pantalla — si no, los pedidos "de otro chat" parecerían un error.
 */
import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import moment from 'moment'
import { crmService, ETAPA_META, type Ficha360 as Ficha } from '@/services/crm.service'

const soles = (n: number) => `S/ ${Number(n ?? 0).toFixed(2)}`

export function Ficha360({
  telefono,
  onCerrar,
}: {
  telefono: string
  onCerrar: () => void
}) {
  const [ficha, setFicha] = useState<Ficha | null>(null)
  const [cargando, setCargando] = useState(true)
  const [duplicados, setDuplicados] = useState<
    { telefono: string; nombre: string; parecido: number }[]
  >([])

  useEffect(() => {
    let vivo = true
    setCargando(true)
    crmService
      .ficha360(telefono)
      .then((f) => vivo && setFicha(f))
      .catch(() => undefined)
      .finally(() => vivo && setCargando(false))
    crmService
      .posiblesDuplicados(telefono)
      .then((d) => vivo && setDuplicados(d))
      .catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [telefono])

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white dark:bg-[#0A0D14]">
        <div className="flex items-start justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Historial del cliente
            </p>
            <h2 className="truncate text-lg font-black text-gray-900 dark:text-white">
              {ficha?.cliente.nombreProspecto || telefono}
            </h2>
            <p className="font-mono text-xs text-gray-400">{telefono}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200 dark:bg-gray-800"
          >
            <Icon icon="solar:close-circle-bold" className="text-lg" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {cargando && (
            <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
              <Icon icon="eos-icons:loading" className="animate-spin text-3xl text-indigo-500" />
              <p className="text-sm">Cargando…</p>
            </div>
          )}

          {!cargando && !ficha && (
            <p className="py-12 text-center text-sm text-gray-400">
              Este número todavía no tiene historial.
            </p>
          )}

          {ficha && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-black ${ETAPA_META[ficha.cliente.etapa].chip}`}
                >
                  {ETAPA_META[ficha.cliente.etapa].label}
                </span>
                {ficha.cliente.dni && (
                  <span className="font-mono text-[11px] text-gray-500">
                    DNI {ficha.cliente.dni}
                  </span>
                )}
                {ficha.cliente.edad != null && (
                  <span className="text-[11px] text-gray-500">{ficha.cliente.edad} años</span>
                )}
              </div>

              {ficha.cliente.unidoPorDni && (
                <div
                  data-testid="aviso-union"
                  className="flex items-start gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-[11px] text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300"
                >
                  <Icon icon="solar:link-bold-duotone" className="mt-0.5" />
                  <span>
                    Escribe desde {ficha.cliente.telefonos.length} números con el mismo DNI:{' '}
                    {ficha.cliente.telefonos.join(', ')}. El historial está unido.
                  </span>
                </div>
              )}

              <Seccion titulo="Compras" icono="solar:bag-check-bold-duotone">
                <div className="mb-2 grid grid-cols-3 gap-2">
                  <Mini etiqueta="Pedidos" valor={String(ficha.resumenCompras.cantidad)} />
                  <Mini etiqueta="Gastado" valor={soles(ficha.resumenCompras.gastado)} />
                  <Mini etiqueta="Promedio" valor={soles(ficha.resumenCompras.ticketPromedio)} />
                </div>
                {ficha.pedidos.length === 0 ? (
                  <p className="text-xs text-gray-400">Todavía no compró.</p>
                ) : (
                  ficha.pedidos.map((p) => (
                    <div
                      key={`${p.comprobanteId}`}
                      className="flex items-center justify-between border-t border-gray-100 py-1.5 text-xs dark:border-gray-800"
                    >
                      <span className="font-mono text-gray-500">{p.comprobante ?? '—'}</span>
                      <span className="text-gray-400">{p.destino ?? ''}</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {soles(p.monto)}
                      </span>
                    </div>
                  ))
                )}
              </Seccion>

              <Seccion titulo="Con qué llegó" icono="solar:stethoscope-bold-duotone">
                {ficha.consultasDeSalud.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin consultas de salud registradas.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {ficha.consultasDeSalud.map((c, i) => (
                      <span
                        key={i}
                        title={moment(c.creadoEn).format('DD/MM/YYYY')}
                        className="rounded-lg bg-sky-50 px-2 py-0.5 text-[11px] text-sky-800 dark:bg-sky-900/20 dark:text-sky-300"
                      >
                        {c.texto}
                      </span>
                    ))}
                  </div>
                )}
              </Seccion>

              <Seccion titulo="Pidió y no teníamos" icono="solar:bag-cross-bold-duotone">
                {ficha.noHabidos.length === 0 ? (
                  <p className="text-xs text-gray-400">Nada: siempre encontró lo que buscaba.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {ficha.noHabidos.map((c, i) => (
                        <span
                          key={i}
                          title={moment(c.creadoEn).format('DD/MM/YYYY')}
                          className="rounded-lg bg-rose-50 px-2 py-0.5 text-[11px] text-rose-800 dark:bg-rose-900/20 dark:text-rose-300"
                        >
                          {c.texto}
                        </span>
                      ))}
                    </div>
                    {/* Es la razón de ser de esta lista: cuando llegue, hay a
                        quién avisarle. */}
                    <p className="mt-2 text-[11px] text-gray-400">
                      Cuando entre stock de algo de esta lista, este cliente lo
                      estaba buscando.
                    </p>
                  </>
                )}
              </Seccion>

              {ficha.comprobantesPago.length > 0 && (
                <Seccion titulo="Comprobantes de pago" icono="solar:wallet-money-bold-duotone">
                  {ficha.comprobantesPago.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 py-1 text-[11px]">
                      {p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          Ver imagen
                        </a>
                      ) : (
                        <span className="text-gray-400">Sin imagen</span>
                      )}
                      <span className="text-gray-400">
                        {moment(p.recibidoEn).format('DD/MM HH:mm')}
                      </span>
                      <span className="ml-auto font-bold">
                        {p.validadoEn ? (
                          <span className="text-emerald-600">Validado por {p.validadoPor}</span>
                        ) : p.rechazadoEn ? (
                          <span className="text-rose-600">Rechazado: {p.rechazadoMotivo}</span>
                        ) : (
                          <span className="text-amber-600">Por revisar</span>
                        )}
                      </span>
                    </div>
                  ))}
                </Seccion>
              )}

              <Seccion titulo="Por dónde pasó" icono="solar:route-bold-duotone">
                {ficha.historialEtapas.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin movimientos todavía.</p>
                ) : (
                  [...ficha.historialEtapas].reverse().map((m, i) => (
                    <div key={i} className="flex items-start gap-2 py-1 text-[11px]">
                      <span className="font-bold text-gray-700 dark:text-gray-300">
                        {ETAPA_META[m.hacia]?.label ?? m.hacia}
                      </span>
                      <span className="text-gray-400">
                        {m.actor === 'bot' ? 'automático' : m.actor}
                      </span>
                      <span className="ml-auto flex-shrink-0 text-gray-400">
                        {moment(m.creadoEn).format('DD/MM HH:mm')}
                      </span>
                    </div>
                  ))
                )}
              </Seccion>

              {duplicados.length > 0 && (
                <Seccion titulo="¿Es el mismo cliente?" icono="solar:users-group-two-rounded-bold-duotone">
                  {/* Por nombre parecido se SUGIERE, nunca se une solo: "Rosa
                      Quispe" hay muchas, y mezclar dos clientes les mostraría
                      el historial de salud del otro. */}
                  <p className="mb-2 text-[11px] text-gray-400">
                    Estos números tienen un nombre parecido. Revísalos antes de
                    tratarlos como la misma persona: solo el DNI une solo.
                  </p>
                  {duplicados.map((d) => (
                    <div key={d.telefono} className="flex items-center gap-2 py-1 text-[11px]">
                      <span className="font-mono text-gray-500">{d.telefono}</span>
                      <span className="text-gray-700 dark:text-gray-300">{d.nombre}</span>
                      <span className="ml-auto text-gray-400">
                        {Math.round(Number(d.parecido) * 100)}% parecido
                      </span>
                    </div>
                  ))}
                </Seccion>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Seccion({
  titulo,
  icono,
  children,
}: {
  titulo: string
  icono: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
        <Icon icon={icono} className="text-sm text-indigo-400" />
        {titulo}
      </p>
      {children}
    </div>
  )
}

function Mini({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-2 py-1.5 dark:bg-gray-800/50">
      <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{etiqueta}</p>
      <p className="text-sm font-black text-gray-900 dark:text-white">{valor}</p>
    </div>
  )
}
