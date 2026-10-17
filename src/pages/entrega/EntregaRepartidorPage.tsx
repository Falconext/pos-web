/**
 * La pantalla del repartidor, abierta desde un enlace de WhatsApp.
 *
 * Quien la usa está parado en la puerta de una casa, con una mano ocupada,
 * sol en la pantalla y datos móviles. Todo lo que hay acá sale de eso:
 *
 *  - Sin login. El enlace es la credencial (ver `acceso-repartidor.ts`).
 *  - Dos botones grandes y nada más. Marcar que salió, marcar que entregó.
 *  - La dirección y el teléfono se tocan: abren el mapa y la llamada. En la
 *    calle nadie copia y pega una dirección.
 *  - Lo que tiene que cobrar va enorme y arriba. Es el dato que más caro sale
 *    si se lee mal.
 *  - La foto es opcional y entra por la cámara del celular directamente.
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'

type Item = { cantidad: number; descripcion: string }
type Entrega = {
    pedido: string
    estado: string
    tipoEnvio: string | null
    destinatario: string
    telefono: string | null
    direccion: string | null
    distrito: string | null
    referencia: string | null
    paquetes: number
    aCobrar: number
    repartidor: string | null
    items: Item[]
}

const API = import.meta.env.VITE_API_URL || '/api'

const ETIQUETA: Record<string, string> = {
    PREPARANDO: 'Por salir',
    EN_CAMINO: 'En camino',
    EN_AGENCIA: 'En agencia',
    EN_DESTINO: 'En destino',
    ENTREGADO: 'Entregado',
    DEVUELTO: 'Devuelto',
}

export default function EntregaRepartidorPage() {
    const { token = '' } = useParams()
    const [entrega, setEntrega] = useState<Entrega | null>(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [guardando, setGuardando] = useState<string | null>(null)
    const [aviso, setAviso] = useState<string | null>(null)
    const [subiendo, setSubiendo] = useState(false)
    const [fotos, setFotos] = useState(0)

    const cargar = useCallback(async () => {
        try {
            const r = await fetch(`${API}/entrega/${token}`)
            if (!r.ok) {
                setError('Este enlace ya no está activo. Pídele uno nuevo a la tienda.')
                return
            }
            const json = await r.json()
            setEntrega(json?.data ?? json)
        } catch {
            setError('No se pudo cargar. Revisa tu conexión e intenta de nuevo.')
        } finally {
            setCargando(false)
        }
    }, [token])

    useEffect(() => { void cargar() }, [cargar])

    const marcar = async (estado: string) => {
        setGuardando(estado)
        setAviso(null)
        try {
            const r = await fetch(`${API}/entrega/${token}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado }),
            })
            if (!r.ok) {
                setAviso('No se pudo guardar. Intenta de nuevo.')
                return
            }
            // Se recarga en vez de parchear el estado local: así se ve lo que
            // de verdad quedó guardado, no lo que creemos que quedó.
            await cargar()
        } catch {
            setAviso('Sin conexión. Intenta de nuevo cuando tengas señal.')
        } finally {
            setGuardando(null)
        }
    }

    const subirFoto = async (files: FileList | null) => {
        if (!files?.length) return
        setSubiendo(true)
        setAviso(null)
        try {
            const fd = new FormData()
            Array.from(files).slice(0, 6).forEach((f) => fd.append('fotos', f))
            const r = await fetch(`${API}/entrega/${token}/evidencias`, {
                method: 'POST',
                body: fd,
            })
            if (!r.ok) {
                setAviso('No se pudo subir la foto. Intenta de nuevo.')
                return
            }
            setFotos((n) => n + files.length)
            setAviso('Foto subida.')
        } catch {
            setAviso('Sin conexión. La foto no se subió.')
        } finally {
            setSubiendo(false)
        }
    }

    if (cargando) {
        return (
            <Pantalla>
                <p className="text-center text-sm text-gray-500">Cargando…</p>
            </Pantalla>
        )
    }

    if (error || !entrega) {
        return (
            <Pantalla>
                <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                    <Icon icon="solar:link-broken-bold-duotone" width={44} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-600">{error}</p>
                </div>
            </Pantalla>
        )
    }

    const entregado = entrega.estado === 'ENTREGADO'
    const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [entrega.direccion, entrega.distrito].filter(Boolean).join(', '),
    )}`

    return (
        <Pantalla>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gray-400">{entrega.pedido}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        entregado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                        {ETIQUETA[entrega.estado] ?? entrega.estado}
                    </span>
                </div>

                {/* Lo que cobra, primero y grande: es lo que más caro sale si se lee mal. */}
                {entrega.aCobrar > 0 ? (
                    <div className="rounded-2xl bg-gray-900 p-4 text-white">
                        <p className="text-[11px] uppercase tracking-wide text-gray-400">Cobrar en la puerta</p>
                        <p className="text-4xl font-black">S/ {entrega.aCobrar.toFixed(2)}</p>
                    </div>
                ) : (
                    <div className="rounded-2xl bg-emerald-50 p-4">
                        <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                            <Icon icon="solar:check-circle-bold" width={20} />
                            Ya está pagado, no cobrar
                        </p>
                    </div>
                )}

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-lg font-bold text-gray-900">{entrega.destinatario}</p>
                    {entrega.direccion && (
                        <a href={mapa} target="_blank" rel="noreferrer"
                           className="mt-2 flex items-start gap-2 text-sm text-blue-700 underline">
                            <Icon icon="solar:map-point-bold" width={18} className="mt-0.5 shrink-0" />
                            <span>{entrega.direccion}{entrega.distrito ? `, ${entrega.distrito}` : ''}</span>
                        </a>
                    )}
                    {entrega.referencia && (
                        <p className="mt-1 text-sm text-gray-500">{entrega.referencia}</p>
                    )}
                    {entrega.telefono && (
                        <a href={`tel:${entrega.telefono}`}
                           className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-800">
                            <Icon icon="solar:phone-bold" width={18} />
                            Llamar {entrega.telefono}
                        </a>
                    )}
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-400">
                        {entrega.paquetes > 1 ? `${entrega.paquetes} paquetes` : 'Lleva'}
                    </p>
                    {entrega.items.map((i, k) => (
                        <p key={k} className="text-sm text-gray-700">
                            <span className="font-bold">{i.cantidad}×</span> {i.descripcion}
                        </p>
                    ))}
                </div>

                {aviso && (
                    <p className="rounded-xl bg-blue-50 px-3 py-2 text-center text-sm text-blue-800">{aviso}</p>
                )}

                {/* Los botones al final: es donde llega el pulgar. */}
                {!entregado && (
                    <div className="space-y-2 pt-1">
                        {entrega.estado === 'PREPARANDO' && (
                            <Boton onClick={() => marcar('EN_CAMINO')} cargando={guardando === 'EN_CAMINO'}
                                   icono="solar:scooter-bold" clase="bg-amber-500">
                                Salí con el pedido
                            </Boton>
                        )}
                        <Boton onClick={() => marcar('ENTREGADO')} cargando={guardando === 'ENTREGADO'}
                               icono="solar:check-circle-bold" clase="bg-emerald-600">
                            Entregado
                        </Boton>
                    </div>
                )}

                <label className={`flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 text-sm font-bold ${
                    subiendo ? 'border-gray-200 text-gray-400' : 'border-gray-300 text-gray-600'
                }`}>
                    <Icon icon="solar:camera-bold" width={20} />
                    {subiendo ? 'Subiendo…' : fotos > 0 ? `${fotos} foto(s) subida(s) · agregar otra` : 'Tomar foto de la entrega'}
                    <input type="file" accept="image/*" capture="environment" multiple hidden
                           disabled={subiendo}
                           onChange={(e) => { void subirFoto(e.target.files); e.target.value = '' }} />
                </label>

                {entregado && (
                    <p className="pb-4 pt-2 text-center text-xs text-gray-400">
                        Entrega registrada. Gracias.
                    </p>
                )}
            </div>
        </Pantalla>
    )
}

function Pantalla({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-100 px-4 py-5">
            <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
    )
}

function Boton({ onClick, cargando, icono, clase, children }: {
    onClick: () => void; cargando: boolean; icono: string; clase: string; children: React.ReactNode
}) {
    return (
        <button type="button" onClick={onClick} disabled={cargando}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white disabled:opacity-60 ${clase}`}>
            <Icon icon={cargando ? 'svg-spinners:180-ring-with-bg' : icono} width={22} />
            {children}
        </button>
    )
}
