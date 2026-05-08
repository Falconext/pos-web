import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useProductModalViewModel } from '../useProductModalViewModel';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

export const ProductWholesalePricing: React.FC<{ vm: ViewProps }> = ({ vm }) => {
    const {
        wholesaleOptions,
        newWholesaleOption,
        setNewWholesaleOption,
        handleAddWholesaleOption,
        handleRemoveWholesaleOption,
        formValues,
        setFormValues,
    } = vm;

    const [focused, setFocused] = useState<'cantidadMinima' | 'precio' | null>(null);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editValues, setEditValues] = useState({ cantidadMinima: '', precio: '' });

    const basePrice = Number(formValues.precioUnitario) || 0;
    const sorted = [...wholesaleOptions].sort((a, b) => a.cantidadMinima - b.cantidadMinima);

    const discount = (precio: number) =>
        basePrice > 0 ? Math.round((1 - precio / basePrice) * 100) : 0;

    const startEdit = (idx: number, opt: { cantidadMinima: number; precio: number }) => {
        setEditingIdx(idx);
        setEditValues({
            cantidadMinima: String(opt.cantidadMinima),
            precio: String(opt.precio),
        });
    };

    const cancelEdit = () => {
        setEditingIdx(null);
        setEditValues({ cantidadMinima: '', precio: '' });
    };

    const saveEdit = () => {
        if (editingIdx === null) return;
        const cantidadMinima = Number(editValues.cantidadMinima);
        const precio = Number(editValues.precio);

        if (!Number.isFinite(cantidadMinima) || cantidadMinima <= 0) return;
        if (!Number.isFinite(precio) || precio <= 0) return;

        const current = [...wholesaleOptions];
        current[editingIdx] = { cantidadMinima, precio };
        setFormValues({
            ...formValues,
            preciosMayorista: current,
        });
        cancelEdit();
    };

    return (
        <div className="col-span-2 mt-2">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-sm">
                        <Icon icon="solar:tag-price-bold-duotone" className="text-white" width={15} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Precios por Mayorista</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Define rangos de precio según cantidad</p>
                    </div>
                </div>
                {wholesaleOptions.length > 0 && (
                    <span className="ml-auto text-[11px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                        {wholesaleOptions.length} nivel{wholesaleOptions.length > 1 ? 'es' : ''}
                    </span>
                )}
            </div>

            {/* Tiers list */}
            {sorted.length > 0 && (
                <div className="mb-3 space-y-1.5">
                    {sorted.map((opt, idx) => {
                        const disc = discount(opt.precio);
                        const originalIdx = wholesaleOptions.findIndex(
                            o => o.cantidadMinima === opt.cantidadMinima && o.precio === opt.precio
                        );
                        const isEditing = editingIdx === originalIdx;
                        return (
                            <div
                                key={idx}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 hover:border-green-200 dark:hover:border-green-800 transition-colors group"
                            >
                                {/* Step badge */}
                                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold text-green-700 dark:text-green-400">{idx + 1}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={editValues.cantidadMinima}
                                                onChange={(e) => setEditValues(prev => ({ ...prev, cantidadMinima: e.target.value }))}
                                                className="w-24 text-xs px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                                            />
                                            <span className="text-xs text-gray-500">unidades</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editValues.precio}
                                                onChange={(e) => setEditValues(prev => ({ ...prev, precio: e.target.value }))}
                                                className="w-28 text-xs px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                    {opt.cantidadMinima}+ unidades
                                                </span>
                                                <Icon icon="solar:arrow-right-linear" width={12} className="text-gray-400" />
                                                <span className="text-sm font-bold text-green-700 dark:text-green-400">
                                                    S/ {Number(opt.precio).toFixed(2)}
                                                </span>
                                            </div>
                                            {disc > 0 && basePrice > 0 && (
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                    {disc}% menos que el precio base
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Remove */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {isEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={saveEdit}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                            >
                                                <Icon icon="solar:check-circle-linear" width={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700"
                                            >
                                                <Icon icon="solar:close-circle-linear" width={15} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => startEdit(originalIdx, opt)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        >
                                            <Icon icon="solar:pen-2-linear" width={15} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveWholesaleOption(originalIdx)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Icon icon="solar:trash-bin-2-linear" width={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty state */}
            {wholesaleOptions.length === 0 && (
                <div className="mb-3 py-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/20">
                    <Icon icon="solar:tag-price-linear" width={24} className="text-gray-300 dark:text-gray-600 mb-1" />
                    <p className="text-xs text-gray-400 dark:text-gray-500">Sin niveles configurados</p>
                </div>
            )}

            {/* Add new tier row */}
            <div className={`flex gap-2 p-3 rounded-xl border transition-all ${focused ? 'border-blue-300 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-900/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40'}`}>
                {/* Cantidad mínima input */}
                <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 ml-0.5">
                        Cant. mínima
                    </label>
                    <div className={`flex items-center gap-1.5 border rounded-lg px-2 py-1.5 transition-colors ${focused === 'cantidadMinima' ? 'border-blue-400 dark:border-blue-500' : 'border-gray-200 dark:border-slate-600'} bg-white dark:bg-slate-800`}>
                        <Icon icon="solar:box-minimalistic-linear" width={13} className="text-gray-400 flex-shrink-0" />
                        <input
                            type="number"
                            placeholder="Ej. 12"
                            min="1"
                            className="w-full rounded-lg focus:border-none border-solid border-transparent text-sm bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
                            value={newWholesaleOption.cantidadMinima}
                            onFocus={() => setFocused('cantidadMinima')}
                            onBlur={() => setFocused(null)}
                            onChange={(e) => setNewWholesaleOption({ ...newWholesaleOption, cantidadMinima: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddWholesaleOption()}
                        />
                    </div>
                </div>

                {/* Price input */}
                <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 ml-0.5">
                        Precio (S/)
                    </label>
                    <div className={`flex items-center gap-1.5 border rounded-lg px-2 py-1.5 transition-colors ${focused === 'precio' ? 'border-blue-400 dark:border-blue-500' : 'border-gray-200 dark:border-slate-600'} bg-white dark:bg-slate-800`}>
                        <span className="text-xs font-semibold text-gray-400 flex-shrink-0">S/</span>
                        <input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            className="w-full rounded-lg focus:border-none border-solid border-transparent text-sm bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
                            value={newWholesaleOption.precio}
                            onFocus={() => setFocused('precio')}
                            onBlur={() => setFocused(null)}
                            onChange={(e) => setNewWholesaleOption({ ...newWholesaleOption, precio: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddWholesaleOption()}
                        />
                        {newWholesaleOption.precio && basePrice > 0 && (
                            <span className={`text-[10px] font-bold flex-shrink-0 ${discount(Number(newWholesaleOption.precio)) > 0 ? 'text-green-500' : 'text-red-400'}`}>
                                {discount(Number(newWholesaleOption.precio)) > 0 ? '-' : '+'}{Math.abs(discount(Number(newWholesaleOption.precio)))}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Add button */}
                <div className="flex flex-col justify-end pb-0">
                    <button
                        type="button"
                        onClick={handleAddWholesaleOption}
                        disabled={!newWholesaleOption.cantidadMinima || !newWholesaleOption.precio}
                        className="h-[34px] px-3 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white disabled:text-gray-400 dark:disabled:text-gray-500 rounded-lg text-xs font-semibold transition-all shadow-sm disabled:shadow-none mt-[22px]"
                    >
                        <Icon icon="mdi:plus" width={16} />
                        <span className="hidden sm:inline">Agregar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
