import Select from "@/components/Select";
import InputPro from "@/components/InputPro";
import { Icon } from "@iconify/react";

export const POSOptionsForm = ({ vm }: { vm: any }) => {
    return (
        <div className="p-4 md:p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-[#111827]">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    {/* Mobile Back Button */}
                    {vm.isMobile && (
                        <button
                            onClick={() => vm.setShowMobileCart(false)}
                            className="mr-2 p-2 -ml-2 text-gray-500 hover:text-gray-700 active:bg-gray-200 rounded-full"
                        >
                            <Icon icon="solar:arrow-left-linear" className="text-2xl" />
                        </button>
                    )}
                    <div className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl">
                        <Icon icon="solar:bill-list-bold-duotone" className="text-xl" />
                    </div>
                    <h2 className="font-bold text-gray-800 dark:text-white text-lg">Detalle de Venta</h2>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-1 md:col-span-2 flex items-center justify-center gap-3">
                    <Select
                        value={vm.formValues?.comprobante}
                        isSearch options={vm.comprobantesGenerar}
                        id="tipoDoc" name="comprobante"
                        error=""
                        onChange={vm.handleChangeSelect}
                        label="Tipo Comprobante" isIcon icon="solar:file-text-linear"
                    />
                </div>

                {/* Tipo de Operación y Detracción */}
                {(!["NOTA DE CREDITO", "NOTA DE DEBITO", "COTIZACIÓN"].includes(vm.formValues?.comprobante)) && (
                    <div className="col-span-1 md:col-span-2 space-y-2 mt-0 md:mt-2">
                        <div>
                            <Select
                                value={vm.tiposOperacion.find((op: any) => Number(op.id) === Number(vm.formValues.motivoId))?.descripcion || ""}
                                options={vm.tiposOperacion.map((op: any) => ({ id: op.id, value: op.descripcion }))}
                                label="Tipo de Operación"
                                id="motivoId"
                                name="motivo"
                                onChange={(idVal, val, name, id) => {
                                    const newId = Number(idVal);
                                    const updatedForm = { ...vm.formValues, motivoId: newId };
                                    const selectedOp = vm.tiposOperacion.find((op: any) => Number(op.id) === newId);

                                    if (selectedOp?.codigo !== '0112') {
                                        vm.setTipoDetraccionId(undefined);
                                        vm.setMedioPagoDetraccionId(undefined);
                                        vm.setPorcentajeDetraccion(0);
                                        vm.setCuentaBancoNacion('');
                                    } else {
                                        vm.setIsModalDetraccionOpen(true);
                                    }
                                    vm.setRetencionData(null);
                                    vm.setFormValues(updatedForm);
                                }}
                                error=""
                                isIcon
                                icon="solar:bill-list-linear"
                                isSearch
                            />
                        </div>

                        {/* Panel Detracción Compacto */}
                        {vm.tiposOperacion.find((op: any) => op.id === vm.formValues.motivoId)?.codigo === '0112' && (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => vm.setIsModalDetraccionOpen(true)}
                                    className="w-full p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl border-2 border-gray-300 flex items-center justify-between group transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-gray-900 rounded-lg group-hover:scale-110 transition-transform">
                                            <Icon icon="solar:settings-bold" className="text-white" width={16} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">Configurar Detracción</span>
                                    </div>
                                    <Icon icon="solar:alt-arrow-right-linear" className="text-gray-900 group-hover:translate-x-1 transition-transform" width={18} />
                                </button>
                                {vm.tipoDetraccionId && (
                                    <div className="flex items-center justify-between bg-green-50 p-2.5 rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:check-circle-bold" className="text-green-600" width={18} />
                                            <span className="text-xs font-medium text-green-700">
                                                {vm.tiposDetraccion.find((t: any) => t.id === vm.tipoDetraccionId)?.descripcion || 'Configurado'}
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-green-800">S/ {vm.montoDetraccion.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Botón Retención 3% */}
                {(vm.tiposOperacion.find((op: any) => op.id === vm.formValues.motivoId)?.codigo !== "0112" && vm.totalAdjusted >= 700 && vm.auth?.empresa?.esAgenteRetencion) && (
                    <div className="mt-0 col-span-2 mb-0 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg p-3">
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => vm.setIsModalRetencionOpen(true)}
                                className="w-full p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 hover:from-gray-100 hover:to-gray-200 dark:hover:from-slate-700 dark:hover:to-slate-800 rounded-xl border-2 border-gray-300 dark:border-slate-700 flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-gray-900 dark:bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">
                                        <Icon icon="solar:percent-circle-bold" className="text-white" width={16} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Configurar Retención 3%</span>
                                </div>
                                <Icon icon="solar:alt-arrow-right-linear" className="text-gray-900 dark:text-white group-hover:translate-x-1 transition-transform" width={18} />
                            </button>

                            {vm.retencionData && (
                                <div className="flex items-center justify-between bg-gray-100 dark:bg-slate-800 p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center gap-2">
                                        <Icon icon="solar:check-circle-bold" className="text-gray-900 dark:text-white" width={18} />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">Reg. Retenciones del IGV (3%)</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">Retención: S/ {vm.retencionData.montoDetraccion?.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {vm.isQuotationRoute && (
                    <div className="col-span-2 flex items-center gap-2 pt-0">
                        <input
                            type="checkbox"
                            id="includeImages"
                            checked={vm.includeProductImages}
                            onChange={(e) => vm.setIncludeProductImages(e.target.checked)}
                            className="w-4 h-4 text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-700 rounded focus:ring-gray-900"
                            style={{ accentColor: '#1C1C24' }}
                        />
                        <label htmlFor="includeImages" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none flex items-center gap-1">
                            <Icon icon="solar:gallery-bold-duotone" className="text-gray-900 dark:text-gray-100" />
                            Incluir imágenes del producto
                        </label>
                    </div>
                )}
            </div>

            {/* Cliente */}
            {vm.formValues?.comprobante !== "NOTA DE CREDITO" && vm.formValues?.comprobante !== "NOTA DE DEBITO" && (
                <div className="flex gap-2 justify-between items-center">
                    <div className="flex-1">
                        <Select
                            handleGetData={vm.handleGetDataClient}
                            value={vm.formValues?.clienteNombre}
                            isSearch options={vm.clients?.map((item: any) => ({ id: item?.id, value: `${item?.nroDoc}-${item.nombre}` }))}
                            id="clienteId" name="clienteNombre"
                            error=""
                            onChange={vm.handleChangeSelect}
                            label="Cliente" isIcon icon="solar:user-linear"
                        />
                    </div>
                    <button onClick={() => vm.setIsOpenModalClient(true)} className="px-4 py-3 relative top-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 transition-colors shadow-sm">
                        <Icon icon="solar:user-plus-bold" className="text-xl" />
                    </button>
                </div>
            )}

            {/* Sección para NOTA DE CRÉDITO / DÉBITO */}
            {(vm.formValues?.comprobante === "NOTA DE CREDITO" || vm.formValues?.comprobante === "NOTA DE DEBITO") && (
                <div className="mt-4 p-4 bg-white dark:bg-[#1E2435] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50 dark:border-slate-800">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Icon icon="solar:file-check-bold-duotone" className="text-amber-600 dark:text-amber-400" width={18} />
                        </div>
                        <h4 className="font-bold text-gray-700 dark:text-white text-sm">Documento a Modificar</h4>
                    </div>

                    {/* Grid de campos */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-1">
                            <Select
                                label="Tipo Documento"
                                value={vm.receiptsToNote.find((r: any) => r.id === vm.receiptNoteId)?.value || ""}
                                options={vm.receiptsToNote.map((r: any) => ({ id: r.id, value: r.value }))}
                                id="receiptNoteId"
                                name="receiptNoteId"
                                onChange={(id: any) => vm.setReceiptNoteId(id)}
                                error=""
                                isIcon icon="solar:file-text-linear"
                            />
                        </div>

                        <div className="col-span-1">
                            <Select
                                label="Motivo / Operación"
                                value={((vm.typesOperation as any[])?.find((op: any) => op.id === Number(vm.formValues.motivoId))?.descripcion) || ""}
                                options={(vm.typesOperation as any[])?.map((item: any) => ({ id: item.id, value: item.descripcion })) || []}
                                id="motivoId"
                                name="motivo"
                                onChange={(idValue) => {
                                    const selectedId = Number(idValue);
                                    const selected: any = vm.typesOperation?.find((op: any) => op.id === selectedId);
                                    if (selected) {
                                        vm.handleChangeSelect(selectedId, selected.descripcion, 'motivo', 'motivoId');
                                    }
                                }}
                                error=""
                                isSearch
                                isIcon icon="solar:list-check-linear"
                                left
                            />
                        </div>

                        <div className="col-span-1">
                            <InputPro
                                label="Serie"
                                value={vm.serie}
                                onChange={(e) => vm.setSerie(e.target.value.toUpperCase())}
                                name="serie"
                                placeholder="F001"
                                isLabel
                                uppercase
                                className="uppercase"
                            />
                        </div>

                        <div className="col-span-1 relative flex gap-2">
                            <div className="flex-1">
                                <InputPro
                                    label="Correlativo"
                                    value={vm.correlative}
                                    onChange={(e) => vm.setCorrelative(e.target.value)}
                                    name="correlative"
                                    placeholder="00000001"
                                    isLabel
                                    type="number"
                                />
                            </div>
                            <button
                                onClick={() => vm.getInvoiceBySerieCorrelative(vm.serie.toUpperCase(), vm.correlative, vm.formValues.motivoId)}
                                className="absolute right-0 bottom-0 h-[46px] w-[46px] flex items-center justify-center bg-gray-900 hover:bg-black text-white rounded-xl transition-all active:scale-95"
                                title="Buscar Documento"
                            >
                                <Icon icon="solar:magnifer-bold" className="text-xl" />
                            </button>
                        </div>
                    </div>

                    {vm.invoiceData && (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Icon icon="solar:check-circle-bold" className="text-emerald-500" width={18} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-700 text-sm">{vm.invoiceData?.serie}-{String(vm.invoiceData?.correlativo).padStart(8, '0')}</div>
                                    <div className="text-[11px] text-emerald-600 font-medium truncate max-w-[150px]">{vm.invoiceData?.cliente?.nombre}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total</span>
                                <div className="font-black text-gray-800 text-lg leading-none">S/ {Number(vm.invoiceData?.mtoImpVenta || 0).toFixed(2)}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
