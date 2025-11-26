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

const ReportesComprobantes = () => {

    const { reportInvoices, getAllReportInvoice, resumenReporte, exportExcelReport } = useAccountingStore();
    const { auth } = useAuthStore();

    const [isHoveredExp, setIsHoveredExp] = useState(false);
    const [isHoveredImp, setIsHoveredImp] = useState(false);
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

    console.log(auth)

    useEffect(() => {
        getAllReportInvoice({
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            empresaId: auth?.empresaId
        })
    }, [fechaFin, fechaInicio, auth])

    console.log(reportInvoices)

    const reports = reportInvoices?.map((item: any) => ({
        comprobante: item?.comprobante,
        serie: item?.serie,
        correlativo: item?.correlativo,
        ruc: item?.cliente?.nroDoc,
        cliente: item?.cliente?.nombre,
        fecha: moment(item?.fechaEmision).format('DD/MM/YYYY'),
        estado: item?.estadoEnvioSunat,
        montoGravadas: item?.mtoOperGravadas.toFixed(2),
        montoIGV: item?.mtoIGV.toFixed(2),
        total: `S/ ${item?.mtoImpVenta.toFixed(2)}`
    }))

    console.log(resumenReporte)

    return (
        <div>
            <div className="px-3 md:px-8 pt-0 md:pt-5 md:mt-0 pb-10">
                {/* Estadísticas */}
                <div className="mb-6 space-y-4 md:space-y-0 md:flex md:justify-between md:items-center">
                    {/* Filtros de fecha */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Calendar name="fechaInicio" onChange={handleDate} text="Fecha inicio" />
                        <Calendar name="fechaFin" onChange={handleDate} text="Fecha Fin" />
                    </div>
                    <div className="w-full sm:w-auto">
                        <Button
                            color="success"
                            onMouseEnter={() => setIsHoveredExp(true)}
                            onMouseLeave={() => setIsHoveredExp(false)}
                            onClick={() => {
                                exportExcelReport({
                                    empresaId: auth?.empresaId,
                                    fechaInicio: fechaInicio,
                                    fechaFin: fechaFin
                                });
                            }}
                            className="w-full sm:w-auto"
                        >
                            <Icon
                                className="mr-2"
                                color={isHoveredExp ? '#fff' : '#22C55D'}
                                icon="icon-park-outline:excel"
                                width="20"
                                height="20"
                            />
                            Exportar Exc.
                        </Button>
                    </div>
                </div>
                <div className='w-full bg-[#fff] p-4 rounded-md'>
                    {
                        reports?.length > 0 ? (
                            <>
                                <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                                    <DataTable actions={[]} bodyData={reports}
                                        headerColumns={[
                                            'Comprobante',
                                            'Serie',
                                            'Correlativo',
                                            'Nro. Documento',
                                            'Cliente',
                                            'Fecha',
                                            'Estado',
                                            'Oper. Gravada',
                                            'IGV',
                                            'Total'
                                        ]} />
                                </div>
                                {
                                    resumenReporte !== null && (
                                        <div className="mt-5 mb-5 px-4 md:flex md:justify-end md:pr-[24px]">
                                            <div className="space-y-1">
                                                <div className="flex justify-between md:justify-start">
                                                    <label className="block w-[180px] md:w-[200px] text-[13px] md:text-[14px]" htmlFor="">Boletas:</label><strong className="text-[13px]">S/ {resumenReporte.totalBoletas.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex justify-between md:justify-start">
                                                    <label className="block w-[180px] md:w-[200px] text-[13px] md:text-[14px]" htmlFor="">Facturas:</label><strong className="text-[13px]">S/ {resumenReporte.totalFacturas.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex justify-between md:justify-start">
                                                    <label className="block w-[180px] md:w-[200px] text-[13px] md:text-[14px]" htmlFor="">Nota de crédito:</label><strong className="text-[13px]">S/ {resumenReporte.totalNotasCredito.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex justify-between md:justify-start">
                                                    <label className="block w-[180px] md:w-[200px] text-[13px] md:text-[14px]" htmlFor="">Nota de débito:</label><strong className="text-[13px]">S/ {resumenReporte.totalNotasDebito.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex justify-between md:justify-start">
                                                    <label className="block w-[180px] md:w-[200px] text-[13px] md:text-[14px]" htmlFor="">Total Descuento:</label><strong className="text-[13px]">S/ {resumenReporte.totalDescuentos.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex justify-between md:justify-start">
                                                    <label className="block w-[180px] md:w-[200px] text-[13px] md:text-[14px]" htmlFor="">Total Oper. gravadas:</label><strong className="text-[13px]">S/ {resumenReporte.totalGravadas.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex justify-between md:justify-start">
                                                    <label className="block w-[180px] md:w-[200px] text-[13px] md:text-[14px]" htmlFor="">Total IGV:</label><strong className="text-[13px]">S/ {resumenReporte.totalIGV.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex justify-between md:justify-start border-t pt-2 mt-2">
                                                    <label className="block w-[180px] md:w-[200px] text-[14px] md:text-[15px] font-semibold" htmlFor="">Total:</label><strong className="text-[14px] md:text-[15px]">S/ {resumenReporte.totalVenta.toFixed(2)}</strong>
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

export default ReportesComprobantes;