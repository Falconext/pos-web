import React, { useEffect, useState } from 'react';
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
import ModalConfirm from '@/components/ModalConfirm';
import { motion } from 'framer-motion';
import { fadeUp, interactiveHover, listItemFadeUp, listItemHidden, listStagger } from '@/lib/motion/presets';

export default function ComprasView() {
    const vm = useComprasViewModel();
    const { actions, tableData, totalCompras, totalPorPagar, totalVencidos } = vm;
    const { auth } = useAuthStore();
    const { sedes, listarSedes } = useSedesStore();
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
            icon: <Icon icon="solar:check-circle-bold-duotone" width="20" height="20" color="#10b981" />,
            tooltip: 'Aprobar compra (ingresa el stock)',
            className: 'payment',
            onClick: (row: any) => actions.aprobarCompra(row._raw),
            hide: (row: any) => !isAdmin || row._raw?.estado !== 'PENDIENTE_APROBACION',
        },
        {
            icon: <Icon icon="solar:close-circle-bold-duotone" width="20" height="20" color="#f97316" />,
            tooltip: 'Rechazar compra',
            className: 'delete',
            onClick: (row: any) => actions.rechazarCompra(row._raw),
            hide: (row: any) => !isAdmin || row._raw?.estado !== 'PENDIENTE_APROBACION',
        },
        {
            icon: <Icon icon="solar:hand-money-bold-duotone" width="20" height="20" color="#10b981" />,
            tooltip: 'Registrar Pago',
            className: 'payment',
            onClick: (row: any) => actions.openPago(row._raw),
            hide: (row: any) =>
                Number(row._raw?.saldo || 0) <= 0.01 ||
                row._raw?.estadoPago === 'COMPLETADO' ||
                row._raw?.estado === 'PENDIENTE_APROBACION' ||
                row._raw?.estado === 'RECHAZADA',
        },
        {
            icon: <Icon icon="solar:eye-bold" />,
            tooltip: 'Ver detalle',
            className: 'edit',
            onClick: (row: any) => actions.openDetalle(row.id),
        },
        {
            icon: <Icon icon="solar:pen-2-bold-duotone" width="20" height="20" color="#0ea5e9" />,
            tooltip: 'Editar compra',
            className: 'edit',
            onClick: (row: any) => actions.openEditar(row._raw),
        },
        {
            icon: <Icon icon="solar:trash-bin-trash-bold-duotone" width="20" height="20" color="#ef4444" />,
            tooltip: 'Anular compra',
            className: 'delete',
            onClick: (row: any) => actions.openAnular(row._raw),
        },
    ];

    const activeFilterCount = [
        vm.filters.search.trim(),
        vm.filters.fechaInicio,
        vm.filters.fechaFin,
        vm.filters.estadoPago !== 'TODOS' ? vm.filters.estadoPago : '',
        vm.filters.sedeId,
    ].filter(Boolean).length;

    return (
        <motion.div className="min-h-screen bg-gray-50 px-3 pb-4 dark:bg-[#0A0D14] sm:px-2" variants={fadeUp} initial="initial" animate="animate">
            {/* Header */}
            <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">Cuentas por Pagar / Compras</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de compras y pagos a proveedores</p>
                </div>
                <motion.div className="w-full sm:w-auto" whileHover={interactiveHover.whileHover} whileTap={interactiveHover.whileTap}>
                <Button color="secondary" className="flex w-full items-center justify-center gap-2 border-none !bg-violet-600 !text-white shadow-md shadow-violet-200 hover:opacity-90 sm:w-auto" onClick={actions.openNuevaCompra}>
                    <Icon icon="solar:cart-plus-bold" className="text-lg" />
                    Nueva Compra
                </Button>
                </motion.div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                {/* Stats */}
                <div className="border-b border-gray-100 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20 sm:p-5">
                    <motion.div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-6" variants={listStagger} initial="initial" animate="animate">
                        {/* KPI 1 */}
                        <motion.div className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-[#111827] sm:p-5" variants={{ initial: listItemHidden, animate: listItemFadeUp }} whileHover={interactiveHover.whileHover} whileTap={interactiveHover.whileTap} layout>
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
                        <motion.div className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-[#111827] sm:p-5" variants={{ initial: listItemHidden, animate: listItemFadeUp }} whileHover={interactiveHover.whileHover} whileTap={interactiveHover.whileTap} layout>
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
                        <motion.div className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-[#111827] sm:p-5" variants={{ initial: listItemHidden, animate: listItemFadeUp }} whileHover={interactiveHover.whileHover} whileTap={interactiveHover.whileTap} layout>
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
                <div className="border-b border-gray-100 p-4 dark:border-slate-800 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
                        <div className="flex min-w-0 items-center gap-2">
                            <Icon icon="solar:filter-bold-duotone" className="text-xl text-blue-600 dark:text-blue-400" />
                            <div className="min-w-0">
                                <h3 className="font-semibold text-gray-800 dark:text-white">Filtros</h3>
                                <p className="truncate text-xs text-gray-400">{activeFilterCount} activos</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMobileFiltersOpen((value) => !value)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-lg shadow-blue-500/20"
                        >
                            {isMobileFiltersOpen ? 'Ocultar' : 'Ver filtros'}
                            <Icon icon={isMobileFiltersOpen ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} className="text-base" />
                        </button>
                    </div>
                    <div className={`${isMobileFiltersOpen ? 'grid' : 'hidden'} grid-cols-1 gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4`}>
                        <div className="sm:col-span-2 xl:col-span-1">
                            <InputPro
                                name="search"
                                value={vm.filters.search}
                                onChange={(e) => actions.setSearch(e.target.value)}
                                label="Buscar por documento o proveedor"
                                isLabel
                            />
                        </div>
                        <div>
                            <Calendar text="Desde" name="fechaInicio" onChange={actions.handleDate} className="admin-date-filter" portal />
                        </div>
                        <div>
                            <Calendar text="Hasta" name="fechaFin" onChange={actions.handleDate} className="admin-date-filter" portal />
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
                <div className="p-3 sm:p-4">
                    {tableData && tableData.length > 0 ? (
                        <>
                            <div className="space-y-3 md:hidden">
                                {tableData.map((row: any) => {
                                    const compra = row._raw;
                                    const puedePagar = Number(compra?.saldo || 0) > 0.01 && compra?.estadoPago !== 'COMPLETADO';

                                    return (
                                        <motion.article
                                            key={row.id}
                                            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0F172A]"
                                            variants={fadeUp}
                                            initial="initial"
                                            animate="animate"
                                        >
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{row.Fecha}</p>
                                                    <h3 className="mt-1 truncate text-base font-black text-gray-900 dark:text-white">{row.Proveedor}</h3>
                                                    <p className="text-xs font-semibold text-gray-500">{row.Comprobante}</p>
                                                </div>
                                                {row.Pago}
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-3 dark:bg-slate-900/60">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400">Total</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-white">{row.Total}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400">Saldo</p>
                                                    <p className="text-sm font-black text-rose-600 dark:text-rose-300">{row.Saldo}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400">Venc.</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-white">{row['Días Venc.']} días</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => actions.openDetalle(row.id)}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-100 text-xs font-black text-gray-700 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-200"
                                                >
                                                    <Icon icon="solar:eye-bold" className="text-base" />
                                                    Detalle
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => actions.openHistorial(compra)}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-50 text-xs font-black text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                                                >
                                                    <Icon icon="solar:history-bold-duotone" className="text-base" />
                                                    Historial
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => actions.openEditar(compra)}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-50 text-xs font-black text-sky-700 transition hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300"
                                                >
                                                    <Icon icon="solar:pen-2-bold-duotone" className="text-base" />
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => actions.openAnular(compra)}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-50 text-xs font-black text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300"
                                                >
                                                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="text-base" />
                                                    Anular
                                                </button>
                                                {puedePagar && (
                                                    <button
                                                        type="button"
                                                        onClick={() => actions.openPago(compra)}
                                                        className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 dark:shadow-emerald-900/20"
                                                    >
                                                        <Icon icon="solar:hand-money-bold-duotone" className="text-base" />
                                                        Registrar pago
                                                    </button>
                                                )}
                                            </div>
                                        </motion.article>
                                    );
                                })}
                            </div>
                            <div className="hidden overflow-hidden overflow-x-auto md:block">
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

            <ModalNuevaCompra
                isOpen={vm.showEditarModal}
                compra={vm.compraEditar}
                onClose={actions.closeEditar}
                onSuccess={actions.handleEditarSuccess}
            />

            <ModalConfirm
                isOpenModal={vm.showAnularConfirm}
                setIsOpenModal={(v: boolean) => { if (!v) actions.closeAnular(); }}
                confirmSubmit={actions.confirmAnular}
                title="Anular compra"
                information={`¿Seguro que deseas anular la compra ${vm.compraAnular?.serie || ''}-${vm.compraAnular?.numero || ''}? Se revertirá el stock ingresado. Esta acción no se puede deshacer.`}
                confirmText="Anular"
            />
        </motion.div>
    );
}
