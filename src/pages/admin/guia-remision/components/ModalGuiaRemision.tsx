import { useState, useEffect } from "react";
import { format } from "date-fns";
import moment from "moment";
import { Icon } from "@iconify/react";
import Modal from "@/components/Modal";
import InputPro from "@/components/InputPro";
import { Calendar } from "@/components/Date";


import Select from "@/components/Select";
import Button from "@/components/Button";
import SelectUbigeo from "@/components/Select/SelectUbigeo";
import TrasladoTypeSelect from "@/components/Select/TrasladoTypeSelect";
import DataTable from "@/components/Datatable";
import { useGuiaRemisionStore, IGuiaRemision, IDetalleGuiaRemision } from "@/zustand/guia-remision";
import { useExtentionsStore } from "@/zustand/extentions";
import { useAuthStore } from "@/zustand/auth";
import { useClientsStore } from "@/zustand/clients";
import { useProductsStore } from "@/zustand/products";
import useAlertStore from "@/zustand/alert";

const MODO_TRANSPORTE_OPTIONS = [
    { id: "01", value: "TRANSPORTE PÚBLICO" },
    { id: "02", value: "TRANSPORTE PRIVADO" },
];

const UNIDAD_PESO_OPTIONS = [
    { id: "KGM", value: "KILOGRAMOS" },
    { id: "TNE", value: "TONELADAS" },
];

const TIPO_DOC_OPTIONS = [
    { id: "6", value: "RUC" },
    { id: "1", value: "DNI" },
    { id: "4", value: "CARNET EXTRANJERÍA" },
    { id: "7", value: "PASAPORTE" },
];

interface ModalGuiaRemisionProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    guiaToEdit?: any;
}

const TIPO_GUIA_OPTIONS = [
    { id: "REMITENTE", value: "GUÍA DE REMISIÓN REMITENTE" },
    { id: "TRANSPORTISTA", value: "GUÍA DE REMISIÓN TRANSPORTISTA" },
];

const MOTIVO_HELP: Record<string, { title: string; description: string; tip: string }> = {
    "01": {
        title: "Venta",
        description: "Usa este motivo cuando entregas bienes por una venta realizada.",
        tip: "Verifica que el destinatario y la dirección de llegada correspondan al cliente receptor.",
    },
    "02": {
        title: "Compra",
        description: "Usa este motivo cuando trasladas bienes comprados a un proveedor.",
        tip: "Registra al proveedor en destinatario y recuerda que SUNAT considera destinatario final a tu empresa.",
    },
    "04": {
        title: "Traslado entre establecimientos",
        description: "Usa este motivo para mover stock entre sedes de la misma empresa.",
        tip: "Completa códigos de establecimiento en partida y llegada para evitar observaciones.",
    },
    "13": {
        title: "Otros",
        description: "Usa este motivo cuando no aplica una causal específica del catálogo.",
        tip: "Detalla claramente la razón del traslado en observaciones.",
    },
};

const MODO_HELP: Record<string, { title: string; required: string[]; tip: string }> = {
    "01": {
        title: "Transporte público",
        required: ["RUC transportista", "Razón social transportista"],
        tip: "Si la guía es tipo TRANSPORTISTA también debes registrar el número MTC.",
    },
    "02": {
        title: "Transporte privado",
        required: ["Placa de vehículo", "Documento del conductor"],
        tip: "Completa también nombre y licencia del conductor para reducir rechazos.",
    },
};

