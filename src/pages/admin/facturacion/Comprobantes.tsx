
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
import { get, post } from "@/utils/fetch";
import ModalConfirm from "@/components/ModalConfirm";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import InputPro from "@/components/InputPro";
import ComprobantePrintPage from "./comprobanteImprimir";
import { useReactToPrint } from "react-to-print";
import ModalEnviarWhatsApp from "./ModalEnviarWhatsApp";
import { usePaymentFlow, PaymentType } from "@/hooks/usePaymentFlow";
import ModalPaymentUnified from "@/components/ModalPaymentUnified";
import PaymentReceipt from "@/components/PaymentReceipt";
import Modal from "@/components/Modal";
import TableActionMenu from "@/components/TableActionMenu";
import { useSedesStore } from "@/zustand/sedes";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const Comprobantes = () => {
    const navigate = useNavigate();
    const { auth, sedeActiva } = useAuthStore();
    const { sedes, listarSedes } = useSedesStore();
    const { getAllInvoices, totalInvoices, invoices, getInvoice, invoice, resetInvoice, cancelInvoice, completePay, discardInvoice }: IInvoicesState = useInvoiceStore();
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
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");
    const [isOpenModalWhatsApp, setIsOpenModalWhatsApp] = useState(false);
    const [comprobanteWhatsApp, setComprobanteWhatsApp] = useState<any>(null);
    const [modalDefaultTab, setModalDefaultTab] = useState<'whatsapp' | 'email'>('whatsapp');
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedMenuRow, setSelectedMenuRow] = useState<any>(null);
    const [isOpenModalConfirmDescartar, setIsOpenModalConfirmDescartar] = useState(false);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, row: any) => {
        setMenuAnchor(event.currentTarget);
        setSelectedMenuRow(row);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setSelectedMenuRow(null);
    };
    const paymentFlow = usePaymentFlow();
    const [isOpenModalPagoParcial, setIsOpenModalPagoParcial] = useState(false);
    const [isOpenModalPdf, setIsOpenModalPdf] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string>("");
    const [pdfName, setPdfName] = useState<string>("comprobante.pdf");
    const [pdfLoading, setPdfLoading] = useState(false);
    const [shouldPrint, setShouldPrint] = useState(false);

    const handleVerPdf = async (row: any) => {
        handleCloseMenu();
        const corr = String(row.correlativo || '').padStart(8, '0');
        setPdfName(`${row.serie}-${corr}.pdf`);
        setPdfUrl('');
        setIsOpenModalPdf(true);

        if (row.s3PdfUrl) {
            setPdfUrl(row.s3PdfUrl);
            return;
        }

        setPdfLoading(true);
        try {
            const res: any = await post(`comprobante/${row.id}/generar-pdf`, {});
            const url = res?.data?.pdfUrl || res?.pdfUrl;
            if (url) setPdfUrl(url);
        } catch {
            // silencioso — el modal muestra "No hay PDF disponible"
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadAsset = async (url?: string, fallbackName: string = 'archivo') => {
        if (!url) return;

        try {
            const isProtectedAsset = url.startsWith(API_URL);
            const headers: HeadersInit = {};
            if (isProtectedAsset) {
                const token = localStorage.getItem('ACCESS_TOKEN');
                if (token) headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error('No se pudo descargar el archivo');
            }

            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = fallbackName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (error: any) {
            useAlertStore.getState().alert(error.message || 'No se pudo descargar el archivo', 'error');
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages = [];
    for (let i = 1; i <= Math.ceil(totalInvoices / itemsPerPage); i++) {
        pages.push(i);
    }

    const debounce = useDebounce(searchClient, 1000);

    const canFilterBySede = (auth?.rol === 'ADMIN_SISTEMA' || auth?.rol === 'ADMIN_EMPRESA') && Boolean(sedeActiva?.esPrincipal);


    useEffect(() => {
        if (success === true) {
            setIsOpenModal(false);
            // setIsEdit(false);
        }
    }, [success]);

    useEffect(() => {
        if (canFilterBySede) {
            listarSedes();
        }
    }, [canFilterBySede, listarSedes]);

    useEffect(() => {
        if (auth?.rol === 'ADMIN_SISTEMA' && sedeActiva?.esPrincipal && sedeActiva?.id) {
            setSelectedSedeId(sedeActiva.id);
        }
    }, [auth?.rol, sedeActiva?.id, sedeActiva?.esPrincipal]);

    // Limpiar el comprobante cargado al entrar/salir de esta página
    useEffect(() => {
        resetInvoice();
        return () => {
            resetInvoice();
        };
    }, []);



    console.log(invoices)


    const productsTable = invoices?.map((item: IInvoices) => {
        const xmlDownloadUrl = item.s3XmlUrl || (item.sunatXml ? `${API_URL}/comprobante/${item.id}/xml` : '');
        const cdrDownloadUrl = item.s3CdrUrl || (item.sunatCdrZip ? `${API_URL}/comprobante/${item.id}/cdr` : '');
        const rowBase: any = {
            id: item?.id,
            fechaEmisión: moment(item?.fechaEmision).format('DD/MM/YYYY HH:mm:ss'),
            sede: item?.sede?.nombre || '-',
            serie: item.serie,
            correlativo: item.correlativo,
            comprobante: item.comprobante,
            documentoAfiliado: item?.numDocAfectado ? String(item?.numDocAfectado).toUpperCase() : "",
            document: item?.cliente?.nroDoc,
            s3PdfUrl: item?.s3PdfUrl,
            client: item?.cliente?.nombre,
            total: `S/ ${item.mtoImpVenta.toFixed(2)}`,
            estado: ["BOLETA", "FACTURA", "NOTA DE CREDITO", "NOTA DE DEBITO"].includes(item.comprobante)
                ? item.estadoEnvioSunat
                : item.estadoPago,
            xmlSunat: xmlDownloadUrl,
            cdrSunat: cdrDownloadUrl,
            xmlFileName: `${item.serie}-${String(item.correlativo).padStart(8, '0')}.xml`,
            cdrFileName: `${item.serie}-${String(item.correlativo).padStart(8, '0')}-CDR.xml`,
            estadoSunatRaw: (item as any).estadoSunatRaw,
            sunatRetriesCount: (item as any).sunatRetriesCount ?? 0,
            documentoId: (item as any).documentoId,
        };

        const canEmitirSunat = ["BOLETA", "FACTURA", "NOTA DE CREDITO", "NOTA DE DEBITO"].includes(rowBase.comprobante);

        const acciones = (
            <button
                type="button"
                onClick={(e) => handleOpenMenu(e, { ...rowBase, tipoDoc: item.tipoDoc, cotizIncluirImagenes: (item as any).cotizIncluirImagenes })}
                className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
                <Icon icon="mdi:dots-vertical" width={18} height={18} />
            </button>
        );

        return {
            ...rowBase,
            acciones,
        };
    });


    const handleGetReceipt = async (data: any) => {
        console.log(data);
        setComprobante(data.comprobante);
        setShouldPrint(true);
        await getInvoice(data.id);
    };

    const handleAbrirModal = async (data: any, tab: 'whatsapp' | 'email') => {
        try {
            const response: any = await get(`comprobante/${data.id}`);
            const freshComprobante = response.data || response;

            if (!freshComprobante || !freshComprobante.id) {
                throw new Error("Datos de comprobante inválidos");
            }

            const tipoDocMap: Record<string, string> = { '01': 'FACTURA', '03': 'BOLETA', '07': 'NOTA DE CREDITO', '08': 'NOTA DE DEBITO' };
            setComprobanteWhatsApp({
                id: freshComprobante.id,
                serie: freshComprobante.serie,
                correlativo: freshComprobante.correlativo,
                comprobante: freshComprobante.comprobante || tipoDocMap[freshComprobante.tipoDoc] || 'COMPROBANTE',
                total: Number(freshComprobante.mtoImpVenta || 0),
                clienteNombre: freshComprobante.cliente?.nombre || 'Cliente',
                clienteCelular: freshComprobante.cliente?.telefono || '',
                clienteEmail: freshComprobante.cliente?.email || '',
                pdfUrl: freshComprobante.s3PdfUrl,
            });
            setModalDefaultTab(tab);
            setIsOpenModalWhatsApp(true);
        } catch (error) {
            console.error('Error al cargar datos del comprobante:', error);
            useAlertStore.getState().alert('Error al cargar datos del comprobante', 'error');
        }
    };

    const handleConvertirAFactura = (data: any) => {
        const cotizacion = invoices.find((inv: IInvoices) => inv.id === data.id);
        if (!cotizacion) return;

        navigate('/administrador/facturacion/nuevo', {
            state: {
                fromQuotation: true,
                quotationData: {
                    cliente: cotizacion.cliente,
                    productos: cotizacion.detalles,
                    observaciones: cotizacion.observaciones,
                }
            }
        });
    };

    // Inicio de flujo de pago parcial (unificado)
    const handlePartialPayment = async (data: any) => {
        // Guardamos datos mínimos del row para el modal
        setFormValues(data);
        const comprobanteData = invoices.find((inv: IInvoices) => inv.id === data.id);
        if (!comprobanteData) return;
        const totalComprobante = comprobanteData.mtoImpVenta || 0;
        const saldoPendiente = (comprobanteData as any).saldo ?? totalComprobante; // si no hay saldo, asumir total

        await paymentFlow.initiatePayment('PAGO_PARCIAL', {
            id: comprobanteData.id,
            serie: comprobanteData.serie,
            correlativo: comprobanteData.correlativo,
            cliente: { nombre: comprobanteData.cliente?.nombre || 'Cliente' },
            mtoImpVenta: totalComprobante,
            saldo: saldoPendiente,
        }, saldoPendiente);
        setIsOpenModalPagoParcial(true);
    };

    const handleConfirmPago = async (monto: number, medioPago: string, observacion?: string, referencia?: string) => {
        const payment = {
            tipo: 'PAGO_PARCIAL' as PaymentType,
            monto,
            medioPago: medioPago as any,
            observacion,
            referencia,
        };

        // Tomamos datos del comprobante desde formValues (seleccionado del row)
        const pagoData: any = {
            id: formValues.id,
            serie: formValues.serie,
            correlativo: formValues.correlativo,
            client: formValues.client,
        };

        const result = await paymentFlow.processPayment(
            payment,
            {
                id: formValues.id,
                serie: formValues.serie,
                correlativo: formValues.correlativo,
                cliente: { nombre: formValues.client },
                mtoImpVenta: parseFloat((formValues?.total || '').toString().replace('S/ ', '') || '0'),
                saldo: parseFloat((formValues?.saldo || '').toString().replace('S/ ', '') || '0') || undefined,
            },
            async (_comprobante: any, _medioPago: string, _monto: number, _observacion?: string, _referencia?: string) => {
                // Reutiliza completePay del store (acepta monto opcional)
                return await completePay(pagoData, medioPago, monto);
            }
        );

        if (result.success) {
            setIsOpenModalPagoParcial(false);
            // refrescar tabla luego de cerrar recibo
            setTimeout(() => {
                getAllInvoices({
                    tipoComprobante: "FORMAL",
                    page: currentPage,
                    limit: itemsPerPage,
                    search: debounce,
                    fechaInicio: fechaInicio,
                    fechaFin: fechaFin,
                    estado: stateInvoice === "TODOS" ? "" : stateInvoice,
                    ...(selectedSedeId ? { sedeId: selectedSedeId } : {})
                });
            }, 300);
        }
    };

    const handleCloseReceipt = () => {
        paymentFlow.closeReceipt();
    };

    console.log(productsTable)
    console.log(fechaFin)

    useEffect(() => {
        getAllInvoices({
            tipoComprobante: "FORMAL",
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            estado: stateInvoice === "TODOS" ? "" : stateInvoice,
            ...(selectedSedeId ? { sedeId: selectedSedeId } : {})
        });
    }, [debounce, currentPage, itemsPerPage, fechaInicio, fechaFin, stateInvoice, selectedSedeId]);

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

    const handleSelectSede = (idValue: any) => {
        if (idValue === 0 || idValue === '0' || idValue === '' || idValue == null) {
            setSelectedSedeId(null);
            return;
        }
        setSelectedSedeId(Number(idValue));
    }

    const estadosInvoice = [{ id: 1, value: "TODOS" }, { id: 2, value: "EMITIDO" }, { id: 3, value: "PENDIENTE" }, { id: 4, value: "ANULADO" }, { id: 5, value: "RECHAZADO" }]
    const sedesOptions = [
        { id: 0, value: 'Todas las sedes' },
        ...sedes.map((s: any) => ({ id: s.id, value: s.nombre }))
    ]

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
                case 'TICKET': return { width: 80, height: 330 };
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
        pageStyle: `
              @import url('https://fonts.googleapis.com/css2?family=VT323&family=Inter:wght@400;500;600;700&display=swap');
              @media print {
                @page {
                  size: ${dimensions.width}mm ${dimensions.height}mm;
                  margin: 0;
                  background-color: #fff;
                }
                * {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  font-family: ${dimensions.width <= 80 ? "'VT323', Menlo, Monaco, Consolas, \"Courier New\", monospace" : "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"} !important;
                }
                body {
                  width: ${dimensions.width}mm;
                  height: ${dimensions.height}mm;
                  overflow: hidden;
                  background-color: #fff;
                  font-family: ${dimensions.width <= 80 ? "'VT323', Menlo, Monaco, Consolas, \"Courier New\", monospace" : "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"} !important;
                }
                .p-5 {
                  width: 100%;
                  height: 100%;
                  box-sizing: border-box;
                  background-color: #fff;
                }
              }
            `,
    });

    useEffect(() => {
        if (!shouldPrint || !invoice) return;

        const timer = setTimeout(() => {
            if (componentRef?.current) {
                console.log("Componente imprimible encontrado, iniciando impresión");
                printFn();
            } else {
                console.error("No se encontró contenido imprimible, revisa el renderizado de InvoicePrint");
            }
            setShouldPrint(false);
            resetInvoice();
        }, 500);

        return () => clearTimeout(timer);
    }, [invoice, shouldPrint, printFn, resetInvoice])

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
        <>
            <div className="hidden">
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
                // Parámetros de cotización guardados
                includeProductImages={invoice?.cotizIncluirImagenes || false}
                quotationDiscount={invoice?.cotizDescuento || 0}
                quotationValidity={invoice?.cotizVigencia || 7}
                quotationSignature={invoice?.cotizFirmante || ''}
                quotationTerms={invoice?.cotizTerminos || ''}
                quotationPaymentType={invoice?.cotizTipoPago || 'CONTADO'}
                quotationAdvance={invoice?.cotizAdelanto || 0}
            />
            </div>

            <div className="min-h-screen px-4 pb-6 bg-gray-50 dark:bg-[#0A0D14]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Icon icon="solar:bill-list-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                        Comprobantes Electrónicos
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Historial de boletas, facturas y notas de crédito</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/administrador/facturacion/nuevo', { state: { defaultType: 'FACTURA' } })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nuevo comprobante
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                {/* Filters Section */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Icon icon="solar:filter-bold-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
                        <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-xs">Filtros de búsqueda</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-25 lg:grid-cols-5 gap-4">

                        <div>
                            <Calendar text="Fecha inicio" name="fechaInicio" onChange={handleDate} />
                        </div>
                        <div>
                            <Calendar text="Fecha Fin" name="fechaFin" onChange={handleDate} />
                        </div>
                        <div>
                            <Select onChange={handleSelectState} label="Estado" name="" options={estadosInvoice} error="" />
                        </div>
                        {canFilterBySede && (
                            <div>
                                <Select
                                    onChange={handleSelectSede}
                                    label="Sede"
                                    name="sede"
                                    options={sedesOptions}
                                    defaultValue={selectedSedeId
                                        ? (sedes.find((s: any) => s.id === selectedSedeId)?.nombre || '')
                                        : 'Todas las sedes'}
                                    value={selectedSedeId
                                        ? (sedes.find((s: any) => s.id === selectedSedeId)?.nombre || '')
                                        : 'Todas las sedes'}
                                    error=""
                                />
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Select onChange={handleSelectPrint} label="Formato impresión" name="" defaultValue={printSize} options={print} error="" />
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
                                        'Sede',
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
                                    currentPage={currentPage}
                                    indexOfFirstItem={indexOfFirstItem}
                                    indexOfLastItem={indexOfLastItem}
                                    setcurrentPage={setcurrentPage}
                                    setitemsPerPage={setitemsPerPage}
                                    pages={pages}
                                    total={totalInvoices}
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

            {isOpenModalConfirmDescartar && (
                <ModalConfirm
                    confirmSubmit={async () => {
                        await discardInvoice(formValues?.id);
                        setIsOpenModalConfirmDescartar(false);
                    }}
                    information="¿Eliminar este comprobante? Se borrará permanentemente de la lista y se revertirá el stock. Esta acción no se puede deshacer."
                    isOpenModal
                    setIsOpenModal={() => setIsOpenModalConfirmDescartar(false)}
                    title="Eliminar comprobante"
                />
            )}
            {isOpenModalConfirm && <ModalConfirm confirmSubmit={confirmCancelInvoice} information={`¿Estás seguro que deseas anular este comprobante del cliente ${formValues?.client || 'Desconocido'} por un importe de ${formValues?.total || 'S/ 0.00'}?`} isOpenModal setIsOpenModal={() => setIsOpenModalConfirm(false)} title="Anular comprobante" />}
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
                    defaultTab={modalDefaultTab}
                    onClose={() => {
                        setIsOpenModalWhatsApp(false);
                        setComprobanteWhatsApp(null);
                    }}
                    comprobante={comprobanteWhatsApp}
                />
            )}
            <Modal
                isOpenModal={isOpenModalPdf}
                closeModal={() => { setIsOpenModalPdf(false); setPdfUrl(''); setPdfLoading(false); }}
                title="VISTA PREVIA DEL PDF"
                width="980px"
            >
                <div className="p-3 space-y-3">
                    <div className="flex justify-end">
                        {pdfUrl && (
                            <a
                                href={pdfUrl}
                                download={pdfName}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs rounded-md bg-[#6A6CFF] text-white hover:opacity-90"
                            >
                                Descargar
                            </a>
                        )}
                    </div>
                    <div className="h-[80vh] flex items-center justify-center">
                        {pdfLoading ? (
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <Icon icon="solar:refresh-bold" className="animate-spin text-violet-500" width={36} />
                                <span className="text-sm">Generando PDF...</span>
                            </div>
                        ) : pdfUrl ? (
                            <iframe src={pdfUrl} className="w-full h-full rounded-lg border" />
                        ) : (
                            <div className="text-center text-gray-500 text-sm">No hay PDF disponible</div>
                        )}
                    </div>
                </div>
            </Modal>
            {(isOpenModalPagoParcial && paymentFlow.payment) && (
                <ModalPaymentUnified
                    isOpen={isOpenModalPagoParcial}
                    isLoading={paymentFlow.isLoading}
                    paymentType={paymentFlow.payment.tipo}
                    saldoPendiente={parseFloat((formValues?.saldo || '').toString().replace('S/ ', '') || '0') || parseFloat((formValues?.total || '').toString().replace('S/ ', '') || '0')}
                    totalComprobante={parseFloat((formValues?.total || '').toString().replace('S/ ', '') || '0')}
                    comprobanteInfo={{
                        id: formValues.id,
                        serie: formValues.serie,
                        correlativo: formValues.correlativo,
                        cliente: formValues.client,
                        total: parseFloat((formValues?.total || '').toString().replace('S/ ', '') || '0')
                    }}
                    onConfirm={handleConfirmPago}
                    onCancel={() => {
                        setIsOpenModalPagoParcial(false);
                        paymentFlow.reset();
                    }}
                    error={paymentFlow.error || ''}
                />
            )}
            {paymentFlow.showReceipt && paymentFlow.receiptData && (
                <PaymentReceipt
                    comprobante={paymentFlow.receiptData.comprobante}
                    saldo={formValues?.saldo}
                    payment={paymentFlow.receiptData.payment}
                    numeroRecibo={paymentFlow.receiptData.numeroRecibo}
                    nuevoSaldo={paymentFlow.receiptData.nuevoSaldo}
                    detalles={paymentFlow.receiptData.detalles}
                    cliente={paymentFlow.receiptData.cliente}
                    pagosHistorial={paymentFlow.receiptData.pagosHistorial}
                    totalPagado={paymentFlow.receiptData.totalPagado}
                    company={auth}
                    onClose={handleCloseReceipt}
                />
            )}

            {/* Menu de Acciones Flotante con Portal */}
            <TableActionMenu
                isOpen={Boolean(menuAnchor)}
                anchorEl={menuAnchor}
                onClose={handleCloseMenu}
            >
                {selectedMenuRow && (() => {
                    const rowBase = selectedMenuRow;
                    const canEmitirSunat = ["BOLETA", "FACTURA", "NOTA DE CREDITO", "NOTA DE DEBITO"].includes(rowBase.comprobante);

                    return (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    handleGetReceipt(rowBase);
                                    handleCloseMenu();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                                <Icon icon="mingcute:print-line" width={16} height={16} />
                                <span>Imprimir</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleVerPdf(rowBase)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#6B7280] hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                            >
                                <Icon icon="mdi:file-pdf-box" width={16} height={16} />
                                <span>Ver PDF</span>
                            </button>

                            <button
                                type="button"
                                disabled={!rowBase.xmlSunat}
                                onClick={() => {
                                    if (rowBase.xmlSunat) {
                                        handleDownloadAsset(rowBase.xmlSunat, rowBase.xmlFileName);
                                    }
                                    handleCloseMenu();
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100 ${rowBase.xmlSunat ? 'text-[#6B7280]' : 'text-gray-400 cursor-not-allowed'}`}
                            >
                                <Icon icon="hugeicons:xml-02" width={16} height={16} />
                                <span>Descargar XML</span>
                            </button>

                            <button
                                type="button"
                                disabled={!rowBase.cdrSunat}
                                onClick={() => {
                                    if (rowBase.cdrSunat) {
                                        handleDownloadAsset(rowBase.cdrSunat, rowBase.cdrFileName);
                                    }
                                    handleCloseMenu();
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100 ${rowBase.cdrSunat ? 'text-[#6B7280]' : 'text-gray-400 cursor-not-allowed'}`}
                            >
                                <Icon icon="mdi:zip-box-outline" width={16} height={16} />
                                <span>Descargar CDR</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    handleAbrirModal(rowBase, 'email');
                                    handleCloseMenu();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#6B7280] hover:bg-gray-100"
                            >
                                <Icon icon="solar:letter-bold" width={16} height={16} />
                                <span>Enviar Email</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    handleAbrirModal(rowBase, 'whatsapp');
                                    handleCloseMenu();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-600 hover:bg-green-50"
                            >
                                <Icon icon="mdi:whatsapp" width={16} height={16} />
                                <span>Enviar WhatsApp</span>
                            </button>

                            {(rowBase.comprobante?.includes('COTIZACI') || rowBase.tipoDoc === 'COT') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleConvertirAFactura(rowBase);
                                        handleCloseMenu();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-t border-gray-100 dark:border-slate-800"
                                >
                                    <Icon icon="solar:document-add-bold-duotone" width={16} height={16} />
                                    <span className="font-medium">Convertir a Factura</span>
                                </button>
                            )}

                            {/* Dar de Baja - Solo para documentos informales (TICKET, OT, NV, etc.)
                                Las boletas/facturas SUNAT se anulan con Nota de Crédito */}
                            {!canEmitirSunat && (
                                <button
                                    type="button"
                                    disabled={rowBase.estado === 'ANULADO' || rowBase.estado === 'RECHAZADO' || rowBase.estado === 'PENDIENTE'}
                                    onClick={() => {
                                        if (rowBase.estado !== 'ANULADO' && rowBase.estado !== 'RECHAZADO' && rowBase.estado !== 'PENDIENTE') {
                                            setFormValues(rowBase);
                                            setIsOpenModalConfirm(true);
                                        }
                                        handleCloseMenu();
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-rose-50 dark:hover:bg-rose-900/10 border-t border-gray-100 dark:border-slate-800 ${rowBase.estado !== 'ANULADO' && rowBase.estado !== 'RECHAZADO' && rowBase.estado !== 'PENDIENTE' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 cursor-not-allowed'}`}
                                >
                                    <Icon icon="solar:close-circle-bold-duotone" width={16} height={16} />
                                    <span className="font-medium">Dar de Baja</span>
                                </button>
                            )}

                            {/* Emitir Nota de Crédito */}
                            <button
                                type="button"
                                disabled={!['FACTURA', 'BOLETA'].includes(rowBase.comprobante) || rowBase.estado === 'ANULADO' || rowBase.estado === 'RECHAZADO' || rowBase.estado === 'PENDIENTE'}
                                onClick={() => {
                                    if (['FACTURA', 'BOLETA'].includes(rowBase.comprobante) && rowBase.estado !== 'ANULADO' && rowBase.estado !== 'RECHAZADO' && rowBase.estado !== 'PENDIENTE') {
                                        navigate('/administrador/facturacion/nuevo', {
                                            state: {
                                                fromCreditNote: true,
                                                creditNoteData: {
                                                    comprobanteReemplazar: rowBase.comprobante,
                                                    serieReemplazar: rowBase.serie,
                                                    correlativoReemplazar: rowBase.correlativo
                                                }
                                            }
                                        });
                                    }
                                    handleCloseMenu();
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-amber-50 dark:hover:bg-amber-900/10 border-t border-gray-100 dark:border-slate-800 ${['FACTURA', 'BOLETA'].includes(rowBase.comprobante) && rowBase.estado !== 'ANULADO' && rowBase.estado !== 'RECHAZADO' && rowBase.estado !== 'PENDIENTE' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 cursor-not-allowed'}`}
                            >
                                <Icon icon="solar:document-medicine-bold-duotone" width={16} height={16} />
                                <span className="font-medium">Generar NC (Anular)</span>
                            </button>

                            {/* Eliminar comprobante atascado */}
                            {canEmitirSunat &&
                                rowBase.estadoSunatRaw !== 'EMITIDO' &&
                                rowBase.estadoSunatRaw !== 'ANULADO' &&
                                rowBase.estadoSunatRaw !== 'NO_APLICA' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormValues(rowBase);
                                        setIsOpenModalConfirmDescartar(true);
                                        handleCloseMenu();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/10 border-t border-gray-100 dark:border-slate-800 text-red-600 dark:text-red-400"
                                >
                                    <Icon icon="solar:trash-bin-trash-bold-duotone" width={16} height={16} />
                                    <span className="font-medium">Eliminar comprobante</span>
                                </button>
                            )}
                        </>
                    );
                })()}
            </TableActionMenu>
            </div>
        </>
    );

};

export default Comprobantes;
