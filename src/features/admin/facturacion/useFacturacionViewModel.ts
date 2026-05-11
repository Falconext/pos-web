import { ChangeEvent, useEffect, useState, useMemo, useRef } from "react";
import { IInvoicesState, useInvoiceStore } from "@/zustand/invoices";
import { IExtentionsState, useExtentionsStore } from "@/zustand/extentions";
import { IClientsState, useClientsStore } from "@/zustand/clients";
import { IProductsState, useProductsStore } from "@/zustand/products";
import { ICategoriesState, useCategoriesStore } from "@/zustand/categories";
import { IFormInvoice } from "@/interfaces/invoices";
import { numberToWords } from "@/utils/numberToLetters";
import { calculateTotals } from "@/utils/calculateTotals";
import useAlertStore from "@/zustand/alert";
import { useAuthStore } from "@/zustand/auth";
import { IFormClient } from "@/interfaces/clients";
import { IFormProduct } from "@/interfaces/products";
import { formatISO, parse } from 'date-fns';
import { useDebounce } from "@/hooks/useDebounce";
import { useNavigate, useLocation } from "react-router-dom";
import { get } from "@/utils/fetch";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useThemeStore } from "@/zustand/theme";
import QRCode from 'qrcode';
import { DetraccionData } from "@/pages/admin/facturacion/ModalDetraccion";
import { QuotationConfig } from "@/pages/admin/facturacion/ModalConfiguracionCotizacion";

import {
    tiposComprobanteFormales,
    tiposComprobantesInformales,
    tiposCotizacion,
    metodosContado,
    metodosCredito
} from "./FacturacionModel";

