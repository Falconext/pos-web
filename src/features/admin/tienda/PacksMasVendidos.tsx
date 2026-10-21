import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { get } from '@/utils/fetch';
import { useAuthStore } from '@/zustand/auth';
import { useEmpresasStore } from '@/zustand/empresas';
import { useSedesStore } from '@/zustand/sedes';
import useAlertStore from '@/zustand/alert';
import { InventoryCard } from '@/features/admin/kardex/shared/InventoryChrome';
import { RANGOS_PACKS, fechasDeRango, type RangoPacks } from './rangoPacks';

interface PackVendido {
    comboId: number;
    nombre: string;
    imagenUrl: string | null;
    activo: boolean;
    precioCombo: number;
    cantidad: number;
    total: number;
    ventas: number;
    ultimaVenta: string | null;
    participacion: number;
}

interface RespuestaPacks {
    kitsComoUnaLinea: boolean;
    totalPacks: number;
    totalVendido: number;
    packs: PackVendido[];
}

const soles = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const cantidad = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const fechaCorta = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'short' }) : '—';

/**
 * Ranking de packs (kits) vendidos. Responde "cuál de mis packs se vende más"
 * — los reportes de productos solo cuentan los insumos sueltos.
 */
export default function PacksMasVendidos() {
    const { auth } = useAuthStore();
    const esAdmin = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA';
    const { sedes, listarSedes } = useSedesStore();
    const [rango, setRango] = useState<RangoPacks>('mes');
    const [sedeId, setSedeId] = useState<string>('');
    const [data, setData] = useState<RespuestaPacks | null>(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activando, setActivando] = useState(false);

    useEffect(() => {
        if (esAdmin && sedes.length === 0) listarSedes();
    }, [esAdmin, sedes.length, listarSedes]);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        const { fechaInicio, fechaFin } = fechasDeRango(rango);
        const qs = new URLSearchParams({ fechaInicio, fechaFin, ...(sedeId ? { sedeId } : {}) });
        const r = await get<RespuestaPacks>(`dashboard/packs-mas-vendidos?${qs.toString()}`);
        if (r.success && r.data) setData(r.data);
        else setError(r.error || 'No se pudo cargar el reporte');
        setCargando(false);
    }, [rango, sedeId]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const activarUnaLinea = async () => {
        if (activando) return;
        try {
            setActivando(true);
            await useEmpresasStore.getState().actualizarMiEmpresa({ kitsComoUnaLinea: true } as any);
            useAuthStore.setState((state) => ({
                auth: state.auth ? { ...state.auth, empresa: { ...(state.auth as any).empresa, kitsComoUnaLinea: true } } : state.auth,
            }));
            setData((d) => (d ? { ...d, kitsComoUnaLinea: true } : d));
            useAlertStore.getState().alert('Listo: desde ahora cada pack vendido se cuenta aquí', 'success');
        } catch (e: any) {
            useAlertStore.getState().alert(e?.response?.data?.message || e?.message || 'No se pudo activar', 'error');
        } finally {
            setActivando(false);
        }
    };

    const sedesActivas = sedes.filter((s: any) => s.activo !== false);
    const maxCantidad = Math.max(1, ...(data?.packs ?? []).map((p) => p.cantidad));
    const vendidos = (data?.packs ?? []).filter((p) => p.cantidad > 0);
    const sinVentas = (data?.packs ?? []).filter((p) => p.cantidad <= 0);

    return (
        <InventoryCard className="mb-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3f1ff] text-[#6A5AF9] dark:bg-indigo-950/50 dark:text-indigo-300">
                        <Icon icon="solar:cup-star-bold-duotone" width={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Packs más vendidos</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Cuántas veces se vendió cada pack, no solo sus productos.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {RANGOS_PACKS.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => setRango(r.id)}
                            className={`h-9 rounded-xl border px-3 text-xs font-black transition-colors ${
                                rango === r.id
                                    ? 'border-[#d5d0ff] bg-[#f3f1ff] text-[#6A5AF9] dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-300'
                                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                    {esAdmin && sedesActivas.length > 1 && (
                        <select
                            value={sedeId}
                            onChange={(e) => setSedeId(e.target.value)}
                            aria-label="Sede"
                            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
                        >
                            <option value="">Todas las sedes</option>
                            {sedesActivas.map((s: any) => (
                                <option key={s.id} value={String(s.id)}>{s.nombre}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {data && !data.kitsComoUnaLinea && (
                <div className="mx-5 mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200 sm:flex-row sm:items-center">
                    <Icon icon="solar:danger-triangle-bold-duotone" width={22} className="shrink-0 text-amber-500" />
                    <p className="flex-1">
                        Hoy, al vender un pack en el punto de venta se <strong>desarma en sus productos</strong> y no queda registrado qué pack fue.
                        Para contarlos, haz que el pack entre como <strong>una sola línea</strong> (el stock de cada producto se sigue descontando igual).
                        Se cuentan las ventas desde que lo actives.
                    </p>
                    {esAdmin ? (
                        <button
                            type="button"
                            onClick={activarUnaLinea}
                            disabled={activando}
                            className="h-9 shrink-0 rounded-xl bg-amber-500 px-4 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-60"
                        >
                            {activando ? 'Activando…' : 'Activar'}
                        </button>
                    ) : (
                        <span className="text-xs font-semibold">Pídele al administrador que lo active en Perfil → Configuración.</span>
                    )}
                </div>
            )}

            <div className="p-5">
                {error ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                        <span>{error}</span>
                        <button type="button" onClick={cargar} className="text-xs font-black underline">Reintentar</button>
                    </div>
                ) : cargando && !data ? (
                    <div className="flex h-24 items-center justify-center"><Icon icon="eos-icons:loading" className="h-8 w-8 text-slate-300" /></div>
                ) : data && data.packs.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Todavía no tienes packs creados.</p>
                ) : data ? (
                    <div className={cargando ? 'opacity-60 transition-opacity' : ''}>
                        <div className="mb-4 flex flex-wrap gap-3">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Packs vendidos</p>
                                <p className="text-xl font-black tabular-nums text-slate-900 dark:text-white" data-testid="packs-total">{cantidad(data.totalPacks)}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vendido en packs</p>
                                <p className="text-xl font-black tabular-nums text-slate-900 dark:text-white">{soles(data.totalVendido)}</p>
                            </div>
                        </div>

                        {vendidos.length === 0 ? (
                            <p className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                Ningún pack vendido en este periodo.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] text-sm">
                                    <thead>
                                        <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="w-10 pb-2">#</th>
                                            <th className="pb-2">Pack</th>
                                            <th className="pb-2 text-right">Vendidos</th>
                                            <th className="pb-2 text-right">Ventas</th>
                                            <th className="pb-2 text-right">Total</th>
                                            <th className="w-40 pb-2 pl-4">Participación</th>
                                            <th className="pb-2 text-right">Última venta</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendidos.map((p, i) => (
                                            <tr key={p.comboId} className="border-t border-slate-100 dark:border-slate-800" data-testid="pack-fila">
                                                <td className="py-3 font-black text-slate-400">{i + 1}</td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                                                            {p.imagenUrl ? (
                                                                <img src={p.imagenUrl} alt="" className="h-full w-full object-contain" />
                                                            ) : (
                                                                <Icon icon="solar:bag-smile-bold-duotone" className="h-5 w-5 text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-bold text-slate-900 dark:text-white">{p.nombre}</p>
                                                            {!p.activo && <span className="text-[11px] font-semibold text-slate-400">Inactivo</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right text-base font-black tabular-nums text-slate-900 dark:text-white">{cantidad(p.cantidad)}</td>
                                                <td className="py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{p.ventas}</td>
                                                <td className="py-3 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-200">{soles(p.total)}</td>
                                                <td className="py-3 pl-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                            <div className="h-full rounded-full bg-[#6A5AF9]" style={{ width: `${(Math.max(0, p.cantidad) / maxCantidad) * 100}%` }} />
                                                        </div>
                                                        <span className="w-12 text-right text-xs font-bold tabular-nums text-slate-500">{p.participacion}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right text-xs text-slate-500 dark:text-slate-400">{fechaCorta(p.ultimaVenta)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {sinVentas.length > 0 && (
                            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                                <strong className="text-slate-700 dark:text-slate-300">Sin ventas en este periodo:</strong>{' '}
                                {sinVentas.map((p) => p.nombre).join(', ')}
                            </p>
                        )}
                    </div>
                ) : null}
            </div>
        </InventoryCard>
    );
}
