import { IFormProduct, IProduct } from "@/interfaces/products";

export type { IFormProduct, IProduct };

export interface IProductsViewModelState {
    currentPage: number;
    itemsPerPage: number;
    searchClient: string; // Used for "Buscar nombre y código" input
    // Modals
    isOpenModal: boolean;
    isOpenModalCatalog: boolean;
    isOpenModalCategory: boolean;
    isOpenModalBrands: boolean;
    isOpenModalConfirm: boolean;
    isOpenModalDelete: boolean;
    isOpenModalDeleteAll: boolean;

    // Selection/Editing
    selectedDeleteId: number | null;
    formValues: IFormProduct;
    isEdit: boolean;
    errors: {
        codigo: string;
        descripcion: string;
        categoriaId: number;
        description: string;
        precioUnitario: string;
        stock: string;
        unidadMedida: string;
    };

    // UI State
    isHoveredExp: boolean;
    isHoveredImp: boolean;
    openAccionesId: number | null;
    anchorEl: HTMLElement | null;
    uploadTarget: { id: number; tipo: 'principal' } | null;
    uploading: boolean;
    visibleColumns: string[];
    showColumnFilter: boolean;
    vistaActual: 'cards' | 'tabla' | 'lista';
    marcaIdFilter: number | undefined;
    /** Filtro de stock: '' = todos; BAJO (≤ mínimo), SIN_STOCK (0) o RANGO (desde–hasta). */
    stockFiltro: StockFiltro;
    stockDesde: string;
    stockHasta: string;
    /** Ver también los productos NO asignados a la sede seleccionada. */
    incluirOcultos: boolean;
    isOpenModalAsignarSedes: boolean;
}

export const initialProductForm: IFormProduct = {
    productoId: 0,
    descripcion: "",
    categoriaId: "",
    precioUnitario: 0,
    categoriaNombre: "",
    afectacionNombre: "Gravado – Operación Onerosa",
    tipoAfectacionIGV: "10",
    moneda: "PEN",
    stock: 0,
    localizacion: '',
    porcentajeVenta: 100,
    porcentajeProvision: 0,
    stockMinimo: 0,
    stockMaximo: 0,
    visibleEnSede: true,
    vendibleEnSede: true,
    precioUnitarioSede: null,
    precioOfertaSede: null,
    ubicacionSede: '',
    codigo: "",
    unidadMedidaId: 1,
    unidadMedidaNombre: "UNIDAD",
    marcaId: null,
    marcaNombre: "",
    estado: "",
    costoPromedio: 0,
    costoUnitario: 0,
    costoFijo: 0,
    comisionPorVenta: 0,
    comisionPorcentaje: 0,
    // Campos Farmacia
    principioActivo: "",
    concentracion: "",
    presentacion: "",
    laboratorio: "",
    // Campos Bodega/Supermercado
    codigoBarras: "",
    codigosBarrasExtra: [],
    codProdSunat: "",
    unidadCompra: "",
    unidadVenta: "",
    factorConversion: 1,
    // Campos Ofertas
    precioOferta: 0,
    fechaInicioOferta: "",
    fechaFinOferta: "",
    // Precios por Mayorista
    preciosMayorista: [],
    // Límites de venta (vacío = sin límite)
    precioMinimoVenta: '',
    precioMaximoVenta: '',
    atributosTecnicos: {},
    opcionesAtributos: [],
    variantesConfig: []
};

export type StockFiltro = '' | 'BAJO' | 'SIN_STOCK' | 'RANGO';

export const STOCK_FILTRO_OPCIONES: { id: StockFiltro; value: string }[] = [
    { id: '', value: 'Todo el stock' },
    { id: 'BAJO', value: 'Stock bajo (≤ mínimo)' },
    { id: 'SIN_STOCK', value: 'Sin stock (0)' },
    { id: 'RANGO', value: 'Rango de stock…' },
];
