import { ChangeEvent, useEffect, useRef, useState } from "react";
import Select from "@/components/Select";
import { IInvoicesState, useInvoiceStore } from "@/zustand/invoices";
import { IExtentionsState, useExtentionsStore } from "@/zustand/extentions";
import { IClientsState, useClientsStore } from "@/zustand/clients";
import { IProductsState, useProductsStore } from "@/zustand/products";
import { ICategoriesState, useCategoriesStore } from "@/zustand/categories";
import { Icon } from "@iconify/react";
import QRCode from 'qrcode';
import { IFormInvoice } from "@/interfaces/invoices";
import { numberToWords } from "@/utils/numberToLetters";
import { calculateTotals } from "@/utils/calculateTotals";
import useAlertStore from "@/zustand/alert";
import { useAuthStore } from "@/zustand/auth";
import { IFormClient } from "@/interfaces/clients";
import { IFormProduct } from "@/interfaces/products";
import { formatISO, parse } from 'date-fns'
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDebounce } from "@/hooks/useDebounce";
import ModalReponseInvoice from "./modalResponseInvoice";
import ModalProduct from "../inventario/modal-productos";
import ModalClient from "../clientes/ModalCliente";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import ComprobantePrintPage from "./comprobanteImprimir";
import Pagination from "@/components/Pagination";
import ModalEditLineItem from "./ModalEditLineItem";
import InputPro from "@/components/InputPro";
import Button from "@/components/Button";

