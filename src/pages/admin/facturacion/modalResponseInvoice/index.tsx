import Modal from "react-modal";
import { IInvoicesState, useInvoiceStore } from "@/zustand/invoices";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useState } from "react";
import { Icon } from "@iconify/react";
import ModalEnviarWhatsApp from "@/pages/admin/facturacion/ModalEnviarWhatsApp";

interface IProps {
    serie: string
    correlative: string
    dataReceipt: any
    auth: any
    client: any
    comprobante: string
    isLoading: boolean
    closeModal: any
    handleOpenNewTab: any
    company?: any
    productsInvoice?: any[]
    formValues?: any
    observation?: string
    isPendiente?: boolean
}

const ModalReponseInvoice = ({ isLoading, dataReceipt, auth, client, comprobante, closeModal, handleOpenNewTab, formValues, isPendiente }: IProps) => {
    const { resetInvoice, resetProductInvoice }: IInvoicesState = useInvoiceStore();
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const [showEnviar, setShowEnviar] = useState(false);
    const [tabEnviar, setTabEnviar] = useState<'whatsapp' | 'email'>('whatsapp');

    const customStyles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            width: isMobile ? '92vw' : '460px',
            maxWidth: '500px',
            maxHeight: '96vh',
            border: 'none',
            backgroundColor: '#fff',
            borderRadius: '24px',
            marginRight: '-50%',
            padding: '0px',
            overflow: 'auto',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
        },
        overlay: {
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
        },
    };

    const goListInvoice = () => {
        resetInvoice();
        resetProductInvoice();
        if (['BOLETA', 'FACTURA', 'NOTA DE CREDITO', 'NOTA DE DEBITO'].includes(comprobante)) {
            navigate('/administrador/facturacion/comprobantes');
        } else if (comprobante === 'COTIZACIÓN') {
            navigate('/administrador/cotizaciones');
        } else {
            navigate('/administrador/facturacion/comprobantes-informales');
        }
    };

    const canShare = dataReceipt?.id != null && dataReceipt.id !== 0;

    const comprobanteParaEnvio = canShare ? {
        id: dataReceipt.id,
        serie: dataReceipt.serie,
        correlativo: dataReceipt.correlativo,
        comprobante,
        total: dataReceipt.total ?? formValues?.mtoImpVenta ?? 0,
        clienteNombre: client?.nombre ?? '',
        clienteCelular: client?.telefono ?? client?.celular ?? '',
        clienteEmail: client?.email ?? '',
    } : null;

    return (
        <>
            <Modal ariaHideApp={false} isOpen style={customStyles}>
                {isLoading ? (
                    <div className="p-10 flex flex-col items-center gap-4">
                        <img className="w-32 h-32 object-contain" src="/gif/loading.gif" alt="Procesando" />
                        <p className="text-sm font-semibold text-gray-500 text-center">
                            Espere por favor, procesando su comprobante...
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Header con estado */}
                        <div className="px-6 pt-7 pb-5 flex flex-col items-center gap-3 text-center border-b border-gray-100">
                            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-medium">Comprobante emitido</p>

                            {isPendiente ? (
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200">
                                    <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            ) : (
                                <img className="w-20 h-20" src="/gif/suc.gif" alt="Éxito" />
                            )}

                            <div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {isPendiente ? (
                                        <>
                                            Comprobante <strong>registrado correctamente</strong>.<br />
                                            <span className="text-amber-600 font-medium text-xs">SUNAT no disponible — se confirmará automáticamente.</span>
                                        </>
                                    ) : (
                                        <>
                                            Hola, <strong>{auth?.nombre}</strong>. La {comprobante?.toLowerCase()} del cliente <strong>{client?.nombre}</strong> fue generada con éxito.
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Número de comprobante destacado */}
                            <div className={`mt-1 px-6 py-3 rounded-2xl border-2 border-dashed ${isPendiente ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}`}>
                                <span className={`text-3xl font-bold tracking-[0.18em] ${isPendiente ? 'text-amber-500' : 'text-emerald-600'}`}>
                                    {dataReceipt?.serie}-{dataReceipt?.correlativo}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">
                                {isPendiente ? 'Se confirmará en tu historial pronto.' : 'Disponible en tu historial de comprobantes.'}
                            </p>
                        </div>

                        {/* Sección compartir */}
                        {canShare && (
                            <div className="px-6 pt-4 pb-2">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-3 text-center">Compartir comprobante</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => { setTabEnviar('whatsapp'); setShowEnviar(true); }}
                                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bc5b] text-white text-sm font-semibold transition-all duration-150 shadow-sm shadow-green-200 active:scale-95"
                                    >
                                        <Icon icon="mdi:whatsapp" className="text-xl" />
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={() => { setTabEnviar('email'); setShowEnviar(true); }}
                                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all duration-150 shadow-sm shadow-violet-200 active:scale-95"
                                    >
                                        <Icon icon="solar:letter-bold" className="text-xl" />
                                        Correo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Acciones secundarias */}
                        <div className="px-6 pt-3 pb-6 flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleOpenNewTab}
                                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <Icon icon="mingcute:print-line" className="text-base text-gray-500" />
                                    {comprobante === 'COTIZACIÓN' ? 'Imprimir' : 'Imprimir'}
                                </button>
                                <button
                                    onClick={goListInvoice}
                                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <Icon icon="solar:list-bold-duotone" className="text-base text-gray-500" />
                                    {comprobante === 'COTIZACIÓN' ? 'Ver lista' : 'Ver lista'}
                                </button>
                            </div>
                            <button
                                onClick={() => closeModal()}
                                className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors active:scale-95"
                            >
                                Nueva {comprobante?.toLowerCase()}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {showEnviar && comprobanteParaEnvio && (
                <ModalEnviarWhatsApp
                    isOpen={showEnviar}
                    onClose={() => setShowEnviar(false)}
                    defaultTab={tabEnviar}
                    comprobante={comprobanteParaEnvio}
                />
            )}
        </>
    );
};

export default ModalReponseInvoice;