const ModalGuiaRemision = ({ isOpen, onClose, onSuccess, guiaToEdit }: ModalGuiaRemisionProps) => {
    const { auth } = useAuthStore();
    const { createGuiaRemision, updateGuiaRemision, getSiguienteCorrelativo, siguienteCorrelativo } = useGuiaRemisionStore();
    const { getUbigeos, ubigeos } = useExtentionsStore();
    const { getClientFromDoc } = useClientsStore();
    const { getAllProducts, products, resetProducts } = useProductsStore();

    const [productOptions, setProductOptions] = useState<any[]>([]);

    const [formValues, setFormValues] = useState<IGuiaRemision>({
        tipoGuia: "REMITENTE",
        serie: "T001",
        correlativo: 0,
        fechaEmision: format(new Date(), "yyyy-MM-dd"),
        horaEmision: format(new Date(), "HH:mm:ss"),
        tipoDocumento: "09",
        remitenteRuc: auth?.empresa?.ruc || "",
        remitenteRazonSocial: auth?.empresa?.razonSocial || "",
        remitenteDireccion: auth?.empresa?.direccion || "",
        destinatarioTipoDoc: "6",
        destinatarioNumDoc: "",
        destinatarioRazonSocial: "",
        tipoTraslado: "01",
        modoTransporte: "02",
        pesoTotal: 0,
        unidadPeso: "KGM",
        partidaUbigeo: auth?.empresa?.ubicacion?.codigo || "",
        partidaDireccion: auth?.empresa?.direccion || "",
        partidaCodigoEstablecimiento: "0000",
        llegadaUbigeo: "",
        llegadaDireccion: "",
        llegadaCodigoEstablecimiento: "0000",
        fechaInicioTraslado: format(new Date(), "yyyy-MM-dd"),
        retornoVehiculoVacio: false,
        retornoEnvasesVacios: false,
        transbordoProgramado: false,
        trasladoTotal: false,
        vehiculoM1oL: false,
        datosTransportista: false,
        detalles: []
    });

    const isGuiaTransportista = formValues.tipoGuia === "TRANSPORTISTA";
    const isCompra = formValues.tipoTraslado === "02";
    const selectedMotivoHelp = MOTIVO_HELP[formValues.tipoTraslado] || {
        title: "Motivo seleccionado",
        description: "Completa los datos del traslado según el motivo elegido.",
        tip: "Revisa destinatario, puntos de partida/llegada y transporte antes de guardar.",
    };
    const selectedModoHelp = MODO_HELP[formValues.modoTransporte] || {
        title: "Modo de transporte",
        required: [],
        tip: "Completa todos los datos del traslado según corresponda.",
    };
    const destinatarioDocHint =
        formValues.destinatarioTipoDoc === "6"
            ? "RUC: 11 dígitos"
            : formValues.destinatarioTipoDoc === "1"
                ? "DNI: 8 dígitos"
                : "Documento válido según tipo seleccionado";

    const [newItem, setNewItem] = useState<Partial<IDetalleGuiaRemision>>({
        cantidad: 1,
        unidadMedida: "NIU"
    });
    const [selectedProductValue, setSelectedProductValue] = useState<string>("");
    const [isEditQtyModalOpen, setIsEditQtyModalOpen] = useState(false);
    const [editingQtyIndex, setEditingQtyIndex] = useState<number | null>(null);
    const [editingQtyValue, setEditingQtyValue] = useState<number>(1);

    // Cargar datos al abrir modal
    useEffect(() => {
        if (isOpen) {
            getUbigeos();
            resetProducts();

            if (guiaToEdit) {
                // Modo Edición
                loadGuiaData(guiaToEdit);
            } else {
                // Modo Creación
                const initialSerie = "T001";
                getSiguienteCorrelativo(initialSerie);

                setFormValues({
                    tipoGuia: "REMITENTE",
                    serie: initialSerie,
                    correlativo: 0,
                    fechaEmision: format(new Date(), "yyyy-MM-dd"),
                    horaEmision: format(new Date(), "HH:mm:ss"),
                    tipoDocumento: "09",
                    remitenteRuc: auth?.empresa?.ruc || "",
                    remitenteRazonSocial: auth?.empresa?.razonSocial || "",
                    remitenteDireccion: auth?.empresa?.direccion || "",
                    destinatarioTipoDoc: "6",
                    destinatarioNumDoc: "",
                    destinatarioRazonSocial: "",
                    tipoTraslado: "01",
                    modoTransporte: "01",
                    pesoTotal: 0,
                    unidadPeso: "KGM",
                    // Transportista
                    transportistaRuc: "",
                    transportistaRazonSocial: "",
                    transportistaMTC: "",
                    // Conductor
                    conductorTipoDoc: "",
                    conductorNumDoc: "",
                    conductorNombre: "",
                    conductorApellidos: "",
                    conductorLicencia: "",
                    vehiculoPlaca: "",
                    vehiculoAutorizacion: "",
                    // Ubicaciones
                    partidaUbigeo: auth?.empresa?.ubigeo || "",
                    partidaDireccion: auth?.empresa?.direccion || "",
                    partidaCodigoEstablecimiento: "0000",
                    llegadaUbigeo: "",
                    llegadaDireccion: "",
                    llegadaCodigoEstablecimiento: "0000",
                    // Fechas
                    fechaInicioTraslado: format(new Date(), "yyyy-MM-dd"),
                    // Indicadores
                    retornoVehiculoVacio: false,
                    retornoEnvasesVacios: false,
                    transbordoProgramado: false,
                    trasladoTotal: false,
                    vehiculoM1oL: false,
                    datosTransportista: false,
                    detalles: []
                });
                setNewItem({
                    cantidad: 1,
                    unidadMedida: "NIU"
                });
                setSelectedProductValue("");
                setIsEditQtyModalOpen(false);
                setEditingQtyIndex(null);
                setEditingQtyValue(1);
            }
        }
    }, [isOpen, guiaToEdit]);

    const loadGuiaData = async (guia: any) => {
        // Obtenemos data fresca del backend para asegurar detalles completos
        const { getGuiaRemision } = useGuiaRemisionStore.getState();
        await getGuiaRemision(guia.id);
        const fullGuiaResponse = useGuiaRemisionStore.getState().guiaRemisionActual || guia;

        // Unwrap data if nested
        const fullGuia = fullGuiaResponse.data || fullGuiaResponse;

        // Mapeo seguro de datos
        setFormValues(prev => ({
            ...prev, // Mantener defaults
            ...fullGuia,
            // Ensure booleans and other specific fields are correctly mapped if they are missing/null in fullGuia
            pesoTotal: Number(fullGuia.pesoTotal) || 0,
            destinatarioTipoDoc: fullGuia.destinatarioTipoDoc || prev.destinatarioTipoDoc,
            destinatarioNumDoc: fullGuia.destinatarioNumDoc || "",
            destinatarioRazonSocial: fullGuia.destinatarioRazonSocial || "",
            // Asegurar fechas con UTC
            fechaEmision: fullGuia.fechaEmision ? moment.utc(fullGuia.fechaEmision).format("YYYY-MM-DD") : prev.fechaEmision,
            fechaInicioTraslado: fullGuia.fechaInicioTraslado ? moment.utc(fullGuia.fechaInicioTraslado).format("YYYY-MM-DD") : prev.fechaInicioTraslado,
            partidaCodigoEstablecimiento: fullGuia.partidaCodigoEstablecimiento || prev.partidaCodigoEstablecimiento || "0000",
            llegadaCodigoEstablecimiento: fullGuia.llegadaCodigoEstablecimiento || prev.llegadaCodigoEstablecimiento || "0000",
            detalles: (fullGuia.detalles || []).map((d: any) => ({
                ...d,
                cantidad: Number(d.cantidad)
            }))
        }));
    };

    useEffect(() => {
        if (siguienteCorrelativo) {
            // Parse correlativo if it's an object
            const correlativoValue = typeof siguienteCorrelativo === 'object'
                ? (siguienteCorrelativo as any).correlativo || 0
                : siguienteCorrelativo;
            setFormValues(prev => ({ ...prev, correlativo: correlativoValue }));
        }
    }, [siguienteCorrelativo]);

    // Update product options when store changes
    useEffect(() => {
        setProductOptions((products || []).map(p => ({
            id: p.id,
            value: `${p.codigo} - ${p.descripcion}`,
            data: p
        })));
    }, [products]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormValues(prev => ({ ...prev, [name]: val }));

        // RENIEC consultation for destinatario
        if (name === "destinatarioNumDoc") {
            const cleanValue = value.trim();
            if (cleanValue.length === 8 || cleanValue.length === 11) {
                handleReniecLookup(cleanValue, 'destinatario');
            }
        }

        // RENIEC consultation for transportista
        if (name === "transportistaRuc") {
            const cleanValue = value.trim();
            if (cleanValue.length === 11) {
                handleReniecLookup(cleanValue, 'transportista');
            }
        }
    };

    const handleReniecLookup = async (doc: string, tipo: 'destinatario' | 'transportista') => {
        const result = await getClientFromDoc(doc);
        if (result) {
            if (tipo === 'destinatario') {
                setFormValues(prev => ({
                    ...prev,
                    destinatarioRazonSocial: result.nombre_completo || result.nombre_o_razon_social || "",
                    llegadaDireccion: isCompra ? prev.llegadaDireccion : (result.direccion || prev.llegadaDireccion),
                    llegadaUbigeo: isCompra ? prev.llegadaUbigeo : (result.ubigeo_sunat || prev.llegadaUbigeo),
                    destinatarioTipoDoc: doc.length === 8 ? "1" : "6"
                }));
            } else {
                setFormValues(prev => ({
                    ...prev,
                    transportistaRazonSocial: result.nombre_completo || result.nombre_o_razon_social || ""
                }));
            }
        }
    };

    const handleSelectChange = (_idValue: any, value: any, name: any, id: any) => {
        if (name === 'partidaUbigeo' || name === 'llegadaUbigeo') {
            setFormValues(prev => ({ ...prev, [name]: _idValue }));
        } else {
            setFormValues(prev => ({ ...prev, [name]: _idValue }));
        }
    };

    const handleTipoGuiaChange = (id: any, value: string) => {
        const tipoGuia = String(id) as "REMITENTE" | "TRANSPORTISTA";
        const nuevaSerie = tipoGuia === "REMITENTE" ? "T001" : "V001";
        setFormValues(prev => ({ 
            ...prev, 
            tipoGuia,
            serie: nuevaSerie,
            tipoDocumento: tipoGuia === "TRANSPORTISTA" ? "31" : "09",
        }));
        // Obtener nuevo correlativo para la nueva serie
        getSiguienteCorrelativo(nuevaSerie);
    };

    const handleDateChange = (value: any, name: string) => {
        // Calendar returns DD/MM/YYYY, convert to yyyy-MM-dd for state
        // Check if value is valid before formatting to avoid invalid date errors
        if (value) {
            const date = moment(value, "DD/MM/YYYY").format("YYYY-MM-DD");
            // Validar que sea una fecha válida antes de setear
            if (date !== "Invalid date") {
                setFormValues(prev => ({ ...prev, [name]: date }));
            }
        }
    };

    const handleProductSearch = (query: string, cb: () => void) => {
        getAllProducts({ search: query, limit: 20 }, cb);
    };

    const handleProductChange = (id: any, value: string) => {
        setSelectedProductValue(value || "");
        const prod = products.find(p => p.id === Number(id));
        if (prod) {
            setNewItem({
                productoId: prod.id,
                codigoProducto: prod.codigo,
                descripcion: prod.descripcion,
                unidadMedida: prod.unidadMedida?.nombre || "NIU",
                cantidad: 1
            });
        }
    };

    const addItem = () => {
        if (!newItem.descripcion || !newItem.cantidad) {
            useAlertStore.getState().alert("Complete los datos del producto", "warning");
            return;
        }

        setFormValues(prev => ({
            ...prev,
            detalles: [...prev.detalles, newItem as IDetalleGuiaRemision]
        }));

        setNewItem({ cantidad: 1, unidadMedida: "NIU" });
        setSelectedProductValue("");
    };

    const updateItemQuantity = (index: number, cantidad: number) => {
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
            useAlertStore.getState().alert("La cantidad debe ser mayor a 0", "warning");
            return;
        }

        setFormValues(prev => ({
            ...prev,
            detalles: prev.detalles.map((detalle, i) =>
                i === index ? { ...detalle, cantidad } : detalle
            )
        }));
    };

    const handleEditCantidad = (row: any) => {
        const index = Number(row.__index);
        if (index < 0 || Number.isNaN(index)) return;
        const currentQty = Number(row.cantidad) || 1;
        setEditingQtyIndex(index);
        setEditingQtyValue(currentQty);
        setIsEditQtyModalOpen(true);
    };

    const handleSaveEditCantidad = () => {
        if (editingQtyIndex === null) return;
        updateItemQuantity(editingQtyIndex, Number(editingQtyValue));
        setIsEditQtyModalOpen(false);
        setEditingQtyIndex(null);
    };

    const removeItem = (index: number) => {
        setFormValues(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
        }));
    };

    const detallesTableData = (formValues.detalles || []).map((item: any, index: number) => ({
        nro: index + 1,
        codigo: item.codigoProducto,
        descripcion: item.descripcion,
        unidad: item.unidadMedida,
        cantidad: item.cantidad,
        __index: index,
    }));

    const detallesTableColumns = [
        { label: '#', key: 'nro' },
        { label: 'Código', key: 'codigo' },
        { label: 'Descripción', key: 'descripcion' },
        { label: 'Unidad', key: 'unidad' },
        { label: 'Cantidad', key: 'cantidad' },
    ];

    const detallesTableActions = [
        {
            tooltip: 'Editar cantidad',
            icon: <Icon icon="solar:pen-bold" className="text-blue-500" />,
            onClick: (row: any) => handleEditCantidad(row),
        },
        {
            tooltip: 'Eliminar',
            icon: <Icon icon="solar:trash-bin-trash-bold" className="text-red-500" />,
            onClick: (row: any) => removeItem(Number(row.__index)),
        },
    ];

    const getUbigeoText = (code: string) => {
        if (!code || !ubigeos) return "";
        const targetCode = String(code).padStart(6, '0');
        const u: any = ubigeos.find((item: any) => String(item.codigo).padStart(6, '0') === targetCode);
        return u ? `${u.departamento}/${u.provincia}/${u.distrito}` : "";
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (formValues.detalles.length === 0) {
            useAlertStore.getState().alert("Debe agregar al menos un ítem", "warning");
            return;
        }

        const destinatarioLabel = isCompra ? "proveedor" : "destinatario";
        if (!formValues.destinatarioNumDoc || !formValues.destinatarioRazonSocial) {
            useAlertStore.getState().alert(`Datos del ${destinatarioLabel} incompletos`, "warning");
            return;
        }

        const docNum = String(formValues.destinatarioNumDoc || "").trim();
        const docTipo = String(formValues.destinatarioTipoDoc || "").trim();
        const expectedLength = docTipo === "6" ? 11 : docTipo === "1" ? 8 : null;
        if (expectedLength && docNum.length !== expectedLength) {
            useAlertStore.getState().alert(`El ${destinatarioLabel} debe tener un documento válido (${docTipo === "6" ? "RUC 11 dígitos" : "DNI 8 dígitos"})`, "warning");
            return;
        }

        if (isCompra && String(formValues.destinatarioTipoDoc) === "6" && String(formValues.destinatarioNumDoc) === String(formValues.remitenteRuc)) {
            useAlertStore.getState().alert("En COMPRA, el RUC del proveedor no puede ser igual al RUC de tu empresa", "warning");
            return;
        }

        // Validaciones específicas según tipo de guía
        if (formValues.tipoGuia === 'TRANSPORTISTA') {
            if (!formValues.transportistaRuc || !formValues.transportistaRazonSocial) {
                useAlertStore.getState().alert("Para GRE-T se requieren RUC y Razón Social del transportista", "warning");
                return;
            }
            if (!formValues.transportistaMTC) {
                useAlertStore.getState().alert("Para GRE-T se requiere Registro MTC del transportista", "warning");
                return;
            }
            if (!formValues.conductorNumDoc || !formValues.conductorNombre || !formValues.conductorApellidos || !formValues.conductorLicencia || !formValues.vehiculoPlaca) {
                useAlertStore.getState().alert("Para GRE-T complete conductor (doc, nombre, apellidos, licencia) y vehículo (placa)", "warning");
                return;
            }

            const licenciaNormalizada = (formValues.conductorLicencia || '').trim().toUpperCase();
            const licenciaRegex = /^[A-Z0-9]{9}$/;
            if (!licenciaRegex.test(licenciaNormalizada)) {
                useAlertStore.getState().alert("La licencia del conductor debe tener exactamente 9 caracteres alfanuméricos.", "warning");
                return;
            }

            const placaNormalizada = (formValues.vehiculoPlaca || '').trim();
            if (placaNormalizada.length < 6) {
                useAlertStore.getState().alert("La placa del vehículo debe tener al menos 6 caracteres.", "warning");
                return;
            }

            const numeroTuc = (formValues.vehiculoAutorizacion || '').trim();
            const tucRegex = /^[A-Za-z0-9]{11,13}$/;
            if (!numeroTuc) {
                useAlertStore.getState().alert("Ingrese el número correlativo de la TUC (11 a 13 caracteres alfanuméricos).", "warning");
                return;
            }

            if (!tucRegex.test(numeroTuc)) {
                useAlertStore.getState().alert("La TUC debe tener entre 11 y 13 caracteres alfanuméricos.", "warning");
                return;
            }
        }

        // Validaciones específicas según modo de transporte
        if (formValues.modoTransporte === "01") {
            if (!formValues.transportistaRuc || !formValues.transportistaRazonSocial) {
                useAlertStore.getState().alert("Datos del transportista público requeridos", "warning");
                return;
            }
        }

        if (formValues.modoTransporte === "02") {
            if (!formValues.conductorNumDoc || !formValues.vehiculoPlaca) {
                useAlertStore.getState().alert("Datos del conductor y vehículo requeridos para transporte privado", "warning");
                return;
            }
        }

        if (!formValues.partidaUbigeo || !formValues.partidaDireccion || !formValues.llegadaUbigeo || !formValues.llegadaDireccion) {
            useAlertStore.getState().alert("Complete los datos de partida y llegada (ubigeo y dirección)", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            // Validation/Default for PesoTotal
            const peso = Number(formValues.pesoTotal);
            const finalPesoTotal = peso > 0 ? peso : 1;

            const placaNormalizada = (formValues.vehiculoPlaca || '').trim().toUpperCase();
            const numeroTucNormalizado = (formValues.vehiculoAutorizacion || '').trim().toUpperCase();
            const licenciaNormalizada = (formValues.conductorLicencia || '').trim().toUpperCase();

            // Sanitize payload before sending
            const payload = {
                ...formValues,
                tipoDocumento: formValues.tipoGuia === 'TRANSPORTISTA' ? '31' : '09',
                correlativo:
                    typeof formValues.correlativo === 'object'
                        ? (formValues.correlativo as any).data || (formValues.correlativo as any).correlativo || 0
                        : Number(formValues.correlativo),
                pesoTotal: finalPesoTotal,
                conductorLicencia: licenciaNormalizada || formValues.conductorLicencia,
                vehiculoPlaca: placaNormalizada || formValues.vehiculoPlaca,
                vehiculoAutorizacion: numeroTucNormalizado || formValues.vehiculoAutorizacion,
            };

            let res;
            if (guiaToEdit?.id) {
                res = await updateGuiaRemision(guiaToEdit.id, payload);
            } else {
                res = await createGuiaRemision(payload);
            }

            if (res.success) {
                onClose();
                onSuccess?.();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Modal
                isOpenModal={isOpen}
                closeModal={onClose}
                title={guiaToEdit ? `Editar Guía ${guiaToEdit.serie}-${guiaToEdit.correlativo}` : "Nueva Guía de Remisión"}
                icon="solar:delivery-bold-duotone"
                width="1200px"
                position="right"
            >
                <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div className="px-4 pb-4 space-y-5">
                        {/* Cabecera */}
                        <div className="p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Datos Generales</h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Completa primero tipo de guía, fechas y luego motivo/modo para que el formulario te indique qué datos son obligatorios.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Tipo de Guía"
                                    options={TIPO_GUIA_OPTIONS}
                                    name="tipoGuia"
                                    id="tipoGuia"
                                    value={TIPO_GUIA_OPTIONS.find(o => o.id === formValues.tipoGuia)?.value || ""}
                                    defaultValue={formValues.tipoGuia}
                                    onChange={handleTipoGuiaChange}
                                    withLabel
                                    error={null}
                                />
                                <InputPro autocomplete="off" label="Serie" name="serie" value={formValues.serie} onChange={handleChange} isLabel disabled={!!guiaToEdit} />
                                {guiaToEdit && (
                                    <InputPro autocomplete="off" label="Correlativo" name="correlativo" value={formValues.correlativo} onChange={() => { }} isLabel disabled />
                                )}
                                <div className="z-20 relative">
                                    <Calendar
                                        text="Fecha Emisión"
                                        name="fechaEmision"
                                        value={formValues.fechaEmision ? moment(formValues.fechaEmision).format("DD/MM/YYYY") : ""}
                                        onChange={handleDateChange}
                                        disabled={false}
                                    />
                                </div>
                                <div className="z-10 relative">
                                    <Calendar
                                        text="Fecha Inicio Traslado"
                                        name="fechaInicioTraslado"
                                        value={formValues.fechaInicioTraslado ? moment(formValues.fechaInicioTraslado).format("DD/MM/YYYY") : ""}
                                        onChange={handleDateChange}
                                        disabled={false}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70">
                            <h3 className="text-sm font-bold text-emerald-900 mb-2 uppercase tracking-wide">¿Quién es quién en la guía?</h3>
                            <ul className="text-xs text-emerald-900 space-y-2 list-disc pl-5">
                                <li><strong>Remitente:</strong> es tu empresa y se llena automáticamente (se usa también para el nombre del archivo SUNAT).</li>
                                <li><strong>Destinatario:</strong> cliente/proveedor que recibe los bienes; completa documento, razón social y direcciones.</li>
                                <li><strong>Transportista:</strong> solo aplica si el traslado lo realiza un tercero o emites una GRE-T; debes registrar RUC, MTC, vehículo y conductor.</li>
                            </ul>
                        </div>

                        {isGuiaTransportista && (
                            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60">
                                <h3 className="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wide">Campos obligatorios solo para Guía Transportista (GRE-T)</h3>
                                <p className="text-xs text-blue-800 mb-3">
                                    Para evitar rechazos, en tipo de guía <strong>TRANSPORTISTA</strong> completa estos bloques además de los datos generales e ítems.
                                </p>
                                <ul className="text-xs text-blue-800 space-y-1 list-disc pl-5">
                                    <li><strong>Datos del transportista:</strong> RUC, razón social y registro MTC.</li>
                                    <li><strong>Vehículos y conductores:</strong> placa, documento del conductor, nombres y licencia.</li>
                                    <li><strong>Recomendado:</strong> apellidos del conductor y TUC/CHV o autorización especial.</li>
                                </ul>
                            </div>
                        )}

                        {/* Datos del Destinatario */}
                        <div className="p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">{isCompra ? "Datos del Proveedor" : "Datos del Destinatario"}</h3>
                            <p className="text-xs text-gray-500 mb-4">
                                {isCompra
                                    ? "En motivo COMPRA, aquí registras al proveedor origen de los bienes."
                                    : "Registra el receptor final de los bienes con documento y razón social válidos."}
                            </p>

                            {isCompra && (
                                <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-900">
                                    <div className="font-semibold">Destinatario (SUNAT)</div>
                                    <div>{auth?.empresa?.razonSocial || formValues.remitenteRazonSocial}</div>
                                    <div>{auth?.empresa?.ruc || formValues.remitenteRuc}</div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select
                                    label={isCompra ? "Tipo Doc. Proveedor" : "Tipo Doc."}
                                    options={TIPO_DOC_OPTIONS}
                                    name="destinatarioTipoDoc"
                                    id="destinatarioTipoDoc"
                                    value={TIPO_DOC_OPTIONS.find(o => o.id === formValues.destinatarioTipoDoc)?.value || ""}
                                    defaultValue={formValues.destinatarioTipoDoc}
                                    onChange={handleSelectChange}
                                    withLabel
                                    error={null}
                                />
                                <InputPro autocomplete="off" label={isCompra ? "RUC/DNI Proveedor" : "Número Documento"} name="destinatarioNumDoc" value={formValues.destinatarioNumDoc} onChange={handleChange} isLabel placeholder={isCompra ? "Ingrese documento del proveedor" : "Ingrese DNI o RUC"} />
                                <InputPro autocomplete="off" label={isCompra ? "Razón Social / Nombre Proveedor" : "Razón Social / Nombre"} name="destinatarioRazonSocial" value={formValues.destinatarioRazonSocial} onChange={handleChange} isLabel />
                            </div>
                            <p className="text-xs text-gray-500 mt-3">Formato recomendado de documento: {destinatarioDocHint}.</p>
                        </div>

                        {/* Datos de Traslado */}
                        <div className="p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Datos del Traslado</h3>
                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                                    <p className="text-xs font-semibold text-blue-800">Motivo: {selectedMotivoHelp.title}</p>
                                    <p className="text-xs text-blue-700 mt-1">{selectedMotivoHelp.description}</p>
                                    <p className="text-xs text-blue-700 mt-1">Tip: {selectedMotivoHelp.tip}</p>
                                </div>
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                                    <p className="text-xs font-semibold text-emerald-800">Modo: {selectedModoHelp.title}</p>
                                    {selectedModoHelp.required.length > 0 && (
                                        <p className="text-xs text-emerald-700 mt-1">Campos clave: {selectedModoHelp.required.join(", ")}.</p>
                                    )}
                                    <p className="text-xs text-emerald-700 mt-1">Tip: {selectedModoHelp.tip}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <TrasladoTypeSelect
                                    value={formValues.tipoTraslado}
                                    name="tipoTraslado"
                                    onChange={handleSelectChange}
                                    label="Motivo de Traslado"
                                />
                                <Select
                                    label="Modo Transporte"
                                    options={MODO_TRANSPORTE_OPTIONS}
                                    name="modoTransporte"
                                    id="modoTransporte"
                                    value={MODO_TRANSPORTE_OPTIONS.find(o => o.id === formValues.modoTransporte)?.value || ""}
                                    defaultValue={formValues.modoTransporte}
                                    onChange={handleSelectChange}
                                    withLabel
                                    error={null}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <InputPro autocomplete="off" label="Peso Total" name="pesoTotal" type="number" value={formValues.pesoTotal} onChange={handleChange} isLabel />
                                <Select
                                    label="Unidad Peso"
                                    options={UNIDAD_PESO_OPTIONS}
                                    name="unidadPeso"
                                    id="unidadPeso"
                                    value={UNIDAD_PESO_OPTIONS.find(o => o.id === formValues.unidadPeso)?.value || ""}
                                    defaultValue={formValues.unidadPeso}
                                    onChange={handleSelectChange}
                                    withLabel
                                    error={null}
                                />
                            </div>

                            {/* Flags Checkboxes */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="checkbox" name="retornoVehiculoVacio" checked={formValues.retornoVehiculoVacio} onChange={handleChange} className="rounded border-gray-300" />
                                    <span className="text-gray-700">Retorno Vehículo Vacío</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="checkbox" name="transbordoProgramado" checked={formValues.transbordoProgramado} onChange={handleChange} className="rounded border-gray-300" />
                                    <span className="text-gray-700">Transbordo Programado</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="checkbox" name="retornoEnvasesVacios" checked={formValues.retornoEnvasesVacios} onChange={handleChange} className="rounded border-gray-300" />
                                    <span className="text-gray-700">Retorno Envases Vacíos</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="checkbox" name="trasladoTotal" checked={formValues.trasladoTotal} onChange={handleChange} className="rounded border-gray-300" />
                                    <span className="text-gray-700">Traslado Total (DAM/DS)</span>
                                </label>
                            </div>
                        </div>

                        {/* Datos del Transporte (Condicional) */}
                        {(formValues.modoTransporte === "01" || formValues.tipoGuia === "TRANSPORTISTA") && (
                            <div className="p-4 rounded-xl border border-gray-200 bg-blue-50/30">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Datos del Transportista</h3>
                                <p className="text-xs text-gray-600 mb-3">
                                    Bloque obligatorio para transporte público y para guías tipo TRANSPORTISTA.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputPro autocomplete="off" label="RUC Transportista (obligatorio)" name="transportistaRuc" value={formValues.transportistaRuc || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Razón Social Transportista (obligatorio)" name="transportistaRazonSocial" value={formValues.transportistaRazonSocial || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Registro MTC (obligatorio GRE-T)" name="transportistaMTC" value={formValues.transportistaMTC || ""} onChange={handleChange} isLabel />
                                </div>
                            </div>
                        )}

                        {(formValues.modoTransporte === "02" || formValues.tipoGuia === "TRANSPORTISTA") && (
                            <div className="p-4 rounded-xl border border-gray-200 bg-green-50/30">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Vehículos y Conductores</h3>
                                <p className="text-xs text-gray-600 mb-3">
                                    Para guía transportista y/o transporte privado, completa datos del conductor y la unidad.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputPro autocomplete="off" label="Placa Vehículo (mínimo 6 caracteres)" name="vehiculoPlaca" value={formValues.vehiculoPlaca || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="TUC/CHV o # Autorización (11-13 caract.)" name="vehiculoAutorizacion" value={formValues.vehiculoAutorizacion || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Documento Conductor (obligatorio)" name="conductorNumDoc" value={formValues.conductorNumDoc || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Nombre Conductor (obligatorio)" name="conductorNombre" value={formValues.conductorNombre || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Apellidos Conductor (obligatorio)" name="conductorApellidos" value={formValues.conductorApellidos || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Licencia (9 caract. alfanuméricos)" name="conductorLicencia" value={(formValues.conductorLicencia || "").toUpperCase()} onChange={handleChange} isLabel />
                                </div>
                            </div>
                        )}

                        {/* Puntos de Partida y Llegada */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Punto de Partida</h3>
                                <p className="text-xs text-gray-500 mb-3">Dirección y ubigeo desde donde salen los bienes.</p>
                                <div className="space-y-3">
                                    <SelectUbigeo
                                        label="Ubigeo Partida"
                                        name="partidaUbigeo"
                                        id="partidaUbigeo"
                                        options={ubigeos}
                                        onChange={handleSelectChange}
                                        value={getUbigeoText(formValues.partidaUbigeo)}
                                        defaultValue={getUbigeoText(formValues.partidaUbigeo)}
                                        isSearch
                                    />
                                    <InputPro autocomplete="off" label="Dirección Partida" name="partidaDireccion" value={formValues.partidaDireccion} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Código Establecimiento Partida" name="partidaCodigoEstablecimiento" value={formValues.partidaCodigoEstablecimiento || ""} onChange={handleChange} isLabel />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Punto de Llegada</h3>
                                <p className="text-xs text-gray-500 mb-3">Dirección y ubigeo donde se entregarán los bienes.</p>
                                <div className="space-y-3">
                                    <SelectUbigeo
                                        label="Ubigeo Llegada"
                                        name="llegadaUbigeo"
                                        id="llegadaUbigeo"
                                        options={ubigeos}
                                        onChange={handleSelectChange}
                                        value={getUbigeoText(formValues.llegadaUbigeo)}
                                        defaultValue={getUbigeoText(formValues.llegadaUbigeo)}
                                        isSearch
                                    />
                                    <InputPro autocomplete="off" label="Dirección Llegada" name="llegadaDireccion" value={formValues.llegadaDireccion} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Código Establecimiento Llegada" name="llegadaCodigoEstablecimiento" value={formValues.llegadaCodigoEstablecimiento || ""} onChange={handleChange} isLabel />
                                </div>
                            </div>
                        </div>

                        {/* Ítems */}
                        <div className="p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Bienes a Trasladar</h3>
                            <p className="text-xs text-gray-500 mb-3">Agrega al menos un producto. La cantidad debe ser mayor a 0.</p>

                            {/* Formulario Agregar Ítem */}
                            <div className="grid grid-cols-12 gap-3 mb-4 items-end p-3 rounded-xl border border-gray-100">
                                <div className="col-span-12 md:col-span-6">
                                    <Select
                                        label="Producto"
                                        name="producto"
                                        value={selectedProductValue}
                                        options={productOptions}
                                        onChange={handleProductChange}
                                        isSearch
                                        handleGetData={handleProductSearch}
                                        withLabel
                                        error={null}
                                        placeholder="Buscar producto..."
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <InputPro autocomplete="off" type="number" label="Cantidad" name="newItem.cantidad" value={newItem.cantidad} onChange={(e) => setNewItem({ ...newItem, cantidad: Number(e.target.value) })} isLabel />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <InputPro autocomplete="off" label="Unidad" name="newItem.unidadMedida" value={newItem.unidadMedida || ""} onChange={(e) => setNewItem({ ...newItem, unidadMedida: e.target.value })} isLabel disabled />
                                </div>
                                <div className="col-span-2 md:col-span-2">
                                    <Button type="button" outline color="black" onClick={addItem} className="w-full justify-center">
                                        Agregar
                                        <Icon icon="solar:add-circle-bold" className="ml-2" />
                                    </Button>
                                </div>
                            </div>

                            {/* Tabla de Ítems */}
                            <div className="w-full overflow-x-auto border border-gray-100 rounded-xl">
                                <DataTable
                                    headerColumns={detallesTableColumns}
                                    bodyData={detallesTableData}
                                    actions={detallesTableActions}
                                    isCompact={false}
                                />
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-gray-200">
                            <InputPro autocomplete="off" label="Observaciones" name="observaciones" value={formValues.observaciones || ""} onChange={handleChange} isLabel />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                            <Button color="gray" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                            <Button outline color="black" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Icon icon="svg-spinners:ring-resize" className="mr-2" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:diskette-bold" className="mr-2" />
                                        {guiaToEdit ? "Actualizar Guía" : "Generar Guía"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpenModal={isEditQtyModalOpen}
                closeModal={() => {
                    setIsEditQtyModalOpen(false);
                    setEditingQtyIndex(null);
                }}
                title="Editar cantidad"
                width="420px"
                position="center"
                icon="solar:pen-2-bold"
            >
                <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-600">Ajusta la cantidad del producto seleccionado. Este cambio solo actualiza la tabla y no guarda aún la guía.</p>
                    <InputPro
                        autocomplete="off"
                        label="Cantidad"
                        name="editingQtyValue"
                        type="number"
                        value={editingQtyValue}
                        onChange={(e) => setEditingQtyValue(Number(e.target.value))}
                        isLabel
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button color="gray" onClick={() => {
                            setIsEditQtyModalOpen(false);
                            setEditingQtyIndex(null);
                        }}>
                            Cancelar
                        </Button>
                        <Button color="primary" onClick={handleSaveEditCantidad}>
                            Guardar cantidad
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ModalGuiaRemision;
