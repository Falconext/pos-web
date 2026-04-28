import React from 'react';
import { Icon } from '@iconify/react';
import { useProductModalViewModel } from '../useProductModalViewModel';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

export const ProductWholesalePricing: React.FC<{ vm: ViewProps }> = ({ vm }) => {
    const { wholesaleOptions, newWholesaleOption, setNewWholesaleOption, handleAddWholesaleOption, handleRemoveWholesaleOption } = vm;

    return (
        <div className="col-span-2 mt-4 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1 bg-green-500 rounded-lg">
                    <Icon icon="mdi:tag-multiple" className="text-white" width={20} height={20} />
                </div>
                <div>
                    <h4 className="text-lg font-[400] text-gray-900 dark:text-white leading-none">Precios por Cantidad / Mayorista</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Define presentaciones especiales (ej. Docena) con su precio de venta final.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 border-b border-gray-100 dark:border-slate-700 text-xs font-[400] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="col-span-6">Nombre Presentación</div>
                    <div className="col-span-4">Precio Final</div>
                    <div className="col-span-2 text-center">Acción</div>
                </div>

                {wholesaleOptions.length > 0 ? (
                    wholesaleOptions.map((opt, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 p-3 border-b border-gray-100 dark:border-slate-700 items-center last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                            <div className="col-span-6 font-medium text-gray-900 dark:text-gray-200">{opt.nombre}</div>
                            <div className="col-span-4 font-bold text-green-700 dark:text-green-400">S/ {Number(opt.precio).toFixed(2)}</div>
                            <div className="col-span-2 text-center">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveWholesaleOption(idx)}
                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                    <Icon icon="mdi:trash-can-outline" width={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-gray-400">
                        No hay precios configurados. Agrega uno abajo.
                    </div>
                )}

                <div className="grid grid-cols-12 gap-2 p-3">
                    <div className="col-span-6">
                        <input
                            type="text"
                            placeholder="Ej. Docena, Caja x 24..."
                            className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5 dark:bg-slate-700 dark:text-white"
                            value={newWholesaleOption.nombre}
                            onChange={(e) => setNewWholesaleOption({ ...newWholesaleOption, nombre: e.target.value })}
                        />
                    </div>
                    <div className="col-span-4 relative">
                        <span className="absolute left-2 top-1.5 text-gray-500 dark:text-gray-400 text-sm">S/</span>
                        <input
                            type="number"
                            placeholder="0.00"
                            className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 pl-7 py-1.5 dark:bg-slate-700 dark:text-white"
                            value={newWholesaleOption.precio}
                            onChange={(e) => setNewWholesaleOption({ ...newWholesaleOption, precio: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2 flex justify-center">
                        <button
                            type="button"
                            onClick={handleAddWholesaleOption}
                            disabled={!newWholesaleOption.nombre || !newWholesaleOption.precio}
                            className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Icon icon="mdi:plus" width={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
