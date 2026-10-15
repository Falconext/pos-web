import React from 'react';
import { Icon } from '@iconify/react';
import Select from '@/components/Select';
import {
    useCobrosViewModel,
    periodosRecientes,
    infoEstado,
    infoMedio,
    ESTADOS_COBRO,
    MEDIOS_PAGO,
    type Cobro,
} from '@/features/admin/sistema/useCobrosViewModel';

/**
 * Bandeja de mensualidades de los clientes directos.
 *
 * La pantalla contesta tres preguntas en ese orden: cuánto entró este mes,
 * quién falta, y qué hago con el que falta. Por eso arriba van los montos,
 * al medio el filtro por estado, y la acción de cobrar vive en cada fila.
 */

const fmt = (n: number | string) =>
    `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fecha = (v?: string | null) =>
    v ? new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const nombrePeriodo = (p: string) => {
    const [y, m] = p.split('-').map(Number);
    if (!y || !m) return p;
    return new Date(y, m - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
};

/** Días que pasaron desde el vencimiento. Se dice el hecho ("venció hace 4
 *  días") y no cuántos de gracia quedan: ese número lo decide el backend por
 *  entorno, y repetirlo acá sería una segunda verdad que se desincroniza. */
const diasVencido = (iso: string) => {
    const dif = Date.now() - new Date(iso).getTime();
    return Math.floor(dif / 86400000);
};

// ── Tarjeta de monto ───────────────────────────────────────────────────────────

function MontoCard({
    label, monto, empresas, icon, color, clsTexto, destacada,
}: {
    label: string; monto: number; empresas: number; icon: string;
    color: string; clsTexto: string; destacada?: boolean;
}) {
    return (
        <div
            className={`bg-white dark:bg-[#111827] rounded-2xl border p-4 shadow-sm transition-colors ${destacada
                ? 'border-emerald-200 dark:border-emerald-500/30'
                : 'border-gray-100 dark:border-slate-800'
                }`}
        >
            <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '1F' }}>
                    <Icon icon={icon} width={17} className={clsTexto} aria-hidden="true" />
                </div>
            </div>
            <p className={`text-2xl font-black leading-none tabular-nums tracking-tight ${clsTexto}`}>
                {fmt(monto)}
            </p>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1.5">
                {empresas} {empresas === 1 ? 'empresa' : 'empresas'}
            </p>
        </div>
    );
}

// ── Insignia de estado ─────────────────────────────────────────────────────────

function Estado({ valor }: { valor: string }) {
    const e = infoEstado(valor);
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${e.clsTexto}`}
            style={{ backgroundColor: e.color + '18' }}
        >
            <Icon icon={e.icon} width={13} aria-hidden="true" />
            {e.label}
        </span>
    );
}

// ── Fila de la tabla (escritorio) ──────────────────────────────────────────────

