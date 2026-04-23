import React from 'react';
import Loading from '@/components/Loading';
import { Card, BarChart as TremorBarChart, DonutChart, Title } from '@tremor/react';
import { Icon } from '@iconify/react';
import DataTable from '@/components/Datatable';
import { useDashboardViewModel } from './useDashboardViewModel';

export default function DashboardView() {
    const vm = useDashboardViewModel();
    const { dashboardData, loading, error, charts, helpers, actions } = vm;

    return (
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard de Inventario</h1>
                    <p className="text-sm text-gray-500 mt-1">Resumen general del estado de tu inventario</p>
                </div>
                <button
                    onClick={actions.fetchDashboardData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <Icon icon="solar:refresh-linear" className="text-lg" />
                    Actualizar
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Icon icon="line-md:loading-twotone-loop" className="text-4xl text-indigo-500" />
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
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            ) : (
                <>


            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Productos</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {dashboardData.resumenGeneral.totalProductos.toLocaleString()}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                            <Icon icon="solar:box-bold-duotone" className="text-blue-600 text-2xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Valor Inventario</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {helpers.formatCurrency(dashboardData.resumenGeneral.valorTotalInventario)}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                            <Icon icon="solar:wallet-money-bold-duotone" className="text-emerald-600 text-2xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Stock Crítico</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">
                                {dashboardData.resumenGeneral.productosStockCritico}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                            <Icon icon="solar:danger-triangle-bold-duotone" className="text-amber-600 text-2xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Sin Stock</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {dashboardData.resumenGeneral.productosStockCero}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                            <Icon icon="solar:close-circle-bold-duotone" className="text-red-600 text-2xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos con Tremor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <Card className="rounded-2xl border border-gray-100 shadow-sm">
                    <Title className="text-gray-900 font-bold">Estado del stock</Title>
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
                </Card>

                <Card className="rounded-2xl border border-gray-100 shadow-sm">
                    <Title className="text-gray-900 font-bold">Distribución del inventario</Title>
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
                </Card>
            </div>

            {/* Alertas y productos críticos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Productos con stock crítico */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon icon="solar:danger-triangle-bold-duotone" className="text-amber-500 text-xl" />
                        <h3 className="font-semibold text-gray-800">Stock Crítico</h3>
                    </div>
                    {dashboardData.topProductos.stockCritico.length > 0 ? (
                        <div className="space-y-3">
                            {dashboardData.topProductos.stockCritico.map((producto) => (
                                <div key={producto.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{producto.codigo}</p>
                                        <p className="text-xs text-gray-500 truncate">{producto.descripcion}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-amber-600 font-medium">
                                                Stock: {producto.stock} / Mínimo: {producto.stockMinimo}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-sm font-bold text-gray-900">
                                            {helpers.formatCurrency(producto.valorTotal)}
                                        </p>
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
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon icon="solar:clock-circle-bold-duotone" className="text-gray-500 text-xl" />
                        <h3 className="font-semibold text-gray-800">Productos Obsoletos</h3>
                    </div>
                    {dashboardData.topProductos.obsoletos.length > 0 ? (
                        <div className="space-y-3">
                            {dashboardData.topProductos.obsoletos.map((producto) => (
                                <div key={producto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{producto.codigo}</p>
                                        <p className="text-xs text-gray-500 truncate">{producto.descripcion}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-600">
                                                {producto.diasSinMovimiento} días sin movimiento
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-sm font-bold text-gray-900">
                                            {helpers.formatCurrency(producto.valorInmovilizado)}
                                        </p>
                                        <p className="text-xs text-gray-500">{producto.stock} unidades</p>
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
