import { useEffect, useState, useMemo } from 'react';
import { AreaChart } from '@tremor/react';
import { useFinanzasStore } from '../../../zustand/finanzas';
import { Icon } from '@iconify/react';
import moment from 'moment';
import { Calendar } from '@/components/Date';

const valueFormatter = (number: number) =>
    `S/ ${Number(number || 0).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function FinanceDashboard() {
    const { kpis, chartData, getResumenFinanciero, isLoading } = useFinanzasStore();
    const [fechaInicio, setFechaInicio] = useState<string>(
        moment(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).format('YYYY-MM-DD')
    );
    const [fechaFin, setFechaFin] = useState<string>(
        moment(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)).format('YYYY-MM-DD')
    );

    useEffect(() => {
        if (fechaInicio && fechaFin) {
            getResumenFinanciero(fechaInicio, fechaFin);
        }
    }, [fechaInicio, fechaFin]);



    const formattedChartData = useMemo(() => {
        return (chartData ?? []).map((row: any) => {
            const [y, m, d] = String(row?.fecha ?? '').split('-').map(Number);
            const fechaLocal = new Date(y, (m || 1) - 1, d || 1);
            const mesShort = fechaLocal.toLocaleString('es-ES', { month: 'short' });
            const mesCap = mesShort.charAt(0).toUpperCase() + mesShort.slice(1);
            return {
                date: `${mesCap} ${fechaLocal.getDate()}`,
                Ingresos: row?.ingresos ?? 0,
                Egresos: row?.egresos ?? 0,
            };
        });
    }, [chartData]);

    // Design tokens extracted from Velouré image
    const cardClass = "bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50 transition-all hover:shadow-md";
    const iconBgBase = "w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4";

    return (
        <div className="min-h-screen bg-[#F8F9FB] p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 font-medium mb-1">
                        <span>Finanzas</span>
                        <Icon icon="solar:alt-arrow-right-linear" />
                        <span className="text-indigo-600">Dashboard</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Resumen Financiero</h1>
                </div>

                {/* Filters / Actions */}
                <div className="flex items-center gap-3">
                    <Calendar
                        text="Fecha Inicio"
                        value={moment(fechaInicio).format('DD/MM/YYYY')}
                        onChange={(e: string) => setFechaInicio(moment(e, 'DD/MM/YYYY').format('YYYY-MM-DD'))}
                    />
                    <Calendar
                        text="Fecha Fin"
                        value={moment(fechaFin).format('DD/MM/YYYY')}
                        onChange={(e: string) => setFechaFin(moment(e, 'DD/MM/YYYY').format('YYYY-MM-DD'))}
                    />
                    <button className="bg-indigo-600 top-2 relative hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors shadow-lg shadow-indigo-200">
                        <Icon icon="solar:refresh-bold" />
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Chart & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Chart Card */}
                    <div className={`${cardClass} min-h-[400px]`}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Flujo de Caja Real</h2>
                                <p className="text-sm text-gray-500 mt-1">Ingresos vs Egresos diarios</p>
                            </div>
                            {/* Chart Legend/Actions if needed */}
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Ingresos
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Egresos
                                </span>
                            </div>
                        </div>

                        <AreaChart
                            className="h-80 mt-4"
                            data={formattedChartData}
                            index="date"
                            categories={["Ingresos", "Egresos"]}
                            colors={["indigo", "rose"]}
                            curveType="monotone"
                            showLegend={false}
                            showGridLines={false}
                            showAnimation
                            yAxisWidth={60}
                            valueFormatter={valueFormatter}
                        />
                    </div>

                    {/* Quick Stats Grid (Secondary) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cardClass}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 font-medium mb-1">Total Por Cobrar</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{valueFormatter(kpis?.porCobrar || 0)}</h3>
                                </div>
                                <div className={`${iconBgBase} bg-emerald-50 text-emerald-600`}>
                                    <Icon icon="solar:hand-money-bold-duotone" />
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Pendiente de cobro a clientes</p>
                        </div>

                        <div className={cardClass}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 font-medium mb-1">Total Por Pagar</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{valueFormatter(kpis?.porPagar || 0)}</h3>
                                </div>
                                <div className={`${iconBgBase} bg-amber-50 text-amber-600`}>
                                    <Icon icon="solar:bill-check-bold-duotone" />
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
                                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '35%' }}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Pendiente de pago a proveedores</p>
                        </div>
                    </div>
                </div>

                {/* Right Col: Summary Cards (Vertical Stack like "Detail Transactions") */}
                <div className="space-y-6">
                    <div className={`rounded-3xl p-6 shadow-sm border border-gray-100/50 transition-all hover:shadow-md bg-indigo-600 text-white border-indigo-500 hover:shadow-indigo-200`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Icon icon="solar:wallet-money-bold-duotone" className="text-2xl" />
                            </div>
                            <span className="text-indigo-100 text-sm font-medium bg-indigo-500/30 px-2 py-1 rounded-lg">Este mes</span>
                        </div>
                        <p className="text-indigo-100 font-medium mb-1">Ingresos Totales</p>
                        <h3 className="text-3xl font-bold mb-4">{valueFormatter(kpis?.ingresosPeriodo || 0)}</h3>
                        <div className="flex items-center gap-2 text-indigo-200 text-sm">
                            <Icon icon="solar:graph-up-bold" />
                            <span>+12.5% vs mes anterior</span>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Resumen Rápido</h3>
                            <button className="text-gray-400 hover:text-indigo-600">
                                <Icon icon="solar:menu-dots-bold" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-indigo-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <Icon icon="solar:card-send-bold-duotone" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Egresos</p>
                                        <p className="text-xs text-gray-500">Gastos operativos</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-gray-900">{valueFormatter(kpis?.egresosPeriodo || 0)}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-emerald-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <Icon icon="solar:scale-bold-duotone" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Balance</p>
                                        <p className="text-xs text-gray-500">Utilidad neta</p>
                                    </div>
                                </div>
                                <span className={`text-sm font-bold ${(kpis?.balancePeriodo || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {valueFormatter(kpis?.balancePeriodo || 0)}
                                </span>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                            <span>Ver Reporte Detallado</span>
                            <Icon icon="solar:arrow-right-linear" />
                        </button>
                    </div>
                </div>

            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-3xl shadow-xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600"></div>
                        <span className="font-medium text-gray-600">Actualizando dashboard...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
