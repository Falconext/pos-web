import { ChangeEvent, useEffect, useState, useMemo, useRef } from "react";
import { IInvoicesState, useInvoiceStore } from "@/zustand/invoices";
import { IExtentionsState, useExtentionsStore } from "@/zustand/extentions";
import { IClientsState, useClientsStore } from "@/zustand/clients";
import { IProductsState, useProductsStore } from "@/zustand/products";
import { ICategoriesState, useCategoriesStore } from "@/zustand/categories";
import { useCombosStore } from "@/zustand/combos";
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
import { get, patch } from "@/utils/fetch";
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
    metodosCredito,
    type ICatalogoFarmaciaItem,
    type IDatosReceta,
} from "./FacturacionModel";
import { COURIERS } from "./components/EnvioModal";

type EnvioDespachoFormData = {
    transportista?: string;
    tipoEnvio?: string;
    agenciaDestino?: string;
    celularDest?: string;
    nroPaquetes?: number | string;
    turnoEnvio?: string;
    tipoMercaderia?: string;
    claveEnvio?: string;
    nroOrden?: string;
    claveOrden?: string;
    establecimiento?: string;
    repartidor?: string;
    repartidorId?: number | null;
    empaquetador?: string;
    observaciones?: string;
    fechaEstimada?: string;
    costoEnvio?: number;
    pagarFlete?: 'CLIENTE' | 'NEGOCIO';
};

const cleanText = (value?: string) => String(value ?? '').trim();

const isCompleteEnvioDespacho = (data: EnvioDespachoFormData) => {
    const celular = cleanText(data.celularDest).replace(/\D/g, '');
    return Boolean(
        cleanText(data.transportista) &&
        ['AGENCIA', 'DOMICILIO'].includes(cleanText(data.tipoEnvio)) &&
        cleanText(data.agenciaDestino) &&
        celular.length >= 9 &&
        Number(data.nroPaquetes) >= 1 &&
        ['MANANA', 'TARDE', 'NOCHE'].includes(cleanText(data.turnoEnvio))
    );
};

const buildEnvioDespachoPayload = (data: EnvioDespachoFormData) => {
    const tipoEnvio = cleanText(data.tipoEnvio) || 'AGENCIA';
    const destino = cleanText(data.agenciaDestino);
    const fecha = cleanText(data.fechaEstimada);
    const fechaEstimada = fecha && !Number.isNaN(new Date(`${fecha}T00:00:00-05:00`).getTime())
        ? new Date(`${fecha}T00:00:00-05:00`).toISOString()
        : undefined;

    return {
        estado: 'PREPARANDO',
        transportista: cleanText(data.transportista),
        tipoEnvio,
        agenciaDestino: destino,
        direccionDestino: tipoEnvio === 'DOMICILIO' ? destino : undefined,
        celularDest: cleanText(data.celularDest).replace(/\D/g, ''),
        nroPaquetes: Number(data.nroPaquetes) || 1,
        turnoEnvio: cleanText(data.turnoEnvio) || 'MANANA',
        tipoMercaderia: cleanText(data.tipoMercaderia),
        claveEnvio: cleanText(data.claveEnvio),
        nroOrden: cleanText(data.nroOrden),
        claveOrden: cleanText(data.claveOrden),
        establecimiento: cleanText(data.establecimiento),
        repartidor: data.repartidorId ? undefined : cleanText(data.repartidor),
        repartidorId: data.repartidorId || undefined,
        empaquetador: cleanText(data.empaquetador),
        observaciones: cleanText(data.observaciones),
        ...(fechaEstimada ? { fechaEstimada } : {}),
    };
};

