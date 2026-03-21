import { useModulosViewModel } from '@/features/admin/sistema/useModulosViewModel';
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";
import DataTable from "@/components/Datatable";
import Modal from "@/components/Modal";
import ModalConfirm from "@/components/ModalConfirm";
import { Icon } from "@iconify/react";

const Toggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-sm text-gray-700">{label}</span>
        <button type="button" onClick={() => onChange(!value)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-200'}`}>
            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const ModulosPage = () => {
    const vm = useModulosViewModel();

    const bodyData = vm.modulos.map(m => ({
        'Orden': m.orden,
        'Icono': <div className="text-2xl text-gray-500"><Icon icon={m.icono || 'mdi:cube'} /></div>,
        'Código': <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{m.codigo}</span>,
        'Nombre': <span className="font-medium text-gray-800">{m.nombre}</span>,
        'Descripción': <span className="text-gray-500 text-sm truncate max-w-xs block">{m.descripcion}</span>,
        'Estado': m.activo ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold">Activo</span> : <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-semibold">Inactivo</span>,
        'Acciones': (
            <div className="flex gap-3">
                <button onClick={() => vm.handleOpenEdit(m)} className="p-1 hover:opacity-70 cursor-pointer text-blue-600"><Icon icon="mdi:pencil" width={20} /></button>
                <button onClick={() => vm.confirmDelete(m.id)} className="p-1 hover:opacity-70 cursor-pointer text-red-500"><Icon icon="mdi:trash-can" width={20} /></button>
            </div>
        )
    }));

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold text-gray-800">Administración de Módulos</h1><p className="text-gray-500 text-sm">Gestiona los módulos del sistema disponibles para los planes</p></div>
                <Button onClick={vm.handleOpenCreate} color="primary"><Icon icon="mdi:plus" className="mr-2" />Nuevo Módulo</Button>
            </div>
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <DataTable headerColumns={['Orden', 'Icono', 'Código', 'Nombre', 'Descripción', 'Estado', 'Acciones']} bodyData={bodyData} />
            </div>
            <Modal isOpenModal={vm.isModalOpen} closeModal={() => vm.setIsModalOpen(false)} title={vm.isEdit ? 'Editar Módulo' : 'Nuevo Módulo'}>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1"><InputPro isLabel label="Código (Identificador)" name="codigo" value={vm.form.codigo} onChange={(e) => vm.setForm({ ...vm.form, codigo: e.target.value })} placeholder="Ej. kardex, ventas..." disabled={vm.isEdit} /></div>
                    <div className="col-span-2 md:col-span-1"><InputPro isLabel label="Nombre Visible" name="nombre" value={vm.form.nombre} onChange={(e) => vm.setForm({ ...vm.form, nombre: e.target.value })} placeholder="Ej. Inventario" /></div>
                    <div className="col-span-2"><InputPro isLabel label="Descripción" name="descripcion" value={vm.form.descripcion} onChange={(e) => vm.setForm({ ...vm.form, descripcion: e.target.value })} /></div>
                    <div className="col-span-2 md:col-span-1"><InputPro isLabel label="Icono (Iconify)" name="icono" value={vm.form.icono} onChange={(e) => vm.setForm({ ...vm.form, icono: e.target.value })} placeholder="Ej. mdi:box" /></div>
                    <div className="col-span-2 md:col-span-1"><InputPro isLabel label="Orden" name="orden" type="number" value={vm.form.orden} onChange={(e) => vm.setForm({ ...vm.form, orden: Number(e.target.value) })} /></div>
                    <div className="col-span-2 mt-2"><Toggle label="Módulo Activo" value={vm.form.activo || false} onChange={v => vm.setForm({ ...vm.form, activo: v })} /><p className="text-xs text-gray-500 mt-1">Si se desactiva, no aparecerá disponible para asignar a nuevos planes.</p></div>
                    <div className="col-span-2 mt-4 bg-blue-50 p-3 rounded text-sm text-blue-800 flex items-start"><Icon icon="mdi:information" className="mr-2 mt-0.5 text-xl" /><div>Preview del Icono: <Icon icon={vm.form.icono || 'mdi:help-circle'} className="inline-block text-2xl ml-2 align-middle" /></div></div>
                </div>
                <div className="flex justify-end gap-2 p-4 pt-0">
                    <Button onClick={() => vm.setIsModalOpen(false)} color="secondary" outline>Cancelar</Button>
                    <Button onClick={vm.handleSubmit} color="primary" disabled={vm.loading}>{vm.loading ? 'Guardando...' : 'Guardar'}</Button>
                </div>
            </Modal>
            <ModalConfirm isOpenModal={vm.modalConfirmOpen} setIsOpenModal={vm.setModalConfirmOpen} confirmSubmit={vm.handleDelete} title="¿Eliminar Módulo?" information="Esta acción eliminará el módulo del sistema. ADVERTENCIA: Esto puede romper la visualización de planes existentes que lo usen." />
        </div>
    );
};

export default ModulosPage;
