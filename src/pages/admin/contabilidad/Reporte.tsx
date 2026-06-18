"use client";
import { useState } from 'react';
import { useReporteViewModel, useReporteInformalesViewModel } from '@/features/admin/contabilidad/useContabilidadReporteViewModel';
import DataTable from "@/components/Datatable";
import { Calendar } from "@/components/Date";
import { Icon } from "@iconify/react";
import Select from "@/components/Select";

const TabFormal = () => {
    const vm = useReporteViewModel();
    return (
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                    <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">Filtros</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-end">
                    <Calendar name="fechaInicio" onChange={vm.handleDate} text="Fecha inicio" />
                    <Calendar name="fechaFin" onChange={vm.handleDate} text="Fecha Fin" />
                    {vm.canFilterSede && (
                        <div className="min-w-[180px]">
                            <Select error="" label="Sede" name="sedeId" defaultValue="Todas las sedes" onChange={vm.handleSelectSede} options={vm.sedesOptions} />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={vm.handleExport}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 ml-auto"
                    >
                        <Icon icon="solar:export-bold" className="text-base" />
                        Exportar Excel
                    </button>
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
                            <div className="flex justify-end mt-8 mb-5 pr-[24px]">
                                <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 min-w-[300px]">
                                    {([
                                        ['Boletas:', vm.resumenReporte.totalBoletas, ''],
                                        ['Facturas:', vm.resumenReporte.totalFacturas, ''],
                                        ['Nota de Crédito:', vm.resumenReporte.totalNotasCredito, 'text-red-500 dark:text-red-400'],
                                        ['Nota de Débito:', vm.resumenReporte.totalNotasDebito, ''],
                                        ['Total Descuentos:', vm.resumenReporte.totalDescuentos, 'text-orange-500 dark:text-orange-400'],
                                        ['Op. Gravadas:', vm.resumenReporte.totalGravadas, ''],
                                        ['Op. Inafectas:', vm.resumenReporte.totalInafectas, ''],
                                        ['Total IGV (18%):', vm.resumenReporte.totalIGV, ''],
                                    ] as [string, number, string][]).map(([label, val, colorClass]) => (
                                        <div key={label} className="flex justify-between py-1.5 border-b border-gray-200 dark:border-slate-800 last:border-0">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                                            <span className={`text-sm font-semibold dark:text-white ${colorClass}`}>S/ {typeof val === 'number' ? val.toFixed(2) : '0.00'}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-4 mt-2 border-t-2 border-blue-500/30">
                                        <span className="text-base font-bold dark:text-white">Total:</span>
                                        <strong className="text-lg font-black text-blue-600 dark:text-blue-400">S/ {vm.resumenReporte.totalVenta.toFixed(2)}</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <Icon icon="solar:chart-2-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No se encontraron comprobantes</p>
                        <p className="text-sm text-gray-400 mt-1">Selecciona un rango de fechas diferente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TabInformal = () => {
    const vm = useReporteInformalesViewModel();
    const r = vm.resumenReporteInformal;
    return (
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                    <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">Filtros</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-end">
                    <Calendar name="fechaInicio" onChange={vm.handleDate} text="Fecha inicio" />
                    <Calendar name="fechaFin" onChange={vm.handleDate} text="Fecha Fin" />
                    {vm.canFilterSede && (
                        <div className="min-w-[180px]">
                            <Select error="" label="Sede" name="sedeId" defaultValue="Todas las sedes" onChange={vm.handleSelectSede} options={vm.sedesOptions} />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={vm.handleExport}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 ml-auto"
                    >
                        <Icon icon="solar:export-bold" className="text-base" />
                        Exportar Excel
                    </button>
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
                                { label: 'Nro. Documento', key: 'ruc' },
                                { label: 'Cliente', key: 'cliente' },
                                { label: 'Fecha', key: 'fecha' },
                                { label: 'Estado Pago', key: 'estadoPago' },
                                { label: 'Saldo', key: 'saldo' },
                                { label: 'Medio Pago', key: 'medioPago' },
                                { label: 'Estado OT', key: 'estadoOT' },
                                { label: 'Adelanto', key: 'adelanto' },
                                { label: 'Total', key: 'total' },
                            ]} />
                        </div>
                        {r !== null && (
                            <div className="flex justify-end mt-8 mb-5 pr-[24px]">
                                <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 min-w-[300px]">
                                    {([
                                        ['Tickets:', r.totalTickets],
                                        ['Notas de Venta:', r.totalNotasVenta],
                                        ['Recibos por Honorarios:', r.totalRecibosHonorarios],
                                        ['Comprobantes de Pago:', r.totalComprobantesPago],
                                        ['Notas de Pedido:', r.totalNotasPedido],
                                        ['Órdenes de Trabajo:', r.totalOrdenesTrabajo],
                                    ] as [string, number][]).map(([label, val]) => (
                                        <div key={label} className="flex justify-between py-1.5 border-b border-gray-200 dark:border-slate-800 last:border-0">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                                            <span className="text-sm font-semibold dark:text-white">S/ {val.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-4 mt-2 border-t-2 border-blue-500/30">
                                        <span className="text-base font-bold dark:text-white">Total:</span>
                                        <strong className="text-lg font-black text-blue-600 dark:text-blue-400">S/ {r.totalVenta.toFixed(2)}</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <Icon icon="solar:chart-2-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No se encontraron comprobantes</p>
                        <p className="text-sm text-gray-400 mt-1">Selecciona un rango de fechas diferente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

type Tab = 'formal' | 'informal';

const TABS: { key: Tab; label: string; icon: string; desc: string }[] = [
    { key: 'formal', label: 'Comprobantes SUNAT', icon: 'solar:document-text-bold-duotone', desc: 'Boletas, facturas y notas electrónicas' },
    { key: 'informal', label: 'Comprobantes Internos', icon: 'solar:receipt-bold-duotone', desc: 'Tickets, notas de venta y documentos informales' },
];

const ReportesComprobantes = () => {
    const [activeTab, setActiveTab] = useState<Tab>('formal');

    return (
        <div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Icon icon="solar:chart-2-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                        Reporte Contable
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resumen de comprobantes por período</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5 bg-white dark:bg-[#111827] p-1.5 rounded-2xl border border-gray-100 dark:border-slate-800 w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            activeTab === tab.key
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Icon icon={tab.icon} className="text-lg shrink-0" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.key === 'formal' ? 'SUNAT' : 'Internos'}</span>
                    </button>
                ))}
            </div>

            {/* Tab description */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5">
                <Icon icon={TABS.find(t => t.key === activeTab)!.icon} className="text-sm" />
                {TABS.find(t => t.key === activeTab)!.desc}
            </p>

            {activeTab === 'formal' ? <TabFormal /> : <TabInformal />}
        </div>
    );
};

export default ReportesComprobantes;
