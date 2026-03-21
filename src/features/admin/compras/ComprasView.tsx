import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import Pagination from '@/components/Pagination';
import Select from '@/components/Select';
import { Calendar } from '@/components/Date';
import { useComprasViewModel } from './useComprasViewModel';
import ModalDetalleCompra from '@/pages/admin/compras/ModalDetalleCompra';
import ModalRegistrarPagoCompra from '@/pages/admin/compras/ModalRegistrarPagoCompra';
import ModalHistorialPagosCompra from '@/pages/admin/compras/ModalHistorialPagosCompra';
import ModalNuevaCompra from '@/pages/admin/compras/ModalNuevaCompra';

export default function ComprasView() {
    const vm = useComprasViewModel();
    const { actions, tableData, totalCompras, totalPorPagar, totalVencidos } = vm;

    // Fetch on mount and filter changes
    useEffect(() => {
        vm.actions.refresh();
    }, [vm.currentPage, vm.itemsPerPage, vm.debounce, vm.filters.estadoPago, vm.filters.fechaInicio, vm.filters.fechaFin]); // eslint-disable-line react-hooks/exhaustive-deps

    const tableActions = [
        {
            icon: <Icon icon="solar:history-bold-duotone" width="20" height="20" color="#6366f1" />,
            tooltip: 'Ver Historial',
            className: 'history',
            onClick: (row: any) => actions.openHistorial(row._raw),
        },
        {
            icon: <Icon icon="solar:hand-money-bold-duotone" width="20" height="20" color="#10b981" />,
            tooltip: 'Registrar Pago',
            className: 'payment',
            onClick: (row: any) => actions.openPago(row._raw),
            hide: (row: any) => row._raw?.estadoPago === 'COMPLETADO',
        },
        {
            icon: <Icon icon="solar:eye-bold" />,
            tooltip: 'Ver detalle',
            className: 'edit',
            onClick: (row: any) => actions.openDetalle(row.id),
        },
    ];

    return (
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cuentas por Pagar / Compras</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de compras y pagos a proveedores</p>
                </div>
                <Button color="secondary" className="flex items-center gap-2" onClick={actions.openNuevaCompra}>
                    <Icon icon="solar:cart-plus-bold" className="text-lg" />
                    Nueva Compra
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Stats */}
                <div className="p-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Icon icon="solar:bill-list-bold-duotone" className="text-blue-600 text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Facturas (Vista)</p>
                                <p className="text-xl font-bold text-gray-900">{totalCompras || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <Icon icon="solar:money-bag-bold-duotone" className="text-red-600 text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Saldo por Pagar</p>
                                <p className="text-xl font-bold text-gray-900">
                                    S/ {totalPorPagar.toFixed(2)}
                                    <span className="text-xs font-normal text-gray-500 block">(Página actual)</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Icon icon="solar:calendar-bold-duotone" className="text-yellow-600 text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Vencidos (+1 día)</p>
                                <p className="text-xl font-bold text-gray-900">{totalVencidos}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-1">
                            <InputPro
                                name="search"
                                value={vm.filters.search}
                                onChange={(e) => actions.setSearch(e.target.value)}
                                label="Buscar por documento o proveedor"
                                isLabel
                            />
                        </div>
                        <div>
                            <Calendar text="Desde" name="fechaInicio" onChange={actions.handleDate} />
                        </div>
                        <div>
                            <Calendar text="Hasta" name="fechaFin" onChange={actions.handleDate} />
                        </div>
                        <div>
                            <Select
                                error=""
                                label="Estado Pago"
                                name="estadoPago"
                                defaultValue="TODOS"
                                onChange={(_id: any, value: string) => actions.setEstadoPago(value)}
                                options={vm.ESTADO_PAGO_OPTIONS}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    {tableData && tableData.length > 0 ? (
                        <>
                            <div className="overflow-hidden overflow-x-auto">
                                <DataTable
                                    bodyData={tableData}
                                    headerColumns={vm.VISIBLE_COMPRAS_COLUMNS}
                                    actions={tableActions}
                                />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Pagination
                                    data={tableData}
                                    optionSelect
                                    currentPage={vm.currentPage}
                                    indexOfFirstItem={vm.indexOfFirstItem}
                                    indexOfLastItem={vm.indexOfLastItem}
                                    setcurrentPage={actions.setcurrentPage}
                                    setitemsPerPage={actions.setitemsPerPage}
                                    pages={vm.pages}
                                    total={totalCompras}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center">
                            <Icon icon="solar:cart-large-minimalistic-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No se encontraron compras</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ModalDetalleCompra
                isOpen={vm.isOpenDetalle}
                onClose={actions.closeDetalle}
                compraId={vm.selectedCompraId}
            />

            {vm.showPaymentModal && vm.selectedCompra && (
                <ModalRegistrarPagoCompra
                    compra={vm.selectedCompra}
                    onClose={actions.closePago}
                    onSuccess={actions.handlePaymentSuccess}
                />
            )}

            {vm.showHistorialModal && vm.selectedCompra && (
                <ModalHistorialPagosCompra
                    compra={vm.selectedCompra}
                    onClose={actions.closeHistorial}
                />
            )}

            <ModalNuevaCompra
                isOpen={vm.showNuevaCompraModal}
                onClose={actions.closeNuevaCompra}
                onSuccess={actions.handleNuevaCompraSuccess}
            />
        </div>
    );
}
