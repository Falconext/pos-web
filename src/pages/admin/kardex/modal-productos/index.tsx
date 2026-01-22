import { ChangeEvent, Dispatch, useEffect, useRef, useState } from "react"
import Modal from "@/components/Modal"
import Select from "@/components/Select"
import { ICategory } from "@/interfaces/categories"
import { IFormProduct } from "@/interfaces/products"
import { useCategoriesStore } from "@/zustand/categories"
import { IExtentionsState, useExtentionsStore } from "@/zustand/extentions"
import { IProductsState, useProductsStore } from "@/zustand/products"
import { useAuthStore } from "@/zustand/auth"
import InputPro from "@/components/InputPro"
import Button from "@/components/Button"
import { Icon } from "@iconify/react"
import apiClient from "@/utils/apiClient"
import useAlertStore from "@/zustand/alert"
import { useBrandsStore } from '@/zustand/brands';
import type { IBrand } from '@/zustand/brands';
import { useModificadoresStore } from '@/zustand/modificadores';
import type { GrupoModificador } from '@/zustand/modificadores';
import { useRubroFeatures } from '@/utils/rubro-features';
import { Calendar } from '@/components/Date';
import moment from 'moment';
import ModalMedicamento from "./components/ModalMedicamento";
import ModalLotes from "./components/ModalLotes";

interface IPropsProducts {
    formValues: IFormProduct
    isOpenModal: boolean
    setErrors: any
    closeModal: any
    isEdit: boolean
    errors: any
    setFormValues: any
    setIsOpenModal: Dispatch<boolean>
    initialForm: IFormProduct
    isInvoice?: boolean
    setSelectProduct?: any
}

const afectaciones = [
    { id: "10", value: "Gravado - Operación Onerosa" },
    { id: "20", value: "Exonerado" },
    { id: "30", value: "Inafecto" },
    { id: "40", value: "Exportación" }
]

