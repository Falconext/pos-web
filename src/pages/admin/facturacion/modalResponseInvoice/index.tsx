
import Modal from "react-modal";
import { IInvoicesState, useInvoiceStore } from "@/zustand/invoices";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import Button from "@/components/Button";
import { detectPlatform } from "@/utils/platformDetector";



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
    // Datos adicionales para impresión térmica
    company?: any
    productsInvoice?: any[]
    formValues?: any
    observation?: string
    isPendiente?: boolean
}

const ModalReponseInvoice = ({ isLoading, dataReceipt, auth, client, comprobante, closeModal, handleOpenNewTab, company, productsInvoice, formValues, observation, isPendiente }: IProps) => {

    console.log(company)
    console.log(productsInvoice)
    console.log(formValues)

    const { resetInvoice, resetProductInvoice }: IInvoicesState = useInvoiceStore();
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const customStyles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            width: isMobile ? '92vw' : '480px',
            maxWidth: '520px',
            maxHeight: '96vh',
            border: 'none',
            backgroundColor: '#fff',
            borderRadius: '24px',
            marginRight: '-50%',
            padding: '0px',
            overflow: 'hidden',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
        },
        overlay: {
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        },
    };

    const goListInvoice = () => {
        resetInvoice();
        resetProductInvoice();
        if (['BOLETA', 'FACTURA', 'NOTA DE CREDITO', 'NOTA DE DEBITO'].includes(comprobante)) {
            navigate('/administrador/facturacion/comprobantes')
        } else if (comprobante === 'COTIZACIÓN') {
            navigate('/administrador/cotizaciones')
        } else {
            navigate('/administrador/facturacion/comprobantes-informales')
        }
    }

    return (
        <Modal ariaHideApp={false} isOpen style={customStyles}>
            <div className="p-6 sm:p-8 text-center flex flex-col items-center gap-5">

                {
                    isLoading === false ? (
                        <>
                            <div className="space-y-4 w-full">
                                <div className="space-y-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Comprobante</p>
                                    {isPendiente ? (
                                        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-amber-50 border-2 border-amber-200">
                                            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <img className="mx-auto w-24 h-24" src="/gif/suc.gif" width={120} height={120} alt="Success" />
                                    )}
                                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-balance">
                                        {isPendiente ? (
                                            <>
                                                El comprobante fue <strong>registrado correctamente</strong>.<br />
                                                <span className="text-amber-600 font-medium">SUNAT está temporalmente no disponible</span> — la confirmación llegará automáticamente en cuanto el servicio se restablezca.
                                            </>
                                        ) : (
                                            <>
                                                Hola, <strong>{auth.nombre}</strong>. La {comprobante.toLowerCase()} del cliente <strong>{client?.nombre}</strong>
                                                <span className="block">ha sido generada con éxito.</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className={`text-[28px] sm:text-[34px] font-semibold border border-dashed rounded-xl px-4 py-2 tracking-[0.2em] ${isPendiente ? 'text-amber-500 border-amber-300' : 'text-emerald-500 border-emerald-400'}`}>
                                        {dataReceipt?.serie}-{dataReceipt?.correlativo}
                                    </span>
                                    <p className="text-sm text-gray-500">
                                        {isPendiente ? 'Disponible en comprobantes — se confirmará solo.' : 'Disponible en tu historial de comprobantes.'}
                                    </p>
                                </div>
                            </div>
                            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                <Button
                                    color="black"
                                    outline
                                    onClick={goListInvoice}
                                    className="w-full rounded-2xl py-3 text-sm font-semibold"
                                >
                                    {comprobante === 'COTIZACIÓN' ? 'Lista de cotizaciones' : 'Lista de comprobantes'}
                                </Button>
                                <Button
                                    color="primary"
                                    outline
                                    onClick={handleOpenNewTab}
                                    className="w-full rounded-2xl py-3 text-sm font-semibold"
                                >
                                    {comprobante === 'COTIZACIÓN' ? 'Imprimir cotización' : 'Imprimir comprobante'}
                                </Button>
                                <Button
                                    color="secondary"
                                    outline
                                    onClick={() => closeModal()}
                                    className="w-full rounded-2xl py-3 text-sm font-semibold md:col-span-2"
                                >
                                    Nueva {comprobante.toLowerCase()}
                                </Button>
                            </div>
                        </>
                    ) :

                        <>
                            <img className="mx-auto w-40 h-40 object-contain" src="/gif/loading.gif" width={200} height={200} alt="Procesando" />
                            <p className="text-sm font-semibold text-gray-600 max-w-sm text-center">
                                Espere por favor, procesando su comprobante...
                            </p>
                        </>
                }
            </div>
        </Modal>
    )
}

export default ModalReponseInvoice;