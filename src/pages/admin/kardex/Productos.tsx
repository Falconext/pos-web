import { ChangeEvent, useEffect, useRef, useState } from "react";
import Input from "@/components/Input";
import DataTable from "@/components/Datatable";
import { Icon } from "@iconify/react/dist/iconify.js";
import ModalConfirm from "@/components/ModalConfirm";
import { IFormProduct, IProduct } from "@/interfaces/products";
import Pagination from "@/components/Pagination";
import useAlertStore from "@/zustand/alert";
import { IProductsState, useProductsStore } from "@/zustand/products";
import TableSkeleton from "@/components/Skeletons/table";
import { useAuthStore } from "@/zustand/auth";
import { useDebounce } from "@/hooks/useDebounce";
import ModalProduct from "./modal-productos";
import ModalCatalogo from "./modal-catalogo";
import ModalCategories from "./modal-categorias";
import ModalMarcas from "./modal-marcas";
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";
import apiClient from "@/utils/apiClient";
import CardRestaurante from "@/components/productos/CardRestaurante";
import ListaBodega from "@/components/productos/ListaBodega";
import TablaFerreteria from "@/components/productos/TablaFerreteria";
import { useBrandsStore } from "@/zustand/brands";

const KardexProductos = () => {

    const { getAllProducts, totalProducts, products, toggleStateProduct, exportProducts, importProducts, deleteProduct, setProductImage }: IProductsState = useProductsStore();
    const { success, loading } = useAlertStore();
    const { auth } = useAuthStore();

    // Detectar si el rubro es restaurante para cambiar textos y vista por defecto
    const isRestaurante = (() => {
        const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
        return rubroNombre.includes('restaurante') || rubroNombre.includes('comida') || rubroNombre.includes('alimento');
    })();

    // Labels dinámicos según el rubro
    const labels = {
        titulo: isRestaurante ? 'Platos' : 'Productos',
        nuevoBtn: isRestaurante ? 'Nuevo plato' : 'Nuevo producto',
        nuevoBtnMobile: isRestaurante ? '+ Plato' : '+ Nuevo',
        buscar: isRestaurante ? 'Buscar plato' : 'Buscar nombre y código',
        confirmarEstado: isRestaurante ? '¿Estás seguro que deseas cambiar el estado de este plato?' : '¿Estás seguro que deseas cambiar el estado de este producto?',
        eliminar: isRestaurante ? 'Eliminar plato' : 'Eliminar producto',
        eliminarInfo: isRestaurante ? 'Esta acción eliminará el plato de tu catálogo. ¿Deseas continuar?' : 'Esta acción eliminará el producto de tu empresa (eliminación lógica). ¿Deseas continuar?',
    };
    const [isHoveredExp, setIsHoveredExp] = useState(false);
    const [isHoveredImp, setIsHoveredImp] = useState(false);
    const [currentPage, setcurrentPage] = useState(1);
    const [itemsPerPage, setitemsPerPage] = useState(50);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadImageRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<{ id: number; tipo: 'principal' } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [openAccionesId, setOpenAccionesId] = useState<number | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        'Img',
        'Código',
        'Producto',
        'Categoria',
        'Marca',
        'Precio Venta',
        'Costo',
        'Margen',
        'Ganancia/Unidad',
        'Stock',
        'Stock minimo',
        'U.M',
        'Estado',
        'Acciones'
    ]);
    const [showColumnFilter, setShowColumnFilter] = useState(false);
    // Vista por defecto: cards para restaurantes, tabla para otros rubros
    const [vistaActual, setVistaActual] = useState<'cards' | 'tabla' | 'lista'>(isRestaurante ? 'cards' : 'tabla');
    const [disenoConfig, setDisenoConfig] = useState<any>(null);

    const allColumns = [
        'Img',
        'Código',
        'Producto',
        'Categoria',
        'Marca',
        'Precio Venta',
        'Costo',
        'Margen',
        'Ganancia/Unidad',
        'Stock',
        'Stock minimo',
        'U.M',
        'Estado',
        'Acciones'
    ];

    const columnsStorageKey = `datatable:${auth?.empresaId || 'default'}:productos:visibleColumns`;
    const vistaStorageKey = `productos:vista:${auth?.empresaId || 'default'}`;

    // Cargar configuración de diseño
    useEffect(() => {
        const loadDiseno = async () => {
            if (!auth?.empresaId) return;
            try {
                // Cargar preferencia local primero
                const savedVista = localStorage.getItem(vistaStorageKey) as 'cards' | 'tabla' | 'lista' | null;
                if (savedVista) {
                    setVistaActual(savedVista);
                }
                // Luego intentar cargar configuración de diseño de backend
                const { data } = await apiClient.get('/diseno-rubro/mi-empresa');
                const payload = data?.data || data;
                if (payload) {
                    setDisenoConfig(payload);
                    if (!savedVista && payload.vistaProductos) {
                        setVistaActual(payload.vistaProductos);
                    }
                }
            } catch (error) {
                console.error("Error cargando diseño:", error);
            }
        };
        loadDiseno();
    }, [auth?.empresaId, vistaStorageKey]);

    // Persistir vista seleccionada en localStorage
    useEffect(() => {
        try {
            if (vistaActual) localStorage.setItem(vistaStorageKey, vistaActual);
        } catch (_) { /* noop */ }
    }, [vistaActual, vistaStorageKey]);

    // Cargar columnas: solo localStorage (backend no implementado)
    useEffect(() => {
        const loadColumns = () => {
            if (!auth?.empresaId) return;

            // Cargar desde localStorage
            try {
                const defaultKey = columnsStorageKey.replace(`${auth.empresaId}`, 'default');
                const candidates = [columnsStorageKey, defaultKey];
                let parsed: any = null;
                for (const k of candidates) {
                    const raw = localStorage.getItem(k);
                    if (raw) {
                        try { parsed = JSON.parse(raw); } catch { parsed = null; }
                    }
                    if (Array.isArray(parsed)) break;
                }
                if (Array.isArray(parsed)) {
                    let restored: string[] = allColumns.filter((c) => parsed.includes(c));
                    if (!restored.includes('Acciones')) restored = [...restored, 'Acciones'];
                    setVisibleColumns(restored);
                }
            } catch (_e) {
                // noop
            }
        };

        loadColumns();
    }, [auth?.empresaId, columnsStorageKey]);

    // Guardar cambios de columnas en localStorage
    useEffect(() => {
        try {
            const toSave = visibleColumns.includes('Acciones')
                ? visibleColumns
                : [...visibleColumns, 'Acciones'];
            localStorage.setItem(columnsStorageKey, JSON.stringify(toSave));
        } catch (e) {
            // noop
        }
    }, [visibleColumns, columnsStorageKey]);
    const toggleColumn = (column: string) => {
        if (column === 'Acciones') return; // Siempre visible
        setVisibleColumns(prev => {
            if (prev.includes(column)) {
                // Ocultar columna
                return prev.filter(c => c !== column);
            } else {
                // Mostrar columna en su posición original
                const newVisible = allColumns.filter(col =>
                    prev.includes(col) || col === column
                );
                return newVisible;
            }
        });
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages: number[] = [];
    for (let i = 1; i <= Math.ceil(totalProducts / itemsPerPage); i++) {
        pages.push(i);
    }

    const initialForm: IFormProduct = {
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
        costoUnitario: 0
    }

    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isOpenModalCatalog, setIsOpenModalCatalog] = useState(false);
    const [isOpenModalCategory, setIsOpenModalCategory] = useState(false);
    const [isOpenModalBrands, setIsOpenModalBrands] = useState(false);
    const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
    const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
    const [searchClient, setSearchClient] = useState<string>("");
    const { brands, getAllBrands } = useBrandsStore();
    const [marcaIdFilter, setMarcaIdFilter] = useState<number | undefined>(undefined);
    const [formValues, setFormValues] = useState<IFormProduct>(initialForm);
    const [isEdit, setIsEdit] = useState(false);
    const [errors, setErrors] = useState({
        codigo: "",
        descripcion: "",
        categoriaId: 0,
        description: "",
        precioUnitario: "",
        stock: "",
        unidadMedida: ""
    });
    const debounce = useDebounce(searchClient, 600);

    const handleGetProduct = async (data: any) => {
        setIsOpenModal(true);
        setIsEdit(true);

        // Buscar el producto original para obtener datos completos
        const originalProduct = products.find(p => p.id === data.productoId);

        if (originalProduct) {
            setFormValues({
                ...initialForm,
                ...originalProduct,
                productoId: originalProduct.id,
                unidadMedidaId: originalProduct.unidadMedida?.id || originalProduct.unidadMedidaId,
                unidadMedidaNombre: originalProduct.unidadMedida?.nombre,
                categoriaId: originalProduct.categoria?.id || originalProduct.categoriaId,
                categoriaNombre: originalProduct.categoria?.nombre,
                marcaId: (originalProduct as any).marca?.id || (originalProduct as any).marcaId,
                marcaNombre: (originalProduct as any).marca?.nombre,
                // Aseguramos que valores numéricos sean correctos
                precioUnitario: Number(originalProduct.precioUnitario),
                costoUnitario: Number(originalProduct.costoUnitario || originalProduct.costoPromedio || 0),
                costoPromedio: Number(originalProduct.costoPromedio || 0),
                stock: originalProduct.stock,
                stockMinimo: originalProduct.stockMinimo || 0,
                stockMaximo: originalProduct.stockMaximo || 0,
                imagenUrl: (originalProduct as any)?.imagenUrl || '',
            });
        }
    };

    const handleUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !uploadTarget) return;
        try {
            setUploading(true);
            const fd = new FormData();
            fd.append('file', file);
            const url = `/producto/${uploadTarget.id}/imagen`;
            const resp = await apiClient.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            useAlertStore.getState().alert('Imagen subida correctamente', 'success');
            // Esperar URL de AWS devuelta por el backend (no usar ObjectURL local)
            const signed = resp?.data?.signedUrl || resp?.data?.data?.signedUrl;
            const nuevaUrl = signed || resp?.data?.data?.url || resp?.data?.url || resp?.data?.data?.imagenUrl || resp?.data?.imagenUrl || undefined;
            if (nuevaUrl) {
                setProductImage(uploadTarget.id, nuevaUrl as any);
            } else {
                useAlertStore.getState().alert('No se recibió la URL de imagen. Intenta nuevamente.', 'warning');
            }
        } catch (error: any) {
            useAlertStore.getState().alert(error.response?.data?.message || 'Error al subir imagen', 'error');
        } finally {
            setUploading(false);
            if (uploadImageRef.current) uploadImageRef.current.value = '';
            setUploadTarget(null);
        }
    };

    useEffect(() => {
        if (success === true) {
            setIsOpenModal(false);
            setIsEdit(false)
        }
    }, [success])

    console.log(products)

    useEffect(() => {
        const handleDocClick = () => {
            if (openAccionesId !== null) setOpenAccionesId(null);
            if (showColumnFilter) setShowColumnFilter(false);
        };
        document.addEventListener('click', handleDocClick);
        return () => document.removeEventListener('click', handleDocClick);
    }, [openAccionesId, showColumnFilter]);

    useEffect(() => {
        if (!brands || brands.length === 0) {
            getAllBrands();
        }
    }, []);

    const productsTable = products?.map((item: IProduct) => {
        const costo = Number(item?.costoUnitario > 0 ? item?.costoUnitario : item?.costoPromedio || 0);
        const precio = Number(item?.precioUnitario || 0);
        const margen = precio > 0 && costo > 0 ? ((precio - costo) / precio * 100) : 0;
        const gananciaUnidad = precio - costo;

        const allData: any = {
            productoId: item?.id,
            'Img': (item as any)?.imagenUrl ? (<img src={(item as any).imagenUrl} alt={item?.descripcion} className="w-12 h-12 object-cover rounded" />) : '',
            'Código': item?.codigo,
            'Producto': item?.descripcion,
            'Categoria': item?.categoria?.nombre || 'Sin categoría',
            'Marca': (item as any)?.marca?.nombre || 'Sin marca',
            categoriaId: item?.categoriaId !== null ? "" : item?.categoria?.id,
            unidadMedidaId: item?.unidadMedida?.id || item?.unidadMedidaId,
            marcaId: (item as any)?.marca?.id || (item as any)?.marcaId || null,
            marcaNombre: (item as any)?.marca?.nombre || "",
            'Precio Venta': `S/ ${precio.toFixed(2)}`,
            'Costo': costo > 0 ? `S/ ${costo.toFixed(2)}` : '-',
            'Margen': margen > 0 ? `${margen.toFixed(1)}%` : '-',
            'Ganancia/Unidad': gananciaUnidad > 0 ? `S/ ${gananciaUnidad.toFixed(2)}` : '-',
            'Stock': (
                <span className={`inline-flex items-center text-xs font-semibold ${item?.stock <= 5
                    ? 'bg-red-400 text-white px-2 py-1 rounded'
                    : item?.stock <= 10
                        ? 'bg-yellow-400 text-white px-2 py-1 rounded'
                        : 'bg-green-400 text-white px-2 py-1 rounded'
                    }`}>
                    {item?.stock}
                </span>
            ),
            'Stock minimo': item?.stockMinimo ?? 0,
            'U.M': item?.unidadMedida.nombre,
            'Estado': item.estado,
        };

        // Crear rowBase solo con columnas visibles en el orden de allColumns
        const rowBase: any = {};
        allColumns.forEach(col => {
            if (visibleColumns.includes(col) && allData.hasOwnProperty(col)) {
                rowBase[col] = allData[col];
            }
        });
        // Mantener campos auxiliares para el modal
        rowBase.productoId = item?.id;
        rowBase.categoriaId = allData.categoriaId;
        rowBase.unidadMedidaId = allData.unidadMedidaId;
        rowBase.marcaId = allData.marcaId;
        rowBase.marcaNombre = allData.marcaNombre;

        const isOpen = openAccionesId === item.id;

        const acciones = (
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={() => setOpenAccionesId(isOpen ? null : item.id)}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-300 bg-white flex items-center gap-1"
                >
                    <Icon icon="mdi:dots-vertical" width={18} height={18} />
                </button>
                {isOpen && (
                    <div className="absolute flex flex-col right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <button
                            type="button"
                            onClick={() => { handleGetProduct(rowBase); setOpenAccionesId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                        >

                            <span>Editar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setUploadTarget({ id: Number(rowBase.productoId), tipo: 'principal' }); uploadImageRef.current?.click(); setOpenAccionesId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                        >

                            <span>Subir imagen</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { handleToggleClientState(rowBase); setOpenAccionesId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                        >

                            <span>{rowBase.estado === 'INACTIVO' ? 'Activar' : 'Desactivar'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { handleOpenDelete(rowBase); setOpenAccionesId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                        >

                            <span>Eliminar</span>
                        </button>
                    </div>
                )}
            </div>
        );

        return { ...rowBase, 'Acciones': acciones };
    })

    const handleToggleClientState = async (data: any) => {
        setFormValues(data);
        setIsOpenModalConfirm(true);
    };

    const handleOpenDelete = (data: any) => {
        setSelectedDeleteId(Number(data.productoId));
        setIsOpenModalDelete(true);
    };

    // Acciones ahora se gestionan por dropdown en la columna 'Acciones'

    useEffect(() => {
        getAllProducts({
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
            marcaId: marcaIdFilter,
        });
    }, [debounce, currentPage, itemsPerPage, marcaIdFilter]);



    const closeModal = () => {
        setIsOpenModal(false);
        setIsOpenModalCategory(false)
        setIsEdit(false)
    }

    const handleChange = (e: any) => {
        setSearchClient(e.target.value)
    }

    const confirmToggleroduct = () => {
        toggleStateProduct(Number(formValues?.productoId))
        setIsOpenModalConfirm(false)
    }

    const confirmDeleteProduct = async () => {
        if (!selectedDeleteId) return;
        await deleteProduct(selectedDeleteId);
        setIsOpenModalDelete(false);
        setSelectedDeleteId(null);
        await getAllProducts({ page: currentPage, limit: itemsPerPage, search: debounce });
    };

    const handleImportExcel = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        if (!allowedTypes.includes(file.type)) {
            useAlertStore.getState().alert("Por favor, selecciona un archivo Excel válido (.xlsx o .xls)", "error");
            return;
        }

        await importProducts(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        await getAllProducts({
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
        });
    };

    // Renderizado condicional según vista
    const renderContent = () => {
        // Skeleton específico para vista cards (restaurante)
        if (vistaActual === 'cards' && loading) {
            return (
                <CardRestaurante
                    loading
                    skeletonCount={itemsPerPage > 0 ? Math.min(itemsPerPage, 12) : 8}
                    products={[] as any}
                    onEdit={(p) => handleGetProduct({ ...p, productoId: p.id, precioUnitario: `S/ ${p.precioUnitario}` })}
                    onDelete={(p) => handleOpenDelete({ ...p, productoId: p.id })}
                    onToggleState={(p) => handleToggleClientState({ ...p, productoId: p.id })}
                    onUploadImage={(p) => { setUploadTarget({ id: p.id, tipo: 'principal' }); uploadImageRef.current?.click(); }}
                />
            );
        }

        if (!products || products.length === 0) return <TableSkeleton />;

        switch (vistaActual) {
            case 'cards':
                return (
                    <>
                        <CardRestaurante
                            loading={loading}
                            skeletonCount={itemsPerPage > 0 ? Math.min(itemsPerPage, 12) : 8}
                            products={products}
                            onEdit={(p) => handleGetProduct({ ...p, productoId: p.id, precioUnitario: `S/ ${p.precioUnitario}` })}
                            onDelete={(p) => handleOpenDelete({ ...p, productoId: p.id })}
                            onToggleState={(p) => handleToggleClientState({ ...p, productoId: p.id })}
                            onUploadImage={(p) => { setUploadTarget({ id: p.id, tipo: 'principal' }); uploadImageRef.current?.click(); }}
                        />
                        <Pagination
                            data={products}
                            optionSelect
                            currentPage={currentPage}
                            indexOfFirstItem={indexOfFirstItem}
                            indexOfLastItem={indexOfLastItem}
                            setcurrentPage={setcurrentPage}
                            setitemsPerPage={setitemsPerPage}
                            pages={pages}
                            total={totalProducts}
                        />
                    </>
                );
            case 'lista':
                return (
                    <>
                        <ListaBodega
                            products={products}
                            onEdit={(p) => handleGetProduct({ ...p, productoId: p.id, precioUnitario: `S/ ${p.precioUnitario}` })}
                            onDelete={(p) => handleOpenDelete({ ...p, productoId: p.id })}
                            onToggleState={(p) => handleToggleClientState({ ...p, productoId: p.id })}
                        />
                        <Pagination
                            data={products}
                            optionSelect
                            currentPage={currentPage}
                            indexOfFirstItem={indexOfFirstItem}
                            indexOfLastItem={indexOfLastItem}
                            setcurrentPage={setcurrentPage}
                            setitemsPerPage={setitemsPerPage}
                            pages={pages}
                            total={totalProducts}
                        />
                    </>
                );
            case 'tabla':
            default:
                return (
                    <TablaFerreteria
                        productsTable={productsTable}
                        visibleColumns={visibleColumns}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        totalProducts={totalProducts}
                        indexOfFirstItem={indexOfFirstItem}
                        indexOfLastItem={indexOfLastItem}
                        pages={pages}
                        setcurrentPage={setcurrentPage}
                        setitemsPerPage={setitemsPerPage}
                    />
                );
        }
    };

    const [isOpenModalDeleteAll, setIsOpenModalDeleteAll] = useState(false);
    const { deleteAllProducts } = useProductsStore();

    // ... (existing code)

    const confirmDeleteAllProducts = async () => {
        await deleteAllProducts();
        setIsOpenModalDeleteAll(false);
        await getAllProducts({ page: currentPage, limit: itemsPerPage, search: debounce });
    };

    return (
        <div className="min-h-screen pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{labels.titulo}</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestiona tu inventario de {labels.titulo.toLowerCase()}</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        color="secondary"
                        outline
                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300"
                        onClick={() => setIsOpenModalDeleteAll(true)}
                    >
                        <Icon icon="solar:trash-bin-trash-bold" className="text-lg mr-2" />
                        Eliminar todo
                    </Button>
                    <Button
                        color="secondary"
                        onClick={() => {
                            setFormValues(initialForm);
                            setErrors({
                                descripcion: "",
                                categoriaId: 0,
                                description: "",
                                precioUnitario: "",
                                stock: "",
                                codigo: "",
                                unidadMedida: ""
                            });
                            setIsOpenModal(true);
                        }}
                        className="flex items-center gap-2"
                    >
                        <Icon icon="solar:add-circle-bold" className="text-lg" />
                        {labels.nuevoBtn}
                    </Button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Search and Actions */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <InputPro name="search" value={searchClient} onChange={handleChange} label={labels.buscar} isLabel />
                        </div>
                        <div className="flex flex-wrap gap-2 top-8 relative">
                            <Button
                                color="lila"
                                outline
                                onClick={() => setIsOpenModalCategory(true)}
                                className="text-sm"
                            >
                                <Icon icon="solar:tag-bold-duotone" className="mr-1.5" />
                                Categorías
                            </Button>
                            <Button
                                color="lila"
                                outline
                                onClick={() => setIsOpenModalBrands(true)}
                                className="text-sm"
                            >
                                <Icon icon="solar:star-bold-duotone" className="mr-1.5" />
                                Marcas
                            </Button>
                            <Button
                                color="success"
                                outline
                                onMouseEnter={() => setIsHoveredExp(true)}
                                onMouseLeave={() => setIsHoveredExp(false)}
                                onClick={() => exportProducts(auth?.empresaId, debounce)}
                                className="text-sm"
                            >
                                <Icon icon="solar:export-bold" className="mr-1.5" />
                                Exportar
                            </Button>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    ref={fileInputRef}
                                    onChange={handleImportExcel}
                                    className="hidden"
                                />
                                <Button
                                    color="success"
                                    outline
                                    onMouseEnter={() => setIsHoveredImp(true)}
                                    onMouseLeave={() => setIsHoveredImp(false)}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-sm"
                                >
                                    <Icon icon="solar:import-bold" className="mr-1.5" />
                                    Importar
                                </Button>
                            </div>
                            <Button
                                color="primary"
                                onClick={() => setIsOpenModalCatalog(true)}
                                className="text-sm"
                            >
                                <Icon icon="solar:cloud-download-bold" className="mr-1.5" />
                                Catálogo
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="p-4">
                    {/* Input oculto para subir imágenes */}
                    <input
                        type="file"
                        accept="image/*"
                        ref={uploadImageRef}
                        onChange={handleUploadImage}
                        className="hidden"
                        disabled={uploading}
                    />

                    {renderContent()}

                    {/* Modales */}
                    <ModalCategories isOpenModal={isOpenModalCategory} closeModal={() => setIsOpenModalCategory(false)} setIsOpenModal={setIsOpenModalCategory} />
                    <ModalMarcas isOpenModal={isOpenModalBrands} closeModal={() => setIsOpenModalBrands(false)} setIsOpenModal={setIsOpenModalBrands} />
                </div>
            </div>

            {isOpenModal && <ModalProduct
                closeModal={closeModal}
                errors={errors}
                initialForm={initialForm}
                formValues={formValues}
                setErrors={setErrors}
                setFormValues={setFormValues}
                isEdit={isEdit}
                isOpenModal={isOpenModal}
                setIsOpenModal={setIsOpenModal}
            />}
            {isOpenModalCatalog && <ModalCatalogo
                isOpen={isOpenModalCatalog}
                onClose={() => setIsOpenModalCatalog(false)}
                onSuccess={() => getAllProducts({ page: currentPage, limit: itemsPerPage, search: debounce })}
            />}
            {isOpenModalCategory && <ModalCategories isOpenModal={isOpenModalCategory} setIsOpenModal={setIsOpenModalCategory} closeModal={closeModal} />}
            {isOpenModalConfirm && <ModalConfirm confirmSubmit={confirmToggleroduct} isOpenModal={isOpenModalConfirm} setIsOpenModal={setIsOpenModalConfirm} title="Confirmación" information={labels.confirmarEstado} />}
            {isOpenModalDelete && <ModalConfirm confirmSubmit={confirmDeleteProduct} isOpenModal={isOpenModalDelete} setIsOpenModal={setIsOpenModalDelete} title={labels.eliminar} information={labels.eliminarInfo} />}
            {isOpenModalDeleteAll && (
                <ModalConfirm
                    confirmSubmit={confirmDeleteAllProducts}
                    isOpenModal={isOpenModalDeleteAll}
                    setIsOpenModal={setIsOpenModalDeleteAll}
                    title="Eliminar todos los productos"
                    information="¿Estás seguro de que deseas eliminar TODOS los productos? Esta acción moverá todos los productos a la papelera (excepto los del sistema) y no se mostrarán en el inventario. Esta acción no se puede deshacer fácilmente."
                />
            )}
        </div>
    );
};

export default KardexProductos;