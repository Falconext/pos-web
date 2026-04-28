"use client";
import { useReporteViewModel } from '@/features/admin/contabilidad/useContabilidadReporteViewModel';
import Button from "@/components/Button";
import DataTable from "@/components/Datatable";
import { Calendar } from "@/components/Date";
import { Icon } from "@iconify/react";
import Select from "@/components/Select";

const ReportesComprobantes = () => {
    const vm = useReporteViewModel();

    return (
        <div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Icon icon="solar:chart-2-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                        Reporte Contable
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resumen de comprobantes electrónicos por período</p>
                </div>
                <button
                    type="button"
                    onClick={vm.handleExport}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                    <Icon icon="solar:export-bold" className="text-lg" />
                    Exportar Excel
                </button>
            </div>
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4"><Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" /><h3 className="font-semibold text-gray-800 dark:text-white">Filtros</h3></div>
                    <div className="flex flex-col relative z-[999] sm:flex-row gap-4 flex-wrap">
                        <Calendar name="fechaInicio" onChange={vm.handleDate} text="Fecha inicio" />
                        <Calendar name="fechaFin" onChange={vm.handleDate} text="Fecha Fin" />
                        {vm.canFilterSede && (
                            <div className="min-w-[180px]">
                                <Select error="" label="Sede" name="sedeId" defaultValue="Todas las sedes" onChange={vm.handleSelectSede} options={vm.sedesOptions} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4">
                    {vm.reports?.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <DataTable actions={[]} bodyData={vm.reports} headerColumns={[
                                    { label: 'Sede', key: 'sede' },
                                    { label: 'Comprobante', key: 'comprobante' },
                                    { label: 'Serie', key: 'serie' },
                                    { label: 'Correlativo', key: 'correlativo' },
                                    { label: 'RUC/DNI', key: 'ruc' },
                                    { label: 'Cliente', key: 'cliente' },
                                    { label: 'Fecha', key: 'fecha' },
                                    { label: 'Moneda', key: 'moneda' },
                                    { label: 'Forma Pago', key: 'formaPago' },
                                    { label: 'Medio Pago', key: 'medioPago' },
                                    { label: 'Estado SUNAT', key: 'estadoSunat' },
                                    { label: 'Estado Pago', key: 'estadoPago' },
                                    { label: 'Op. Gravada', key: 'gravadas' },
                                    { label: 'Op. Inafecta', key: 'inafectas' },
                                    { label: 'IGV', key: 'igv' },
                                    { label: 'Total', key: 'total' },
                                    { label: 'Saldo', key: 'saldo' },
                                    { label: 'Motivo NC/ND', key: 'motivo' },
                                ]} />
                            </div>
                            {vm.resumenReporte !== null && (
                                <div className="mt-6 p-5 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                    <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Icon icon="solar:chart-2-bold-duotone" className="text-blue-600" />Resumen del Período</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            ['Boletas', vm.resumenReporte.totalBoletas, 'text-gray-900 dark:text-white'],
                                            ['Facturas', vm.resumenReporte.totalFacturas, 'text-gray-900 dark:text-white'],
                                            ['Nota de Crédito', vm.resumenReporte.totalNotasCredito, 'text-red-500 dark:text-red-400'],
                                            ['Nota de Débito', vm.resumenReporte.totalNotasDebito, 'text-gray-900 dark:text-white'],
                                            ['Total Descuentos', vm.resumenReporte.totalDescuentos, 'text-orange-500 dark:text-orange-400'],
                                            ['Op. Gravadas', vm.resumenReporte.totalGravadas, 'text-gray-900 dark:text-white'],
                                            ['Op. Inafectas', vm.resumenReporte.totalInafectas, 'text-gray-900 dark:text-white'],
                                            ['Total IGV (18%)', vm.resumenReporte.totalIGV, 'text-gray-900 dark:text-white'],
                                        ].map(([label, val, colorClass]) => (
                                            <div key={label as string} className="bg-white dark:bg-[#111827] rounded-lg p-3 border border-gray-100 dark:border-slate-800">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{label as string}</p>
                                                <p className={`text-lg font-bold ${colorClass as string}`}>S/ {typeof val === 'number' ? (val as number).toFixed(2) : '0.00'}</p>
                                            </div>
                                        ))}
                                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white shadow-lg shadow-blue-500/20">
                                            <p className="text-xs text-blue-100">Total Ventas Neto</p>
                                            <p className="text-xl font-bold">S/ {vm.resumenReporte.totalVenta.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-12 relative text-center">
                            <Icon icon="solar:chart-2-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No se encontraron comprobantes</p>
                            <p className="text-sm text-gray-400 mt-1">Selecciona un rango de fechas diferente</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportesComprobantes;