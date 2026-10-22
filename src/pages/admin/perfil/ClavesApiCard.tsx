/**
 * Claves API (2026-10-22): el negocio saca la clave para conectar su página
 * web con su catálogo y su stock de Krezka. Varios clientes lo pidieron: tienen
 * su propia web y querían mostrar ahí los productos sin cargarlos dos veces.
 *
 * La clave se muestra UNA sola vez al crearla (el backend guarda solo su
 * huella): si se pierde, se anula y se crea otra.
 */
import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import apiClient from '@/utils/apiClient'
import useAlertStore from '@/zustand/alert'
import ModalConfirm from '@/components/ModalConfirm'

interface ClaveApi {
    id: number
    nombre: string | null
    entorno: string
    prefijo: string
    ultimosCuatro: string
    ultimoUsoEn: string | null
    creadoEn: string
}

const datos = <T,>(r: any): T => (r?.data?.data ?? r?.data) as T
const mensajeDe = (e: any, porDefecto: string) => e?.response?.data?.message ?? porDefecto
const fecha = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Nunca'

/** La dirección de la API pública: la misma del panel, con /v1/erp. */
export const baseApiPublica = (): string =>
    `${String(apiClient.defaults.baseURL ?? '').replace(/\/+$/, '')}/v1/erp`

export function ClavesApiCard() {
    const { alert } = useAlertStore()
    const [claves, setClaves] = useState<ClaveApi[] | null>(null)
    const [nombre, setNombre] = useState('')
    const [creando, setCreando] = useState(false)
    const [nueva, setNueva] = useState<string | null>(null)
    const [anular, setAnular] = useState<ClaveApi | null>(null)
    const [anulando, setAnulando] = useState(false)

    const cargar = async () => {
        try {
            setClaves(datos<ClaveApi[]>(await apiClient.get('/integraciones/claves-api')))
        } catch {
            setClaves([])
        }
    }
    useEffect(() => {
        void cargar()
    }, [])

    const crear = async () => {
        setCreando(true)
        try {
            const r = datos<{ apiKey: string }>(
                await apiClient.post('/integraciones/claves-api', { nombre: nombre.trim() || undefined }),
            )
            setNueva(r.apiKey)
            setNombre('')
            await cargar()
        } catch (e) {
            alert(mensajeDe(e, 'No se pudo crear la clave'), 'error')
        } finally {
            setCreando(false)
        }
    }

    const confirmarAnular = async () => {
        if (!anular) return
        setAnulando(true)
        try {
            await apiClient.delete(`/integraciones/claves-api/${anular.id}`)
            alert('Clave anulada: lo que la use deja de funcionar ahora mismo', 'success')
            setAnular(null)
            await cargar()
        } catch (e) {
            alert(mensajeDe(e, 'No se pudo anular la clave'), 'error')
        } finally {
            setAnulando(false)
        }
    }

    const copiar = async (texto: string) => {
        try {
            await navigator.clipboard.writeText(texto)
            alert('Copiado', 'success')
        } catch {
            alert('No se pudo copiar: selecciónalo y cópialo a mano', 'error')
        }
    }

    const base = baseApiPublica()
    const ejemplo = `curl ${base}/products \\\n  -H "Authorization: Bearer TU_CLAVE"`

    return (
        <div className="space-y-4" data-testid="claves-api">
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Con una clave, tu página web o tu sistema puede leer tus productos, precios, fotos y stock
                de Krezka, siempre al día. Pásale la clave a quien hizo tu web.
            </p>

            {nueva && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-900/10" data-testid="clave-nueva">
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                        Copia tu clave ahora: no se vuelve a mostrar.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-2 py-1.5 text-xs text-gray-800 dark:bg-slate-900 dark:text-gray-100">
                            {nueva}
                        </code>
                        <button
                            type="button"
                            onClick={() => copiar(nueva)}
                            className="flex-none rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                        >
                            Copiar
                        </button>
                    </div>
                    <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
                        Guárdala como una contraseña. Si se pierde o alguien que no debe la tiene, anúlala y crea otra.
                    </p>
                    <button type="button" onClick={() => setNueva(null)} className="mt-2 text-xs font-semibold text-amber-800 hover:underline dark:text-amber-300">
                        Ya la guardé
                    </button>
                </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
                <input
                    type="text"
                    value={nombre}
                    maxLength={60}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Para qué es (ej. Página web)"
                    data-testid="clave-nombre"
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
                />
                <button
                    type="button"
                    onClick={crear}
                    disabled={creando}
                    data-testid="clave-crear"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                    <Icon icon={creando ? 'eos-icons:loading' : 'solar:key-bold-duotone'} width={16} className={creando ? 'animate-spin' : ''} />
                    Crear clave
                </button>
            </div>

            {claves === null ? (
                <p className="text-xs text-gray-400">Cargando…</p>
            ) : claves.length === 0 ? (
                <p className="text-xs text-gray-400" data-testid="claves-vacio">Todavía no tienes claves.</p>
            ) : (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-slate-800 dark:border-slate-800">
                    {claves.map((c) => (
                        <li key={c.id} className="flex items-center gap-3 px-3 py-2.5" data-testid={`clave-${c.id}`}>
                            <Icon icon="solar:key-minimalistic-2-bold-duotone" width={18} className="flex-none text-violet-500" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{c.nombre || 'Sin nombre'}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    <code>{c.prefijo}…{c.ultimosCuatro}</code> · creada {fecha(c.creadoEn)} · último uso {fecha(c.ultimoUsoEn)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAnular(c)}
                                data-testid={`clave-anular-${c.id}`}
                                className="flex-none rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                                Anular
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <details className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 dark:bg-slate-900 dark:text-gray-300">
                <summary className="cursor-pointer font-bold">Para tu programador</summary>
                <div className="mt-2 space-y-2">
                    <p>
                        Dirección: <code className="break-all">{base}</code>
                    </p>
                    <ul className="list-disc space-y-0.5 pl-5">
                        <li><code>GET /products</code>: productos con precio, fotos, stock por sede y variantes. Filtros: <code>search</code>, <code>category_id</code>, <code>location_id</code>, <code>published=true</code>, <code>limit</code>, <code>cursor</code>.</li>
                        <li><code>GET /products/:id</code>: un producto.</li>
                        <li><code>GET /locations</code>: tus sedes.</li>
                        <li><code>GET /categories</code>: tus categorías.</li>
                    </ul>
                    <div className="flex items-start gap-2">
                        <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-white p-2 text-[11px] dark:bg-[#0A0D14]">{ejemplo}</pre>
                        <button type="button" onClick={() => copiar(ejemplo)} className="flex-none text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400">
                            Copiar
                        </button>
                    </div>
                    <p>Las fotos tienen una dirección fija que puedes poner directo en tu web.</p>
                </div>
            </details>

            <ModalConfirm
                isOpenModal={!!anular}
                setIsOpenModal={(v) => !v && setAnular(null)}
                confirmSubmit={confirmarAnular}
                title="Anular clave"
                information={`"${anular?.nombre || 'Sin nombre'}" dejará de funcionar ahora mismo. Lo que la use (tu web, tu sistema) dejará de ver tus productos hasta que le pongas una clave nueva.`}
                confirmText="Anular"
                confirmLoading={anulando}
            />
        </div>
    )
}
