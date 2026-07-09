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
import { useDebounce } from "@/hooks/useDebounce";
import InputPro from "@/components/InputPro";
import ModalPagoParcial from "@/components/ModalPagoParcial";
import ComprobantePrintPage from "./comprobanteImprimir";
import { useReactToPrint } from "react-to-print";
import { usePaymentFlow, PaymentType } from "@/hooks/usePaymentFlow";
import ModalPaymentUnified from "@/components/ModalPaymentUnified";
import PaymentReceipt from "@/components/PaymentReceipt";
import ModalEnviarWhatsApp from "./ModalEnviarWhatsApp";
import Modal from "@/components/Modal";
import { useSedesStore } from "@/zustand/sedes";
import { useNavigate } from "react-router-dom";
import { useUsersStore } from "@/zustand/users";
import TableActionMenu from "@/components/TableActionMenu";
import { buildComprobantePrintPageStyle } from "@/utils/printStyles";
import ModalDetalleComprobante from "./ModalDetalleComprobante";
import { mapDetalleToInvoiceProduct } from "@/features/admin/facturacion/utils/comprobanteProductMapper";

const hasDespachoCompleto = (item: IInvoices) => {
    const despacho = item.envioDespacho;
    if (!despacho?.id) return false;
    const celular = String(despacho.celularDest ?? '').replace(/\D/g, '');
    return Boolean(
        despacho.transportista &&
        despacho.tipoEnvio &&
        (despacho.agenciaDestino || despacho.direccionDestino) &&
        celular.length >= 9 &&
        Number(despacho.nroPaquetes ?? 1) >= 1
    );
};

