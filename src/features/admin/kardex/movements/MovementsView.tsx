import React from 'react';
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

export default function MovementsView() {
    const vm = useMovementsViewModel();
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

    if (loading && !kardex) {
        return <Loading />;
    }

    const tableActions = [
        {
            onClick: (item: any) => actions.openModal(item._original),
            className: "edit",
            icon: <Icon className="text-blue-500" icon="solar:eye-bold" width={20} height={20} />,
            tooltip: "Ver Detalle"
        }
    ];

    return (
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Movimientos de Kardex</h1>
                    <p className="text-sm text-gray-500 mt-1">Control de entradas, salidas y ajustes de inventario</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="mb-6 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                    <h3 className="font-semibold text-gray-800">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            label="Buscar Producto"
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
                            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                {products.map((p: any) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => actions.selectProduct(p)}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-b-0 transition-colors"
                                    >
                                        <div className="font-medium text-gray-800">{p.descripcion}</div>
                                        <div className="text-xs text-gray-500">{p.codigo} • {p?.unidadMedida?.nombre}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                    <Button onClick={actions.clearFilters} color="secondary">
                        <Icon icon="solar:refresh-linear" className="mr-1" /> Limpiar
                    </Button>
                    <Button onClick={actions.applyFilters}>
                        <Icon icon="solar:magnifer-linear" className="mr-1" /> Buscar
                    </Button>
                </div>
            </div>

            {/* Tabla de movimientos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:document-text-bold-duotone" className="text-blue-600 text-xl" />
                        <h3 className="font-semibold text-gray-800">Historial de Movimientos</h3>
                    </div>
                    <span className="text-sm text-gray-500">
                        {pagination.total} registros encontrados
                    </span>
                </div>

                <div className="p-4">
                    {movimientosTable?.length > 0 ? (
                        <>
                            <div className="overflow-hidden overflow-x-auto">
                                <DataTable
                                    actions={tableActions}
                                    bodyData={movimientosTable}
                                    headerColumns={[
                                        'Fecha',
                                        'Producto',
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
                            <div className="mt-4 pt-4 border-t border-gray-100">
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
                        <div className="py-12 text-center">
                            <Icon icon="solar:box-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No se encontraron movimientos</p>
                            <p className="text-sm text-gray-400 mt-1">Ajusta los filtros o selecciona un rango de fechas diferente</p>
                        </div>
                    )}
                </div>
            </div>

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
                    <div className="flex flex-col gap-6 p-6">
                        <div className="flex flex-col gap-6">
                            {/* Transaction Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-2">
                                    <Icon icon="solar:clipboard-list-linear" className="text-gray-400" />
                                    <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                        Detalles Operación
                                    </h5>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
                                        <div className="text-sm font-medium text-gray-900">
                                            {helpers.formatDate(selectedMovimiento.fecha)}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                                        <div className="text-sm font-bold text-gray-900">
                                            {selectedMovimiento.cantidad} {selectedMovimiento.producto?.unidadMedida?.codigo || 'UN'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Concepto</label>
                                    <p className="text-sm text-gray-800 bg-gray-50 border border-gray-100 p-3 rounded-lg">
                                        {selectedMovimiento.concepto}
                                    </p>
                                </div>

                                {selectedMovimiento.lote && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Lote</label>
                                        <p className="text-sm font-medium text-gray-900">{selectedMovimiento.lote}</p>
                                    </div>
                                )}
                            </div>

                            {/* Financial & Stock */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-2">
                                    <Icon icon="solar:chart-square-linear" className="text-gray-400" />
                                    <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                        Valores y Stock
                                    </h5>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Stock Anterior</label>
                                        <p className="text-lg font-semibold text-gray-700 leading-none">{selectedMovimiento.stockAnterior}</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                                        <label className="block text-xs font-medium text-blue-600 mb-1">Stock Actual</label>
                                        <p className="text-lg font-bold text-blue-700 leading-none">{selectedMovimiento.stockActual}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Costo Unit.</label>
                                        <p className="text-sm font-medium text-gray-900">{
                                            !isNaN(Number(selectedMovimiento.costoUnitario)) ? helpers.formatCurrency(Number(selectedMovimiento.costoUnitario)) : '-'
                                        }</p>
                                    </div>
                                    {selectedMovimiento.valorTotal && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Valor Total</label>
                                            <p className="text-sm font-bold text-emerald-600">{
                                                !isNaN(Number(selectedMovimiento.valorTotal)) ? helpers.formatCurrency(Number(selectedMovimiento.valorTotal)) : '-'
                                            }</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer: Metadata */}
                        {(selectedMovimiento.usuario || selectedMovimiento.comprobante) && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-auto flex flex-col gap-2 text-xs text-gray-500">
                                {selectedMovimiento.usuario && (
                                    <div className="flex items-center gap-2">
                                        <Icon icon="solar:user-circle-linear" width={16} />
                                        <span>Responsable: <span className="font-medium text-gray-700">{selectedMovimiento.usuario.nombre}</span></span>
                                    </div>
                                )}
                                {selectedMovimiento.comprobante && (
                                    <div className="flex items-center gap-2 border-t border-gray-200 pt-2">
                                        <Icon icon="solar:document-linear" width={16} />
                                        <span>Documento: <span className="font-medium text-gray-700">
                                            {selectedMovimiento.comprobante.tipoDoc} {selectedMovimiento.comprobante.serie}-{selectedMovimiento.comprobante.correlativo}
                                        </span></span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
