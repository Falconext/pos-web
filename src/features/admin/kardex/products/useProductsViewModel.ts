import { useState, useEffect, useRef, ChangeEvent, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useProductsStore } from '@/zustand/products';
import { useBrandsStore } from '@/zustand/brands';
import { useAuthStore } from '@/zustand/auth';
import { useSedesStore } from '@/zustand/sedes';
import useAlertStore from '@/zustand/alert';
import apiClient from '@/utils/apiClient';
import { useRubroFeatures } from '@/utils/rubro-features';
import { IProductsViewModelState, initialProductForm, IFormProduct, IProduct } from './ProductsModel';

export const useProductsViewModel = () => {
    // Stores
    const {
        getAllProducts, totalProducts, products, toggleStateProduct,
        exportProducts: exportProductsAction, importProducts: importProductsAction,
        deleteProduct, deleteAllProducts, setProductImage
    } = useProductsStore();
    const { success, loading } = useAlertStore();
    const { auth, sedeActiva } = useAuthStore();
    const { sedes, listarSedes } = useSedesStore();
    const { brands, getAllBrands } = useBrandsStore();

    const isAdmin = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA';
    const esPrincipal = !sedeActiva || sedeActiva.esPrincipal === true;
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
    // Track whether the admin has explicitly chosen "Todas las sedes" (id=0 → null)
    // so we don't override that choice with the sedeActiva fallback.
    const userChoseSede = useRef(false);
    // For principal-sede admins: default to the current sede's stock instead of the
    // global total (sum of all sedes), which doesn't change on inter-sede transfers.
    const effectiveSedeId = esPrincipal
        ? (userChoseSede.current ? selectedSedeId : (selectedSedeId ?? sedeActiva?.id ?? null))
        : (sedeActiva?.id ?? null);

    const sedesOptions = [
        { id: 0, value: 'Todas las sedes' },
        ...sedes.map(s => ({ id: s.id, value: s.esPrincipal ? `${s.nombre}` : s.nombre }))
    ];

    const handleSelectSede = (id: any) => {
        userChoseSede.current = true;
        setSelectedSedeId(id === 0 ? null : Number(id));
    };

    // Derived State
    const isRestaurante = (() => {
        const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
        return rubroNombre.includes('restaurante') || rubroNombre.includes('comida') || rubroNombre.includes('alimento');
    })();

    const features = useRubroFeatures(auth?.empresa?.rubro?.nombre, {
        usaCodigoBarrasManual: auth?.empresa?.usaCodigoBarrasManual,
    });
    const isCodigoBarrasEnabled = features.usaCodigoBarras;

    const allColumns = useMemo(() => [
        'Img', 'Producto', 'Categoria', 'Marca',
        'Precio Venta', 'Costo', 'Stock', 'U.M', 'Estado', 'Acciones'
    ], []);

    const initialVisibleColumns = useMemo(() => [
        'Img', 'Producto', 'Categoria', 'Marca',
        'Precio Venta', 'Costo', 'Stock', 'U.M', 'Estado', 'Acciones'
    ], []);

    // Labels
    const labels = {
        titulo: isRestaurante ? 'Platos' : 'Productos',
        nuevoBtn: isRestaurante ? 'Nuevo plato' : 'Nuevo producto',
        nuevoBtnMobile: isRestaurante ? '+ Plato' : '+ Nuevo',
        buscar: isRestaurante ? 'Buscar plato' : 'Buscar nombre y código',
        confirmarEstado: isRestaurante ? '¿Estás seguro que deseas cambiar el estado de este plato?' : '¿Estás seguro que deseas cambiar el estado de este producto?',
        eliminar: isRestaurante ? 'Eliminar plato' : 'Eliminar producto',
        eliminarInfo: isRestaurante ? 'Esta acción eliminará el plato de tu catálogo. ¿Deseas continuar?' : 'Esta acción eliminará el producto de tu empresa (eliminación lógica). ¿Deseas continuar?',
    };

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadImageRef = useRef<HTMLInputElement>(null);

    // State
    const [state, setState] = useState<IProductsViewModelState>({
        currentPage: 1,
        itemsPerPage: 50,
        searchClient: "",
        isOpenModal: false,
        isOpenModalCatalog: false,
        isOpenModalCategory: false,
        isOpenModalBrands: false,
        isOpenModalConfirm: false,
        isOpenModalDelete: false,
        isOpenModalDeleteAll: false,
        selectedDeleteId: null,
        formValues: initialProductForm,
        isEdit: false,
        errors: {
            codigo: "",
            descripcion: "",
            categoriaId: 0,
            description: "",
            precioUnitario: "",
            stock: "",
            unidadMedida: ""
        },
        isHoveredExp: false,
        isHoveredImp: false,
        openAccionesId: null,
        anchorEl: null,
        uploadTarget: null,
        uploading: false,
        visibleColumns: initialVisibleColumns,
        showColumnFilter: false,
        vistaActual: isRestaurante ? 'cards' : 'tabla',
        marcaIdFilter: undefined
    });

    const debounce = useDebounce(state.searchClient, 600);
    const columnsStorageKey = `datatable:${auth?.empresaId || 'default'}:productos:visibleColumns`;
    const vistaStorageKey = `productos:vista:${auth?.empresaId || 'default'}`;

    // Effects

    // Load Design/Vista Preference
    useEffect(() => {
        const loadDiseno = async () => {
            if (!auth?.empresaId) return;
            try {
                const savedVista = localStorage.getItem(vistaStorageKey) as any;
                if (savedVista) {
                    setState(prev => ({ ...prev, vistaActual: savedVista }));
                } else if (window.innerWidth < 768 && !isRestaurante) {
                    setState(prev => ({ ...prev, vistaActual: 'lista' }));
                }
            } catch (error) {
                console.error("Error cargando diseño:", error);
            }
        };
        loadDiseno();
    }, [auth?.empresaId, isRestaurante, vistaStorageKey]);

    // Save Vista Preference
    useEffect(() => {
        if (state.vistaActual) localStorage.setItem(vistaStorageKey, state.vistaActual);
    }, [state.vistaActual, vistaStorageKey]);

    // Load Columns
    useEffect(() => {
        const loadColumns = () => {
            if (!auth?.empresaId) return;
            try {
                const raw = localStorage.getItem(columnsStorageKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        let restored = allColumns.filter(c => parsed.includes(c));
                        if (!restored.includes('Acciones')) restored = [...restored, 'Acciones'];
                        setState(prev => ({ ...prev, visibleColumns: restored }));
                    }
                }
            } catch (_e) { }
        };
        loadColumns();
    }, [auth?.empresaId, columnsStorageKey, allColumns]);

    // Save Columns
    useEffect(() => {
        try {
            const toSave = state.visibleColumns.includes('Acciones')
                ? state.visibleColumns
                : [...state.visibleColumns, 'Acciones'];
            localStorage.setItem(columnsStorageKey, JSON.stringify(toSave));
        } catch (_) { }
    }, [state.visibleColumns, columnsStorageKey]);

    // Cargar sedes solo en sede principal
    useEffect(() => {
        if (isAdmin && esPrincipal) listarSedes();
    }, [isAdmin, esPrincipal]);

    // Fetch Products
    useEffect(() => {
        getAllProducts({
            page: state.currentPage,
            limit: state.itemsPerPage,
            search: debounce,
            marcaId: state.marcaIdFilter,
            ...(effectiveSedeId ? { sedeId: effectiveSedeId } : {}),
        });
    }, [debounce, state.currentPage, state.itemsPerPage, state.marcaIdFilter, effectiveSedeId, getAllProducts]);

    // Close Modals on Success
    useEffect(() => {
        if (success === true) {
            setState(prev => ({ ...prev, isOpenModal: false, isEdit: false }));
        }
    }, [success]);

    // Click Outside Listener
    useEffect(() => {
        const handleDocClick = () => {
            if (state.openAccionesId !== null) setState(prev => ({ ...prev, openAccionesId: null }));
            if (state.showColumnFilter) setState(prev => ({ ...prev, showColumnFilter: false }));
        };
        document.addEventListener('click', handleDocClick);
        return () => document.removeEventListener('click', handleDocClick);
    }, [state.openAccionesId, state.showColumnFilter]);

    const hasFetchedBrands = useRef(false);

    // Load Brands
    useEffect(() => {
        if (!hasFetchedBrands.current && (!brands || brands.length === 0)) {
            getAllBrands();
            hasFetchedBrands.current = true;
        }
    }, [brands, getAllBrands]);

    // Handlers
    const handleGetProduct = async (data: any) => {
        setState(prev => ({ ...prev, isOpenModal: true, isEdit: true }));
        const originalProduct = products.find((p: IProduct) => p.id === data.productoId);

        if (originalProduct) {
            setState(prev => ({
                ...prev,
                formValues: {
                    ...initialProductForm,
                    ...originalProduct,
                    productoId: originalProduct.id,
                    unidadMedidaId: originalProduct.unidadMedida?.id || originalProduct.unidadMedidaId,
                    unidadMedidaNombre: originalProduct.unidadMedida?.nombre,
                    categoriaId: originalProduct.categoria?.id || originalProduct.categoriaId,
                    categoriaNombre: originalProduct.categoria?.nombre,
                    marcaId: (originalProduct as any).marca?.id || (originalProduct as any).marcaId,
                    marcaNombre: (originalProduct as any).marca?.nombre,
                    precioUnitario: Number(originalProduct.precioUnitario),
                    costoUnitario: Number(originalProduct.costoUnitario || originalProduct.costoPromedio || 0),
                    costoPromedio: Number(originalProduct.costoPromedio || 0),
                    stockMinimo: originalProduct.stockMinimo || 0,
                    stockMaximo: originalProduct.stockMaximo || 0,
                    imagenUrl: (originalProduct as any)?.imagenUrl || '',
                    principioActivo: (originalProduct as any).principioActivo || '',
                    concentracion: (originalProduct as any).concentracion || '',
                    presentacion: (originalProduct as any).presentacion || '',
                    laboratorio: (originalProduct as any).laboratorio || '',
                    unidadCompra: (originalProduct as any).unidadCompra || '',
                    unidadVenta: (originalProduct as any).unidadVenta || '',
                    factorConversion: Number((originalProduct as any).factorConversion || 1),
                }
            }));
        }
    };

    const handleUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !state.uploadTarget) return;
        try {
            setState(prev => ({ ...prev, uploading: true }));
            const fd = new FormData();
            fd.append('file', file);
            const url = `/producto/${state.uploadTarget!.id}/imagen`;
            const resp = await apiClient.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            useAlertStore.getState().alert('Imagen subida correctamente', 'success');
            const signed = resp?.data?.signedUrl || resp?.data?.data?.signedUrl;
            const nuevaUrl = signed || resp?.data?.data?.url || resp?.data?.url || resp?.data?.data?.imagenUrl || resp?.data?.imagenUrl || undefined;
            if (nuevaUrl) {
                setProductImage(state.uploadTarget!.id, nuevaUrl);
            } else {
                useAlertStore.getState().alert('No se recibió la URL de imagen.', 'warning');
            }
        } catch (error: any) {
            useAlertStore.getState().alert(error.response?.data?.message || 'Error al subir imagen', 'error');
        } finally {
            setState(prev => ({
                ...prev,
                uploading: false,
                uploadTarget: null
            }));
            if (uploadImageRef.current) uploadImageRef.current.value = '';
        }
    };

    const handleImportExcel = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const allowedTypes = ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
        if (!allowedTypes.includes(file.type)) {
            useAlertStore.getState().alert("Use archivo .xlsx o .xls válido", "error");
            return;
        }
        await importProductsAction(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await getAllProducts({ page: state.currentPage, limit: state.itemsPerPage, search: debounce });
    };

    const toggleColumn = (column: string) => {
        if (column === 'Acciones') return;
        setState(prev => {
            if (prev.visibleColumns.includes(column)) {
                return { ...prev, visibleColumns: prev.visibleColumns.filter(c => c !== column) };
            } else {
                return { ...prev, visibleColumns: allColumns.filter(col => prev.visibleColumns.includes(col) || col === column) };
            }
        });
    };

    const handleOpenDelete = (data: any) => {
        setState(prev => ({ ...prev, selectedDeleteId: Number(data.productoId), isOpenModalDelete: true }));
    };

    const confirmDeleteProduct = async () => {
        if (!state.selectedDeleteId) return;
        await deleteProduct(state.selectedDeleteId);
        setState(prev => ({ ...prev, isOpenModalDelete: false, selectedDeleteId: null }));
        await getAllProducts({ page: state.currentPage, limit: state.itemsPerPage, search: debounce });
    };

    const confirmDeleteAllProducts = async () => {
        await deleteAllProducts(effectiveSedeId ?? undefined);
        setState(prev => ({ ...prev, isOpenModalDeleteAll: false }));
        await getAllProducts({ page: state.currentPage, limit: state.itemsPerPage, search: debounce });
    };

    const handleToggleClientState = async (data: any) => {
        setState(prev => ({ ...prev, formValues: data, isOpenModalConfirm: true }));
    };

    const confirmToggleroduct = () => {
        toggleStateProduct(Number(state.formValues?.productoId));
        setState(prev => ({ ...prev, isOpenModalConfirm: false }));
    };

    const togglePublicarTienda = async (producto: any) => {
        try {
            await apiClient.patch(`producto/${producto.id}/publicar-tienda`, {
                publicarEnTienda: !producto.publicarEnTienda,
            });
            await getAllProducts({ page: state.currentPage, limit: state.itemsPerPage, search: debounce });
        } catch {
            // silently ignore
        }
    };

    const actions = {
        setcurrentPage: (page: number) => setState(prev => ({ ...prev, currentPage: page })),
        setitemsPerPage: (items: number) => setState(prev => ({ ...prev, itemsPerPage: items })),
        setSearchClient: (e: any) => setState(prev => ({ ...prev, searchClient: e.target.value })),
        setIsOpenModal: (v: boolean) => setState(prev => ({ ...prev, isOpenModal: v })),
        setIsOpenModalCatalog: (v: boolean) => setState(prev => ({ ...prev, isOpenModalCatalog: v })),
        setIsOpenModalCategory: (v: boolean) => setState(prev => ({ ...prev, isOpenModalCategory: v })),
        setIsOpenModalBrands: (v: boolean) => setState(prev => ({ ...prev, isOpenModalBrands: v })),
        setIsOpenModalConfirm: (v: boolean) => setState(prev => ({ ...prev, isOpenModalConfirm: v })),
        setIsOpenModalDelete: (v: boolean) => setState(prev => ({ ...prev, isOpenModalDelete: v })),
        setIsOpenModalDeleteAll: (v: boolean) => setState(prev => ({ ...prev, isOpenModalDeleteAll: v })),
        setIsEdit: (v: boolean) => setState(prev => ({ ...prev, isEdit: v })),
        setErrors: (errors: any) => setState(prev => ({ ...prev, errors })),
        setFormValues: (values: any) => setState(prev => ({ ...prev, formValues: values })),
        setIsHoveredExp: (v: boolean) => setState(prev => ({ ...prev, isHoveredExp: v })),
        setIsHoveredImp: (v: boolean) => setState(prev => ({ ...prev, isHoveredImp: v })),
        setVistaActual: (v: any) => setState(prev => ({ ...prev, vistaActual: v })),
        setOpenAccionesId: (id: number | null) => setState(prev => ({ ...prev, openAccionesId: id })),
        setAnchorEl: (el: HTMLElement | null) => setState(prev => ({ ...prev, anchorEl: el })),
        setUploadTarget: (t: any) => setState(prev => ({ ...prev, uploadTarget: t })),
        // Complex Actions
        handleGetProduct,
        handleUploadImage,
        handleImportExcel,
        toggleColumn,
        handleOpenDelete,
        confirmDeleteProduct,
        confirmDeleteAllProducts,
        handleToggleClientState,
        confirmToggleroduct,
        togglePublicarTienda,
        exportProducts: () => exportProductsAction(auth?.empresaId, debounce),
        refreshProducts: async () => {
            await getAllProducts({ page: state.currentPage, limit: state.itemsPerPage, search: debounce, marcaId: state.marcaIdFilter });
        }
    };

    const selectedSedeName = effectiveSedeId
        ? (sedes.find(s => s.id === effectiveSedeId)?.nombre ?? null)
        : null;

    return {
        ...state,
        auth,
        labels,
        products,
        totalProducts,
        loading,
        fileInputRef,
        uploadImageRef,
        isRestaurante,
        isCodigoBarrasEnabled,
        actions,
        // Sede filtering
        isAdmin,
        esPrincipal,
        effectiveSedeId,
        selectedSedeName,
        sedesOptions,
        handleSelectSede,
        // Computed
        indexOfFirstItem: (state.currentPage - 1) * state.itemsPerPage,
        indexOfLastItem: state.currentPage * state.itemsPerPage,
        pages: Array.from({ length: Math.ceil(totalProducts / state.itemsPerPage) }, (_, i) => i + 1)
    };
};
