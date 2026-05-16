import React from 'react';
import { BarcodeScannerInput } from '@/components/BarcodeScannerInput';
import { Icon } from '@iconify/react';
import Select from '@/components/Select';
import InputPro from '@/components/InputPro';
import { ICategory } from '@/interfaces/categories';
import { IBrand } from '@/zustand/brands';
import { GrupoModificador } from '@/zustand/modificadores';
import { useProductModalViewModel } from '../useProductModalViewModel';
import { ProductStockManager } from './ProductStockManager';
import { ProductWholesalePricing } from './ProductWholesalePricing';

const afectaciones = [
    { id: "10", value: "Gravado - Operación Onerosa" },
    { id: "20", value: "Exonerado" },
    { id: "30", value: "Inafecto" },
    { id: "40", value: "Exportación" }
];

type ViewProps = ReturnType<typeof useProductModalViewModel>;

export const ProductBasicForm: React.FC<{ vm: ViewProps }> = ({ vm }) => {
    const {
        isFarmacia, isRestaurante, isMobile, isEdit, features, labels,
        formValues, errors, unitOfMeasure, categories, brands, gruposModificadores, gruposSeleccionados,
        isCategorizing,
        handleChange, handleChangeSelect, handleAutoCategorize, handlePrecioUnitarioBlur,
        setShowMedicamentoModal, setShowLotesModal, toggleGrupoSeleccionado
    } = vm;

    if (isFarmacia) {
        return (
            <div className="w-full mt-3 space-y-5">
                {/* Inputs Básicos */}
                <div className="flex flex-col gap-4">
                    <InputPro autocomplete="off" error={errors.codigo} value={formValues?.codigo} name="codigo" onChange={handleChange} isLabel label="Código" />
                    <InputPro autocomplete="off" value={formValues?.descripcion} error={errors.descripcion} name="descripcion" onChange={handleChange} isLabel label="Nombre del medicamento" />

                    <Select defaultValue={formValues?.unidadMedidaNombre} error={""} isSearch options={unitOfMeasure?.map((item: ICategory) => ({ id: item?.id, value: `${item?.nombre}` }))} id="unidadMedidaId" name="unidadMedidaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Unidad de medida" withLabel />
                    <Select defaultValue={formValues.categoriaNombre} error={""} isSearch options={categories?.map((item: ICategory) => ({ id: item?.id, value: `${item?.nombre}` }))} id="categoriaId" name="categoriaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Categoría" withLabel />
                    <Select defaultValue={formValues.marcaNombre} error={""} isSearch options={brands?.map((item: IBrand) => ({ id: item?.id, value: `${item?.nombre}` }))} id="marcaId" name="marcaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Laboratorio/Marca" withLabel />
                </div>

                {/* Botones Selectores de Drawers */}
                <div className="flex flex-col gap-4">
                    <button type="button" onClick={() => setShowMedicamentoModal(true)} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1E2435] hover:border-blue-400 hover:shadow-md transition-all group text-left">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Icon icon="solar:pill-bold-duotone" width={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Detalles del Medicamento</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Principio activo, concentración...</p>
                            </div>
                        </div>
                        <Icon icon="solar:alt-arrow-right-linear" width={20} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600" />
                    </button>

                    <button type="button" onClick={() => setShowLotesModal(true)} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1E2435] hover:border-indigo-400 hover:shadow-md transition-all group text-left">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Icon icon="solar:box-minimalistic-bold-duotone" width={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Gestión de Lotes</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{isEdit ? 'Historial y vencimientos' : 'Configurar lote inicial'}</p>
                            </div>
                        </div>
                        <Icon icon="solar:alt-arrow-right-linear" width={20} className="text-gray-400 dark:text-gray-500 group-hover:text-indigo-600" />
                    </button>
                </div>

                {/* Stock Global */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30">
                    <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-3 ml-1">Inventario General</h5>
                    <div className="flex flex-col gap-4">
                        <InputPro autocomplete="off" type="number" value={formValues?.stock} error={errors.stock} name="stock" onChange={handleChange} isLabel label="Stock Total" placeholder="0" />
                        <div className="flex gap-2">
                            <InputPro autocomplete="off" type="number" value={formValues?.stockMinimo ?? ''} name="stockMinimo" onChange={handleChange} isLabel label="Min." placeholder="5" />
                            <InputPro autocomplete="off" type="number" value={formValues?.stockMaximo ?? ''} name="stockMaximo" onChange={handleChange} isLabel label="Max." placeholder="100" />
                        </div>
                    </div>
                </div>

                {/* Precios */}
                <div className="grid grid-cols-1 gap-4">
                    <InputPro autocomplete="off" type="number" step="0.01" value={formValues?.precioUnitario} error={errors.precioUnitario} name="precioUnitario" onChange={handleChange} handleOnBlur={handlePrecioUnitarioBlur} isLabel label="Precio Venta (S/)" />
                    <InputPro autocomplete="off" type="number" step="0.01" value={formValues?.costoUnitario || ''} name="costoUnitario" onChange={handleChange} isLabel label="Costo (S/)" placeholder="0.00" />
                </div>
            </div>
        );
    }

    // GENERAL AND RESTAURANTS LAYOUT
    return (
        <div className={`md:px-2 px-3 ${isRestaurante ? 'col-span-1' : 'col-span-2'} grid md:grid-cols-2 grid-cols-2 mt-5 md:gap-5 gap-y-2`}>
            <div className="col-span-3 md:col-span-1">
                <InputPro autocomplete="off" error={errors.codigo} value={formValues?.codigo} name="codigo" onChange={handleChange} isLabel label={labels.codigo} />
            </div>

            <div className="col-span-3 md:col-span-1 relative">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{labels.nombre}</label>
                    <button
                        type="button"
                        onClick={handleAutoCategorize}
                        disabled={isCategorizing || !formValues.descripcion}
                        className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${!formValues.descripcion
                            ? 'text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-slate-800'
                            : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800'
                            }`}
                        title="Auto-detectar categoría y marca basada en el nombre"
                    >
                        <Icon icon={isCategorizing ? "mdi:loading" : "mdi:sparkles"} className={isCategorizing ? "animate-spin" : ""} />
                        {isCategorizing ? 'Analizando...' : 'Auto-Categorizar'}
                    </button>
                </div>
                <InputPro autocomplete="off" value={formValues?.descripcion} error={errors.descripcion} name="descripcion" onChange={handleChange} isLabel={false} />
            </div>

            <div className={`col-span-3 ${isRestaurante ? 'md:col-span-2' : 'md:col-span-2 flex gap-2'}`}>
                <Select defaultValue={formValues.afectacionNombre || "Gravado - operación onerosa"} error={""} isSearch options={afectaciones} id="tipoAfectacionIGV" name="afectacionNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Tipo de afectación" />
            </div>

            <div className="col-span-3 md:col-span-1">
                <Select defaultValue={formValues?.unidadMedidaNombre} error={""} isSearch options={unitOfMeasure?.map((item: ICategory) => ({ id: item?.id, value: `${item?.nombre}` }))} id="unidadMedidaId" name="unidadMedidaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Unidad de medida" />
            </div>
            <div className={`col-span-3 md:col-span-1 ${isRestaurante ? '' : 'flex gap-2'} w-full`}>
                <div className="w-full">
                    <Select defaultValue={formValues.categoriaNombre} error={""} isSearch options={categories?.map((item: ICategory) => ({ id: item?.id, value: `${item?.nombre}` }))} id="categoriaId" name="categoriaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Categoria" />
                </div>
                {!isRestaurante && (
                    <div className="w-full">
                        <Select defaultValue={formValues.marcaNombre} error={""} isSearch options={brands?.map((item: IBrand) => ({ id: item?.id, value: `${item?.nombre}` }))} id="marcaId" name="marcaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Marca" />
                    </div>
                )}
            </div>

            {features.gestionLotes && (
                <>
                    <div className="col-span-3 md:col-span-1">
                        <InputPro autocomplete="off" value={(formValues as any)?.principioActivo || ''} name="principioActivo" onChange={handleChange} isLabel label="Principio Activo" placeholder="Ej: Paracetamol" />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                        <InputPro autocomplete="off" value={(formValues as any)?.laboratorio || ''} name="laboratorio" onChange={handleChange} isLabel label="Laboratorio" placeholder="Ej: Bayer" />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                        <InputPro autocomplete="off" value={(formValues as any)?.concentracion || ''} name="concentracion" onChange={handleChange} isLabel label="Concentración" placeholder="Ej: 500mg" />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                        <InputPro autocomplete="off" value={(formValues as any)?.presentacion || ''} name="presentacion" onChange={handleChange} isLabel label="Presentación" placeholder="Ej: Caja x 100 tabletas" />
                    </div>
                </>
            )}

            {features.permiteFraccionamiento && (
                <div className="col-span-3 border-t dark:border-slate-800 pt-4 mt-4">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Icon icon="solar:box-minimalistic-bold-duotone" width={16} />
                        Unidades de Compra/Venta
                    </h5>
                    <div className="grid grid-cols-3 gap-4">
                        <InputPro autocomplete="off" value={(formValues as any)?.unidadCompra || ''} name="unidadCompra" onChange={handleChange} isLabel label="Unidad Compra" placeholder="CAJA" />
                        <InputPro autocomplete="off" value={(formValues as any)?.unidadVenta || ''} name="unidadVenta" onChange={handleChange} isLabel label="Unidad Venta" placeholder="BLISTER" />
                        <InputPro autocomplete="off" type="number" value={(formValues as any)?.factorConversion || 1} name="factorConversion" onChange={handleChange} isLabel label="Factor" placeholder="1" />
                    </div>
                </div>
            )}

            {features.usaCodigoBarras && (
                <div className="col-span-3 md:col-span-2">
                    <BarcodeScannerInput
                        name="codigoBarras"
                        label="Código de Barras"
                        value={(formValues as any)?.codigoBarras || ''}
                        onChange={handleChange}
                        placeholder="Escanea o escribe EAN-13 / UPC"
                    />
                </div>
            )}

            {features.gestionOfertas && (
                <div className="col-span-3 border-t dark:border-slate-800 pt-4 mt-4">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Icon icon="solar:tag-price-bold-duotone" width={16} />
                        Ofertas y Promociones
                    </h5>
                    <div className="grid grid-cols-3 gap-4">
                        <InputPro autocomplete="off" type="number" step="0.01" value={(formValues as any)?.precioOferta || ''} name="precioOferta" onChange={handleChange} isLabel label="Precio Oferta (S/)" placeholder="0.00" />
                        <InputPro autocomplete="off" type="date" value={(formValues as any)?.fechaInicioOferta || ''} name="fechaInicioOferta" onChange={handleChange} isLabel label="Inicio Oferta" />
                        <InputPro autocomplete="off" type="date" value={(formValues as any)?.fechaFinOferta || ''} name="fechaFinOferta" onChange={handleChange} isLabel label="Fin Oferta" />
                    </div>
                </div>
            )}

            <div className={`col-span-3 md:col-span-1 grid ${isRestaurante ? 'grid-cols-1' : 'grid-cols-2'} gap-5`}>
                <InputPro autocomplete="off" type="number" step="0.01" value={formValues?.precioUnitario} error={errors.precioUnitario} name="precioUnitario" onChange={handleChange} handleOnBlur={handlePrecioUnitarioBlur} isLabel label={isMobile ? (isRestaurante ? 'Precio' : 'Precio Venta') : labels.precio} />
                {!isRestaurante && (
                    <InputPro autocomplete="off" type="number" step="0.01" value={formValues?.costoUnitario || ''} name="costoUnitario" onChange={handleChange} isLabel label={isMobile ? "Costo Unitario" : "Costo Unitario (S/)"} placeholder="Costo de compra" />
                )}
            </div>

            <ProductStockManager vm={vm} />

            {/* Solo mayorista para NO restaurantes (súpers, tiendas, etc) */}
            {!isRestaurante && <ProductWholesalePricing vm={vm} />}

            {isRestaurante && gruposModificadores && gruposModificadores.length > 0 && (
                <div className="col-span-2 mt-4">
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Icon icon="mdi:food-variant" width={16} height={16} />
                            Personalización del Plato
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Selecciona los grupos de modificadores que los clientes podrán elegir al pedir este plato (ej: cremas, acompañamientos, extras)
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {gruposModificadores.map((grupo: GrupoModificador) => (
                                <button
                                    key={grupo.id}
                                    type="button"
                                    onClick={() => toggleGrupoSeleccionado(grupo.id)}
                                    className={`p-3 rounded-lg border-2 transition-all text-left ${gruposSeleccionados.includes(grupo.id) ? 'border-[#6A6CFF] bg-[#6A6CFF]/5 dark:bg-[#6A6CFF]/10' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${gruposSeleccionados.includes(grupo.id) ? 'border-[#6A6CFF] bg-[#6A6CFF]' : 'border-gray-300 dark:border-slate-600'}`}>
                                            {gruposSeleccionados.includes(grupo.id) && <Icon icon="mdi:check" className="text-white" width={12} height={12} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{grupo.nombre}</div>
                                            {grupo.descripcion && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{grupo.descripcion}</div>}
                                            <div className="flex items-center gap-2 mt-1">
                                                {grupo.esObligatorio && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">Obligatorio</span>}
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{grupo.opciones?.length || 0} opciones</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
