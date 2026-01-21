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

const ModalGuiaRemision = ({ isOpen, onClose, onSuccess, guiaToEdit }: ModalGuiaRemisionProps) => {
    const { auth } = useAuthStore();
    const { createGuiaRemision, updateGuiaRemision, getSiguienteCorrelativo, siguienteCorrelativo } = useGuiaRemisionStore();
    const { getUbigeos, ubigeos } = useExtentionsStore();
    const { getClientFromDoc } = useClientsStore();
    const { getAllProducts, products, resetProducts } = useProductsStore();

    const [productOptions, setProductOptions] = useState<any[]>([]);
    const [tipoGuia, setTipoGuia] = useState<string>("REMITENTE");

    const [formValues, setFormValues] = useState<IGuiaRemision>({
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
        llegadaUbigeo: "",
        llegadaDireccion: "",
        fechaInicioTraslado: format(new Date(), "yyyy-MM-dd"),
        retornoVehiculoVacio: false,
        retornoEnvasesVacios: false,
        transbordoProgramado: false,
        trasladoTotal: false,
        vehiculoM1oL: false,
        datosTransportista: false,
        detalles: []
    });

    const [newItem, setNewItem] = useState<Partial<IDetalleGuiaRemision>>({
        cantidad: 1,
        unidadMedida: "NIU"
    });

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
                setTipoGuia("REMITENTE");
                getSiguienteCorrelativo(initialSerie);

                setFormValues({
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
                    conductorLicencia: "",
                    vehiculoPlaca: "",
                    // Ubicaciones
                    partidaUbigeo: auth?.empresa?.ubigeo || "",
                    partidaDireccion: auth?.empresa?.direccion || "",
                    llegadaUbigeo: "",
                    llegadaDireccion: "",
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

        setTipoGuia(fullGuia.serie?.startsWith('V') ? "TRANSPORTISTA" : "REMITENTE");

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
                    llegadaDireccion: result.direccion || prev.llegadaDireccion,
                    llegadaUbigeo: result.ubigeo_sunat || prev.llegadaUbigeo,
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
        setTipoGuia(String(id));
        const nuevaSerie = id === "REMITENTE" ? "T001" : "V001";
        setFormValues(prev => ({ ...prev, serie: nuevaSerie }));
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
    };

    const removeItem = (index: number) => {
        setFormValues(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
        }));
    };

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

        if (!formValues.destinatarioNumDoc || !formValues.destinatarioRazonSocial) {
            useAlertStore.getState().alert("Datos del destinatario incompletos", "warning");
            return;
        }

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

        setIsSubmitting(true);
        try {
            // Validation/Default for PesoTotal
            const peso = Number(formValues.pesoTotal);
            const finalPesoTotal = peso > 0 ? peso : 1;

            // Sanitize payload before sending
            const payload = {
                ...formValues,
                correlativo: typeof formValues.correlativo === 'object'
                    ? (formValues.correlativo as any).data || (formValues.correlativo as any).correlativo || 0
                    : Number(formValues.correlativo),
                pesoTotal: finalPesoTotal
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
                        <div className="p-4 rounded-xl border border-gray-200 mt-5">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Datos Generales</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Tipo de Guía"
                                    options={TIPO_GUIA_OPTIONS}
                                    name="tipoGuia"
                                    id="tipoGuia"
                                    value={TIPO_GUIA_OPTIONS.find(o => o.id === tipoGuia)?.value || ""}
                                    defaultValue={tipoGuia}
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

                        {/* Datos del Destinatario */}
                        <div className="p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Datos del Destinatario</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select
                                    label="Tipo Doc."
                                    options={TIPO_DOC_OPTIONS}
                                    name="destinatarioTipoDoc"
                                    id="destinatarioTipoDoc"
                                    value={TIPO_DOC_OPTIONS.find(o => o.id === formValues.destinatarioTipoDoc)?.value || ""}
                                    defaultValue={formValues.destinatarioTipoDoc}
                                    onChange={handleSelectChange}
                                    withLabel
                                    error={null}
                                />
                                <InputPro autocomplete="off" label="Número Documento" name="destinatarioNumDoc" value={formValues.destinatarioNumDoc} onChange={handleChange} isLabel placeholder="Ingrese DNI o RUC" />
                                <InputPro autocomplete="off" label="Razón Social / Nombre" name="destinatarioRazonSocial" value={formValues.destinatarioRazonSocial} onChange={handleChange} isLabel />
                            </div>
                        </div>

                        {/* Datos de Traslado */}
                        <div className="p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Datos del Traslado</h3>
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
                        {formValues.modoTransporte === "01" && (
                            <div className="p-4 rounded-xl border border-gray-200 bg-blue-50/30">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Transporte Público</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputPro autocomplete="off" label="RUC Transportista" name="transportistaRuc" value={formValues.transportistaRuc || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Razón Social Transportista" name="transportistaRazonSocial" value={formValues.transportistaRazonSocial || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Registro MTC" name="transportistaMTC" value={formValues.transportistaMTC || ""} onChange={handleChange} isLabel />
                                </div>
                            </div>
                        )}

                        {formValues.modoTransporte === "02" && (
                            <div className="p-4 rounded-xl border border-gray-200 bg-green-50/30">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Transporte Privado</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputPro autocomplete="off" label="Placa Vehículo" name="vehiculoPlaca" value={formValues.vehiculoPlaca || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="DNI Conductor" name="conductorNumDoc" value={formValues.conductorNumDoc || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Nombre Conductor" name="conductorNombre" value={formValues.conductorNombre || ""} onChange={handleChange} isLabel />
                                    <InputPro autocomplete="off" label="Licencia" name="conductorLicencia" value={formValues.conductorLicencia || ""} onChange={handleChange} isLabel />
                                </div>
                            </div>
                        )}

                        {/* Puntos de Partida y Llegada */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Punto de Partida</h3>
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
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Punto de Llegada</h3>
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
                                </div>
                            </div>
                        </div>

                        {/* Ítems */}
                        <div className="p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Bienes a Trasladar</h3>

                            {/* Formulario Agregar Ítem */}
                            <div className="grid grid-cols-12 gap-3 mb-4 items-end p-3 rounded-xl border border-gray-100">
                                <div className="col-span-12 md:col-span-6">
                                    <Select
                                        label="Producto"
                                        name="producto"
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
                            <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white text-gray-600 font-medium border-b border-gray-200">
                                        <tr>
                                            <th className="px-3 py-2">#</th>
                                            <th className="px-3 py-2">Código</th>
                                            <th className="px-3 py-2">Descripción</th>
                                            <th className="px-3 py-2 text-center">Unidad</th>
                                            <th className="px-3 py-2 text-right">Cantidad</th>
                                            <th className="px-3 py-2 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {formValues.detalles.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">No hay ítems agregados</td>
                                            </tr>
                                        ) : (
                                            formValues.detalles.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50/50">
                                                    <td className="px-3 py-3">{index + 1}</td>
                                                    <td className="px-3 py-3 font-medium text-gray-800">{item.codigoProducto}</td>
                                                    <td className="px-3 py-3 capitalize">{item.descripcion.toLowerCase()}</td>
                                                    <td className="px-3 py-3 text-center">{item.unidadMedida}</td>
                                                    <td className="px-3 py-3 text-right">{item.cantidad}</td>
                                                    <td className="px-3 py-3 text-center">
                                                        <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1">
                                                            <Icon icon="solar:trash-bin-trash-bold" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
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
                                        Generar Guía
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default ModalGuiaRemision;