const Invoice = () => {

    const { receipt, importReference, addInformalInvoice, addProductsInvoice, updateProductInvoice, productsInvoice, getInvoiceBySerieCorrelative, resetProductInvoice, invoiceData, deleteProductInvoice, addInvoice, dataReceipt, resetInvoice, getSerieAndCorrelativeByReceipt }: IInvoicesState = useInvoiceStore();

    // ... (imports and other setup)

    // Helper to calculate line items
    const calculateLineItem = (item: any, newQuantity: number) => {
        const price = Number(item.precioUnitario);
        const subtotal = price * newQuantity;
        return {
            cantidad: newQuantity,
            cantidadOriginal: newQuantity, // Assuming stock check handled elsewhere or strictly UI
            total: subtotal.toFixed(2),
            sale: (subtotal / 1.18).toFixed(2),
            igv: (subtotal - (subtotal / 1.18)).toFixed(2)
        };
    };

    const handleProductClick = (product: any) => {
        // Check if product exists
        const existingIndex = productsInvoice.findIndex((p: any) => p.id === product.id);

        if (existingIndex >= 0) {
            const currentItem = productsInvoice[existingIndex];
            const newQty = Number(currentItem.cantidad) + 1;
            // Check stock
            if (product.stock < newQty) {
                return useAlertStore.getState().alert("Stock insuficiente", "warning");
            }
            updateProductInvoice(existingIndex, calculateLineItem(currentItem, newQty));
        } else {
            if (product.stock < 1) {
                return useAlertStore.getState().alert("Sin stock", "warning");
            }
            addProductsInvoice({
                ...product,
                unidadMedida: product?.unidadMedida?.nombre
            });
        }
    }

    // ... inside Cart Items Map
    /*
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button 
                onClick={() => {
                    if(item.cantidad > 1) {
                        const index = productsInvoice.indexOf(item); // Simple ref find
                        updateProductInvoice(index, calculateLineItem(item, Number(item.cantidad) - 1));
                    } else {
                        deleteProductInvoice(item)
                    }
                }}
                className="..."
            >
                <Icon icon="solar:minus-circle-linear" />
            </button>
            <span className="w-8 text-center font-bold text-sm">{item.cantidad}</span>
            <button 
                onClick={() => {
                     const index = productsInvoice.indexOf(item);
                     const newQty = Number(item.cantidad) + 1;
                     if(item.stock < newQty) return useAlertStore.getState().alert("Max stock alcanzado", "warning");
                     updateProductInvoice(index, calculateLineItem(item, newQty));
                }}
                className="..."
            >
                <Icon icon="solar:add-circle-linear" />
            </button>
        </div>
    */
    const { auth } = useAuthStore();
    const { categories, getAllCategories }: ICategoriesState = useCategoriesStore();
    const tiposInformales = ['TICKET', 'NV', 'RH', 'CP', 'NP', 'OT'];
    let tipoEmpresa = auth?.empresa?.tipoEmpresa || "";

    // POS STATES
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");

    const initialDocumentType = receipt === ""
        ? (tipoEmpresa === "INFORMAL" ? "TICKET" : "FACTURA")
        : receipt.toUpperCase();

    const metodosContado = ['Efectivo', 'Yape', 'Plin'];
    const metodosCredito = ['Transferencia', 'Tarjeta'];

    const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo')
    const [adelanto, setAdelanto] = useState<number>(0);
    const [fechaRecojo, setFechaRecojo] = useState<string>('');
    const [adelantoError, _setAdelantoError] = useState<string>('');

    const initFormValues: IFormInvoice = {
        clienteId: 0,
        currencyCode: "PEN",
        clienteNombre: "",
        comprobante: initialDocumentType,
        tipoDoc: tipoEmpresa === "INFORMAL" && initialDocumentType === "TICKET" ? "TICKET" : initialDocumentType === "NOTA DE CREDITO" ? "07" : initialDocumentType === "NOTA DE DEBITO" ? "08" : initialDocumentType === "BOLETA" ? "03" : "01",
        detalles: [],
        discount: 0,
        motivo: "",
        relatedInvoiceId: "",
        vuelto: 0,
        tipDocAfectado: "",
        motivoId: 0,
        medioPago: "",
        numDocAfectado: "",
        observaciones: ""
    }

    const initialFormClient: IFormClient = {
        id: 0,
        nombre: "",
        nroDoc: "",
        direccion: "",
        departamento: "",
        distrito: "",
        provincia: "",
        persona: "CLIENTE",
        ubigeo: "",
        email: "",
        telefono: "",
        tipoDoc: "",
        estado: "",
        tipoDocumentoId: 0,
        empresaId: 0,
        tipoDocumento: { codigo: "", descripcion: "", id: 0 }
    }

    const initialFormProduct: IFormProduct = {
        productoId: 0,
        descripcion: "",
        categoriaId: 0,
        precioUnitario: 0,
        categoriaNombre: "",
        afectacionNombre: "Gravado – Operación Onerosa",
        tipoAfectacionIGV: "10",
        stock: 50,
        codigo: "",
        unidadMedidaId: 1,
        unidadMedidaNombre: "UNIDAD",
        estado: ""
    }

    const [formValuesProduct, setFormValuesProduct] = useState<IFormProduct>(initialFormProduct);
    const [formValuesClient, setFormValuesClient] = useState<IFormClient>(initialFormClient);
    const [formValues, setFormValues] = useState<IFormInvoice>(initFormValues);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { getAllClients, clients }: IClientsState = useClientsStore();

    const { getAllProducts, products, totalProducts }: IProductsState = useProductsStore();
    const [selectedProduct, setSelectProduct] = useState<any>(null);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const { getCreditDebitNoteTypes, getCurrencies, creditDebitNoteTypes, getDocumentTypes }: IExtentionsState = useExtentionsStore();
    const [receiptNoteId, setReceiptNoteId] = useState<string>("01")
    const [pay, setPay] = useState<number>(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_change, setChange] = useState<number>(0);
    const [receiptNote, setReceiptNote] = useState<string>("FACTURA")
    const [serie, setSerie] = useState<string>("");
    const [IsOpenModalSuccessInvoice, setIsOpenModalSuccessInvoice] = useState<boolean>(false);
    const [correlative, setCorrelative] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [descountGlobal, _setDescountGlobal] = useState<number>(0)
    const [errors, setErrors] = useState({ observaciones: "" });

    const [errorsProduct, setErrorsProduct] = useState({
        codigo: "", descripcion: "", categoriaId: 0, description: "", precioUnitario: "", stock: "", unidadMedida: ""
    });

    const [errorsClient, setErrorsClient] = useState({
        nombre: "", nroDoc: "", direccion: "", departamento: "", distrito: "", provincia: "", ubigeo: "", email: "", telefono: "", estado: "", tipoDocumentoId: 0, empresaId: 0,
    });

    const isMobile = useIsMobile();
    const [isOpenModalClient, setIsOpenModalClient] = useState<boolean>(false);
    const [isOpenModalProduct, setIsOpenModalProduct] = useState<boolean>(false);
    const [editingIndex, setEditingIndex] = useState<number>(-1);

    const handleSaveEdit = (newItem: any) => {
        if (editingIndex === -1) return;
        const price = Number(newItem.precioUnitario);
        const qty = Number(newItem.cantidad);
        const subtotal = price * qty;

        const updated = {
            ...newItem,
            total: subtotal.toFixed(2),
            sale: (subtotal / 1.18).toFixed(2),
            igv: (subtotal - (subtotal / 1.18)).toFixed(2)
        };
        updateProductInvoice(editingIndex, updated);
        setEditingIndex(-1);
    };

    const debounceSerie = useDebounce(serie, 200);
    const debounceCorrelative = useDebounce(correlative, 200);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Pagination calculations
    const totalPages = Math.ceil((totalProducts || 0) / limit);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    const indexOfLastItem = page * limit;
    const indexOfFirstItem = indexOfLastItem - limit;

    // Reset page logic
    useEffect(() => { setPage(1) }, [selectedCategoryId, debouncedSearchTerm]);

    // Server Fetch Logic
    useEffect(() => {
        const params: any = { page, limit };
        if (debouncedSearchTerm) params.search = debouncedSearchTerm;
        if (selectedCategoryId !== 0) params.categoriaId = selectedCategoryId;

        getAllProducts(params, () => { }, true);
    }, [page, limit, debouncedSearchTerm, selectedCategoryId]);

    // Initial Data Fetching for POS
    useEffect(() => {
        getAllCategories({});
        // getAllProducts logic moved to dedicated effect
        getCreditDebitNoteTypes();
        getCurrencies();
        getDocumentTypes();

        if (receipt === undefined) {
            resetInvoice();
        }
    }, [])

    // Filter Products logic (Pass through)
    const filteredProducts = products;

    // ... (unchanged)

    useEffect(() => {
        if (["NOTA DE CREDITO", "NOTA DE DEBITO"].includes(formValues?.comprobante)) {
            getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc, receiptNoteId);
        } else {
            // removed resetInvoice() to prevent clearing cart and catalog
            setSerie("");
            setCorrelative("");
            getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc);

            // Auto-set client for BOLETA
            if (formValues?.comprobante === "BOLETA") {
                const clientSelect: any = clients?.find((item: any) => "10000000" === item.nroDoc);
                if (clientSelect) {
                    setSelectedClient(clientSelect)
                    setFormValues(prev => ({ ...prev, clienteNombre: "CLIENTES VARIOS" }))
                } else {
                    setSelectedClient({ nroDoc: "10000000", nombre: "CLIENTES VARIOS" })
                    setFormValues(prev => ({ ...prev, clienteNombre: "CLIENTES VARIOS" }))
                }
            } else if (formValues?.comprobante === "FACTURA") {
                // Clear client for Factura
                setFormValues(prev => ({ ...prev, clienteNombre: "" }))
                setSelectedClient(null);
            }
        }
    }, [formValues.comprobante, receiptNoteId]);

    const tiposComprobanteFormales = [
        { id: "01", value: "FACTURA" }, { id: "03", value: "BOLETA" }, { id: "07", value: "NOTA DE CREDITO" },
        { id: "08", value: "NOTA DE DEBITO" }, { id: "TICKET", value: "TICKET" }, { id: "OT", value: "ORDEN DE TRABAJO" },
        { id: "NV", value: "NOTA DE VENTA" }, { id: "NP", value: "NOTA DE PEDIDO" }, { id: "CP", value: "COMPROBANTE DE PAGO" },
        { id: "RH", value: "RECIBO POR HONORARIO" }
    ]

    const tiposComprobantesInformales = [
        { id: "TICKET", value: "TICKET" }, { id: "OT", value: "ORDEN DE TRABAJO" }, { id: "NV", value: "NOTA DE VENTA" },
        { id: "NP", value: "NOTA DE PEDIDO" }, { id: "CP", value: "COMPROBANTE DE PAGO" }, { id: "RH", value: "RECIBO POR HONORARIO" },
    ]

    let comprobantesGenerar = tipoEmpresa === "INFORMAL" ? tiposComprobantesInformales : tipoEmpresa === "FORMAL" ? tiposComprobanteFormales : tiposComprobanteFormales.concat(tiposComprobantesInformales)

    // Default moneda
    useEffect(() => {
        if (!formValues.currencyCode) setFormValues({ ...formValues, currencyCode: "PEN" })
    }, [])

    const validateForm = () => {
        const newErrors: any = {
            observaciones: formValues.motivoId === 2 ? (formValues.observaciones.trim() !== "" ? "" : "Escriba la observación") : "",
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error);
    };

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const _handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormValues({ ...formValues, [e?.target?.name]: e?.target?.value })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const navigate = useNavigate();
    const [printSize, setPrintSize] = useState("TICKET");

    const handleChangeSelect = (idValue: any, value: any, name: any, id: any) => {
        const clientSelect = clients?.find((item: any) => value.split("-")[0] === item.nroDoc);
        if (clientSelect !== undefined) {
            setSelectedClient(clientSelect);
        }
        const motivo: any = typesOperation.find((item: any) => Number(item.id) === Number(idValue));
        const updatedFormValues = {
            ...formValues,
            [name]: value,
            [id]: idValue,
            motivoId: motivo?.id
        };
        setFormValues(updatedFormValues);
    };

    // Effect for adding product from search (Legacy/Modal support) or direct click
    useEffect(() => {
        if (selectedProduct !== null && selectedProduct !== undefined) {
            addProductsInvoice({
                ...selectedProduct,
                unidadMedida: selectedProduct?.unidadMedida?.nombre
            })
            setSelectProduct(null); // Reset selection immediately
        }
    }, [selectedProduct]);

    const handleGetDataClient = (query: string, callback: Function) => {
        if (query.length > 2) {
            getAllClients({ search: query }, callback, true)
        }
    };

    const handleDeleteProduct = (row: any) => {
        deleteProductInvoice(row);
    };

    const { total, discount: productDiscount, hasDiscount } = calculateTotals(productsInvoice);
    const isDiscountGlobalApplicable = formValues.motivoId === 6;
    const totalOriginal = Number(total);
    const totalAdjusted = isDiscountGlobalApplicable ? Math.max(totalOriginal - descountGlobal, 0) : totalOriginal;
    const igvRate = 0.18;
    const opGravadaAdjusted = totalAdjusted / (1 + igvRate);
    const igvAdjusted = totalAdjusted - opGravadaAdjusted;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const importeReferencial = totalOriginal;
    const finalDiscount = isDiscountGlobalApplicable ? Number(productDiscount) + descountGlobal : Number(productDiscount);

    const totalDescount = productsInvoice.length > 0 && formValues.motivoId === 4 && productsInvoice
        ?.map((d: any) => d?.precioUnitario)
        ?.reduce((sum: any, x: any) => sum + x);

    const totalInteres = productsInvoice.length > 0 && (formValues.motivoId === 8 || formValues.motivoId === 10) && productsInvoice
        ?.map((d: any) => d?.precioUnitario)
        ?.reduce((sum: any, x: any) => sum + x);

    const totalInWords = numberToWords(parseFloat(totalAdjusted.toFixed(2))) + " SOLES";

    useEffect(() => {
        setFormValues((prev) => ({
            ...prev,
            vuelto: totalAdjusted <= pay ? Number(Math.abs(totalAdjusted - pay).toFixed(2)) : 0,
        }));
    }, [pay, totalAdjusted]);

    const addInvoiceReceipt = async () => {
        if (!validateForm()) return;
        if (formValues?.comprobante === "FACTURA" && selectedClient?.nroDoc.length !== 11) {
            // Nota: RUC length es 11
            if (selectedClient?.nroDoc.length === 8) {
                return useAlertStore.getState().alert("El número de documento del cliente debe ser un ruc (11 dígitos) para generar una factura", "error")
            }
        }
        if ((serie === "" || correlative === "") && formValues?.comprobante === "NOTA DE CREDITO") {
            return useAlertStore.getState().alert("Serie y correlativo son obligatorios para nota de credito", "error")
        }
        if (formValues?.clienteNombre === "") {
            return useAlertStore.getState().alert("El cliente es obligatorio", "error")
        }
        if (productsInvoice.length === 0) {
            return useAlertStore.getState().alert("Debe agregar al menos un producto", "error")
        }

        const fechaEmision = formatISO(new Date(), { representation: 'complete' });

        if (formValues.tipoDoc === "NP" && adelanto > totalAdjusted) {
            return useAlertStore.getState().alert("El adelanto no puede ser mayor al total", "error");
        }

        let fechaRecojoFinal = null;
        if (formValues.tipoDoc === "NP" && fechaRecojo) {
            try {
                const parsed = parse(fechaRecojo, 'dd/MM/yyyy', new Date());
                fechaRecojoFinal = formatISO(parsed, { representation: 'complete' });
            } catch (e) {
                console.error('Error parseando fechaRecojo:', e);
            }
        }

        const baseData = {
            tipoOperacionId: 1,
            fechaEmision,
            medioPago: paymentMethod,
            vuelto: formValues?.vuelto,
            clienteId: Number(formValues?.clienteId) || invoiceData?.cliente?.id,
            clienteName: selectedClient?.nombre,
            tipoDoc: formValues?.tipoDoc,
            detalles: productsInvoice?.map((item: any) => ({
                productoId: Number(item?.productoId !== undefined ? item?.productoId : item?.id),
                descripcion: item.descripcion,
                cantidad: Number(item.cantidad),
                nuevoValorUnitario: Number(item.precioUnitario),
                descuento: Number(item.descuento ?? 0)
            })),
            formaPagoTipo: "Contado",
            formaPagoMoneda: "PEN",
            tipoMoneda: "PEN",
            descuento: finalDiscount,
            leyenda: totalInWords,
            observaciones: formValues?.observaciones || formValues?.motivo,
            adelanto: formValues.tipoDoc === "NP" && adelanto > 0 ? adelanto : undefined,
            fechaRecojo: formValues.tipoDoc === "NP" && fechaRecojoFinal ? fechaRecojoFinal : undefined,
        };

        const finalData: any =
            formValues.comprobante === "NOTA DE CREDITO" || formValues.comprobante === "NOTA DE DEBITO"
                ? {
                    ...baseData,
                    motivoId: formValues.motivoId,
                    tipDocAfectado: receiptNoteId,
                    numDocAfectado: `${serie.toUpperCase()}-${correlative}`,
                    montoDescuentoGlobal: Number(totalDescount),
                    montoInteresMora: Number(totalInteres)
                }
                : baseData;

        setIsOpenModalSuccessInvoice(true);
        setIsLoading(true);
        const result = tiposInformales.includes(formValues.tipoDoc)
            ? await addInformalInvoice(finalData)
            : await addInvoice(finalData);

        if (result.success === true) {
            setIsLoading(false)
        } else {
            setIsOpenModalSuccessInvoice(false);
            setIsLoading(false);
            console.log("Error al crear el invoice:", result.error);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const receiptsToNote = [{ id: "01", value: "FACTURA" }, { id: "03", value: "BOLETA" }];
    let replaceToFilter = formValues?.comprobante?.replace("NOTA DE ", "");
    const typesOperation = creditDebitNoteTypes?.filter((item: any) => item?.tipo === replaceToFilter);

    useEffect(() => {
        if (invoiceData !== null) {
            setSelectedClient({
                nombre: invoiceData?.cliente?.nombre,
                direccion: invoiceData?.cliente?.direccion,
                nroDoc: invoiceData?.cliente?.nroDoc
            })
            setFormValues({
                ...formValues,
                clienteNombre: `${invoiceData?.cliente?.nroDoc}-${invoiceData?.cliente?.nombre}`
            })
        }
    }, [invoiceData])

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getDocumentInvoice = async () => {
        const result = await getInvoiceBySerieCorrelative(debounceSerie.toUpperCase(), debounceCorrelative, formValues.motivoId);
        if (result.error) return useAlertStore.getState().alert(`${result.error}`, 'error');
    }

    const closeModal = () => {
        setIsOpenModalClient(false);
        setIsOpenModalProduct(false)
    }

    useEffect(() => {
        if (formValues.motivoId) resetProductInvoice();
    }, [formValues.motivoId])

    const ruc = "204812192919";
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    useEffect(() => {
        const generateQR = async () => {
            try {
                const dataUrl = await QRCode.toDataURL(ruc);
                setQrCodeDataUrl(dataUrl);
            } catch (e) { }
        };
        generateQR();
    }, []);

    const componentRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 80, height: 297 });

    useEffect(() => {
        switch (printSize) {
            case 'TICKET': setDimensions({ width: 80, height: 297 }); break;
            case 'A5': setDimensions({ width: 148, height: 210 }); break;
            case 'A4': setDimensions({ width: 210, height: 297 }); break;
        }
    }, [printSize]);

    const printFn = useReactToPrint({
        // @ts-ignore
        contentRef: componentRef,
        pageStyle: `@media print { @page { size: ${dimensions.width}mm ${dimensions.height}mm; margin: 0; } body { margin: 0; width: ${dimensions.width}mm; } }`,
    });

    const handleOpenNewTab = (vista: string) => { printFn(); };

    const closeModalResponse = () => {
        setIsOpenModalSuccessInvoice(false);
        setFormValues({ ...initFormValues, comprobante: formValues?.comprobante, tipoDoc: formValues.tipoDoc, vuelto: 0 });
        setPay(0);
        setChange(0);
        setPaymentMethod('Efectivo');
        resetInvoice();
        resetProductInvoice();
        if (formValues?.comprobante === "BOLETA") {
            const clientSelect: any = clients?.find((item: any) => "10000000" === item.nroDoc);
            setSelectedClient(clientSelect ? clientSelect : { nroDoc: "10000000", nombre: "CLIENTES VARIOS" });
            setFormValues(prev => ({ ...prev, clienteNombre: "CLIENTES VARIOS" }));
        } else {
            setSelectedClient(null);
        }
        setSelectProduct(null);
        setSerie("");
        setCorrelative("");
        setTimeout(() => getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc), 1000);
    };

    return (
        <div className="flex flex-col md:flex-row h-screen md:h-[calc(100vh-80px)] overflow-hidden bg-gray-100 gap-4 p-4 font-sans text-gray-800">
            {/* Hidden Print Component */}
            <div className="hidden">
                <ComprobantePrintPage
                    id="print-root"
                    company={auth}
                    qrCodeDataUrl={qrCodeDataUrl}
                    productsInvoice={productsInvoice}
                    total={total}
                    mode={"vista previa"}
                    componentRef={componentRef}
                    size={printSize}
                    formValues={{
                        ...formValues,
                        serie: dataReceipt?.serie,
                        correlativo: dataReceipt?.correlativo,
                        numDocAfectado: `${serie}-${correlative}`,
                        medioPago: formValues?.comprobante === "NOTA DE PEDIDO" ? "" : paymentMethod
                    }}
                    serie={serie}
                    correlative={correlative}
                    discount={finalDiscount.toString()}
                    receipt={formValues?.comprobante}
                    selectedClient={selectedClient}
                    totalInWords={totalInWords}
                    observation={formValues?.observaciones || formValues?.motivo}
                />
            </div>

            {/* LEFT PANEL: PRODUCT CATALOG */}
            <div className="w-full md:w-[65%] flex flex-col gap-4 bg-white rounded-2xl shadow-sm h-full overflow-hidden">
                {/* Header: Search & Categories */}
                <div className="p-5 border-b border-gray-100">
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-700 outline-none transition-all placeholder-gray-400 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => setSelectedCategoryId(0)}
                            className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-semibold transition-all ${selectedCategoryId === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            TODOS
                        </button>
                        {categories?.map((cat: any) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-semibold transition-all ${selectedCategoryId === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                {cat.nombre.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {filteredProducts?.map((item: any) => {
                            // Generate a consistent color based on category name
                            const categoryColors: Record<string, string> = {
                                'BEBIDAS': 'bg-orange-100 text-orange-600',
                                'ABARROTES': 'bg-emerald-100 text-emerald-600',
                                'LIMPIEZA': 'bg-cyan-100 text-cyan-600',
                                'PINTURAS Y ACABADOS': 'bg-pink-100 text-pink-600',
                                'HERRAMIENTAS': 'bg-amber-100 text-amber-700',
                                'ELECTRICIDAD': 'bg-yellow-100 text-yellow-700',
                                'GASFITERIA': 'bg-blue-100 text-blue-600',
                                'CEMENTO Y AGREGADOS': 'bg-gray-200 text-gray-700',
                                'FIERROS Y ACERO': 'bg-slate-200 text-slate-700',
                            };
                            const categoryColor = item.categoria?.nombre
                                ? (categoryColors[item.categoria.nombre.toUpperCase()] || 'bg-indigo-100 text-indigo-600')
                                : 'bg-gray-100 text-gray-500';

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleProductClick(item)}
                                    className="group bg-white rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
                                >
                                    {/* Image Container - Gray rounded background */}
                                    <div className="aspect-square bg-gray-100 rounded-md m-2 overflow-hidden relative flex items-center justify-center">
                                        {item.imagenUrl ? (
                                            <img
                                                src={item.imagenUrl}
                                                alt={item.descripcion}
                                                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    target.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full text-gray-300"><svg width="48" height="48" viewBox="0 0 24 24"><path fill="currentColor" d="M21 16.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11.5zm-2 0V5H5v10.56l7-3.5 7 4.44zM8.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg></div>';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full text-gray-300">
                                                <Icon icon="solar:box-minimalistic-linear" className="text-5xl" />
                                            </div>
                                        )}
                                        {/* Hover Add Button */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                            <div className="bg-white shadow-lg p-2 rounded-full">
                                                <Icon icon="solar:add-circle-bold" className="text-blue-600 text-2xl" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="px-3 pb-4 pt-1">
                                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug mb-2 min-h-[2.5rem] capitalize" style={{ textTransform: 'none' }}>
                                            {item.descripcion?.toLowerCase()}
                                        </h4>

                                        <div className="flex items-center justify-between gap-2">
                                            {/* Category Badge */}
                                            {item.categoria?.nombre ? (
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColor} truncate max-w-[70%]`}>
                                                    {item.categoria.nombre}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}

                                            {/* Price */}
                                            <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                                                S/{Number(item.precioUnitario).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {!filteredProducts?.length && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Icon icon="solar:sad-square-linear" className="text-6xl mb-2 opacity-50" />
                            <p>No se encontraron productos</p>
                        </div>
                    )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 bg-white">
                    <Pagination
                        data={products}
                        optionSelect
                        currentPage={page}
                        indexOfFirstItem={indexOfFirstItem}
                        indexOfLastItem={indexOfLastItem}
                        setcurrentPage={setPage}
                        setitemsPerPage={setLimit}
                        pages={pages}
                        total={totalProducts || 0}
                    />
                </div>
            </div>

            {/* RIGHT PANEL: CART / INVOICE */}
            <div className="w-full md:w-[35%] flex flex-col bg-white rounded-2xl h-full shadow-sm overflow-hidden border border-gray-100">
                {/* Invoice Config Header */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="col-span-2">
                            <Select
                                defaultValue={formValues?.comprobante}
                                isSearch options={comprobantesGenerar}
                                id="tipoDoc" name="comprobante"
                                error=""
                                value="" onChange={handleChangeSelect}
                                label="Tipo Comprobante" isIcon icon="solar:file-text-linear"
                            />
                        </div>
                    </div>

                    {/* Cliente - Solo mostrar cuando NO es nota de crédito/débito */}
                    {formValues?.comprobante !== "NOTA DE CREDITO" && formValues?.comprobante !== "NOTA DE DEBITO" && (
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Select
                                    handleGetData={handleGetDataClient}
                                    value={formValues?.clienteNombre}
                                    isSearch options={clients?.map((item: any) => ({ id: item?.id, value: `${item?.nroDoc}-${item.nombre}` }))}
                                    id="clienteId" name="clienteNombre"
                                    error=""
                                    onChange={handleChangeSelect}
                                    label="Cliente" isIcon icon="solar:user-linear"
                                />
                            </div>
                            <button onClick={() => setIsOpenModalClient(true)} className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors">
                                <Icon icon="solar:user-plus-bold" />
                            </button>
                        </div>
                    )}

                    {/* Sección para NOTA DE CRÉDITO / DÉBITO - Compacta */}
                    {(formValues?.comprobante === "NOTA DE CREDITO" || formValues?.comprobante === "NOTA DE DEBITO") && (
                        <div className="mt-2 text-sm bg-amber-50/50 rounded-lg border border-amber-100 p-2">
                            {/* Selectores + Busqueda en Grid Compacto */}
                            <div className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-4">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Tipo Doc</label>
                                    <select
                                        className="w-full text-xs p-1.5 rounded border border-gray-300 bg-white focus:outline-none focus:border-blue-500"
                                        value={receiptNoteId}
                                        onChange={(e) => setReceiptNoteId(e.target.value)}
                                    >
                                        {receiptsToNote.map(opt => <option key={opt.id} value={opt.id}>{opt.value}</option>)}
                                    </select>
                                </div>

                                <div className="col-span-8">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Operación</label>
                                    <select
                                        className="w-full text-xs p-1.5 rounded border border-gray-300 bg-white focus:outline-none focus:border-blue-500"
                                        value={formValues?.motivoId || ""}
                                        onChange={(e) => {
                                            const selectedId = Number(e.target.value);
                                            const selected: any = typesOperation?.find((op: any) => op.id === selectedId);
                                            if (selected) {
                                                handleChangeSelect(selectedId, selected.descripcion, 'motivo', 'motivoId');
                                            }
                                        }}
                                    >
                                        <option value="">Seleccione...</option>
                                        {typesOperation?.map((item: any) => (
                                            <option key={item.id} value={item.id}>{item.descripcion}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-3">
                                    <input
                                        className="w-full text-xs p-1.5 rounded border border-gray-300 focus:outline-none focus:border-blue-500 uppercase"
                                        placeholder="Serie"
                                        value={serie}
                                        onChange={(e) => setSerie(e.target.value.toUpperCase())}
                                    />
                                </div>
                                <div className="col-span-7">
                                    <input
                                        className="w-full text-xs p-1.5 rounded border border-gray-300 focus:outline-none focus:border-blue-500"
                                        placeholder="Correlativo"
                                        value={correlative}
                                        onChange={(e) => setCorrelative(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <button
                                        onClick={() => getInvoiceBySerieCorrelative(serie.toUpperCase(), correlative, formValues.motivoId)}
                                        className="w-full p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                                        title="Buscar Documento"
                                    >
                                        <Icon icon="solar:magnifer-bold" />
                                    </button>
                                </div>
                            </div>

                            {/* Info Documento Compacta */}
                            {invoiceData && (
                                <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded px-3 py-1.5">
                                    <div className="flex items-center gap-2">
                                        <Icon icon="solar:check-circle-bold" className="text-emerald-500" />
                                        <span className="font-bold text-gray-700 text-xs">{invoiceData?.serie}-{invoiceData?.correlativo}</span>
                                    </div>
                                    <div className="text-xs text-right">
                                        <span className="text-gray-500 text-[10px] block">Total Original</span>
                                        <div className="font-bold text-gray-800">S/ {Number(invoiceData?.mtoImpVenta || 0).toFixed(2)}</div>
                                        <div className="text-[10px] text-emerald-600 font-medium truncate max-w-[150px]">{invoiceData?.cliente?.nombre}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                    {productsInvoice.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <Icon icon="solar:cart-large-minimalistic-linear" className="text-6xl mb-4" />
                            <p className="font-medium">El carrito está vacío</p>
                            <p className="text-sm">Agrega productos del catálogo</p>
                        </div>
                    ) : (
                        productsInvoice.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-dashed border-gray-200 hover:border-blue-300 transition-colors group">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {item.imagenUrl ? <img src={item.imagenUrl} className="w-full h-full object-cover rounded-lg" /> : <Icon icon="solar:box-linear" className="text-gray-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-gray-800 text-sm line-clamp-1">{item.descripcion}</h5>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>PU: S/{Number(item.precioUnitario).toFixed(2)}</span>
                                        {Number(item.descuento) > 0 && <span className="text-green-600">-{item.descuento}%</span>}
                                    </div>
                                </div>

                                {/* Qty Controls */}
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => {
                                            if (item.cantidad > 1) {
                                                const index = productsInvoice.indexOf(item);
                                                updateProductInvoice(index, calculateLineItem(item, Number(item.cantidad) - 1));
                                            } else {
                                                deleteProductInvoice(item)
                                            }
                                        }}
                                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600"
                                    >
                                        <Icon icon="solar:minus-circle-linear" />
                                    </button>
                                    <span className="w-8 text-center font-bold text-sm">{item.cantidad}</span>
                                    <button
                                        onClick={() => {
                                            const index = productsInvoice.indexOf(item);
                                            const newQty = Number(item.cantidad) + 1;
                                            if (item.stock < newQty) return useAlertStore.getState().alert("Max stock alcanzado", "warning");
                                            updateProductInvoice(index, calculateLineItem(item, newQty));
                                        }}
                                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600"
                                    >
                                        <Icon icon="solar:add-circle-linear" />
                                    </button>
                                </div>

                                <div className="text-right min-w-[60px]">
                                    <p className="font-bold text-gray-900">S/ {Number(item.total).toFixed(2)}</p>
                                </div>

                                <button onClick={() => setEditingIndex(index)} className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                                    <Icon icon="solar:pen-new-square-linear" />
                                </button>
                                <button onClick={() => deleteProductInvoice(item)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon icon="solar:trash-bin-linear" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Calculations Section */}
                <div className="p-5 bg-gray-50 border-t border-gray-100">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Op. Gravada</span>
                            <span>S/ {opGravadaAdjusted.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>IGV (18%)</span>
                            <span>S/ {igvAdjusted.toFixed(2)}</span>
                        </div>
                        {(hasDiscount || (isDiscountGlobalApplicable && descountGlobal > 0)) && (
                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                <span>Descuento</span>
                                <span>- S/ {finalDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-black text-gray-800 pt-2 border-t border-gray-200">
                            <span>TOTAL</span>
                            <span>S/ {totalAdjusted.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Metodo de Pago</label>
                        <div className="grid grid-cols-4 gap-2">
                            {metodosContado.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setPaymentMethod(m)}
                                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${paymentMethod === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleOpenNewTab("vista previa")}
                            className="col-span-1 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:eye-linear" className="text-xl" />
                            PREVIA
                        </button>
                        <button onClick={addInvoiceReceipt} className="col-span-1 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2">
                            <Icon icon="solar:printer-minimalistic-bold" className="text-xl" />
                            {isMobile ? "EMITIR" : "EMITIR"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {IsOpenModalSuccessInvoice && <ModalReponseInvoice handleOpenNewTab={() => handleOpenNewTab("")} closeModal={closeModalResponse} isLoading={isLoading} comprobante={formValues?.comprobante} auth={auth} serie={serie} correlative={correlative} dataReceipt={dataReceipt} client={selectedClient} company={auth} productsInvoice={productsInvoice} formValues={formValues} observation={formValues?.observaciones} />}
            {isOpenModalProduct && <ModalProduct setSelectProduct={setSelectProduct} isInvoice initialForm={initialFormProduct} setErrors={setErrorsProduct} setFormValues={setFormValuesProduct} isOpenModal={isOpenModalProduct} errors={errorsProduct} formValues={formValuesProduct} isEdit={false} setIsOpenModal={setIsOpenModalProduct} closeModal={closeModal} />}
            {isOpenModalClient && <ModalClient isOpenModal={isOpenModalClient} errors={errorsClient} setErrors={setErrorsClient} formValues={formValuesClient} setFormValues={setFormValuesClient} isEdit={false} setIsOpenModal={setIsOpenModalClient} closeModal={closeModal} />}
            {editingIndex !== -1 && <ModalEditLineItem isOpen={editingIndex !== -1} onClose={() => setEditingIndex(-1)} item={productsInvoice[editingIndex]} onSave={handleSaveEdit} />}
        </div>
    )
}

export default Invoice;