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
        <div>
            <div className="md:px-8 pt-0 md:pt-5 md:mt-0 pb-10">
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex justify-start gap-3 mb-0 flex-wrap">
                        <Calendar name="fechaInicio" onChange={vm.handleDate} text="Fecha inicio" />
                        <Calendar name="fechaFin" onChange={vm.handleDate} text="Fecha Fin" />
                        {vm.canFilterSede && (
                            <div className="min-w-[180px]">
                                <Select error="" label="Sede" name="sedeId" defaultValue="Todas las sedes" onChange={vm.handleSelectSede} options={vm.sedesOptions} />
                            </div>
                        )}
                    </div>
                    <div className="top-3 relative">
                        <Button color="success" onMouseEnter={() => vm.setIsHoveredExp(true)} onMouseLeave={() => vm.setIsHoveredExp(false)} onClick={vm.handleExport}>
                            <Icon className="mr-4" color={vm.isHoveredExp ? '#fff' : '#22C55D'} icon="icon-park-outline:excel" width="20" height="20" />
                            Exportar Excel
                        </Button>
                    </div>
                </div>
                <div className='w-full bg-[#fff] p-4 rounded-md'>
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
                                <div className="flex justify-end mt-5 mb-5 pr-[24px]">
                                    <div>
                                        {[['Tickets:', r.totalTickets], ['Notas de Venta:', r.totalNotasVenta], ['Recibos por Honorarios:', r.totalRecibosHonorarios], ['Comprobantes de Pago:', r.totalComprobantesPago], ['Notas de Pedido:', r.totalNotasPedido], ['Órdenes de Trabajo:', r.totalOrdenesTrabajo], ['Total:', r.totalVenta]].map(([label, val]) => (
                                            <div key={label as string} className="flex"><label className="block w-[200px] text-[14px]">{label as string}</label><strong className="text-[13px]">S/ {(val as number).toFixed(2)}</strong></div>
                                        ))}
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