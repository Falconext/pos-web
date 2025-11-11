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

const ArqueoCaja = () => {

    const { 
        arqueoData, 
        getAllArqueo, 
        exportExcelArqueo 
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
        getAllArqueo({
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            empresaId: auth?.empresaId
        })
    }, [fechaFin, fechaInicio, auth])

    console.log('Arqueo data:', arqueoData)

    const movimientos = arqueoData?.movimientosCaja?.map((item: any) => ({
        tipoMovimiento: item?.tipo,
        documento: item?.documento,
        cliente: item?.cliente,
        fecha: moment(item?.fecha).format('DD/MM/YYYY HH:mm'),
        concepto: item?.concepto,
        medioPago: item?.medioPago,
        monto: `S/ ${item?.monto.toFixed(2)}`,
        referencia: item?.referencia || '-',
    })) || [];

    const resumen = arqueoData?.resumen;

    console.log(movimientos)

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
                                exportExcelArqueo({
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

                {/* Resumen de Caja */}
                {resumen && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Total Efectivo</h3>
                            <p className="text-2xl font-bold text-green-600">S/ {resumen.detalleEfectivo.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Total Digital</h3>
                            <p className="text-2xl font-bold text-blue-600">S/ {resumen.totalDigital.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Total Tarjetas</h3>
                            <p className="text-2xl font-bold text-purple-600">S/ {resumen.totalTarjetas.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Comprobantes</h3>
                            <p className="text-2xl font-bold text-gray-700">{resumen.totalComprobantes}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Total Ingresos</h3>
                            <p className="text-2xl font-bold text-indigo-600">S/ {resumen.totalIngresos.toFixed(2)}</p>
                        </div>
                    </div>
                )}

                {/* Detalle por Medios de Pago */}
                {resumen && (
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <h3 className="text-lg font-semibold mb-4">Detalle por Medio de Pago</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Efectivo</p>
                                <p className="text-lg font-bold">S/ {resumen.detalleEfectivo.toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Yape</p>
                                <p className="text-lg font-bold">S/ {resumen.detalleYape.toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Plin</p>
                                <p className="text-lg font-bold">S/ {resumen.detallePlin.toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Transferencia</p>
                                <p className="text-lg font-bold">S/ {resumen.detalleTransferencia.toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Tarjeta</p>
                                <p className="text-lg font-bold">S/ {resumen.detalleTarjeta.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Movimientos de Caja */}
                <div className='w-full bg-[#fff] p-4 rounded-md'>
                    <h3 className="text-lg font-semibold mb-4">Movimientos de Caja</h3>
                    {
                        movimientos?.length > 0 ? (
                            <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                                <DataTable 
                                    actions={[]} 
                                    bodyData={movimientos}
                                    headerColumns={[
                                        'Tipo',
                                        'Documento',
                                        'Cliente',
                                        'Fecha',
                                        'Concepto',
                                        'Medio Pago',
                                        'Monto',
                                        'Referencia'
                                    ]} 
                                />
                            </div>
                        ) :
                            <TableSkeleton />
                    }
                </div>
            </div>
        </div>
    )
}

export default ArqueoCaja;