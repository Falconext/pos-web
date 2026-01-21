import { useEffect, useState } from "react";
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";
import DataTable from "@/components/Datatable";
import Modal from "@/components/Modal";
import ModalConfirm from "@/components/ModalConfirm"; // Assuming this exists from previous step
import apiClient from "@/utils/apiClient";
import useAlertStore from "@/zustand/alert";
import { Icon } from "@iconify/react";
import ModuloSelector from "@/components/ModuloSelector";
import { useModulosStore } from "@/zustand/modulos";

interface Plan {
    id: number;
    nombre: string;
    descripcion?: string;
    costo: number;
    duracionDias: number;
    // Limits
    limiteUsuarios: number;
    maxImagenesProducto: number;
    maxBanners: number;
    maxComprobantes: number;
    // Features
    esPrueba: boolean;
    tieneTienda: boolean;
    tieneBanners: boolean;
    tieneGaleria: boolean;
    tieneCulqi: boolean;
    tieneDeliveryGPS: boolean;
    tieneTicketera: boolean;
    _count?: { empresas: number };
    modulosAsignados?: {
        modulo: {
            id: number;
            codigo: string;
            nombre: string;
            descripcion: string;
            icono: string;
        }
    }[];
}

const Planes = () => {
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    // Sub-modals state
    const [showFeaturesModal, setShowFeaturesModal] = useState(false);
    const [showModulesModal, setShowModulesModal] = useState(false);

    // Form State
    const [form, setForm] = useState<Partial<Plan> & { moduloIds?: number[] }>({
        nombre: '',
        descripcion: '',
        costo: 0,
        duracionDias: 30,
        limiteUsuarios: 1,
        maxImagenesProducto: 1,
        maxBanners: 0,
        maxComprobantes: 100,
        esPrueba: false,
        tieneTienda: false,
        tieneBanners: false,
        tieneGaleria: false,
        tieneCulqi: false,
        tieneDeliveryGPS: false,
        tieneTicketera: false,
        moduloIds: [],
    });

    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { alert } = useAlertStore();

    const { getAllModulos } = useModulosStore();

    useEffect(() => {
        loadPlanes();
        getAllModulos();
    }, []);

    const loadPlanes = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/plan');
            setPlanes(Array.isArray(data) ? data : (data.data || []));
        } catch (error: any) {
            console.error(error);
            alert('Error al cargar planes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setIsEdit(false);
        setForm({
            nombre: '',
            descripcion: '',
            costo: 0,
            duracionDias: 30,
            limiteUsuarios: 1,
            maxImagenesProducto: 1,
            maxBanners: 0,
            maxComprobantes: 100,
            esPrueba: false,
            tieneTienda: false,
            tieneBanners: false,
            tieneGaleria: false,
            tieneCulqi: false,
            tieneDeliveryGPS: false,
            tieneTicketera: false,
            moduloIds: [],
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (plan: Plan) => {
        setIsEdit(true);
        setCurrentId(plan.id);
        const moduloIds = plan.modulosAsignados?.map(m => m.modulo.id) || [];
        setForm({ ...plan, moduloIds });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.nombre || form.costo === undefined) {
            alert('Nombre y costo son obligatorios', 'warning');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...form,
                costo: Number(form.costo),
                duracionDias: Number(form.duracionDias),
                limiteUsuarios: Number(form.limiteUsuarios),
                maxImagenesProducto: Number(form.maxImagenesProducto),
                maxBanners: Number(form.maxBanners),
            };

            console.log('Enviando payload plan:', payload);

            if (isEdit && currentId) {
                await apiClient.put(`/plan/${currentId}`, payload);
                alert('Plan actualizado correctamente', 'success');
            } else {
                await apiClient.post('/plan', payload);
                alert('Plan creado correctamente', 'success');
            }
            setIsModalOpen(false);
            loadPlanes();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al guardar plan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
        setModalConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await apiClient.delete(`/plan/${deleteId}`);
            alert('Plan eliminado correctamente', 'success');
            setModalConfirmOpen(false);
            loadPlanes();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al eliminar plan', 'error');
        }
    };

    // Toggle Component Helper - Reused for the Features Modal
    const Toggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded -mx-2 transition-colors">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!value)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </button>
        </div>
    );

    const headerColumns = ['Nombre', 'Costo', 'Duración', 'Anual', 'Max Compr.', 'Empresas', 'Estado', 'Tienda', 'Ticketera', 'Acciones'];
    const bodyData = planes.map(p => ({
        'Nombre': <div className="font-medium text-gray-900">{p.nombre}<div className="text-xs text-gray-500">{p.descripcion}</div></div>,
        'Costo': `S/ ${Number(p.costo).toFixed(2)}`,
        'Duración': `${p.duracionDias} días`,
        'Anual': p.duracionDias >= 360
            ? <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-semibold">Anual</span>
            : <span className="text-gray-500 text-xs">Mensual</span>,
        'Max Compr.': <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium">{p.maxComprobantes || 100}</span>,
        'Empresas': <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-medium">{p._count?.empresas || 0} asignadas</span>,
        'Estado': p.esPrueba ? <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">Prueba</span> : <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">Comercial</span>,
        'Tienda': p.tieneTienda
            ? <Icon icon="mdi:check-circle" className="text-green-500" width={20} />
            : <Icon icon="mdi:close-circle" className="text-gray-300" width={20} />,
        'Ticketera': p.tieneTicketera
            ? <Icon icon="mdi:printer" className="text-blue-500" width={20} />
            : <Icon icon="mdi:close-circle" className="text-gray-300" width={20} />,
        'Acciones': (
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
                    title="Editar"
                >
                    <Icon icon="mdi:pencil" width={20} height={20} style={{ color: '#19A249' }} />
                </button>
                <button
                    type="button"
                    onClick={() => confirmDelete(p.id)}
                    className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
                    title="Eliminar"
                >
                    <Icon icon="mdi:trash-can" width={20} height={20} style={{ color: '#EC5F4F' }} />
                </button>
            </div>
        )
    }));

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Planes de Suscripción</h1>
                    <p className="text-gray-500 text-sm">Gestiona los planes disponibles para las empresas</p>
                </div>
                <Button onClick={handleOpenCreate} color="primary">
                    <Icon icon="mdi:plus" className="mr-2" />
                    Nuevo Plan
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <DataTable
                    headerColumns={headerColumns}
                    bodyData={bodyData}
                />
                {!loading && planes.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No hay planes registrados
                    </div>
                )}
            </div>

            {/* Modal Principal (Slide-over derecho) */}
            <Modal
                isOpenModal={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                title={isEdit ? 'Editar Plan' : 'Nuevo Plan'}
                position="right"
                width="600px" // Ancho más angosto para una sola columna
            >
                <div className="p-6 space-y-5">
                    {/* Información Básica */}
                    <div className="bg-white rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Información Básica</h4>
                        <div className="space-y-4">
                            <InputPro
                                isLabel
                                label="Nombre del Plan"
                                name="nombre"
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                placeholder="Ej. Plan Emprendedor"
                            />
                            <InputPro
                                isLabel
                                label="Descripción Corta"
                                name="descripcion"
                                value={form.descripcion}
                                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                placeholder="Breve descripción de los beneficios..."
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <InputPro
                                    isLabel
                                    label="Costo (S/)"
                                    name="costo"
                                    type="number"
                                    value={form.costo}
                                    onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })}
                                />
                                <InputPro
                                    isLabel
                                    label="Duración (Días)"
                                    name="duracionDias"
                                    type="number"
                                    value={form.duracionDias}
                                    onChange={(e) => setForm({ ...form, duracionDias: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-4"></div>

                    {/* Límites y Restricciones */}
                    <div className="bg-white rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Límites</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InputPro
                                isLabel
                                label="Límite Usuarios"
                                name="limiteUsuarios"
                                type="number"
                                value={form.limiteUsuarios}
                                onChange={(e) => setForm({ ...form, limiteUsuarios: Number(e.target.value) })}
                            />
                            <InputPro
                                isLabel
                                label="Máx. Comprobantes"
                                name="maxComprobantes"
                                type="number"
                                value={form.maxComprobantes}
                                onChange={(e) => setForm({ ...form, maxComprobantes: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-4"></div>

                    {/* Botones de Configuración Avanzada */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Configuración Avanzada</h4>

                        <button
                            type="button"
                            onClick={() => setShowFeaturesModal(true)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                                    <Icon icon="solar:stars-minimalistic-bold-duotone" width={24} />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-gray-800">Características</div>
                                    <div className="text-xs text-gray-500">Tienda, delivery, imagenes, etc.</div>
                                </div>
                            </div>
                            <Icon icon="solar:alt-arrow-right-linear" className="text-gray-400 group-hover:text-gray-600" width={20} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowModulesModal(true)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200 transition-colors">
                                    <Icon icon="solar:widget-bold-duotone" width={24} />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-gray-800">Módulos del Sistema</div>
                                    <div className="text-xs text-gray-500">Acceso a secciones del layout</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {(form.moduloIds?.length || 0) > 0 && (
                                    <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {form.moduloIds?.length}
                                    </span>
                                )}
                                <Icon icon="solar:alt-arrow-right-linear" className="text-gray-400 group-hover:text-gray-600" width={20} />
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10">
                    <Button onClick={() => setIsModalOpen(false)} color="secondary" outline>Cancelar</Button>
                    <Button onClick={handleSubmit} color="primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Plan'}</Button>
                </div>
            </Modal>

            {/* Modal de Características (Sub-modal) */}
            <Modal
                isOpenModal={showFeaturesModal}
                closeModal={() => setShowFeaturesModal(false)}
                title="Características del Plan"
                position="right"
                width="500px" // Un poco más angosto para diferenciarlo
                backdropClassName="bg-black/20" // Un backdrop más ligero para ver que está "encima"
            >
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        Activa las funciones adicionales que incluye este plan. Estas opciones afectan la funcionalidad disponible dentro de los módulos.
                    </p>

                    <div className="space-y-1">
                        <Toggle label="Plan de Prueba (Gratuito)" value={form.esPrueba || false} onChange={v => setForm({ ...form, esPrueba: v })} />
                        <div className="ml-1 px-2 pb-2 text-xs text-gray-400 mb-2">Sin costo, ideal para demos y evaluación</div>

                        <Toggle label="Tienda Virtual" value={form.tieneTienda || false} onChange={v => setForm({ ...form, tieneTienda: v })} />
                        <div className="ml-1 px-2 pb-2 text-xs text-gray-400 mb-2">Catálogo web, combos y pedidos online</div>

                        {form.tieneTienda && (
                            <div className="ml-4 pl-4 border-l-2 border-gray-100 mb-2 space-y-2 bg-gray-50 p-3 rounded-r-lg">
                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Configuración Tienda</h5>
                                <InputPro
                                    isLabel
                                    label="Máx. Banners"
                                    name="maxBanners"
                                    type="number"
                                    value={form.maxBanners}
                                    onChange={(e) => setForm({ ...form, maxBanners: Number(e.target.value) })}
                                />
                                <InputPro
                                    isLabel
                                    label="Máx. Img/Producto"
                                    name="maxImagenesProducto"
                                    type="number"
                                    value={form.maxImagenesProducto}
                                    onChange={(e) => setForm({ ...form, maxImagenesProducto: Number(e.target.value) })}
                                />
                            </div>
                        )}

                        <Toggle label="Banners Publicitarios" value={form.tieneBanners || false} onChange={v => setForm({ ...form, tieneBanners: v })} />

                        <Toggle label="Galería de Imágenes" value={form.tieneGaleria || false} onChange={v => setForm({ ...form, tieneGaleria: v })} />

                        <Toggle label="Pasarela Pagos (Culqi)" value={form.tieneCulqi || false} onChange={v => setForm({ ...form, tieneCulqi: v })} />

                        <Toggle label="Delivery GPS Tracker" value={form.tieneDeliveryGPS || false} onChange={v => setForm({ ...form, tieneDeliveryGPS: v })} />

                        <Toggle label="Ticketera (Impresión Térmica)" value={form.tieneTicketera || false} onChange={v => setForm({ ...form, tieneTicketera: v })} />
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                        <Button onClick={() => setShowFeaturesModal(false)} color="black">Listo</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Módulos (Sub-modal) */}
            <Modal
                isOpenModal={showModulesModal}
                closeModal={() => setShowModulesModal(false)}
                title="Módulos del Sistema"
                position="right"
                width="900px" // Más ancho para ver los grids de módulos cómodamente
                backdropClassName="bg-black/20"
            >
                <div className="p-6">
                    <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <h4 className="text-sm font-bold text-purple-800 mb-1">Control de Acceso</h4>
                        <p className="text-sm text-purple-700">
                            Selecciona los módulos principales a los que tendrá acceso la empresa.
                            Si un módulo no está seleccionado aquí, la empresa <strong>no podrá verlo ni acceder a él</strong>, independientemente de los permisos de usuario.
                        </p>
                    </div>

                    <ModuloSelector
                        selectedModulos={form.moduloIds || []}
                        onModulosChange={(modulos) => setForm({ ...form, moduloIds: modulos })}
                    />

                    <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                        <Button onClick={() => setShowModulesModal(false)} color="black">Guardar Selección</Button>
                    </div>
                </div>
            </Modal>

            <ModalConfirm
                isOpenModal={modalConfirmOpen}
                setIsOpenModal={setModalConfirmOpen}
                confirmSubmit={handleDelete}
                title="¿Eliminar Plan?"
                information="Esta acción eliminará el plan permanentemente. No se puede deshacer."
            >
                <p className="text-red-500 text-sm mt-2">Nota: No podrás eliminar planes que ya tengan empresas asignadas.</p>
            </ModalConfirm>
        </div>
    );
};

export default Planes;
