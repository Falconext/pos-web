"use client";
import Button from "@/components/Button";
import DataTable from "@/components/Datatable";
import { Calendar } from "@/components/Date"
import TableSkeleton from "@/components/Skeletons/table";
import { useAccountingStore } from "@/zustand/accounting";
import { useAuthStore } from "@/zustand/auth";
import { Icon } from "@iconify/react";
import moment from "moment";
import { useEffect, useState } from "react";

const ReportesComprobantesInformales = () => {

    const { 
        reportInvoicesInformal, 
        getAllReportInvoiceInformal, 
        resumenReporteInformal, 
        exportExcelReportInformal 
    } = useAccountingStore();
    const { auth } = useAuthStore();

    const [isHoveredExp, setIsHoveredExp] = useState(false);
    const [fechaInicio, setFechaInicio] = useState<string>(moment(new Date()).format("YYYY-MM-DD"));
    const [fechaFin, setFechaFin] = useState<string>(moment(new Date()).format("YYYY-MM-DD"));

    const handleDate = (date: string, name: string) => {
        if (!moment(date, 'DD/MM/YYYY', true).isValid()) {
            console.error(`Fecha inválida: ${date} para ${name}`);
            return;
        }
        if (name === "fechaInicio") {
            setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        } else if (name === "fechaFin") {
            setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        }
    };

    useEffect(() => {
        getAllReportInvoiceInformal({
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            empresaId: auth?.empresaId
        })
    }, [fechaFin, fechaInicio, auth])

    console.log('Informales:', reportInvoicesInformal)

    const reports = reportInvoicesInformal?.map((item: any) => ({
        comprobante: item?.comprobante,
        serie: item?.serie,
        correlativo: item?.correlativo,
        ruc: item?.cliente?.nroDoc,
        cliente: item?.cliente?.nombre,
        fecha: moment(item?.fechaEmision).format('DD/MM/YYYY'),
        estadoPago: item?.estadoPago,
        saldo: item?.saldo ? `S/ ${item.saldo.toFixed(2)}` : 'S/ 0.00',
        medioPago: item?.medioPago || '-',
        estadoOT: item?.estadoOT || '-',
        adelanto: item?.adelanto ? `S/ ${item.adelanto.toFixed(2)}` : 'S/ 0.00',
        total: `S/ ${item?.mtoImpVenta.toFixed(2)}`
    }))

    console.log('Resumen informales:', resumenReporteInformal)

    return (
        <div>
            <div className="md:px-8 pt-0 md:pt-5 md:mt-0 pb-10">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="">
                        <div className="flex justify-start gap-3 mb-0">
                            <Calendar name="fechaInicio" onChange={handleDate} text="Fecha inicio" />
                            <Calendar name="fechaFin" onChange={handleDate} text="Fecha Fin" />
                        </div>
                    </div>
                    <div className="top-3 relative">
                        <Button
                            color="success"
                            onMouseEnter={() => setIsHoveredExp(true)}
                            onMouseLeave={() => setIsHoveredExp(false)}
                            onClick={() => {
                                exportExcelReportInformal({
                                    empresaId: auth?.empresaId,
                                    fechaInicio: fechaInicio,
                                    fechaFin: fechaFin
                                });
                            }}
                        >
                            <Icon
                                className="mr-4"
                                color={isHoveredExp ? '#fff' : '#22C55D'}
                                icon="icon-park-outline:excel"
                                width="20"
                                height="20"
                            />
                            Exportar Excel
                        </Button>
                    </div>
                </div>

                {/* Contenido */}
                <div className='w-full bg-[#fff] p-4 rounded-md'>
                    {
                        reports?.length > 0 ? (
                            <>
                                <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                                    <DataTable 
                                        actions={[]} 
                                        bodyData={reports}
                                        headerColumns={[
                                            'Comprobante',
                                            'Serie',
                                            'Correlativo',
                                            'Nro. Documento',
                                            'Cliente',
                                            'Fecha',
                                            'Estado Pago',
                                            'Saldo',
                                            'Medio Pago',
                                            'Estado OT',
                                            'Adelanto',
                                            'Total'
                                        ]} 
                                    />
                                </div>
                                {
                                    resumenReporteInformal !== null && (
                                        <div className="flex justify-end mt-5 mb-5 pr-[24px]">
                                            <div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Tickets:</label>
                                                    <strong className="text-[13px]">S/ {resumenReporteInformal.totalTickets.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Notas de Venta:</label>
                                                    <strong className="text-[13px]">S/ {resumenReporteInformal.totalNotasVenta.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Recibos por Honorarios:</label>
                                                    <strong className="text-[13px]">S/ {resumenReporteInformal.totalRecibosHonorarios.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Comprobantes de Pago:</label>
                                                    <strong className="text-[13px]">S/ {resumenReporteInformal.totalComprobantesPago.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Notas de Pedido:</label>
                                                    <strong className="text-[13px]">S/ {resumenReporteInformal.totalNotasPedido.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Órdenes de Trabajo:</label>
                                                    <strong className="text-[13px]">S/ {resumenReporteInformal.totalOrdenesTrabajo.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Total:</label>
                                                    <strong className="text-[13px]">S/ {resumenReporteInformal.totalVenta.toFixed(2)}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                            </>
                        ) :
                            <TableSkeleton />
                    }

                </div>
            </div>
        </div>
    )
}

export default ReportesComprobantesInformales;