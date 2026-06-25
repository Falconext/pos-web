import React from 'react';
import { Icon } from '@iconify/react';
import InputPro from '@/components/InputPro';
import { useProductModalViewModel } from '../useProductModalViewModel';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

export const ProductStockManager: React.FC<{ vm: ViewProps }> = ({ vm }) => {
    const {
        isEdit, isRestaurante, isFarmacia, esFarmaceutico, isFabricacion, tipoAjusteStock, cantidadAjuste, stockOriginal, productSections,
        formValues, errors, isMobile,
        setTipoAjusteStock, setCantidadAjuste, handleChange, sedeActiva
    } = vm;

    const esServicio = String((formValues as any)?.atributosTecnicos?.tipoProducto || '').toUpperCase() === 'SERVICIO';
    if (!productSections.inventario && !esServicio) return null;
    const tieneSedeActiva = Boolean(sedeActiva?.id);

    const sedePolicy = (
        <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h6 className="text-xs font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                        Disponibilidad por sede
                    </h6>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {tieneSedeActiva
                            ? `Aplica para ${sedeActiva?.nombre}.`
                            : 'Selecciona una sede para aplicar reglas locales.'}
                    </p>
                </div>
                <Icon icon={sedeActiva?.tipo === 'ALMACEN' ? 'solar:box-bold-duotone' : 'solar:shop-bold-duotone'} className="text-violet-600" width={22} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-lg border border-white/70 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200">
                    <input
                        type="checkbox"
                        name="visibleEnSede"
                        checked={formValues?.visibleEnSede !== false}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    Visible en esta sede
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-white/70 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200">
                    <input
                        type="checkbox"
                        name="vendibleEnSede"
                        checked={formValues?.vendibleEnSede !== false}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    Se puede vender aquí
                </label>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <InputPro autocomplete="off" type="text" value={formValues?.ubicacionSede ?? ''} name="ubicacionSede" onChange={handleChange} isLabel label="Ubicación" placeholder="Ej. Vitrina A-1" />
                <InputPro autocomplete="off" type="number" value={formValues?.precioUnitarioSede ?? ''} name="precioUnitarioSede" onChange={handleChange} isLabel label="Precio sede" placeholder="Usar general" />
                <InputPro autocomplete="off" type="number" value={formValues?.precioOfertaSede ?? ''} name="precioOfertaSede" onChange={handleChange} isLabel label="Oferta sede" placeholder="Opcional" />
            </div>
        </div>
    );

    return (
        <div className={isRestaurante ? 'col-span-2' : 'col-span-2'}>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Icon icon="mdi:cube-outline" width={16} height={16} />
                    {isRestaurante ? 'Disponibilidad' : esFarmaceutico ? 'Stock' : isFabricacion ? 'Stock del ítem' : 'Gestión de Inventario'}
                </h5>

                {esServicio ? (
                    <>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Los servicios no descuentan inventario, pero puedes controlar si se muestran y venden en cada sede.
                        </p>
                        {sedePolicy}
                    </>
                ) : isRestaurante ? (
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
                        {sedePolicy}
                    </div>
                ) : isEdit ? (
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stockOriginal}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Stock Actual</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
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
                                        { value: 'ninguno', label: 'Sin cambios', color: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300' },
                                        { value: 'reemplazar', label: 'Reemplazar stock', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                                        { value: 'sumar', label: 'Agregar inventario', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
                                        { value: 'restar', label: 'Quitar inventario', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' }
                                    ].map((tipo) => (
                                        <button
                                            key={tipo.value}
                                            type="button"
                                            onClick={() => setTipoAjusteStock(tipo.value as any)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${tipoAjusteStock === tipo.value
                                                ? tipo.color + ' ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-blue-400'
                                                : 'bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
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
                                <div className="text-xs text-gray-600 dark:text-amber-400 bg-yellow-50 dark:bg-amber-900/20 p-2 rounded border border-yellow-200 dark:border-amber-800/50">
                                    <Icon icon="mdi:information" className="inline mr-1" width={14} height={14} />
                                    Este ajuste se registrará automáticamente en el kardex como movimiento de inventario.
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <InputPro autocomplete="off" type="number" value={formValues?.stockMinimo ?? ''} name="stockMinimo" onChange={handleChange} isLabel label="Stock mínimo" placeholder="Ej. 5" />
                                <InputPro autocomplete="off" type="number" value={formValues?.stockMaximo ?? ''} name="stockMaximo" onChange={handleChange} isLabel label={isMobile ? "Stock máximo" : "Stock máximo (opcional)"} placeholder="Ej. 100" />
                            </div>
                            {sedePolicy}
                        </div>
                    </>
                ) : (
                    <div>
                        <InputPro autocomplete="off" type="number" readOnly={esFarmaceutico} value={formValues?.stock} error={errors.stock} name="stock" onChange={handleChange} isLabel label="Stock Inicial" placeholder="Cantidad inicial en inventario" />
                        {esFarmaceutico && <p className="text-[11px] text-amber-500 mt-1"><Icon icon="mdi:information" className="inline mr-1"/>En farmacia, ingresa el stock inicial usando el botón "Gestión de Lotes".</p>}
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <InputPro autocomplete="off" type="number" value={formValues?.stockMinimo ?? ''} name="stockMinimo" onChange={handleChange} isLabel label="Stock mínimo" placeholder="Ej. 5" />
                            <InputPro autocomplete="off" type="number" value={formValues?.stockMaximo ?? ''} name="stockMaximo" onChange={handleChange} isLabel label={isMobile ? "Stock máximo" : "Stock máximo (opcional)"} placeholder="Ej. 100" />
                        </div>
                        {sedePolicy}
                    </div>
                )}
            </div>
        </div>
    );
};