const ModalProduct = ({ setSelectProduct, isInvoice, initialForm, formValues, setErrors, isOpenModal, setFormValues, closeModal, isEdit, errors, setIsOpenModal }: IPropsProducts) => {

    const { getUnitOfMeasure }: IExtentionsState = useExtentionsStore();
    const { auth } = useAuthStore();
    const { getAllCategories } = useCategoriesStore();
    const { editProduct, addProduct, getCodeProduct, productCode, setProductImage, upsertProductLocal }: IProductsState = useProductsStore();
    const { unitOfMeasure }: IExtentionsState = useExtentionsStore();
    const { categories } = useCategoriesStore();
    // Marcas
    const { brands, getAllBrands } = useBrandsStore();

    // Modificadores
    const { grupos: gruposModificadores, getAllGrupos } = useModificadoresStore();
    const [gruposSeleccionados, setGruposSeleccionados] = useState<number[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Detectar si el rubro es restaurante para simplificar el formulario
    const isRestaurante = (() => {
        const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
        return rubroNombre.includes('restaurante') || rubroNombre.includes('comida') || rubroNombre.includes('alimento');
    })();

    // Detectar si el rubro es farmacia/botica
    const isFarmacia = (() => {
        const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
        return rubroNombre.includes('farmacia') || rubroNombre.includes('botica');
    })();

    // Labels dinámicos según el rubro
    const labels = {
        titulo: isRestaurante ? 'Plato' : isFarmacia ? 'Medicamento' : 'Producto',
        nombre: isRestaurante ? 'Nombre del plato' : isFarmacia ? 'Nombre del medicamento' : 'Nombre del producto',
        codigo: isRestaurante ? 'Código del plato' : isFarmacia ? 'Código' : 'Código de producto',
        imagen: isRestaurante ? 'Imagen del plato' : 'Imagen del producto',
        precio: isRestaurante ? 'Precio (S/)' : 'Precio de Venta (S/)',
    };

    // Detectar funcionalidades según rubro
    const features = useRubroFeatures(auth?.empresa?.rubro?.nombre);

    // Imagen principal
    const [filePrincipal, setFilePrincipal] = useState<File | null>(null);
    const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const filePrincipalInputRef = useRef<HTMLInputElement | null>(null);

    // Estados para manejar ajustes de stock
    const [tipoAjusteStock, setTipoAjusteStock] = useState<'ninguno' | 'reemplazar' | 'sumar' | 'restar'>('ninguno');
    const [cantidadAjuste, setCantidadAjuste] = useState<number>(0);
    const [stockOriginal] = useState<number>(formValues?.stock || 0);
    const [loading, setLoading] = useState(false);

    // Estados para control de modales anidados (Drawers)
    const [showMedicamentoModal, setShowMedicamentoModal] = useState(false);
    const [showLotesModal, setShowLotesModal] = useState(false);

    // New state for creation batch (LoteInicial)
    const [creationLote, setCreationLote] = useState({
        lote: '',
        fechaVencimiento: ''
    });

    // Wholesale / Tiered Pricing State
    const [wholesaleOptions, setWholesaleOptions] = useState<{ nombre: string, precio: string, id?: number, esNuevo?: boolean }[]>([]);
    const [newWholesaleOption, setNewWholesaleOption] = useState({ nombre: '', precio: '' });
    const [wholesaleGroupId, setWholesaleGroupId] = useState<number | null>(null);

    const handleAddWholesaleOption = () => {
        console.log('➕ Adding wholesale option:', newWholesaleOption);
        if (!newWholesaleOption.nombre || !newWholesaleOption.precio) {
            console.log('⚠️ Validation failed - missing nombre or precio');
            return;
        }
        const updatedOptions = [...wholesaleOptions, { ...newWholesaleOption, esNuevo: true }];
        console.log('✅ Updated wholesaleOptions:', updatedOptions);
        setWholesaleOptions(updatedOptions);
        setNewWholesaleOption({ nombre: '', precio: '' });
    };

    const handleRemoveWholesaleOption = (idx: number) => {
        setWholesaleOptions(wholesaleOptions.filter((_, i) => i !== idx));
    };

    const validateForm = () => {
        const newErrors: any = {
            // codigo: formValues?.codigo && formValues?.codigo.trim() !== "" ? "" : "El código del producto es obligatorio",
            descripcion: formValues?.descripcion && formValues?.descripcion.trim() !== "" ? "" : "El código del producto es obligatorio",
            precioUnitario: formValues?.precioUnitario && Number(formValues?.precioUnitario) > 0 ? "" : "El producto debe tener un precio",
            // En edición, el stock se gestiona con los controles de ajuste; no exigir este campo.
            stock: !isEdit ? (formValues?.stock && Number(formValues?.stock) > 0 ? "" : "El producto debe tener un stock") : ""
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error); // Retorna `true` si no hay errores
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues({
            ...formValues,
            [name]: value
        });
    };

    const handleChangeSelect = (idValue: any, value: any, name: any, id: any) => {
        setFormValues({
            ...formValues,
            [name]: value,
            [id]: idValue,
        });
    }



    useEffect(() => {
        // Evitar llamadas repetidas: solo cargar si están vacíos en el store
        if (!unitOfMeasure || (Array.isArray(unitOfMeasure) && unitOfMeasure.length === 0)) {
            getUnitOfMeasure();
        }
        if (!categories || (Array.isArray(categories) && categories.length === 0)) {
            getAllCategories({});
        }
        if (!brands || brands.length === 0) {
            getAllBrands();
        }
        // Cargar grupos de modificadores (ahora disponible para todos)
        if (!gruposModificadores || gruposModificadores.length === 0) {
            getAllGrupos();
        }
    }, [])

    useEffect(() => {
        // Obtener código de producto solo al abrir el modal en modo creación y si no existe código aún
        if (!isOpenModal) return;
        if (!isEdit && auth && auth.empresaId && !formValues?.codigo) {
            getCodeProduct(auth.empresaId);
        }
    }, [isOpenModal, isEdit, auth])

    // Preload preview en edición. No borrar al escribir en el formulario.
    useEffect(() => {
        if (!isOpenModal) return;
        if (isEdit && (formValues as any)?.imagenUrl && !previewPrincipal) {
            setPreviewPrincipal((formValues as any).imagenUrl);
        }
        // Cargar grupos asignados al producto en edición
        if (isEdit && formValues?.productoId) {
            cargarGruposAsignados(formValues.productoId);
        }
    }, [isOpenModal, isEdit])

    // Limpiar preview SOLO al cerrar el modal
    useEffect(() => {
        if (!isOpenModal) {
            setPreviewPrincipal(null);
            setFilePrincipal(null);
            setGruposSeleccionados([]);
            // Reset creation batch
            setCreationLote({ lote: '', fechaVencimiento: '' });
            setCreationLote({ lote: '', fechaVencimiento: '' });
            setWholesaleOptions([]);
            setWholesaleGroupId(null);
        }
    }, [isOpenModal])

    // Cargar grupos asignados a un producto
    const cargarGruposAsignados = async (productoId: number) => {
        try {
            const res = await apiClient.get(`/modificadores/productos/${productoId}`);
            // El backend ahora retorna directamente el array en res.data.data
            const grupos = res?.data?.data || res?.data || [];
            console.log('🔍 Grupos loaded:', JSON.stringify(grupos, null, 2));

            setGruposSeleccionados(grupos.map((g: any) => g.grupoId));

            // Cargar wholesale options del grupo auto-generado
            // Check both g.grupoNombre and g.grupo.nombre
            const autoGroup = grupos.find((g: any) => {
                const nombreGrupo = g.grupoNombre || g.grupo?.nombre;
                console.log('🔍 Checking group:', { grupoId: g.grupoId, nombreGrupo, rawG: g });
                return nombreGrupo && (nombreGrupo.startsWith('Precios:') || nombreGrupo === 'Precios por Cantidad');
            });
            console.log('🔍 AutoGroup found:', autoGroup);

            if (autoGroup) {
                // Fetch full group details with options
                try {
                    const groupRes = await apiClient.get(`/modificadores/grupos/${autoGroup.grupoId}`);
                    // Backend may return nested structure: check data.data.data first, then fallbacks
                    const groupDetails = groupRes.data.data?.data || groupRes.data.data || groupRes.data;
                    console.log('🔍 Group details:', JSON.stringify(groupDetails, null, 2));
                    console.log('🔍 Checking condition:', {
                        hasGroupDetails: !!groupDetails,
                        hasOpciones: !!groupDetails?.opciones,
                        opcionesLength: groupDetails?.opciones?.length,
                        precioUnitario: formValues.precioUnitario
                    });
                    if (groupDetails && groupDetails.opciones) {
                        const options = groupDetails.opciones.map((op: any) => ({
                            id: op.id,
                            nombre: op.nombre,
                            // Precio Extra + Base Price = Total Price shown to user
                            precio: (Number(op.precioExtra) + Number(formValues.precioUnitario || 0)).toFixed(2)
                        }));
                        console.log('✅ Setting wholesale options:', options);
                        setWholesaleOptions(options);
                        setWholesaleGroupId(autoGroup.grupoId);
                    } else {
                        console.log('❌ Condition failed - not setting options');
                    }
                } catch (err) {
                    console.error('Error fetching wholesale group details', err);
                }
            } else {
                console.log('⚠️ No autoGroup found, clearing wholesale data');
                setWholesaleGroupId(null);
            }

        } catch (error) {
            console.error('Error al cargar grupos asignados:', error);
        }
    };

    // Toggle grupo seleccionado
    const toggleGrupoSeleccionado = (grupoId: number) => {
        setGruposSeleccionados(prev =>
            prev.includes(grupoId)
                ? prev.filter(id => id !== grupoId)
                : [...prev, grupoId]
        );
    };

    // AI Features
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
            // Backend wraps response in { code, message, data }
            const result = response.data?.data || response.data;
            if (result?.success && result?.data) {
                const aiData = result.data;
                const updates: any = {};

                // Update description if shorter or better? The prompt says "generate short description".
                // Maybe append or replace? Let's keep original name as description and maybe use AI description for "descripcionLarga" if exists, or just overwrite if user wants?
                // The task says "auto-categorizing products based on their descriptions".
                // I'll update fields if found.
                if (aiData.descripcion) {
                    // updates.descripcion = aiData.descripcion; // Optional: overwrite name? detailed description might be better elsewhere.
                    // User might prefer keeping their name. Let's strictly update Category and Brand.
                }

                if (aiData.categoria) {
                    const cat = categories.find((c: any) => c.nombre.toUpperCase() === aiData.categoria.toUpperCase());
                    if (cat) {
                        updates.categoriaId = cat.id;
                        updates.categoriaNombre = cat.nombre;
                    }
                }

                if (aiData.marca) {
                    const brand = brands.find((b: any) => b.nombre.toUpperCase() === aiData.marca.toUpperCase());
                    if (brand) {
                        updates.marcaId = brand.id;
                        updates.marcaNombre = brand.nombre;
                    }
                }

                if (Object.keys(updates).length > 0) {
                    setFormValues((prev: any) => ({ ...prev, ...updates }));
                    useAlertStore.getState().alert('Categorizado automáticamente', 'success');
                } else {
                    useAlertStore.getState().alert('No se encontraron coincidencias exactas de categoría/marca', 'info');
                }
            } else {
                useAlertStore.getState().alert('No se pudo categorizar', 'info');
            }
        } catch (error) {
            console.error(error);
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
            // Backend wraps response in { code, message, data }
            const result = response.data?.data || response.data;
            if (result?.success && result?.url) {
                setPreviewPrincipal(result.url);
                // Set to formValues so it persists if no file is uploaded
                setFormValues((prev: any) => ({ ...prev, imagenUrl: result.url }));
                useAlertStore.getState().alert('Imagen encontrada', 'success');
            } else {
                useAlertStore.getState().alert('No se encontró imagen', 'info');
            }
        } catch (e) {
            console.error(e);
            useAlertStore.getState().alert('Error al buscar imagen', 'error');
        } finally {
            setIsGeneratingImage(false);
        }
    };



    const syncWholesaleOptions = async (dedicatedGroupId: number, basePrice: number) => {
        console.log('🔧 syncWholesaleOptions called:', { dedicatedGroupId, basePrice, wholesaleOptions });
        if (!dedicatedGroupId) {
            console.log('⚠️ No dedicatedGroupId, skipping');
            return;
        }

        try {
            // Sync Options
            console.log('📥 Fetching current options for group:', dedicatedGroupId);
            const groupDetailsRes = await apiClient.get(`/modificadores/grupos/${dedicatedGroupId}`);
            const currentOptions = groupDetailsRes.data.data?.opciones || [];
            console.log('Current options:', currentOptions);

            // Delete removed
            const optionsIdsParam = wholesaleOptions.map(o => o.id).filter(Boolean);
            const toDelete = currentOptions.filter((o: any) => !optionsIdsParam.includes(o.id));
            console.log('Options to delete:', toDelete);
            for (const op of toDelete) {
                console.log('🗑️ Deleting option:', op.id);
                await apiClient.delete(`/modificadores/opciones/${op.id}`);
            }

            // Upsert
            for (const opt of wholesaleOptions) {
                const extra = Math.max(0, Number(opt.precio) - basePrice);
                console.log('Processing option:', { opt, extra, basePrice });
                if (opt.id) {
                    console.log('📝 Updating option:', opt.id);
                    await apiClient.patch(`/modificadores/opciones/${opt.id}`, { nombre: opt.nombre, precioExtra: extra });
                } else {
                    console.log('➕ Creating new option:', opt.nombre);
                    await apiClient.post(`/modificadores/grupos/${dedicatedGroupId}/opciones`, {
                        nombre: opt.nombre, precioExtra: extra, esDefault: false
                    });
                }
            }
            console.log('✅ Sync complete');
        } catch (e) {
            console.error('❌ Error syncing:', e);
        }
    };


    const handleSubmitProduct = async () => {
        console.log(formValues)
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {

            // Auto-generar imagen si no hay imagen y hay nombre de producto (especialmente útil desde facturación)
            let autoGeneratedImageUrl: string | null = null;
            if (!filePrincipal && !previewPrincipal && !formValues.imagenUrl && formValues.descripcion) {
                try {
                    useAlertStore.getState().alert('Buscando imagen automáticamente...', 'info');
                    const response = await apiClient.post('/producto/ia/generar-imagen', { nombre: formValues.descripcion });
                    const result = response.data?.data || response.data;
                    if (result?.success && result?.url) {
                        autoGeneratedImageUrl = result.url;
                        setPreviewPrincipal(result.url);
                        setFormValues((prev: any) => ({ ...prev, imagenUrl: result.url }));
                    }
                } catch (e) {
                    console.error('Auto-image generation failed:', e);
                    // Continue without image
                }
            }

            // Calcular el stock final basado en el tipo de ajuste
            let stockFinal = Number(formValues?.stock);
            if (isEdit && tipoAjusteStock !== 'ninguno') {
                switch (tipoAjusteStock) {
                    case 'reemplazar':
                        stockFinal = cantidadAjuste;
                        break;
                    case 'sumar':
                        stockFinal = stockOriginal + cantidadAjuste;
                        break;
                    case 'restar':
                        stockFinal = Math.max(0, stockOriginal - cantidadAjuste);
                        break;
                    default:
                        stockFinal = stockOriginal;
                }
            }

            if (Number(formValues?.productoId) !== 0 && isEdit) {
                await editProduct({
                    ...formValues,
                    unidadMedidaId: Number(formValues?.unidadMedidaId),
                    categoriaId: formValues?.categoriaId === "" ? null : Number(formValues?.categoriaId),
                    precioUnitario: Number(formValues?.precioUnitario),
                    costoUnitario: formValues?.costoUnitario ? Number(formValues?.costoUnitario) : undefined,
                    stock: stockFinal,
                    stockMinimo: formValues?.stockMinimo != null ? Number(formValues?.stockMinimo) : undefined,
                    stockMaximo: formValues?.stockMaximo != null ? Number(formValues?.stockMaximo) : undefined,
                });
                // Guardar asignación de modificadores (SINGLE CALL including Wholesale Group)
                console.log('🔍 Wholesale Debug:', {
                    wholesaleOptionsLength: wholesaleOptions.length,
                    wholesaleGroupId,
                    wholesaleOptions,
                    formValuesDescripcion: formValues.descripcion
                });

                let finalWholesaleGroupId = wholesaleGroupId;
                // If we need a group but don't have one (or cleared it, although we don't clear variable here if options empty? No, we check length)
                if (wholesaleOptions.length > 0 && !finalWholesaleGroupId) {
                    // Create it now
                    console.log('📦 Creating new wholesale group...');
                    try {
                        const newGroupRes = await apiClient.post('/modificadores/grupos', {
                            nombre: `Precios: ${formValues.descripcion?.substring(0, 30)}`,
                            descripcion: 'Autogenerado desde Kardex',
                            seleccionMin: 0,
                            seleccionMax: 1,
                            esObligatorio: false
                        });
                        console.log('🔍 Backend Response:', JSON.stringify(newGroupRes.data, null, 2));
                        // Backend returns nested structure: data.data.data.id
                        finalWholesaleGroupId = newGroupRes.data.data.data?.id || newGroupRes.data.data?.id || newGroupRes.data?.id;
                        console.log('✅ Wholesale group created with ID:', finalWholesaleGroupId);
                        setWholesaleGroupId(finalWholesaleGroupId);
                    } catch (err) {
                        console.error('❌ Error creating wholesale group:', err);
                    }
                }

                try {
                    // Prepare all groups to save
                    // Avoid duplicating if finalWholesaleGroupId is already in gruposSeleccionados (it shouldn't be if we manage strictly, but safety first)
                    const baseGroups = gruposSeleccionados.filter(id => id !== finalWholesaleGroupId);
                    const allGroups = baseGroups.map((id, idx) => ({ grupoId: id, ordenOverride: idx }));

                    if (finalWholesaleGroupId && wholesaleOptions.length > 0) {
                        allGroups.push({ grupoId: finalWholesaleGroupId, ordenOverride: -1 }); // Priority
                    }

                    console.log('📋 Assigning groups to product:', {
                        productId: formValues.productoId,
                        allGroups,
                        finalWholesaleGroupId
                    });

                    await apiClient.post(`/modificadores/productos/${formValues.productoId}`, {
                        grupos: allGroups
                    });

                    console.log('✅ Groups assigned successfully');

                    // Sync Options Logic AFTER assignment
                    if (finalWholesaleGroupId && wholesaleOptions.length > 0) {
                        console.log('🔄 Syncing wholesale options...');
                        await syncWholesaleOptions(Number(finalWholesaleGroupId), Number(formValues.precioUnitario));
                        console.log('✅ Wholesale options synced');
                    }

                } catch (e) {
                    console.error('❌ Error al asignar modificadores:', e);
                }

                try {
                    if (filePrincipal) {
                        // User uploaded a file
                        const fd = new FormData();
                        fd.append('file', filePrincipal);
                        const resp = await apiClient.post(`/producto/${formValues.productoId}/imagen`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                        const signed = resp?.data?.signedUrl || resp?.data?.data?.signedUrl;
                        const nuevaUrl = signed || resp?.data?.data?.url || resp?.data?.url || resp?.data?.data?.imagenUrl || resp?.data?.imagenUrl || null;
                        if (nuevaUrl) setProductImage(Number(formValues.productoId), nuevaUrl);
                    } else {
                        // Check for external URL that needs to be uploaded to S3
                        // This could be from autoGeneratedImageUrl (auto-save) or formValues.imagenUrl (manual button click)
                        const externalUrl = autoGeneratedImageUrl || previewPrincipal || formValues.imagenUrl;

                        // Only upload if it's an external URL (not already an S3 URL)
                        if (externalUrl && !externalUrl.includes('amazonaws.com')) {
                            try {
                                const resp = await apiClient.post(`/producto/${formValues.productoId}/imagen-url`, { url: externalUrl });
                                const signed = resp?.data?.signedUrl || resp?.data?.data?.signedUrl;
                                const s3Url = signed || resp?.data?.data?.url || resp?.data?.url || null;
                                if (s3Url) {
                                    setProductImage(Number(formValues.productoId), s3Url);
                                    useAlertStore.getState().alert('Imagen guardada en servidor', 'success');
                                }
                            } catch (imgError) {
                                console.error('Error uploading external image to S3:', imgError);
                                useAlertStore.getState().alert('Error al subir imagen', 'error');
                            }
                        }
                    }
                } catch (e) {
                    // noop, ya mostramos alertas globales desde interceptores si aplica
                }
                setFilePrincipal(null); setPreviewPrincipal(null);
                setFormValues(initialForm)
                closeModal();
            } else {
                // Crear producto sin insertarlo aún en el store (para esperar URL de imagen si hay)
                // Use autoGeneratedImageUrl if available (avoids async state issue)
                const imageToSave = autoGeneratedImageUrl || formValues.imagenUrl || undefined;
                const product = await addProduct({
                    ...formValues,
                    unidadMedidaId: Number(formValues?.unidadMedidaId),
                    categoriaId: formValues?.categoriaId === "" ? null : Number(formValues?.categoriaId),
                    precioUnitario: Number(formValues?.precioUnitario),
                    costoUnitario: formValues?.costoUnitario ? Number(formValues?.costoUnitario) : undefined,
                    // If creating with lot, set initial stock to 0 to avoid double counting when creating lot
                    stock: (isFarmacia && features.gestionLotes && creationLote.lote) ? 0 : Number(formValues.stock),
                    stockMinimo: formValues?.stockMinimo != null ? Number(formValues?.stockMinimo) : undefined,
                    stockMaximo: formValues?.stockMaximo != null ? Number(formValues?.stockMaximo) : undefined,
                    estado: "ACTIVO",
                    imagenUrl: imageToSave, // Explicitly include the image URL
                }, { skipStore: true });
                setFormValues(initialForm)
                console.log(product)
                if (isInvoice) {
                    setSelectProduct(product.data)
                }
                try {
                    const newId = product?.data?.id;
                    let urlFinal: string | null = null;

                    if (newId && filePrincipal) {
                        // User uploaded a file - use the existing file upload endpoint
                        const fd = new FormData();
                        fd.append('file', filePrincipal);
                        const resp2 = await apiClient.post(`/producto/${newId}/imagen`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                        const signed = resp2?.data?.signedUrl || resp2?.data?.data?.signedUrl;
                        const nuevaUrl = signed || resp2?.data?.data?.url || resp2?.data?.url || resp2?.data?.data?.imagenUrl || resp2?.data?.imagenUrl || null;
                        if (nuevaUrl) {
                            urlFinal = nuevaUrl;
                        }
                    } else if (newId && imageToSave) {
                        // We have an auto-generated external URL - upload it to S3
                        try {
                            const resp3 = await apiClient.post(`/producto/${newId}/imagen-url`, { url: imageToSave });
                            const signed = resp3?.data?.signedUrl || resp3?.data?.data?.signedUrl;
                            const s3Url = signed || resp3?.data?.data?.url || resp3?.data?.url || null;
                            if (s3Url) {
                                urlFinal = s3Url;
                                useAlertStore.getState().alert('Imagen guardada en servidor', 'success');
                            }
                        } catch (imgError) {
                            console.error('Error uploading auto-generated image to S3:', imgError);
                            // Continue without S3 image
                        }
                    }

                    // Handle Creation Batch (Farmacia)
                    if (isFarmacia && features.gestionLotes && creationLote.lote && creationLote.fechaVencimiento) {
                        try {
                            // If creation batch is provided, we should register it.
                            // The product was created with 'stock' value. 
                            // However, strictly speaking, creating a batch INCREMENTS stock.
                            // If we sent stock > 0 in addProduct, it sets initial stock (simple).
                            // If we also create a batch, it might double count OR create a batch entry.
                            // Let's assume we need to register the batch to backfill that stock or just register it.
                            // Actually, recommended: Create product with 0 stock, then Create Lote with stock.
                            // But product was tailored to accept stock.
                            // Better approach: Since we already sent 'stock' in addProduct, maybe that created a simple stock entry.
                            // But for proper Lot tracking, we need a Lot entry.
                            // Let's create the lot. Our backend `crearLote` increments stock.
                            // So if we sent stock=100 in addProduct, we have 100.
                            // Then `crearLote` with 100 adds another 100 => 200.
                            // FIX: We should send stock=0 to addProduct if we are creating a lot.

                            // NOTE: We change this logic in the submit handler below (before calling addProduct).

                            await apiClient.post('/producto/lotes', {
                                productoId: Number(newId),
                                lote: creationLote.lote,
                                fechaVencimiento: creationLote.fechaVencimiento,
                                stockInicial: Number(formValues.stock), // Use the stock form value
                                stockActual: Number(formValues.stock),
                                costoUnitario: formValues.costoUnitario ? Number(formValues.costoUnitario) : undefined,
                                proveedor: undefined, // Or add field if needed
                            });
                            useAlertStore.getState().alert('Lote inicial registrado', 'success');
                        } catch (lotError) {
                            console.error('Error creating initial lot:', lotError);
                            useAlertStore.getState().alert('Producto creado pero error al registrar lote', 'warning');
                        }
                    }

                    // Insertar/actualizar en store con imagen final si existe
                    upsertProductLocal({
                        id: Number(newId),
                        descripcion: formValues.descripcion,
                        codigo: product?.data?.codigo || formValues.codigo,
                        // IProduct.precioUnitario es string en la interfaz
                        precioUnitario: String(formValues.precioUnitario) as any,
                        // Update local stock to reflect Form value (which will be true after lot creation)
                        stock: Number(formValues.stock),
                        unidadMedida: { nombre: formValues.unidadMedidaNombre as any } as any,
                        categoria: { nombre: formValues.categoriaNombre as any } as any,
                        marca: formValues.marcaId ? { id: Number(formValues.marcaId), nombre: formValues.marcaNombre as any } as any : undefined,
                        imagenUrl: urlFinal || undefined,
                        estado: 'ACTIVO' as any,
                    });
                } catch (e) {
                    // noop
                }
                // Guardar asignación de modificadores (New Product)
                if (product?.data?.id) {
                    let finalWholesaleGroupId = null;
                    if (wholesaleOptions.length > 0) {
                        try {
                            const newGroupRes = await apiClient.post('/modificadores/grupos', {
                                nombre: `Precios: ${formValues.descripcion?.substring(0, 30)}`,
                                descripcion: 'Autogenerado desde Kardex',
                                seleccionMin: 0,
                                seleccionMax: 1,
                                esObligatorio: false
                            });
                            // Backend returns nested structure: data.data.data.id
                            finalWholesaleGroupId = newGroupRes.data.data.data?.id || newGroupRes.data.data?.id || newGroupRes.data?.id;
                        } catch (err) { console.error(err); }
                    }

                    try {
                        const allGroups = gruposSeleccionados.map((id, idx) => ({ grupoId: id, ordenOverride: idx }));
                        if (finalWholesaleGroupId) {
                            allGroups.push({ grupoId: finalWholesaleGroupId, ordenOverride: -1 });
                        }

                        await apiClient.post(`/modificadores/productos/${product.data.id}`, {
                            grupos: allGroups
                        });

                        if (finalWholesaleGroupId) {
                            await syncWholesaleOptions(Number(finalWholesaleGroupId), Number(formValues.precioUnitario));
                        }
                    } catch (e) {
                        console.error('Error al asignar modificadores:', e);
                    }
                }
                setFilePrincipal(null); setPreviewPrincipal(null);
                closeModal();
            }
        } catch (error) {
            console.error(error);
            useAlertStore.getState().alert("Ocurrió un error al guardar", "error");
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        if (!isEdit) {
            setFormValues({
                ...formValues,
                codigo: productCode
            })
        }
    }, [productCode])

    console.log(formValues)

    return (
        <>
            {isOpenModal && (
                <>
                    <Modal
                        position="right"
                        width={isRestaurante ? "900px" : isFarmacia ? "500px" : "1400px"}
                        isOpenModal={isOpenModal}
                        height="auto"
                        closeModal={closeModal}
                        title={isEdit ? `Editar ${labels.titulo}` : `Nuevo ${labels.titulo}`}
                        icon="solar:box-minimalistic-bold-duotone"
                    >
                        <div className={`${isRestaurante ? 'grid-cols-1 md:grid-cols-2' : isFarmacia ? 'flex flex-col gap-6' : 'grid-cols-1 md:grid-cols-3'} grid px-4 gap-5`}>
                            <div className={isFarmacia ? 'w-full' : ''}>
                                {/* Imagen principal - Más compacta para farmacia */}
                                <div className={`mt-5 ${isFarmacia ? 'w-full' : ''}`}>
                                    <div className="p-4 rounded-lg border border-gray-200">
                                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Icon icon="mdi:image-outline" width={16} height={16} />
                                            {labels.imagen}
                                        </h5>
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => filePrincipalInputRef.current?.click()}
                                                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#6A6CFF] transition-colors cursor-pointer overflow-hidden relative"
                                                disabled={loadingImage}
                                            >
                                                {loadingImage ? (
                                                    <div className="flex flex-col items-center justify-center h-full">
                                                        <Icon icon="mdi:loading" width={32} height={32} className="animate-spin text-[#6A6CFF]" />
                                                        <span className="text-xs text-gray-500 mt-2">Validando imagen...</span>
                                                    </div>
                                                ) : previewPrincipal ? (
                                                    <img src={previewPrincipal} alt="Preview" className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                        <Icon icon="mdi:image-plus" width={32} height={32} className="mb-2" />
                                                        <div className="text-center px-4">
                                                            <div className="text-sm">Click para subir imagen</div>
                                                            <div className="text-xs text-gray-400 mt-1">Mín. 600x600px, máx. 2MB</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                            <input
                                                ref={filePrincipalInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const f = e.target.files?.[0] || null;
                                                    if (!f) { return; }
                                                    if (!f.type.startsWith('image/')) {
                                                        useAlertStore.getState().alert('El archivo debe ser una imagen', 'error');
                                                        return;
                                                    }
                                                    if (f.size > 2 * 1024 * 1024) {
                                                        useAlertStore.getState().alert('La imagen no debe superar 2MB', 'error');
                                                        return;
                                                    }

                                                    // Validar dimensiones mínimas
                                                    setLoadingImage(true);
                                                    const img = new Image();
                                                    const objectUrl = URL.createObjectURL(f);
                                                    img.onload = () => {
                                                        URL.revokeObjectURL(objectUrl);
                                                        if (img.width < 600 || img.height < 600) {
                                                            useAlertStore.getState().alert('La imagen debe tener al menos 600x600 píxeles', 'error');
                                                            setLoadingImage(false);
                                                            return;
                                                        }
                                                        setFilePrincipal(f);
                                                        setPreviewPrincipal(URL.createObjectURL(f));
                                                        setLoadingImage(false);
                                                    };
                                                    img.onerror = () => {
                                                        URL.revokeObjectURL(objectUrl);
                                                        useAlertStore.getState().alert('Error al cargar la imagen', 'error');
                                                        setLoadingImage(false);
                                                    };
                                                    img.src = objectUrl;
                                                }}
                                                className="hidden"
                                            />
                                            {previewPrincipal && !loadingImage && (
                                                <div className="mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setFilePrincipal(null); setPreviewPrincipal(null); }}
                                                        className="text-xs text-red-600 hover:text-red-700 underline"
                                                    >
                                                        Quitar imagen
                                                    </button>
                                                </div>
                                            )}
                                            <p className="text-[11px] text-gray-500 mt-2">Recomendación: 800x800px, JPG o PNG. Peso máximo 2MB.</p>

                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <button
                                                    type="button"
                                                    onClick={handleAutoImage}
                                                    disabled={isGeneratingImage || !formValues.descripcion}
                                                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${!formValues.descripcion
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                                                        }`}
                                                >
                                                    <Icon icon={isGeneratingImage ? "mdi:loading" : "mdi:magic-staff"}
                                                        className={isGeneratingImage ? "animate-spin" : ""}
                                                        width={16} />
                                                    {isGeneratingImage ? 'Buscando...' : 'Auto-Generar Imagen'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Batch Fields for New Product (Moved here for better layout) */}



                                    {!isRestaurante && !isFarmacia && (Number(formValues?.precioUnitario || 0) > 0 || Number(formValues?.costoUnitario || 0) > 0 || Number(formValues?.stock || 0) > 0) && (
                                        <div className="hidden md:block col-span-2 mt-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="p-1 bg-blue-500 rounded-lg">
                                                    <Icon icon="mdi:chart-line" className="text-white" width={20} height={20} />
                                                </div>
                                                <h4 className="text-lg font-bold text-gray-900">Análisis Financiero</h4>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
                                                {/* Precio de Venta */}
                                                <div className="bg-white p-3 rounded-lg border border-blue-100 text-center">
                                                    <div className="text-2xl font-bold text-gray-600">
                                                        S/ {Number(formValues?.precioUnitario || 0).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 font-medium">Precio Venta</div>
                                                </div>

                                                {/* Costo Unitario */}
                                                <div className="bg-white p-3 rounded-lg border border-green-100 text-center">
                                                    <div className="text-2xl font-bold text-gray-600">
                                                        S/ {Number(formValues?.costoUnitario || 0).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 font-medium">Costo Unitario</div>
                                                </div>

                                                {/* Ganancia por Unidad */}
                                                <div className="bg-white p-3 rounded-lg border border-purple-100 text-center">
                                                    <div className={`text-2xl font-bold ${(Number(formValues?.precioUnitario || 0) - Number(formValues?.costoUnitario || 0)) > 0
                                                        ? 'text-green-600'
                                                        : 'text-red-500'
                                                        }`}>
                                                        S/ {(Number(formValues?.precioUnitario || 0) - Number(formValues?.costoUnitario || 0)).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 font-medium">Ganancia/Unidad</div>
                                                </div>

                                                {/* Margen de Ganancia */}
                                                <div className="bg-white p-3 rounded-lg border border-orange-100 text-center">
                                                    <div className={`text-2xl font-bold ${(() => {
                                                        const precio = Number(formValues?.precioUnitario || 0);
                                                        const costo = Number(formValues?.costoUnitario || 0);
                                                        if (precio > 0 && costo > 0) {
                                                            const margen = ((precio - costo) / precio * 100);
                                                            return margen > 0 ? 'text-orange-600' : 'text-red-500';
                                                        }
                                                        return 'text-gray-400';
                                                    })()
                                                        }`}>
                                                        {(() => {
                                                            const precio = Number(formValues?.precioUnitario || 0);
                                                            const costo = Number(formValues?.costoUnitario || 0);
                                                            if (precio > 0 && costo > 0) {
                                                                const margen = ((precio - costo) / precio * 100);
                                                                return `${margen.toFixed(1)}%`;
                                                            }
                                                            return '0.0%';
                                                        })()}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 font-medium">Margen</div>
                                                </div>
                                            </div>

                                            {/* Proyecciones */}
                                            {(() => {
                                                const stockParaProyeccion = isEdit && tipoAjusteStock !== 'ninguno'
                                                    ? (tipoAjusteStock === 'reemplazar' ? cantidadAjuste :
                                                        tipoAjusteStock === 'sumar' ? stockOriginal + cantidadAjuste :
                                                            tipoAjusteStock === 'restar' ? Math.max(0, stockOriginal - cantidadAjuste) : stockOriginal)
                                                    : Number(formValues?.stock || 0);

                                                return stockParaProyeccion > 0 && Number(formValues?.precioUnitario || 0) > 0 && Number(formValues?.costoUnitario || 0) > 0 && (
                                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                            <Icon icon="mdi:calculator" width={16} height={16} />
                                                            Proyección con Stock {isEdit && tipoAjusteStock !== 'ninguno' ? 'Resultante' : 'Actual'}
                                                        </h5>
                                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                                            <div className="text-center">
                                                                <div className="font-bold text-gray-600">
                                                                    S/ {(Number(formValues?.precioUnitario || 0) * stockParaProyeccion).toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-gray-500">Valor Total Venta</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="font-bold text-green-600">
                                                                    S/ {(Number(formValues?.costoUnitario || 0) * stockParaProyeccion).toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-gray-500">Inversión Total</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="font-bold text-blue-600">
                                                                    S/ {((Number(formValues?.precioUnitario || 0) - Number(formValues?.costoUnitario || 0)) * stockParaProyeccion).toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-gray-500">Ganancia Potencial</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Notas importantes */}
                                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <Icon icon="mdi:information" className="text-red-600 mt-0.5" width={16} height={16} />
                                                    <div className="text-xs text-red-800">
                                                        <p className="font-semibold mb-1">Notas importantes:</p>
                                                        <ul className="space-y-1 text-xs">
                                                            <li>• Al cambiar el stock se registrará automáticamente un movimiento en kardex</li>
                                                            <li>• El costo unitario ayuda a calcular el margen de ganancia real</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* ========== LAYOUT FARMACIA - Selector de Drawers ========== */}
                            {isFarmacia && (
                                <div className="w-full mt-3 space-y-5">
                                    {/* Inputs Básicos */}
                                    <div className="flex flex-col gap-4">
                                        <InputPro autocomplete="off" error={errors.codigo} value={formValues?.codigo} name="codigo" onChange={handleChange} isLabel label="Código" />
                                        <InputPro autocomplete="off" value={formValues?.descripcion} error={errors.descripcion} name="descripcion" onChange={handleChange} isLabel label="Nombre del medicamento" />

                                        <Select defaultValue={formValues?.unidadMedidaNombre} error={""} isSearch options={unitOfMeasure?.map((item: ICategory) => ({ id: item?.id, value: `${item?.nombre}` }))} id="unidadMedidaId" name="unidadMedidaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Unidad de medida" withLabel />
                                        <Select defaultValue={formValues.categoriaNombre} error={""} isSearch options={categories?.map((item: ICategory) => ({ id: item?.id, value: `${item?.nombre}` }))} id="categoriaId" name="categoriaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Categoría" withLabel />

                                        <Select defaultValue={formValues.marcaNombre} error={""} isSearch options={brands?.map((item: IBrand) => ({ id: item?.id, value: `${item?.nombre}` }))} id="marcaId" name="marcaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Laboratorio/Marca" withLabel />
                                    </div>

                                    {/* Botones Selectores de Drawers */}
                                    <div className="flex flex-col gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowMedicamentoModal(true)}
                                            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:shadow-md transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <Icon icon="solar:pill-bold-duotone" width={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Detalles del Medicamento</h4>
                                                    <p className="text-xs text-gray-500">Principio activo, concentración...</p>
                                                </div>
                                            </div>
                                            <Icon icon="solar:alt-arrow-right-linear" width={20} className="text-gray-400 group-hover:text-blue-600" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setShowLotesModal(true)}
                                            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <Icon icon="solar:box-minimalistic-bold-duotone" width={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Gestión de Lotes</h4>
                                                    <p className="text-xs text-gray-500">{isEdit ? 'Historial y vencimientos' : 'Configurar lote inicial'}</p>
                                                </div>
                                            </div>
                                            <Icon icon="solar:alt-arrow-right-linear" width={20} className="text-gray-400 group-hover:text-indigo-600" />
                                        </button>
                                    </div>

                                    {/* Stock Global */}
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                                        <h5 className="text-sm font-bold text-gray-900 mb-3 ml-1">Inventario General</h5>
                                        <div className="flex flex-col gap-4">
                                            <InputPro autocomplete="off" type="number" value={formValues?.stock} error={errors.stock} name="stock" onChange={handleChange} isLabel label="Stock Total" placeholder="0" />
                                            <div className="flex gap-2">
                                                <InputPro autocomplete="off" type="number" value={formValues?.stockMinimo ?? ''} name="stockMinimo" onChange={handleChange} isLabel label="Min." placeholder="5" />
                                                <InputPro autocomplete="off" type="number" value={formValues?.stockMaximo ?? ''} name="stockMaximo" onChange={handleChange} isLabel label="Max." placeholder="100" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Precios */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <InputPro autocomplete="off" type="number" step="0.01" value={formValues?.precioUnitario} error={errors.precioUnitario} name="precioUnitario" onChange={handleChange} isLabel label="Precio Venta (S/)" />
                                        <InputPro autocomplete="off" type="number" step="0.01" value={formValues?.costoUnitario || ''} name="costoUnitario" onChange={handleChange} isLabel label="Costo (S/)" placeholder="0.00" />
                                    </div>
                                </div>
                            )}


                            {
                                !isFarmacia && (
                                    /* ========== LAYOUT OTROS RUBROS ========== */
                                    <div className={`md:px-2 px-3 ${isRestaurante ? 'col-span-1' : 'col-span-2'} grid md:grid-cols-2 grid-cols-2 mt-5 md:gap-5 gap-y-2`}>
                                        <div className="col-span-3 md:col-span-1">
                                            <InputPro autocomplete="off" error={errors.codigo} value={formValues?.codigo} name="codigo" onChange={handleChange} isLabel label={labels.codigo} />
                                        </div>
                                        <div className="col-span-3 md:col-span-1 relative">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-gray-700">{labels.nombre}</label>
                                                <button
                                                    type="button"
                                                    onClick={handleAutoCategorize}
                                                    disabled={isCategorizing || !formValues.descripcion}
                                                    className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${!formValues.descripcion
                                                        ? 'text-gray-300 bg-gray-50'
                                                        : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                                                        }`}
                                                    title="Auto-detectar categoría y marca basada en el nombre"
                                                >
                                                    <Icon icon={isCategorizing ? "mdi:loading" : "mdi:sparkles"}
                                                        className={isCategorizing ? "animate-spin" : ""} />
                                                    {isCategorizing ? 'Analizando...' : 'Auto-Categorizar'}
                                                </button>
                                            </div>
                                            <InputPro autocomplete="off" value={formValues?.descripcion} error={errors.descripcion} name="descripcion" onChange={handleChange} isLabel={false} />
                                        </div>
                                        {/* Tipo de afectación - Oculto para Farmacia (usa Gravado por defecto) */}
                                        {!isFarmacia && (
                                            <div className={`col-span-3  ${isRestaurante ? 'md:col-span-2' : 'md:col-span-2 flex gap-2'}`}>
                                                <Select defaultValue={formValues.afectacionNombre || "Gravado - operación onerosa"} error={""} isSearch options={afectaciones} id="tipoAfectacionIGV" name="afectacionNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Tipo de afectación" />
                                            </div>
                                        )}

                                        <div className="col-span-3 md:col-span-1">
                                            <Select defaultValue={formValues?.unidadMedidaNombre} error={""} isSearch options={unitOfMeasure?.map((item: ICategory) => ({
                                                id: item?.id,
                                                value: `${item?.nombre}`
                                            }))} id="unidadMedidaId" name="unidadMedidaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Unidad de medida" />
                                        </div>
                                        <div className={`col-span-3 md:col-span-1 ${isRestaurante ? '' : 'flex gap-2'} w-full`}>
                                            <div className="w-full">
                                                <Select
                                                    defaultValue={formValues.categoriaNombre}
                                                    error={""}
                                                    isSearch
                                                    options={categories?.map((item: ICategory) => ({ id: item?.id, value: `${item?.nombre}` }))}
                                                    id="categoriaId"
                                                    name="categoriaNombre"
                                                    value=""
                                                    onChange={handleChangeSelect}
                                                    icon="clarity:box-plot-line"
                                                    isIcon
                                                    label="Categoria"
                                                />
                                            </div>
                                            {!isRestaurante && (
                                                <div className="w-full">
                                                    <Select
                                                        defaultValue={formValues.marcaNombre}
                                                        error={""}
                                                        isSearch
                                                        options={brands?.map((item: IBrand) => ({ id: item?.id, value: `${item?.nombre}` }))}
                                                        id="marcaId"
                                                        name="marcaNombre"
                                                        value=""
                                                        onChange={handleChangeSelect}
                                                        icon="clarity:box-plot-line"
                                                        isIcon
                                                        label="Marca"
                                                    />
                                                </div>
                                            )}
                                        </div>


                                        {/* Campos de farmacia para otros rubros que NO sean farmacia pero tengan gestionLotes */}
                                        {features.gestionLotes && !isFarmacia && (
                                            <>
                                                <div className="col-span-3 md:col-span-1">
                                                    <InputPro
                                                        autocomplete="off"
                                                        value={(formValues as any)?.principioActivo || ''}
                                                        name="principioActivo"
                                                        onChange={handleChange}
                                                        isLabel
                                                        label="Principio Activo"
                                                        placeholder="Ej: Paracetamol"
                                                    />
                                                </div>
                                                <div className="col-span-3 md:col-span-1">
                                                    <InputPro
                                                        autocomplete="off"
                                                        value={(formValues as any)?.laboratorio || ''}
                                                        name="laboratorio"
                                                        onChange={handleChange}
                                                        isLabel
                                                        label="Laboratorio"
                                                        placeholder="Ej: Bayer"
                                                    />
                                                </div>
                                                <div className="col-span-3 md:col-span-1">
                                                    <InputPro
                                                        autocomplete="off"
                                                        value={(formValues as any)?.concentracion || ''}
                                                        name="concentracion"
                                                        onChange={handleChange}
                                                        isLabel
                                                        label="Concentración"
                                                        placeholder="Ej: 500mg"
                                                    />
                                                </div>
                                                <div className="col-span-3 md:col-span-1">
                                                    <InputPro
                                                        autocomplete="off"
                                                        value={(formValues as any)?.presentacion || ''}
                                                        name="presentacion"
                                                        onChange={handleChange}
                                                        isLabel
                                                        label="Presentación"
                                                        placeholder="Ej: Caja x 100 tabletas"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Fraccionamiento para otros rubros */}
                                        {features.permiteFraccionamiento && !isFarmacia && (
                                            <div className="col-span-3 border-t pt-4 mt-4">
                                                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <Icon icon="solar:box-minimalistic-bold-duotone" width={16} />
                                                    Unidades de Compra/Venta
                                                </h5>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <InputPro
                                                        autocomplete="off"
                                                        value={(formValues as any)?.unidadCompra || ''}
                                                        name="unidadCompra"
                                                        onChange={handleChange}
                                                        isLabel
                                                        label="Unidad Compra"
                                                        placeholder="CAJA"
                                                    />
                                                    <InputPro
                                                        autocomplete="off"
                                                        value={(formValues as any)?.unidadVenta || ''}
                                                        name="unidadVenta"
                                                        onChange={handleChange}
                                                        isLabel
                                                        label="Unidad Venta"
                                                        placeholder="BLISTER"
                                                    />
                                                    <InputPro
                                                        autocomplete="off"
                                                        type="number"
                                                        value={(formValues as any)?.factorConversion || 1}
                                                        name="factorConversion"
                                                        onChange={handleChange}
                                                        isLabel
                                                        label="Factor"
                                                        placeholder="1"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Ejemplo: 1 CAJA = 10 BLÍSTER (Factor = 10)
                                                </p>
                                            </div>
                                        )}


                                        {/* 🆕 CÓDIGO DE BARRAS (BODEGA/SUPERMARKET) */}
                                        {features.usaCodigoBarras && (
                                            <div className="col-span-3 md:col-span-2">
                                                <InputPro
                                                    autocomplete="off"
                                                    value={(formValues as any)?.codigoBarras || ''}
                                                    name="codigoBarras"
                                                    onChange={handleChange}
                                                    isLabel
                                                    label="Código de Barras"
                                                    placeholder="EAN-13 o UPC"
                                                />
                                            </div>
                                        )}

                                        {/* 🆕 OFERTAS (SUPERMARKET) */}
                                        {features.gestionOfertas && (
                                            <div className="col-span-3 border-t pt-4 mt-4">
                                                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <Icon icon="solar:tag-price-bold-duotone" width={16} />
                                                    Ofertas y Promociones
                                                </h5>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <InputPro
                                                        autocomplete="off"
                                                        type="number"
                                                        step="0.01"
                                                        value={(formValues as any)?.precioOferta || ''}
                                                        name="precioOferta"
                                                        onChange={handleChange}
                                                        isLabel
                                                        label="Precio Oferta (S/)"
                                                        placeholder="0.00"
                                                    />
                                                    <InputPro
                                                        autocomplete="off"
                                                        type="date"
                                                        value={(formValues as any)?.fechaInicioOferta || ''}
                                                        name="fechaInicioOferta"
                                                        onChange={handleChange}
                                                        isLabel
                                                        label="Inicio Oferta"
                                                    />
                                                    <InputPro
                                                        autocomplete="off"
                                                        type="date"
                                                        value={(formValues as any)?.fechaFinOferta || ''}
                                                        name="fechaFinOferta"
                                                        onChange={handleChange}
                                                        isLabel
                                                        label="Fin Oferta"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className={`col-span-3 md:col-span-1 grid ${isRestaurante ? 'grid-cols-1' : isFarmacia ? 'grid-cols-2' : 'grid-cols-2'} gap-5`}>
                                            <InputPro
                                                autocomplete="off"
                                                type="number"
                                                step="0.01"
                                                value={formValues?.precioUnitario}
                                                error={errors.precioUnitario}
                                                name="precioUnitario"
                                                onChange={handleChange}
                                                isLabel
                                                label={isMobile ? (isRestaurante ? 'Precio' : 'Precio Venta') : labels.precio}
                                            />
                                            {/* Costo unitario - Solo para rubros no restaurante */}
                                            {!isRestaurante && (
                                                <InputPro
                                                    autocomplete="off"
                                                    type="number"
                                                    step="0.01"
                                                    value={formValues?.costoUnitario || ''}
                                                    name="costoUnitario"
                                                    onChange={handleChange}
                                                    isLabel
                                                    label={isMobile ? "Costo Unitario" : "Costo Unitario (S/)"}
                                                    placeholder="Costo de compra"
                                                />
                                            )}
                                        </div>


                                        {/* Stock Management - Simplificado para restaurantes y farmacia */}
                                        <div className={isRestaurante ? 'col-span-2' : isFarmacia ? 'col-span-2' : 'col-span-2'}>
                                            <div className="p-4 rounded-lg border border-gray-200">
                                                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <Icon icon="mdi:cube-outline" width={16} height={16} />
                                                    {isRestaurante ? 'Disponibilidad' : isFarmacia ? 'Stock' : 'Gestión de Inventario'}
                                                </h5>

                                                {/* Para restaurantes: solo stock simple */}
                                                {isRestaurante ? (
                                                    <div>
                                                        <InputPro
                                                            autocomplete="off"
                                                            type="number"
                                                            value={formValues?.stock}
                                                            error={errors.stock}
                                                            name="stock"
                                                            onChange={handleChange}
                                                            isLabel
                                                            label="Cantidad disponible"
                                                            placeholder="Ej. 50"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Indica cuántas porciones/unidades tienes disponibles para vender.
                                                        </p>
                                                    </div>
                                                ) : isEdit ? (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                                <div className="text-lg font-bold text-blue-600">{stockOriginal}</div>
                                                                <div className="text-xs text-gray-600">Stock Actual</div>
                                                            </div>
                                                            <div className="bg-white p-3 rounded-lg border border-green-100">
                                                                <div className="text-lg font-bold text-green-600">
                                                                    {tipoAjusteStock === 'ninguno' ? stockOriginal :
                                                                        tipoAjusteStock === 'reemplazar' ? cantidadAjuste :
                                                                            tipoAjusteStock === 'sumar' ? stockOriginal + cantidadAjuste :
                                                                                tipoAjusteStock === 'restar' ? Math.max(0, stockOriginal - cantidadAjuste) : stockOriginal
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-600">Stock Resultante</div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Ajuste</label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {[
                                                                        { value: 'ninguno', label: 'Sin cambios', color: 'bg-gray-100 text-gray-700' },
                                                                        { value: 'reemplazar', label: 'Reemplazar stock', color: 'bg-blue-100 text-blue-700' },
                                                                        { value: 'sumar', label: 'Agregar inventario', color: 'bg-green-100 text-green-700' },
                                                                        { value: 'restar', label: 'Quitar inventario', color: 'bg-red-100 text-red-700' }
                                                                    ].map((tipo) => (
                                                                        <button
                                                                            key={tipo.value}
                                                                            type="button"
                                                                            onClick={() => setTipoAjusteStock(tipo.value as any)}
                                                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${tipoAjusteStock === tipo.value
                                                                                ? tipo.color + ' ring-2 ring-offset-2 ring-blue-400'
                                                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                                                }`}
                                                                        >
                                                                            {tipo.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {tipoAjusteStock !== 'ninguno' && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                                        {tipoAjusteStock === 'reemplazar' ? 'Nuevo stock total:' :
                                                                            tipoAjusteStock === 'sumar' ? 'Cantidad a agregar:' :
                                                                                'Cantidad a quitar:'}
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={cantidadAjuste}
                                                                        onChange={(e) => setCantidadAjuste(Number(e.target.value))}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                        placeholder="Ingrese la cantidad"
                                                                    />
                                                                </div>
                                                            )}

                                                            {tipoAjusteStock !== 'ninguno' && (
                                                                <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                                                    <Icon icon="mdi:information" className="inline mr-1" width={14} height={14} />
                                                                    Este ajuste se registrará automáticamente en el kardex como movimiento de inventario.
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                                <InputPro
                                                                    autocomplete="off"
                                                                    type="number"
                                                                    value={formValues?.stockMinimo ?? ''}
                                                                    name="stockMinimo"
                                                                    onChange={handleChange}
                                                                    isLabel
                                                                    label="Stock mínimo"
                                                                    placeholder="Ej. 5"
                                                                />
                                                                <InputPro
                                                                    autocomplete="off"
                                                                    type="number"
                                                                    value={formValues?.stockMaximo ?? ''}
                                                                    name="stockMaximo"
                                                                    onChange={handleChange}
                                                                    isLabel
                                                                    label={isMobile ? "Stock máximo" : "Stock máximo (opcional)"}
                                                                    placeholder="Ej. 100"
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div>
                                                        <InputPro
                                                            autocomplete="off"
                                                            type="number"
                                                            value={formValues?.stock}
                                                            error={errors.stock}
                                                            name="stock"
                                                            onChange={handleChange}
                                                            isLabel
                                                            label="Stock Inicial"
                                                            placeholder="Cantidad inicial en inventario"
                                                        />
                                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                                            <InputPro
                                                                autocomplete="off"
                                                                type="number"
                                                                value={formValues?.stockMinimo ?? ''}
                                                                name="stockMinimo"
                                                                onChange={handleChange}
                                                                isLabel
                                                                label="Stock mínimo"
                                                                placeholder="Ej. 5"
                                                            />
                                                            <InputPro
                                                                autocomplete="off"
                                                                type="number"
                                                                value={formValues?.stockMaximo ?? ''}
                                                                name="stockMaximo"
                                                                onChange={handleChange}
                                                                isLabel
                                                                label={isMobile ? "Stock máximo" : "Stock máximo (opcional)"}
                                                                placeholder="Ej. 100"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* WHOLESALE PRICING SECTION (Relocated) */}
                                        <div className="col-span-2 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="p-1 bg-green-500 rounded-lg">
                                                    <Icon icon="mdi:tag-multiple" className="text-white" width={20} height={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-900 leading-none">Precios por Cantidad / Mayorista</h4>
                                                    <p className="text-xs text-gray-500 mt-1">Define presentaciones especiales (ej. Docena) con su precio de venta final.</p>
                                                </div>
                                            </div>

                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    <div className="col-span-6">Nombre Presentación</div>
                                                    <div className="col-span-4">Precio Final</div>
                                                    <div className="col-span-2 text-center">Acción</div>
                                                </div>

                                                {wholesaleOptions.length > 0 ? (
                                                    wholesaleOptions.map((opt, idx) => (
                                                        <div key={idx} className="grid grid-cols-12 gap-2 p-3 border-b border-gray-100 items-center last:border-0 hover:bg-gray-50">
                                                            <div className="col-span-6 font-medium text-gray-900">{opt.nombre}</div>
                                                            <div className="col-span-4 font-bold text-green-700">S/ {Number(opt.precio).toFixed(2)}</div>
                                                            <div className="col-span-2 text-center">
                                                                <button
                                                                    onClick={() => handleRemoveWholesaleOption(idx)}
                                                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                                >
                                                                    <Icon icon="mdi:trash-can-outline" width={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-gray-400 italic">
                                                        No hay precios configurados. Agrega uno abajo.
                                                    </div>
                                                )}

                                                {/* Add New Row */}
                                                <div className="grid grid-cols-12 gap-2 p-3 bg-blue-50/50">
                                                    <div className="col-span-6">
                                                        <input
                                                            type="text"
                                                            placeholder="Ej. Docena, Caja x 24..."
                                                            className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5"
                                                            value={newWholesaleOption.nombre}
                                                            onChange={(e) => setNewWholesaleOption({ ...newWholesaleOption, nombre: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-span-4 relative">
                                                        <span className="absolute left-2 top-1.5 text-gray-500 text-sm">S/</span>
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pl-7 py-1.5"
                                                            value={newWholesaleOption.precio}
                                                            onChange={(e) => setNewWholesaleOption({ ...newWholesaleOption, precio: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={handleAddWholesaleOption}
                                                            disabled={!newWholesaleOption.nombre || !newWholesaleOption.precio}
                                                            className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                        >
                                                            <Icon icon="mdi:plus" width={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                    </div>
                                )
                            }

                            {/* Sección de Modificadores - Solo para restaurantes */}
                            {
                                isRestaurante && gruposModificadores && gruposModificadores.length > 0 && (
                                    <div className="col-span-2 mt-4">
                                        <div className="p-4 rounded-lg border border-gray-200">
                                            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                <Icon icon="mdi:food-variant" width={16} height={16} />
                                                Personalización del Plato
                                            </h5>
                                            <p className="text-xs text-gray-500 mb-3">
                                                Selecciona los grupos de modificadores que los clientes podrán elegir al pedir este plato (ej: cremas, acompañamientos, extras)
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {gruposModificadores.map((grupo: GrupoModificador) => (
                                                    <button
                                                        key={grupo.id}
                                                        type="button"
                                                        onClick={() => toggleGrupoSeleccionado(grupo.id)}
                                                        className={`p-3 rounded-lg border-2 transition-all text-left ${gruposSeleccionados.includes(grupo.id)
                                                            ? 'border-[#6A6CFF] bg-[#6A6CFF]/5'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${gruposSeleccionados.includes(grupo.id)
                                                                ? 'border-[#6A6CFF] bg-[#6A6CFF]'
                                                                : 'border-gray-300'
                                                                }`}>
                                                                {gruposSeleccionados.includes(grupo.id) && (
                                                                    <Icon icon="mdi:check" className="text-white" width={12} height={12} />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm text-gray-800">{grupo.nombre}</div>
                                                                {grupo.descripcion && (
                                                                    <div className="text-xs text-gray-500 mt-0.5">{grupo.descripcion}</div>
                                                                )}
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {grupo.esObligatorio && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                                                                            Obligatorio
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-gray-400">
                                                                        {grupo.opciones?.length || 0} opciones
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            {gruposSeleccionados.length === 0 && (
                                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                                    <Icon icon="mdi:information" className="inline mr-1" width={14} height={14} />
                                                    Sin modificadores asignados. Los clientes no podrán personalizar este plato.
                                                </div>
                                            )}
                                            {gruposSeleccionados.length > 0 && (
                                                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                                                    <Icon icon="mdi:check-circle" className="inline mr-1" width={14} height={14} />
                                                    {gruposSeleccionados.length} grupo(s) seleccionado(s). Los clientes podrán personalizar este plato al agregarlo al carrito.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            }

                        </div >

                        <div className="flex gap-4 px-6 justify-end mt-8 pt-6 mb-5 md:pr-5 border-t border-dashed border-gray-200">
                            <Button className="border border-gray-300 !text-gray-700 hover:bg-gray-50 px-6" onClick={() => setIsOpenModal(false)}>Cancelar</Button>
                            <Button color="black" className="px-6" onClick={handleSubmitProduct} disabled={loading}>
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Icon icon="svg-spinners:180-ring-with-bg" />
                                        {isEdit ? "Editando..." : "Guardando..."}
                                    </div>
                                ) : (
                                    isEdit ? "Guardar Cambios" : "Crear Producto"
                                )}
                            </Button>
                        </div>
                    </Modal >
                    {/* Modales Anidados (Drawers) - Renderizados como hermanos para evitar problemas de stacking/transform */}
                    <ModalMedicamento
                        isOpen={showMedicamentoModal}
                        onClose={() => setShowMedicamentoModal(false)}
                        formValues={formValues}
                        handleChange={handleChange}
                        errors={errors}
                    />
                    <ModalLotes
                        isOpen={showLotesModal}
                        onClose={() => setShowLotesModal(false)}
                        formValues={formValues}
                        isEdit={isEdit}
                        creationLote={creationLote}
                        setCreationLote={setCreationLote}
                    />
                </>
            )}
        </>
    )
}

export default ModalProduct