const ComprobantesInformales = () => {
    const navigate = useNavigate();
    const { auth, sedeActiva } = useAuthStore();
    const { sedes, listarSedes } = useSedesStore();
    const { usuarios, getAllUsers } = useUsersStore();
    const { getAllInvoices, totalInvoices, invoices, getInvoice, invoice, resetInvoice, cancelInvoice, discardInvoice, completePay }: IInvoicesState = useInvoiceStore();
    const { success } = useAlertStore();
    const paymentFlow = usePaymentFlow();

    const [currentPage, setcurrentPage] = useState(1);
    const [itemsPerPage, setitemsPerPage] = useState(50);
    const [searchClient, setSearchClient] = useState<string>("");
    const [formValues, setFormValues] = useState<any>({});
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
    const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);
    const [deletingInvoice, setDeletingInvoice] = useState(false);
    const [isOpenModalPagoParcial, setIsOpenModalPagoParcial] = useState(false);
    const [fechaInicio, setFechaInicio] = useState<string>(moment().startOf('month').format("YYYY-MM-DD"));
    const [fechaFin, setFechaFin] = useState<string>(moment().endOf('month').format("YYYY-MM-DD"));
    const [stateInvoice, setStateInvoice] = useState<string>("TODOS");
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
    const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | null>(null);
    const [isOpenModalWhatsApp, setIsOpenModalWhatsApp] = useState(false);
    const [comprobanteWhatsApp, setComprobanteWhatsApp] = useState<any>(null);
    const [modalDefaultTab, setModalDefaultTab] = useState<'whatsapp' | 'email'>('whatsapp');
    const [comprobante, setComprobante] = useState<string>("");
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedMenuRow, setSelectedMenuRow] = useState<any>(null);
    const [isOpenModalPdf, setIsOpenModalPdf] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string>("");
    const [pdfName, setPdfName] = useState<string>("comprobante.pdf");
    const [detalleComprobanteId, setDetalleComprobanteId] = useState<number | null>(null);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages = [];
    for (let i = 1; i <= Math.ceil(totalInvoices / itemsPerPage); i++) {
        pages.push(i);
    }

    const debounce = useDebounce(searchClient, 1000);

    const canFilterBySede = (auth?.rol === 'ADMIN_SISTEMA' || auth?.rol === 'ADMIN_EMPRESA') && Boolean(sedeActiva?.esPrincipal);
    const effectiveSedeId = canFilterBySede ? selectedSedeId : (sedeActiva?.id ?? null);
    const canFilterByUsuario = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA';


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
        if (canFilterByUsuario) {
            getAllUsers({ page: 1, limit: 200 });
        }
    }, [canFilterByUsuario, getAllUsers]);

    useEffect(() => {
        if (auth?.rol === 'ADMIN_SISTEMA' && sedeActiva?.esPrincipal && sedeActiva?.id) {
            setSelectedSedeId(sedeActiva.id);
        }
    }, [auth?.rol, sedeActiva?.id, sedeActiva?.esPrincipal]);

    useEffect(() => {
        if (!canFilterBySede) {
            setSelectedSedeId(null);
        }
    }, [canFilterBySede]);

    const productsTable = invoices?.map((item: IInvoices) => {
        const despachoCompleto = item.comprobante === 'NOTA DE VENTA' && hasDespachoCompleto(item);
        const despachoFecha = item.envioDespacho?.creadoEn
            ? moment(item.envioDespacho.creadoEn).format('YYYY-MM-DD')
            : moment(item.fechaEmision).format('YYYY-MM-DD');

        const rowBase: any = {
            id: item?.id,
            fechaEmisión: moment(item?.fechaEmision).format('DD/MM/YYYY HH:mm:ss'),
            sede: item?.sede?.nombre || '-',
            serie: item.serie,
            correlativo: item.correlativo,
            comprobante: item.comprobante,
            documentoAfiliado: item?.numDocAfectado || item.numeroOrdenTrabajo,
            document: item?.cliente?.nroDoc,
            client: item?.cliente?.nombre,
            vendedor: item?.usuario?.nombre || '-',
            s3PdfUrl: item?.s3PdfUrl,
            total: `S/ ${item.mtoImpVenta.toFixed(2)}`,
            saldo: `S/ ${item?.saldo?.toFixed(2) || (0).toFixed(2)}`,
            estado: ["BOLETA", "FACTURA", "NOTA DE CREDITO", "NOTA DE DEBITO"].includes(item.comprobante)
                ? item.estadoEnvioSunat
                : item.estadoPago,
            estadoEnvioSunat: item.estadoEnvioSunat,
            despachoCompleto,
            despachoFecha,
            _item: item,
        };

        const acciones = (
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setSelectedMenuRow({ ...rowBase, _item: item, despachoCompleto, despachoFecha }); }}
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

    useEffect(() => {
        resetInvoice();
        return () => {
            resetInvoice();
        };
    }, [])

    const [shouldPrint, setShouldPrint] = useState(false);

    const handleGetReceipt = async (data: any) => {
        console.log(data);
        setComprobante(data.comprobante);
        setShouldPrint(true);
        await getInvoice(data.id);
    };

    const handleCloseMenu = () => { setMenuAnchor(null); setSelectedMenuRow(null); };

    const handleAbrirModal = (data: any, tab: 'whatsapp' | 'email') => {
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
                clienteEmail: (comprobanteData as any).cliente?.email || '',
                pdfUrl: comprobanteData.s3PdfUrl || undefined,
            });
            setModalDefaultTab(tab);
            setIsOpenModalWhatsApp(true);
        }
    };

    const handleAnular = (data: any) => {
        setFormValues(data);
        setIsOpenModalConfirm(true);
    }

    // Eliminar (hard-delete): borra el comprobante y libera su correlativo,
    // a diferencia de "Anular" que lo deja en estado ANULADO ocupando el número.
    const handleEliminar = (data: any) => {
        setFormValues(data);
        setIsOpenModalDelete(true);
    }
    const confirmDeleteInvoice = async () => {
        if (deletingInvoice) return;
        setDeletingInvoice(true);
        try {
            await discardInvoice(formValues?.id);
        } finally {
            setDeletingInvoice(false);
            setIsOpenModalDelete(false);
        }
    }

    const handleCompletePay = async (data: any) => {
        setFormValues(data);
        const saldoPendiente = parseFloat(data?.saldo?.replace('S/ ', '') || '0');
        const totalComprobante = parseFloat(data?.total?.replace('S/ ', '') || '0');

        // Usar el hook para iniciar el pago
        await paymentFlow.initiatePayment('PAGO_PARCIAL', {
            id: data.id,
            serie: data.serie,
            correlativo: data.correlativo,
            cliente: { nombre: data.client },
            mtoImpVenta: totalComprobante,
            saldo: saldoPendiente
        }, saldoPendiente);

        setIsOpenModalPagoParcial(true);
    }

    const handleConfirmPago = async (monto: number, medioPago: string, observacion?: string, referencia?: string, cuentaBancariaId?: number) => {
        const payment = {
            tipo: 'PAGO_PARCIAL' as PaymentType,
            monto,
            medioPago: medioPago as any,
            observacion,
            referencia,
            cuentaBancariaId,
        };

        const comprobante = {
            id: formValues.id,
            serie: formValues.serie,
            correlativo: formValues.correlativo,
            cliente: { nombre: formValues.client },
            mtoImpVenta: parseFloat(formValues?.total?.replace('S/ ', '') || '0'),
            saldo: parseFloat(formValues?.saldo?.replace('S/ ', '') || '0')
        };

        // Usar el hook para procesar el pago
        const result = await paymentFlow.processPayment(
            payment,
            comprobante,
            async (comprobante: any, medioPago: string, monto: number, observacion?: string, referencia?: string, cbId?: number) => {
                const pagoData = {
                    ...formValues,
                    observacion: observacion || '',
                    referencia: referencia || '',
                    cuentaBancariaId: cbId ?? cuentaBancariaId,
                };
                return await completePay(pagoData, medioPago, monto);
            }
        );

        if (result.success) {
            setIsOpenModalPagoParcial(false);
            // El hook ya maneja el showReceipt automáticamente
        }
    }

    const handleCloseReceipt = () => {
        paymentFlow.closeReceipt();

        // Recargar tabla
        setTimeout(() => {
            getAllInvoices({
                tipoComprobante: "INFORMAL",
                page: currentPage,
                limit: itemsPerPage,
                search: debounce,
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estadoPago: stateInvoice !== "TODOS" ? stateInvoice : "",
                ...(canFilterByUsuario && selectedUsuarioId ? { usuarioId: selectedUsuarioId } : {}),
                ...(effectiveSedeId ? { sedeId: effectiveSedeId } : {})
            });
        }, 300);
    }

    useEffect(() => {
        const params: any = {
            tipoComprobante: "INFORMAL",
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            ...(canFilterByUsuario && selectedUsuarioId ? { usuarioId: selectedUsuarioId } : {}),
            ...(effectiveSedeId ? { sedeId: effectiveSedeId } : {}),
        };
        if (stateInvoice !== "TODOS") {
            params.estadoPago = stateInvoice;
        }
        getAllInvoices(params);
    }, [debounce, currentPage, itemsPerPage, fechaInicio, fechaFin, stateInvoice, effectiveSedeId, selectedUsuarioId, canFilterByUsuario]);

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

    const [printSize, setPrintSize] = useState('TICKET');

    const print = [
        { id: "TICKET", value: "TICKET" },
        { id: "A5", value: "A5" },
        { id: "A4", value: "A4" }
    ]

    const handleSelectPrint = (value: any) => {
        setPrintSize(value)
    }

    const [dimensions, setDimensions] = useState(() => {
        switch (printSize) {
            case 'TICKET': return { width: 80, height: 330 };
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
        pageStyle: buildComprobantePrintPageStyle(dimensions),
    });

    useEffect(() => {
        if (!shouldPrint || !invoice) return;

        const doPrint = () => {
            if (componentRef?.current) printFn();
            setShouldPrint(false);
            resetInvoice();
        };

        // Esperar a que la imagen del logo esté cargada antes de imprimir
        const logoImg = (componentRef.current as HTMLElement | null)?.querySelector('img[alt="logo"]') as HTMLImageElement | null;
        if (logoImg && !logoImg.complete) {
            const fallback = setTimeout(doPrint, 2500);
            logoImg.onload = () => { clearTimeout(fallback); doPrint(); };
            logoImg.onerror = () => { clearTimeout(fallback); doPrint(); };
            return () => { clearTimeout(fallback); logoImg.onload = null; logoImg.onerror = null; };
        }

        const timer = setTimeout(doPrint, 500);
        return () => clearTimeout(timer);
    }, [invoice, shouldPrint, resetInvoice]);

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

    const handleSelectUsuario = (event: ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setcurrentPage(1);
        setSelectedUsuarioId(value ? Number(value) : null);
    }

    const estadosInvoice = [{ id: 1, value: "TODOS" }, { id: 2, value: "COMPLETADO" }, { id: 3, value: "PENDIENTE_PAGO" }, { id: 4, value: "ANULADO" }]
    const sedesOptions = [
        { id: 0, value: 'Todas las sedes' },
        ...sedes.map((s: any) => ({ id: s.id, value: s.nombre }))
    ]
    const vendedoresOptions = usuarios.filter((u) => u.estado === 'ACTIVO');

    const confirmCancelInvoice = () => {
        cancelInvoice(formValues?.id)
        setIsOpenModalConfirm(false)
    }

    const handleChangeSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | any>) => {
        setSearchClient(e.target.value)
    }

    const activeFilterCount = [
        searchClient.trim(),
        fechaInicio,
        fechaFin,
        stateInvoice !== 'TODOS' ? stateInvoice : '',
        selectedSedeId,
        selectedUsuarioId,
    ].filter(Boolean).length;

    return (
        <div className="min-h-screen overflow-x-hidden bg-gray-50 px-3 pb-4 dark:bg-[#0A0D14] sm:px-2">
            <ComprobantePrintPage
                company={auth}
                componentRef={componentRef}
                formValues={{
                    ...invoice,
                    fechaVencimientoCredito: invoice?.fechaVencimientoCredito || invoice?.fechaVencimiento || (invoice?.cuotas?.length > 0 ? invoice.cuotas[0].fechaVencimiento : null)
                }}
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

            {/* Header */}
            <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">Notas de venta</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Historial de notas de pedido</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/administrador/facturacion/nuevo', { state: { defaultType: 'NV', defaultClient: 'CLIENTES_VARIOS' } })}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto sm:py-2"
                >
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nueva venta
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                {/* Filters Section */}
                <div className="border-b border-gray-100 p-4 dark:border-slate-800 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <Icon icon="solar:filter-bold-duotone" className="text-xl text-blue-600" />
                            <div className="min-w-0">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Filtros</h3>
                                <p className="truncate text-xs text-gray-400 md:hidden">
                                    {activeFilterCount} activos · {moment(fechaInicio).format('DD/MM')} - {moment(fechaFin).format('DD/MM')}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMobileFiltersOpen((value) => !value)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-lg shadow-blue-500/20 md:hidden"
                        >
                            {isMobileFiltersOpen ? 'Ocultar' : 'Ver filtros'}
                            <Icon icon={isMobileFiltersOpen ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} className="text-base" />
                        </button>
                    </div>
                    <div className={`${isMobileFiltersOpen ? 'grid' : 'hidden'} grid-cols-1 gap-4 md:grid md:grid-cols-2 lg:grid-cols-6`}>
                        <div className="">
                            <InputPro name="" onChange={handleChangeSearch} isLabel label="Buscar serie, cliente, correlativo" />
                        </div>
                        <div>
                            <Calendar text="Fecha inicio" name="fechaInicio" onChange={handleDate} className="admin-date-filter" portal />
                        </div>
                        <div>
                            <Calendar text="Fecha Fin" name="fechaFin" onChange={handleDate} className="admin-date-filter" portal />
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
                        {canFilterByUsuario && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Vendedor</label>
                                <select
                                    value={selectedUsuarioId ?? ''}
                                    onChange={handleSelectUsuario}
                                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">Todos los vendedores</option>
                                    {vendedoresOptions.map((usuario) => (
                                        <option key={usuario.id} value={usuario.id}>{usuario.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="">
                            <Select onChange={handleSelectPrint} label="Formato impresión" name="" defaultValue={printSize} options={print} error="" />
                        </div>
                    </div>

                </div>

                {/* Table Content */}
                <div className="p-3 sm:p-4">
                    {productsTable?.length > 0 ? (
                        <>
                            <div className="space-y-3 md:hidden">
                                {productsTable.map((row: any) => (
                                    <article key={row.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0F172A]">
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{row.sede}</p>
                                                <h3 className="mt-1 truncate text-base font-black text-gray-900 dark:text-white">
                                                    {row.comprobante} {row.serie}-{row.correlativo}
                                                </h3>
                                                <p className="text-xs font-semibold text-gray-500">{row.fechaEmisión}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setSelectedMenuRow(row); }}
                                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
                                            >
                                                <Icon icon="mdi:dots-vertical" width={20} height={20} />
                                            </button>
                                        </div>

                                        <div className="mb-3 rounded-2xl bg-gray-50 p-3 dark:bg-slate-900/60">
                                            <p className="truncate text-sm font-black uppercase text-gray-900 dark:text-white">{row.client || 'Cliente no registrado'}</p>
                                            <p className="text-xs text-gray-500">{row.document || '-'} · {row.vendedor || 'Sin vendedor'}</p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-3 dark:bg-slate-900/60">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400">Importe</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-white">{row.total}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400">Saldo</p>
                                                <p className="text-sm font-black text-amber-600 dark:text-amber-300">{row.saldo}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400">Estado</p>
                                                <p className="truncate text-sm font-black text-gray-900 dark:text-white">{row.estado || '-'}</p>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <div className="hidden overflow-x-auto md:block">
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
                                        'Vendedor',
                                        'Importe',
                                        'Saldo',
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

            {isOpenModalConfirm && <ModalConfirm confirmSubmit={confirmCancelInvoice} information="¿Estás seguro que deseas anular este comprobante?" isOpenModal setIsOpenModal={() => setIsOpenModalConfirm(false)} title="Anular comprobante" />}
            {isOpenModalDelete && <ModalConfirm confirmSubmit={confirmDeleteInvoice} confirmLoading={deletingInvoice} confirmText="Eliminar" information={`¿Eliminar la nota de venta ${formValues?.serie ?? ''}-${formValues?.correlativo ?? ''}? Se borrará de forma permanente y su correlativo quedará disponible para volver a usarse. Esta acción no se puede deshacer.`} isOpenModal setIsOpenModal={() => setIsOpenModalDelete(false)} title="Eliminar nota de venta" />}

            {(isOpenModalPagoParcial && paymentFlow.payment) && (
                <ModalPaymentUnified
                    isOpen={isOpenModalPagoParcial}
                    isLoading={paymentFlow.isLoading}
                    paymentType={paymentFlow.payment.tipo}
                    saldoPendiente={parseFloat(formValues?.saldo?.replace('S/ ', '') || '0')}
                    totalComprobante={parseFloat(formValues?.total?.replace('S/ ', '') || '0')}
                    comprobanteInfo={{
                        id: formValues.id,
                        serie: formValues.serie,
                        correlativo: formValues.correlativo,
                        cliente: formValues.client,
                        total: parseFloat(formValues?.total?.replace('S/ ', '') || '0')
                    }}
                    onConfirm={handleConfirmPago}
                    onCancel={() => {
                        setIsOpenModalPagoParcial(false);
                        paymentFlow.reset();
                    }}
                    error={paymentFlow.error || ''}
                />
            )}
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
                closeModal={() => setIsOpenModalPdf(false)}
                title="Vista previa del PDF"
                width="980px"
            >
                <div className="p-3 space-y-3">
                    <div className="flex justify-end">
                        <a
                            href={pdfUrl || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 text-xs rounded-md bg-[#6A6CFF] text-white hover:opacity-90"
                        >
                            Descargar
                        </a>
                    </div>
                    <div className="h-[80vh]">
                        {pdfUrl ? (
                            <iframe src={pdfUrl} className="w-full h-full rounded-lg border" />
                        ) : (
                            <div className="text-center text-gray-500 text-sm">No hay PDF disponible</div>
                        )}
                    </div>
                </div>
            </Modal>
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

            <ModalDetalleComprobante
                comprobanteId={detalleComprobanteId}
                isOpen={detalleComprobanteId !== null}
                onClose={() => setDetalleComprobanteId(null)}
            />

            {/* ── Dropdown de acciones (TableActionMenu) ── */}
            <TableActionMenu
                isOpen={Boolean(menuAnchor)}
                anchorEl={menuAnchor}
                onClose={handleCloseMenu}
                className="w-44"
            >
                {selectedMenuRow && (() => {
                    const row = selectedMenuRow;
                    const item: IInvoices = row._item;
                    return (
                        <>
                            <button type="button" onClick={() => { setDetalleComprobanteId(row.id); handleCloseMenu(); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium">
                                <Icon icon="solar:document-text-bold-duotone" width={16} height={16} />
                                <span>Ver detalle</span>
                            </button>
                            <button type="button" onClick={() => { handleGetReceipt(row); handleCloseMenu(); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                                <Icon icon="mingcute:print-line" width={16} height={16} />
                                <span>Imprimir</span>
                            </button>
                            <button type="button" disabled={!row.s3PdfUrl}
                                onClick={() => { if (row.s3PdfUrl) { setPdfUrl(row.s3PdfUrl); setPdfName(`${row.serie}-${String(row.correlativo || '').padStart(8, '0')}.pdf`); setIsOpenModalPdf(true); } handleCloseMenu(); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 ${row.s3PdfUrl ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 cursor-not-allowed'}`}>
                                <Icon icon="mdi:file-pdf-box" width={16} height={16} />
                                <span>Ver PDF</span>
                            </button>
                            <button type="button" onClick={() => { handleAbrirModal(row, 'email'); handleCloseMenu(); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                                <Icon icon="solar:letter-bold" width={16} height={16} />
                                <span>Enviar Email</span>
                            </button>
                            <button type="button" onClick={() => { handleAbrirModal(row, 'whatsapp'); handleCloseMenu(); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30">
                                <Icon icon="mdi:whatsapp" width={16} height={16} />
                                <span>Enviar WhatsApp</span>
                            </button>
                            {row.despachoCompleto && (
                                <button type="button" onClick={() => { navigate(`/administrador/ventas?fecha=${row.despachoFecha}&comprobanteId=${row.id}`); handleCloseMenu(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/30">
                                    <Icon icon="solar:delivery-bold-duotone" width={16} height={16} />
                                    <span>Ver despacho</span>
                                </button>
                            )}
                            <>
                                <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                                {row.estadoEnvioSunat !== 'ANULADO' && (
                                    <button type="button" onClick={() => { handleAnular(row); handleCloseMenu(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                                        <Icon icon="mdi:cancel" width={16} height={16} />
                                        <span>Anular</span>
                                    </button>
                                )}
                                <button type="button" onClick={() => { handleEliminar(row); handleCloseMenu(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                                    <Icon icon="solar:trash-bin-trash-bold" width={16} height={16} />
                                    <span>Eliminar</span>
                                </button>
                            </>
                            {item?.comprobante === 'NOTA DE VENTA' && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                                    <button type="button" onClick={() => {
                                        const esRuc = item.cliente?.nroDoc?.length === 11;
                                        navigate('/administrador/facturacion/nuevo', { state: { defaultType: 'FACTURA', fromNotaDeVenta: true, notaDeVentaData: { origenComprobanteId: item.id, cliente: esRuc ? item.cliente : null, clienteId: esRuc ? item.clienteId : null, observaciones: item.observaciones, productos: (item.detalles || []).map(mapDetalleToInvoiceProduct) } } });
                                        handleCloseMenu();
                                    }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30">
                                        <Icon icon="mdi:file-document-edit-outline" width={16} height={16} />
                                        <span>Convertir a Factura</span>
                                    </button>
                                    <button type="button" onClick={() => {
                                        navigate('/administrador/facturacion/nuevo', { state: { defaultType: 'BOLETA', fromNotaDeVenta: true, notaDeVentaData: { origenComprobanteId: item.id, cliente: item.cliente, clienteId: item.clienteId, observaciones: item.observaciones, productos: (item.detalles || []).map(mapDetalleToInvoiceProduct) } } });
                                        handleCloseMenu();
                                    }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30">
                                        <Icon icon="mdi:receipt-outline" width={16} height={16} />
                                        <span>Hacer Boleta</span>
                                    </button>
                                </>
                            )}
                        </>
                    );
                })()}
            </TableActionMenu>
        </div>
    );

};

export default ComprobantesInformales;
