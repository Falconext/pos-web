import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { get, patch } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';

interface VendedorComision {
    vendedor: { id: number; nombre: string; rol: string; dni: string };
    totalComision: number;
    totalPagado: number;
    totalPendiente: number;
    cantidadVentas: number;
    comisiones: Array<{
        id: number;
        comprobante: { tipoDoc: string; serie: string; correlativo: number; fechaEmision: string };
        descripcion: string | null;
        cantidad: number;
        montoComision: number;
        estado: 'PENDIENTE' | 'PAGADO';
    }>;
}

interface ResumenMensual {
    mes: number;
    anio: number;
    vendedores: VendedorComision[];
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatCurrency(n: number) {
    return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ComisionesView() {
    const now = new Date();
    const [mes, setMes] = useState(now.getMonth() + 1);
    const [anio, setAnio] = useState(now.getFullYear());
    const [data, setData] = useState<ResumenMensual | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [pagandoId, setPagandoId] = useState<number | null>(null);
    const alertFn = useAlertStore(s => s.alert);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await get<ResumenMensual>(`/comisiones/resumen?mes=${mes}&anio=${anio}`);
            setData(res.data ?? null);
        } catch {
            setData({ mes, anio, vendedores: [] });
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
        setExpandedId(null);
    };

    const marcarPagado = async (vendedorId: number) => {
        setPagandoId(vendedorId);
        try {
            await patch(`/comisiones/pagar/${vendedorId}?mes=${mes}&anio=${anio}`, {});
            alertFn('Comisiones marcadas como PAGADO', 'success');
            fetchData();
        } catch {
            alertFn('Error al marcar comisiones', 'error');
        } finally {
            setPagandoId(null);
        }
    };

    const exportarCSV = async () => {
        try {
            const res = await get<any[]>(`/comisiones/exportar?mes=${mes}&anio=${anio}`);
            const rows = res.data ?? [];
            if (!rows.length) { alertFn('Sin datos para exportar', 'warning'); return; }
            const headers = ['Vendedor', 'DNI', 'Comprobante', 'Tipo', 'Fecha', 'Total Venta', 'Producto', 'Cantidad', 'Comisión', 'Estado'];
            const csvRows = [
                headers.join(','),
                ...rows.map((r: any) => [
                    `"${r.vendedor}"`, r.dniVendedor, r.comprobante, r.tipoDoc, r.fechaVenta,
                    r.totalVenta, `"${r.producto}"`, r.cantidad, r.montoComision, r.estado,
                ].join(','))
            ];
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Comisiones_${MESES[mes - 1]}_${anio}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alertFn('Error al exportar', 'error');
        }
    };

    const totalGeneral = data?.vendedores.reduce((acc, v) => acc + v.totalComision, 0) ?? 0;
    const totalPendiente = data?.vendedores.reduce((acc, v) => acc + v.totalPendiente, 0) ?? 0;

    return (
        <div className="space-y-5">
            {/* Controls */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white dark:bg-[#111827] rounded-2xl px-3 py-2 border border-gray-100/50 dark:border-slate-800 shadow-sm">
                    <button
                        onClick={() => navegarMes(-1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Icon icon="solar:alt-arrow-left-bold" className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <span className="text-sm font-bold text-gray-900 dark:text-white px-2 min-w-[100px] text-center">
                        {MESES[mes - 1]} {anio}
                    </span>
                    <button
                        onClick={() => navegarMes(1)}
                        disabled={mes === now.getMonth() + 1 && anio === now.getFullYear()}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                    >
                        <Icon icon="solar:alt-arrow-right-bold" className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <button
                    onClick={exportarCSV}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
                >
                    <Icon icon="solar:file-download-bold-duotone" />
                    Exportar Excel
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Comisiones', value: totalGeneral, icon: 'solar:dollar-minimalistic-bold-duotone', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                    { label: 'Pendiente de Pago', value: totalPendiente, icon: 'solar:clock-circle-bold-duotone', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Vendedores Activos', value: data?.vendedores.length ?? 0, icon: 'solar:users-group-rounded-bold-duotone', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', isCurrency: false },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-gray-100/50 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                <Icon icon={kpi.icon} className={`text-xl ${kpi.color}`} />
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{kpi.label}</span>
                        </div>
                        <p className={`text-2xl font-bold ${kpi.color}`}>
                            {(kpi as any).isCurrency === false ? kpi.value : formatCurrency(kpi.value as number)}
                        </p>
                    </div>
                ))}
            </div>

            {/* Vendedores */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Icon icon="mdi:loading" className="animate-spin text-3xl text-indigo-500" />
                </div>
            ) : !data?.vendedores.length ? (
                <div className="bg-white dark:bg-[#111827] rounded-3xl p-12 border border-gray-100/50 dark:border-slate-800 text-center">
                    <Icon icon="solar:hand-money-bold-duotone" className="text-5xl text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">Sin comisiones registradas para {MESES[mes - 1]} {anio}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Asigna comisiones por producto en Kardex → Productos → campo "Comisión por vendedor"
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.vendedores.map((v) => {
                        const isExpanded = expandedId === v.vendedor.id;
                        const allPaid = v.totalPendiente === 0;
                        return (
                            <div key={v.vendedor.id} className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100/50 dark:border-slate-800 shadow-sm overflow-hidden">
                                {/* Vendedor row */}
                                <div className="flex items-center gap-4 p-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {v.vendedor.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{v.vendedor.nombre}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">DNI {v.vendedor.dni} · {v.cantidadVentas} ventas</p>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-6 text-right">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(v.totalComision)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pagado</p>
                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(v.totalPagado)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pendiente</p>
                                            <p className={`text-sm font-bold ${v.totalPendiente > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                                                {formatCurrency(v.totalPendiente)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-2">
                                        {!allPaid && (
                                            <button
                                                onClick={() => marcarPagado(v.vendedor.id)}
                                                disabled={pagandoId === v.vendedor.id}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {pagandoId === v.vendedor.id
                                                    ? <Icon icon="mdi:loading" className="animate-spin" />
                                                    : <Icon icon="solar:check-circle-bold-duotone" />}
                                                Liquidar
                                            </button>
                                        )}
                                        {allPaid && (
                                            <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <Icon icon="solar:check-circle-bold-duotone" />
                                                Pagado
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : v.vendedor.id)}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Icon
                                                icon="solar:alt-arrow-down-bold"
                                                className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Detalle comisiones */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 dark:border-slate-800">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-gray-50 dark:bg-slate-800/50">
                                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Comprobante</th>
                                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Producto</th>
                                                        <th className="px-4 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cant.</th>
                                                        <th className="px-4 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Comisión</th>
                                                        <th className="px-4 py-2.5 text-center font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                                    {v.comisiones.map((c) => (
                                                        <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 font-mono">
                                                                {c.comprobante.serie}-{String(c.comprobante.correlativo).padStart(8, '0')}
                                                                <span className="text-gray-400 ml-1">· {new Date(c.comprobante.fechaEmision).toLocaleDateString('es-PE')}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200 max-w-[200px] truncate">
                                                                {c.descripcion ?? '—'}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">{c.cantidad}</td>
                                                            <td className="px-4 py-2.5 text-right font-semibold text-gray-900 dark:text-white">
                                                                {formatCurrency(c.montoComision)}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-center">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                                                    c.estado === 'PAGADO'
                                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                                                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                                                }`}>
                                                                    {c.estado === 'PAGADO' ? 'PAGADO' : 'PENDIENTE'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
