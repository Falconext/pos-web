import React from 'react';
import { BarChart as TremorBarChart, DonutChart } from '@tremor/react';
import { Icon } from '@iconify/react';
import DataTable from '@/components/Datatable';
import { useDashboardViewModel } from './useDashboardViewModel';

export default function DashboardView() {
    const vm = useDashboardViewModel();
    const { dashboardData, loading, error, charts, helpers, actions } = vm;

    return (
        <div className="min-h-screen pb-8 max-w-8xl mx-auto px-4 pt-2 font-inter bg-[#f8fafc]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard de Inventario</h1>
                    <p className="text-[15px] text-gray-500 font-medium mt-1">Resumen general del estado de tu inventario</p>
                </div>
                <button
                    onClick={actions.fetchDashboardData}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Icon icon="solar:refresh-linear" className="text-lg text-blue-500" />
                    Actualizar
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Icon icon="line-md:loading-twotone-loop" className="text-4xl text-violet-600" />
                    <span className="ml-3 text-gray-500 font-medium">Cargando métricas...</span>
                </div>
            ) : error || !dashboardData ? (
                <div className="p-6">
                    <div className="text-center py-12">
                        <Icon icon="mingcute:exclamation-triangle-fill" width={48} height={48} className="text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {error || 'Error al cargar dashboard'}
                        </h3>
                        <p className="text-gray-500">
                            No se pudo cargar la información del inventario.
                        </p>
                        <button
                            onClick={actions.fetchDashboardData}
                            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            ) : (
                <>
                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-blue-500 text-[13px] font-bold tracking-wide">Total Productos</h3>
                            <div className="w-10 h-10 rounded-[14px] bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:-translate-y-1 transition-transform">
                                <Icon icon="solar:box-bold" className="text-xl" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-[28px] leading-none font-extrabold text-gray-900 mb-2">
                                {dashboardData.resumenGeneral.totalProductos.toLocaleString()}
                            </h2>
                            <span className="text-xs text-gray-400 font-medium">productos registrados</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-emerald-500 text-[13px] font-bold tracking-wide">Valor Inventario</h3>
                            <div className="w-10 h-10 rounded-[14px] bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:-translate-y-1 transition-transform">
                                <Icon icon="solar:wallet-money-bold" className="text-xl" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-[28px] leading-none font-extrabold text-gray-900 mb-2">
                                {helpers.formatCurrency(dashboardData.resumenGeneral.valorTotalInventario)}
                            </h2>
                            <span className="text-xs text-gray-400 font-medium">valor total en stock</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-amber-500 text-[13px] font-bold tracking-wide">Stock Crítico</h3>
                            <div className="w-10 h-10 rounded-[14px] bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 group-hover:-translate-y-1 transition-transform">
                                <Icon icon="solar:danger-triangle-bold" className="text-xl" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-[28px] leading-none font-extrabold text-gray-900 mb-2">
                                {dashboardData.resumenGeneral.productosStockCritico}
                            </h2>
                            <span className="text-xs text-gray-400 font-medium">productos bajo mínimo</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-rose-500 text-[13px] font-bold tracking-wide">Sin Stock</h3>
                            <div className="w-10 h-10 rounded-[14px] bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200 group-hover:-translate-y-1 transition-transform">
                                <Icon icon="solar:close-circle-bold" className="text-xl" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-[28px] leading-none font-extrabold text-gray-900 mb-2">
                                {dashboardData.resumenGeneral.productosStockCero}
                            </h2>
                            <span className="text-xs text-gray-400 font-medium">productos agotados</span>
                        </div>
                    </div>
                </div>

                {/* Gráficos con Tremor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-900 font-bold text-lg mb-1">Estado del stock</h3>
                        <TremorBarChart
                            className="mt-4 h-64"
                            data={charts.stockChartData}
                            index="estado"
                            categories={["Stock normal", "Stock crítico", "Sin stock"]}
                            colors={["emerald", "amber", "rose"]}
                            showLegend
                            showGridLines={false}
                            showAnimation
                            yAxisWidth={56}
                            valueFormatter={(value: number) =>
                                Number(value || 0).toLocaleString("es-PE")
                            }
                        />
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-900 font-bold text-lg mb-1">Distribución del inventario</h3>
                        <DonutChart
                            className="mt-4 h-64"
                            data={charts.pieData}
                            index="name"
                            category="value"
                            colors={["emerald", "amber", "rose", "cyan"]}
                            valueFormatter={(value: number) =>
                                Number(value || 0).toLocaleString("es-PE")
                            }
                        />
                    </div>
                </div>

                {/* Alertas y productos críticos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                    {/* Productos con stock crítico */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                <Icon icon="solar:danger-triangle-bold-duotone" className="text-lg" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">Stock Crítico</h3>
                        </div>
                        {dashboardData.topProductos.stockCritico.length > 0 ? (
                            <div className="space-y-4">
                                {dashboardData.topProductos.stockCritico.map((producto) => (
                                    <div key={producto.id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                                            <Icon icon="solar:box-bold" className="text-amber-500 text-xl" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <p className="text-[13px] font-bold text-gray-900 truncate pr-2">{producto.descripcion}</p>
                                                <p className="text-[13px] font-bold text-gray-600 shrink-0">{helpers.formatCurrency(producto.valorTotal)}</p>
                                            </div>
                                            <div className="flex items-center gap-1 mb-1.5">
                                                <span className="text-xs text-gray-400">{producto.codigo}</span>
                                                <span className="text-xs text-amber-600 font-medium">· Stock: {producto.stock} / Mín: {producto.stockMinimo}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${Math.min((producto.stock / Math.max(producto.stockMinimo, 1)) * 100, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Icon icon="solar:check-circle-bold-duotone" className="text-4xl text-emerald-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No hay productos con stock crítico</p>
                            </div>
                        )}
                    </div>

                    {/* Productos obsoletos */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                                <Icon icon="solar:clock-circle-bold-duotone" className="text-lg" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">Productos Obsoletos</h3>
                        </div>
                        {dashboardData.topProductos.obsoletos.length > 0 ? (
                            <div className="space-y-4">
                                {dashboardData.topProductos.obsoletos.map((producto) => (
                                    <div key={producto.id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                            <Icon icon="solar:box-bold" className="text-gray-400 text-xl" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <p className="text-[13px] font-bold text-gray-900 truncate pr-2">{producto.descripcion}</p>
                                                <p className="text-[13px] font-bold text-gray-600 shrink-0">{helpers.formatCurrency(producto.valorInmovilizado)}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-400">{producto.codigo}</span>
                                                <span className="text-xs text-gray-500">· {producto.diasSinMovimiento} días sin movimiento</span>
                                                <span className="text-xs text-gray-400">· {producto.stock} uds</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Icon icon="solar:check-circle-bold-duotone" className="text-4xl text-emerald-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No hay productos obsoletos detectados</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Movimientos recientes */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                        <Icon icon="solar:history-bold-duotone" className="text-blue-600 text-xl" />
                        <h3 className="font-semibold text-gray-800">Movimientos Recientes</h3>
                    </div>
                    <div className="p-4">
                        {dashboardData.movimientosRecientes.length > 0 ? (
                            <DataTable actions={[]} bodyData={dashboardData.movimientosRecientes.map((movimiento) => ({
                                fecha: helpers.formatDate(movimiento.fecha),
                                producto: `${movimiento.producto?.codigo || ''} - ${movimiento.producto?.descripcion || 'Sin descripción'}`.toUpperCase(),
                                concepto: movimiento.concepto,
                                cantidad: movimiento.cantidad,
                            }))}
                                headerColumns={[
                                    { label: 'Fecha', key: 'fecha' },
                                    { label: 'Producto', key: 'producto' },
                                    { label: 'Concepto', key: 'concepto' },
                                    { label: 'Cantidad', key: 'cantidad' },
                                ]} />
                        ) : (
                            <div className="text-center py-8">
                                <Icon icon="solar:inbox-linear" className="text-4xl text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No hay movimientos recientes</p>
                            </div>
                        )}
                    </div>
                </div>
                </>
            )}
        </div>
    );
}
