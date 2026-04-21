"use client";
import { useArqueoViewModel } from '@/features/admin/contabilidad/useArqueoViewModel';
import Button from "@/components/Button";
import DataTable from "@/components/Datatable";
import { Calendar } from "@/components/Date";
import TableSkeleton from "@/components/Skeletons/table";
import { Icon } from "@iconify/react";
import Select from "@/components/Select";

const ArqueoCaja = () => {
    const vm = useArqueoViewModel();
    const { resumen, isAdmin, esPrincipal, sedesOptions, handleSelectSede } = vm;

    return (
        <div>
            <div className="md:px-8 pt-0 md:pt-5 md:mt-0 pb-10">
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex justify-start gap-3 mb-0 flex-wrap">
                        <Calendar name="fechaInicio" onChange={vm.handleDate} text="Fecha inicio" />
                        <Calendar name="fechaFin" onChange={vm.handleDate} text="Fecha Fin" />
                        {isAdmin && esPrincipal && (
                            <div className="min-w-[180px]">
                                <Select error="" label="Sede" name="sedeId" defaultValue="Todas las sedes" onChange={handleSelectSede} options={sedesOptions} />
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
                {resumen && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-500">Total Efectivo</h3><p className="text-2xl font-bold text-green-600">S/ {resumen.detalleEfectivo.toFixed(2)}</p></div>
                        <div className="bg-white p-4 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-500">Total Digital</h3><p className="text-2xl font-bold text-blue-600">S/ {resumen.totalDigital.toFixed(2)}</p></div>
                        <div className="bg-white p-4 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-500">Total Tarjetas</h3><p className="text-2xl font-bold text-purple-600">S/ {resumen.totalTarjetas.toFixed(2)}</p></div>
                        <div className="bg-white p-4 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-500">Comprobantes</h3><p className="text-2xl font-bold text-gray-700">{resumen.totalComprobantes}</p></div>
                        <div className="bg-white p-4 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-500">Total Ingresos</h3><p className="text-2xl font-bold text-indigo-600">S/ {resumen.totalIngresos.toFixed(2)}</p></div>
                    </div>
                )}
                {resumen && (
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <h3 className="text-lg font-semibold mb-4">Detalle por Medio de Pago</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[['Efectivo', resumen.detalleEfectivo], ['Yape', resumen.detalleYape], ['Plin', resumen.detallePlin], ['Transferencia', resumen.detalleTransferencia], ['Tarjeta', resumen.detalleTarjeta]].map(([label, val]) => (
                                <div key={label as string} className="text-center">
                                    <p className="text-sm text-gray-500">{label as string}</p>
                                    <p className="text-lg font-bold">S/ {(val as number).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className='w-full bg-[#fff] p-4 rounded-md'>
                    <h3 className="text-lg font-semibold mb-4">Movimientos de Caja</h3>
                    {vm.movimientos?.length > 0 ? (
                        <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                            <DataTable actions={[]} bodyData={vm.movimientos} headerColumns={['Tipo', 'Documento', 'Cliente', 'Fecha', 'Concepto', 'Medio Pago', 'Monto', 'Referencia']} />
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <Icon icon="solar:wallet-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No hay movimientos de caja</p>
                            <p className="text-sm text-gray-400 mt-1">Selecciona un rango de fechas diferente</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArqueoCaja;