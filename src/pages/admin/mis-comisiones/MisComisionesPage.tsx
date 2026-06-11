import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { get } from '@/utils/fetch';

interface Comision {
    id: number;
    comprobante: { tipoDoc: string; serie: string; correlativo: number; fechaEmision: string; mtoImpVenta?: number };
    descripcion: string | null;
    cantidad: number;
    montoComision: number;
    estado: 'PENDIENTE' | 'PAGADO';
}

interface MisComisionesData {
    mes: number;
    anio: number;
    totalComision: number;
    totalPagado: number;
    totalPendiente: number;
    comisiones: Comision[];
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function fmt(n: number) {
    return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MisComisionesPage() {
    const now = new Date();
    const [mes, setMes] = useState(now.getMonth() + 1);
    const [anio, setAnio] = useState(now.getFullYear());
    const [data, setData] = useState<MisComisionesData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await get<MisComisionesData>(`/comisiones/mis-comisiones?mes=${mes}&anio=${anio}`);
            setData(res.data ?? null);
        } catch {
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [mes, anio]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const navegarMes = (delta: number) => {
        let m = mes + delta;
        let a = anio;
        if (m > 12) { m = 1; a++; }
        if (m < 1) { m = 12; a--; }
        setMes(m);
        setAnio(a);
    };

    const esMesActual = mes === now.getMonth() + 1 && anio === now.getFullYear();

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mis Comisiones</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{MESES[mes - 1]} {anio}</p>
                </div>

                {/* Navegador de mes */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#111827] rounded-2xl px-3 py-2 border border-gray-100/50 dark:border-slate-800 shadow-sm">
                    <button
                        onClick={() => navegarMes(-1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Icon icon="solar:alt-arrow-left-bold" className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <span className="text-sm font-bold text-gray-900 dark:text-white px-2 min-w-[110px] text-center">
                        {MESES_CORTO[mes - 1]} {anio}
                    </span>
                    <button
                        onClick={() => navegarMes(1)}
                        disabled={esMesActual}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                    >
                        <Icon icon="solar:alt-arrow-right-bold" className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: 'Total Comisión',
                        value: fmt(data?.totalComision ?? 0),
                        icon: 'solar:hand-money-bold-duotone',
                        color: 'text-indigo-600 dark:text-indigo-400',
                        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                    },
                    {
                        label: 'Ya Cobrado',
                        value: fmt(data?.totalPagado ?? 0),
                        icon: 'solar:check-circle-bold-duotone',
                        color: 'text-emerald-600 dark:text-emerald-400',
                        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                    },
                    {
                        label: 'Pendiente de Cobro',
                        value: fmt(data?.totalPendiente ?? 0),
                        icon: 'solar:clock-circle-bold-duotone',
                        color: 'text-amber-600 dark:text-amber-400',
                        bg: 'bg-amber-50 dark:bg-amber-900/20',
                    },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-gray-100/50 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                <Icon icon={kpi.icon} className={`text-xl ${kpi.color}`} />
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{kpi.label}</span>
                        </div>
                        <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabla de comisiones */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Icon icon="mdi:loading" className="animate-spin text-3xl text-indigo-500" />
                </div>
            ) : !data?.comisiones.length ? (
                <div className="bg-white dark:bg-[#111827] rounded-3xl p-12 border border-gray-100/50 dark:border-slate-800 text-center">
                    <Icon icon="solar:hand-money-bold-duotone" className="text-5xl text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sin comisiones para {MESES[mes - 1]} {anio}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Las comisiones se generan automáticamente al registrar ventas</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100/50 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Comprobante</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Producto</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cant.</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Comisión</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {data.comisiones.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-200">
                                            {c.comprobante.serie}-{String(c.comprobante.correlativo).padStart(8, '0')}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(c.comprobante.fechaEmision).toLocaleDateString('es-PE')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 max-w-[220px] truncate">
                                            {c.descripcion ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-300">{c.cantidad}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                            {fmt(c.montoComision)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                c.estado === 'PAGADO'
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                            }`}>
                                                <Icon icon={c.estado === 'PAGADO' ? 'solar:check-circle-bold' : 'solar:clock-circle-bold'} width={10} />
                                                {c.estado === 'PAGADO' ? 'Cobrado' : 'Pendiente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Totales */}
                            <tfoot className="border-t-2 border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Total · {data.comisiones.length} registro{data.comisiones.length !== 1 ? 's' : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                        {fmt(data.totalComision)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
