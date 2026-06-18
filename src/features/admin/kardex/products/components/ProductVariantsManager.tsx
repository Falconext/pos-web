import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useProductModalViewModel } from '../useProductModalViewModel';
import Button from '@/components/Button';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

export const ProductVariantsManager: React.FC<{ vm: ViewProps }> = ({ vm }) => {
    const { formValues, setFormValues } = vm;

    const opcionesAtributos = Array.isArray((formValues as any).opcionesAtributos) ? (formValues as any).opcionesAtributos : [];
    const variantes = Array.isArray((formValues as any).variantes) ? (formValues as any).variantes : [];

    const addOption = () => {
        const next = [...opcionesAtributos, { nombre: '', valores: [] }];
        setFormValues({ ...formValues, opcionesAtributos: next } as any);
    };

    const updateOptionName = (index: number, name: string) => {
        const next = [...opcionesAtributos];
        next[index].nombre = name;
        setFormValues({ ...formValues, opcionesAtributos: next } as any);
    };

    const updateOptionValues = (index: number, valuesStr: string) => {
        const next = [...opcionesAtributos];
        // simple comma separated parsing
        next[index].valores = valuesStr.split(',').map((s: string) => s.trim()).filter(Boolean);
        setFormValues({ ...formValues, opcionesAtributos: next } as any);
    };

    const removeOption = (index: number) => {
        const next = opcionesAtributos.filter((_: any, i: number) => i !== index);
        setFormValues({ ...formValues, opcionesAtributos: next } as any);
    };

    if (vm.isFarmacia || vm.isRestaurante) return null; // Solo ropa/retail

    return (
        <div className="col-span-1 md:col-span-2 mt-4 rounded-2xl border border-violet-100 bg-violet-50/30 p-5 dark:border-violet-900/40 dark:bg-violet-950/10">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h5 className="text-sm font-black text-violet-900 dark:text-violet-300 flex items-center gap-2">
                        <Icon icon="solar:layers-minimalistic-bold-duotone" width={20} />
                        Variantes del Producto (Shopify Style)
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Agrega opciones como Talla o Color. Se crearán variantes independientes automáticamente.
                    </p>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                {opcionesAtributos.map((opt: any, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700">
                        <div className="w-1/3">
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Nombre de la Opción</label>
                            <input
                                type="text"
                                placeholder="Ej: Talla"
                                className="w-full text-sm border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 px-3 py-2 outline-none"
                                value={opt.nombre}
                                onChange={e => updateOptionName(idx, e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Valores (separados por coma)</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Ej: S, M, L"
                                    className="w-full text-sm border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 px-3 py-2 outline-none"
                                    value={(opt.valores || []).join(', ')}
                                    onChange={e => updateOptionValues(idx, e.target.value)}
                                />
                                <button type="button" onClick={() => removeOption(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                    <Icon icon="solar:trash-bin-trash-bold" width={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Button type="button" outline color="primary" onClick={addOption} className="text-xs py-1.5 px-3">
                <Icon icon="solar:add-circle-bold" width={16} className="mr-1.5" /> Añadir Opción
            </Button>

            {variantes.length > 0 && (
                <div className="mt-6">
                    <h6 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase">Variantes Generadas</h6>
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-2">Variante</th>
                                    <th className="px-4 py-2">SKU</th>
                                    <th className="px-4 py-2">Precio</th>
                                    <th className="px-4 py-2">Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variantes.map((v: any) => (
                                    <tr key={v.id} className="border-b border-gray-100 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-medium">
                                            {Object.entries(v.valoresAtributos || {}).map(([k, val]) => `${val}`).join(' / ')}
                                        </td>
                                        <td className="px-4 py-3 text-xs">{v.codigo}</td>
                                        <td className="px-4 py-3">S/ {Number(v.precioUnitario).toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${v.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {v.stock}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
