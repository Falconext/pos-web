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
}

export const initialProductForm: IFormProduct = {
    productoId: 0,
    descripcion: "",
    categoriaId: "",
    precioUnitario: 0,
    categoriaNombre: "",
    afectacionNombre: "Gravado – Operación Onerosa",
    tipoAfectacionIGV: "10",
    stock: 50,
    stockMinimo: 0,
    stockMaximo: 0,
    codigo: "",
    unidadMedidaId: 1,
    unidadMedidaNombre: "UNIDAD",
    marcaId: null,
    marcaNombre: "",
    estado: "",
    costoPromedio: 0,
    costoUnitario: 0,
    // Campos Farmacia
    principioActivo: "",
    concentracion: "",
    presentacion: "",
    laboratorio: "",
    // Campos Bodega/Supermercado
    codigoBarras: "",
    unidadCompra: "",
    unidadVenta: "",
    factorConversion: 1,
    // Campos Ofertas
    precioOferta: 0,
    fechaInicioOferta: "",
    fechaFinOferta: "",
    // Precios por Mayorista
    preciosMayorista: []
};
