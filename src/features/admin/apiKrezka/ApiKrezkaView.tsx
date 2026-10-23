import { Icon } from '@iconify/react';
import { useAuthStore } from '@/zustand/auth';
import useAlertStore from '@/zustand/alert';
import { hasPermission } from '@/utils/permissions';
import { ClavesApiCard } from '@/pages/admin/perfil/ClavesApiCard';
import { PORTAL_DESARROLLADORES, RUTAS, necesitaId, type Lenguaje, type Ruta } from './ApiKrezkaModel';
import { useApiKrezkaViewModel, type ApiKrezkaVM } from './useApiKrezkaViewModel';

const tarjeta = 'rounded-2xl border border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]';
const campo =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100';

const COLOR_METODO: Record<string, string> = {
    GET: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    POST: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const USOS = [
    { icono: 'solar:shop-2-bold-duotone', titulo: 'Tu catálogo en tu web', texto: 'Productos, precios, ofertas, fotos, tallas y stock disponible, siempre al día con Krezka.' },
    { icono: 'solar:box-bold-duotone', titulo: 'Stock sincronizado', texto: 'Crea productos y ajusta el stock desde tu sistema; todo queda en tu kardex.' },
    { icono: 'solar:bill-check-bold-duotone', titulo: 'Ventas con boleta', texto: 'Cada venta de tu web emite su boleta o factura, baja el stock y entra a caja, como en tu POS.' },
];

export default function ApiKrezkaView() {
    const { auth } = useAuthStore();
    const vm = useApiKrezkaViewModel();
    const esAdmin = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA';

    if (!hasPermission(auth as any, 'api') || !esAdmin) {
        return (
            <div className="mx-auto max-w-xl p-8 text-center" data-testid="api-sin-acceso">
                <Icon icon="solar:lock-keyhole-bold-duotone" width={40} className="mx-auto text-gray-300" />
                <p className="mt-3 text-base font-bold text-gray-700 dark:text-gray-200">La API de Krezka no está en tu plan</p>
                <p className="mt-1 text-sm text-gray-500">Solo el administrador de un negocio con el módulo "API de Krezka" puede usarla. Escríbenos para activarla.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 px-3 pb-8 pt-1 sm:px-2" data-testid="api-krezka">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                        <Icon icon="solar:code-square-bold-duotone" width={26} className="text-violet-600 dark:text-violet-300" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">API de Krezka</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Conecta tu página web o tu sistema con tu catálogo, tu stock y tus ventas.</p>
                    </div>
                </div>
                <a
                    href={PORTAL_DESARROLLADORES}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="api-portal"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900"
                >
                    <Icon icon="solar:book-2-bold-duotone" width={18} />
                    Documentación completa
                    <Icon icon="solar:arrow-right-up-linear" width={14} />
                </a>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                {USOS.map((u) => (
                    <div key={u.titulo} className={tarjeta}>
                        <Icon icon={u.icono} width={24} className="text-violet-500" />
                        <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">{u.titulo}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{u.texto}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <section className={tarjeta}>
                    <h2 className="mb-1 text-base font-black text-gray-900 dark:text-white">1. Tus claves</h2>
                    <p className="mb-4 text-xs text-gray-500">Crea una clave <b>de prueba</b> para integrar sin tocar nada; cuando todo funcione, una <b>real</b>.</p>
                    <ClavesApiCard conNotas={false} onCreada={vm.usarClave} />
                    <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs dark:bg-slate-900">
                        <p className="font-bold text-gray-700 dark:text-gray-200">Dirección de la API</p>
                        <code className="mt-1 block break-all text-gray-600 dark:text-gray-300" data-testid="api-base">{vm.base}</code>
                    </div>
                </section>

                <Probador vm={vm} />
            </div>

            <Codigo vm={vm} />

            <section className={tarjeta}>
                <h2 className="mb-3 text-base font-black text-gray-900 dark:text-white">Antes de empezar</h2>
                <div className="grid gap-4 text-xs text-gray-600 md:grid-cols-2 dark:text-gray-300">
                    <ul className="list-disc space-y-1 pl-5" data-testid="api-avisos-catalogo">
                        <li><b>Stock:</b> muestra <code>available</code> (sin lo reservado), no <code>stock</code>, para decidir si está agotado.</li>
                        <li><b>Tallas y colores:</b> cada variante tiene su id, su stock y su foto.</li>
                        <li><b>Farmacia:</b> el stock entra y sale con su lote y vencimiento (<code>batch</code>).</li>
                        <li><b>Ofertas:</b> <code>sale_price</code> solo vale entre <code>sale_starts_on</code> y <code>sale_ends_on</code>.</li>
                        <li>Hasta 3 fotos por producto; cada sku y código de barras es único.</li>
                    </ul>
                    <ul className="list-disc space-y-1 pl-5" data-testid="api-avisos-ventas">
                        <li><b>Qué se emite:</b> con RUC, factura; sin documento o con DNI, boleta; <code>sales_note</code> no va a SUNAT.</li>
                        <li><b>Boletas de más de S/ 700:</b> SUNAT exige el DNI del comprador.</li>
                        <li><b>Precio:</b> sin <code>unit_price</code> se usa el de tu catálogo con su oferta. El envío va como ítem sin producto.</li>
                        <li><b>Sin stock no se emite nada</b>, y la respuesta dice qué falta.</li>
                        <li>Manda tu número de pedido en <code>external_id</code>: si llega dos veces, la segunda se rechaza.</li>
                        <li><b>Avisos:</b> registra un webhook y tu servidor se entera solo cuando SUNAT acepta, rechaza o se anula una venta (firma en <code>Krezka-Signature</code>).</li>
                        <li><b>Anular:</b> <code>POST /sales/{'{id}'}/void</code>; una boleta aceptada se anula con su nota de crédito. <b>PDF:</b> <code>GET /sales/{'{id}'}/pdf</code>.</li>
                        <li>Cada error dice qué campo (<code>param</code>) y qué hacer.</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

function Probador({ vm }: { vm: ApiKrezkaVM }) {
    const grupos = Array.from(new Set(RUTAS.map((r) => r.grupo)));
    return (
        <section className={tarjeta} data-testid="api-probador">
            <div className="mb-1 flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-gray-900 dark:text-white">2. Pruébala aquí</h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Sandbox</span>
            </div>
            <p className="mb-4 text-xs text-gray-500">Con una clave de prueba lees tu catálogo real, y lo que crees o vendas solo se simula (<code>livemode: false</code>).</p>

            <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                <nav className="space-y-3" data-testid="api-rutas">
                    {grupos.map((g) => (
                        <div key={g}>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{g}</p>
                            {RUTAS.filter((r) => r.grupo === g).map((r) => (
                                <BotonRuta key={r.id} r={r} activa={vm.rutaId === r.id} onClick={() => vm.elegir(r.id)} />
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="min-w-0 space-y-3">
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{vm.ruta.titulo}</p>
                        <p className="text-xs text-gray-500">{vm.ruta.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-slate-900">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${COLOR_METODO[vm.ruta.metodo]}`}>{vm.ruta.metodo}</span>
                        <code className="min-w-0 flex-1 break-all text-xs text-gray-700 dark:text-gray-200" data-testid="api-url">{vm.url}</code>
                    </div>

                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">
                        Clave
                        <input
                            type="password"
                            value={vm.clave}
                            onChange={(e) => vm.setClave(e.target.value)}
                            placeholder="sk_test_…"
                            autoComplete="off"
                            data-testid="api-clave"
                            className={`${campo} mt-1 font-mono`}
                        />
                    </label>
                    {vm.escribeDeVerdad && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-300" data-testid="api-aviso-real">
                            Es una clave <b>real</b>: esto se guarda de verdad{vm.ruta.id === 'crear-venta' ? ' y la boleta va a SUNAT' : ''}. Para probar usa una clave de prueba.
                        </p>
                    )}

                    {necesitaId(vm.ruta) && (
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">
                            Id {vm.ruta.ruta.startsWith('/sales') ? 'de la venta (sale_…)' : vm.ruta.ruta.startsWith('/customers') ? 'del cliente' : vm.ruta.ruta.startsWith('/webhook') ? 'del webhook (we_…)' : 'del producto'}
                            <input value={vm.id} onChange={(e) => vm.setId(e.target.value)} data-testid="api-id" className={`${campo} mt-1 font-mono`} />
                        </label>
                    )}
                    {!vm.conCuerpo && (
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">
                            Filtros (query)
                            <input value={vm.query} onChange={(e) => vm.setQuery(e.target.value)} placeholder="search=polo&limit=10" data-testid="api-query" className={`${campo} mt-1 font-mono`} />
                        </label>
                    )}
                    {vm.conCuerpo && (
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">
                            Cuerpo (JSON)
                            <textarea
                                value={vm.cuerpo}
                                onChange={(e) => vm.setCuerpo(e.target.value)}
                                rows={9}
                                spellCheck={false}
                                data-testid="api-cuerpo"
                                className={`${campo} mt-1 font-mono text-xs`}
                            />
                        </label>
                    )}

                    <button
                        type="button"
                        onClick={vm.enviar}
                        disabled={vm.enviando}
                        data-testid="api-enviar"
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60"
                    >
                        <Icon icon={vm.enviando ? 'eos-icons:loading' : 'solar:play-bold'} width={16} className={vm.enviando ? 'animate-spin' : ''} />
                        Enviar
                    </button>
                    {vm.error && <p className="text-xs font-semibold text-red-600" data-testid="api-error">{vm.error}</p>}

                    {vm.respuesta && (
                        <div data-testid="api-respuesta">
                            <p className="mb-1 flex items-center gap-2 text-xs">
                                <span className={`rounded px-1.5 py-0.5 font-black ${vm.respuesta.estado < 300 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                    {vm.respuesta.estado}
                                </span>
                                <span className="text-gray-400">{vm.respuesta.ms} ms</span>
                            </p>
                            <pre className="max-h-96 overflow-auto rounded-xl bg-gray-950 p-3 text-[11px] leading-relaxed text-gray-100">{vm.respuesta.cuerpo}</pre>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function BotonRuta({ r, activa, onClick }: { r: Ruta; activa: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            data-testid={`api-ruta-${r.id}`}
            className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs ${activa ? 'bg-violet-50 font-bold text-violet-700 dark:bg-violet-900/20 dark:text-violet-300' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800'}`}
        >
            <span className={`w-11 flex-none rounded px-1 py-0.5 text-center text-[9px] font-black ${COLOR_METODO[r.metodo]}`}>{r.metodo}</span>
            <span className="truncate">{r.titulo}</span>
        </button>
    );
}

function Codigo({ vm }: { vm: ApiKrezkaVM }) {
    const { alert } = useAlertStore();
    const lenguajes: { id: Lenguaje; nombre: string }[] = [
        { id: 'curl', nombre: 'curl' },
        { id: 'javascript', nombre: 'JavaScript' },
        { id: 'php', nombre: 'PHP' },
    ];
    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(vm.codigo);
            alert('Código copiado', 'success');
        } catch {
            alert('No se pudo copiar: selecciónalo y cópialo a mano', 'error');
        }
    };
    return (
        <section className={tarjeta} data-testid="api-codigo">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-white">3. El código para tu web</h2>
                    <p className="text-xs text-gray-500">La misma llamada del probador ({vm.ruta.titulo.toLowerCase()}). Cambia <code>TU_CLAVE</code> por tu clave, en tu servidor.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
                        {lenguajes.map((l) => (
                            <button
                                key={l.id}
                                type="button"
                                onClick={() => vm.setLenguaje(l.id)}
                                data-testid={`api-lenguaje-${l.id}`}
                                className={`rounded-lg px-3 py-1 text-xs font-bold ${vm.lenguaje === l.id ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-gray-500'}`}
                            >
                                {l.nombre}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={copiar} className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300">
                        Copiar
                    </button>
                </div>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-gray-950 p-4 text-[12px] leading-relaxed text-gray-100" data-testid="api-codigo-texto">{vm.codigo}</pre>
            <p className="mt-2 text-[11px] text-gray-500">
                La clave nunca va en el navegador de tus clientes: úsala desde tu servidor. Guías paso a paso en{' '}
                <a href={PORTAL_DESARROLLADORES} target="_blank" rel="noopener noreferrer" className="font-bold text-violet-600 hover:underline dark:text-violet-400">
                    developers.krezka.com
                </a>
                .
            </p>
        </section>
    );
}
