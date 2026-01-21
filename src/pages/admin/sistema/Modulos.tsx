import { useEffect, useState } from "react";
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";
import DataTable from "@/components/Datatable";
import Modal from "@/components/Modal";
import ModalConfirm from "@/components/ModalConfirm";
import { Icon } from "@iconify/react";
import { useModulosStore, IModulo } from "@/zustand/modulos";
import useAlertStore from "@/zustand/alert";

// Helper Toggle component
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

const ModulosPage = () => {
    const { modulos, loading, getAllModulos, createModulo, updateModulo, deleteModulo } = useModulosStore();
    const { alert } = useAlertStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);

    const [form, setForm] = useState<Partial<IModulo>>({
        codigo: '',
        nombre: '',
        descripcion: '',
        icono: '',
        activo: true,
        orden: 0
    });

    useEffect(() => {
        getAllModulos();
    }, []);

    const handleOpenCreate = () => {
        setIsEdit(false);
        setForm({
            codigo: '',
            nombre: '',
            descripcion: '',
            icono: '',
            activo: true,
            orden: (modulos.length + 1)
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (modulo: IModulo) => {
        setIsEdit(true);
        setCurrentId(modulo.id);
        setForm({ ...modulo });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.codigo || !form.nombre) {
            alert('Código y nombre son obligatorios', 'warning');
            return;
        }

        let success;
        if (isEdit && currentId) {
            success = await updateModulo(currentId, form);
            if (success) alert('Módulo actualizado correctamente', 'success');
        } else {
            success = await createModulo(form);
            if (success) alert('Módulo creado correctamente', 'success');
        }

        if (success) setIsModalOpen(false);
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
        setModalConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const success = await deleteModulo(deleteId);
        if (success) {
            alert('Módulo eliminado correctamente', 'success');
            setModalConfirmOpen(false);
        }
    };

    const headerColumns = ['Orden', 'Icono', 'Código', 'Nombre', 'Descripción', 'Estado', 'Acciones'];

    const bodyData = modulos.map(m => ({
        'Orden': m.orden,
        'Icono': <div className="text-2xl text-gray-500"><Icon icon={m.icono || 'mdi:cube'} /></div>,
        'Código': <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{m.codigo}</span>,
        'Nombre': <span className="font-medium text-gray-800">{m.nombre}</span>,
        'Descripción': <span className="text-gray-500 text-sm truncate max-w-xs block">{m.descripcion}</span>,
        'Estado': m.activo
            ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold">Activo</span>
            : <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-semibold">Inactivo</span>,
        'Acciones': (
            <div className="flex gap-3">
                <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-1 hover:opacity-70 transition-opacity cursor-pointer text-blue-600"
                    title="Editar"
                >
                    <Icon icon="mdi:pencil" width={20} />
                </button>
                <button
                    onClick={() => confirmDelete(m.id)}
                    className="p-1 hover:opacity-70 transition-opacity cursor-pointer text-red-500"
                    title="Eliminar"
                >
                    <Icon icon="mdi:trash-can" width={20} />
                </button>
            </div>
        )
    }));

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Administración de Módulos</h1>
                    <p className="text-gray-500 text-sm">Gestiona los módulos del sistema disponibles para los planes</p>
                </div>
                <Button onClick={handleOpenCreate} color="primary">
                    <Icon icon="mdi:plus" className="mr-2" />
                    Nuevo Módulo
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <DataTable
                    headerColumns={headerColumns}
                    bodyData={bodyData}
                />
            </div>

            <Modal
                isOpenModal={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                title={isEdit ? 'Editar Módulo' : 'Nuevo Módulo'}
            >
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <InputPro
                            isLabel
                            label="Código (Identificador)"
                            name="codigo"
                            value={form.codigo}
                            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                            placeholder="Ej. kardex, ventas..."
                            disabled={isEdit} // Block code editing to prevent breaking references? Or allow if careful.
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro
                            isLabel
                            label="Nombre Visible"
                            name="nombre"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            placeholder="Ej. Inventario"
                        />
                    </div>
                    <div className="col-span-2">
                        <InputPro
                            isLabel
                            label="Descripción"
                            name="descripcion"
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro
                            isLabel
                            label="Icono (Iconify)"
                            name="icono"
                            value={form.icono}
                            onChange={(e) => setForm({ ...form, icono: e.target.value })}
                            placeholder="Ej. mdi:box"
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro
                            isLabel
                            label="Orden"
                            name="orden"
                            type="number"
                            value={form.orden}
                            onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
                        />
                    </div>

                    <div className="col-span-2 mt-2">
                        <Toggle label="Módulo Activo" value={form.activo || false} onChange={v => setForm({ ...form, activo: v })} />
                        <p className="text-xs text-gray-500 mt-1">Si se desactiva, no aparecerá disponible para asignar a nuevos planes.</p>
                    </div>

                    <div className="col-span-2 mt-4 bg-blue-50 p-3 rounded text-sm text-blue-800 flex items-start">
                        <Icon icon="mdi:information" className="mr-2 mt-0.5 text-xl" />
                        <div>
                            Preview del Icono: <Icon icon={form.icono || 'mdi:help-circle'} className="inline-block text-2xl ml-2 align-middle" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-4 pt-0">
                    <Button onClick={() => setIsModalOpen(false)} color="secondary" outline>Cancelar</Button>
                    <Button onClick={handleSubmit} color="primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
                </div>
            </Modal>

            <ModalConfirm
                isOpenModal={modalConfirmOpen}
                setIsOpenModal={setModalConfirmOpen}
                confirmSubmit={handleDelete}
                title="¿Eliminar Módulo?"
                information="Esta acción eliminará el módulo del sistema. ADVERTENCIA: Esto puede romper la visualización de planes existentes que lo usen."
            >
            </ModalConfirm>
        </div>
    );
};

export default ModulosPage;
