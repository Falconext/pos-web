import { Icon } from "@iconify/react";

const METODOS = ['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta'];

export const POSCalculations = ({ vm, printFn, handleOpenNewTab }: { vm: any, printFn: any, handleOpenNewTab: any }) => {
    const total: number = vm.totalAdjusted ?? 0;

    // Farmacia: ítems con receta pendiente
    const recetasPendientes = vm.isFarmaciaRetail
        ? (vm.productsInvoice || []).filter((p: any) => p.pendienteReceta).length
        : 0;
    const hayRecetasPendientes = recetasPendientes > 0;

    // Split payment helpers
    const splitTotal = (vm.splitPayments as { method: string; amount: number }[])
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const splitRemaining = Math.max(0, total - splitTotal);
    const splitValid = Math.abs(splitTotal - total) < 0.01;

    const updateSplitAmount = (idx: number, value: number) => {
        vm.setSplitPayments((curr: { method: string; amount: number }[]) => {
            const next = [...curr];
            next[idx] = { ...next[idx], amount: value };
            return next;
        });
    };

    const updateSplitMethod = (idx: number, method: string) => {
        vm.setSplitPayments((curr: { method: string; amount: number }[]) => {
            const next = [...curr];
            next[idx] = { ...next[idx], method };
            return next;
        });
    };

    const addSplitRow = () => {
        vm.setSplitPayments((curr: { method: string; amount: number }[]) => {
            if (curr.length >= 5) return curr;
            const usedMethods = curr.map((p) => p.method);
            const nextMethod = METODOS.find(m => !usedMethods.includes(m)) ?? 'Efectivo';
            return [...curr, { method: nextMethod, amount: 0 }];
        });
    };

    const removeSplitRow = (idx: number) => {
        vm.setSplitPayments((curr: { method: string; amount: number }[]) => {
            if (curr.length <= 2) return curr;
            return curr.filter((_: any, i: number) => i !== idx);
        });
    };

    const handleFillRemaining = (idx: number) => {
        vm.setSplitPayments((curr: { method: string; amount: number }[]) => {
            const otherTotal = curr.reduce((s, p, i) => i === idx ? s : s + (Number(p.amount) || 0), 0);
            const fill = parseFloat(Math.max(0, total - otherTotal).toFixed(2));
            const next = [...curr];
            next[idx] = { ...next[idx], amount: fill };
            return next;
        });
    };

    return (
        <div className="p-3 pt-2 md:p-5 md:pb-8 bg-white dark:bg-[#111827] border-t border-gray-100 dark:border-slate-800">
            <div className="space-y-1 md:space-y-2 mb-3 md:mb-4">
                <div className="flex justify-between text-sm text-gray-700 dark:text-white font-medium">
                    <span>Op. Gravada</span>
                    <span>S/ {vm.opGravadaAdjusted.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700 dark:text-white font-medium">
                    <span>IGV (18%)</span>
                    <span>S/ {vm.igvAdjusted.toFixed(2)}</span>
                </div>
                {(vm.hasDiscount || (vm.formValues.motivoId === 6 && vm.descountGlobal > 0)) && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Descuento</span>
                        <span>- S/ {vm.finalDiscount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-black text-gray-800 dark:text-white pt-2 border-t border-gray-200 dark:border-slate-800">
                    <span>TOTAL</span>
                    <span>S/ {total.toFixed(2)}</span>
                </div>

                {/* Adelanto field for NP and OT */}
                {(vm.formValues.tipoDoc === 'NP' || vm.formValues.tipoDoc === 'OT') && !vm.isQuotationRoute && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                            Adelanto (opcional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                            <input
                                type="number"
                                value={vm.adelanto || ''}
                                onChange={(e) => vm.setAdelanto(Number(e.target.value) || 0)}
                                placeholder="0.00"
                                step="0.01"
                                max={total}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                            />
                        </div>
                        {vm.adelanto > 0 && (
                            <div className="mt-2 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Saldo pendiente:</span>
                                    <span className="font-bold text-orange-600 dark:text-orange-400">
                                        S/ {Math.max(0, total - vm.adelanto).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quotation-specific fields */}
            {vm.isQuotationRoute && (
                <div className="border-t">
                    <button
                        onClick={() => vm.setIsQuotationConfigModalOpen(true)}
                        className="w-full flex items-center justify-between py-2 px-1 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <Icon icon="solar:settings-bold-duotone" className="text-gray-900" />
                            Configuración Cotización
                        </span>
                    </button>
                </div>
            )}

            {/* Payment Methods */}
            {!vm.isQuotationRoute && (
                <div className="mb-3 md:mb-4">
                    {/* Toggle simple / mixto */}
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-white uppercase tracking-wider">
                            Método de Pago
                        </label>
                        <button
                            type="button"
                            onClick={() => vm.setIsMixedPayment(!vm.isMixedPayment)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${vm.isMixedPayment
                                ? 'bg-violet-500 text-white border-violet-500'
                                : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-violet-400'
                                }`}
                        >
                            <Icon icon="solar:card-2-bold-duotone" width={13} />
                            Pago Mixto
                        </button>
                    </div>

                    {!vm.isMixedPayment ? (
                        /* Modo simple — un solo método */
                        <div className="grid grid-cols-4 gap-2">
                            {METODOS.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => vm.setPaymentMethod(m)}
                                    className={`p-1.5 md:p-2 rounded-xl text-[10px] md:text-xs font-bold transition-all border ${vm.paymentMethod === m
                                        ? '!bg-emerald-500 text-white border-none shadow-sm shadow-emerald-200/50'
                                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Modo mixto — múltiples métodos con montos */
                        <div className="space-y-2">
                            {(vm.splitPayments as { method: string; amount: number }[]).map((sp, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                    <select
                                        value={sp.method}
                                        onChange={(e) => updateSplitMethod(idx, e.target.value)}
                                        className="flex-1 min-w-0 text-xs py-1.5 px-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-violet-400"
                                    >
                                        {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">S/</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={sp.amount || ''}
                                            onChange={(e) => updateSplitAmount(idx, parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                            className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        title="Completar con el resto"
                                        onClick={() => handleFillRemaining(idx)}
                                        className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 transition-colors"
                                    >
                                        <Icon icon="solar:arrow-down-bold-duotone" width={13} />
                                    </button>
                                    {vm.splitPayments.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSplitRow(idx)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <Icon icon="solar:close-circle-bold" width={13} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Resumen y agregar fila */}
                            <div className="flex items-center justify-between pt-1">
                                <button
                                    type="button"
                                    onClick={addSplitRow}
                                    disabled={vm.splitPayments.length >= 5}
                                    className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-40 flex items-center gap-1"
                                >
                                    <Icon icon="solar:add-circle-bold" width={12} />
                                    Agregar método
                                </button>
                                <div className={`text-[11px] font-bold ${splitValid ? 'text-emerald-600' : splitRemaining > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                                    {splitValid
                                        ? '✓ Completo'
                                        : splitRemaining > 0
                                            ? `Falta S/ ${splitRemaining.toFixed(2)}`
                                            : `Excede S/ ${(splitTotal - total).toFixed(2)}`}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-3">
                {vm.isQuotationRoute && (
                    <button
                        onClick={() => printFn()}
                        className="col-span-2 py-3.5 px-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Icon icon="solar:download-bold" className="text-xl" />
                        Exportar PDF Directo
                    </button>
                )}
                <button
                    onClick={() => handleOpenNewTab("vista previa")}
                    className="flex-1 py-2.5 md:py-3 bg-blue-500 text-white border border-blue-600 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 text-xs md:text-sm shadow-sm"
                >
                    <Icon icon="solar:eye-linear" className="text-lg text-white" />
                    <span className="text-white">PREVIA</span>
                </button>
                {/* Farmacia: indicador de recetas pendientes */}
                {hayRecetasPendientes && (
                    <div className="w-full mb-2 px-1">
                        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1.5 text-xs">
                            <span className="text-red-700 dark:text-red-300 font-semibold">
                                📋 {recetasPendientes} producto(s) requieren receta
                            </span>
                        </div>
                    </div>
                )}
                <button
                    onClick={vm.addInvoiceReceipt}
                    disabled={(vm.isMixedPayment && !splitValid) || hayRecetasPendientes}
                    className={`flex-1 py-2.5 md:py-3 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-xs md:text-sm ${(vm.isMixedPayment && !splitValid) || hayRecetasPendientes
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-violet-600 shadow-sm border border-violet-700 text-white'
                        }`}
                >
                    <Icon icon={vm.isEditMode ? "solar:pen-bold" : "solar:printer-minimalistic-bold"} className="text-lg text-white" />
                    <span className="text-white">{vm.isEditMode ? "ACTUALIZAR" : "EMITIR"}</span>
                </button>
            </div>
        </div>
    );
};
