import { ChangeEvent, useEffect, useRef, useState, useMemo } from "react";
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
import { useNavigate, useLocation } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import ComprobantePrintPage from "./comprobanteImprimir";
import Pagination from "@/components/Pagination";
import ModalEditLineItem from "./ModalEditLineItem";
import InputPro from "@/components/InputPro";
import Button from "@/components/Button";
import { get } from "@/utils/fetch";
import ModalDetraccion, { DetraccionData } from "./ModalDetraccion";
import ModalConfiguracionCotizacion, { QuotationConfig } from "./ModalConfiguracionCotizacion";
import { useThemeStore } from "@/zustand/theme";

const Invoice = () => {

    const { receipt, importReference, addInformalInvoice, addProductsInvoice, updateProductInvoice, productsInvoice, getInvoiceBySerieCorrelative, resetProductInvoice, invoiceData, deleteProductInvoice, addInvoice, dataReceipt, resetInvoice, getSerieAndCorrelativeByReceipt }: IInvoicesState = useInvoiceStore();
    const { isCompact } = useThemeStore();

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
    const location = useLocation();
    const isQuotationRoute = location.pathname.includes('/cotizaciones/nuevo');
    const tiposInformales = ['TICKET', 'NV', 'RH', 'CP', 'NP', 'OT', 'COT']; // COT no requiere SUNAT
    let tipoEmpresa = auth?.empresa?.tipoEmpresa || "";

    // POS STATES
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");

    const initialDocumentType = isQuotationRoute
        ? "COTIZACIÓN"
        : (receipt === ""
            ? (tipoEmpresa === "INFORMAL" ? "TICKET" : "FACTURA")
            : receipt.toUpperCase());

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
        tipoDoc: isQuotationRoute ? "COT" : (tipoEmpresa === "INFORMAL" && initialDocumentType === "TICKET" ? "TICKET" : initialDocumentType === "NOTA DE CREDITO" ? "07" : initialDocumentType === "NOTA DE DEBITO" ? "08" : initialDocumentType === "BOLETA" ? "03" : "01"),
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

    // DETRACCION STATES
    const [tiposOperacion, setTiposOperacion] = useState<any[]>([]);
    const [tiposDetraccion, setTiposDetraccion] = useState<any[]>([]);
    const [mediosPagoDetraccion, setMediosPagoDetraccion] = useState<any[]>([]);

    const [tipoDetraccionId, setTipoDetraccionId] = useState<number | undefined>(undefined);
    const [medioPagoDetraccionId, setMedioPagoDetraccionId] = useState<number | undefined>(undefined);
    const [cuentaBancoNacion, setCuentaBancoNacion] = useState<string>('');
    const [porcentajeDetraccion, setPorcentajeDetraccion] = useState<number>(0);
    const [montoDetraccion, setMontoDetraccion] = useState<number>(0);
    const [isModalDetraccionOpen, setIsModalDetraccionOpen] = useState<boolean>(false);
    const [cuotas, setCuotas] = useState<Array<{ monto: number; fechaVencimiento: string }>>([]);

    // Retención 3%
    const [isModalRetencionOpen, setIsModalRetencionOpen] = useState(false);
    const [retencionData, setRetencionData] = useState<any>(null);

    // Cargar Catálogos Detracción
    useEffect(() => {
        const loadMasters = async () => {
            try {
                const rOps: any = await get('comprobante/tipo-operacion');
                const opsData = (rOps && Array.isArray(rOps)) ? rOps : (rOps?.data || []);
                if (Array.isArray(opsData)) {
                    setTiposOperacion(opsData);
                    // Set default to VENTA INTERNA if exists and not set (and not Note)
                    if (formValues.motivoId === 0 && !["NOTA DE CREDITO", "NOTA DE DEBITO"].includes(formValues.comprobante)) {
                        const ventaInterna = opsData.find((op: any) => op.codigo === '0101');
                        if (ventaInterna) setFormValues(prev => ({ ...prev, motivoId: ventaInterna.id }));
                    }
                }
                const rDet: any = await get('comprobante/tipos-detraccion');
                setTiposDetraccion((rDet && Array.isArray(rDet)) ? rDet : (rDet?.data || []));

                const rMed: any = await get('comprobante/medios-pago-detraccion');
                setMediosPagoDetraccion((rMed && Array.isArray(rMed)) ? rMed : (rMed?.data || []));
            } catch (e) { console.error(e); }
        };
        loadMasters();
    }, [formValues.comprobante]); // Reload if needed, but mostly one time. Added dependency for safety.

    // Calcular Detracción Automaticamente


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

    const handleSaveRetencion = (data: any) => {
        setRetencionData(data);
        // Sincronizar forma de pago y cuotas con el formulario principal
        const formaPagoUpper = data.formaPago?.toUpperCase() || 'CONTADO';
        setFormValues(prev => ({
            ...prev,
            medioPago: formaPagoUpper,
            cuotas: data.cuotas ? data.cuotas.map((c: any) => ({
                monto: c.monto,
                fechaVencimiento: c.fechaVencimiento // backend espera fechaPago o fechaVencimiento en cuotas? Revisar DTO.
            })) : []
        }));
    };

    const handleSaveDetraccion = (data: DetraccionData) => {
        setTipoDetraccionId(data.tipoDetraccionId);
        setMedioPagoDetraccionId(data.medioPagoDetraccionId);
        setCuentaBancoNacion(data.cuentaBancoNacion);
        setPorcentajeDetraccion(data.porcentajeDetraccion);
        setMontoDetraccion(data.montoDetraccion);
        setCuotas(data.cuotas || []);
        // Update formaPagoTipo if user selected Credito
        if (data.formaPago) {
            setFormValues(prev => ({ ...prev, medioPago: data.formaPago || 'Contado' }));
        }
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
    }, [])

    // Update comprobante type when route changes
    useEffect(() => {
        const newComprobante = isQuotationRoute
            ? "COTIZACIÓN"
            : (tipoEmpresa === "INFORMAL" ? "TICKET" : "FACTURA");

        const newTipoDoc = isQuotationRoute
            ? "COT"
            : (tipoEmpresa === "INFORMAL" ? "TICKET" : "01");

        setFormValues(prev => ({
            ...prev,
            comprobante: newComprobante,
            tipoDoc: newTipoDoc
        }));
    }, [isQuotationRoute, tipoEmpresa]);

    // Set printSize based on route
    useEffect(() => {
        if (isQuotationRoute) {
            setPrintSize("A4");
        } else {
            setPrintSize("TICKET");
        }
    }, [isQuotationRoute]);

    // Cargar datos de cotización si viene de conversión
    useEffect(() => {
        const state = location.state as any;
        if (state?.fromQuotation && state?.quotationData) {
            const { cliente, productos, observaciones } = state.quotationData;

            // Establecer cliente
            if (cliente) {
                setSelectedClient(cliente);
                setFormValues(prev => ({
                    ...prev,
                    clienteId: cliente.id,
                    clienteNombre: `${cliente.nroDoc}-${cliente.nombre}`
                }));
            }
            console.log('Productos raw:', productos)
            // Cargar productos al carrito
            if (productos && Array.isArray(productos)) {
                const productosConvertidos = productos.map((det: any) => {
                    const prodId = det.producto?.id || det.productoId;
                    // Buscar el producto en el catálogo para obtener la imagen (solo si products está cargado)
                    const productoEnCatalogo = products && Array.isArray(products)
                        ? products.find((p: any) => p.id === prodId)
                        : null;

                    return {
                        id: prodId,
                        productoId: prodId,
                        descripcion: det.descripcion,
                        cantidad: det.cantidad,
                        precioUnitario: det.mtoPrecioUnitario,
                        descuento: 0,
                        unidad: det.unidad,
                        imagenUrl: productoEnCatalogo?.imagenUrl || null, // Agregar imagen del catálogo
                    };
                });
                // Limpiar productos existentes y agregar los nuevos
                resetProductInvoice();
                productosConvertidos.forEach(prod => addProductsInvoice(prod));
            }

            // Observaciones
            if (observaciones) {
                setFormValues(prev => ({ ...prev, observaciones }));
            }

            // Limpiar el state para que no se cargue de nuevo
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => { // getAllProducts logic moved to dedicated effect
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

    const tiposCotizacion = [{ id: "COT", value: "COTIZACIÓN" }]

    let comprobantesGenerar = isQuotationRoute
        ? tiposCotizacion
        : (tipoEmpresa === "INFORMAL" ? tiposComprobantesInformales : tipoEmpresa === "FORMAL" ? tiposComprobanteFormales : tiposComprobanteFormales.concat(tiposComprobantesInformales))

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
    const [printSize, setPrintSize] = useState(isQuotationRoute ? "A4" : "TICKET");
    const [includeProductImages, setIncludeProductImages] = useState(isQuotationRoute);

    // Quotation-specific states
    const [quotationDiscount, setQuotationDiscount] = useState(0); // Descuento global %
    const [quotationValidity, setQuotationValidity] = useState(7); // Días de validez
    const [quotationSignature, setQuotationSignature] = useState(''); // Nombre del firmante
    const [quotationTerms, setQuotationTerms] = useState(''); // Términos y condiciones
    const [quotationPaymentType, setQuotationPaymentType] = useState('CONTADO'); // CONTADO, CREDITO_30, etc.
    const [quotationAdvance, setQuotationAdvance] = useState(0); // Adelanto %
    const [isQuotationConfigOpen, setIsQuotationConfigOpen] = useState(false); // Acordeón
    const [isQuotationConfigModalOpen, setIsQuotationConfigModalOpen] = useState(false); // Modal de configuración
    const [hasOpenedConfigModal, setHasOpenedConfigModal] = useState(false); // Para abrir solo una vez


    // Auto-open config modal cuando se entra a cotizaciones/nuevo
    useEffect(() => {
        if (isQuotationRoute && !hasOpenedConfigModal) {
            setIsQuotationConfigModalOpen(true);
            setHasOpenedConfigModal(true);
        }
    }, [isQuotationRoute, hasOpenedConfigModal]);

    // Handler para guardar configuración de cotización
    const handleSaveQuotationConfig = (config: QuotationConfig) => {
        setIncludeProductImages(config.includeProductImages);
        setQuotationDiscount(config.quotationDiscount);
        setQuotationValidity(config.quotationValidity);
        setQuotationSignature(config.quotationSignature);
        setQuotationTerms(config.quotationTerms);
        setQuotationPaymentType(config.quotationPaymentType);
        setQuotationAdvance(config.quotationAdvance);

        // Actualizar observaciones en formValues
        setFormValues(prev => ({
            ...prev,
            observaciones: config.observaciones
        }));
    };

    const handleChangeSelect = (idValue: any, value: any, name: any, id: any) => {
        const clientSelect = clients?.find((item: any) => value.split("-")[0] === item.nroDoc);
        if (clientSelect !== undefined) {
            setSelectedClient(clientSelect);
        }

        const updatedFormValues: any = {
            ...formValues,
            [name]: value,
            [id]: idValue
        };

        // Fix: Solo buscar/actualizar motivo si estamos cambiando el selector de motivo
        if (id === 'motivoId' || name === 'motivo') {
            const motivo: any = typesOperation.find((item: any) => Number(item.id) === Number(idValue));
            updatedFormValues.motivoId = motivo?.id;
        }

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

    const { total, discount: productDiscount, hasDiscount } = useMemo(() => calculateTotals(productsInvoice), [productsInvoice]);
    const isDiscountGlobalApplicable = formValues.motivoId === 6;
    const totalOriginal = Number(total);
    const totalAdjusted = isDiscountGlobalApplicable ? Math.max(totalOriginal - descountGlobal, 0) : totalOriginal;

    // Calcular Detracción Automaticamente (Mellado aquí para tener acceso a totalAdjusted)
    useEffect(() => {
        if (porcentajeDetraccion > 0 && totalAdjusted > 0) {
            setMontoDetraccion(Number((totalAdjusted * porcentajeDetraccion / 100).toFixed(2)));
        } else {
            setMontoDetraccion(0);
        }
    }, [porcentajeDetraccion, totalAdjusted]);

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

        const selectedOperacion = tiposOperacion.find(op => op.id === formValues.motivoId);

        // Validación Detracción
        if (selectedOperacion?.codigo === '0112') {
            if (!tipoDetraccionId || !cuentaBancoNacion || !porcentajeDetraccion || !montoDetraccion) {
                return useAlertStore.getState().alert("Para operación sujeta a detracción, DEBE configurar la detracción (Cuenta, % y Monto).", "error");
            }
            if (totalAdjusted < 700) {
                return useAlertStore.getState().alert("La detracción solo aplica para montos mayores a S/ 700.00", "error");
            }
        }

        // Validación Retención
        if (retencionData) {
            if (!retencionData.montoDetraccion || retencionData.montoDetraccion <= 0) {
                return useAlertStore.getState().alert("Para operación sujeta a retención, DEBE configurar el monto de retención.", "error");
            }
        }

        if ((formValues.tipoDoc === "NP" || formValues.tipoDoc === "OT") && adelanto > totalAdjusted) {
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

        let observacionesFinal = formValues?.observaciones || formValues?.motivo;
        if (retencionData) {
            observacionesFinal = `${observacionesFinal} | Operación sujeta a Retención del 3% del IGV`.replace(/^ \| /, '');
        }

        const baseData = {
            tipoOperacionId: formValues.motivoId || 1,
            fechaEmision,
            medioPago: paymentMethod,
            vuelto: formValues?.vuelto,
            clienteId: Number(formValues?.clienteId) || invoiceData?.cliente?.id,
            clienteName: selectedClient?.nombre,
            tipoDoc: formValues?.tipoDoc,
            detalles: productsInvoice?.map((item: any) => ({
                productoId: Number(item?.productoId || item?.id) || null,
                descripcion: item.descripcion,
                cantidad: Number(item.cantidad),
                nuevoValorUnitario: Number(item.precioUnitario),
                descuento: Number(item.descuento ?? 0)
            })),
            formaPagoTipo: formValues.medioPago || "Contado",
            formaPagoMoneda: "PEN",
            tipoMoneda: "PEN",
            descuento: finalDiscount,
            leyenda: totalInWords,
            observaciones: observacionesFinal,
            adelanto: (formValues.tipoDoc === "NP" || formValues.tipoDoc === "OT") && adelanto > 0 ? adelanto : undefined,
            fechaRecojo: (formValues.tipoDoc === "NP" || formValues.tipoDoc === "OT") && fechaRecojoFinal ? fechaRecojoFinal : undefined,
            // Configuración de cotización (solo si es COT)
            cotizIncluirImagenes: isQuotationRoute ? includeProductImages : undefined,
            cotizDescuento: isQuotationRoute ? quotationDiscount : undefined,
            cotizVigencia: isQuotationRoute ? quotationValidity : undefined,
            cotizFirmante: isQuotationRoute ? quotationSignature : undefined,
            cotizTerminos: isQuotationRoute ? quotationTerms : undefined,
            cotizTipoPago: isQuotationRoute ? quotationPaymentType : undefined,
            cotizAdelanto: isQuotationRoute ? quotationAdvance : undefined,
            // Detraccion (solo si es operación 0112 y no hay retención activa)
            ...(selectedOperacion?.codigo === '0112' && !retencionData ? {
                tipoDetraccionId: tipoDetraccionId || undefined,
                medioPagoDetraccionId: medioPagoDetraccionId || undefined,
                cuentaBancoNacion: cuentaBancoNacion || undefined,
                porcentajeDetraccion: porcentajeDetraccion > 0 ? porcentajeDetraccion : undefined,
                montoDetraccion: montoDetraccion > 0 ? montoDetraccion : undefined,
                cuotas: cuotas.length > 0 ? cuotas : undefined,
            } : {}),
            // Retención (si está configurada)
            ...(retencionData ? {
                retencionMonto: retencionData.montoDetraccion, // Usamos el mismo campo para monto
                retencionPorcentaje: retencionData.porcentajeDetraccion, // Usamos el mismo campo para porcentaje
                cuotas: formValues.cuotas && formValues.cuotas.length > 0 ? formValues.cuotas : undefined, // Cuotas ya sincronizadas en formValues
            } : {}),
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
        // Removed: resetProductInvoice was unnecessarily clearing products when changing operation type
        // if (formValues.motivoId) resetProductInvoice();
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
        const ventaInterna = tiposOperacion.find((op: any) => op.codigo === '0101');
        setFormValues({
            ...initFormValues,
            comprobante: formValues?.comprobante,
            tipoDoc: formValues.tipoDoc,
            vuelto: 0,
            motivoId: ventaInterna ? ventaInterna.id : initFormValues.motivoId
        });
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
        setRetencionData(null); // Reset retention data
        setTipoDetraccionId(undefined); // Reset detraction data
        setMedioPagoDetraccionId(undefined);
        setCuentaBancoNacion('');
        setPorcentajeDetraccion(0);
        setMontoDetraccion(0);
        setCuotas([]);
        setTimeout(() => getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc), 1000);
    };

    const selectOperation = tiposOperacion.find(op => op.id === formValues.motivoId);

    // Auto-apply or clear retention data based on total and agent status
    useEffect(() => {
        // Clear if drops below 700
        if (totalAdjusted < 700 && retencionData) {
            setRetencionData(null);
            return;
        }

        // Auto-apply if >= 700, is agent, not detraction, and not already set
        if (totalAdjusted >= 700 && auth?.empresa?.esAgenteRetencion && selectOperation?.codigo !== "0112" && !retencionData) {
            const monto = Number((totalAdjusted * 0.03).toFixed(2));
            setRetencionData({
                montoDetraccion: monto,
                porcentajeDetraccion: 3
            });
        }
    }, [totalAdjusted, retencionData, auth?.empresa?.esAgenteRetencion, selectOperation?.codigo]);

    const [showMobileCart, setShowMobileCart] = useState(false);

    // ... (rest of useEffects)

    return (
        <div className={`flex flex-col md:flex-row min-h-screen md:min-h-0 md:overflow-hidden gap-4 md:gap-6 font-sans text-gray-800 transition-all duration-300 ${!showMobileCart && isMobile ? 'pb-24' : 'pb-0'}`}
            style={{ height: !isMobile ? (isCompact ? 'calc(125vh - 100px)' : 'calc(100vh - 85px)') : 'auto' }}
        >

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
                    includeProductImages={includeProductImages}
                    quotationDiscount={quotationDiscount}
                    quotationValidity={quotationValidity}
                    quotationSignature={quotationSignature}
                    quotationTerms={quotationTerms}
                    quotationPaymentType={quotationPaymentType}
                    quotationAdvance={quotationAdvance}
                    formValues={{
                        ...formValues,
                        serie: dataReceipt?.serie,
                        correlativo: dataReceipt?.correlativo,
                        numDocAfectado: `${serie}-${correlative}`,
                        medioPago: formValues?.comprobante === "NOTA DE PEDIDO" ? "" : paymentMethod,
                        // Add detraction data
                        ...(tipoDetraccionId ? {
                            tipoDetraccion: tiposDetraccion.find(t => t.id === tipoDetraccionId),
                            montoDetraccion: montoDetraccion,
                            cuentaBancoNacion: cuentaBancoNacion,
                            medioPagoDetraccion: mediosPagoDetraccion.find(m => m.id === medioPagoDetraccionId),
                            cuotas: cuotas
                        } : {})
                    }}
                    serie={serie}
                    correlative={correlative}
                    discount={finalDiscount.toString()}
                    receipt={formValues?.comprobante}
                    selectedClient={selectedClient}
                    totalInWords={totalInWords}
                    observation={formValues?.observaciones || formValues?.motivo}
                    retencionData={retencionData}
                />
            </div>

            {/* LEFT PANEL: PRODUCT CATALOG */}
            <div className="w-full md:w-[65%] flex flex-col gap-4 bg-white rounded-[24px] shadow-gray-200/50 h-auto min-h-[500px] md:h-full overflow-hidden border border-white">
                {/* Header: Search & Categories */}
                <div className="p-4 md:p-5 border-b border-gray-100">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-700 outline-none transition-all placeholder-gray-400 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                        </div>



                        <button
                            onClick={() => setIsOpenModalProduct(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold transition-all"
                            title="Crear producto nuevo"
                        >
                            <Icon icon="solar:add-circle-bold" className="text-xl" />
                            <span className="hidden md:inline">Producto</span>
                        </button>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-hide px-1">
                        <button
                            onClick={() => setSelectedCategoryId(0)}
                            className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${selectedCategoryId === 0 ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                        >
                            <span>TODOS</span>
                            <span className={`min-w-[24px] h-5 px-2 flex items-center justify-center rounded-full text-xs font-bold ${selectedCategoryId === 0 ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'}`}>
                                {totalProducts || 0}
                            </span>
                        </button>
                        {categories?.map((cat: any) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${selectedCategoryId === cat.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                            >
                                <span>{cat.nombre.toUpperCase()}</span>
                                <span className={`min-w-[24px] h-5 px-2 flex items-center justify-center rounded-full text-xs font-bold ${selectedCategoryId === cat.id ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'}`}>
                                    {cat._count?.productos || 0}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 scrollbar-thin">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3 md:gap-4">
                        {filteredProducts?.map((item: any) => (
                            <div
                                key={item.id}
                                className="group bg-white rounded-[20px] p-2 hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
                            >
                                {/* Image Container */}
                                <div className="aspect-[4/3] bg-[#F3F4F6] rounded-xl mb-2 overflow-hidden relative flex items-center justify-center">
                                    {item.imagenUrl ? (
                                        <img
                                            src={item.imagenUrl}
                                            alt={item.descripcion}
                                            className="w-full h-full object-contain p-2 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <Icon icon="solar:box-minimalistic-linear" className="text-3xl text-gray-300" />
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 flex flex-col justify-between px-1">
                                    <h4 className="font-bold text-gray-800 text-[13px] mb-2 line-clamp-2 leading-snug capitalize" style={{ textTransform: 'none' }}>
                                        {item.descripcion?.toLowerCase()}
                                    </h4>

                                    <div className="flex items-end justify-between gap-2">
                                        <div>
                                            <p className="text-base font-black text-gray-900 leading-none mb-0.5">
                                                S/{Number(item.precioUnitario).toFixed(2)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                Stock: {item.stock}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleProductClick(item)}
                                            className="p-2 bg-gray-900 hover:bg-black text-white rounded-lg transition-all active:scale-95 flex items-center justify-center"
                                        >
                                            <Icon icon="solar:add-circle-bold" className="text-lg" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
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


            {/* Floating Mobile Cart Toggle */}
            {
                isMobile && !showMobileCart && productsInvoice.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-[50] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between pb-8">
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs font-semibold">{productsInvoice.length} Items</span>
                            <span className="text-xl font-bold text-gray-900">S/ {totalAdjusted.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={() => setShowMobileCart(true)}
                            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors"
                        >
                            <Icon icon="solar:cart-large-minimalistic-bold" className="text-xl" />
                            Ver Pedido
                        </button>
                    </div>
                )
            }

            {/* RIGHT PANEL: CART / INVOICE */}
            <div className={`w-full md:w-[35%] flex-col h-auto md:h-full md:overflow-y-auto bg-white rounded-[24px] md:rounded-[32px] shadow-sm md:shadow-xl shadow-gray-200/50 overflow-hidden border border-white ${isMobile ? (showMobileCart ? 'fixed inset-0 z-[60] flex' : 'hidden') : 'flex'} md:flex`}>
                {/* Invoice Config Header */}
                <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            {/* Mobile Back Button */}
                            {isMobile && (
                                <button
                                    onClick={() => setShowMobileCart(false)}
                                    className="mr-2 p-2 -ml-2 text-gray-500 hover:text-gray-700 active:bg-gray-200 rounded-full"
                                >
                                    <Icon icon="solar:arrow-left-linear" className="text-2xl" />
                                </button>
                            )}
                            <div className="p-2 bg-gray-100 text-gray-900 rounded-xl">
                                <Icon icon="solar:bill-list-bold-duotone" className="text-xl" />
                            </div>
                            <h2 className="font-bold text-gray-800 text-lg">Detalle de Venta</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="col-span-2 flex items-center justify-center gap-3">
                            <Select
                                value={formValues?.comprobante}
                                isSearch options={comprobantesGenerar}
                                id="tipoDoc" name="comprobante"
                                error=""
                                onChange={handleChangeSelect}
                                label="Tipo Comprobante" isIcon icon="solar:file-text-linear"
                            />
                            {/* {dataReceipt?.serie && (
                                <div className="">
                                    <div className="">
                                        <div className="">
                                            <span className="">{dataReceipt?.serie}-{String(dataReceipt?.correlativo).padStart(8, '0')}</span>
                                        </div>
                                    </div>
                                </div>
                            )} */}
                        </div>



                        {/* Tipo de Operación y Detracción */}
                        {(!["NOTA DE CREDITO", "NOTA DE DEBITO", "COTIZACIÓN"].includes(formValues?.comprobante)) && (
                            <div className="col-span-2 space-y-2 mt-2">
                                <div>
                                    <Select
                                        value={tiposOperacion.find((op: any) => Number(op.id) === Number(formValues.motivoId))?.descripcion || ""}
                                        options={tiposOperacion.map((op: any) => ({ id: op.id, value: op.descripcion }))}
                                        label="Tipo de Operación"
                                        id="motivoId"
                                        name="motivo"
                                        onChange={(idVal, val, name, id) => {
                                            // Custom handler needed/wrapper because Select calls (id, value, name, idField)
                                            // And we need to trigger side effects like clearing detraction.
                                            // Original Select uses: onChange(item.id, item.value, name, idField);

                                            const newId = Number(idVal);
                                            const updatedForm = { ...formValues, motivoId: newId };

                                            const selectedOp = tiposOperacion.find(op => Number(op.id) === newId);

                                            // Reset detracción si cambia
                                            if (selectedOp?.codigo !== '0112') {
                                                setTipoDetraccionId(undefined);
                                                setMedioPagoDetraccionId(undefined);
                                                setPorcentajeDetraccion(0);
                                                setCuentaBancoNacion('');
                                            } else {
                                                // Si es Sujeta a Detraccion (0112), abrir modal automáticamente
                                                setIsModalDetraccionOpen(true);
                                            }
                                            // Reset retención si cambia
                                            setRetencionData(null);
                                            setFormValues(updatedForm); // Update form directly or via handleChangeSelect if prefer single path
                                        }}
                                        error=""
                                        isIcon
                                        icon="solar:bill-list-linear"
                                        isSearch
                                    />
                                </div>

                                {/* Panel Detracción Compacto */}
                                {selectOperation?.codigo === '0112' && (
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalDetraccionOpen(true)}
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
                                        {tipoDetraccionId && (
                                            <div className="flex items-center justify-between bg-green-50 p-2.5 rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-center gap-2">
                                                    <Icon icon="solar:check-circle-bold" className="text-green-600" width={18} />
                                                    <span className="text-xs font-medium text-green-700">
                                                        {tiposDetraccion.find(t => t.id === tipoDetraccionId)?.descripcion || 'Configurado'}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold text-green-800">S/ {montoDetraccion.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Botón Retención 3% (Si NO es Detracción, monto >= 700 y es Agente de Retención) */}
                        {selectOperation?.codigo !== "0112" && totalAdjusted >= 700 && auth?.empresa?.esAgenteRetencion && (
                            <div className="mt-0 col-span-2 mb-0 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalRetencionOpen(true)}
                                        className="w-full p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl border-2 border-gray-300 flex items-center justify-between group transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-gray-900 rounded-lg group-hover:scale-110 transition-transform">
                                                <Icon icon="solar:percent-circle-bold" className="text-white" width={16} />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">Configurar Retención 3%</span>
                                        </div>
                                        <Icon icon="solar:alt-arrow-right-linear" className="text-gray-900 group-hover:translate-x-1 transition-transform" width={18} />
                                    </button>

                                    {retencionData && (
                                        <div className="flex items-center justify-between bg-gray-100 p-2.5 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center gap-2">
                                                <Icon icon="solar:check-circle-bold" className="text-gray-900" width={18} />
                                                <span className="text-xs font-medium text-gray-900">Reg. Retenciones del IGV (3%)</span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-900">Retención: S/ {retencionData.montoDetraccion?.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {isQuotationRoute && (
                            <div className="col-span-2 flex items-center gap-2 pt-0">
                                <input
                                    type="checkbox"
                                    id="includeImages"
                                    checked={includeProductImages}
                                    onChange={(e) => setIncludeProductImages(e.target.checked)}
                                    className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-900"
                                    style={{ accentColor: '#1C1C24' }}
                                />
                                <label htmlFor="includeImages" className="text-sm font-medium text-gray-700 cursor-pointer select-none flex items-center gap-1">
                                    <Icon icon="solar:gallery-bold-duotone" className="text-gray-900" />
                                    Incluir imágenes del producto
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Cliente - Solo mostrar cuando NO es nota de crédito/débito */}
                    {formValues?.comprobante !== "NOTA DE CREDITO" && formValues?.comprobante !== "NOTA DE DEBITO" && (
                        <div className="flex gap-2 justify-between items-center">
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
                            <button onClick={() => setIsOpenModalClient(true)} className="px-4 py-3 relative top-2 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 border border-gray-300 transition-colors shadow-sm">
                                <Icon icon="solar:user-plus-bold" className="text-xl" />
                            </button>
                        </div>
                    )}

                    {/* Sección para NOTA DE CRÉDITO / DÉBITO - Mejorada */}
                    {(formValues?.comprobante === "NOTA DE CREDITO" || formValues?.comprobante === "NOTA DE DEBITO") && (
                        <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                                <div className="p-1.5 bg-amber-100 rounded-lg">
                                    <Icon icon="solar:file-check-bold-duotone" className="text-amber-600" width={18} />
                                </div>
                                <h4 className="font-bold text-gray-700 text-sm">Documento a Modificar</h4>
                            </div>

                            {/* Grid de campos */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-1">
                                    <Select
                                        label="Tipo Documento"
                                        value={receiptsToNote.find(r => r.id === receiptNoteId)?.value || ""}
                                        options={receiptsToNote.map((r: any) => ({ id: r.id, value: r.value }))}
                                        id="receiptNoteId"
                                        name="receiptNoteId"
                                        onChange={(id, val) => setReceiptNoteId(id)}
                                        error=""
                                        isIcon icon="solar:file-text-linear"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <Select
                                        label="Motivo / Operación"
                                        value={((typesOperation as any[])?.find((op: any) => op.id === Number(formValues.motivoId))?.descripcion) || ""}
                                        options={(typesOperation as any[])?.map((item: any) => ({ id: item.id, value: item.descripcion })) || []}
                                        id="motivoId"
                                        name="motivo"
                                        onChange={(idValue, val) => {
                                            const selectedId = Number(idValue);
                                            const selected: any = typesOperation?.find((op: any) => op.id === selectedId);
                                            if (selected) {
                                                handleChangeSelect(selectedId, selected.descripcion, 'motivo', 'motivoId');
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
                                        value={serie}
                                        onChange={(e) => setSerie(e.target.value.toUpperCase())}
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
                                            value={correlative}
                                            onChange={(e) => setCorrelative(e.target.value)}
                                            name="correlative"
                                            placeholder="00000001"
                                            isLabel
                                            type="number"
                                        />
                                    </div>
                                    <button
                                        onClick={() => getInvoiceBySerieCorrelative(serie.toUpperCase(), correlative, formValues.motivoId)}
                                        className="absolute right-0 bottom-0 h-[46px] w-[46px] flex items-center justify-center bg-gray-900 hover:bg-black text-white rounded-xl transition-all active:scale-95"
                                        title="Buscar Documento"
                                    >
                                        <Icon icon="solar:magnifer-bold" className="text-xl" />
                                    </button>
                                </div>
                            </div>

                            {/* Info Documento Encontrado */}
                            {invoiceData && (
                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <Icon icon="solar:check-circle-bold" className="text-emerald-500" width={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-700 text-sm">{invoiceData?.serie}-{String(invoiceData?.correlativo).padStart(8, '0')}</div>
                                            <div className="text-[11px] text-emerald-600 font-medium truncate max-w-[150px]">{invoiceData?.cliente?.nombre}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total</span>
                                        <div className="font-black text-gray-800 text-lg leading-none">S/ {Number(invoiceData?.mtoImpVenta || 0).toFixed(2)}</div>
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
                            <div key={index} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-dashed border-gray-200 hover:border-gray-900/30 transition-colors group">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {item.imagenUrl ? <img src={item.imagenUrl} className="w-full h-full object-contain rounded-lg" /> : <Icon icon="solar:box-linear" className="text-gray-400" />}
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
                                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-gray-900"
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
                                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-gray-900"
                                    >
                                        <Icon icon="solar:add-circle-linear" />
                                    </button>
                                </div>

                                <div className="text-right min-w-[60px]">
                                    <p className="font-bold text-gray-900">S/ {Number(item.total).toFixed(2)}</p>
                                </div>

                                <button onClick={() => setEditingIndex(index)} className="text-gray-900/50 hover:text-gray-900 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2">
                                    <Icon icon="solar:pen-new-square-linear" width={20} />
                                </button>
                                <button onClick={() => deleteProductInvoice(item)} className="text-red-400 hover:text-red-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2">
                                    <Icon icon="hugeicons:delete-02" width={20} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Calculations Section */}
                <div className="p-5 pt-2 bg-gray-50 border-t border-gray-100">
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

                        {/* Adelanto field for NP and OT */}
                        {(formValues.tipoDoc === 'NP' || formValues.tipoDoc === 'OT') && !isQuotationRoute && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <label className="text-xs font-medium text-gray-700 block mb-1">
                                    Adelanto (opcional)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                                    <input
                                        type="number"
                                        value={adelanto || ''}
                                        onChange={(e) => setAdelanto(Number(e.target.value) || 0)}
                                        placeholder="0.00"
                                        step="0.01"
                                        max={totalAdjusted}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                                    />
                                </div>
                                {adelanto > 0 && (
                                    <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Saldo pendiente:</span>
                                            <span className="font-bold text-orange-600">
                                                S/ {Math.max(0, totalAdjusted - adelanto).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quotation-specific fields - Collapsible */}
                    {isQuotationRoute && (
                        <div className="border-t">
                            <button
                                onClick={() => setIsQuotationConfigModalOpen(true)}
                                className="w-full flex items-center justify-between py-2 px-1 hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    <Icon icon="solar:settings-bold-duotone" className="text-gray-900" />
                                    Configuración Cotización
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Payment Methods */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Metodo de Pago</label>
                        <div className="grid grid-cols-4 gap-2">
                            {metodosContado.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setPaymentMethod(m)}
                                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${paymentMethod === m ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {isQuotationRoute && (
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
                            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <Icon icon="solar:eye-linear" className="text-lg" />
                            PREVIA
                        </button>
                        <button onClick={addInvoiceReceipt} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 text-sm">
                            <Icon icon="solar:printer-minimalistic-bold" className="text-lg" />
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

            <ModalDetraccion
                isOpen={isModalDetraccionOpen}
                onClose={() => setIsModalDetraccionOpen(false)}
                onSave={handleSaveDetraccion}
                initialData={tipoDetraccionId ? {
                    tipoDetraccionId: tipoDetraccionId || 0,
                    medioPagoDetraccionId: medioPagoDetraccionId || 0,
                    cuentaBancoNacion: cuentaBancoNacion || '',
                    porcentajeDetraccion: porcentajeDetraccion || 0,
                    montoDetraccion: montoDetraccion || 0,
                    formaPago: formValues.medioPago as 'Contado' | 'Credito' || 'Contado',
                    cuotas: cuotas || [],
                } : null}
                totalFactura={total || 0}
                tiposDetraccion={tiposDetraccion}
                mediosPagoDetraccion={mediosPagoDetraccion}
            />
            <ModalDetraccion
                isOpen={isModalRetencionOpen}
                onClose={() => setIsModalRetencionOpen(false)}
                onSave={handleSaveRetencion}
                totalFactura={totalAdjusted}
                tiposDetraccion={tiposDetraccion}
                mediosPagoDetraccion={mediosPagoDetraccion}
                initialData={retencionData}
                mode="RETENCION"
            />

            {/* Modal de Configuración de Cotización */}
            <ModalConfiguracionCotizacion
                isOpen={isQuotationConfigModalOpen}
                onClose={() => setIsQuotationConfigModalOpen(false)}
                onSave={handleSaveQuotationConfig}
                initialConfig={{
                    includeProductImages,
                    quotationDiscount,
                    quotationValidity,
                    quotationSignature,
                    quotationTerms,
                    quotationPaymentType,
                    quotationAdvance,
                    observaciones: formValues.observaciones
                }}
            />
        </div >
    )
}

export default Invoice;