import React, { useState, useRef } from 'react';
import { BarcodeScannerInput } from '@/components/BarcodeScannerInput';
import moment from 'moment';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Loading from '@/components/Loading';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import { Calendar } from '@/components/Date';
import DataTable from '@/components/Datatable';
import { useMovementsViewModel } from './useMovementsViewModel';
import { get } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import {
    InventoryCard,
    InventoryEmptyState,
    InventoryHero,
    InventoryInfoPill,
    InventoryPage,
    InventorySearchBox,
    InventoryToolbar,
    InventoryToolbarButton,
} from '../shared/InventoryChrome';

export default function MovementsView() {
    const vm = useMovementsViewModel();
    const { alert } = useAlertStore();
    const [barcodeInput, setBarcodeInput] = useState('');
    const [barcodeLoading, setBarcodeLoading] = useState(false);
    const barcodeRef = useRef<HTMLInputElement>(null);

    const handleBarcodeScan = async (codigo: string) => {
        const trimmed = codigo.trim();
        if (!trimmed) return;
        setBarcodeLoading(true);
        try {
            const resp: any = await get(`productos/barcode/${encodeURIComponent(trimmed)}`);
            if (resp.code === 1 && resp.data) {
                vm.actions.selectProduct(resp.data);
                setBarcodeInput('');
            } else {
                alert(`Producto no encontrado: ${trimmed}`, 'error');
                setBarcodeInput('');
            }
        } catch {
            alert(`Código de barras no encontrado: ${trimmed}`, 'error');
            setBarcodeInput('');
        } finally {
            setBarcodeLoading(false);
            barcodeRef.current?.focus();
        }
    };

    const {
        loading,
        kardex,
        actions,
        filters,
        productQuery,
        showSuggestions,
        products,
        movimientosTable,
        pagination,
        selectedMovimiento,
        helpers,
        TIPOS_MOVIMIENTO
    } = vm;

    const tableActions = [
        {
            onClick: (item: any) => actions.openModal(item._original),
            className: "edit",
            icon: <Icon className="text-blue-500" icon="solar:eye-bold" width={20} height={20} />,
            tooltip: "Ver Detalle"
        }
    ];

    const renderTipoBadge = (tipo: string) => {
        const colors = helpers.getTipoMovimientoColor(tipo);
        return (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${colors}`}>
                {tipo}
            </span>
        );
    };

    return (
        <InventoryPage>
            <InventoryHero
                icon="solar:box-bold-duotone"
                title="Movimientos de kardex"
                subtitle="Revisa entradas, salidas, ajustes y transferencias con un formato más claro y operativo."
                badge="En vivo"
                actions={
                    <>
                        <InventoryToolbarButton
                            icon="solar:refresh-linear"
                            label="Actualizar"
                            onClick={actions.applyFilters}
                        />
                        <InventoryInfoPill
                            icon="solar:document-text-linear"
                            label={`${pagination.total} registros`}
                        />
                    </>
                }
            />

            <InventoryCard className="mb-6">
                <InventoryToolbar>
                    <div className="flex flex-wrap items-center gap-3">
                        <InventoryToolbarButton
                            icon="solar:refresh-linear"
                            label="Limpiar"
                            onClick={actions.clearFilters}
                        />
                        <InventoryInfoPill
                            icon="solar:filter-linear"
                            label={filters.tipoMovimiento || 'Todos los movimientos'}
                        />
                    </div>
                    <InventorySearchBox
                        value={productQuery}
                        onChange={(value) => actions.handleProductSearchChange({ target: { value } } as any)}
                        placeholder="Buscar producto o código..."
                        className="w-full sm:max-w-md"
                    />
                </InventoryToolbar>

            {/* Filtros */}
            <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                        <Calendar
                            text="Fecha Inicio"
                            name="fechaInicio"
                            onChange={actions.handleDate}
                            isLabel
                            value={moment(filters.fechaInicio, 'YYYY-MM-DD').format('DD/MM/YYYY')}
                        />
                    </div>
                    <div>
                        <Calendar
                            text="Fecha Fin"
                            name="fechaFin"
                            onChange={actions.handleDate}
                            isLabel
                            value={moment(filters.fechaFin, 'YYYY-MM-DD').format('DD/MM/YYYY')}
                        />
                    </div>
                    <div>
                        <Select
                            name="tipoMovimiento"
                            label="Tipo de Movimiento"
                            error={""}
                            value={filters.tipoMovimiento}
                            onChange={(id) => actions.handleFilterChange('tipoMovimiento', String(id))}
                            options={TIPOS_MOVIMIENTO.map(t => ({ id: t.value, value: t.label }))}
                            withLabel
                        />
                    </div>
                    <div className="relative">
                        <InputPro
                            name="productoSearch"
                            label="Producto filtrado"
                            isLabel
                            value={productQuery}
                            onChange={actions.handleProductSearchChange}
                            placeholder="Nombre o código..."
                            onClick={() => {
                                if (productQuery && productQuery.trim().length >= 2) actions.setShowSuggestions(true);
                            }}
                            handleOnBlur={() => setTimeout(() => actions.setShowSuggestions(false), 150)}
                        />
                        {showSuggestions && products && products.length > 0 && (
                            <div className="absolute z-20 mt-1 w-full bg-white dark:bg-[#1E2435] border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
                                {products.map((p: any) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => actions.selectProduct(p)}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 text-sm border-b border-gray-50 dark:border-slate-700 last:border-b-0 transition-colors"
                                    >
                                        <div className="font-medium text-gray-800 dark:text-gray-200">{p.descripcion}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{p.codigo} • {p?.unidadMedida?.nombre}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Barcode scanner filter */}
                <BarcodeScannerInput
                    className="mt-4"
                    inputRef={barcodeRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onScan={handleBarcodeScan}
                    loading={barcodeLoading}
                    placeholder="Escanear código de barras para filtrar movimientos..."
                />

                <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <Button onClick={actions.clearFilters} color="secondary" className="w-full sm:w-auto rounded-2xl">
                        <Icon icon="solar:refresh-linear" className="mr-1" /> Limpiar
                    </Button>
                    <Button onClick={actions.applyFilters} color="primary" className="w-full sm:w-auto rounded-2xl">
                        <Icon icon="solar:magnifer-linear" className="mr-1" /> Buscar
                    </Button>
                </div>
            </div>
            </InventoryCard>

            {loading && !kardex ? (
                <div className="flex justify-center items-center py-20">
                    <Icon icon="line-md:loading-twotone-loop" className="text-4xl text-blue-500" />
                    <span className="ml-3 text-gray-500 font-medium">Cargando movimientos...</span>
                </div>
            ) : (
                <>
                    {/* Tabla de movimientos */}
            <InventoryCard>
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:document-text-bold-duotone" className="text-blue-600 text-xl" />
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Historial de Movimientos</h3>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {pagination.total} registros encontrados
                    </span>
                </div>

                <div className="p-3 sm:p-4">
                    {movimientosTable?.length > 0 ? (
                        <>
                            <div className="hidden md:block overflow-hidden overflow-x-auto">
                                <DataTable
                                    actions={tableActions}
                                    bodyData={movimientosTable}
                                    headerColumns={[
                                        'Fecha',
                                        'Producto',
                                        'Sede',
                                        'Tipo',
                                        'Concepto',
                                        'Cantidad',
                                        'Stock Anterior',
                                        'Stock Actual',
                                        'Costo Unitario',
                                        'Precio Unitario',
                                        'Ganancia/Unidad'
                                    ]}
                                />
                            </div>
                            <div className="md:hidden space-y-3">
                                {movimientosTable.map((row: any, index: number) => (
                                    <article key={`${row.fecha}-${row.producto}-${index}`} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0F1623]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{row.fecha}</p>
                                                <h3 className="mt-1 line-clamp-2 text-sm font-black text-gray-900 dark:text-white">{row.producto}</h3>
                                                <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{row.sede}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => actions.openModal(row._original)}
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
                                                aria-label="Ver detalle"
                                            >
                                                <Icon icon="solar:eye-bold" width={20} height={20} />
                                            </button>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-3">
                                            {renderTipoBadge(row.tipo)}
                                            <p className={`text-lg font-black ${Number(row.cantidad) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {Number(row.cantidad) > 0 ? '+' : ''}{row.cantidad}
                                            </p>
                                        </div>

                                        <p className="mt-3 rounded-xl bg-gray-50 p-3 text-xs font-medium leading-relaxed text-gray-600 dark:bg-slate-800/70 dark:text-gray-300">
                                            {row.concepto}
                                        </p>

                                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                            <div className="rounded-xl bg-gray-50 p-3 dark:bg-slate-800/70">
                                                <p className="font-bold uppercase tracking-wide text-gray-400">Stock anterior</p>
                                                <p className="mt-1 font-black text-gray-900 dark:text-white">{row.stockAnterior}</p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 p-3 dark:bg-slate-800/70">
                                                <p className="font-bold uppercase tracking-wide text-gray-400">Stock actual</p>
                                                <p className="mt-1 font-black text-gray-900 dark:text-white">{row.stockActual}</p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 p-3 dark:bg-slate-800/70">
                                                <p className="font-bold uppercase tracking-wide text-gray-400">Costo</p>
                                                <p className="mt-1 font-black text-gray-900 dark:text-white">{row.costoUnitario}</p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 p-3 dark:bg-slate-800/70">
                                                <p className="font-bold uppercase tracking-wide text-gray-400">Precio</p>
                                                <p className="mt-1 font-black text-gray-900 dark:text-white">{row.precioUnitario}</p>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                <Pagination
                                    data={movimientosTable}
                                    optionSelect
                                    currentPage={vm.currentPage}
                                    indexOfFirstItem={pagination.indexOfFirstItem}
                                    indexOfLastItem={pagination.indexOfLastItem}
                                    setcurrentPage={actions.setcurrentPage}
                                    setitemsPerPage={actions.setitemsPerPage}
                                    pages={pagination.pages}
                                    total={pagination.total}
                                />
                            </div>
                        </>
                    ) : (
                        <InventoryEmptyState
                            icon="solar:box-linear"
                            title="No se encontraron movimientos"
                            subtitle="Ajusta los filtros, cambia el rango de fechas o prueba con otro producto."
                        />
                    )}
                </div>
            </InventoryCard>
            </>
            )}

            {/* Modal de Detalle */}
            <Modal
                isOpenModal={!!selectedMovimiento}
                closeModal={actions.closeModal}
                title="Detalle del Movimiento"
                position="right"
                height="auto"
                width="450px"
            >
                {selectedMovimiento && (
                    <div className="flex flex-col gap-6 p-6 dark:bg-[#111827]">
                        <div className="flex flex-col gap-6">
                            {/* Transaction Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2 mb-2">
                                    <Icon icon="solar:clipboard-list-linear" className="text-gray-400 dark:text-gray-500" />
                                    <h5 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                        Detalles Operación
                                    </h5>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha</label>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                            {helpers.formatDate(selectedMovimiento.fecha)}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cantidad</label>
                                        <div className="text-sm font-bold text-gray-900 dark:text-gray-200">
                                            {parseFloat(Number(selectedMovimiento.cantidad ?? 0).toFixed(3))} {selectedMovimiento.producto?.unidadMedida?.codigo || 'UN'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Concepto</label>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-lg">
                                        {String(selectedMovimiento.concepto ?? '').replace(/(\d+\.\d{1,3})\d+/g, '$1')}
                                    </p>
                                </div>

                                {selectedMovimiento.lote && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Lote</label>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{selectedMovimiento.lote}</p>
                                    </div>
                                )}
                            </div>

                            {/* Financial & Stock */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2 mb-2">
                                    <Icon icon="solar:chart-square-linear" className="text-gray-400 dark:text-gray-500" />
                                    <h5 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                        Valores y Stock
                                    </h5>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg text-center">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Stock Anterior</label>
                                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 leading-none">{parseFloat(Number(selectedMovimiento.stockAnterior ?? 0).toFixed(3))}</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                                        <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Stock Actual</label>
                                        <p className="text-lg font-bold text-blue-700 dark:text-blue-400 leading-none">{parseFloat(Number(selectedMovimiento.stockActual ?? 0).toFixed(3))}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Costo Unit.</label>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{
                                            !isNaN(Number(selectedMovimiento.costoUnitario)) ? helpers.formatCurrency(Number(selectedMovimiento.costoUnitario)) : '-'
                                        }</p>
                                    </div>
                                    {selectedMovimiento.valorTotal && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor Total</label>
                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{
                                                !isNaN(Number(selectedMovimiento.valorTotal)) ? helpers.formatCurrency(Number(selectedMovimiento.valorTotal)) : '-'
                                            }</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer: Metadata */}
                        {(selectedMovimiento.usuario || selectedMovimiento.comprobante) && (
                            <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 mt-auto flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400">
                                {selectedMovimiento.usuario && (
                                    <div className="flex items-center gap-2">
                                        <Icon icon="solar:user-circle-linear" width={16} />
                                        <span>Responsable: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedMovimiento.usuario.nombre}</span></span>
                                    </div>
                                )}
                                {selectedMovimiento.comprobante && (
                                    <div className="flex items-center gap-2 border-t border-gray-200 dark:border-slate-700 pt-2">
                                        <Icon icon="solar:document-linear" width={16} />
                                        <span>Documento: <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {selectedMovimiento.comprobante.tipoDoc} {selectedMovimiento.comprobante.serie}-{selectedMovimiento.comprobante.correlativo}
                                        </span></span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </InventoryPage>
    );
}
