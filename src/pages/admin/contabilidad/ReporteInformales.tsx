"use client";
import { useReporteInformalesViewModel } from '@/features/admin/contabilidad/useContabilidadReporteViewModel';
import Button from "@/components/Button";
import DataTable from "@/components/Datatable";
import { Calendar } from "@/components/Date";
import { Icon } from "@iconify/react";
import Select from "@/components/Select";

const ReportesComprobantesInformales = () => {
    const vm = useReporteInformalesViewModel();
    const r = vm.resumenReporteInformal;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0D14]">
            <div className="md:px-8 pt-0 md:pt-5 md:mt-0 pb-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4 px-4 md:px-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Icon icon="solar:chart-square-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                            Reporte Interno
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ventas internas y documentos informales</p>
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
                <div className='w-full bg-white dark:bg-[#111827] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800'>
                    {vm.reports?.length > 0 ? (
                        <>
                            <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
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
                                        {[['Tickets:', r.totalTickets], ['Notas de Venta:', r.totalNotasVenta], ['Recibos por Honorarios:', r.totalRecibosHonorarios], ['Comprobantes de Pago:', r.totalComprobantesPago], ['Notas de Pedido:', r.totalNotasPedido], ['Órdenes de Trabajo:', r.totalOrdenesTrabajo]].map(([label, val]) => (
                                            <div key={label as string} className="flex justify-between py-1.5 border-b border-gray-200 dark:border-slate-800 last:border-0">
                                                <label className="text-sm text-gray-500 dark:text-gray-400">{label as string}</label>
                                                <span className="text-sm font-semibold dark:text-white">S/ {(val as number).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between pt-4 mt-2 border-t-2 border-blue-500/30">
                                            <label className="text-base font-bold dark:text-white">Total:</label>
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
        </div>
    );
};

export default ReportesComprobantesInformales;