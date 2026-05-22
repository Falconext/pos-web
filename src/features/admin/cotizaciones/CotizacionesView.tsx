import { Icon } from "@iconify/react/dist/iconify.js";
import moment from "moment";
import DataTable from "@/components/Datatable";
import Pagination from "@/components/Pagination";
import { numberToWords } from "@/utils/numberToLetters";
import { Calendar } from "@/components/Date";
import Select from "@/components/Select";
import ModalConfirm from "@/components/ModalConfirm";
import InputPro from "@/components/InputPro";
import ComprobantePrintPage from "../../../pages/admin/facturacion/comprobanteImprimir";
import ModalEnviarWhatsApp from "../../../pages/admin/facturacion/ModalEnviarWhatsApp";
import ModalPaymentUnified from "@/components/ModalPaymentUnified";
import PaymentReceipt from "@/components/PaymentReceipt";
import Modal from "@/components/Modal";
import TableActionMenu from "@/components/TableActionMenu";

import { useCotizacionesViewModel } from "./useCotizacionesViewModel";
import { IInvoices } from "@/interfaces/invoices";

export default function CotizacionesView() {
    const vm = useCotizacionesViewModel();

    const productsTable = vm.invoices?.map((item: IInvoices) => {
        const rowBase: any = {
            id: item?.id,
            fechaEmisión: moment(item?.fechaEmision).format('DD/MM/YYYY HH:mm:ss'),
            serie: item.serie,
            correlativo: item.correlativo,
            comprobante: item.comprobante,
            documentoAfiliado: item?.numDocAfectado,
            document: item?.cliente?.nroDoc,
            s3PdfUrl: item?.s3PdfUrl,
            client: item?.cliente?.nombre,
            total: `S/ ${item.mtoImpVenta.toFixed(2)}`,
            estado: ["BOLETA", "FACTURA", "NOTA DE CREDITO", "NOTA DE DEBITO"].includes(item.comprobante)
                ? item.estadoEnvioSunat
                : item.estadoPago,
            xmlSunat: item.sunatXml,
            cdrSunat: item.sunatCdrZip,
        };

        const canEmitirSunat = ["BOLETA", "FACTURA", "NOTA DE CREDITO", "NOTA DE DEBITO"].includes(rowBase.comprobante);

        const acciones = (
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (vm.openAccionesId === rowBase.id) {
                            vm.setOpenAccionesId(null);
                            vm.setAnchorEl(null);
                        } else {
                            vm.setOpenAccionesId(rowBase.id);
                            vm.setAnchorEl(e.currentTarget);
                        }
                    }}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 flex items-center gap-1"
                >
                    <Icon icon="mdi:dots-vertical" width={18} height={18} />
                </button>
            </div>
        );

        return {
            ...rowBase,
            acciones,
        };
    });

    return (
        <>
            <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
            {vm.invoice && vm.invoice.detalles && (
                <ComprobantePrintPage
                    company={vm.auth}
                    componentRef={vm.componentRef}
                    formValues={vm.invoice}
                    size={vm.printSize}
                    serie={vm.invoice?.serie}
                    correlative={vm.invoice?.correlativo}
                    productsInvoice={(() => {
                        const mapped = vm.invoice?.detalles?.map((det: any) => ({
                            ...det,
                            imagenUrl: det.producto?.imagenUrl || det.imagenUrl,
                        }));
                        return mapped;
                    })()}
                    total={Number(vm.invoice?.mtoImpVenta).toFixed(2)}
                    mode="off"
                    qrCodeDataUrl={vm.qrCodeDataUrl}
                    discount={vm.invoice?.discount}
                    receipt={vm.comprobante || vm.invoice?.comprobante}
                    selectedClient={vm.invoice?.cliente}
                    totalInWords={numberToWords(parseFloat(vm.invoice?.mtoImpVenta as any)) + " SOLES"}
                    observation={vm.invoice?.observaciones}
                    includeProductImages={vm.invoice?.cotizIncluirImagenes || false}
                    quotationDiscount={vm.invoice?.cotizDescuento || 0}
                    quotationValidity={vm.invoice?.cotizVigencia || 7}
                    quotationSignature={vm.invoice?.cotizFirmante || ''}
                    quotationTerms={vm.invoice?.cotizTerminos || ''}
                    quotationPaymentType={vm.invoice?.cotizTipoPago || 'CONTADO'}
                    quotationAdvance={vm.invoice?.cotizAdelanto || 0}
                />
            )}
            </div>

            <div className="min-h-screen px-4 pb-6 bg-gray-50 dark:bg-[#0A0D14]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Icon icon="solar:document-text-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                        Cotizaciones
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona y convierte tus cotizaciones en facturas</p>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                {/* Filters Section */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Icon icon="solar:filter-bold-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
                        <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-xs">Filtros de búsqueda</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-1">
                            <InputPro name="searchClient" onChange={vm.handleChangeSearch} isLabel label="Buscar serie, cliente, correlativo" />
                        </div>
                        <div>
                            <Calendar text="Fecha inicio" name="fechaInicio" onChange={vm.handleDate} />
                        </div>
                        <div>
                            <Calendar text="Fecha Fin" name="fechaFin" onChange={vm.handleDate} />
                        </div>
                        <div>
                            <Select onChange={vm.handleSelectPrint} label="Formato impresión" name="printSize" defaultValue={vm.printSize} options={vm.printOptions} error="" />
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-4">
                    {productsTable?.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <DataTable bodyData={productsTable}
                                    headerColumns={[
                                        'Fecha',
                                        'Serie',
                                        'Nro.',
                                        'Comprobante',
                                        'Doc. Afiliado',
                                        'Num doc',
                                        'Cliente',
                                        'Importe',
                                        'Estado',
                                        'Acciones'
                                    ]} />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                <Pagination
                                    data={productsTable}
                                    optionSelect
                                    currentPage={vm.currentPage}
                                    indexOfFirstItem={vm.indexOfFirstItem}
                                    indexOfLastItem={vm.indexOfLastItem}
                                    setcurrentPage={vm.setcurrentPage}
                                    setitemsPerPage={vm.setitemsPerPage}
                                    pages={vm.pages}
                                    total={vm.totalInvoices}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center">
                            <Icon icon="solar:document-text-linear" className="text-5xl text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No se encontraron comprobantes</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Ajusta los filtros o selecciona un rango de fechas diferente</p>
                        </div>
                    )}
                </div>
            </div>

            {vm.isOpenModalConfirm && (
                <ModalConfirm
                    confirmSubmit={vm.confirmCancelInvoice}
                    information="¿Estás seguro que deseas anular este comprobante?"
                    isOpenModal
                    setIsOpenModal={() => vm.setIsOpenModalConfirm(false)}
                    title="Anular comprobante"
                />
            )}

            {vm.isOpenModalConfirmPayment && (
                <ModalConfirm
                    confirmSubmit={vm.confirmCompleteInvoice}
                    information="¿Cuál de estos metodos de pago se completo el pago?"
                    isOpenModal
                    setIsOpenModal={() => vm.setIsOpenModalConfirmPayment(false)}
                    title="Completar pago"
                >
                    <div className="grid grid-cols-3 gap-10 col-start-1 col-end-2 mb-5 mt-5">
                        {[
                            { key: 'Efectivo', src: 'https://img.freepik.com/vector-premium/efectivo-mano-logotipo-empresario-blanco_269543-105.jpg' },
                            { key: 'Yape', src: 'https://marketing-peru.beglobal.biz/wp-content/uploads/2025/01/logo-yape-bolivia.jpeg' },
                            { key: 'Plin', src: 'https://logosenvector.com/logo/img/plin-interbank-4391.png' },
                        ].map(({ key, src }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => vm.setPaymentMethod(key)}
                                className={`p-1 justify-center rounded-lg flex border-2 ${vm.paymentMethod === key
                                    ? 'border-blue-500 bg-blue-100'
                                    : 'border-transparent hover:border-gray-300'
                                    }`}
                            >
                                <img src={src} alt={key} className="w-14 object-cover" />
                            </button>
                        ))}
                    </div>
                </ModalConfirm>
            )}

            {vm.isOpenModalWhatsApp && vm.comprobanteWhatsApp && (
                <ModalEnviarWhatsApp
                    isOpen={vm.isOpenModalWhatsApp}
                    defaultTab={vm.modalDefaultTab}
                    onClose={() => {
                        vm.setIsOpenModalWhatsApp(false);
                    }}
                    comprobante={vm.comprobanteWhatsApp}
                />
            )}

            <Modal
                isOpenModal={vm.isOpenModalPdf}
                closeModal={() => vm.setIsOpenModalPdf(false)}
                title="Vista previa del PDF"
                width="980px"
            >
                <div className="p-3 space-y-3">
                    <div className="flex justify-end">
                        {vm.pdfUrl && (
                            <a
                                href={vm.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs rounded-md bg-[#6A6CFF] text-white hover:opacity-90"
                            >
                                Descargar
                            </a>
                        )}
                    </div>
                    <div className="h-[80vh] flex items-center justify-center">
                        {!vm.pdfUrl ? (
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <Icon icon="solar:refresh-bold" className="animate-spin text-violet-500" width={36} />
                                <span className="text-sm">Generando PDF...</span>
                            </div>
                        ) : (
                            <iframe src={vm.pdfUrl} className="w-full h-full rounded-lg border" />
                        )}
                    </div>
                </div>
            </Modal>

            {(vm.isOpenModalPagoParcial && vm.paymentFlow.payment) && (
                <ModalPaymentUnified
                    isOpen={vm.isOpenModalPagoParcial}
                    isLoading={vm.paymentFlow.isLoading}
                    paymentType={vm.paymentFlow.payment.tipo}
                    saldoPendiente={parseFloat((vm.formValues?.saldo || '').toString().replace('S/ ', '') || '0') || parseFloat((vm.formValues?.total || '').toString().replace('S/ ', '') || '0')}
                    totalComprobante={parseFloat((vm.formValues?.total || '').toString().replace('S/ ', '') || '0')}
                    comprobanteInfo={{
                        id: vm.formValues.id,
                        serie: vm.formValues.serie,
                        correlativo: vm.formValues.correlativo,
                        cliente: vm.formValues.client,
                        total: parseFloat((vm.formValues?.total || '').toString().replace('S/ ', '') || '0')
                    }}
                    onConfirm={vm.handleConfirmPago}
                    onCancel={() => {
                        vm.setIsOpenModalPagoParcial(false);
                        vm.paymentFlow.reset();
                    }}
                    error={vm.paymentFlow.error || ''}
                />
            )}

            {vm.paymentFlow.showReceipt && vm.paymentFlow.receiptData && (
                <PaymentReceipt
                    comprobante={vm.paymentFlow.receiptData.comprobante}
                    saldo={vm.formValues?.saldo}
                    payment={vm.paymentFlow.receiptData.payment}
                    numeroRecibo={vm.paymentFlow.receiptData.numeroRecibo}
                    nuevoSaldo={vm.paymentFlow.receiptData.nuevoSaldo}
                    detalles={vm.paymentFlow.receiptData.detalles}
                    cliente={vm.paymentFlow.receiptData.cliente}
                    pagosHistorial={vm.paymentFlow.receiptData.pagosHistorial}
                    totalPagado={vm.paymentFlow.receiptData.totalPagado}
                    company={vm.auth}
                    onClose={vm.handleCloseReceipt}
                />
            )}

            <TableActionMenu
                isOpen={!!vm.openAccionesId && !!vm.anchorEl}
                anchorEl={vm.anchorEl}
                onClose={() => {
                    vm.setOpenAccionesId(null);
                    vm.setAnchorEl(null);
                }}
            >
                {vm.openAccionesId && (() => {
                    const rowData = productsTable.find((r: any) => r.id === vm.openAccionesId);
                    if (!rowData) return null;

                    const canEmitirSunat = ["BOLETA", "FACTURA", "NOTA DE CREDITO", "NOTA DE DEBITO"].includes(rowData.comprobante);

                    return (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    vm.handleGetReceipt(rowData);
                                    vm.setOpenAccionesId(null);
                                    vm.setAnchorEl(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                                <Icon icon="mingcute:print-line" width={16} height={16} />
                                <span>Imprimir</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    vm.handleVerPdf(rowData);
                                    vm.setOpenAccionesId(null);
                                    vm.setAnchorEl(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                                <Icon icon="mdi:file-pdf-box" width={16} height={16} />
                                <span>Ver PDF</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    vm.handleEditCotizacion(rowData);
                                    vm.setOpenAccionesId(null);
                                    vm.setAnchorEl(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-t border-gray-100 dark:border-slate-800"
                            >
                                <Icon icon="solar:pen-bold-duotone" width={16} height={16} />
                                <span className="font-medium">Editar</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    vm.handleConvertirAFactura(rowData);
                                    vm.setOpenAccionesId(null);
                                    vm.setAnchorEl(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                            >
                                <Icon icon="solar:document-add-bold-duotone" width={16} height={16} />
                                <span className="font-medium">Convertir a Factura</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    vm.handleEnviarWhatsApp(rowData, 'email');
                                    vm.setOpenAccionesId(null);
                                    vm.setAnchorEl(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 border-t border-gray-100 dark:border-slate-800"
                            >
                                <Icon icon="mdi:email-outline" width={16} height={16} />
                                <span className="font-medium">Enviar por Email</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    vm.handleEnviarWhatsApp(rowData, 'whatsapp');
                                    vm.setOpenAccionesId(null);
                                    vm.setAnchorEl(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10"
                            >
                                <Icon icon="mdi:whatsapp" width={16} height={16} />
                                <span className="font-medium">Enviar WhatsApp</span>
                            </button>
                        </>
                    );
                })()}
            </TableActionMenu>
            </div>
        </>
    );
}
