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

/**
 * `onCreada`: la pantalla "API de Krezka" la usa para dejar la clave recién
 * creada lista en su probador. `conNotas`: allá la explicación para el
 * programador tiene su propia sección, así que se oculta acá.
 */
export function ClavesApiCard({ onCreada, conNotas = true }: { onCreada?: (clave: string, entorno: 'test' | 'live') => void; conNotas?: boolean } = {}) {
    const { alert } = useAlertStore()
    const [claves, setClaves] = useState<ClaveApi[] | null>(null)
    const [nombre, setNombre] = useState('')
    // Por defecto, de prueba: con ella se integra sin tocar datos reales.
    const [entorno, setEntorno] = useState<'test' | 'live'>('test')
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
                await apiClient.post('/integraciones/claves-api', { nombre: nombre.trim() || undefined, entorno }),
            )
            setNueva(r.apiKey)
            onCreada?.(r.apiKey, entorno)
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
                de Krezka, siempre al día, y también crear productos y ajustar el stock. Pásale la clave a
                quien hizo tu web.
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
                <div className="flex flex-none rounded-xl bg-gray-100 p-1 dark:bg-slate-800" data-testid="clave-entorno">
                    {(['test', 'live'] as const).map((e) => (
                        <button
                            key={e}
                            type="button"
                            onClick={() => setEntorno(e)}
                            className={`rounded-lg px-3 py-1 text-xs font-bold ${entorno === e ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-gray-500'}`}
                        >
                            {e === 'test' ? 'De prueba' : 'Real'}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    // Sin esto Chrome lo llenaba con el correo de la sesión
                    // (prueba como integrador, 24-10) y la clave quedaba con
                    // ese nombre.
                    name="nombre-clave-api"
                    autoComplete="off"
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
                                <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
                                    {c.nombre || 'Sin nombre'}
                                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${c.entorno === 'test' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                                        {c.entorno === 'test' ? 'Prueba' : 'Real'}
                                    </span>
                                </p>
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

            {entorno === 'test' ? (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Con una clave <b>de prueba</b> se lee tu catálogo real, pero lo que se crea, vende o ajusta no se guarda ni va a SUNAT: la respuesta dice cómo habría quedado.
                </p>
            ) : (
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Con una clave <b>real</b> las ventas se emiten a SUNAT y el stock se mueve de verdad.
                </p>
            )}

            {conNotas && (
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
                        <li><code>POST /products</code>: crear un producto (<code>name</code>, <code>price</code> y opcionales). Lleva la cabecera <code>Idempotency-Key</code>.</li>
                        <li><code>PATCH /products/:id</code>: cambiar nombre, precio, oferta, categoría, código…</li>
                        <li><code>POST /products/:id/stock_adjustments</code>: cambiar el stock con un motivo (queda en tu kardex). Lleva <code>Idempotency-Key</code>.</li>
                        <li><code>POST /sales</code>: registrar una venta de tu web. Emite la boleta o factura igual que tu POS (baja el stock, queda en caja y va a SUNAT). Lleva <code>Idempotency-Key</code>.</li>
                        <li><code>GET /sales/:id</code>: ver si SUNAT ya la aceptó (<code>status</code>) y su PDF.</li>
                    </ul>
                    <div className="flex items-start gap-2">
                        <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-white p-2 text-[11px] dark:bg-[#0A0D14]">{ejemplo}</pre>
                        <button type="button" onClick={() => copiar(ejemplo)} className="flex-none text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400">
                            Copiar
                        </button>
                    </div>
                    <p>Las fotos tienen una dirección fija que puedes poner directo en tu web.</p>
                    <p className="pt-1 font-bold">Antes de cargar productos</p>
                    <ul className="list-disc space-y-0.5 pl-5" data-testid="avisos-programador">
                        <li><b>Tallas y colores:</b> manda <code>variant_options</code> y <code>variants</code>; el stock va en cada variante y se ajusta con el id de la variante.</li>
                        <li><b>Farmacia, botica o droguería:</b> el stock entra siempre con su lote y vencimiento (<code>batch</code>).</li>
                        <li><b>Servicios</b> (<code>type: "service"</code>): no tienen stock.</li>
                        <li><b>Paquetes</b> (six pack, caja x12): van en <code>packs</code> con su código de barras.</li>
                        <li>Cada sku y código de barras es único en tu negocio. Las categorías y marcas se crean en el panel; la API usa sus ids.</li>
                        <li>Hasta 3 fotos por producto, como URLs https; cada variante puede tener su foto (<code>image</code>). Los kits y combos se arman en el panel.</li>
                        <li><b>Stock:</b> <code>available</code> es lo que se puede vender (sin lo reservado en pedidos); usa ese y no <code>stock</code> para mostrar "agotado".</li>
                        <li><b>Ofertas con fecha:</b> <code>sale_price</code> con <code>sale_starts_on</code> y <code>sale_ends_on</code> (YYYY-MM-DD); fuera de esas fechas la oferta no aplica.</li>
                        <li>Si algo está mal, la respuesta dice qué campo (<code>param</code>) y qué hacer.</li>
                    </ul>
                    <p className="pt-1 font-bold">Antes de registrar ventas</p>
                    <ul className="list-disc space-y-0.5 pl-5" data-testid="avisos-ventas">
                        <li><b>Qué se emite:</b> con RUC sale factura; sin documento o con DNI, boleta. Para no ir a SUNAT manda <code>document_type: "sales_note"</code> (nota de venta).</li>
                        <li><b>Boletas de más de S/ 700:</b> SUNAT exige el DNI del comprador en <code>customer</code>.</li>
                        <li><b>Precio:</b> si no mandas <code>unit_price</code> (con IGV), se usa el de tu catálogo con su oferta vigente.</li>
                        <li><b>Envío:</b> va como un ítem más sin producto: <code>description</code>, <code>quantity</code> y <code>unit_price</code>.</li>
                        <li><b>Stock:</b> si falta, no se emite nada y la respuesta dice qué producto y cuánto hay. Lo reservado no se vende.</li>
                        <li><b>Tallas:</b> manda el id de la variante. <b>Farmacia:</b> sale del lote que vence primero, o del que indiques en <code>batch</code>.</li>
                        <li><b>Pago:</b> <code>payment.method</code> es <code>cash</code>, <code>card</code>, <code>yape</code>, <code>plin</code> o <code>transfer</code>. Las ventas por la API son al contado.</li>
                        <li>Manda tu número de pedido en <code>external_id</code>: si llega dos veces, la segunda se rechaza y te dice cuál venta ya se hizo.</li>
                    </ul>
                </div>
            </details>
            )}

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
