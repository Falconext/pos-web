import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Icon } from "@iconify/react";
import InputPro from "@/components/InputPro";
import Select from "@/components/Select";
import Button from "@/components/Button";
import SelectUbigeo from "@/components/Select/SelectUbigeo";
import TrasladoTypeSelect from "@/components/Select/TrasladoTypeSelect";
import { useGuiaRemisionStore, IGuiaRemision, IDetalleGuiaRemision } from "@/zustand/guia-remision";
import { useExtentionsStore } from "@/zustand/extentions";
import { useAuthStore } from "@/zustand/auth";
import ClientSearchModal from "./ClientSearchModal";
import ProductSearchModal from "./ProductSearchModal";
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

const FormGuiaRemision = () => {
    const navigate = useNavigate();
    const { auth } = useAuthStore();
    const { createGuiaRemision, getSiguienteCorrelativo, siguienteCorrelativo } = useGuiaRemisionStore();
    const { getUbigeos, ubigeos } = useExtentionsStore();

    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Initial state matching IGuiaRemision
    const [formValues, setFormValues] = useState<IGuiaRemision>({
        serie: "T001",
        correlativo: 0,
        fechaEmision: format(new Date(), "yyyy-MM-dd"),
        horaEmision: format(new Date(), "HH:mm:ss"),
        tipoDocumento: "09", // Guía de Remisión Remitente
        remitenteRuc: auth?.empresa?.ruc || "",
        remitenteRazonSocial: auth?.empresa?.razonSocial || "",
        remitenteDireccion: auth?.empresa?.direccion || "",
        destinatarioTipoDoc: "6",
        destinatarioNumDoc: "",
        destinatarioRazonSocial: "",
        tipoTraslado: "01", // Venta
        modoTransporte: "02", // Privado por defecto
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

    useEffect(() => {
        getUbigeos();
        // Obtener siguiente correlativo al cargar
        getSiguienteCorrelativo(formValues.serie);
    }, []);

    useEffect(() => {
        if (siguienteCorrelativo) {
            setFormValues(prev => ({ ...prev, correlativo: siguienteCorrelativo }));
        }
    }, [siguienteCorrelativo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormValues(prev => ({ ...prev, [name]: val }));
    };

    const handleSelectChange = (_idValue: any, value: any, name: any, id: any) => {
        // Handle Ubigeo or generic Select changes
        // SelectUbigeo passes: code, "Dept/Prov/Dist", name, id
        // Generic Select passes: id, value, name, id

        if (name === 'partidaUbigeo' || name === 'llegadaUbigeo') {
            // Ubigeo returns code as first arg
            setFormValues(prev => ({ ...prev, [name]: _idValue }));
        } else {
            setFormValues(prev => ({ ...prev, [name]: _idValue }));
        }
    };

    const handleClientSelect = (client: any) => {
        setFormValues(prev => ({
            ...prev,
            destinatarioTipoDoc: client.tipoDocumentoId === "6" ? "6" : "1", // Simplificado
            destinatarioNumDoc: client.nroDoc,
            destinatarioRazonSocial: client.nombre || client.razonSocial,
            clienteId: client.id,
            llegadaDireccion: client.direccion || "",
            llegadaUbigeo: client.ubigeo || ""
        }));
    };

    const handleProductSelect = (product: any) => {
        setNewItem({
            productoId: product.id,
            codigoProducto: product.codigo,
            descripcion: product.descripcion,
            unidadMedida: product.unidadMedida?.nombre || "NIU",
            cantidad: 1
        });
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

    const handleSubmit = async () => {
        if (formValues.detalles.length === 0) {
            useAlertStore.getState().alert("Debe agregar al menos un ítem", "warning");
            return;
        }

        if (!formValues.destinatarioNumDoc || !formValues.destinatarioRazonSocial) {
            useAlertStore.getState().alert("Datos del destinatario incompletos", "warning");
            return;
        }

        // Validaciones específicas según modo de transporte
        if (formValues.modoTransporte === "01") { // Público
            if (!formValues.transportistaRuc || !formValues.transportistaRazonSocial) {
                useAlertStore.getState().alert("Datos del transportista público requeridos", "warning");
                return;
            }
        }

        if (formValues.modoTransporte === "02") { // Privado
            if (!formValues.conductorNumDoc || !formValues.vehiculoPlaca) {
                useAlertStore.getState().alert("Datos del conductor y vehículo requeridos para transporte privado", "warning");
                return;
            }
        }

        const res = await createGuiaRemision(formValues);
        if (res.success) {
            navigate("/admin/guia-remision");
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Nueva Guía de Remisión</h2>

            {/* Cabecera */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <InputPro label="Serie" name="serie" value={formValues.serie} onChange={handleChange} isLabel disabled />
                <InputPro label="Correlativo" name="correlativo" value={formValues.correlativo} onChange={() => { }} isLabel disabled />
                <InputPro type="date" label="Fecha Emisión" name="fechaEmision" value={formValues.fechaEmision} onChange={handleChange} isLabel />
                <InputPro type="date" label="Fecha Inicio Traslado" name="fechaInicioTraslado" value={formValues.fechaInicioTraslado} onChange={handleChange} isLabel />
            </div>

            {/* Datos del Destinatario */}
            <div className="mb-6 border p-4 rounded-lg relative">
                <h3 className="font-semibold text-gray-700 mb-3 block">Datos del Destinatario</h3>
                <div className="absolute top-4 right-4">
                    <Button size="sm" onClick={() => setIsClientModalOpen(true)} color="secondary">Buscar Cliente</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Tipo Doc."
                        options={TIPO_DOC_OPTIONS}
                        name="destinatarioTipoDoc"
                        id="destinatarioTipoDoc"
                        value={TIPO_DOC_OPTIONS.find(o => o.id === formValues.destinatarioTipoDoc)?.value || ""}
                        defaultValue={formValues.destinatarioTipoDoc}
                        onChange={handleSelectChange}
                        error=""
                    />
                    <InputPro label="Número Documento" name="destinatarioNumDoc" value={formValues.destinatarioNumDoc} onChange={handleChange} isLabel />
                    <InputPro label="Razón Social / Nombre" name="destinatarioRazonSocial" value={formValues.destinatarioRazonSocial} onChange={handleChange} isLabel />
                </div>
            </div>

            {/* Datos de Traslado */}
            <div className="mb-6 border p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Datos del Traslado</h3>
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
                        error=""
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex gap-2">
                        <InputPro label="Peso Total" name="pesoTotal" type="number" value={formValues.pesoTotal} onChange={handleChange} isLabel />
                        <Select
                            label="Unidad"
                            options={UNIDAD_PESO_OPTIONS}
                            name="unidadPeso"
                            id="unidadPeso"
                            value={UNIDAD_PESO_OPTIONS.find(o => o.id === formValues.unidadPeso)?.value || ""}
                            defaultValue={formValues.unidadPeso}
                            onChange={handleSelectChange}
                            error=""
                        />
                    </div>
                </div>

                {/* Flags Checkboxes */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <label className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" name="retornoVehiculoVacio" checked={formValues.retornoVehiculoVacio} onChange={handleChange} />
                        <span>Retorno Vehículo Vacío</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" name="transbordoProgramado" checked={formValues.transbordoProgramado} onChange={handleChange} />
                        <span>Transbordo Programado</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" name="retornoEnvasesVacios" checked={formValues.retornoEnvasesVacios} onChange={handleChange} />
                        <span>Retorno Envases Vacíos</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" name="trasladoTotal" checked={formValues.trasladoTotal} onChange={handleChange} />
                        <span>Traslado Total (DAM/DS)</span>
                    </label>
                </div>
            </div>

            {/* Datos del Transporte (Condicional) */}
            {formValues.modoTransporte === "01" && (
                <div className="mb-6 border p-4 rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-gray-700 mb-3">Transporte Público</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputPro label="RUC Transportista" name="transportistaRuc" value={formValues.transportistaRuc || ""} onChange={handleChange} isLabel />
                        <InputPro label="Razón Social Transp." name="transportistaRazonSocial" value={formValues.transportistaRazonSocial || ""} onChange={handleChange} isLabel />
                        <InputPro label="Registro MTC" name="transportistaMTC" value={formValues.transportistaMTC || ""} onChange={handleChange} isLabel />
                    </div>
                </div>
            )}

            {formValues.modoTransporte === "02" && (
                <div className="mb-6 border p-4 rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-gray-700 mb-3">Transporte Privado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <InputPro label="Placa Vehículo" name="vehiculoPlaca" value={formValues.vehiculoPlaca || ""} onChange={handleChange} isLabel />
                        <InputPro label="DNI/Licencia Conductor" name="conductorNumDoc" value={formValues.conductorNumDoc || ""} onChange={handleChange} isLabel />
                        <InputPro label="Nombre Conductor" name="conductorNombre" value={formValues.conductorNombre || ""} onChange={handleChange} isLabel />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputPro label="Licencia" name="conductorLicencia" value={formValues.conductorLicencia || ""} onChange={handleChange} isLabel />
                    </div>
                </div>
            )}

            {/* Puntos de Partida y Llegada */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-3">Punto de Partida</h3>
                    <div className="mb-3">
                        <SelectUbigeo
                            label="Ubigeo Partida"
                            name="partidaUbigeo"
                            id="partidaUbigeo"
                            options={ubigeos}
                            onChange={handleSelectChange}
                            value={""}
                            defaultValue={formValues.partidaUbigeo}
                            isSearch
                        />
                    </div>
                    <InputPro label="Dirección Partida" name="partidaDireccion" value={formValues.partidaDireccion} onChange={handleChange} isLabel />
                </div>
                <div className="border p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-3">Punto de Llegada</h3>
                    <div className="mb-3">
                        <SelectUbigeo
                            label="Ubigeo Llegada"
                            name="llegadaUbigeo"
                            id="llegadaUbigeo"
                            options={ubigeos}
                            onChange={handleSelectChange}
                            value=""
                            defaultValue={formValues.llegadaUbigeo}
                            isSearch
                        />
                    </div>
                    <InputPro label="Dirección Llegada" name="llegadaDireccion" value={formValues.llegadaDireccion} onChange={handleChange} isLabel />
                </div>
            </div>

            {/* Ítems */}
            <div className="mb-6 border p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Bienes a Trasladar</h3>

                {/* Formulario Agregar Ítem */}
                <div className="flex flex-wrap gap-4 items-end mb-4 bg-gray-50 p-3 rounded">
                    <Button size="sm" onClick={() => setIsProductModalOpen(true)} color="secondary">Buscar Producto</Button>
                    <div className="w-32">
                        <InputPro label="Código" name="newItem.codigoProducto" value={newItem.codigoProducto || ""} onChange={(e) => setNewItem({ ...newItem, codigoProducto: e.target.value })} isLabel />
                    </div>
                    <div className="flex-1">
                        <InputPro label="Descripción" name="newItem.descripcion" value={newItem.descripcion || ""} onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })} isLabel />
                    </div>
                    <div className="w-24">
                        <InputPro type="number" label="Cant." name="newItem.cantidad" value={newItem.cantidad} onChange={(e) => setNewItem({ ...newItem, cantidad: Number(e.target.value) })} isLabel />
                    </div>
                    <div className="w-24">
                        <InputPro label="Und." name="newItem.unidadMedida" value={newItem.unidadMedida || ""} onChange={(e) => setNewItem({ ...newItem, unidadMedida: e.target.value })} isLabel />
                    </div>
                    <Button size="md" onClick={addItem} color="primary" className="mb-1">
                        <Icon icon="heroicons:plus" />
                    </Button>
                </div>

                {/* Tabla de Ítems */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border rounded-lg">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Código</th>
                                <th className="p-3">Descripción</th>
                                <th className="p-3 text-center">Unidad</th>
                                <th className="p-3 text-right">Cantidad</th>
                                <th className="p-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formValues.detalles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-gray-500">No hay ítems agregados</td>
                                </tr>
                            ) : (
                                formValues.detalles.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{index + 1}</td>
                                        <td className="p-3">{item.codigoProducto}</td>
                                        <td className="p-3">{item.descripcion}</td>
                                        <td className="p-3 text-center">{item.unidadMedida}</td>
                                        <td className="p-3 text-right">{item.cantidad}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                                                <Icon icon="heroicons:trash" width="20" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mb-4">
                <InputPro label="Observaciones" name="observaciones" value={formValues.observaciones || ""} onChange={handleChange} isLabel />
            </div>

            <div className="flex justify-end gap-4 mt-8">
                <Button color="gray" onClick={() => navigate("/admin/guia-remision")}>Cancelar</Button>
                <Button color="primary" onClick={handleSubmit} className="px-8">Generar Guía</Button>
            </div>

            {/* Modales */}
            <ClientSearchModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSelect={handleClientSelect}
            />
            <ProductSearchModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSelect={handleProductSelect}
            />
        </div>
    );
};

export default FormGuiaRemision;
