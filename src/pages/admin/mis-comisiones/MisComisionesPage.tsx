import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { get } from '@/utils/fetch';
import DataTable from '@/components/Datatable';
import { fadeUp, interactiveHover, listItemFadeUp, listItemHidden, listStagger } from '@/lib/motion/presets';

interface Comision {
    id: number;
    comprobante: { tipoDoc: string; serie: string; correlativo: number; fechaEmision: string };
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

const COLUMNS = [
    { key: 'Comprobante', label: 'Comprobante' },
    { key: 'Fecha',       label: 'Fecha' },
    { key: 'Producto',    label: 'Producto' },
    { key: 'Cantidad',    label: 'Cant.' },
    { key: 'Comision',    label: 'Comisión' },
    { key: 'EstadoBadge', label: 'Estado' },
];

function fmt(n: number) {
    return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function EstadoBadge({ estado }: { estado: 'PENDIENTE' | 'PAGADO' }) {
    if (estado === 'PAGADO') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <Icon icon="solar:check-circle-bold" width={11} />
                Cobrado
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
            <Icon icon="solar:clock-circle-bold" width={11} />
            Pendiente
        </span>
    );
}

function buildTableData(comisiones: Comision[]) {
    return comisiones.map((c) => ({
        'Comprobante': `${c.comprobante.serie}-${String(c.comprobante.correlativo).padStart(8, '0')}`,
        'Fecha': new Date(c.comprobante.fechaEmision).toLocaleDateString('es-PE'),
        'Producto': c.descripcion ?? '—',
        'Cantidad': c.cantidad,
        'Comision': fmt(c.montoComision),
        'EstadoBadge': <EstadoBadge estado={c.estado} />,
    }));
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

    const kpis = [
        {
            label: 'Total Comisión',
            value: fmt(data?.totalComision ?? 0),
            icon: 'solar:hand-money-bold-duotone',
            color: 'text-violet-600 dark:text-violet-400',
            iconBg: 'bg-violet-600',
            shadow: 'shadow-violet-200 dark:shadow-violet-900/20',
        },
        {
            label: 'Ya Cobrado',
            value: fmt(data?.totalPagado ?? 0),
            icon: 'solar:check-circle-bold-duotone',
            color: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-500',
            shadow: 'shadow-emerald-200 dark:shadow-emerald-900/20',
        },
        {
            label: 'Pendiente de Cobro',
            value: fmt(data?.totalPendiente ?? 0),
            icon: 'solar:clock-circle-bold-duotone',
            color: 'text-amber-500 dark:text-amber-400',
            iconBg: 'bg-amber-500',
            shadow: 'shadow-amber-200 dark:shadow-amber-900/20',
        },
    ];

    const tableData = data?.comisiones?.length ? buildTableData(data.comisiones) : [];

    return (
        <motion.div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]" variants={fadeUp} initial="initial" animate="animate">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Mis Comisiones</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{MESES[mes - 1]} {anio}</p>
                </div>

                <motion.div
                    className="flex items-center gap-1 bg-white dark:bg-[#111827] rounded-2xl px-2 py-2 border border-gray-100 dark:border-slate-800 shadow-sm"
                    whileHover={interactiveHover.whileHover}
                >
                    <button
                        onClick={() => navegarMes(-1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Icon icon="solar:alt-arrow-left-bold" className="text-gray-600 dark:text-gray-300 text-base" />
                    </button>
                    <span className="text-sm font-bold text-gray-900 dark:text-white px-3 min-w-[110px] text-center">
                        {MESES_CORTO[mes - 1]} {anio}
                    </span>
                    <button
                        onClick={() => navegarMes(1)}
                        disabled={esMesActual}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Icon icon="solar:alt-arrow-right-bold" className="text-gray-600 dark:text-gray-300 text-base" />
                    </button>
                </motion.div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                {/* KPI Cards */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/20">
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
                        variants={listStagger}
                        initial="initial"
                        animate="animate"
                    >
                        {kpis.map((kpi, i) => (
                            <motion.div
                                key={i}
                                className="bg-white dark:bg-[#111827] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow"
                                variants={{ initial: listItemHidden, animate: listItemFadeUp }}
                                whileHover={interactiveHover.whileHover}
                                whileTap={interactiveHover.whileTap}
                                layout
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className={`${kpi.color} text-[13px] font-bold tracking-wide uppercase`}>{kpi.label}</h3>
                                    <div className={`w-10 h-10 rounded-[14px] ${kpi.iconBg} flex items-center justify-center text-white shadow-lg ${kpi.shadow} group-hover:-translate-y-1 transition-transform`}>
                                        <Icon icon={kpi.icon} className="text-xl" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{kpi.value}</h2>
                                    <div className="opacity-0 h-4" />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Table */}
                <div className="p-4">
                    {isLoading ? (
                        <motion.div className="flex items-center justify-center py-16" variants={fadeUp} initial="initial" animate="animate">
                            <Icon icon="mdi:loading" className="animate-spin text-3xl text-violet-500" />
                        </motion.div>
                    ) : tableData.length > 0 ? (
                        <div className="overflow-hidden overflow-x-auto">
                            <DataTable
                                bodyData={tableData}
                                headerColumns={COLUMNS}
                            />
                        </div>
                    ) : (
                        <motion.div className="py-12 text-center" variants={fadeUp} initial="initial" animate="animate">
                            <Icon icon="solar:hand-money-bold-duotone" className="text-5xl text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sin comisiones para {MESES[mes - 1]} {anio}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Las comisiones se generan automáticamente al registrar ventas</p>
                        </motion.div>
                    )}
                </div>

                {/* Footer total */}
                {!isLoading && tableData.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/20 flex items-center justify-between rounded-b-2xl">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {data!.comisiones.length} registro{data!.comisiones.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm font-extrabold text-violet-600 dark:text-violet-400">
                            Total: {fmt(data!.totalComision)}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