export const useFacturacionViewModel = () => {
    const { receipt, importReference, addInformalInvoice, addProductsInvoice, updateProductInvoice, productsInvoice, getInvoiceBySerieCorrelative, resetProductInvoice, invoiceData, deleteProductInvoice, addInvoice, dataReceipt, resetInvoice, getSerieAndCorrelativeByReceipt, updateQuotation }: IInvoicesState = useInvoiceStore();
    const { isCompact } = useThemeStore();
    const { auth, sedeActiva } = useAuthStore();
    const { categories, getAllCategories }: ICategoriesState = useCategoriesStore();
    const { getAllClients, clients }: IClientsState = useClientsStore();
    const { getAllProducts, products, totalProducts }: IProductsState = useProductsStore();
    const { getCreditDebitNoteTypes, getCurrencies, creditDebitNoteTypes, getDocumentTypes }: IExtentionsState = useExtentionsStore();

    const location = useLocation();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const isQuotationRoute = location.pathname.includes('/cotizaciones/nuevo');
    const tiposInformales = ['TICKET', 'NV', 'RH', 'CP', 'NP', 'OT', 'COT'];
    const tipoEmpresa = auth?.empresa?.tipoEmpresa || "";

    // POS STATES
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Barcode scanner state
    const [barcodeInput, setBarcodeInput] = useState('');
    const [barcodeLoading, setBarcodeLoading] = useState(false);
    const [barcodeError, setBarcodeError] = useState(false);
    const barcodeRef = useRef<HTMLInputElement>(null);

    const _stateDefaultType = (location.state as any)?.defaultType as string | undefined;
    const _tipoDocInitMap: Record<string, string> = {
        'FACTURA': '01', 'BOLETA': '03',
        'TICKET': 'TICKET', 'NP': 'NP', 'OT': 'OT',
        'NV': 'NV', 'RH': 'RH', 'CP': 'CP',
        'NOTA DE PEDIDO': 'NP',
    };
    const _comprobanteLabelInitMap: Record<string, string> = { NP: 'NOTA DE PEDIDO' };

    const initialDocumentType = isQuotationRoute
        ? "COTIZACIÓN"
        : (_stateDefaultType
            ? (_comprobanteLabelInitMap[_stateDefaultType] ?? _stateDefaultType)
            : (receipt === ""
                ? (tipoEmpresa === "INFORMAL" ? "TICKET" : "FACTURA")
                : receipt.toUpperCase()));

    const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo');
    const [adelanto, setAdelanto] = useState<number>(0);
    const [fechaRecojo, setFechaRecojo] = useState<string>('');
    const [adelantoError, _setAdelantoError] = useState<string>('');

    const initFormValues: IFormInvoice = {
        clienteId: 0,
        currencyCode: "PEN",
        clienteNombre: "",
        comprobante: initialDocumentType,
        tipoDoc: isQuotationRoute ? "COT" : (_stateDefaultType ? (_tipoDocInitMap[_stateDefaultType] ?? '01') : (tipoEmpresa === "INFORMAL" && initialDocumentType === "TICKET" ? "TICKET" : initialDocumentType === "NOTA DE CREDITO" ? "07" : initialDocumentType === "NOTA DE DEBITO" ? "08" : initialDocumentType === "BOLETA" ? "03" : "01")),
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
        id: 0, nombre: "", nroDoc: "", direccion: "", departamento: "", distrito: "", provincia: "", persona: "CLIENTE", ubigeo: "", email: "", telefono: "", tipoDoc: "", estado: "", tipoDocumentoId: 0, empresaId: 0, tipoDocumento: { codigo: "", descripcion: "", id: 0 }
    }

    const initialFormProduct: IFormProduct = {
        productoId: 0, descripcion: "", categoriaId: 0, precioUnitario: 0, categoriaNombre: "", afectacionNombre: "Gravado – Operación Onerosa", tipoAfectacionIGV: "10", stock: 50, codigo: "", unidadMedidaId: 1, unidadMedidaNombre: "UNIDAD", estado: "", codigoBarras: ""
    }

    const [formValuesProduct, setFormValuesProduct] = useState<IFormProduct>(initialFormProduct);
    const [formValuesClient, setFormValuesClient] = useState<IFormClient>(initialFormClient);
    const [formValues, setFormValues] = useState<IFormInvoice>(initFormValues);

    const [selectedProduct, setSelectProduct] = useState<any>(null);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [receiptNoteId, setReceiptNoteId] = useState<string>("01")
    const [pay, setPay] = useState<number>(0);
    const [_change, setChange] = useState<number>(0);
    const [receiptNote, setReceiptNote] = useState<string>("FACTURA")
    const [serie, setSerie] = useState<string>("");
    const [IsOpenModalSuccessInvoice, setIsOpenModalSuccessInvoice] = useState<boolean>(false);
    const [isComprobantePendiente, setIsComprobantePendiente] = useState<boolean>(false);
    const [correlative, setCorrelative] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [descountGlobal, _setDescountGlobal] = useState<number>(0)
    const [errors, setErrors] = useState({ observaciones: "" });
    const [errorsProduct, setErrorsProduct] = useState({ codigo: "", descripcion: "", categoriaId: 0, description: "", precioUnitario: "", stock: "", unidadMedida: "" });
    const [errorsClient, setErrorsClient] = useState({ nombre: "", nroDoc: "", direccion: "", departamento: "", distrito: "", provincia: "", ubigeo: "", email: "", telefono: "", estado: "", tipoDocumentoId: 0, empresaId: 0 });

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

    const [isOpenModalClient, setIsOpenModalClient] = useState<boolean>(false);
    const [isOpenModalProduct, setIsOpenModalProduct] = useState<boolean>(false);
    const [editingIndex, setEditingIndex] = useState<number>(-1);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    const [printSize, setPrintSize] = useState(isQuotationRoute ? "A4" : "TICKET");
    const [includeProductImages, setIncludeProductImages] = useState(isQuotationRoute);

    // Quotation-specific states
    const [quotationDiscount, setQuotationDiscount] = useState(0);
    const [quotationValidity, setQuotationValidity] = useState(7);
    const [quotationSignature, setQuotationSignature] = useState('');
    const [quotationTerms, setQuotationTerms] = useState('');
    const [quotationPaymentType, setQuotationPaymentType] = useState('CONTADO');
    const [quotationAdvance, setQuotationAdvance] = useState(0);
    const [isQuotationConfigModalOpen, setIsQuotationConfigModalOpen] = useState(false);
    const [hasOpenedConfigModal, setHasOpenedConfigModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editQuotationId, setEditQuotationId] = useState<number | null>(null);

    const debounceSerie = useDebounce(serie, 200);
    const debounceCorrelative = useDebounce(correlative, 200);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Load Masters
    useEffect(() => {
        const loadMasters = async () => {
            try {
                const rOps: any = await get('comprobante/tipo-operacion');
                const opsData = (rOps && Array.isArray(rOps)) ? rOps : (rOps?.data || []);
                if (Array.isArray(opsData)) {
                    setTiposOperacion(opsData);
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
    }, [formValues.comprobante]);

    // Pagination calculations
    const totalPages = Math.ceil((totalProducts || 0) / limit);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    const indexOfLastItem = page * limit;
    const indexOfFirstItem = indexOfLastItem - limit;

    useEffect(() => { setPage(1) }, [selectedCategoryId, debouncedSearchTerm]);

    // Server Fetch Logic
    useEffect(() => {
        const params: any = { page, limit };
        if (debouncedSearchTerm) params.search = debouncedSearchTerm;
        if (selectedCategoryId !== 0) params.categoriaId = selectedCategoryId;
        if (sedeActiva?.id) params.sedeId = sedeActiva.id;

        getAllProducts(params, () => { }, true);
    }, [page, limit, debouncedSearchTerm, selectedCategoryId, sedeActiva?.id]);

    // Initial Data Fetching for POS
    useEffect(() => {
        getAllCategories({});
        getCreditDebitNoteTypes();
        getCurrencies();
        getDocumentTypes();

        if (receipt === undefined) {
            resetInvoice();
        }
    }, [])

    useEffect(() => {
        const state = location.state as any;
        const defaultType = state?.defaultType as string | undefined;
        const defaultClient = state?.defaultClient as string | undefined;

        if (defaultType && !isQuotationRoute) {
            const tipoDocMap: Record<string, string> = {
                'FACTURA': '01', 'BOLETA': '03',
                'TICKET': 'TICKET', 'NP': 'NP', 'OT': 'OT',
                'NV': 'NV', 'RH': 'RH', 'CP': 'CP',
                'NOTA DE PEDIDO': 'NP',
            };

            const comprobanteLabelMap: Record<string, string> = {
                NP: 'NOTA DE PEDIDO',
            };

            const resolvedComprobante = comprobanteLabelMap[defaultType] ?? defaultType;

            setFormValues(prev => ({
                ...prev,
                comprobante: resolvedComprobante,
                tipoDoc: tipoDocMap[defaultType] ?? '01',
            }));

            if (defaultClient === 'CLIENTES_VARIOS') {
                const clientSelect: any = clients?.find((item: any) => "10000000" === item.nroDoc);
                if (clientSelect) {
                    setSelectedClient(clientSelect);
                    setFormValues(prev => ({
                        ...prev,
                        clienteId: Number(clientSelect.id) || 0,
                        clienteNombre: "CLIENTES VARIOS"
                    }));
                } else {
                    setSelectedClient({ nroDoc: "10000000", nombre: "CLIENTES VARIOS" });
                    setFormValues(prev => ({
                        ...prev,
                        clienteId: 0,
                        clienteNombre: "CLIENTES VARIOS"
                    }));
                }
            }
            return;
        }

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

    useEffect(() => {
        if (isQuotationRoute) {
            setPrintSize("A4");
        } else {
            setPrintSize("TICKET");
        }
    }, [isQuotationRoute]);

    // Loading from Quotation Convert / Edit
    useEffect(() => {
        const state = location.state as any;
        if (state?.fromQuotation && state?.quotationData) {
            const { cliente, productos, observaciones, ...cotizConfig } = state.quotationData;

            if (cliente) {
                setSelectedClient(cliente);
                setFormValues(prev => ({
                    ...prev,
                    clienteId: cliente.id,
                    clienteNombre: `${cliente.nroDoc}-${cliente.nombre}`
                }));
            }
            if (productos && Array.isArray(productos)) {
                const productosConvertidos = productos.map((det: any) => {
                    const prodId = det.producto?.id || det.productoId;
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
                        imagenUrl: productoEnCatalogo?.imagenUrl || null,
                    };
                });
                resetProductInvoice();
                productosConvertidos.forEach(prod => addProductsInvoice(prod));
            }

            if (observaciones) {
                setFormValues(prev => ({ ...prev, observaciones }));
            }

            if (state.isEdit && state.quotationId) {
                setIsEditMode(true);
                setEditQuotationId(state.quotationId);
                setHasOpenedConfigModal(true); // evita que el modal de config se abra automáticamente
                if (cotizConfig.cotizIncluirImagenes !== undefined) setIncludeProductImages(cotizConfig.cotizIncluirImagenes);
                if (cotizConfig.cotizDescuento !== undefined) setQuotationDiscount(cotizConfig.cotizDescuento);
                if (cotizConfig.cotizVigencia !== undefined) setQuotationValidity(cotizConfig.cotizVigencia);
                if (cotizConfig.cotizFirmante !== undefined) setQuotationSignature(cotizConfig.cotizFirmante);
                if (cotizConfig.cotizTerminos !== undefined) setQuotationTerms(cotizConfig.cotizTerminos);
                if (cotizConfig.cotizTipoPago !== undefined) setQuotationPaymentType(cotizConfig.cotizTipoPago);
                if (cotizConfig.cotizAdelanto !== undefined) setQuotationAdvance(cotizConfig.cotizAdelanto);
            }

            window.history.replaceState({}, document.title);
        } else if (state?.fromCreditNote && state?.creditNoteData) {
            const { comprobanteReemplazar, serieReemplazar, correlativoReemplazar } = state.creditNoteData;

            // Setear la Nota de Crédito directamente
            setFormValues(prev => ({
                ...prev,
                comprobante: "NOTA DE CREDITO",
                tipoDoc: "07",
                motivoId: 1 // 1: Anulación de la operación
            }));

            // Preelegir si afecta a Factura o Boleta
            setReceiptNoteId(comprobanteReemplazar === 'FACTURA' ? '01' : '03');

            // Prellenar serie y correlativo a buscar con timeout para evitar el reset por useEffect
            setTimeout(() => {
                setSerie(serieReemplazar);
                setCorrelative(correlativoReemplazar);
                // Llamar automáticamente a la búsqueda del documento
                getInvoiceBySerieCorrelative(serieReemplazar, correlativoReemplazar, 1);
            }, 500);

            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (["NOTA DE CREDITO", "NOTA DE DEBITO"].includes(formValues?.comprobante)) {
            getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc, receiptNoteId);
        } else {
            setSerie("");
            setCorrelative("");
            getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc);

            if (formValues?.comprobante === "BOLETA" || formValues?.comprobante === "NOTA DE PEDIDO") {
                const clientSelect: any = clients?.find((item: any) => "10000000" === item.nroDoc);
                if (clientSelect) {
                    setSelectedClient(clientSelect)
                    setFormValues(prev => ({ ...prev, clienteId: Number(clientSelect.id) || 0, clienteNombre: "CLIENTES VARIOS" }))
                } else {
                    setSelectedClient({ nroDoc: "10000000", nombre: "CLIENTES VARIOS" })
                    setFormValues(prev => ({ ...prev, clienteId: 0, clienteNombre: "CLIENTES VARIOS" }))
                }
            } else if (formValues?.comprobante === "FACTURA") {
                setFormValues(prev => ({ ...prev, clienteId: 0, clienteNombre: "" }))
                setSelectedClient(null);
            }
        }
    }, [formValues.comprobante, receiptNoteId]);

    let comprobantesGenerar = isQuotationRoute
        ? tiposCotizacion
        : (tipoEmpresa === "INFORMAL" ? tiposComprobantesInformales : tipoEmpresa === "FORMAL" ? tiposComprobanteFormales : tiposComprobanteFormales.concat(tiposComprobantesInformales))

    useEffect(() => {
        if (!formValues.currencyCode) setFormValues({ ...formValues, currencyCode: "PEN" })
    }, [])

    useEffect(() => {
        if (isQuotationRoute && !hasOpenedConfigModal) {
            setIsQuotationConfigModalOpen(true);
            setHasOpenedConfigModal(true);
        }
    }, [isQuotationRoute, hasOpenedConfigModal]);

    // Product Adding logic
    const normalizeWholesaleUnitPrice = (basePrice: number, rule: { cantidadMinima: number; precio: number }) => {
        const minQty = Number(rule.cantidadMinima);
        const rulePrice = Number(rule.precio);

        if (!Number.isFinite(rulePrice) || rulePrice <= 0) return basePrice;
        if (Number.isFinite(basePrice) && basePrice > 0 && minQty > 1 && rulePrice > basePrice) {
            return Number((rulePrice / minQty).toFixed(6));
        }
        return rulePrice;
    };

    const getApplicablePrice = (item: any, qty: number): number => {
        const base = Number(item.precioBase ?? item.precioUnitario ?? 0);
        if (!Number.isFinite(base) || base <= 0) return 0;

        const parsedQty = Number(qty);
        if (!Number.isFinite(parsedQty) || parsedQty <= 0) return base;

        const rules = (item.preciosMayorista ?? [])
            .map((r: { cantidadMinima: number; precio: number }) => ({
                cantidadMinima: Number(r.cantidadMinima),
                precioUnitario: normalizeWholesaleUnitPrice(base, r),
            }))
            .filter((r: { cantidadMinima: number; precioUnitario: number }) =>
                Number.isFinite(r.cantidadMinima) &&
                r.cantidadMinima > 0 &&
                Number.isFinite(r.precioUnitario) &&
                r.precioUnitario > 0,
            );

        if (!rules.length) return base;

        const applicable = rules
            .filter((r: { cantidadMinima: number; precioUnitario: number }) => parsedQty >= r.cantidadMinima)
            .sort((a: { cantidadMinima: number }, b: { cantidadMinima: number }) => b.cantidadMinima - a.cantidadMinima)[0];

        return applicable ? applicable.precioUnitario : base;
    };

    const calculateLineItem = (item: any, newQuantity: number) => {
        const price = getApplicablePrice(item, newQuantity);
        const subtotal = price * newQuantity;
        return {
            cantidad: newQuantity,
            cantidadOriginal: newQuantity,
            precioUnitario: price,
            total: subtotal.toFixed(2),
            sale: (subtotal / 1.18).toFixed(2),
            igv: (subtotal - subtotal / 1.18).toFixed(2)
        };
    };

    const handleProductClick = (product: any) => {
        const existingIndex = productsInvoice.findIndex((p: any) => p.id === product.id);

        if (existingIndex >= 0) {
            const currentItem = productsInvoice[existingIndex];
            const newQty = Number(currentItem.cantidad) + 1;
            if (product.stock < newQty) {
                return useAlertStore.getState().alert("Stock insuficiente", "warning");
            }
            updateProductInvoice(existingIndex, calculateLineItem(currentItem, newQty));
        } else {
            if (product.stock < 1) {
                return useAlertStore.getState().alert("Sin stock", "warning");
            }
            const base = product.precioUnitario;
            const priceForQty1 = getApplicablePrice({ precioBase: base, preciosMayorista: product.preciosMayorista }, 1);
            addProductsInvoice({
                ...product,
                precioBase: base,
                precioUnitario: priceForQty1,
                unidadMedida: product?.unidadMedida?.nombre
            });
        }
    }

    const handleBarcodeScan = async (codigo: string) => {
        const trimmed = codigo.trim();
        if (!trimmed) return;
        
        setBarcodeLoading(true);
        setBarcodeError(false);
        
        try {
            const resp: any = await get(`producto/barcode/${encodeURIComponent(trimmed)}`);
            if (resp.id) { // Backend returns product directly or error
                handleProductClick(resp);
                setBarcodeInput('');
                // Success beep logic could go here
            } else {
                handleBarcodeNotFound(trimmed);
            }
        } catch (error: any) {
            console.error('Error scanning barcode:', error);
            handleBarcodeNotFound(trimmed);
        } finally {
            setBarcodeLoading(false);
            barcodeRef.current?.focus();
        }
    };

    const handleBarcodeNotFound = (barcode: string) => {
        setBarcodeError(true);
        setBarcodeInput('');
        
        // Alerta con opción de creación rápida
        useAlertStore.getState().alert(
            `Código ${barcode} no encontrado. ¿Deseas crear el producto?`, 
            'warning'
        );
        
        // Pre-configurar el formulario de producto con el código escaneado
        setFormValuesProduct({
            ...initialFormProduct,
            codigoBarras: barcode,
            // Intentar generar un código correlativo para el SKU
            codigo: "" 
        });

        // Opcional: Podríamos abrir el modal automáticamente después de un delay
        // o dejar que el usuario haga clic en el botón de "Producto"
        // Por ahora, lo dejaremos listo en el formValuesProduct.
        
        setTimeout(() => setBarcodeError(false), 2000);
    };

    const handleSelectWholesaleTier = (index: number, tier: { cantidadMinima: number; precio: number } | null) => {
        const item = productsInvoice[index];
        const qty = Number(item.cantidad);
        const price = tier ? Number(tier.precio) : Number(item.precioBase ?? item.precioUnitario);
        const subtotal = price * qty;
        updateProductInvoice(index, {
            precioUnitario: price,
            total: subtotal.toFixed(2),
            sale: (subtotal / 1.18).toFixed(2),
            igv: (subtotal - subtotal / 1.18).toFixed(2),
            _tierOverride: tier ? tier.cantidadMinima : null,
        });
    };

    const handleSaveEdit = (newItem: any) => {
        if (editingIndex === -1) return;
        const qty = Number(newItem.cantidad);
        const price = Number(newItem.precioUnitario);
        const subtotal = price * qty;
        const descuento = Number(newItem.descuento || 0);
        const totalConDescuento = subtotal * (1 - descuento / 100);

        updateProductInvoice(editingIndex, {
            ...newItem,
            precioUnitario: price,
            total: totalConDescuento.toFixed(2),
            sale: (totalConDescuento / 1.18).toFixed(2),
            igv: (totalConDescuento - totalConDescuento / 1.18).toFixed(2)
        });
        setEditingIndex(-1);
    };

    const handleSaveRetencion = (data: any) => {
        setRetencionData(data);
        const formaPagoUpper = data.formaPago?.toUpperCase() || 'CONTADO';
        setFormValues(prev => ({
            ...prev,
            medioPago: formaPagoUpper,
            cuotas: data.cuotas ? data.cuotas.map((c: any) => ({
                monto: c.monto,
                fechaVencimiento: c.fechaVencimiento
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
        if (data.formaPago) {
            setFormValues(prev => ({ ...prev, medioPago: data.formaPago || 'Contado' }));
        }
    };

    const handleSaveQuotationConfig = (config: QuotationConfig) => {
        setIncludeProductImages(config.includeProductImages);
        setQuotationDiscount(config.quotationDiscount);
        setQuotationValidity(config.quotationValidity);
        setQuotationSignature(config.quotationSignature);
        setQuotationTerms(config.quotationTerms);
        setQuotationPaymentType(config.quotationPaymentType);
        setQuotationAdvance(config.quotationAdvance);
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

        if (id === 'motivoId' || name === 'motivo') {
            const motivo: any = tiposOperacion.find((item: any) => Number(item.id) === Number(idValue));
            updatedFormValues.motivoId = motivo?.id;
        }

        setFormValues(updatedFormValues);
    };

    useEffect(() => {
        if (selectedProduct !== null && selectedProduct !== undefined) {
            addProductsInvoice({
                ...selectedProduct,
                unidadMedida: selectedProduct?.unidadMedida?.nombre
            })
            setSelectProduct(null);
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

    const validateForm = () => {
        const newErrors: any = {
            observaciones: formValues.motivoId === 2 ? (formValues.observaciones.trim() !== "" ? "" : "Escriba la observación") : "",
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error);
    };

    const addInvoiceReceipt = async () => {
        if (!validateForm()) return;
        if (formValues?.comprobante === "FACTURA" && selectedClient?.nroDoc.length !== 11) {
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

        if (selectedOperacion?.codigo === '0112') {
            if (!tipoDetraccionId || !cuentaBancoNacion || !porcentajeDetraccion || !montoDetraccion) {
                return useAlertStore.getState().alert("Para operación sujeta a detracción, DEBE configurar la detracción (Cuenta, % y Monto).", "error");
            }
            if (totalAdjusted < 700) {
                return useAlertStore.getState().alert("La detracción solo aplica para montos mayores a S/ 700.00", "error");
            }
        }

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
            cotizIncluirImagenes: isQuotationRoute ? includeProductImages : undefined,
            cotizDescuento: isQuotationRoute ? quotationDiscount : undefined,
            cotizVigencia: isQuotationRoute ? quotationValidity : undefined,
            cotizFirmante: isQuotationRoute ? quotationSignature : undefined,
            cotizTerminos: isQuotationRoute ? quotationTerms : undefined,
            cotizTipoPago: isQuotationRoute ? quotationPaymentType : undefined,
            cotizAdelanto: isQuotationRoute ? quotationAdvance : undefined,
            ...(selectedOperacion?.codigo === '0112' && !retencionData ? {
                tipoDetraccionId: tipoDetraccionId || undefined,
                medioPagoDetraccionId: medioPagoDetraccionId || undefined,
                cuentaBancoNacion: cuentaBancoNacion || undefined,
                porcentajeDetraccion: porcentajeDetraccion > 0 ? porcentajeDetraccion : undefined,
                montoDetraccion: montoDetraccion > 0 ? montoDetraccion : undefined,
                cuotas: cuotas.length > 0 ? cuotas : undefined,
            } : {}),
            ...(retencionData ? {
                retencionMonto: retencionData.montoDetraccion,
                retencionPorcentaje: retencionData.porcentajeDetraccion,
                cuotas: formValues.cuotas && formValues.cuotas.length > 0 ? formValues.cuotas : undefined,
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

        let result: { success: boolean; error?: string };
        if (isEditMode && editQuotationId) {
            result = await updateQuotation(editQuotationId, finalData);
        } else if (tiposInformales.includes(formValues.tipoDoc)) {
            result = await addInformalInvoice(finalData);
        } else {
            result = await addInvoice(finalData);
        }

        if (result.success === true) {
            setIsComprobantePendiente(!!(result as any).pendiente);
            setIsLoading(false);
        } else {
            setIsOpenModalSuccessInvoice(false);
            setIsLoading(false);
        }
    };

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

    const getDocumentInvoice = async () => {
        const result = await getInvoiceBySerieCorrelative(debounceSerie.toUpperCase(), debounceCorrelative, formValues.motivoId);
        if (result.error) return useAlertStore.getState().alert(`${result.error}`, 'error');
    }

    const closeModal = () => {
        setIsOpenModalClient(false);
        setIsOpenModalProduct(false)
    }

    const ruc = auth?.empresa?.ruc || auth?.empresa?.nroDoc || "";
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

    useEffect(() => {
        if (!ruc) return;
        const generateQR = async () => {
            try {
                const dataUrl = await QRCode.toDataURL(ruc);
                setQrCodeDataUrl(dataUrl);
            } catch (e) { }
        };
        generateQR();
    }, [ruc]);

    const [dimensions, setDimensions] = useState({ width: 80, height: 297 });

    useEffect(() => {
        switch (printSize) {
            case 'TICKET': setDimensions({ width: 80, height: 297 }); break;
            case 'A5': setDimensions({ width: 148, height: 210 }); break;
            case 'A4': setDimensions({ width: 210, height: 297 }); break;
        }
    }, [printSize]);

    const selectOperation = tiposOperacion.find(op => op.id === formValues.motivoId);

    useEffect(() => {
        if (totalAdjusted < 700 && retencionData) {
            setRetencionData(null);
            return;
        }
        if (totalAdjusted >= 700 && auth?.empresa?.esAgenteRetencion && selectOperation?.codigo !== "0112" && !retencionData) {
            const monto = Number((totalAdjusted * 0.03).toFixed(2));
            setRetencionData({
                montoDetraccion: monto,
                porcentajeDetraccion: 3
            });
        }
    }, [totalAdjusted, retencionData, auth?.empresa?.esAgenteRetencion, selectOperation?.codigo]);

    const [showMobileCart, setShowMobileCart] = useState(false);

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
        setRetencionData(null);
        setTipoDetraccionId(undefined);
        setMedioPagoDetraccionId(undefined);
        setCuentaBancoNacion('');
        setPorcentajeDetraccion(0);
        setMontoDetraccion(0);
        setCuotas([]);
        setTimeout(() => getSerieAndCorrelativeByReceipt(auth?.empresa?.id, formValues?.tipoDoc), 1000);
        // Re-fetch products so the POS catalog reflects the updated stock after the sale
        const refreshParams: any = { page, limit };
        if (sedeActiva?.id) refreshParams.sedeId = sedeActiva.id;
        getAllProducts(refreshParams, () => {}, true);
    };

    const componentRef = null; // Will be bound at view layer by useReactToPrint

    return {
        // Core State
        auth,
        isMobile,
        isCompact,
        isQuotationRoute,
        productsInvoice,

        // Form & Selections
        formValues, setFormValues,
        paymentMethod, setPaymentMethod,
        adelanto, setAdelanto,
        fechaRecojo, setFechaRecojo,
        selectedClient, setSelectedClient,
        selectedProduct, setSelectProduct,

        // Masters
        tiposOperacion, typesOperation,
        tiposDetraccion, mediosPagoDetraccion,
        comprobantesGenerar, receiptsToNote,
        categories, clients,
        filteredProducts: products, totalProducts,

        // Modal triggers
        isOpenModalClient, setIsOpenModalClient,
        isOpenModalProduct, setIsOpenModalProduct,
        isModalDetraccionOpen, setIsModalDetraccionOpen,
        isModalRetencionOpen, setIsModalRetencionOpen,
        isQuotationConfigModalOpen, setIsQuotationConfigModalOpen,
        IsOpenModalSuccessInvoice, setIsOpenModalSuccessInvoice,
        isComprobantePendiente,
        showMobileCart, setShowMobileCart,
        editingIndex, setEditingIndex,

        // Barcode scanner
        barcodeInput, setBarcodeInput,
        barcodeLoading, barcodeRef,
        handleBarcodeScan,

        // Handlers
        handleProductClick,
        handleDeleteProduct,
        handleSaveEdit,
        handleSelectWholesaleTier,
        getApplicablePrice,
        updateProductInvoice,
        handleChangeSelect,
        handleGetDataClient,
        addInvoiceReceipt,
        closeModal,
        closeModalResponse,
        calculateLineItem,
        handleSaveDetraccion,
        handleSaveRetencion,
        handleSaveQuotationConfig,
        getDocumentInvoice,
        getInvoiceBySerieCorrelative,

        // Search & Pagination
        searchTerm, setSearchTerm,
        selectedCategoryId, setSelectedCategoryId,
        page, setPage,
        limit, setLimit,
        pages, indexOfFirstItem, indexOfLastItem,

        // Derived Logic
        totalAdjusted, total, productDiscount, hasDiscount,
        opGravadaAdjusted, igvAdjusted, finalDiscount, totalInWords,

        // References & Inputs
        serie, setSerie,
        correlative, setCorrelative,
        receiptNoteId, setReceiptNoteId,
        dataReceipt, invoiceData,
        pay, setPay,
        qrCodeDataUrl,

        // Note/Quotation Fields
        includeProductImages, setIncludeProductImages,
        quotationDiscount, quotationValidity,
        quotationSignature, quotationTerms,
        quotationPaymentType, quotationAdvance,

        // Sub-states
        tipoDetraccionId, montoDetraccion, cuentaBancoNacion, cuotas, retencionData,
        medioPagoDetraccionId, setMedioPagoDetraccionId,
        setTipoDetraccionId, setMontoDetraccion, setCuentaBancoNacion, setCuotas, setRetencionData,
        porcentajeDetraccion, setPorcentajeDetraccion,

        // Printing (ref and sizes extracted partially to view)
        printSize, setPrintSize, dimensions,

        // Global Errors & others
        errors, errorsProduct, errorsClient,
        setErrorsProduct, setErrorsClient,
        formValuesProduct, setFormValuesProduct,
        formValuesClient, setFormValuesClient,
        initialFormProduct, initialFormClient,
        isLoading,
        isEditMode,
    };
};
