import React from 'react';
import { Icon } from '@iconify/react';
import { BRAND } from '@/lib/branding';
import useAlertStore from '@/zustand/alert';
import {
    useMiPlanViewModel,
    diasParaVencer,
    type CobroPropio,
} from '@/features/admin/suscripcion/useMiPlanViewModel';
import ElegirPlanVentas from '@/features/admin/suscripcion/ElegirPlanVentas';

/**
 * "Mi plan": lo que el empresario necesita saber de su suscripción.
 *
 * Responde tres cosas y en ese orden: hasta cuándo tengo el sistema, debo algo,
 * y qué he pagado hasta ahora. El historial importa más de lo que parece — es
 * la prueba de que pagó, y hoy esa conversación se resuelve buscando capturas
 * de Yape en WhatsApp.
 */

const fmt = (n: number | string) =>
    `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fechaLarga = (v?: string | null) =>
    v
        ? new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—';

const fechaCorta = (v?: string | null) =>
    v ? new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';

const nombrePeriodo = (p: string) => {
    const [y, m] = p.split('-').map(Number);
    if (!y || !m) return p;
    return new Date(y, m - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
};

const ESTADO_PAGO: Record<string, { label: string; cls: string; icon: string }> = {
    APLICADO: { label: 'Pagado', cls: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10', icon: 'solar:check-circle-bold' },
    PENDIENTE: { label: 'Pendiente', cls: 'text-amber-700 dark:text-amber-400 bg-amber-500/10', icon: 'solar:clock-circle-bold' },
    RECHAZADO: { label: 'No pagado', cls: 'text-red-700 dark:text-red-400 bg-red-500/10', icon: 'solar:close-circle-bold' },
    ANULADO: { label: 'Anulado', cls: 'text-gray-600 dark:text-gray-400 bg-gray-500/10', icon: 'solar:forbidden-circle-bold' },
};

const MEDIO_LABEL: Record<string, string> = {
    YAPE: 'Yape',
    PLIN: 'Plin',
    TRANSFERENCIA: 'Transferencia',
    EFECTIVO: 'Efectivo',
    MERCADO_PAGO: 'Mercado Pago',
    OTRO: 'Otro',
};

function FilaPago({ cobro }: { cobro: CobroPropio }) {
    const e = ESTADO_PAGO[cobro.estado] ?? ESTADO_PAGO.ANULADO;
    return (
        <tr className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
            <td className="px-5 py-3.5">
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{nombrePeriodo(cobro.periodo)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cobro.planNombre ?? '—'}</p>
            </td>
            <td className="px-5 py-3.5 text-right">
                <span className="font-black text-gray-900 dark:text-white tabular-nums whitespace-nowrap">{fmt(cobro.monto)}</span>
            </td>
            <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${e.cls}`}>
                    <Icon icon={e.icon} width={13} aria-hidden="true" />
                    {e.label}
                </span>
            </td>
            <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                {cobro.estado === 'APLICADO' ? (
                    <>
                        <span className="tabular-nums">{fechaCorta(cobro.fechaCobro)}</span>
                        {cobro.medioPago && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {' · '}{MEDIO_LABEL[cobro.medioPago] ?? cobro.medioPago}
                            </span>
                        )}
                        {cobro.referencia && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">Op. {cobro.referencia}</p>
                        )}
                    </>
                ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                        Vencía {fechaCorta(cobro.fechaVencimiento)}
                    </span>
                )}
            </td>
        </tr>
    );
}

