import { useEffect, useState } from "react";
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";
import DataTable from "@/components/Datatable";
import Modal from "@/components/Modal";
import ModalConfirm from "@/components/ModalConfirm"; // Assuming this exists from previous step
import apiClient from "@/utils/apiClient";
import useAlertStore from "@/zustand/alert";
import { Icon } from "@iconify/react";

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
    // Features
    esPrueba: boolean;
    tieneTienda: boolean;
    tieneBanners: boolean;
    tieneGaleria: boolean;
    tieneCulqi: boolean;
    tieneDeliveryGPS: boolean;
    _count?: { empresas: number };
}

const Planes = () => {
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    // Form State
    const [form, setForm] = useState<Partial<Plan>>({
        nombre: '',
        descripcion: '',
        costo: 0,
        duracionDias: 30,
        limiteUsuarios: 1,
        maxImagenesProducto: 1,
        maxBanners: 0,
        esPrueba: false,
        tieneTienda: false,
        tieneBanners: false,
        tieneGaleria: false,
        tieneCulqi: false,
        tieneDeliveryGPS: false,
    });

    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { alert } = useAlertStore();

    useEffect(() => {
        loadPlanes();
    }, []);

    const loadPlanes = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/plan');
            setPlanes(Array.isArray(data) ? data : []);
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
            esPrueba: false,
            tieneTienda: false,
            tieneBanners: false,
            tieneGaleria: false,
            tieneCulqi: false,
            tieneDeliveryGPS: false,
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (plan: Plan) => {
        setIsEdit(true);
        setCurrentId(plan.id);
        setForm({ ...plan });
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

    // Toggle Component Helper
    const Toggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-700">{label}</span>
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

    const headerColumns = ['Nombre', 'Costo', 'Duración', 'Empresas', 'Estado', 'Tienda', 'Acciones'];
    const bodyData = planes.map(p => ({
        'Nombre': <div className="font-medium text-gray-900">{p.nombre}<div className="text-xs text-gray-500">{p.descripcion}</div></div>,
        'Costo': `S/ ${Number(p.costo).toFixed(2)}`,
        'Duración': `${p.duracionDias} días`,
        'Empresas': <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-medium">{p._count?.empresas || 0} asignadas</span>,
        'Estado': p.esPrueba ? <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">Prueba</span> : <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">Comercial</span>,
        'Tienda': p.tieneTienda
            ? <Icon icon="mdi:check-circle" className="text-green-500" width={20} />
            : <Icon icon="mdi:close-circle" className="text-gray-300" width={20} />,
        'Acciones': (
            <div className="flex gap-2">
                <Button color="secondary" onClick={() => handleOpenEdit(p)} className="p-1 min-w-0">
                    <Icon icon="mdi:pencil" width={18} />
                </Button>
                <Button color="danger" onClick={() => confirmDelete(p.id)} className="p-1 min-w-0">
                    <Icon icon="mdi:trash-can" width={18} />
                </Button>
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

            <Modal
                isOpenModal={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                title={isEdit ? 'Editar Plan' : 'Nuevo Plan'}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <InputPro
                            label="Nombre del Plan"
                            name="nombre"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            placeholder="Ej. Plan Emprendedor"
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro
                            label="Costo (S/)"
                            name="costo"
                            type="number"
                            value={form.costo}
                            onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })}
                        />
                    </div>
                    <div className="col-span-2">
                        <InputPro
                            label="Descripción"
                            name="descripcion"
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                            placeholder="Breve descripción de los beneficios..."
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro
                            label="Duración (Días)"
                            name="duracionDias"
                            type="number"
                            value={form.duracionDias}
                            onChange={(e) => setForm({ ...form, duracionDias: Number(e.target.value) })}
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro
                            label="Límite Usuarios"
                            name="limiteUsuarios"
                            type="number"
                            value={form.limiteUsuarios}
                            onChange={(e) => setForm({ ...form, limiteUsuarios: Number(e.target.value) })}
                        />
                    </div>

                    <div className="col-span-2 mt-4 bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-700 mb-3 block">Características y Funciones</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            <Toggle label="Plan de Prueba (Gratuito)" value={form.esPrueba || false} onChange={v => setForm({ ...form, esPrueba: v })} />
                            <Toggle label="Tienda Virtual" value={form.tieneTienda || false} onChange={v => setForm({ ...form, tieneTienda: v })} />
                            <Toggle label="Banners Publicitarios" value={form.tieneBanners || false} onChange={v => setForm({ ...form, tieneBanners: v })} />
                            <Toggle label="Galería de Imágenes" value={form.tieneGaleria || false} onChange={v => setForm({ ...form, tieneGaleria: v })} />
                            <Toggle label="Pasarela Pagos (Culqi)" value={form.tieneCulqi || false} onChange={v => setForm({ ...form, tieneCulqi: v })} />
                            <Toggle label="Delivery GPS Tracker" value={form.tieneDeliveryGPS || false} onChange={v => setForm({ ...form, tieneDeliveryGPS: v })} />
                        </div>
                    </div>

                    {/* Configuration of Limits if Feature Enabled */}
                    {form.tieneTienda && (
                        <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 bg-blue-50 p-4 rounded-lg">
                            <InputPro
                                label="Máx. Banners"
                                name="maxBanners"
                                type="number"
                                value={form.maxBanners}
                                onChange={(e) => setForm({ ...form, maxBanners: Number(e.target.value) })}
                            />
                            <InputPro
                                label="Máx. Img/Producto"
                                name="maxImagenesProducto"
                                type="number"
                                value={form.maxImagenesProducto}
                                onChange={(e) => setForm({ ...form, maxImagenesProducto: Number(e.target.value) })}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Button onClick={() => setIsModalOpen(false)} color="secondary" outline>Cancelar</Button>
                    <Button onClick={handleSubmit} color="primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Plan'}</Button>
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
