import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useCategoriesStore } from "@/zustand/categories";
import { IExtentionsState, useExtentionsStore } from "@/zustand/extentions";
import { IProductsState, useProductsStore } from "@/zustand/products";
import { useAuthStore } from "@/zustand/auth";
import useAlertStore from "@/zustand/alert";
import { useBrandsStore } from "@/zustand/brands";
import { useModificadoresStore } from "@/zustand/modificadores";
import { esRubroFabricacion, useRubroFeatures } from "@/utils/rubro-features";
import { hasPlanFeature, hasSubPermission, type IUserPermissions } from "@/utils/permissions";
import apiClient from "@/utils/apiClient";
import {
  IPropsProducts,
  TipoAjusteStock,
  ICreationLote,
  IWholesaleOption,
} from "./ProductModalModel";

export const useProductModalViewModel = (props: IPropsProducts) => {
  const {
    setSelectProduct,
    isInvoice,
    initialForm,
    formValues,
    setErrors,
    isOpenModal,
    setFormValues,
    closeModal,
    isEdit,
    errors,
    setIsOpenModal,
  } = props;

  // --- Global Stores ---
  const { getUnitOfMeasure, unitOfMeasure }: IExtentionsState =
    useExtentionsStore();
  const { auth } = useAuthStore();
  const { getAllCategories, categories } = useCategoriesStore();
  const {
    editProduct,
    addProduct,
    getCodeProduct,
    productCode,
    setProductImage,
    upsertProductLocal,
  }: IProductsState = useProductsStore();
  const { brands, getAllBrands, addBrand } = useBrandsStore();
  const { grupos: gruposModificadores, getAllGrupos } = useModificadoresStore();

  // --- Local State ---
  const [gruposSeleccionados, setGruposSeleccionados] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Rubro Detections & Features ---
  const isRestaurante = (() => {
    const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || "";
    return (
      rubroNombre.includes("restaurante") ||
      rubroNombre.includes("comida") ||
      rubroNombre.includes("alimento")
    );
  })();

  const isFarmacia = (() => {
    const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || "";
    return rubroNombre.includes("farmacia") || rubroNombre.includes("botica");
  })();

  const esDrogueria = (() => {
    const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || "";
    return rubroNombre.includes("drogueria") || rubroNombre.includes("droguería");
  })();

  // Cualquier rubro farmacéutico regulado
  const esFarmaceutico = isFarmacia || esDrogueria;

  const isFabricacion = esRubroFabricacion(auth?.empresa?.rubro?.nombre);
  const isModaRubro = (() => {
    const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || "";
    return [
      "moda",
      "ropa",
      "textil",
      "confeccion",
      "confección",
      "calzado",
      "zapateria",
      "zapatería",
      "cartera",
      "boutique",
      "variantes avanzadas",
    ].some((keyword) => rubroNombre.includes(keyword));
  })();

  const features = useRubroFeatures(auth?.empresa?.rubro, {
    usaCodigoBarrasManual: auth?.empresa?.usaCodigoBarrasManual,
  });

  const userPermissions: IUserPermissions | null = auth
    ? (auth as unknown as IUserPermissions)
    : null;
  const tieneAccesoReservas = hasSubPermission(
    userPermissions,
    "kardex:reservas",
  );
  const tieneGestionProvisiones = hasPlanFeature(userPermissions, "tieneGestionProvisiones");
  const tieneTienda = hasPlanFeature(userPermissions, "tieneTienda");
  const tieneGestionLotes = hasPlanFeature(userPermissions, "tieneGestionLotes");
  const tieneDescripcionRica = hasPlanFeature(userPermissions, "tieneDescripcionRica");
  const productSections = {
    imagen: true,
    precios: true,
    mayorista: !isRestaurante,
    inventario: features.controlStock,
    codigos: features.usaCodigoBarras,
    lotes: tieneGestionLotes && features.gestionLotes && !isFabricacion,
    farmacia: features.gestionLotes && esFarmaceutico,
    fraccionamiento: features.permiteFraccionamiento,
    ofertas: features.gestionOfertas,
    fichaComputo: features.fichaTecnicaComputo,
    seriesGarantia: features.controlSeriesGarantia,
    ecommerce: tieneTienda,
    descripcionRica: tieneDescripcionRica || features.descripcionRica,
    provisiones: tieneGestionProvisiones,
  };

  const labels = {
    titulo: isRestaurante
      ? "Plato"
      : isFarmacia
        ? "Medicamento"
        : isFabricacion
          ? "Ítem de producción"
          : "Producto",
    nombre: isRestaurante
      ? "Nombre del plato"
      : isFarmacia
        ? "Nombre del medicamento"
        : isFabricacion
          ? "Nombre del ítem"
          : "Nombre del producto",
    codigo: isRestaurante
      ? "Código del plato"
      : isFarmacia
        ? "Código"
        : isFabricacion
          ? "Código del ítem"
          : "Código de producto",
    imagen: isRestaurante ? "Imagen del plato" : "Imagen del producto",
    precio: isRestaurante ? "Precio (S/)" : "Precio de Venta (S/)",
  };

  // --- Media State ---
  const [filePrincipal, setFilePrincipal] = useState<File | null>(null);
  const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const filePrincipalInputRef = useRef<HTMLInputElement | null>(null);
  const [variantImageFiles, setVariantImageFiles] = useState<Record<string, File>>({});
  const [variantImagePreviews, setVariantImagePreviews] = useState<Record<string, string>>({});

  // --- Stock State ---
  const [tipoAjusteStock, setTipoAjusteStock] =
    useState<TipoAjusteStock>("ninguno");
  const [cantidadAjuste, setCantidadAjuste] = useState<number>(0);
  const stockOriginal = Number(formValues?.stock || 0);

  // --- Drawers State ---
  const [showMedicamentoModal, setShowMedicamentoModal] = useState(false);
  const [showLotesModal, setShowLotesModal] = useState(false);

  // --- Form State ---
  const [loading, setLoading] = useState(false);
  const [technicalTemplate, setTechnicalTemplate] = useState<any | null>(null);
  const [creationLote, setCreationLote] = useState<ICreationLote>({
    lote: "",
    fechaVencimiento: "",
  });

  // --- Wholesale Options State ---
  const [newWholesaleOption, setNewWholesaleOption] = useState({
    cantidadMinima: "",
    precio: "",
  });

  // --- Barcode Global Search ---
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [searchingBarcode, setSearchingBarcode] = useState(false);
  const [autoImageOnSave, setAutoImageOnSave] = useState(false);
  const [imageCandidates, setImageCandidates] = useState<string[]>([]);
  const originalImageUrlRef = useRef<string | null>(null);
  const originalImageProductIdRef = useRef<number | null>(null);

  const autoImagePrefKey = `producto:autoImageOnSave:${auth?.empresaId ?? "default"}:${auth?.id ?? "user"}`;

  const resolveBrand = async (
    brandRaw: string,
  ): Promise<{ marcaId: number | null; marcaNombre: string } | null> => {
    const nombre = brandRaw.split(",")[0].trim();
    if (!nombre) return null;
    const existing = brands.find(
      (b) => b.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (existing) return { marcaId: existing.id, marcaNombre: existing.nombre };
    try {
      const created: any = await (addBrand as any)({ nombre });
      if (created?.id) return { marcaId: created.id, marcaNombre: nombre };
    } catch {}
    return { marcaId: null, marcaNombre: nombre };
  };

  const handleBarcodeGlobalSearch = async () => {
    const code = barcodeQuery.trim().replace(/\D/g, "");
    if (code.length < 8) return;
    setSearchingBarcode(true);
    try {
      let filled = false;

      // 1. Backend local catalog
      try {
        const resp = await apiClient.get(
          `productos/barcode/${encodeURIComponent(code)}`,
        );
        const product = (resp.data as any)?.data;
        if (product?.descripcion) {
          let brandUpdate: { marcaId?: number | null; marcaNombre?: string } =
            {};
          if (product.marca?.id) {
            brandUpdate = {
              marcaId: product.marca.id,
              marcaNombre: product.marca.nombre,
            };
          } else if (product.marcaStr) {
            const brandData = await resolveBrand(product.marcaStr);
            if (brandData)
              brandUpdate = {
                marcaId: brandData.marcaId,
                marcaNombre: brandData.marcaNombre,
              };
          }
          const categoryUpdate: {
            categoriaId?: number | null;
            categoriaNombre?: string;
          } = product.categoria?.id
            ? {
                categoriaId: product.categoria.id,
                categoriaNombre: product.categoria.nombre,
              }
            : {};
          setFormValues((prev: any) => ({
            ...prev,
            descripcion: product.descripcion,
            codigoBarras: code,
            ...(product.imagenUrl
              ? {
                  imagenUrl: product.imagenUrl,
                  imagenUrlDisplay: product.imagenUrlDisplay || product.imagenUrl,
                }
              : {}),
            ...brandUpdate,
            ...categoryUpdate,
            // Campos farmacéuticos — se rellenan si vienen de OpenFDA
            ...(product.principioActivo ? { principioActivo: product.principioActivo } : {}),
            ...(product.laboratorio ? { laboratorio: product.laboratorio } : {}),
            ...(product.presentacion ? { presentacion: product.presentacion } : {}),
            ...(product.concentracion ? { concentracion: product.concentracion } : {}),
            ...(product.tipoAfectacionIGV ? { tipoAfectacionIGV: product.tipoAfectacionIGV } : {}),
          }));
          if (product.imagenUrl) {
            setPreviewPrincipal(product.imagenUrlDisplay || product.imagenUrl);
          }
          filled = true;
        }
      } catch {}

      // El backend ya maneja el cascade completo (local → FDA/OFF según rubro).
      // Si no se encontró nada, solo registrar el código de barras.
      if (!filled) setFormValues({ ...formValues, codigoBarras: code });
    } finally {
      setSearchingBarcode(false);
    }
  };

  // --- Initial Effect Triggers ---
  useEffect(() => {
    if (
      !unitOfMeasure ||
      (Array.isArray(unitOfMeasure) && unitOfMeasure.length === 0)
    )
      getUnitOfMeasure();
    if (!categories || (Array.isArray(categories) && categories.length === 0))
      getAllCategories({});
    if (!brands || brands.length === 0) getAllBrands();
    if (!gruposModificadores || gruposModificadores.length === 0)
      getAllGrupos();
  }, []);

  useEffect(() => {
    if (!isOpenModal) return;
    if (!isEdit && auth && auth.empresaId && !formValues?.codigo) {
      getCodeProduct(auth.empresaId);
    }
  }, [isOpenModal, isEdit, auth]);

  useEffect(() => {
    if (!isOpenModal) return;
    const displayImage =
      (formValues as any)?.imagenUrlDisplay || (formValues as any)?.imagenUrl;
    if (isEdit && displayImage && !previewPrincipal) {
      setPreviewPrincipal(displayImage);
    }
    const productId = Number(formValues?.productoId || 0);
    if (isEdit && productId && originalImageProductIdRef.current !== productId) {
      originalImageProductIdRef.current = productId;
      originalImageUrlRef.current =
        typeof (formValues as any)?.imagenUrl === "string"
          ? (formValues as any).imagenUrl.trim() || null
          : null;
      cargarGruposAsignados(formValues.productoId);
    }
  }, [
    isOpenModal,
    isEdit,
    formValues?.productoId,
    (formValues as any)?.imagenUrl,
    (formValues as any)?.imagenUrlDisplay,
    previewPrincipal,
  ]);

  useEffect(() => {
    if (!isOpenModal) {
      setPreviewPrincipal(null);
      setFilePrincipal(null);
      setLoadingImage(false);
      setImageCandidates([]);
      setGruposSeleccionados([]);
      setCreationLote({ lote: "", fechaVencimiento: "" });
      setNewWholesaleOption({ cantidadMinima: "", precio: "" });
      setBarcodeQuery("");
      setSearchingBarcode(false);
      originalImageUrlRef.current = null;
      originalImageProductIdRef.current = null;
      setTipoAjusteStock("ninguno");
      setCantidadAjuste(0);
      setShowMedicamentoModal(false);
      setShowLotesModal(false);
    }
  }, [isOpenModal]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(autoImagePrefKey);
      if (raw === "1") setAutoImageOnSave(true);
      if (raw === "0") setAutoImageOnSave(false);
    } catch {
      setAutoImageOnSave(false);
    }
  }, [autoImagePrefKey]);

  useEffect(() => {
    try {
      localStorage.setItem(autoImagePrefKey, autoImageOnSave ? "1" : "0");
    } catch {}
  }, [autoImageOnSave, autoImagePrefKey]);

  useEffect(() => {
    if (!isEdit) {
      setFormValues({ ...formValues, codigo: productCode });
    }
  }, [productCode]);

  useEffect(() => {
    if (!isOpenModal || !productSections.fichaComputo) {
      setTechnicalTemplate(null);
      return;
    }

    const loadTechnicalTemplate = async () => {
      try {
        const params = new URLSearchParams();
        if (formValues?.categoriaId) params.set("categoriaId", String(formValues.categoriaId));
        if (formValues?.descripcion) params.set("descripcion", String(formValues.descripcion));
        if ((formValues as any)?.atributosTecnicos?.tipoProducto) {
          params.set("tipoProducto", String((formValues as any).atributosTecnicos.tipoProducto));
        }
        const { data } = await apiClient.get(`/productos/ficha-tecnica/plantilla?${params.toString()}`);
        setTechnicalTemplate(data?.data || data || null);
      } catch {
        setTechnicalTemplate(null);
      }
    };

    loadTechnicalTemplate();
  }, [isOpenModal, productSections.fichaComputo, formValues?.categoriaId, formValues?.descripcion, (formValues as any)?.atributosTecnicos?.tipoProducto]);

  // --- Form Handlers ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormValues({ ...formValues, [name]: value });
  };

  const handlePrecioUnitarioBlur = () => {
    const price = Number(formValues?.precioUnitario);
    const isValid = Number.isFinite(price) && price > 0;
    setErrors({
      ...errors,
      precioUnitario: isValid ? "" : "El precio de venta es obligatorio",
    });
  };

  const handleChangeSelect = (idValue: any, value: any, name: any, id: any) => {
    setFormValues({ ...formValues, [name]: value, [id]: idValue });
  };

  const validateForm = () => {
    const esServicio = String((formValues as any)?.atributosTecnicos?.tipoProducto || '').toUpperCase() === 'SERVICIO';
    const newErrors: any = {
      descripcion:
        formValues?.descripcion && formValues?.descripcion.trim() !== ""
          ? ""
          : "El código del producto es obligatorio",
      precioUnitario:
        formValues?.precioUnitario && Number(formValues?.precioUnitario) > 0
          ? ""
          : "El producto debe tener un precio",
      stock: !esServicio && !isEdit
        ? formValues?.stock && Number(formValues?.stock) > 0
          ? ""
          : "El producto debe tener un stock"
        : "",
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const validarPorcentajesStock = () => {
    const porcentajeVenta = Number(formValues?.porcentajeVenta ?? 100);
    const porcentajeProvision = Number(formValues?.porcentajeProvision ?? 0);

    if (
      !Number.isFinite(porcentajeVenta) ||
      !Number.isFinite(porcentajeProvision) ||
      porcentajeVenta < 0 ||
      porcentajeVenta > 100 ||
      porcentajeProvision < 0 ||
      porcentajeProvision > 100
    ) {
      useAlertStore
        .getState()
        .alert("Los porcentajes deben estar entre 0 y 100.", "warning");
      return false;
    }

    if (porcentajeVenta + porcentajeProvision !== 100) {
      useAlertStore
        .getState()
        .alert(
          "La suma de % Venta y % Provisión debe ser exactamente 100.",
          "warning",
        );
      return false;
    }

    const stockBase = Number((formValues as any)?.stock ?? 0);
    const reservadoReal = Number((formValues as any)?.stockReservado ?? 0);
    const cupoProvision = Math.floor((stockBase * porcentajeProvision) / 100);

    if (isEdit && reservadoReal > cupoProvision && porcentajeProvision > 0) {
      // En edición solo advertir, no bloquear — el usuario puede estar editando precio/descripción sin tocar porcentajes
      useAlertStore
        .getState()
        .alert(
          `Aviso: reservas activas (${reservadoReal}) superan el cupo de provisión (${cupoProvision}). Considera ajustar reservas o porcentajes.`,
          "info",
        );
    }

    return true;
  };

  // --- Business Logic Functions ---
  const cargarGruposAsignados = async (productoId: number) => {
    try {
      const res = await apiClient.get(`/modificadores/productos/${productoId}`);
      const grupos = res?.data?.data || res?.data || [];
      const nonWholesaleGroups = grupos.filter((g: any) => {
        const nombre = g.grupoNombre || g.grupo?.nombre || "";
        return (
          !nombre.startsWith("Precios:") && nombre !== "Precios por Cantidad"
        );
      });
      setGruposSeleccionados(nonWholesaleGroups.map((g: any) => g.grupoId));
    } catch (error) {
      console.error("Error al cargar grupos asignados:", error);
    }
  };

  const toggleGrupoSeleccionado = (grupoId: number) => {
    setGruposSeleccionados((prev) =>
      prev.includes(grupoId)
        ? prev.filter((id) => id !== grupoId)
        : [...prev, grupoId],
    );
  };

  const handleAddWholesaleOption = () => {
    if (!newWholesaleOption.cantidadMinima || !newWholesaleOption.precio)
      return;
    const current: IWholesaleOption[] = formValues.preciosMayorista || [];
    setFormValues({
      ...formValues,
      preciosMayorista: [
        ...current,
        {
          cantidadMinima: Number(newWholesaleOption.cantidadMinima),
          precio: Number(newWholesaleOption.precio),
        },
      ],
    });
    setNewWholesaleOption({ cantidadMinima: "", precio: "" });
  };

  const handleRemoveWholesaleOption = (idx: number) => {
    const current: IWholesaleOption[] = formValues.preciosMayorista || [];
    setFormValues({
      ...formValues,
      preciosMayorista: current.filter((_, i) => i !== idx),
    });
  };

  // --- AI Features ---
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const handleAutoCategorize = async () => {
    if (!formValues.descripcion) {
      useAlertStore
        .getState()
        .alert("Ingresa el nombre del producto primero", "warning");
      return;
    }
    setIsCategorizing(true);
    try {
      const response = await apiClient.post("/productos/ia/categorizar", {
        nombre: formValues.descripcion,
      });
      const result = response.data?.data || response.data;
      if (result?.success && result?.data) {
        const aiData = result.data;
        const updates: any = {};

        if (aiData.categoria) {
          const cat = categories.find(
            (c: any) =>
              c.nombre.toUpperCase() === aiData.categoria.toUpperCase(),
          );
          if (cat) {
            updates.categoriaId = cat.id;
            updates.categoriaNombre = cat.nombre;
          }
        }

        if (aiData.marca) {
          const brand = brands.find(
            (b: any) => b.nombre.toUpperCase() === aiData.marca.toUpperCase(),
          );
          if (brand) {
            updates.marcaId = brand.id;
            updates.marcaNombre = brand.nombre;
          }
        }

        if (Object.keys(updates).length > 0) {
          setFormValues({ ...formValues, ...updates });
          useAlertStore
            .getState()
            .alert("Categorizado automáticamente", "success");
        } else {
          useAlertStore
            .getState()
            .alert("No se encontraron coincidencias", "info");
        }
      } else {
        useAlertStore.getState().alert("No se pudo categorizar", "info");
      }
    } catch (error) {
      useAlertStore.getState().alert("Error al categorizar con IA", "error");
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleAutoImage = async () => {
    const query = formValues.descripcion;
    if (!query) {
      useAlertStore
        .getState()
        .alert("Ingresa el nombre del producto para buscar imagen", "warning");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const response = await apiClient.post("/productos/ia/generar-imagen", {
        nombre: query,
        marca: (formValues as any)?.marcaNombre || "",
        categoria: (formValues as any)?.categoriaNombre || "",
      });
      const result = response.data?.data || response.data;
      const candidates = Array.isArray(result?.candidates)
        ? result.candidates.filter(
            (url: unknown): url is string =>
              typeof url === "string" && /^https?:\/\//i.test(url),
          )
        : [];
      setImageCandidates(candidates);
      if (result?.success && result?.url) {
        setPreviewPrincipal(result.url);
        setFormValues((prev: any) => ({
          ...prev,
          imagenUrl: result.url,
          imagenUrlDisplay: result.url,
        }));
        useAlertStore.getState().alert("Imagen encontrada", "success");
      } else if (candidates.length > 0) {
        useAlertStore
          .getState()
          .alert(
            "No hubo coincidencia exacta. Elige una opción sugerida.",
            "info",
          );
      } else {
        useAlertStore
          .getState()
          .alert(
            result?.message ||
              'No encontré una imagen suficientemente relacionada. Usa una descripción más específica (ej: "Laptop HP 14 Intel i5") o sube una manualmente.',
            "info",
          );
      }
    } catch (e) {
      useAlertStore.getState().alert("Error al buscar imagen", "error");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const buscarImagenAutomaticaParaGuardado = async (
    nombre: string,
  ): Promise<string | null> => {
    const query = String(nombre || "").trim();
    if (!query) return null;
    try {
      const response = await apiClient.post("/productos/ia/generar-imagen", {
        nombre: query,
        marca: (formValues as any)?.marcaNombre || "",
        categoria: (formValues as any)?.categoriaNombre || "",
      });
      const result = response.data?.data || response.data;
      if (result?.success && result?.url) {
        return String(result.url);
      }
      if (Array.isArray(result?.candidates) && result.candidates.length > 0) {
        const first = result.candidates.find(
          (url: unknown) =>
            typeof url === "string" && /^https?:\/\//i.test(url),
        );
        if (first) return String(first);
      }
    } catch {
      // silencioso: no interrumpir guardado
    }
    return null;
  };

  const aprobarImagenReferencia = async (url: string, notify = false) => {
    const imageUrl = String(url || "").trim();
    if (!/^https?:\/\//i.test(imageUrl)) return;
    try {
      const parsed = new URL(imageUrl);
      const isSignedS3 =
        parsed.searchParams.has("X-Amz-Algorithm") ||
        parsed.searchParams.has("X-Amz-Signature") ||
        parsed.searchParams.has("X-Amz-Credential");
      if (isSignedS3) return;
    } catch {
      return;
    }
    const nombre = String(formValues?.descripcion || "").trim();
    if (!nombre) return;
    try {
      await apiClient.post("/productos/ia/aprobar-imagen", {
        nombre,
        marca: (formValues as any)?.marcaNombre || "",
        categoria: (formValues as any)?.categoriaNombre || "",
        url: imageUrl,
      });
      if (notify) {
        useAlertStore
          .getState()
          .alert("Imagen aprendida para próximas búsquedas", "success");
      }
    } catch {
      // silencioso para no bloquear flujo principal
    }
  };

  const resolveColorOptionName = () => {
    const opciones = Array.isArray((formValues as any)?.opcionesAtributos)
      ? (formValues as any).opcionesAtributos
      : [];
    const colorOption = opciones.find((option: any) =>
      String(option?.nombre || "").toLowerCase().includes("color"),
    );
    return colorOption?.nombre || opciones[0]?.nombre || "Color";
  };

  const uploadVariantColorImages = async (variantes: any[] = []) => {
    const entries = Object.entries(variantImageFiles);
    const parentId = Number(formValues.productoId);
    if (entries.length === 0 || variantes.length === 0 || !parentId) return variantes;

    const colorOptionName = resolveColorOptionName();
    const updatedById = new Map<number, any>(
      variantes.map((variant) => [Number(variant.id), variant]),
    );

    // Una sola subida por color: el backend aplica la MISMA url a todas las tallas
    for (const [colorValue, file] of entries) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("color", colorValue);
      const resp = await apiClient.post(`/productos/${parentId}/imagen-color`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const signed = resp?.data?.signedUrl || resp?.data?.data?.signedUrl;
      const nuevaUrl =
        resp?.data?.data?.url ||
        resp?.data?.url ||
        resp?.data?.data?.imagenUrl ||
        resp?.data?.imagenUrl ||
        null;
      if (!nuevaUrl) continue;

      // Reflejar la misma url en todas las variantes de ese color localmente
      variantes
        .filter(
          (variant) =>
            String(variant?.valoresAtributos?.[colorOptionName] || "") === colorValue,
        )
        .forEach((variant) => {
          if (!variant?.id) return;
          updatedById.set(Number(variant.id), {
            ...variant,
            imagenUrl: nuevaUrl,
            imagenUrlDisplay: signed || nuevaUrl,
          });
        });
    }

    return Array.from(updatedById.values());
  };

  const persistExternalProductImage = (productoId: number, externalUrl: string) => {
    if (!productoId || !externalUrl || externalUrl.includes("amazonaws.com")) return;

    void apiClient
      .post(`/productos/${productoId}/imagen-url`, { url: externalUrl })
      .then((resp) => {
        const signed = resp?.data?.signedUrl || resp?.data?.data?.signedUrl;
        const s3Url =
          resp?.data?.data?.url ||
          resp?.data?.url ||
          resp?.data?.data?.imagenUrl ||
          resp?.data?.imagenUrl ||
          null;

        if (!s3Url) return;
        const displayUrl = signed || s3Url;
        setProductImage(productoId, s3Url, displayUrl);
        upsertProductLocal({
          id: productoId,
          imagenUrl: s3Url,
          imagenUrlDisplay: displayUrl,
        } as any);
      })
      .catch(() => {
        // La URL externa ya quedó visible; la copia a S3 se reintentará en otra edición.
      });
  };

  // --- Main Submit handler ---
  const handleSubmitProduct = async () => {
    if (!validateForm()) return;
    if (!validarPorcentajesStock()) return;
    setLoading(true);

    try {
      let stockFinal = Number(formValues?.stock);
      if (isEdit && tipoAjusteStock !== "ninguno") {
        switch (tipoAjusteStock) {
          case "reemplazar":
            stockFinal = cantidadAjuste;
            break;
          case "sumar":
            stockFinal = stockOriginal + cantidadAjuste;
            break;
          case "restar":
            stockFinal = Math.max(0, stockOriginal - cantidadAjuste);
            break;
          default:
            stockFinal = stockOriginal;
        }
      }

      if (Number(formValues?.productoId) !== 0 && isEdit) {
        // EDIT MODE
        const hasRemovedImage =
          !filePrincipal && !previewPrincipal && formValues.imagenUrl === null;
        const currentImageUrl =
          typeof formValues.imagenUrl === "string" && formValues.imagenUrl.trim()
            ? formValues.imagenUrl
            : undefined;
        const originalImageUrl = originalImageUrlRef.current?.trim() || undefined;
        const imagePatch = hasRemovedImage
          ? { imagenUrl: null, removerImagen: true }
          : {};
        const stockPayload =
          tipoAjusteStock !== "ninguno"
            ? stockFinal
            : Number(formValues?.stock ?? 0);
        const fechaInicioOfertaPayload = formValues.fechaInicioOferta || null;
        const fechaFinOfertaPayload = formValues.fechaFinOferta || null;
        let updatedProduct = await editProduct({
          ...formValues,
          unidadMedidaId: Number(formValues?.unidadMedidaId),
          categoriaId:
            formValues?.categoriaId === ""
              ? null
              : Number(formValues?.categoriaId),
          precioUnitario: Number(formValues?.precioUnitario),
          costoUnitario: formValues?.costoUnitario
            ? Number(formValues?.costoUnitario)
            : undefined,
          costoFijo:
            (formValues as any)?.costoFijo != null
              ? Number((formValues as any).costoFijo)
              : undefined,
          comisionPorVenta:
            (formValues as any)?.comisionPorVenta != null
              ? Number((formValues as any).comisionPorVenta)
              : undefined,
          comisionPorcentaje:
            (formValues as any)?.comisionPorcentaje != null
              ? Number((formValues as any).comisionPorcentaje)
              : undefined,
          stock: stockPayload,
          stockMinimo:
            formValues?.stockMinimo != null
              ? Number(formValues?.stockMinimo)
              : undefined,
          stockMaximo:
            formValues?.stockMaximo != null
              ? Number(formValues?.stockMaximo)
              : undefined,
          porcentajeVenta:
            formValues?.porcentajeVenta != null
              ? Number(formValues?.porcentajeVenta)
              : undefined,
          porcentajeProvision:
            formValues?.porcentajeProvision != null
              ? Number(formValues?.porcentajeProvision)
              : undefined,
          preciosMayorista: Array.isArray(formValues?.preciosMayorista)
            ? formValues.preciosMayorista.map((p) => ({
                cantidadMinima: Number(p.cantidadMinima),
                precio: Number(p.precio),
              }))
            : [],
          precioOferta: formValues.precioOferta
            ? Number(formValues.precioOferta)
            : null,
          fechaInicioOferta: fechaInicioOfertaPayload,
          fechaFinOferta: fechaFinOfertaPayload,
          ...imagePatch,
        });

        if (!updatedProduct) {
          setLoading(false);
          return;
        }

        try {
          const allGroups = gruposSeleccionados.map((id, idx) => ({
            grupoId: id,
            ordenOverride: idx,
          }));
          await apiClient.post(
            `/modificadores/productos/${formValues.productoId}`,
            { grupos: allGroups },
          );
        } catch (e) {
          console.error("Error al asignar modificadores:", e);
        }

        const displayImageUrl =
          typeof (formValues as any)?.imagenUrlDisplay === "string" &&
          (formValues as any).imagenUrlDisplay.trim()
            ? (formValues as any).imagenUrlDisplay.trim()
            : undefined;
        const previewImageUrl =
          typeof previewPrincipal === "string" && previewPrincipal.trim()
            ? previewPrincipal.trim()
            : undefined;
        const previewIsCurrentDisplay = Boolean(
          previewImageUrl &&
            displayImageUrl &&
            previewImageUrl === displayImageUrl &&
            currentImageUrl === originalImageUrl,
        );
        const selectedImageUrl =
          previewImageUrl && !previewIsCurrentDisplay
            ? previewImageUrl
            : currentImageUrl;
        const hasSelectedDifferentImage = Boolean(
          selectedImageUrl && selectedImageUrl !== originalImageUrl,
        );

        let imagenUrlFinal: string | null | undefined = hasRemovedImage
          ? null
          : selectedImageUrl || updatedProduct?.imagenUrl || originalImageUrl || undefined;
        let imagenUrlDisplayFinal: string | null | undefined = hasRemovedImage
          ? null
          : hasSelectedDifferentImage
            ? selectedImageUrl
            : (formValues as any)?.imagenUrlDisplay || selectedImageUrl || imagenUrlFinal;
        let externalImageToPersist: string | null = null;

        try {
          // Upload Image flow
          if (filePrincipal) {
            const fd = new FormData();
            fd.append("file", filePrincipal);
            const resp = await apiClient.post(
              `/productos/${formValues.productoId}/imagen`,
              fd,
              { headers: { "Content-Type": "multipart/form-data" } },
            );
            const signed = resp?.data?.signedUrl || resp?.data?.data?.signedUrl;
            const nuevaUrl =
              resp?.data?.data?.url ||
              resp?.data?.url ||
              resp?.data?.data?.imagenUrl ||
              resp?.data?.imagenUrl ||
              null;
            if (nuevaUrl) {
              setProductImage(Number(formValues.productoId), nuevaUrl, signed || nuevaUrl);
              imagenUrlFinal = nuevaUrl;
              imagenUrlDisplayFinal = signed || nuevaUrl;
            }
          } else if (!hasRemovedImage) {
            const externalUrl = selectedImageUrl;
            const changedExternalUrl = Boolean(
              externalUrl &&
                externalUrl !== originalImageUrl,
            );
            if (changedExternalUrl && externalUrl && !externalUrl.includes("amazonaws.com")) {
              externalImageToPersist = externalUrl;
              imagenUrlFinal = externalUrl;
              imagenUrlDisplayFinal = externalUrl;
            }
          }
        } catch (e) {
          if (!hasRemovedImage && selectedImageUrl) {
            imagenUrlFinal = selectedImageUrl;
            imagenUrlDisplayFinal = selectedImageUrl;
          }
        }

        const imagenFinalAprobada = imagenUrlFinal || previewPrincipal || null;
        if (imagenFinalAprobada) {
          void aprobarImagenReferencia(imagenFinalAprobada);
        }

        try {
          const variantesActualizadas = await uploadVariantColorImages(
            (updatedProduct as any)?.variantes || [],
          );
          if (variantesActualizadas.length > 0) {
            updatedProduct = {
              ...(updatedProduct || {}),
              variantes: variantesActualizadas,
            };
          }
        } catch {
          useAlertStore
            .getState()
            .alert(
              "Producto guardado, pero no se pudieron subir algunas imágenes de variantes",
              "warning",
            );
        }

        upsertProductLocal({
          ...(updatedProduct || {}),
          id: Number(formValues.productoId),
          descripcion: formValues.descripcion,
          codigo: formValues.codigo,
          precioUnitario: Number(formValues.precioUnitario),
          costoUnitario: Number(formValues.costoUnitario || 0),
          costoFijo: Number((formValues as any).costoFijo || 0),
          comisionPorVenta: Number((formValues as any).comisionPorVenta || 0),
          comisionPorcentaje: Number((formValues as any).comisionPorcentaje || 0),
          atributosTecnicos: (formValues as any)?.atributosTecnicos ?? (updatedProduct as any)?.atributosTecnicos,
          stock:
            tipoAjusteStock !== "ninguno"
              ? Number(stockFinal)
              : Number(formValues?.stock ?? 0),
          stockBase:
            tipoAjusteStock !== "ninguno"
              ? Number(stockFinal)
              : Number(formValues?.stock ?? 0),
          porcentajeVenta: Number(formValues?.porcentajeVenta ?? 100),
          porcentajeProvision: Number(formValues?.porcentajeProvision ?? 0),
          localizacion: formValues?.localizacion || "",
          preciosMayorista: Array.isArray(formValues?.preciosMayorista)
            ? formValues.preciosMayorista.map((p) => ({
                cantidadMinima: Number(p.cantidadMinima),
                precio: Number(p.precio),
              }))
            : [],
          unidadMedida: {
            ...(updatedProduct?.unidadMedida || {}),
            nombre: formValues.unidadMedidaNombre || updatedProduct?.unidadMedida?.nombre,
          },
          categoria: {
            ...(updatedProduct?.categoria || {}),
            nombre: formValues.categoriaNombre || updatedProduct?.categoria?.nombre,
          },
          marca: formValues.marcaId
            ? {
                id: Number(formValues.marcaId),
                nombre: formValues.marcaNombre || "",
              }
            : undefined,
          imagenUrl: hasRemovedImage
            ? null
            : imagenUrlFinal ?? currentImageUrl ?? updatedProduct?.imagenUrl ?? undefined,
          imagenUrlDisplay: hasRemovedImage
            ? null
            : imagenUrlDisplayFinal ?? imagenUrlFinal ?? currentImageUrl ?? updatedProduct?.imagenUrl ?? undefined,
          variantes: (updatedProduct as any)?.variantes || (formValues as any)?.variantes || [],
          precioOferta: formValues.precioOferta ? Number(formValues.precioOferta) : undefined,
          fechaInicioOferta: formValues.fechaInicioOferta || undefined,
          fechaFinOferta: formValues.fechaFinOferta || undefined,
        });

        if (externalImageToPersist) {
          persistExternalProductImage(
            Number(formValues.productoId),
            externalImageToPersist,
          );
        }

        setFilePrincipal(null);
        setPreviewPrincipal(null);
        setVariantImageFiles({});
        setVariantImagePreviews({});
        setFormValues(initialForm);
        closeModal();
      } else {
        // CREATE MODE
        let imageToSave = formValues.imagenUrl || undefined;
        if (!imageToSave && autoImageOnSave && formValues.descripcion) {
          const autoUrl = await buscarImagenAutomaticaParaGuardado(
            formValues.descripcion,
          );
          if (autoUrl) {
            imageToSave = autoUrl;
            setPreviewPrincipal(autoUrl);
            setFormValues((prev: any) => ({
              ...prev,
              imagenUrl: autoUrl,
              imagenUrlDisplay: autoUrl,
            }));
          }
        }
        const product = await addProduct(
          {
            ...formValues,
            unidadMedidaId: Number(formValues?.unidadMedidaId),
            categoriaId:
              formValues?.categoriaId === ""
                ? null
                : Number(formValues?.categoriaId),
            precioUnitario: Number(formValues?.precioUnitario),
            costoUnitario: formValues?.costoUnitario
              ? Number(formValues?.costoUnitario)
              : undefined,
            costoFijo:
              (formValues as any)?.costoFijo != null
                ? Number((formValues as any).costoFijo)
                : undefined,
            comisionPorVenta:
              (formValues as any)?.comisionPorVenta != null
                ? Number((formValues as any).comisionPorVenta)
                : undefined,
            comisionPorcentaje:
              (formValues as any)?.comisionPorcentaje != null
                ? Number((formValues as any).comisionPorcentaje)
                : undefined,
            stock:
              isFarmacia && features.gestionLotes && creationLote.lote
                ? 0
                : Number(formValues.stock),
            stockMinimo:
              formValues?.stockMinimo != null
                ? Number(formValues?.stockMinimo)
                : undefined,
            stockMaximo:
              formValues?.stockMaximo != null
                ? Number(formValues?.stockMaximo)
                : undefined,
            porcentajeVenta:
              formValues?.porcentajeVenta != null
                ? Number(formValues?.porcentajeVenta)
                : undefined,
            porcentajeProvision:
              formValues?.porcentajeProvision != null
                ? Number(formValues?.porcentajeProvision)
                : undefined,
            estado: "ACTIVO",
            imagenUrl: imageToSave,
          },
          { skipStore: true },
        );

        setFormValues(initialForm);
        if (isInvoice) setSelectProduct(product.data);

        try {
          const newId = product?.data?.id;
          let urlFinal: string | null = null;
          let urlFinalDisplay: string | null = null;

          if (newId && filePrincipal) {
            const fd = new FormData();
            fd.append("file", filePrincipal);
            const resp2 = await apiClient.post(
              `/productos/${newId}/imagen`,
              fd,
              { headers: { "Content-Type": "multipart/form-data" } },
            );
            const signed =
              resp2?.data?.signedUrl || resp2?.data?.data?.signedUrl;
            urlFinal =
              resp2?.data?.data?.url ||
              resp2?.data?.url ||
              resp2?.data?.data?.imagenUrl ||
              resp2?.data?.imagenUrl ||
              null;
            urlFinalDisplay = signed || urlFinal;
          } else if (newId && imageToSave) {
            try {
              const resp3 = await apiClient.post(
                `/productos/${newId}/imagen-url`,
                { url: imageToSave },
              );
              const signed =
                resp3?.data?.signedUrl || resp3?.data?.data?.signedUrl;
              const s3Url =
                resp3?.data?.data?.url || resp3?.data?.url || null;
              if (s3Url) {
                urlFinal = s3Url;
                urlFinalDisplay = signed || s3Url;
              }
            } catch (imgError) {}
          }

          if (
            isFarmacia &&
            features.gestionLotes &&
            creationLote.lote &&
            creationLote.fechaVencimiento
          ) {
            try {
              await apiClient.post("/productos/lotes", {
                productoId: Number(newId),
                lote: creationLote.lote,
                fechaVencimiento: creationLote.fechaVencimiento,
                stockInicial: Number(formValues.stock),
                stockActual: Number(formValues.stock),
                costoUnitario: formValues.costoUnitario
                  ? Number(formValues.costoUnitario)
                  : undefined,
              });
              useAlertStore
                .getState()
                .alert("Lote inicial registrado", "success");
            } catch (lotError) {
              useAlertStore
                .getState()
                .alert(
                  "Producto creado pero error al registrar lote",
                  "warning",
                );
            }
          }

          let variantesFinales = product?.data?.variantes || [];
          try {
            variantesFinales = await uploadVariantColorImages(variantesFinales);
            if (product?.data && variantesFinales.length > 0) {
              product.data.variantes = variantesFinales;
            }
          } catch {
            useAlertStore
              .getState()
              .alert(
                "Producto creado, pero no se pudieron subir algunas imágenes de variantes",
                "warning",
              );
          }

          if (newId) upsertProductLocal({
            ...(product?.data || {}),
            id: Number(newId),
            descripcion: formValues.descripcion,
            codigo: product?.data?.codigo || formValues.codigo,
            categoriaId:
              formValues.categoriaId === "" || formValues.categoriaId == null
                ? undefined
                : Number(formValues.categoriaId),
            unidadMedidaId: Number(formValues.unidadMedidaId),
            precioUnitario: String(formValues.precioUnitario),
            costoUnitario: Number(formValues.costoUnitario || 0),
            costoFijo: Number((formValues as any).costoFijo || 0),
            comisionPorVenta: Number((formValues as any).comisionPorVenta || 0),
            comisionPorcentaje: Number((formValues as any).comisionPorcentaje || 0),
            stock: Number(formValues.stock),
            stockBase: Number(formValues.stock),
            stockMinimo: Number(formValues.stockMinimo || 0),
            stockMaximo: Number(formValues.stockMaximo || 0),
            porcentajeVenta: Number(formValues.porcentajeVenta ?? 100),
            porcentajeProvision: Number(formValues.porcentajeProvision ?? 0),
            localizacion: formValues.localizacion || "",
            preciosMayorista: Array.isArray(formValues.preciosMayorista)
              ? formValues.preciosMayorista.map((precio) => ({
                  cantidadMinima: Number(precio.cantidadMinima),
                  precio: Number(precio.precio),
                }))
              : [],
            unidadMedida: {
              ...(product?.data?.unidadMedida || {}),
              id: Number(formValues.unidadMedidaId),
              nombre: formValues.unidadMedidaNombre,
            },
            categoria: {
              ...(product?.data?.categoria || {}),
              id: Number(formValues.categoriaId || 0),
              nombre: formValues.categoriaNombre,
            },
            marca: formValues.marcaId
              ? {
                  ...(product?.data?.marca || {}),
                  id: Number(formValues.marcaId),
                  nombre: formValues.marcaNombre || "",
                }
              : undefined,
            imagenUrl: urlFinal || imageToSave || product?.data?.imagenUrl || undefined,
            imagenUrlDisplay: urlFinalDisplay || urlFinal || imageToSave || product?.data?.imagenUrlDisplay || product?.data?.imagenUrl || undefined,
            variantes: variantesFinales,
            estado: "ACTIVO",
          });

          const imagenFinalAprobada =
            imageToSave || urlFinal || previewPrincipal || null;
          if (imagenFinalAprobada) {
            void aprobarImagenReferencia(imagenFinalAprobada);
          }
        } catch (e) {}

        if (product?.data?.id && gruposSeleccionados.length > 0) {
          try {
            const allGroups = gruposSeleccionados.map((id, idx) => ({
              grupoId: id,
              ordenOverride: idx,
            }));
            await apiClient.post(
              `/modificadores/productos/${product.data.id}`,
              { grupos: allGroups },
            );
          } catch (e) {}
        }

        setFilePrincipal(null);
        setPreviewPrincipal(null);
        setVariantImageFiles({});
        setVariantImagePreviews({});
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
    esDrogueria,
    esFarmaceutico,
    isFabricacion,
    isModaRubro,
    features,
    productSections,
    labels,
    tieneGestionProvisiones,
    tieneTienda,
    tieneGestionLotes,
    technicalTemplate,
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
    variantImageFiles,
    variantImagePreviews,
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
    setVariantImageFiles,
    setVariantImagePreviews,
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
    aprobarImagenReferencia,
    toggleGrupoSeleccionado,
    handleRemoveWholesaleOption,
    handleAddWholesaleOption,
    handleSubmitProduct,
    closeModal,
    barcodeQuery,
    setBarcodeQuery,
    searchingBarcode,
    handleBarcodeGlobalSearch,
    autoImageOnSave,
    setAutoImageOnSave,
    imageCandidates,
    setImageCandidates,
    fillFromDigemid: (data: Partial<Record<string, string>>) => {
      setFormValues({ ...formValues, ...data });
    },
  };
};
