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
            <div className="md:px-8 pt-0 md:pt-5 md:mt-0 pb-10">
                {/* Estadísticas */}
                <div className="mb-6 flex justify-between items-center">
                    {/* Gráficos */}
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
                                exportExcelReport({
                                    empresaId: auth?.empresaId,
                                    fechaInicio: fechaInicio,
                                    fechaFin: fechaFin
                                }); // Llama a la acción de exportación
                            }}
                        >
                            <Icon
                                className="mr-4"
                                color={isHoveredExp ? '#fff' : '#22C55D'} // Cambia el color dinámicamente
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
                                        <div className="flex justify-end mt-5 mb-5 pr-[24px]">
                                            <div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Boletas:</label><strong className="text-[13px]">S/ {resumenReporte.totalBoletas.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Facturas:</label><strong className="text-[13px]">S/ {resumenReporte.totalFacturas.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Nota de credito:</label><strong className="text-[13px]">S/ {resumenReporte.totalNotasCredito.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Nota de debito:</label><strong className="text-[13px]">S/ {resumenReporte.totalNotasDebito.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Total Descuento:</label><strong className="text-[13px]">S/ {resumenReporte.totalDescuentos.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Total Operacion gravadas:</label><strong className="text-[13px]">S/ {resumenReporte.totalGravadas.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Total IGV:</label><strong className="text-[13px]">S/ {resumenReporte.totalIGV.toFixed(2)}</strong>
                                                </div>
                                                <div className="flex">
                                                    <label className="block w-[200px] text-[14px]" htmlFor="">Total:</label><strong className="text-[13px]">S/ {resumenReporte.totalVenta.toFixed(2)}</strong>
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