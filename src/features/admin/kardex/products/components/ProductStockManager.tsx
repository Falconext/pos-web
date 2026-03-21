import React from 'react';
import { Icon } from '@iconify/react';
import InputPro from '@/components/InputPro';
import { useProductModalViewModel } from '../useProductModalViewModel';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

export const ProductStockManager: React.FC<{ vm: ViewProps }> = ({ vm }) => {
    const {
        isEdit, isRestaurante, isFarmacia, tipoAjusteStock, cantidadAjuste, stockOriginal,
        formValues, errors, isMobile,
        setTipoAjusteStock, setCantidadAjuste, handleChange
    } = vm;

    return (
        <div className={isRestaurante ? 'col-span-2' : 'col-span-2'}>
            <div className="p-4 rounded-lg border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Icon icon="mdi:cube-outline" width={16} height={16} />
                    {isRestaurante ? 'Disponibilidad' : isFarmacia ? 'Stock' : 'Gestión de Inventario'}
                </h5>

                {isRestaurante ? (
                    <div>
                        <InputPro
                            autocomplete="off"
                            type="number"
                            value={formValues?.stock}
                            error={errors.stock}
                            name="stock"
                            onChange={handleChange}
                            isLabel
                            label="Cantidad disponible"
                            placeholder="Ej. 50"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Indica cuántas porciones/unidades tienes disponibles para vender.
                        </p>
                    </div>
                ) : isEdit ? (
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg border border-blue-100">
                                <div className="text-lg font-bold text-blue-600">{stockOriginal}</div>
                                <div className="text-xs text-gray-600">Stock Actual</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-green-100">
                                <div className="text-lg font-bold text-green-600">
                                    {tipoAjusteStock === 'ninguno' ? stockOriginal :
                                        tipoAjusteStock === 'reemplazar' ? cantidadAjuste :
                                            tipoAjusteStock === 'sumar' ? stockOriginal + cantidadAjuste :
                                                tipoAjusteStock === 'restar' ? Math.max(0, stockOriginal - cantidadAjuste) : stockOriginal
                                    }
                                </div>
                                <div className="text-xs text-gray-600">Stock Resultante</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Ajuste</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'ninguno', label: 'Sin cambios', color: 'bg-gray-100 text-gray-700' },
                                        { value: 'reemplazar', label: 'Reemplazar stock', color: 'bg-blue-100 text-blue-700' },
                                        { value: 'sumar', label: 'Agregar inventario', color: 'bg-green-100 text-green-700' },
                                        { value: 'restar', label: 'Quitar inventario', color: 'bg-red-100 text-red-700' }
                                    ].map((tipo) => (
                                        <button
                                            key={tipo.value}
                                            type="button"
                                            onClick={() => setTipoAjusteStock(tipo.value as any)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${tipoAjusteStock === tipo.value
                                                ? tipo.color + ' ring-2 ring-offset-2 ring-blue-400'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {tipo.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {tipoAjusteStock !== 'ninguno' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        {tipoAjusteStock === 'reemplazar' ? 'Nuevo stock total:' :
                                            tipoAjusteStock === 'sumar' ? 'Cantidad a agregar:' :
                                                'Cantidad a quitar:'}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cantidadAjuste}
                                        onChange={(e) => setCantidadAjuste(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ingrese la cantidad"
                                    />
                                </div>
                            )}

                            {tipoAjusteStock !== 'ninguno' && (
                                <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                    <Icon icon="mdi:information" className="inline mr-1" width={14} height={14} />
                                    Este ajuste se registrará automáticamente en el kardex como movimiento de inventario.
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <InputPro autocomplete="off" type="number" value={formValues?.stockMinimo ?? ''} name="stockMinimo" onChange={handleChange} isLabel label="Stock mínimo" placeholder="Ej. 5" />
                                <InputPro autocomplete="off" type="number" value={formValues?.stockMaximo ?? ''} name="stockMaximo" onChange={handleChange} isLabel label={isMobile ? "Stock máximo" : "Stock máximo (opcional)"} placeholder="Ej. 100" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div>
                        <InputPro autocomplete="off" type="number" value={formValues?.stock} error={errors.stock} name="stock" onChange={handleChange} isLabel label="Stock Inicial" placeholder="Cantidad inicial en inventario" />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <InputPro autocomplete="off" type="number" value={formValues?.stockMinimo ?? ''} name="stockMinimo" onChange={handleChange} isLabel label="Stock mínimo" placeholder="Ej. 5" />
                            <InputPro autocomplete="off" type="number" value={formValues?.stockMaximo ?? ''} name="stockMaximo" onChange={handleChange} isLabel label={isMobile ? "Stock máximo" : "Stock máximo (opcional)"} placeholder="Ej. 100" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
