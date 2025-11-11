
import { ChangeEvent, useEffect, useRef, useState } from "react";
import Input from "@/components/Input";
import DataTable from "@/components/Datatable";
import { Icon } from "@iconify/react/dist/iconify.js";
import Pagination from "@/components/Pagination";
import useAlertStore from "@/zustand/alert";
import TableSkeleton from "@/components/Skeletons/table";
import { IInvoicesState, useInvoiceStore } from "@/zustand/invoices";
import { IInvoices } from "@/interfaces/invoices";
import moment from "moment";
import PrintPDF from "./print";
import { pdf } from "@react-pdf/renderer";
import { numberToWords } from "@/utils/numberToLetters";
import { useAuthStore } from "@/zustand/auth";
import QRCode from 'qrcode'
import { Calendar } from "@/components/Date";
import Select from "@/components/Select";
import ModalConfirm from "@/components/ModalConfirm";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import InputPro from "@/components/InputPro";
import ComprobantePrintPage from "./comprobanteImprimir";
import { useReactToPrint } from "react-to-print";
import ModalEnviarWhatsApp from "./ModalEnviarWhatsApp";

const Comprobantes = () => {
    const navigate = useNavigate();
    const { auth } = useAuthStore();
    const { getAllInvoices, totalInvoices, invoices, getInvoice, invoice, resetInvoice, cancelInvoice, completePay }: IInvoicesState = useInvoiceStore();
    const { success } = useAlertStore();

    const [currentPage, setcurrentPage] = useState(1);
    const [itemsPerPage, setitemsPerPage] = useState(50);
    const [searchClient, setSearchClient] = useState<string>("");
    const [formValues, setFormValues] = useState<any>({});
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [comprobante, setComprobante] = useState<string>("");
    const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
    const [isOpenModalConfirmPayment, setIsOpenModalConfirmPayment] = useState(false)
    const [fechaInicio, setFechaInicio] = useState<string>(moment(new Date()).format("YYYY-MM-DD"));
    const [fechaFin, setFechaFin] = useState<string>(moment(new Date()).format("YYYY-MM-DD"));
    const [stateInvoice, setStateInvoice] = useState<string>("TODOS");
    const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");
    const [isOpenModalWhatsApp, setIsOpenModalWhatsApp] = useState(false);
    const [comprobanteWhatsApp, setComprobanteWhatsApp] = useState<any>(null);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages = [];
    for (let i = 1; i <= Math.ceil(totalInvoices / itemsPerPage); i++) {
        pages.push(i);
    }

    const debounce = useDebounce(searchClient, 1000);


    useEffect(() => {
        if (success === true) {
            setIsOpenModal(false);
            // setIsEdit(false);
        }
    }, [success]);

    console.log(invoices)


    const productsTable = invoices?.map((item: IInvoices) => ({
        id: item?.id,
        fechaEmisión: moment(item?.fechaEmision).format('DD/MM/YYYY HH:mm:ss'),
        serie: item.serie,
        correlativo: item.correlativo,
        comprobante: item.comprobante,
        documentoAfiliado: item?.numDocAfectado,
        document: item?.cliente?.nroDoc,
        client: item?.cliente?.nombre,
        total: `S/ ${item.mtoImpVenta.toFixed(2)}`,
        estado: ["BOLETA", "FACTURA", "NOTA DE CREDITO", "NOTA DE DEBITO"].includes(item.comprobante)
            ? item.estadoEnvioSunat
            : item.estadoPago,
        xmlSunat: item.sunatXml,
        cdrSunat: item.sunatCdrZip
    }));

    const handleInvoiceState = async (data: any) => {
        console.log(data);
        setFormValues(data);
        // setIsOpenModalConfirm(true);
    };

    const handleGetReceipt = async (data: any) => {
        console.log(data);
        setComprobante(data.comprobante);
        await getInvoice(data.id);
    };

    const handleEnviarWhatsApp = (data: any) => {
        const comprobanteData = invoices.find((inv: IInvoices) => inv.id === data.id);
        if (comprobanteData) {
            setComprobanteWhatsApp({
                id: comprobanteData.id,
                serie: comprobanteData.serie,
                correlativo: comprobanteData.correlativo,
                comprobante: comprobanteData.comprobante,
                total: comprobanteData.mtoImpVenta,
                clienteNombre: comprobanteData.cliente?.nombre || 'Cliente',
                clienteCelular: (comprobanteData as any).cliente?.telefono || '',
            });
            setIsOpenModalWhatsApp(true);
        }
    };

    const actions: any = [
        {
            onClick: handleGetReceipt,
            className: "edit",
            icon: <Icon color="#3BAED9" icon="mingcute:print-line" />,
            tooltip: "Imprimir"
        },
        {
            onClick: handleInvoiceState,
            className: "delete",
            icon: (row: any) => {
                switch (row.estado) {
                    case 'EMITIDO':
                        return <Icon icon="gg:check-o" color="#1CBC9C" />; // Aprobado
                    case 'RECHAZADO':
                        return <Icon icon="tabler:alert-circle" color="#f87171" />; // Rechazado
                    case 'PENDIENTE':
                        return <Icon icon="mdi:clock-outline" color="#facc15" />; // Pendiente
                    default:
                        return <Icon icon="ic:round-help-outline" color="#a1a1aa" />; // Desconocido
                }
            },
            tooltip: (row: any) => {
                switch (row.estado) {
                    case 'EMITIDO':
                        return 'Aprobado por SUNAT';
                    case 'RECHAZADO':
                        return 'Rechazado por SUNAT';
                    case 'PENDIENTE':
                        return 'En proceso';
                    case 'ANULADO':
                        return 'ANULADO por SUNAT';
                    default:
                        return 'Estado desconocido';
                }
            },
            condition: (row: any) => ["BOLETA", "FACTURA", "NOTA DE CREDITO", "NOTA DE DEBITO"].includes(row.comprobante)
        },
        {
            onClick: (row: any) => window.open(row.xmlSunat, '_blank'),
            className: "xml",
            icon: <Icon icon="hugeicons:xml-02" color="#6A6CFF" width="20" height="20" />, // púrpura
            tooltip: "Descargar XML",
            condition: (row: any) => !!row.xmlSunat
        },
        {
            onClick: (row: any) => window.open(row.cdrSunat, '_blank'),
            className: "cdr",
            icon: <Icon icon="mdi:zip-box-outline" color="#8B795F" />, // verde
            tooltip: "Descargar CDR",
            condition: (row: any) => !!row.cdrSunat
        },
        {
            onClick: handleEnviarWhatsApp,
            className: "whatsapp",
            icon: <Icon icon="mdi:whatsapp" color="#25D366" width="20" height="20" />,
            tooltip: "Enviar por WhatsApp",
            condition: (row: any) => row.estado === 'EMITIDO' || !["BOLETA", "FACTURA", "NOTA DE CREDITO", "NOTA DE DEBITO"].includes(row.comprobante)
        },
    ];

    console.log(actions)
    console.log(fechaFin)

    useEffect(() => {
        getAllInvoices({
            tipoComprobante: "FORMAL",
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            estado: stateInvoice === "TODOS" ? "" : stateInvoice
        });
    }, [debounce, currentPage, itemsPerPage, fechaInicio, fechaFin, stateInvoice]);

    const ruc = "204812192919";
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

    useEffect(() => {
        const generateQR = async () => {
            try {
                const dataUrl = await QRCode.toDataURL(ruc, {
                    width: 90,
                    margin: 1,
                    color: {
                        dark: '#000000', // Color oscuro del QR
                        light: '#ffffff', // Color claro (fondo)
                    },
                    errorCorrectionLevel: 'H', // Alta corrección de errores
                });
                setQrCodeDataUrl(dataUrl);
            } catch (err) {
                console.error("Error al generar el QR:", err);
            }
        };
        generateQR();
    }, []);

    const handleDate = (date: string, name: string) => {
        if (!moment(date, 'DD/MM/YYYY', true).isValid()) {
            console.error(`Fecha inválida: ${date} para ${name}`);
            return;
        }
        if (name === "fechaInicio") {
            setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        } else if (name === "fechaFin") {
            setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        }
    };

    const handleSelectState = (_id: string, value: string) => {
        setStateInvoice(value)
    }

    const estadosInvoice = [{ id: 1, value: "TODOS" }, { id: 2, value: "EMITIDO" }, { id: 3, value: "PENDIENTE" }, { id: 4, value: "ANULADO" }, { id: 5, value: "RECHAZADO" }]

    const confirmCancelInvoice = () => {
        cancelInvoice(formValues?.id)
        setIsOpenModalConfirm(false)
    }

    const confirmCompleteInvoice = () => {
        setIsOpenModalConfirmPayment(false)
        completePay(formValues, paymentMethod)

    }

    const handleChangeSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | any>) => {
        setSearchClient(e.target.value)
    }

    const [printSize, setPrintSize] = useState('TICKET');
    const [dimensions, setDimensions] = useState(() => {
        switch (printSize) {
            case 'TICKET': return { width: 80, height: 297 }; // 80mm width for ticket
            case 'A5': return { width: 148, height: 210 }; // A5 standard size
            case 'A4': return { width: 210, height: 297 }; // A4 standard size
            default: return { width: 210, height: 297 };
        }
    });

    useEffect(() => {
        console.log("hello")
        setDimensions(() => {
            switch (printSize) {
                case 'TICKET': return { width: 80, height: 297 };
                case 'A5': return { width: 148, height: 210 };
                case 'A4': return { width: 210, height: 297 };
                default: return { width: 210, height: 297 };
            }
        });

        console.log('Dimensions updated:', dimensions, 'for printSize:', printSize);
    }, [printSize]);

    const componentRef = useRef(null);
    const printFn = useReactToPrint({
        // @ts-ignore
        contentRef: componentRef,
        pageStyle: `@media print {
                @page {
                  size: ${dimensions.width}mm ${dimensions.height}mm;
                  margin: 0;
                  background-color: #fff;
                }
                body {
                  width: ${dimensions.width}mm;
                  height: ${dimensions.height}mm;
                  overflow: hidden;
                  background-color: #fff;
                }
                .p-5 {
                  width: 100%;
                  height: 100%;
                  box-sizing: border-box;
                  background-color: #fff;
                }
              }`,
    });

    useEffect(() => {
        if (invoice !== null) {
            setTimeout(() => {
                if (componentRef?.current) {
                    console.log("Componente imprimible encontrado, iniciando impresión");
                    printFn();
                } else {
                    console.error("No se encontró contenido imprimible, revisa el renderizado de InvoicePrint");
                }
            }, 500); // Aumenté el retraso a 200ms para dar más tiempo al renderizado
        }
    }, [invoice])

    const handleSelectPrint = (value: any) => {
        setPrintSize(value)
    }

    const print = [
        {
            id: 'TICKET',
            value: 'TICKET'
        },
        {
            id: 'A4',
            value: 'A4'
        },
        {
            id: 'A5',
            value: 'A5'
        },
    ]

    return (
        <div className="px-0 py-0 md:px-8 md:py-4">
            <ComprobantePrintPage
                company={auth}
                componentRef={componentRef}
                formValues={invoice}
                size={printSize}
                serie={invoice?.serie}
                correlative={invoice?.correlativo}
                productsInvoice={invoice?.detalles}
                total={Number(invoice?.mtoImpVenta).toFixed(2)}
                mode="off"

                qrCodeDataUrl={qrCodeDataUrl}
                discount={invoice?.discount}
                receipt={comprobante || invoice?.comprobante}
                selectedClient={invoice?.cliente}
                totalInWords={numberToWords(parseFloat(invoice?.mtoImpVenta)) + " SOLES"}
                observation={invoice?.observaciones}
            />
            <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-[#fff] rounded-lg">
                <div className="mb-5 pt-5 md:pt-0">
                    <div className="grid grid-cols-12 gap-3 justify-between items-center">
                        <div className="md:col-start-1 md:col-end-5 col-span-12">
                            <InputPro name="" onChange={handleChangeSearch} isLabel label="Buscar serie, cliente, correlativo" />
                        </div>
                        <div className="md:col-start-5 md:col-end-13 col-span-12 grid gap-3 relative">
                            <div className="md:col-start-1 md:col-end-3 col-span-12">
                                <Calendar text="Fecha inicio" name="fechaInicio" onChange={handleDate} />
                            </div>
                            <div className="md:col-start-3 md:col-end-5 col-span-12">
                                <Calendar text="Fecha Fin" name="fechaFin" onChange={handleDate} />
                            </div>
                            <div className="md:col-start-5 md:col-end-7 col-span-12">
                                <Select onChange={handleSelectState} label="Estado" name="" options={estadosInvoice} error="" />
                            </div>
                            <div className="md:col-start-7 md:col-end-10 col-span-12">
                                <Select onChange={handleSelectPrint} label="Ticket" name="" defaultValue={printSize} options={print} error="" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className='w-full'>

                    {
                        productsTable?.length > 0 ? (
                            <>
                                <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                                    <DataTable actions={actions} bodyData={productsTable}
                                        headerColumns={[
                                            'Fecha',
                                            'Serie',
                                            'Nro.',
                                            'Comprobante',
                                            'Doc. Afiliado',
                                            'Num doc',
                                            'Cliente',
                                            'Importe',
                                            'Estado'
                                        ]} />
                                </div>
                                <Pagination
                                    data={productsTable}
                                    optionSelect
                                    currentPage={currentPage}
                                    indexOfFirstItem={indexOfFirstItem}
                                    indexOfLastItem={indexOfLastItem}
                                    setcurrentPage={setcurrentPage}
                                    setitemsPerPage={setitemsPerPage}
                                    pages={pages}
                                    total={totalInvoices}
                                />
                            </>
                        ) :
                            <TableSkeleton />
                    }
                </div>
                {isOpenModalConfirm && <ModalConfirm confirmSubmit={confirmCancelInvoice} information="¿Estás seguro que deseas anular este comprobante?" isOpenModal setIsOpenModal={() => setIsOpenModalConfirm(false)} title="Anular comprobante" />}
                {isOpenModalConfirmPayment && <ModalConfirm confirmSubmit={confirmCompleteInvoice} information="¿Cuál de estos metodos de pago se completo el pago?" isOpenModal setIsOpenModal={() => setIsOpenModalConfirmPayment(false)} title="Completar pago">
                    <div className="grid grid-cols-3 gap-10 col-start-1 col-end-2 mb-5 mt-5">
                        {[
                            { key: 'Efectivo', src: 'https://img.freepik.com/vector-premium/efectivo-mano-logotipo-empresario-blanco_269543-105.jpg' },
                            { key: 'Yape', src: 'https://marketing-peru.beglobal.biz/wp-content/uploads/2025/01/logo-yape-bolivia.jpeg' },
                            { key: 'Plin', src: 'https://logosenvector.com/logo/img/plin-interbank-4391.png' },
                        ].map(({ key, src }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setPaymentMethod(key as any)}
                                className={`p-1 justify-center rounded-lg flex border-2 ${paymentMethod === key
                                    ? 'border-blue-500 bg-blue-100'
                                    : 'border-transparent hover:border-gray-300'
                                    }`}
                            >
                                <img src={src} alt={key} className="w-14 object-cover" />
                            </button>
                        ))}
                    </div>

                </ModalConfirm>}
                {isOpenModalWhatsApp && comprobanteWhatsApp && (
                    <ModalEnviarWhatsApp
                        isOpen={isOpenModalWhatsApp}
                        onClose={() => {
                            setIsOpenModalWhatsApp(false);
                            setComprobanteWhatsApp(null);
                        }}
                        comprobante={comprobanteWhatsApp}
                    />
                )}
            </div>
        </div>
    );
};

export default Comprobantes;