function Fila({ cobro, onCobrar }: { cobro: Cobro; onCobrar: (c: Cobro) => void }) {
    const vencido = cobro.estado === 'PENDIENTE' && diasVencido(cobro.fechaVencimiento) > 0;
    const dias = diasVencido(cobro.fechaVencimiento);
    const medio = infoMedio(cobro.medioPago);

    return (
        <tr className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
            <td className="px-5 py-3.5">
                <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                    {cobro.empresa?.razonSocial ?? `Empresa #${cobro.id}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums">RUC {cobro.empresa?.ruc ?? '—'}</p>
            </td>
            <td className="px-5 py-3.5">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{cobro.planNombre ?? '—'}</span>
            </td>
            <td className="px-5 py-3.5 text-right">
                <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                    {fmt(cobro.monto)}
                </span>
            </td>
            <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">{fecha(cobro.fechaVencimiento)}</span>
                {vencido && (
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        Venció hace {dias} {dias === 1 ? 'día' : 'días'}
                    </p>
                )}
            </td>
            <td className="px-5 py-3.5">
                <Estado valor={cobro.estado} />
                {cobro.estado === 'APLICADO' && cobro.medioPago && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Icon icon={medio.icon} width={11} aria-hidden="true" />
                        {medio.label}
                        {cobro.referencia ? ` · ${cobro.referencia}` : ''}
                    </p>
                )}
            </td>
            <td className="px-5 py-3.5 text-right">
                {cobro.estado === 'PENDIENTE' || cobro.estado === 'RECHAZADO' ? (
                    <button
                        onClick={() => onCobrar(cobro)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
                    >
                        <Icon icon="solar:hand-money-bold-duotone" width={14} aria-hidden="true" />
                        Registrar pago
                    </button>
                ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{fecha(cobro.fechaCobro)}</span>
                )}
            </td>
        </tr>
    );
}

// ── Tarjeta (móvil) ────────────────────────────────────────────────────────────

function Tarjeta({ cobro, onCobrar }: { cobro: Cobro; onCobrar: (c: Cobro) => void }) {
    const dias = diasVencido(cobro.fechaVencimiento);
    const vencido = cobro.estado === 'PENDIENTE' && dias > 0;
    return (
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 last:border-0">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white leading-tight truncate">
                        {cobro.empresa?.razonSocial ?? `Empresa #${cobro.id}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums">
                        RUC {cobro.empresa?.ruc ?? '—'} · {cobro.planNombre ?? 'Plan'}
                    </p>
                </div>
                <span className="text-base font-black text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                    {fmt(cobro.monto)}
                </span>
            </div>
            <div className="flex items-center justify-between gap-3 mt-3">
                <div>
                    <Estado valor={cobro.estado} />
                    <p className={`text-[11px] mt-1 ${vencido ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {vencido ? `Venció hace ${dias} ${dias === 1 ? 'día' : 'días'}` : `Vence ${fecha(cobro.fechaVencimiento)}`}
                    </p>
                </div>
                {(cobro.estado === 'PENDIENTE' || cobro.estado === 'RECHAZADO') && (
                    <button
                        onClick={() => onCobrar(cobro)}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                        <Icon icon="solar:hand-money-bold-duotone" width={15} aria-hidden="true" />
                        Registrar pago
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Modal: registrar pago ──────────────────────────────────────────────────────

function ModalPago({ vm }: { vm: ReturnType<typeof useCobrosViewModel> }) {
    const cobro = vm.cobroAPagar;
    if (!cobro) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-pago">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={vm.cerrarPago} />
            <div className="relative bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                    <div>
                        <h3 id="titulo-pago" className="text-base font-bold text-gray-900 dark:text-white">Registrar pago</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[18rem]">
                            {cobro.empresa?.razonSocial} · {nombrePeriodo(cobro.periodo)}
                        </p>
                    </div>
                    <button
                        onClick={vm.cerrarPago}
                        aria-label="Cerrar"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    >
                        <Icon icon="solar:close-bold" width={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Medio de pago: botones y no un desplegable — son seis y el que
                        registra ya sabe cuál antes de abrir el modal. */}
                    <div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 block">Medio de pago</span>
                        <div className="grid grid-cols-3 gap-2">
                            {MEDIOS_PAGO.map((m) => {
                                const activo = vm.formPago.medioPago === m.value;
                                return (
                                    <button
                                        key={m.value}
                                        onClick={() => vm.setFormPago({ ...vm.formPago, medioPago: m.value })}
                                        aria-pressed={activo}
                                        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#111827] ${activo
                                            ? 'border-transparent text-white'
                                            : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
                                            }`}
                                        style={activo ? { backgroundColor: m.color } : undefined}
                                    >
                                        <Icon icon={m.icon} width={18} aria-hidden="true" />
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="pago-monto" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                                Monto
                            </label>
                            <input
                                id="pago-monto"
                                type="number"
                                step="0.01"
                                min="0"
                                value={vm.formPago.monto}
                                onChange={(e) => vm.setFormPago({ ...vm.formPago, monto: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                            />
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Emitido: {fmt(cobro.monto)}</p>
                        </div>
                        <div>
                            <label htmlFor="pago-fecha" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                                Fecha de pago
                            </label>
                            <input
                                id="pago-fecha"
                                type="date"
                                value={vm.formPago.fechaCobro}
                                onChange={(e) => vm.setFormPago({ ...vm.formPago, fechaCobro: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="pago-ref" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                            N.° de operación <span className="font-medium normal-case text-gray-400">(opcional)</span>
                        </label>
                        <input
                            id="pago-ref"
                            value={vm.formPago.referencia}
                            onChange={(e) => vm.setFormPago({ ...vm.formPago, referencia: e.target.value })}
                            placeholder="Ej. 00123456"
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                        />
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                            Queda guardado junto al pago para poder conciliarlo después.
                        </p>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/40 px-3.5 py-3">
                        <Icon icon="solar:info-circle-bold" width={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                            Al registrarlo se extiende la suscripción desde su vencimiento, la cuenta vuelve a estar
                            activa y el monto entra a Finanzas del sistema.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/40">
                    <button
                        onClick={vm.cerrarPago}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => void vm.confirmarPago()}
                        disabled={vm.guardando}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
                    >
                        <Icon icon={vm.guardando ? 'eos-icons:loading' : 'solar:check-circle-bold'} width={17} aria-hidden="true" />
                        {vm.guardando ? 'Registrando…' : 'Confirmar pago'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Cargar un pago de un mes pasado ────────────────────────────────────────────

/**
 * El historial de cada empresa arranca vacío: las renovaciones de años
 * anteriores se cobraron por Yape y no quedaron registradas. Esto deja
 * anotarlas hacia atrás.
 *
 * No mueve la fecha de vencimiento — ese mes ya se consumió. Cargar un año de
 * historial no puede regalarle un año de sistema al cliente.
 */
function ModalHistorico({ vm }: { vm: ReturnType<typeof useCobrosViewModel> }) {
    if (!vm.showHistorico) return null;
    const f = vm.formHistorico;
    const set = (campo: string, valor: string) => vm.setFormHistorico({ ...f, [campo]: valor });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-historico">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => vm.setShowHistorico(false)} />
            <div className="relative bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                    <div>
                        <h3 id="titulo-historico" className="text-base font-bold text-gray-900 dark:text-white">Cargar pago al historial</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Para anotar mensualidades que ya se cobraron</p>
                    </div>
                    <button
                        onClick={() => vm.setShowHistorico(false)}
                        aria-label="Cerrar"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
                    >
                        <Icon icon="solar:close-bold" width={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="hist-empresa" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">Empresa</label>
                        <select
                            id="hist-empresa"
                            value={f.empresaId}
                            onChange={(e) => set('empresaId', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        >
                            <option value="">Elige una empresa…</option>
                            {vm.empresas.map((e) => (
                                <option key={e.id} value={e.id}>{e.razonSocial}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="hist-periodo" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">Mes cobrado</label>
                            <input
                                id="hist-periodo"
                                type="month"
                                value={f.periodo}
                                onChange={(e) => set('periodo', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="hist-monto" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">Monto</label>
                            <input
                                id="hist-monto"
                                type="number"
                                step="0.01"
                                min="0"
                                value={f.monto}
                                onChange={(e) => set('monto', e.target.value)}
                                placeholder="99.90"
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="hist-fecha" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">Fecha del pago</label>
                            <input
                                id="hist-fecha"
                                type="date"
                                value={f.fechaCobro}
                                onChange={(e) => set('fechaCobro', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="hist-medio" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">Medio</label>
                            <select
                                id="hist-medio"
                                value={f.medioPago}
                                onChange={(e) => set('medioPago', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            >
                                {MEDIOS_PAGO.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="hist-ref" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                            N.° de operación <span className="font-medium normal-case text-gray-500 dark:text-gray-400">(opcional)</span>
                        </label>
                        <input
                            id="hist-ref"
                            value={f.referencia}
                            onChange={(e) => set('referencia', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 px-3.5 py-3">
                        <Icon icon="solar:info-circle-bold" width={16} className="text-gray-500 dark:text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            Esto <strong className="font-bold">no cambia la fecha de vencimiento</strong>: ese mes ya pasó.
                            Solo queda anotado en el historial de la empresa y en los ingresos del sistema.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/40">
                    <button
                        onClick={() => vm.setShowHistorico(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => void vm.guardarHistorico()}
                        disabled={vm.guardando}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-violet-600/20 transition-colors cursor-pointer"
                    >
                        <Icon icon={vm.guardando ? 'eos-icons:loading' : 'solar:archive-check-bold'} width={16} aria-hidden="true" />
                        {vm.guardando ? 'Guardando…' : 'Cargar al historial'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Confirmación de las acciones que salen del sistema ─────────────────────────

/**
 * Las dos acciones del encabezado no son "refrescar": una le manda una
 * notificación a cada empresario y la otra puede suspender cuentas reales.
 * Estaban a un clic y sin red — esto obliga a leer qué va a pasar antes.
 */
function ModalConfirmar({
    accion, onCancelar, onConfirmar, procesando,
}: {
    accion: 'emitir' | 'vencidos' | null;
    onCancelar: () => void;
    onConfirmar: () => void;
    procesando: boolean;
}) {
    if (!accion) return null;
    const emitir = accion === 'emitir';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmar">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancelar} />
            <div className="relative bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 pt-6 pb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${emitir ? 'bg-violet-500/15' : 'bg-red-500/15'}`}>
                        <Icon
                            icon={emitir ? 'solar:bill-check-bold-duotone' : 'solar:danger-triangle-bold'}
                            width={22}
                            className={emitir ? 'text-violet-600 dark:text-violet-400' : 'text-red-600 dark:text-red-400'}
                            aria-hidden="true"
                        />
                    </div>
                    <h3 id="titulo-confirmar" className="text-base font-bold text-gray-900 dark:text-white">
                        {emitir ? '¿Emitir las mensualidades del ciclo?' : '¿Procesar las cuentas vencidas?'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                        {emitir ? (
                            <>
                                Se creará el cobro del mes para cada empresa que esté por vencer y{' '}
                                <strong className="font-bold text-gray-900 dark:text-white">
                                    le llegará una notificación a cada empresario
                                </strong>{' '}
                                con el monto. No cobra nada por sí solo, y no duplica los que ya están emitidos.
                            </>
                        ) : (
                            <>
                                A las que están dentro del plazo se les enviará un recordatorio. A las que ya lo
                                agotaron{' '}
                                <strong className="font-bold text-red-700 dark:text-red-400">
                                    se les suspenderá el acceso al sistema
                                </strong>
                                .
                            </>
                        )}
                    </p>
                </div>
                <div className="flex gap-2 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/40">
                    <button
                        onClick={onCancelar}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirmar}
                        disabled={procesando}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${emitir
                            ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20'
                            : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                            }`}
                    >
                        <Icon icon={procesando ? 'eos-icons:loading' : 'solar:check-circle-bold'} width={16} aria-hidden="true" />
                        {procesando ? 'Procesando…' : emitir ? 'Sí, emitir' : 'Sí, procesar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function CobrosPage() {
    const vm = useCobrosViewModel();
    // Qué acción está esperando confirmación (null = ninguna).
    const [confirmar, setConfirmar] = React.useState<'emitir' | 'vencidos' | null>(null);

    const ejecutarConfirmado = async () => {
        const accion = confirmar;
        if (!accion) return;
        if (accion === 'emitir') await vm.emitirMensualidades();
        else await vm.procesarVencidos();
        setConfirmar(null);
    };
    const r = vm.resumen;
    const totalMes =
        (r?.cobrado.monto ?? 0) + (r?.pendiente.monto ?? 0) + (r?.noPagado.monto ?? 0);
    const avance = totalMes > 0 ? ((r?.cobrado.monto ?? 0) / totalMes) * 100 : 0;

    return (
        <div className="space-y-5 max-w-8xl px-2 mx-auto pb-10">

            {/* ── Encabezado ── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Icon icon="solar:bill-list-bold-duotone" className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        Cobros
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Mensualidades de las empresas que pagan directo. Los clientes de reseller se cobran del saldo de su distribuidor.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setConfirmar('emitir')}
                        disabled={vm.procesando !== null}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-violet-600/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0A0D14]"
                        title="Emite las mensualidades del ciclo (lo mismo que hace el proceso diario)"
                    >
                        <Icon icon={vm.procesando === 'emitir' ? 'eos-icons:loading' : 'solar:bill-check-bold-duotone'} width={17} aria-hidden="true" />
                        Emitir mensualidades
                    </button>
                    <button
                        onClick={() => void vm.abrirHistorico()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#111827] hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                        title="Anotar una mensualidad que ya se cobró en el pasado"
                    >
                        <Icon icon="solar:archive-up-bold-duotone" width={17} aria-hidden="true" />
                        Cargar pago anterior
                    </button>
                    <button
                        onClick={() => setConfirmar('vencidos')}
                        disabled={vm.procesando !== null}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#111827] hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-60 text-gray-700 dark:text-gray-200 text-sm font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                        title="Avisa a los que están en gracia y suspende a los que ya la agotaron"
                    >
                        <Icon icon={vm.procesando === 'vencidos' ? 'eos-icons:loading' : 'solar:alarm-bold-duotone'} width={17} aria-hidden="true" />
                        Procesar vencidos
                    </button>
                </div>
            </div>

            {/* ── Montos del periodo ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <MontoCard label="Cobrado" monto={r?.cobrado.monto ?? 0} empresas={r?.cobrado.empresas ?? 0} icon="solar:wallet-money-bold-duotone" color="#10B981" clsTexto="text-emerald-700 dark:text-emerald-400" destacada />
                <MontoCard label="Por cobrar" monto={r?.pendiente.monto ?? 0} empresas={r?.pendiente.empresas ?? 0} icon="solar:clock-circle-bold-duotone" color="#F59E0B" clsTexto="text-amber-700 dark:text-amber-400" />
                <MontoCard label="No pagado" monto={r?.noPagado.monto ?? 0} empresas={r?.noPagado.empresas ?? 0} icon="solar:close-circle-bold-duotone" color="#EF4444" clsTexto="text-red-700 dark:text-red-400" />

                {/* Avance del mes: la barra responde "¿vamos bien?" de un vistazo, que
                    es lo que el dueño mira antes que cualquier fila de la tabla. */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avance del mes</span>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10 shrink-0">
                            <Icon icon="solar:chart-2-bold-duotone" width={17} className="text-violet-500" aria-hidden="true" />
                        </div>
                    </div>
                    <p className="text-2xl font-black leading-none tabular-nums tracking-tight text-gray-900 dark:text-white">
                        {avance.toFixed(0)}%
                    </p>
                    <div
                        className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-slate-800 mt-2.5 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={Math.round(avance)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Porcentaje cobrado del mes"
                    >
                        <div
                            className="h-full rounded-full bg-emerald-500 motion-safe:transition-[width] motion-safe:duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, avance))}%` }}
                        />
                    </div>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1.5 tabular-nums">de {fmt(totalMes)} emitidos</p>
                </div>
            </div>

            {/* ── Filtros ── */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 px-4 py-3 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="w-full lg:w-52 shrink-0">
                        <Select
                            label=""
                            name="periodo"
                            options={periodosRecientes()}
                            value={nombrePeriodo(vm.periodo)}
                            onChange={(id: any) => vm.setPeriodo(String(id))}
                            error=""
                            readOnly
                        />
                    </div>

                    {/* Chips de estado con su conteo: filtran y a la vez dicen cómo
                        está repartido el mes, sin abrir un desplegable. */}
                    <div className="flex items-center gap-1.5 flex-wrap flex-1">
                        <button
                            onClick={() => vm.setEstado('')}
                            aria-pressed={vm.estado === ''}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${vm.estado === ''
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            Todos
                        </button>
                        {ESTADOS_COBRO.map((e) => {
                            const activo = vm.estado === e.value;
                            const n = vm.conteoPorEstado[e.value] ?? 0;
                            return (
                                <button
                                    key={e.value}
                                    onClick={() => vm.setEstado(activo ? '' : e.value)}
                                    aria-pressed={activo}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#111827]"
                                    style={{
                                        backgroundColor: activo ? e.color : e.color + '14',
                                        color: activo ? '#fff' : e.color,
                                    }}
                                >
                                    <Icon icon={e.icon} width={13} aria-hidden="true" />
                                    {e.label}
                                    {!vm.estado && n > 0 && (
                                        <span className="tabular-nums opacity-70">{n}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full lg:w-64 shrink-0">
                        <Icon icon="solar:magnifer-linear" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
                        <input
                            value={vm.busqueda}
                            onChange={(e) => vm.setBusqueda(e.target.value)}
                            placeholder="Buscar empresa, RUC o plan…"
                            aria-label="Buscar empresa, RUC o plan"
                            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
                        />
                        {vm.busqueda && (
                            <button
                                onClick={() => vm.setBusqueda('')}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <Icon icon="solar:close-circle-bold" width={15} aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => void vm.cargar()}
                        aria-label="Actualizar"
                        title="Actualizar"
                        className="min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 lg:p-2.5 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    >
                        <Icon icon="solar:refresh-bold" width={16} className={vm.cargando ? 'motion-safe:animate-spin' : ''} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* ── Lista ── */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/30">
                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 capitalize">
                        <Icon icon="solar:calendar-bold-duotone" width={16} className="text-gray-400" aria-hidden="true" />
                        {nombrePeriodo(vm.periodo)}
                        <span className="px-2 py-0.5 rounded-full bg-gray-200/70 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-black tabular-nums">
                            {vm.cobros.length}
                        </span>
                    </h2>
                </div>

                {vm.cargando ? (
                    <div className="divide-y divide-gray-50 dark:divide-slate-800">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 px-5 py-4 motion-safe:animate-pulse">
                                <div className="h-9 flex-1 rounded-lg bg-gray-100 dark:bg-slate-800" />
                                <div className="h-9 w-24 rounded-lg bg-gray-100 dark:bg-slate-800" />
                                <div className="h-9 w-28 rounded-lg bg-gray-100 dark:bg-slate-800" />
                            </div>
                        ))}
                    </div>
                ) : vm.cobros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <Icon icon="solar:bill-check-bold-duotone" width={52} className="text-gray-300 dark:text-slate-700 mb-3" aria-hidden="true" />
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                            {vm.totalSinFiltrar === 0
                                ? 'No hay mensualidades emitidas en este periodo'
                                : 'Ninguna coincide con el filtro'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                            {vm.totalSinFiltrar === 0
                                ? 'Se emiten solas unos días antes de cada vencimiento. También puedes emitirlas ahora con el botón de arriba.'
                                : 'Prueba quitando el filtro de estado o limpiando la búsqueda.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Escritorio */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-800">
                                        <th scope="col" className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Empresa</th>
                                        <th scope="col" className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                                        <th scope="col" className="text-right px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                                        <th scope="col" className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vence</th>
                                        <th scope="col" className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th scope="col" className="text-right px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                    {vm.cobros.map((c) => (
                                        <Fila key={c.id} cobro={c} onCobrar={vm.abrirPago} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Móvil */}
                        <div className="md:hidden">
                            {vm.cobros.map((c) => (
                                <Tarjeta key={c.id} cobro={c} onCobrar={vm.abrirPago} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <ModalPago vm={vm} />
            <ModalHistorico vm={vm} />
            <ModalConfirmar
                accion={confirmar}
                onCancelar={() => setConfirmar(null)}
                onConfirmar={() => void ejecutarConfirmado()}
                procesando={vm.procesando !== null}
            />
        </div>
    );
}
