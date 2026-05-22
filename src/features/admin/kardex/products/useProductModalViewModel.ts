import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useCategoriesStore } from "@/zustand/categories";
import { IExtentionsState, useExtentionsStore } from "@/zustand/extentions";
import { IProductsState, useProductsStore } from "@/zustand/products";
import { useAuthStore } from "@/zustand/auth";
import useAlertStore from "@/zustand/alert";
import { useBrandsStore } from '@/zustand/brands';
import { useModificadoresStore } from '@/zustand/modificadores';
import { esRubroFabricacion, useRubroFeatures } from '@/utils/rubro-features';
import apiClient from "@/utils/apiClient";
import { IPropsProducts, TipoAjusteStock, ICreationLote, IWholesaleOption } from "./ProductModalModel";

export const useProductModalViewModel = (props: IPropsProducts) => {
    const {
        setSelectProduct, isInvoice, initialForm, formValues, setErrors,
        isOpenModal, setFormValues, closeModal, isEdit, errors, setIsOpenModal
    } = props;

    // --- Global Stores ---
    const { getUnitOfMeasure, unitOfMeasure }: IExtentionsState = useExtentionsStore();
    const { auth } = useAuthStore();
    const { getAllCategories, categories } = useCategoriesStore();
    const { editProduct, addProduct, getCodeProduct, productCode, setProductImage, upsertProductLocal }: IProductsState = useProductsStore();
    const { brands, getAllBrands, addBrand } = useBrandsStore();
    const { grupos: gruposModificadores, getAllGrupos } = useModificadoresStore();

    // --- Local State ---
    const [gruposSeleccionados, setGruposSeleccionados] = useState<number[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Rubro Detections & Features ---
    const isRestaurante = (() => {
        const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
        return rubroNombre.includes('restaurante') || rubroNombre.includes('comida') || rubroNombre.includes('alimento');
    })();

    const isFarmacia = (() => {
        const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
        return rubroNombre.includes('farmacia') || rubroNombre.includes('botica');
    })();

    const isFabricacion = esRubroFabricacion(auth?.empresa?.rubro?.nombre);

    const features = useRubroFeatures(auth?.empresa?.rubro?.nombre, {
        usaCodigoBarrasManual: auth?.empresa?.usaCodigoBarrasManual,
    });

    const labels = {
        titulo: isRestaurante ? 'Plato' : isFarmacia ? 'Medicamento' : isFabricacion ? 'Ítem de producción' : 'Producto',
        nombre: isRestaurante ? 'Nombre del plato' : isFarmacia ? 'Nombre del medicamento' : isFabricacion ? 'Nombre del ítem' : 'Nombre del producto',
        codigo: isRestaurante ? 'Código del plato' : isFarmacia ? 'Código' : isFabricacion ? 'Código del ítem' : 'Código de producto',
        imagen: isRestaurante ? 'Imagen del plato' : 'Imagen del producto',
        precio: isRestaurante ? 'Precio (S/)' : 'Precio de Venta (S/)',
    };

    // --- Media State ---
    const [filePrincipal, setFilePrincipal] = useState<File | null>(null);
    const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const filePrincipalInputRef = useRef<HTMLInputElement | null>(null);

    // --- Stock State ---
    const [tipoAjusteStock, setTipoAjusteStock] = useState<TipoAjusteStock>('ninguno');
    const [cantidadAjuste, setCantidadAjuste] = useState<number>(0);
    const [stockOriginal] = useState<number>(formValues?.stock || 0);

    // --- Drawers State ---
    const [showMedicamentoModal, setShowMedicamentoModal] = useState(false);
    const [showLotesModal, setShowLotesModal] = useState(false);

    // --- Form State ---
    const [loading, setLoading] = useState(false);
    const [creationLote, setCreationLote] = useState<ICreationLote>({ lote: '', fechaVencimiento: '' });

    // --- Wholesale Options State ---
    const [newWholesaleOption, setNewWholesaleOption] = useState({ cantidadMinima: '', precio: '' });

    // --- Barcode Global Search ---
    const [barcodeQuery, setBarcodeQuery] = useState('');
    const [searchingBarcode, setSearchingBarcode] = useState(false);

    const resolveBrand = async (brandRaw: string): Promise<{ marcaId: number | null; marcaNombre: string } | null> => {
        const nombre = brandRaw.split(',')[0].trim();
        if (!nombre) return null;
        const existing = brands.find(b => b.nombre.toLowerCase() === nombre.toLowerCase());
        if (existing) return { marcaId: existing.id, marcaNombre: existing.nombre };
        try {
            const created: any = await (addBrand as any)({ nombre });
            if (created?.id) return { marcaId: created.id, marcaNombre: nombre };
        } catch { }
        return { marcaId: null, marcaNombre: nombre };
    };

    const handleBarcodeGlobalSearch = async () => {
        const code = barcodeQuery.trim().replace(/\D/g, '');
        if (code.length < 8) return;
        setSearchingBarcode(true);
        try {
            let filled = false;

            // 1. Backend local catalog
            try {
                const resp = await apiClient.get(`producto/barcode/${encodeURIComponent(code)}`);
                const product = (resp.data as any)?.data;
                if (product?.descripcion) {
                    let brandUpdate: { marcaId?: number | null; marcaNombre?: string } = {};
                    if (product.marca?.id) {
                        brandUpdate = { marcaId: product.marca.id, marcaNombre: product.marca.nombre };
                    } else if (product.marcaStr) {
                        const brandData = await resolveBrand(product.marcaStr);
                        if (brandData) brandUpdate = { marcaId: brandData.marcaId, marcaNombre: brandData.marcaNombre };
                    }
                    const categoryUpdate: { categoriaId?: number | null; categoriaNombre?: string } = product.categoria?.id
                        ? { categoriaId: product.categoria.id, categoriaNombre: product.categoria.nombre }
                        : {};
                    setFormValues({
                        ...formValues,
                        descripcion: product.descripcion,
                        codigoBarras: code,
                        ...(product.imagenUrl ? { imagenUrl: product.imagenUrl } : {}),
                        ...brandUpdate,
                        ...categoryUpdate,
                    });
                    if (product.imagenUrl) setPreviewPrincipal(product.imagenUrl);
                    filled = true;
                }
            } catch { }

            // 2. Open Food Facts fallback
            if (!filled) {
                const offResp = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
                const offData = await offResp.json();
                if (offData?.status === 1 && offData?.product) {
                    const p = offData.product;
                    const imgUrl = p.image_front_url || p.image_url || null;

                    // Resolve brand: find existing or create new
                    const brandData = p.brands ? await resolveBrand(p.brands) : null;

                    setFormValues({
                        ...formValues,
                        descripcion: p.product_name || p.product_name_es || p.generic_name || formValues.descripcion,
                        codigoBarras: code,
                        ...(imgUrl ? { imagenUrl: imgUrl } : {}),
                        ...(brandData ? { marcaId: brandData.marcaId, marcaNombre: brandData.marcaNombre } : {}),
                    });
                    if (imgUrl) setPreviewPrincipal(imgUrl);
                    filled = true;
                }
            }

            if (!filled) setFormValues({ ...formValues, codigoBarras: code });
        } finally {
            setSearchingBarcode(false);
        }
    };

    // --- Initial Effect Triggers ---
    useEffect(() => {
        if (!unitOfMeasure || (Array.isArray(unitOfMeasure) && unitOfMeasure.length === 0)) getUnitOfMeasure();
        if (!categories || (Array.isArray(categories) && categories.length === 0)) getAllCategories({});
        if (!brands || brands.length === 0) getAllBrands();
        if (!gruposModificadores || gruposModificadores.length === 0) getAllGrupos();
    }, []);

    useEffect(() => {
        if (!isOpenModal) return;
        if (!isEdit && auth && auth.empresaId && !formValues?.codigo) {
            getCodeProduct(auth.empresaId);
        }
    }, [isOpenModal, isEdit, auth]);

    useEffect(() => {
        if (!isOpenModal) return;
        if (isEdit && (formValues as any)?.imagenUrl && !previewPrincipal) {
            setPreviewPrincipal((formValues as any).imagenUrl);
        }
        if (isEdit && formValues?.productoId) {
            cargarGruposAsignados(formValues.productoId);
        }
    }, [isOpenModal, isEdit]);

    useEffect(() => {
        if (!isOpenModal) {
            setPreviewPrincipal(null);
            setFilePrincipal(null);
            setGruposSeleccionados([]);
            setCreationLote({ lote: '', fechaVencimiento: '' });
            setNewWholesaleOption({ cantidadMinima: '', precio: '' });
        }
    }, [isOpenModal]);

    useEffect(() => {
        if (!isEdit) {
            setFormValues({ ...formValues, codigo: productCode });
        }
    }, [productCode]);

    // --- Form Handlers ---
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    const handlePrecioUnitarioBlur = () => {
        const price = Number(formValues?.precioUnitario);
        const isValid = formValues?.precioUnitario !== '' && formValues?.precioUnitario !== undefined && price > 0;
        setErrors({ ...errors, precioUnitario: isValid ? '' : 'El precio de venta es obligatorio' });
    };

    const handleChangeSelect = (idValue: any, value: any, name: any, id: any) => {
        setFormValues({ ...formValues, [name]: value, [id]: idValue });
    };

    const validateForm = () => {
        const newErrors: any = {
            descripcion: formValues?.descripcion && formValues?.descripcion.trim() !== "" ? "" : "El código del producto es obligatorio",
            precioUnitario: formValues?.precioUnitario && Number(formValues?.precioUnitario) > 0 ? "" : "El producto debe tener un precio",
            stock: !isEdit ? (formValues?.stock && Number(formValues?.stock) > 0 ? "" : "El producto debe tener un stock") : ""
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error);
    };

    // --- Business Logic Functions ---
    const cargarGruposAsignados = async (productoId: number) => {
        try {
            const res = await apiClient.get(`/modificadores/productos/${productoId}`);
            const grupos = res?.data?.data || res?.data || [];
            const nonWholesaleGroups = grupos.filter((g: any) => {
                const nombre = g.grupoNombre || g.grupo?.nombre || '';
                return !nombre.startsWith('Precios:') && nombre !== 'Precios por Cantidad';
            });
            setGruposSeleccionados(nonWholesaleGroups.map((g: any) => g.grupoId));
        } catch (error) {
            console.error('Error al cargar grupos asignados:', error);
        }
    };

    const toggleGrupoSeleccionado = (grupoId: number) => {
        setGruposSeleccionados(prev =>
            prev.includes(grupoId) ? prev.filter(id => id !== grupoId) : [...prev, grupoId]
        );
    };

    const handleAddWholesaleOption = () => {
        if (!newWholesaleOption.cantidadMinima || !newWholesaleOption.precio) return;
        const current: IWholesaleOption[] = formValues.preciosMayorista || [];
        setFormValues({
            ...formValues,
            preciosMayorista: [
                ...current,
                { cantidadMinima: Number(newWholesaleOption.cantidadMinima), precio: Number(newWholesaleOption.precio) }
            ]
        });
        setNewWholesaleOption({ cantidadMinima: '', precio: '' });
    };

    const handleRemoveWholesaleOption = (idx: number) => {
        const current: IWholesaleOption[] = formValues.preciosMayorista || [];
        setFormValues({ ...formValues, preciosMayorista: current.filter((_, i) => i !== idx) });
    };

    // --- AI Features ---
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isCategorizing, setIsCategorizing] = useState(false);

    const handleAutoCategorize = async () => {
        if (!formValues.descripcion) {
            useAlertStore.getState().alert('Ingresa el nombre del producto primero', 'warning');
            return;
        }
        setIsCategorizing(true);
        try {
            const response = await apiClient.post('/producto/ia/categorizar', { nombre: formValues.descripcion });
            const result = response.data?.data || response.data;
            if (result?.success && result?.data) {
                const aiData = result.data;
                const updates: any = {};

                if (aiData.categoria) {
                    const cat = categories.find((c: any) => c.nombre.toUpperCase() === aiData.categoria.toUpperCase());
                    if (cat) { updates.categoriaId = cat.id; updates.categoriaNombre = cat.nombre; }
                }

                if (aiData.marca) {
                    const brand = brands.find((b: any) => b.nombre.toUpperCase() === aiData.marca.toUpperCase());
                    if (brand) { updates.marcaId = brand.id; updates.marcaNombre = brand.nombre; }
                }

                if (Object.keys(updates).length > 0) {
                    setFormValues({ ...formValues, ...updates });
                    useAlertStore.getState().alert('Categorizado automáticamente', 'success');
                } else {
                    useAlertStore.getState().alert('No se encontraron coincidencias', 'info');
                }
            } else {
                useAlertStore.getState().alert('No se pudo categorizar', 'info');
            }
        } catch (error) {
            useAlertStore.getState().alert('Error al categorizar con IA', 'error');
        } finally {
            setIsCategorizing(false);
        }
    };

    const handleAutoImage = async () => {
        const query = formValues.descripcion;
        if (!query) {
            useAlertStore.getState().alert('Ingresa el nombre del producto para buscar imagen', 'warning');
            return;
        }
        setIsGeneratingImage(true);
        try {
            const response = await apiClient.post('/producto/ia/generar-imagen', { nombre: query });
            const result = response.data?.data || response.data;
            if (result?.success && result?.url) {
                setPreviewPrincipal(result.url);
                setFormValues({ ...formValues, imagenUrl: result.url });
                useAlertStore.getState().alert('Imagen encontrada', 'success');
            } else {
                useAlertStore.getState().alert('No se encontró imagen', 'info');
            }
        } catch (e) {
            useAlertStore.getState().alert('Error al buscar imagen', 'error');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    // --- Main Submit handler ---
    const handleSubmitProduct = async () => {
        if (!validateForm()) return;
        setLoading(true);

        try {
            let autoGeneratedImageUrl: string | null = null;
            if (!isEdit && !filePrincipal && !previewPrincipal && !formValues.imagenUrl && formValues.descripcion) {
                try {
                    useAlertStore.getState().alert('Buscando imagen automáticamente...', 'info');
                    const response = await apiClient.post('/producto/ia/generar-imagen', { nombre: formValues.descripcion });
                    const result = response.data?.data || response.data;
                    if (result?.success && result?.url) {
                        autoGeneratedImageUrl = result.url;
                        setPreviewPrincipal(result.url);
                        setFormValues({ ...formValues, imagenUrl: result.url });
                    }
                } catch (e) { console.error('Auto-image generation failed:', e); }
            }

            let stockFinal = Number(formValues?.stock);
            if (isEdit && tipoAjusteStock !== 'ninguno') {
                switch (tipoAjusteStock) {
                    case 'reemplazar': stockFinal = cantidadAjuste; break;
                    case 'sumar': stockFinal = stockOriginal + cantidadAjuste; break;
                    case 'restar': stockFinal = Math.max(0, stockOriginal - cantidadAjuste); break;
                    default: stockFinal = stockOriginal;
                }
            }

            if (Number(formValues?.productoId) !== 0 && isEdit) {
                // EDIT MODE
                const hasRemovedImage = !filePrincipal && !previewPrincipal && !formValues.imagenUrl;
                await editProduct({
                    ...formValues,
                    unidadMedidaId: Number(formValues?.unidadMedidaId),
                    categoriaId: formValues?.categoriaId === "" ? null : Number(formValues?.categoriaId),
                    precioUnitario: Number(formValues?.precioUnitario),
                    costoUnitario: formValues?.costoUnitario ? Number(formValues?.costoUnitario) : undefined,
                    stock: stockFinal,
                    stockMinimo: formValues?.stockMinimo != null ? Number(formValues?.stockMinimo) : undefined,
                    stockMaximo: formValues?.stockMaximo != null ? Number(formValues?.stockMaximo) : undefined,
                    imagenUrl: hasRemovedImage ? null : (formValues.imagenUrl || undefined),
                });

                try {
                    const allGroups = gruposSeleccionados.map((id, idx) => ({ grupoId: id, ordenOverride: idx }));
                    await apiClient.post(`/modificadores/productos/${formValues.productoId}`, { grupos: allGroups });
                } catch (e) {
                    console.error('Error al asignar modificadores:', e);
                }

                try {
                    // Upload Image flow
                    if (filePrincipal) {
                        const fd = new FormData();
                        fd.append('file', filePrincipal);
                        const resp = await apiClient.post(`/producto/${formValues.productoId}/imagen`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                        const signed = resp?.data?.signedUrl || resp?.data?.data?.signedUrl;
                        const nuevaUrl = signed || resp?.data?.data?.url || resp?.data?.url || resp?.data?.data?.imagenUrl || resp?.data?.imagenUrl || null;
                        if (nuevaUrl) setProductImage(Number(formValues.productoId), nuevaUrl);
                    } else {
                        const externalUrl = autoGeneratedImageUrl || previewPrincipal || formValues.imagenUrl;
                        if (externalUrl && !externalUrl.includes('amazonaws.com')) {
                            const resp = await apiClient.post(`/producto/${formValues.productoId}/imagen-url`, { url: externalUrl });
                            const signed = resp?.data?.signedUrl || resp?.data?.data?.signedUrl;
                            const s3Url = signed || resp?.data?.data?.url || resp?.data?.url || null;
                            if (s3Url) {
                                setProductImage(Number(formValues.productoId), s3Url);
                            }
                        }
                    }
                } catch (e) { }

                upsertProductLocal({
                    id: Number(formValues.productoId),
                    imagenUrl: hasRemovedImage ? null : (previewPrincipal || formValues.imagenUrl || undefined),
                });

                setFilePrincipal(null); setPreviewPrincipal(null);
                setFormValues(initialForm);
                closeModal();

            } else {
                // CREATE MODE
                const imageToSave = autoGeneratedImageUrl || formValues.imagenUrl || undefined;
                const product = await addProduct({
                    ...formValues,
                    unidadMedidaId: Number(formValues?.unidadMedidaId),
                    categoriaId: formValues?.categoriaId === "" ? null : Number(formValues?.categoriaId),
                    precioUnitario: Number(formValues?.precioUnitario),
                    costoUnitario: formValues?.costoUnitario ? Number(formValues?.costoUnitario) : undefined,
                    stock: (isFarmacia && features.gestionLotes && creationLote.lote) ? 0 : Number(formValues.stock),
                    stockMinimo: formValues?.stockMinimo != null ? Number(formValues?.stockMinimo) : undefined,
                    stockMaximo: formValues?.stockMaximo != null ? Number(formValues?.stockMaximo) : undefined,
                    estado: "ACTIVO",
                    imagenUrl: imageToSave,
                }, { skipStore: true });

                setFormValues(initialForm);
                if (isInvoice) setSelectProduct(product.data);

                try {
                    const newId = product?.data?.id;
                    let urlFinal: string | null = null;

                    if (newId && filePrincipal) {
                        const fd = new FormData();
                        fd.append('file', filePrincipal);
                        const resp2 = await apiClient.post(`/producto/${newId}/imagen`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                        const signed = resp2?.data?.signedUrl || resp2?.data?.data?.signedUrl;
                        urlFinal = signed || resp2?.data?.data?.url || resp2?.data?.url || resp2?.data?.data?.imagenUrl || resp2?.data?.imagenUrl || null;
                    } else if (newId && imageToSave) {
                        try {
                            const resp3 = await apiClient.post(`/producto/${newId}/imagen-url`, { url: imageToSave });
                            const signed = resp3?.data?.signedUrl || resp3?.data?.data?.signedUrl;
                            const s3Url = signed || resp3?.data?.data?.url || resp3?.data?.url || null;
                            if (s3Url) {
                                urlFinal = s3Url;
                            }
                        } catch (imgError) { }
                    }

                    if (isFarmacia && features.gestionLotes && creationLote.lote && creationLote.fechaVencimiento) {
                        try {
                            await apiClient.post('/producto/lotes', {
                                productoId: Number(newId),
                                lote: creationLote.lote,
                                fechaVencimiento: creationLote.fechaVencimiento,
                                stockInicial: Number(formValues.stock),
                                stockActual: Number(formValues.stock),
                                costoUnitario: formValues.costoUnitario ? Number(formValues.costoUnitario) : undefined,
                            });
                            useAlertStore.getState().alert('Lote inicial registrado', 'success');
                        } catch (lotError) {
                            useAlertStore.getState().alert('Producto creado pero error al registrar lote', 'warning');
                        }
                    }

                    upsertProductLocal({
                        id: Number(newId),
                        descripcion: formValues.descripcion,
                        codigo: product?.data?.codigo || formValues.codigo,
                        precioUnitario: String(formValues.precioUnitario) as any,
                        stock: Number(formValues.stock),
                        unidadMedida: { nombre: formValues.unidadMedidaNombre as any } as any,
                        categoria: { nombre: formValues.categoriaNombre as any } as any,
                        marca: formValues.marcaId ? { id: Number(formValues.marcaId), nombre: formValues.marcaNombre as any } as any : undefined,
                        imagenUrl: urlFinal || undefined,
                        estado: 'ACTIVO' as any,
                    });
                } catch (e) { }

                if (product?.data?.id && gruposSeleccionados.length > 0) {
                    try {
                        const allGroups = gruposSeleccionados.map((id, idx) => ({ grupoId: id, ordenOverride: idx }));
                        await apiClient.post(`/modificadores/productos/${product.data.id}`, { grupos: allGroups });
                    } catch (e) { }
                }

                setFilePrincipal(null); setPreviewPrincipal(null);
                closeModal();
            }
        } catch (error) {
            useAlertStore.getState().alert("Ocurrió un error al guardar", "error");
        } finally {
            setLoading(false);
        }
    };

    return {
        // Properties & State
        isMobile,
        isRestaurante,
        isFarmacia,
        isFabricacion,
        features,
        labels,
        isOpenModal,
        isEdit,
        formValues,
        errors,
        loading,
        unitOfMeasure,
        categories,
        brands,
        gruposModificadores,
        gruposSeleccionados,
        filePrincipal,
        previewPrincipal,
        loadingImage,
        filePrincipalInputRef,
        tipoAjusteStock,
        cantidadAjuste,
        stockOriginal,
        showMedicamentoModal,
        showLotesModal,
        creationLote,
        wholesaleOptions: (formValues.preciosMayorista || []) as IWholesaleOption[],
        newWholesaleOption,
        isGeneratingImage,
        isCategorizing,
        // Setters
        setIsOpenModal,
        setFormValues,
        setFilePrincipal,
        setPreviewPrincipal,
        setLoadingImage,
        setTipoAjusteStock,
        setCantidadAjuste,
        setShowMedicamentoModal,
        setShowLotesModal,
        setCreationLote,
        setNewWholesaleOption,
        // Handlers
        handleChangeSelect,
        handleChange,
        handlePrecioUnitarioBlur,
        handleAutoCategorize,
        handleAutoImage,
        toggleGrupoSeleccionado,
        handleRemoveWholesaleOption,
        handleAddWholesaleOption,
        handleSubmitProduct,
        closeModal,
        barcodeQuery,
        setBarcodeQuery,
        searchingBarcode,
        handleBarcodeGlobalSearch,
    };
};
