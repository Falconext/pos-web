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
        <div className="min-h-screen pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reporte Contable</h1>
                    <p className="text-sm text-gray-500 mt-1">Resumen de comprobantes electrónicos por período</p>
                </div>
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
                >
                    <Icon icon="solar:export-bold" className="mr-2" />
                    Exportar Excel
                </Button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters Section */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                        <h3 className="font-semibold text-gray-800">Filtros</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Calendar name="fechaInicio" onChange={handleDate} text="Fecha inicio" />
                        <Calendar name="fechaFin" onChange={handleDate} text="Fecha Fin" />
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-4">
                    {reports?.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
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
                            {resumenReporte !== null && (
                                <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Icon icon="solar:chart-2-bold-duotone" className="text-blue-600" />
                                        Resumen del Período
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-xs text-gray-500">Boletas</p>
                                            <p className="text-lg font-bold text-gray-900">S/ {resumenReporte.totalBoletas.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-xs text-gray-500">Facturas</p>
                                            <p className="text-lg font-bold text-gray-900">S/ {resumenReporte.totalFacturas.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-xs text-gray-500">Nota de Crédito</p>
                                            <p className="text-lg font-bold text-red-500">S/ {resumenReporte.totalNotasCredito.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-xs text-gray-500">Nota de Débito</p>
                                            <p className="text-lg font-bold text-gray-900">S/ {resumenReporte.totalNotasDebito.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-xs text-gray-500">Total Descuentos</p>
                                            <p className="text-lg font-bold text-orange-500">S/ {resumenReporte.totalDescuentos.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-xs text-gray-500">Total Oper. Gravadas</p>
                                            <p className="text-lg font-bold text-gray-900">S/ {resumenReporte.totalGravadas.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                            <p className="text-xs text-gray-500">Total IGV</p>
                                            <p className="text-lg font-bold text-gray-900">S/ {resumenReporte.totalIGV.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white">
                                            <p className="text-xs text-blue-100">Total Ventas</p>
                                            <p className="text-xl font-bold">S/ {resumenReporte.totalVenta.toFixed(2)}</p>
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
    )

}

export default ReportesComprobantes;