export const useFacturacionViewModel = () => {
    const { receipt, importReference, addInformalInvoice, addProductsInvoice, updateProductInvoice, productsInvoice, getInvoiceBySerieCorrelative, resetProductInvoice, invoiceData, deleteProductInvoice, addInvoice, dataReceipt, resetInvoice, getSerieAndCorrelativeByReceipt, updateQuotation }: IInvoicesState = useInvoiceStore();
    const { isCompact } = useThemeStore();
    const { auth, sedeActiva } = useAuthStore();
    const { categories, getAllCategories }: ICategoriesState = useCategoriesStore();
    const { getAllClients, clients }: IClientsState = useClientsStore();
    const { getAllProducts, products, totalProducts }: IProductsState = useProductsStore();
    const { combos, fetchCombos } = useCombosStore();
    const { getCreditDebitNoteTypes, getCurrencies, creditDebitNoteTypes, getDocumentTypes }: IExtentionsState = useExtentionsStore();

    const location = useLocation();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const isQuotationRoute = location.pathname.includes('/cotizaciones/nuevo');
    const tiposInformales = ['TICKET', 'NV', 'RH', 'CP', 'NP', 'OT', 'COT'];
    const tipoEmpresa = auth?.empresa?.tipoEmpresa || "";

    // Detección de rubros farmacéuticos
    const rubroNombre = ((auth?.empresa as any)?.rubro?.nombre ?? '').toLowerCase();
    const isFarmaciaRetail = rubroNombre.includes('farmacia') || rubroNombre.includes('botica');
    const esDrogueria = rubroNombre.includes('drogueria') || rubroNombre.includes('droguería');
    const usaLotesFarmacia = isFarmaciaRetail || esDrogueria;
    const usarPrecioLoteFefo = Boolean((auth?.empresa as any)?.usarPrecioLoteFefo);

    const [resellerBranding, setResellerBranding] = useState<{ nombre: string | null; whiteLabelNombre: string | null; whiteLabelWebsite: string | null } | null>(null);
    useEffect(() => {
        get('auth/me').then((resp: any) => {
            const r = resp?.data?.empresa?.reseller;
            if (r?.whiteLabelNombre || r?.whiteLabelWebsite) setResellerBranding(r);
        }).catch(() => {});
    }, []);

    // POS STATES
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Fraccionamiento: modo por producto (CAJA = unidadCompra, UNIDAD = unidadVenta)
    const [modoFraccionPorProducto, setModoFraccionPorProducto] = useState<Record<number, 'CAJA' | 'UNIDAD'>>({});

    const setModoFraccionProducto = (productId: number, modo: 'CAJA' | 'UNIDAD') => {
        setModoFraccionPorProducto(prev => ({ ...prev, [productId]: modo }));
    };

    // Farmacia: catálogo con lotes FEFO y datos de receta
    const [farmaciaProductos, setFarmaciaProductos] = useState<ICatalogoFarmaciaItem[]>([]);
    const [farmaciaTotal, setFarmaciaTotal] = useState(0);
    const [farmaciaLoading, setFarmaciaLoading] = useState(false);
    const [isRecetaModalOpen, setIsRecetaModalOpen] = useState(false);
    const [recetaModalItemIndex, setRecetaModalItemIndex] = useState<number | null>(null);

    // Barcode scanner state
    const [barcodeInput, setBarcodeInput] = useState('');
    const [barcodeLoading, setBarcodeLoading] = useState(false);
    const [barcodeError, setBarcodeError] = useState(false);
    const barcodeRef = useRef<HTMLInputElement>(null);
    const processedGuiaRef = useRef<string | null>(null);
    const processedPedidoTiendaRef = useRef<string | null>(null);
    // Tracks the comprobante type that was pre-filled from a Nota de Venta conversion.
    // Prevents the auto-reset effect from overwriting the NV client while on that comprobante type.
    const fromNVComprobanteRef = useRef<string | null>(null);

    const _stateDefaultType = (location.state as any)?.defaultType as string | undefined;
    const _tipoDocInitMap: Record<string, string> = {
        'FACTURA': '01', 'BOLETA': '03',
        'TICKET': 'TICKET', 'NP': 'NP', 'OT': 'OT',
        'NV': 'NV', 'RH': 'RH', 'CP': 'CP',
        'NOTA DE PEDIDO': 'NP',
    };
    const _comprobanteLabelInitMap: Record<string, string> = { NP: 'NOTA DE PEDIDO', NV: 'NOTA DE VENTA' };

    const initialDocumentType = isQuotationRoute
        ? "COTIZACIÓN"
        : (_stateDefaultType
            ? (_comprobanteLabelInitMap[_stateDefaultType] ?? _stateDefaultType)
            : (receipt === ""
                ? (tipoEmpresa === "INFORMAL" ? "TICKET" : "FACTURA")
                : receipt.toUpperCase()));

    const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo');
    const [isMixedPayment, setIsMixedPayment] = useState<boolean>(false);
    const [splitPayments, setSplitPayments] = useState<{ method: string; amount: number }[]>([
        { method: 'Efectivo', amount: 0 },
        { method: 'Yape', amount: 0 },
    ]);
    const [adelanto, setAdelanto] = useState<number>(0);
    const [fechaRecojo, setFechaRecojo] = useState<string>('');
    const [adelantoError, _setAdelantoError] = useState<string>('');

    // ID del comprobante informal de origen (cuando se convierte NV/Ticket → Formal)
    // Cuando está presente, el backend NO descuenta el stock (ya fue descontado por el informal)
    const [origenComprobanteId, setOrigenComprobanteId] = useState<number | null>(null);

    // Fecha de emisión manual (backdating SUNAT): YYYY-MM-DD, default hoy
    const todayStr = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const [fechaEmisionManual, setFechaEmisionManual] = useState<string>(todayStr);

    const initFormValues: IFormInvoice = {
        clienteId: 0,
        currencyCode: "PEN",
        clienteNombre: "",
        comprobante: initialDocumentType,
        tipoDoc: isQuotationRoute ? "COT" : (_stateDefaultType ? (_tipoDocInitMap[_stateDefaultType] ?? '01') : (tipoEmpresa === "INFORMAL" && initialDocumentType === "TICKET" ? "TICKET" : initialDocumentType === "NOTA DE CREDITO" ? "07" : initialDocumentType === "NOTA DE DEBITO" ? "08" : initialDocumentType === "BOLETA" ? "03" : "01")),
        tipoOperacionId: 0,
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
    const [despachoCreado, setDespachoCreado] = useState<boolean>(false);
    const [emittedDataReceipt, setEmittedDataReceipt] = useState<any>(null);
    const [snapshotClient, setSnapshotClient] = useState<any>(null);

    // Coordinación de envío nacional
    const [envioActivo, setEnvioActivo] = useState(false);
    const [envioData, setEnvioData] = useState({
        transportista: '',
        tipoEnvio: 'AGENCIA',
        agenciaDestino: '',
        celularDest: '',
        nroPaquetes: 1,
        turnoEnvio: 'MANANA',
        tipoMercaderia: '',
        claveEnvio: '',
        nroOrden: '',
        claveOrden: '',
        establecimiento: '',
        repartidor: '',
        repartidorId: null as number | null,
        empaquetador: '',
        observaciones: '',
        fechaEstimada: '',
        costoEnvio: 0,
        pagarFlete: 'NEGOCIO' as 'CLIENTE' | 'NEGOCIO',
    });
    const [correlative, setCorrelative] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [descountGlobal, _setDescountGlobal] = useState<number>(0)
    const [descuentoPctNV, setDescuentoPctNV] = useState<number>(0)
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
                const [rOps, rDet, rMed]: any[] = await Promise.all([
                    get('comprobante/tipo-operacion'),
                    get('comprobante/tipos-detraccion'),
                    get('comprobante/medios-pago-detraccion'),
                ]);
                const opsData = (rOps && Array.isArray(rOps)) ? rOps : (rOps?.data || []);
                if (Array.isArray(opsData)) {
                    setTiposOperacion(opsData);
                    if ((formValues.tipoOperacionId ?? 0) === 0 && !["NOTA DE CREDITO", "NOTA DE DEBITO"].includes(formValues.comprobante)) {
                        const ventaInterna = opsData.find((op: any) => op.codigo === '0101');
                        if (ventaInterna) setFormValues(prev => ({ ...prev, tipoOperacionId: ventaInterna.id }));
                    }
                }
                setTiposDetraccion((rDet && Array.isArray(rDet)) ? rDet : (rDet?.data || []));
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

        if (!usaLotesFarmacia) {
            getAllProducts(params, () => { }, true);
        }
    }, [page, limit, debouncedSearchTerm, selectedCategoryId, sedeActiva?.id, usaLotesFarmacia]);

    // Farmacia: catálogo con FEFO (reemplaza getAllProducts para rubros regulados)
    useEffect(() => {
        if (!usaLotesFarmacia) return;
        let cancelled = false;
        setFarmaciaLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (sedeActiva?.id) params.set('sedeId', String(sedeActiva.id));
        if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
        if (selectedCategoryId !== 0) params.set('categoriaId', String(selectedCategoryId));
        get(`productos/catalogo-farmacia?${params.toString()}`)
            .then((resp: any) => {
                if (cancelled) return;
                setFarmaciaProductos(resp?.data?.productos ?? []);
                setFarmaciaTotal(resp?.data?.total ?? 0);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setFarmaciaLoading(false); });
        return () => { cancelled = true; };
    }, [page, limit, debouncedSearchTerm, selectedCategoryId, sedeActiva?.id, usaLotesFarmacia]);

    const filteredCombos = useMemo(() => {
        const search = String(debouncedSearchTerm || '').trim().toLowerCase();

        return (combos || []).filter((combo: any) => {
            if (!combo?.activo) return false;

            const matchesSearch = !search
                || String(combo?.nombre || '').toLowerCase().includes(search)
                || String(combo?.descripcion || '').toLowerCase().includes(search)
                || (combo?.items || []).some((item: any) =>
                    String(item?.producto?.descripcion || '').toLowerCase().includes(search),
                );

            if (!matchesSearch) return false;

            if (selectedCategoryId === 0) return true;

            return (combo?.items || []).some((item: any) => Number(item?.producto?.categoria?.id || 0) === Number(selectedCategoryId));
        });
    }, [combos, debouncedSearchTerm, selectedCategoryId]);

    const catalogItems = useMemo(() => {
        const sourceProductos = usaLotesFarmacia ? farmaciaProductos : products;
        const itemsProductos = (sourceProductos || []).map((product: any) => ({ ...product, __catalogType: 'PRODUCTO' }));
        const itemsCombos = filteredCombos.map((combo: any) => ({ ...combo, __catalogType: 'COMBO' }));
        return [...itemsCombos, ...itemsProductos];
    }, [products, farmaciaProductos, filteredCombos, usaLotesFarmacia]);

    // Initial Data Fetching for POS
    useEffect(() => {
        getAllCategories({});
        fetchCombos(false);
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
                NV: 'NOTA DE VENTA',
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
        } else if (state?.guiaRemision) {
            const { guiaRemision } = state;
            const guiaKey = `${guiaRemision.serie}-${guiaRemision.correlativo}`;

            if (processedGuiaRef.current !== guiaKey) {
                processedGuiaRef.current = guiaKey;

                // 1. Cliente
                const newClient = {
                    id: guiaRemision.clienteId || 0,
                    nombre: guiaRemision.destinatarioRazonSocial,
                    nroDoc: guiaRemision.destinatarioNumDoc,
                    direccion: guiaRemision.llegadaDireccion || "",
                    departamento: "", distrito: "", provincia: "", persona: "CLIENTE",
                    ubigeo: guiaRemision.llegadaUbigeo || "",
                    email: "", telefono: "", tipoDoc: guiaRemision.destinatarioTipoDoc,
                    estado: "ACTIVO", tipoDocumentoId: parseInt(guiaRemision.destinatarioTipoDoc) || 6,
                    empresaId: auth?.empresa?.id || 0,
                    tipoDocumento: { codigo: guiaRemision.destinatarioTipoDoc, descripcion: "", id: parseInt(guiaRemision.destinatarioTipoDoc) || 6 }
                };
                setSelectedClient(newClient);
                setFormValuesClient(newClient as any);
                setFormValues(prev => ({
                    ...prev,
                    clienteId: newClient.id,
                    clienteNombre: `${newClient.nroDoc}-${newClient.nombre}`
                }));

                // 2. Observaciones (Referencia a la guía)
                const refText = `Guía de Remisión relacionada: ${guiaRemision.serie}-${guiaRemision.correlativo}`;
                setFormValues(prev => ({
                    ...prev,
                    observaciones: prev.observaciones ? `${prev.observaciones}\n${refText}` : refText
                }));

                // 3. Productos (Detalles)
                if (guiaRemision.detalles && Array.isArray(guiaRemision.detalles)) {
                    resetProductInvoice();
                    guiaRemision.detalles.forEach((d: any) => {
                        addProductsInvoice({
                            productoId: d.productoId || 0,
                            descripcion: d.descripcion,
                            categoriaId: 1,
                            precioUnitario: 0,
                            categoriaNombre: "General",
                            afectacionNombre: "Gravado – Operación Onerosa",
                            tipoAfectacionIGV: "10",
                            stock: 999,
                            codigo: d.codigoProducto,
                            unidadMedidaId: 1,
                            unidadMedidaNombre: d.unidadMedida || "NIU",
                            estado: "ACTIVO",
                            codigoBarras: "",
                            cantidadToInvoice: d.cantidad,
                            discount: 0,
                            cantidad: d.cantidad,
                            precioBase: 0
                        } as any);
                    });

                    setTimeout(() => {
                        useAlertStore.getState().alert("Guía cargada. Por favor, asigne los precios unitarios a los productos.", "info");
                    }, 500);
                }
            }

            window.history.replaceState({}, document.title);
        } else if (state?.fromPedidoTienda && state?.pedidoTiendaData) {
            const pedido = state.pedidoTiendaData;
            const pedidoKey = `pedido-tienda-${pedido.id}-${state.defaultType || ''}`;

            if (processedPedidoTiendaRef.current !== pedidoKey) {
                processedPedidoTiendaRef.current = pedidoKey;

                const clienteVarios = clients?.find((item: any) => item.nroDoc === '10000000');
                const cliente = clienteVarios || {
                    id: 0,
                    nombre: pedido.clienteNombre || 'CLIENTES VARIOS',
                    nroDoc: '10000000',
                    direccion: pedido.clienteDireccion || '',
                    telefono: pedido.clienteTelefono || '',
                    tipoDoc: '1',
                    tipoDocumentoId: 1,
                    estado: 'ACTIVO',
                };

                setSelectedClient(cliente);
                setFormValuesClient(cliente as any);
                setFormValues(prev => ({
                    ...prev,
                    clienteId: Number(cliente.id) || 0,
                    clienteNombre: `${cliente.nroDoc}-${cliente.nombre}`,
                    observaciones: [
                        prev.observaciones,
                        `Pedido tienda: ${pedido.codigoSeguimiento}`,
                        pedido.tipoEntrega === 'ENVIO' ? `Entrega: ${pedido.clienteDireccion || 'por coordinar'}` : 'Recojo en tienda',
                    ].filter(Boolean).join('\n'),
                }));

                if (Array.isArray(pedido.items) && pedido.items.length > 0) {
                    resetProductInvoice();
                    pedido.items.forEach((item: any) => {
                        addProductsInvoice({
                            productoId: item.productoId || item.producto?.id || 0,
                            id: item.productoId || item.producto?.id || 0,
                            descripcion: item.producto?.descripcion || item.descripcion || 'Producto',
                            codigo: item.producto?.codigo || '',
                            cantidad: Number(item.cantidad || 1),
                            cantidadToInvoice: Number(item.cantidad || 1),
                            precioUnitario: Number(item.precioUnit || item.precioUnitario || 0),
                            descuento: 0,
                            unidadMedidaId: 1,
                            unidadMedidaNombre: 'NIU',
                            afectacionNombre: 'Gravado – Operación Onerosa',
                            tipoAfectacionIGV: '10',
                            stock: 999,
                            estado: 'ACTIVO',
                        } as any);
                    });
                }
            }

            window.history.replaceState({}, document.title);
        } else if (state?.fromNotaDeVenta && state?.notaDeVentaData) {
            const { cliente, clienteId, productos, observaciones, origenComprobanteId } = state.notaDeVentaData;
            if (origenComprobanteId) setOrigenComprobanteId(Number(origenComprobanteId));

            if (cliente) {
                fromNVComprobanteRef.current = formValues.comprobante;
                setSelectedClient(cliente);
                setFormValues(prev => ({
                    ...prev,
                    clienteId: clienteId || cliente.id || 0,
                    clienteNombre: `${cliente.nroDoc}-${cliente.nombre}`
                }));
            }

            if (productos && Array.isArray(productos) && productos.length > 0) {
                resetProductInvoice();
                productos.forEach((d: any) => {
                    addProductsInvoice({
                        productoId: d.productoId || 0,
                        descripcion: d.descripcion,
                        cantidadInicial: d.cantidad,
                        precioUnitario: d.precioUnitario,
                        descuento: 0,
                        unidadMedidaNombre: d.unidad || 'NIU',
                        afectacionNombre: 'Gravado – Operación Onerosa',
                        tipoAfectacionIGV: '10',
                        stock: 999,
                        estado: 'ACTIVO',
                    });
                });
            }

            if (observaciones) {
                setFormValues(prev => ({ ...prev, observaciones }));
            }

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

            const ventaInterna = tiposOperacion.find((op: any) => op.codigo === '0101');
            if (ventaInterna && (formValues.comprobante === "BOLETA" || formValues.comprobante === "NOTA DE PEDIDO")) {
                setFormValues(prev => ({ ...prev, tipoOperacionId: ventaInterna.id }));
            }

            if (fromNVComprobanteRef.current !== null) {
                if (fromNVComprobanteRef.current !== formValues.comprobante) {
                    // User switched comprobante away from the NV one — clear flag and allow normal reset
                    fromNVComprobanteRef.current = null;
                } else {
                    // Still on the same comprobante that came from NV — preserve client, skip reset
                }
            }

            if (fromNVComprobanteRef.current === null) {
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
        }
    }, [formValues.comprobante, receiptNoteId, tiposOperacion, clients]);

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

    const getCartQtyByProductId = (productoId: number) =>
        productsInvoice
            .filter((item: any) => Number(item?.productoId || item?.id) === productoId)
            .reduce((acc: number, item: any) => acc + Number(item?.cantidad || 0), 0);

    const mergeOrAddProductToCart = (product: any, quantityToAdd: number, unitPrice: number, origin: string) => {
        const existingIndex = productsInvoice.findIndex((p: any) => Number(p?.productoId || p?.id) === Number(product.id));

        if (existingIndex >= 0) {
            const currentItem = productsInvoice[existingIndex];
            const currentQty = Number(currentItem?.cantidad || 0);
            const newQty = currentQty + quantityToAdd;
            const weightedUnitPrice = Number((((Number(currentItem?.precioUnitario || 0) * currentQty) + (unitPrice * quantityToAdd)) / newQty).toFixed(6));
            const subtotal = weightedUnitPrice * newQty;

            updateProductInvoice(existingIndex, {
                cantidad: newQty,
                cantidadOriginal: newQty,
                precioUnitario: weightedUnitPrice,
                precioBase: weightedUnitPrice,
                preciosMayorista: [],
                precioOrigen: origin,
                total: subtotal.toFixed(2),
                sale: (subtotal / 1.18).toFixed(2),
                igv: (subtotal - subtotal / 1.18).toFixed(2),
            });
            return;
        }

        addProductsInvoice({
            ...product,
            productoId: product.id,
            precioBase: unitPrice,
            precioUnitario: unitPrice,
            precioOrigen: origin,
            preciosMayorista: [],
            cantidadInicial: quantityToAdd,
            unidadMedida: product?.unidadMedida?.nombre || product?.unidadMedida || 'NIU',
        });
    };

    const distribuirPrecioCombo = (combo: any) => {
        const comboItems = Array.isArray(combo?.items) ? combo.items : [];
        const totalCombo = Number(combo?.precioCombo || 0);
        const totalBase = comboItems.reduce((sum: number, item: any) => {
            const base = Number(item?.producto?.precioUnitario || 0);
            const qty = Number(item?.cantidad || 0);
            return sum + (base * qty);
        }, 0);

        let acumulado = 0;
        return comboItems.map((item: any, index: number) => {
            const qty = Number(item?.cantidad || 0);
            const producto = item?.producto;
            const valorBaseLinea = Number(producto?.precioUnitario || 0) * qty;

            let targetLineTotal = 0;
            if (index === comboItems.length - 1) {
                targetLineTotal = Number((totalCombo - acumulado).toFixed(2));
            } else if (totalBase > 0) {
                targetLineTotal = Number(((valorBaseLinea / totalBase) * totalCombo).toFixed(2));
                acumulado += targetLineTotal;
            } else {
                targetLineTotal = Number((totalCombo / Math.max(comboItems.length, 1)).toFixed(2));
                acumulado += targetLineTotal;
            }

            const unitPrice = qty > 0 ? Number((targetLineTotal / qty).toFixed(6)) : 0;
            return { producto, qty, unitPrice };
        });
    };

    const handleComboClick = (combo: any) => {
        if (!combo?.items?.length) {
            return useAlertStore.getState().alert("El kit no tiene productos configurados", "warning");
        }

        for (const comboItem of combo.items) {
            const producto = comboItem?.producto;
            const qtyRequerida = Number(comboItem?.cantidad || 0);
            if (!producto || qtyRequerida <= 0) {
                return useAlertStore.getState().alert("El kit tiene productos inválidos", "warning");
            }

            const qtyActualEnCarrito = getCartQtyByProductId(Number(producto.id));
            const stockDisponible = Number(producto?.stock || 0);
            if (qtyActualEnCarrito + qtyRequerida > stockDisponible) {
                return useAlertStore.getState().alert(
                    `Stock insuficiente para ${String(producto.descripcion || "producto").toUpperCase()} al agregar el kit`,
                    "warning",
                );
            }
        }

        const lineasDistribuidas = distribuirPrecioCombo(combo);
        lineasDistribuidas.forEach((linea: any) => {
            mergeOrAddProductToCart(
                linea.producto,
                Number(linea.qty),
                Number(linea.unitPrice),
                `KIT:${String(combo?.nombre || "").toUpperCase()}`,
            );
        });

        useAlertStore.getState().alert(`Kit "${String(combo?.nombre || "").toUpperCase()}" agregado al comprobante`, "success");
    };

    const handleProductClick = (product: any) => {
        // Farmacia: el stock siempre viene de lotes activos (FEFO/trazabilidad)
        if (usaLotesFarmacia) {
            const loteFefo = product?.loteFefo;
            if (!loteFefo) {
                return useAlertStore.getState().alert("Este producto no tiene lotes registrados. Ingresa un lote en Kardex antes de vender.", "warning");
            }
            if (loteFefo.diasAlVencimiento !== null && loteFefo.diasAlVencimiento < 0) {
                return useAlertStore.getState().alert(`El lote ${loteFefo.loteNumero} está vencido`, "error");
            }
        }

        // Fraccionamiento
        const factorConversion = Number(product?.factorConversion ?? 1);
        const tieneFraccionamiento = isFarmaciaRetail && factorConversion > 1;
        const modoActual = tieneFraccionamiento
            ? (modoFraccionPorProducto[product.id] ?? 'CAJA')
            : 'CAJA';
        const vendePorUnidad = tieneFraccionamiento && modoActual === 'UNIDAD';

        const fraccionExtra = tieneFraccionamiento
            ? {
                unidadSeleccionada: modoActual,
                unidadVentaNombre: vendePorUnidad
                    ? (product?.unidadVenta || 'UNIDAD')
                    : (product?.unidadCompra || product?.unidadMedida?.nombre || 'UNIDAD'),
                factorConversion,
            }
            : {};
        const unidadMedidaNombre = (fraccionExtra as any).unidadVentaNombre ?? (product?.unidadMedida?.nombre ?? product?.unidadCodigo);

        // ── Multi-lote FEFO: una línea de carrito por lote ─────────────────────
        // Cuando usarPrecioLoteFefo está activo y el producto tiene lotes con costoUnitario,
        // cada lote genera su propia línea en el comprobante con su precio real.
        if (usarPrecioLoteFefo && (product?.lotesDisponibles?.length ?? 0) > 0) {
            type LoteDisponible = { loteId: number; loteNumero: string; stockActual: number; costoUnitario: number | null; fechaVencimiento: string };
            const lotesActivos = [...(product.lotesDisponibles as LoteDisponible[])]
                .filter((l) => l.stockActual > 0)
                .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());

            if (!lotesActivos.length) {
                return useAlertStore.getState().alert("Sin stock en lotes activos", "warning");
            }

            for (const lote of lotesActivos) {
                const existingLoteIdx = productsInvoice.findIndex(
                    (p: any) => Number(p?.productoId || p?.id) === product.id && p.loteId === lote.loteId,
                );

                if (existingLoteIdx >= 0) {
                    const currentItem = productsInvoice[existingLoteIdx];
                    const currentQty = Number(currentItem.cantidad);
                    if (currentQty < lote.stockActual) {
                        updateProductInvoice(existingLoteIdx, calculateLineItem(currentItem, currentQty + 1));
                        return;
                    }
                    continue; // este lote está lleno, intentar el siguiente
                }

                // Nueva línea para este lote
                const costoBase = lote.costoUnitario ?? Number(product?.precioUnitario ?? 0);
                const lotPrice = vendePorUnidad ? costoBase / factorConversion : costoBase;
                addProductsInvoice({
                    ...product,
                    descripcion: `${String(product.descripcion || '')} [${lote.loteNumero}]`,
                    precioBase: lotPrice,
                    precioUnitario: lotPrice,
                    precioOrigen: 'FEFO',
                    stock: lote.stockActual,
                    unidadMedida: unidadMedidaNombre,
                    lotesDisponibles: product?.lotesDisponibles ?? [],
                    loteId: lote.loteId,
                    loteNumero: lote.loteNumero,
                    pendienteReceta: isFarmaciaRetail && (product.requiereReceta || product.controlado),
                    requiereReceta: product.requiereReceta ?? false,
                    controlado: product.controlado ?? false,
                    refrigerado: product.refrigerado ?? false,
                    ...fraccionExtra,
                });
                return;
            }

            return useAlertStore.getState().alert("Stock insuficiente en todos los lotes activos", "warning");
        }
        // ── Fin multi-lote ──────────────────────────────────────────────────────

        const precioDesdeLoteFefo = Number(product?.loteFefoCostoUnitario ?? 0);
        const precioBaseProducto = Number(product?.precioUnitario ?? 0);
        const precioBaseCaja = usarPrecioLoteFefo && precioDesdeLoteFefo > 0
            ? precioDesdeLoteFefo
            : precioBaseProducto;
        const precioBaseSeleccionado = vendePorUnidad ? precioBaseCaja / factorConversion : precioBaseCaja;
        const origenPrecio = vendePorUnidad ? "UNIDAD" : usarPrecioLoteFefo && precioDesdeLoteFefo > 0 ? "FEFO" : "LISTA";
        const existingIndex = productsInvoice.findIndex((p: any) => p.id === product.id);

        const farmaciaExtra = usaLotesFarmacia && product?.loteFefo
            ? {
                loteId: product.loteFefo.loteId,
                loteNumero: product.loteFefo.loteNumero,
                pendienteReceta: isFarmaciaRetail && (product.requiereReceta || product.controlado),
                requiereReceta: product.requiereReceta ?? false,
                controlado: product.controlado ?? false,
                refrigerado: product.refrigerado ?? false,
            }
            : {};

        if (existingIndex >= 0) {
            const currentItem = productsInvoice[existingIndex];
            const newQty = Number(currentItem.cantidad) + 1;
            const stockDisponible = usaLotesFarmacia
                ? (product?.loteFefo?.stockDisponibleVenta ?? 0)
                : product.stock;
            if (stockDisponible < newQty) {
                return useAlertStore.getState().alert("Stock insuficiente", "warning");
            }
            updateProductInvoice(existingIndex, calculateLineItem(currentItem, newQty));
        } else {
            const stockDisponible = usaLotesFarmacia
                ? (product?.loteFefo?.stockDisponibleVenta ?? 0)
                : product.stock;
            if (stockDisponible < 1) {
                return useAlertStore.getState().alert("Sin stock", "warning");
            }
            const base = precioBaseSeleccionado;
            addProductsInvoice({
                ...product,
                precioBase: base,
                precioUnitario: getApplicablePrice({ precioBase: base, preciosMayorista: product.preciosMayorista }, 1),
                precioOrigen: origenPrecio,
                unidadMedida: unidadMedidaNombre,
                ...farmaciaExtra,
                ...fraccionExtra,
            });
        }
    }

    // Farmacia: confirmar datos de receta para un ítem del carrito
    const handleConfirmarReceta = (itemIndex: number, datos: IDatosReceta) => {
        const item = productsInvoice[itemIndex];
        if (!item) return;
        updateProductInvoice(itemIndex, { ...item, pendienteReceta: false, datosReceta: datos });
        setIsRecetaModalOpen(false);
        setRecetaModalItemIndex(null);
    };

    const handleAbrirRecetaModal = (itemIndex: number) => {
        setRecetaModalItemIndex(itemIndex);
        setIsRecetaModalOpen(true);
    };

    const handleBarcodeScan = async (codigo: string) => {
        const trimmed = codigo.trim();
        if (!trimmed) return;
        
        setBarcodeLoading(true);
        setBarcodeError(false);
        
        try {
            const resp: any = await get(`productos/barcode/${encodeURIComponent(trimmed)}`);
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
    const esInformal = tiposInformales.includes(formValues.tipoDoc);
    const isDiscountGlobalApplicable = formValues.motivoId === 6;
    const totalOriginal = Number(total);
    const montoDescuentoNV = esInformal && descuentoPctNV > 0 ? parseFloat((totalOriginal * descuentoPctNV / 100).toFixed(2)) : 0;
    const totalAdjusted = isDiscountGlobalApplicable
        ? Math.max(totalOriginal - descountGlobal, 0)
        : Math.max(totalOriginal - montoDescuentoNV, 0);

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
    const finalDiscount = isDiscountGlobalApplicable
        ? Number(productDiscount) + descountGlobal
        : Number(productDiscount) + montoDescuentoNV;

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
        const selectedOperacion = tiposOperacion.find(op => op.id === formValues.tipoOperacionId);
        const isExportServiceHotel = selectedOperacion?.codigo === '0202';
        if (formValues?.comprobante === "FACTURA" && selectedClient?.nroDoc?.length !== 11 && !isExportServiceHotel) {
            return useAlertStore.getState().alert("El cliente debe tener RUC (11 dígitos) para generar una factura. Para Hospedaje a no domiciliados use Tipo de operación 0202.", "error");
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

        // Farmacia: bloquear emisión si hay ítems con receta pendiente
        if (isFarmaciaRetail) {
            const pendientes = productsInvoice.filter((p: any) => p.pendienteReceta);
            if (pendientes.length > 0) {
                return useAlertStore.getState().alert(
                    `Hay ${pendientes.length} producto(s) que requieren datos de receta médica antes de cobrar.`,
                    "error"
                );
            }
        }

        // Fecha de emisión: usar la fecha seleccionada por el usuario (con hora Lima actual)
        const [fyear, fmonth, fday] = fechaEmisionManual.split('-').map(Number);
        const fechaEmisionDate = new Date(fyear, fmonth - 1, fday, new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());
        const fechaEmision = formatISO(fechaEmisionDate, { representation: 'complete' });

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

        const effectiveMedioPago = isMixedPayment
            ? 'MIXTO'
            : paymentMethod;

        const baseData = {
            tipoOperacionId: formValues.tipoOperacionId || 1,
            fechaEmision,
            medioPago: effectiveMedioPago,
            ...(origenComprobanteId != null ? { comprobanteOrigenId: origenComprobanteId } : {}),
            vuelto: formValues?.vuelto,
            clienteId: Number(formValues?.clienteId) || invoiceData?.cliente?.id,
            clienteName: selectedClient?.nombre,
            tipoDoc: formValues?.tipoDoc,
            detalles: [
                ...(productsInvoice?.map((item: any) => ({
                    productoId: Number(item?.productoId || item?.id) || null,
                    descripcion: item.descripcion,
                    cantidad: Number(item.cantidad),
                    nuevoValorUnitario: Number(item.precioUnitario),
                    descuento: Number(item.descuento ?? 0),
                    // Farmacia: trazabilidad de lote y receta médica
                    ...(item.loteId != null ? { loteId: item.loteId } : {}),
                    ...(item.datosReceta?.numeroReceta ? { numeroReceta: item.datosReceta.numeroReceta } : {}),
                    ...(item.datosReceta?.dniPaciente ? { dniPaciente: item.datosReceta.dniPaciente } : {}),
                    ...(item.datosReceta?.nombrePaciente ? { nombrePaciente: item.datosReceta.nombrePaciente } : {}),
                    ...(item.datosReceta?.medicoNombre ? { medicoNombre: item.datosReceta.medicoNombre } : {}),
                    // Fraccionamiento: unidad de venta cuando difiere de la unidad base
                    ...(item.unidadSeleccionada === 'UNIDAD' && item.unidadVentaNombre ? { unidadVenta: item.unidadVentaNombre } : {}),
                })) ?? []),
                // Costo de envío como línea en el comprobante (solo cuando cliente paga)
                ...(envioActivo && Number(envioData.costoEnvio) > 0 && envioData.pagarFlete === 'CLIENTE' ? [{
                    productoId: null,
                    descripcion: `Servicio de envío${envioData.transportista ? ` (${COURIERS.find((c) => c.value === envioData.transportista)?.label ?? envioData.transportista})` : ''}`,
                    cantidad: 1,
                    nuevoValorUnitario: Number(envioData.costoEnvio),
                    descuento: 0,
                }] : []),
            ],
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

        setSnapshotClient(selectedClient ? { ...selectedClient } : null);
        setDespachoCreado(false);
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
            const r = result as any;
            if (r.serie != null && r.correlativo != null) {
                setEmittedDataReceipt({ ...dataReceipt, serie: r.serie, correlativo: r.correlativo, id: r.id ?? dataReceipt?.id ?? null });
            }
            // Auto-crear despacho si se completó la coordinación de envío.
            const comprobanteId = r.id ?? dataReceipt?.id ?? null;
            if (envioActivo && comprobanteId) {
                if (isCompleteEnvioDespacho(envioData)) {
                    const despachoResult = await patch(
                        `envio-despacho/comprobante/${comprobanteId}/upsert`,
                        buildEnvioDespachoPayload(envioData),
                    );
                    if (despachoResult.success === false || despachoResult.error) {
                        useAlertStore.getState().alert(
                            `La venta se guardó, pero no se pudo crear el despacho: ${despachoResult.error || 'verifique los datos de envío'}`,
                            'warning',
                        );
                    } else {
                        setDespachoCreado(true);
                    }
                } else {
                    useAlertStore.getState().alert(
                        'La venta se guardó, pero el despacho no se creó porque faltan courier, destino, celular o turno de envío.',
                        'warning',
                    );
                }
            }
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

    // Hotel: si el producto de la empresa es HOTEL y el cliente no es RUC, sugerir 0202 (Hospedaje no domiciliados)
    useEffect(() => {
        if (formValues.comprobante !== "FACTURA") return;
        const productoEmpresa = String(auth?.empresa?.producto ?? '').toLowerCase();
        if (productoEmpresa !== 'hotel') return;

        const cliTipoDoc = String((selectedClient as any)?.tipoDocumento?.codigo ?? '').trim();
        if (!cliTipoDoc || cliTipoDoc === '6') return;

        const op0202 = tiposOperacion.find((op: any) => op.codigo === '0202');
        if (!op0202) return;

        const currentOp = tiposOperacion.find((op: any) => op.id === formValues.tipoOperacionId);
        if (!currentOp || currentOp.codigo === '0101') {
            setFormValues(prev => ({ ...prev, tipoOperacionId: op0202.id }));
        }
    }, [auth?.empresa?.producto, formValues.comprobante, formValues.tipoOperacionId, selectedClient, tiposOperacion]);

    const getDocumentInvoice = async () => {
        const motivoIdForNotes = ["NOTA DE CREDITO", "NOTA DE DEBITO"].includes(formValues.comprobante) ? formValues.motivoId : undefined;
        const result = await getInvoiceBySerieCorrelative(debounceSerie.toUpperCase(), debounceCorrelative, motivoIdForNotes);
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

    const selectOperation = tiposOperacion.find(op => op.id === formValues.tipoOperacionId);

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
        setEmittedDataReceipt(null);
        setSnapshotClient(null);
        setDespachoCreado(false);
        const ventaInterna = tiposOperacion.find((op: any) => op.codigo === '0101');
        setFormValues({
            ...initFormValues,
            comprobante: formValues?.comprobante,
            tipoDoc: formValues.tipoDoc,
            vuelto: 0,
            tipoOperacionId: ventaInterna ? ventaInterna.id : initFormValues.tipoOperacionId
        });
        setPay(0);
        setChange(0);
        setPaymentMethod('Efectivo');
        setIsMixedPayment(false);
        setSplitPayments([{ method: 'Efectivo', amount: 0 }, { method: 'Yape', amount: 0 }]);
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

    const authWithBranding = useMemo(() => {
        if (!auth?.empresa || !resellerBranding) return auth;
        return { ...auth, empresa: { ...auth.empresa, reseller: resellerBranding } };
    }, [auth, resellerBranding]);

    return {
        // Core State
        auth,
        authWithBranding,
        resellerBranding,
        isMobile,
        isCompact,
        isQuotationRoute,
        productsInvoice,

        // Form & Selections
        formValues, setFormValues,
        paymentMethod, setPaymentMethod,
        isMixedPayment, setIsMixedPayment,
        splitPayments, setSplitPayments,
        adelanto, setAdelanto,
        fechaRecojo, setFechaRecojo,
        fechaEmisionManual, setFechaEmisionManual,
        fechaEmisionMinDate: (() => {
            const tipoDoc = (formValues as any)?.tipoDoc;
            const diasAtras = tipoDoc === '01' ? 3 : tipoDoc === '03' ? 5 : 0;
            const d = new Date();
            d.setDate(d.getDate() - diasAtras);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        fechaEmisionMaxDate: todayStr,
        fechaEmisionDiasAtras: (formValues as any)?.tipoDoc === '01' ? 3 : (formValues as any)?.tipoDoc === '03' ? 5 : 0,
        selectedClient, setSelectedClient,
        snapshotClient,
        selectedProduct, setSelectProduct,

        // Masters
        tiposOperacion, typesOperation,
        tiposDetraccion, mediosPagoDetraccion,
        comprobantesGenerar, receiptsToNote,
        categories, clients,
        filteredProducts: usaLotesFarmacia ? farmaciaProductos : products,
        filteredCombos,
        catalogItems,
        totalProducts: usaLotesFarmacia ? farmaciaTotal : totalProducts,
        farmaciaLoading,

        // Farmacia flags
        isFarmaciaRetail,
        esDrogueria,
        usaLotesFarmacia,

        // Fraccionamiento
        modoFraccionPorProducto,
        setModoFraccionProducto,

        // Modal triggers
        isOpenModalClient, setIsOpenModalClient,
        isOpenModalProduct, setIsOpenModalProduct,
        isModalDetraccionOpen, setIsModalDetraccionOpen,
        isModalRetencionOpen, setIsModalRetencionOpen,
        isQuotationConfigModalOpen, setIsQuotationConfigModalOpen,
        IsOpenModalSuccessInvoice, setIsOpenModalSuccessInvoice,
        isComprobantePendiente,
        despachoCreado,
        showMobileCart, setShowMobileCart,
        editingIndex, setEditingIndex,

        // Barcode scanner
        barcodeInput, setBarcodeInput,
        barcodeLoading, barcodeRef,
        handleBarcodeScan,

        // Envío nacional
        envioActivo, setEnvioActivo,
        envioData, setEnvioData,
        // Descuento % y condición de pago para informales
        descuentoPctNV, setDescuentoPctNV,
        esInformal,

        // Farmacia: receta modal
        isRecetaModalOpen, setIsRecetaModalOpen,
        recetaModalItemIndex,
        handleConfirmarReceta,
        handleAbrirRecetaModal,

        // Handlers
        handleProductClick,
        handleComboClick,
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
        dataReceipt: emittedDataReceipt ?? dataReceipt, invoiceData,
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
