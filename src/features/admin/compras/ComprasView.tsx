import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import Pagination from '@/components/Pagination';
import Select from '@/components/Select';
import { Calendar } from '@/components/Date';
import { useComprasViewModel } from './useComprasViewModel';
import { useAuthStore } from '@/zustand/auth';
import { useSedesStore } from '@/zustand/sedes';
import ModalDetalleCompra from '@/pages/admin/compras/ModalDetalleCompra';
import ModalRegistrarPagoCompra from '@/pages/admin/compras/ModalRegistrarPagoCompra';
import ModalHistorialPagosCompra from '@/pages/admin/compras/ModalHistorialPagosCompra';
import ModalNuevaCompra from '@/pages/admin/compras/ModalNuevaCompra';
import { motion } from 'framer-motion';
import { fadeUp, interactiveHover, listItemFadeUp, listItemHidden, listStagger } from '@/lib/motion/presets';

export default function ComprasView() {
    const vm = useComprasViewModel();
    const { actions, tableData, totalCompras, totalPorPagar, totalVencidos } = vm;
    const { auth } = useAuthStore();
    const { sedes, listarSedes } = useSedesStore();

    const isAdmin = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA';

    const sedesOptions = [
        { id: 0, value: "Todas las sedes" },
        ...sedes.map(s => ({ id: s.id, value: s.esPrincipal ? `${s.nombre}` : s.nombre }))
    ];

    useEffect(() => {
        if (isAdmin) listarSedes();
    }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch on mount and filter changes
    useEffect(() => {
        vm.actions.refresh();
    }, [vm.currentPage, vm.itemsPerPage, vm.debounce, vm.filters.estadoPago, vm.filters.fechaInicio, vm.filters.fechaFin, vm.filters.sedeId]); // eslint-disable-line react-hooks/exhaustive-deps

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
            hide: (row: any) => Number(row._raw?.saldo || 0) <= 0.01 || row._raw?.estadoPago === 'COMPLETADO',
        },
        {
            icon: <Icon icon="solar:eye-bold" />,
            tooltip: 'Ver detalle',
            className: 'edit',
            onClick: (row: any) => actions.openDetalle(row.id),
        },
    ];

    return (
        <motion.div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]" variants={fadeUp} initial="initial" animate="animate">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Cuentas por Pagar / Compras</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de compras y pagos a proveedores</p>
                </div>
                <motion.div whileHover={interactiveHover.whileHover} whileTap={interactiveHover.whileTap}>
                <Button color="secondary" className="flex items-center gap-2 !bg-violet-600 !text-white shadow-md shadow-violet-200 border-none hover:opacity-90" onClick={actions.openNuevaCompra}>
                    <Icon icon="solar:cart-plus-bold" className="text-lg" />
                    Nueva Compra
                </Button>
                </motion.div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                {/* Stats */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/20">
                    <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" variants={listStagger} initial="initial" animate="animate">
                        {/* KPI 1 */}
                        <motion.div className="bg-white dark:bg-[#111827] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow" variants={{ initial: listItemHidden, animate: listItemFadeUp }} whileHover={interactiveHover.whileHover} whileTap={interactiveHover.whileTap} layout>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-violet-600 dark:text-violet-400 text-[13px] font-bold tracking-wide uppercase">Facturas (Vista)</h3>
                                <div className="w-10 h-10 rounded-[14px] bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/20 group-hover:-translate-y-1 transition-transform">
                                    <Icon icon="solar:bill-list-bold-duotone" className="text-xl" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{totalCompras || 0}</h2>
                                <div className="flex items-center gap-1.5 opacity-0">
                                    <span className="text-gray-400 text-xs font-medium">.</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* KPI 2 */}
                        <motion.div className="bg-white dark:bg-[#111827] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow" variants={{ initial: listItemHidden, animate: listItemFadeUp }} whileHover={interactiveHover.whileHover} whileTap={interactiveHover.whileTap} layout>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-rose-500 dark:text-rose-400 text-[13px] font-bold tracking-wide uppercase">Saldo por Pagar</h3>
                                <div className="w-10 h-10 rounded-[14px] bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/20 group-hover:-translate-y-1 transition-transform">
                                    <Icon icon="solar:money-bag-bold-duotone" className="text-xl" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">S/ {totalPorPagar.toFixed(2)}</h2>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-400 text-xs font-medium">(Página actual)</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* KPI 3 */}
                        <motion.div className="bg-white dark:bg-[#111827] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow" variants={{ initial: listItemHidden, animate: listItemFadeUp }} whileHover={interactiveHover.whileHover} whileTap={interactiveHover.whileTap} layout>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-amber-500 dark:text-amber-400 text-[13px] font-bold tracking-wide uppercase">Vencidos (+1 día)</h3>
                                <div className="w-10 h-10 rounded-[14px] bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/20 group-hover:-translate-y-1 transition-transform">
                                    <Icon icon="solar:calendar-bold-duotone" className="text-xl" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{totalVencidos}</h2>
                                <div className="flex items-center gap-1.5 opacity-0">
                                    <span className="text-gray-400 text-xs font-medium">.</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
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
                        {isAdmin && (
                            <div>
                                <Select
                                    error=""
                                    label="Sede"
                                    name="sedeId"
                                    defaultValue="Todas las sedes"
                                    onChange={(id: any, _value: string) => actions.setSedeId(id === 0 ? null : Number(id))}
                                    options={sedesOptions}
                                />
                            </div>
                        )}
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
                             <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
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
                        <motion.div className="py-12 text-center" variants={fadeUp} initial="initial" animate="animate">
                            <Icon icon="solar:cart-large-minimalistic-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No se encontraron compras</p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ModalDetalleCompra
                isOpen={vm.isOpenDetalle}
                onClose={actions.closeDetalle}
                compraId={vm.selectedCompraId}
            />

            <ModalRegistrarPagoCompra
                isOpen={!!vm.showPaymentModal}
                compra={vm.selectedCompra}
                onClose={actions.closePago}
                onSuccess={actions.handlePaymentSuccess}
            />

            <ModalHistorialPagosCompra
                isOpen={!!vm.showHistorialModal}
                compra={vm.selectedCompra}
                onClose={actions.closeHistorial}
            />

            <ModalNuevaCompra
                isOpen={vm.showNuevaCompraModal}
                onClose={actions.closeNuevaCompra}
                onSuccess={actions.handleNuevaCompraSuccess}
            />
        </motion.div>
    );
}
