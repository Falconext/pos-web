import React from 'react';
import { Icon } from '@iconify/react';
import { useProductModalViewModel } from '../useProductModalViewModel';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

export const ProductFinancialAnalysis: React.FC<{ vm: ViewProps }> = ({ vm }) => {
    const { isRestaurante, isFarmacia, formValues, isEdit, tipoAjusteStock, cantidadAjuste, stockOriginal } = vm;

    if (isRestaurante || isFarmacia) {
        return null;
    }

    const precioUnitario = Number(formValues?.precioUnitario || 0);
    const costoUnitario = Number(formValues?.costoUnitario || 0);
    const ganancia = precioUnitario - costoUnitario;
    const margen = precioUnitario > 0 && costoUnitario > 0 ? (ganancia / precioUnitario) * 100 : 0;

    const stockParaProyeccion = isEdit && tipoAjusteStock !== 'ninguno'
        ? (tipoAjusteStock === 'reemplazar' ? cantidadAjuste
            : tipoAjusteStock === 'sumar' ? stockOriginal + cantidadAjuste
            : tipoAjusteStock === 'restar' ? Math.max(0, stockOriginal - cantidadAjuste)
            : stockOriginal)
        : Number(formValues?.stock || 0);

    const margenColor = margen > 30
        ? 'text-emerald-600 dark:text-emerald-400'
        : margen > 10
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-red-500 dark:text-red-400';

    const margenBg = margen > 30
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40'
        : margen > 10
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40'
        : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40';

    const gananciaPositiva = ganancia > 0;

    return (
        <div className="block col-span-2 mt-4">
            <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10 p-5 space-y-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                        <Icon icon="solar:chart-bold-duotone" className="text-white" width={18} />
                    </div>
                    <div>
                        <h5 className="text-sm font-bold text-gray-900 dark:text-white">Análisis Financiero</h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rentabilidad estimada por unidad</p>
                    </div>
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-4 gap-3">
                    {/* Precio */}
                    <div className="bg-white/80 dark:bg-slate-800/60 rounded-xl p-3 border border-blue-100 dark:border-blue-900/40 text-center">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-2">
                            <Icon icon="solar:tag-price-bold" className="text-blue-600 dark:text-blue-400" width={14} />
                        </div>
                        <p className="text-base font-bold text-gray-900 dark:text-white">S/ {precioUnitario.toFixed(2)}</p>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Precio venta</p>
                    </div>

                    {/* Costo */}
                    <div className="bg-white/80 dark:bg-slate-800/60 rounded-xl p-3 border border-blue-100 dark:border-blue-900/40 text-center">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-2">
                            <Icon icon="solar:box-bold" className="text-slate-500 dark:text-slate-400" width={14} />
                        </div>
                        <p className="text-base font-bold text-gray-900 dark:text-white">S/ {costoUnitario.toFixed(2)}</p>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Costo unit.</p>
                    </div>

                    {/* Ganancia */}
                    <div className={`rounded-xl p-3 border text-center ${gananciaPositiva ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40' : 'bg-red-50/80 dark:bg-red-900/20 border-red-100 dark:border-red-800/40'}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-2 ${gananciaPositiva ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                            <Icon icon={gananciaPositiva ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'} className={gananciaPositiva ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'} width={14} />
                        </div>
                        <p className={`text-base font-bold ${gananciaPositiva ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            {gananciaPositiva ? '+' : ''}S/ {ganancia.toFixed(2)}
                        </p>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Ganancia</p>
                    </div>

                    {/* Margen */}
                    <div className={`rounded-xl p-3 border text-center ${margenBg}`}>
                        <div className="w-7 h-7 rounded-lg bg-white/60 dark:bg-slate-700/60 flex items-center justify-center mx-auto mb-2">
                            <Icon icon="solar:pie-chart-bold" className={margenColor} width={14} />
                        </div>
                        <p className={`text-base font-bold ${margenColor}`}>{margen.toFixed(1)}%</p>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Margen</p>
                    </div>
                </div>

                {/* Proyección con stock */}
                {stockParaProyeccion > 0 && precioUnitario > 0 && costoUnitario > 0 && (
                    <div className="bg-white/70 dark:bg-slate-800/60 rounded-xl p-4 border border-blue-100 dark:border-blue-900/40">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Icon icon="solar:layers-bold" width={12} />
                            Proyección con stock {isEdit && tipoAjusteStock !== 'ninguno' ? 'resultante' : 'actual'} ({stockParaProyeccion} uds.)
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">S/ {(precioUnitario * stockParaProyeccion).toFixed(2)}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Valor total venta</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-red-500 dark:text-red-400">S/ {(costoUnitario * stockParaProyeccion).toFixed(2)}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Inversión total</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-sm font-bold ${gananciaPositiva ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                    S/ {(ganancia * stockParaProyeccion).toFixed(2)}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Ganancia potencial</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
