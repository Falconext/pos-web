import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Icon } from "@iconify/react";
import { useFacturacionViewModel } from "../useFacturacionViewModel";
import { POSCatalogLayout } from "./POSCatalogLayout";
import { POSCartLayout } from "./POSCartLayout";
import { POSOptionsForm } from "./POSOptionsForm";
import { POSCalculations } from "./POSCalculations";

import ModalReponseInvoice from "@/pages/admin/facturacion/modalResponseInvoice";
import ModalProduct from "@/pages/admin/inventario/modal-productos";
import ModalClient from "@/pages/admin/clientes/ModalCliente";
import ComprobantePrintPage from "@/pages/admin/facturacion/comprobanteImprimir";
import ModalEditLineItem from "@/pages/admin/facturacion/ModalEditLineItem";
import ModalDetraccion from "@/pages/admin/facturacion/ModalDetraccion";
import ModalConfiguracionCotizacion from "@/pages/admin/facturacion/ModalConfiguracionCotizacion";

export const FacturacionNuevoView = () => {
    const vm = useFacturacionViewModel();
    const componentRef = useRef(null);

    const printFn = useReactToPrint({
        // @ts-ignore
        contentRef: componentRef,
        pageStyle: `@media print { @page { size: ${vm.dimensions.width}mm ${vm.dimensions.height}mm; margin: 0; } body { margin: 0; width: ${vm.dimensions.width}mm; } }`,
    });

    const handleOpenNewTab = (vista: string) => { printFn(); };

    return (
        <div className={`flex flex-col md:flex-row min-h-screen md:min-h-0 md:overflow-hidden pb-8 gap-4 md:gap-6 font-inter text-gray-800 dark:text-gray-200 bg-[#F0F2FA] dark:bg-[#0A0D14] transition-all duration-300 ${!vm.showMobileCart && vm.isMobile ? 'pb-24' : 'pb-0'}`}
            style={{ height: !vm.isMobile ? (vm.isCompact ? 'calc(125vh - 100px)' : 'calc(100vh - 85px)') : 'auto' }}
        >
            {/* Hidden Print Component - Off-screen but with real dimensions for print engine */}
            <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
                <ComprobantePrintPage
                    id="print-root"
                    company={vm.auth}
                    qrCodeDataUrl={vm.qrCodeDataUrl}
                    productsInvoice={vm.productsInvoice}
                    total={vm.total}
                    mode={"vista previa"}
                    componentRef={componentRef}
                    size={vm.printSize}
                    includeProductImages={vm.includeProductImages}
                    quotationDiscount={vm.quotationDiscount}
                    quotationValidity={vm.quotationValidity}
                    quotationSignature={vm.quotationSignature}
                    quotationTerms={vm.quotationTerms}
                    quotationPaymentType={vm.quotationPaymentType}
                    quotationAdvance={vm.quotationAdvance}
                    formValues={{
                        ...vm.formValues,
                        serie: vm.dataReceipt?.serie,
                        correlativo: vm.dataReceipt?.correlativo,
                        numDocAfectado: `${vm.serie}-${vm.correlative}`,
                        medioPago: vm.formValues?.comprobante === "NOTA DE PEDIDO" ? "" : vm.paymentMethod,
                        ...(vm.tipoDetraccionId ? {
                            tipoDetraccion: vm.tiposDetraccion.find((t: any) => t.id === vm.tipoDetraccionId),
                            montoDetraccion: vm.montoDetraccion,
                            cuentaBancoNacion: vm.cuentaBancoNacion,
                            medioPagoDetraccion: vm.mediosPagoDetraccion.find((m: any) => m.id === vm.medioPagoDetraccionId),
                            cuotas: vm.cuotas
                        } : {})
                    }}
                    serie={vm.serie}
                    correlative={vm.correlative}
                    discount={vm.finalDiscount.toString()}
                    receipt={vm.formValues?.comprobante}
                    selectedClient={vm.selectedClient}
                    totalInWords={vm.totalInWords}
                    observation={vm.formValues?.observaciones || vm.formValues?.motivo}
                    retencionData={vm.retencionData}
                />
            </div>

            {/* LEFT PANEL */}
            <POSCatalogLayout vm={vm} />

            {/* Floating Mobile Cart Toggle */}
            {vm.isMobile && !vm.showMobileCart && vm.productsInvoice.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-slate-800 p-4 z-[50] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between pb-8">
                    <div className="flex flex-col">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">{vm.productsInvoice.length} Items</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">S/ {vm.totalAdjusted.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={() => vm.setShowMobileCart(true)}
                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors"
                    >
                        <Icon icon="solar:cart-large-minimalistic-bold" className="text-xl" />
                        Ver Pedido
                    </button>
                </div>
            )}

            {/* RIGHT PANEL: CART / INVOICE */}
            <div className={`w-full md:w-[35%] flex-col h-auto md:h-full md:overflow-y-auto bg-white dark:bg-[#111827] rounded-[24px] md:rounded-[32px] shadow-sm md:shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden border border-white dark:border-slate-800 ${vm.isMobile ? (vm.showMobileCart ? 'fixed inset-0 z-[60] flex' : 'hidden') : 'flex'} md:flex`}>
                <POSOptionsForm vm={vm} />
                <POSCartLayout vm={vm} />
                <POSCalculations vm={vm} printFn={printFn} handleOpenNewTab={handleOpenNewTab} />
            </div>

            {/* Modals */}
            {vm.IsOpenModalSuccessInvoice && (
                <ModalReponseInvoice
                    handleOpenNewTab={() => handleOpenNewTab("")}
                    closeModal={vm.closeModalResponse}
                    isLoading={vm.isLoading}
                    comprobante={vm.formValues?.comprobante}
                    auth={vm.auth} serie={vm.serie}
                    correlative={vm.correlative}
                    dataReceipt={vm.dataReceipt}
                    client={vm.selectedClient}
                    company={vm.auth}
                    productsInvoice={vm.productsInvoice}
                    formValues={vm.formValues}
                    observation={vm.formValues?.observaciones}
                    isPendiente={vm.isComprobantePendiente}
                />
            )}

            {vm.isOpenModalProduct && (
                <ModalProduct
                    setSelectProduct={vm.setSelectProduct}
                    isInvoice
                    initialForm={vm.initialFormProduct}
                    setErrors={vm.setErrorsProduct}
                    setFormValues={vm.setFormValuesProduct}
                    isOpenModal={vm.isOpenModalProduct}
                    errors={vm.errorsProduct}
                    formValues={vm.formValuesProduct}
                    isEdit={false}
                    setIsOpenModal={vm.setIsOpenModalProduct}
                    closeModal={vm.closeModal}
                />
            )}

            {vm.isOpenModalClient && (
                <ModalClient
                    isOpenModal={vm.isOpenModalClient}
                    errors={vm.errorsClient}
                    setErrors={vm.setErrorsClient}
                    formValues={vm.formValuesClient}
                    setFormValues={vm.setFormValuesClient}
                    isEdit={false}
                    setIsOpenModal={vm.setIsOpenModalClient}
                    closeModal={vm.closeModal}
                />
            )}

            {vm.editingIndex !== -1 && (
                <ModalEditLineItem
                    isOpen={vm.editingIndex !== -1}
                    onClose={() => vm.setEditingIndex(-1)}
                    item={vm.productsInvoice[vm.editingIndex]}
                    onSave={vm.handleSaveEdit}
                />
            )}

            <ModalDetraccion
                isOpen={vm.isModalDetraccionOpen}
                onClose={() => vm.setIsModalDetraccionOpen(false)}
                onSave={vm.handleSaveDetraccion}
                initialData={vm.tipoDetraccionId ? {
                    tipoDetraccionId: vm.tipoDetraccionId || 0,
                    medioPagoDetraccionId: vm.medioPagoDetraccionId || 0,
                    cuentaBancoNacion: vm.cuentaBancoNacion || '',
                    porcentajeDetraccion: vm.porcentajeDetraccion || 0,
                    montoDetraccion: vm.montoDetraccion || 0,
                    formaPago: vm.formValues.medioPago as 'Contado' | 'Credito' || 'Contado',
                    cuotas: vm.cuotas || [],
                } : null}
                totalFactura={vm.total || 0}
                tiposDetraccion={vm.tiposDetraccion}
                mediosPagoDetraccion={vm.mediosPagoDetraccion}
            />
            <ModalDetraccion
                isOpen={vm.isModalRetencionOpen}
                onClose={() => vm.setIsModalRetencionOpen(false)}
                onSave={vm.handleSaveRetencion}
                totalFactura={vm.totalAdjusted}
                tiposDetraccion={vm.tiposDetraccion}
                mediosPagoDetraccion={vm.mediosPagoDetraccion}
                initialData={vm.retencionData}
                mode="RETENCION"
            />
            <ModalConfiguracionCotizacion
                isOpen={vm.isQuotationConfigModalOpen}
                onClose={() => vm.setIsQuotationConfigModalOpen(false)}
                onSave={vm.handleSaveQuotationConfig}
                initialConfig={{
                    includeProductImages: vm.includeProductImages,
                    quotationDiscount: vm.quotationDiscount,
                    quotationValidity: vm.quotationValidity,
                    quotationSignature: vm.quotationSignature,
                    quotationTerms: vm.quotationTerms,
                    quotationPaymentType: vm.quotationPaymentType,
                    quotationAdvance: vm.quotationAdvance,
                    observaciones: vm.formValues.observaciones
                }}
            />
        </div>
    );
};
export default FacturacionNuevoView;