export default function MiPlanPage() {
    const vm = useMiPlanViewModel();
    const { alert } = useAlertStore();

    /**
     * Activar manda a Mercado Pago (la pantalla se va). Cancelar se resuelve
     * acá mismo, así que solo este camino necesita avisar del resultado.
     */
    const manejarAutomatico = async () => {
        const activo = vm.automatico?.activo;
        if (activo && !window.confirm('¿Cancelar el pago automático? Volverás a pagar tu mensualidad manualmente.')) return;
        const r = activo ? await vm.cancelarCobroAutomatico() : await vm.activarCobroAutomatico();
        if (!r.ok) alert(r.mensaje ?? 'No se pudo completar la operación', 'error');
        else if (activo) alert('Pago automático cancelado.', 'success');
    };
    const estado = vm.estado;
    const dias = diasParaVencer(estado?.fechaExpiracion);
    const vencida = Boolean(estado?.vencida);
    const pendiente = estado?.cobroPendiente;

    const mensajeWsp = encodeURIComponent(
        `Hola, quiero coordinar el pago de mi plan ${estado?.plan?.nombre ?? ''}.`,
    );

    return (
        <div className="space-y-5 max-w-5xl px-2 mx-auto pb-10">

            <div className="pt-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Icon icon="solar:crown-bold-duotone" className="text-violet-600 dark:text-violet-400" aria-hidden="true" />
                    Mi plan
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tu suscripción a {BRAND.name}, cuándo vence y el historial de tus pagos.
                </p>
            </div>

            {vm.cargando ? (
                <div className="space-y-3">
                    <div className="h-40 rounded-2xl bg-gray-100 dark:bg-slate-800 motion-safe:animate-pulse" />
                    <div className="h-56 rounded-2xl bg-gray-100 dark:bg-slate-800 motion-safe:animate-pulse" />
                </div>
            ) : vm.error ? (
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center shadow-sm">
                    <Icon icon="solar:cloud-cross-bold-duotone" width={44} className="text-gray-300 dark:text-slate-700 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">No pudimos cargar tu plan</p>
                    <button
                        onClick={() => void vm.recargar()}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold transition-colors cursor-pointer"
                    >
                        <Icon icon="solar:refresh-bold" width={15} aria-hidden="true" />
                        Reintentar
                    </button>
                </div>
            ) : (
                <>
                    {/* ── Prueba gratis de IA de Ventas: se cierra eligiendo plan ── */}
                    {estado?.plan?.esPrueba && (
                        <ElegirPlanVentas
                            cobroAutomaticoDisponible={Boolean(vm.automatico?.disponible)}
                            activarCobroAutomatico={vm.activarCobroAutomatico}
                        />
                    )}

                    {/* ── Tarjeta principal ── */}
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className={`px-6 py-5 ${vencida
                            ? 'bg-red-50/70 dark:bg-red-950/20'
                            : 'bg-gradient-to-r from-violet-50 to-transparent dark:from-violet-500/10 dark:to-transparent'
                            }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan actual</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">
                                        {estado?.plan?.nombre ?? '—'}
                                    </p>
                                    {estado?.plan?.costo != null && (
                                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1.5 tabular-nums">
                                            {fmt(estado.plan.costo)} <span className="font-medium">al mes</span>
                                        </p>
                                    )}
                                </div>
                                <div className="sm:text-right">
                                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {vencida ? 'Venció el' : 'Activo hasta'}
                                    </p>
                                    <p className={`text-lg font-black mt-1 ${vencida ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                        {fechaLarga(estado?.fechaExpiracion)}
                                    </p>
                                    {dias !== null && (
                                        <p className={`text-xs font-bold mt-0.5 ${vencida ? 'text-red-600 dark:text-red-400' : dias <= 7 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {vencida
                                                ? estado?.enGracia
                                                    ? `Te ${estado.diasRestantes === 1 ? 'queda 1 día' : `quedan ${estado.diasRestantes} días`} de plazo`
                                                    : 'Fuera de plazo'
                                                : dias === 0
                                                    ? 'Vence hoy'
                                                    : `${dias} ${dias === 1 ? 'día restante' : 'días restantes'}`}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Barra del ciclo: en qué parte del mes está */}
                            {!vencida && (
                                <div
                                    className="h-1.5 w-full rounded-full bg-white/70 dark:bg-slate-800 mt-4 overflow-hidden"
                                    role="progressbar"
                                    aria-valuenow={Math.round(vm.avanceCiclo)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label="Avance del ciclo mensual"
                                >
                                    <div
                                        className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 ${(dias ?? 99) <= 7 ? 'bg-amber-500' : 'bg-violet-500'}`}
                                        style={{ width: `${Math.min(100, Math.max(2, vm.avanceCiclo))}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* ── Lo que debe ── */}
                        {pendiente ? (
                            <div className="px-6 py-5 border-t border-gray-100 dark:border-slate-800">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            Tienes una mensualidad por pagar
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                                            {nombrePeriodo(pendiente.periodo)} · vence el {fechaLarga(pendiente.fechaVencimiento)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                                            {fmt(pendiente.monto)}
                                        </span>
                                        <a
                                            href={`https://wa.me/${BRAND.whatsappCobranza || BRAND.whatsapp}?text=${mensajeWsp}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
                                        >
                                            <Icon icon="solar:chat-round-dots-bold" width={16} aria-hidden="true" />
                                            Coordinar pago
                                        </a>
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
                                    Escríbenos por WhatsApp para coordinar el pago. Al confirmarlo, tu plan se extiende
                                    automáticamente desde la fecha de vencimiento — no pierdes los días.
                                </p>
                            </div>
                        ) : (
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2.5">
                                <Icon icon="solar:check-circle-bold" width={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    No tienes pagos pendientes.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Débito automático ── */}
                    {vm.automatico?.disponible && !estado?.plan?.esPrueba && (
                        <div className={`rounded-2xl border shadow-sm overflow-hidden ${vm.automatico.activo
                            ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-950/20'
                            : 'border-gray-100 bg-white dark:border-slate-800 dark:bg-[#111827]'
                            }`}>
                            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${vm.automatico.activo ? 'bg-emerald-500/15' : 'bg-sky-500/15'}`}>
                                    <Icon
                                        icon={vm.automatico.activo ? 'solar:check-circle-bold-duotone' : 'solar:card-bold-duotone'}
                                        width={22}
                                        className={vm.automatico.activo ? 'text-emerald-700 dark:text-emerald-400' : 'text-sky-700 dark:text-sky-400'}
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {vm.automatico.activo ? 'Pago automático activo' : 'Activa el pago automático'}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                        {vm.automatico.activo
                                            ? 'Tu mensualidad se cobra sola cada mes con Mercado Pago. Puedes cancelarlo cuando quieras.'
                                            : 'Autorizas una sola vez con Mercado Pago y tu mensualidad se paga sola cada mes. Puedes usar tarjeta, dinero en cuenta o Yape, y cancelar cuando quieras.'}
                                    </p>
                                    {!vm.automatico.activo && vm.automatico.estadoPasarela === 'pending' && (
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1.5">
                                            Quedó pendiente de autorizar en Mercado Pago.
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => void manejarAutomatico()}
                                    disabled={vm.activando}
                                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827] ${vm.automatico.activo
                                        ? 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 focus-visible:ring-gray-400'
                                        : 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 focus-visible:ring-sky-500'
                                        }`}
                                >
                                    <Icon
                                        icon={vm.activando ? 'eos-icons:loading' : vm.automatico.activo ? 'solar:close-circle-bold' : 'solar:card-bold'}
                                        width={16}
                                        aria-hidden="true"
                                    />
                                    {vm.activando
                                        ? 'Un momento…'
                                        : vm.automatico.activo
                                            ? 'Cancelar'
                                            : 'Activar pago automático'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Resumen de lo pagado ── */}
                    {vm.mesesPagados > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
                                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Meses pagados</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1 tabular-nums">{vm.mesesPagados}</p>
                            </div>
                            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
                                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total pagado</p>
                                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">{fmt(vm.totalPagado)}</p>
                            </div>
                        </div>
                    )}

                    {/* ── Historial ── */}
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/30">
                            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <Icon icon="solar:bill-list-bold-duotone" width={16} className="text-gray-500 dark:text-gray-400" aria-hidden="true" />
                                Historial de pagos
                            </h2>
                        </div>

                        {vm.cobros.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                                <Icon icon="solar:bill-check-bold-duotone" width={48} className="text-gray-300 dark:text-slate-700 mb-3" aria-hidden="true" />
                                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                    {estado?.clienteDesde
                                        ? `Eres cliente desde ${fechaLarga(estado.clienteDesde)}`
                                        : 'Todavía no hay pagos registrados'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                                    Tus pagos anteriores se cobraron antes de que existiera este registro. De acá en
                                    adelante vas a ver cada mensualidad con su fecha, su medio de pago y su número de
                                    operación.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-slate-800">
                                            <th scope="col" className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Periodo</th>
                                            <th scope="col" className="text-right px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                                            <th scope="col" className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                            <th scope="col" className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pago</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                        {vm.cobros.map((c) => (
                                            <FilaPago key={c.id} cobro={c} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
