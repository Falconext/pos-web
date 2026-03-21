"use client";
import { useReporteInformalesViewModel } from '@/features/admin/contabilidad/useContabilidadReporteViewModel';
import Button from "@/components/Button";
import DataTable from "@/components/Datatable";
import { Calendar } from "@/components/Date";
import TableSkeleton from "@/components/Skeletons/table";
import { Icon } from "@iconify/react";

const ReportesComprobantesInformales = () => {
    const vm = useReporteInformalesViewModel();
    const r = vm.resumenReporteInformal;

    return (
        <div>
            <div className="md:px-8 pt-0 md:pt-5 md:mt-0 pb-10">
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex justify-start gap-3 mb-0">
                        <Calendar name="fechaInicio" onChange={vm.handleDate} text="Fecha inicio" />
                        <Calendar name="fechaFin" onChange={vm.handleDate} text="Fecha Fin" />
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
                                <DataTable actions={[]} bodyData={vm.reports} headerColumns={['Comprobante', 'Serie', 'Correlativo', 'Nro. Documento', 'Cliente', 'Fecha', 'Estado Pago', 'Saldo', 'Medio Pago', 'Estado OT', 'Adelanto', 'Total']} />
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
                    ) : <TableSkeleton />}
                </div>
            </div>
        </div>
    );
};

export default ReportesComprobantesInformales;