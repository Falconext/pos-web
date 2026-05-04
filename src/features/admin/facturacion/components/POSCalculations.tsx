import { Icon } from "@iconify/react";

export const POSCalculations = ({ vm, printFn, handleOpenNewTab }: { vm: any, printFn: any, handleOpenNewTab: any }) => {
    return (
        <div className="p-3 pt-2 md:p-5 md:pb-8 bg-gray-50 dark:bg-[#111827] border-t border-gray-100 dark:border-slate-800">
            <div className="space-y-1 md:space-y-2 mb-3 md:mb-4">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Op. Gravada</span>
                    <span>S/ {vm.opGravadaAdjusted.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
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
                    <span>S/ {vm.totalAdjusted.toFixed(2)}</span>
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
                                max={vm.totalAdjusted}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                            />
                        </div>
                        {vm.adelanto > 0 && (
                            <div className="mt-2 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Saldo pendiente:</span>
                                    <span className="font-bold text-orange-600 dark:text-orange-400">
                                        S/ {Math.max(0, vm.totalAdjusted - vm.adelanto).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quotation-specific fields - Collapsible */}
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
            <div className="mb-3 md:mb-4">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 md:mb-2 block">Metodo de Pago</label>
                <div className="grid grid-cols-4 gap-2">
                    {['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta'].map((m) => (
                        <button
                            key={m}
                            onClick={() => vm.setPaymentMethod(m)}
                            className={`p-1.5 md:p-2 rounded-xl text-[10px] md:text-xs font-bold transition-all border ${vm.paymentMethod === m ? '!bg-emerald-500 text-white border-none shadow-sm shadow-emerald-200/50' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

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
                    className="flex-1 py-2.5 md:py-3 !bg-blue-500 text-white border-none rounded-xl font-bold shadow-md shadow-blue-200 hover:opacity-90 transition-all flex items-center justify-center gap-2 text-xs md:text-sm"
                >
                    <Icon icon="solar:eye-linear" className="text-lg" />
                    PREVIA
                </button>
                <button onClick={vm.addInvoiceReceipt} className="flex-1 py-2.5 md:py-3 !bg-violet-600 text-white border-none rounded-xl font-bold shadow-md shadow-violet-200 hover:opacity-90 transition-all flex items-center justify-center gap-2 text-xs md:text-sm">
                    <Icon icon={vm.isEditMode ? "solar:pen-bold" : "solar:printer-minimalistic-bold"} className="text-lg" />
                    {vm.isEditMode ? "ACTUALIZAR" : "EMITIR"}
                </button>
            </div>
        </div>
    );
};
