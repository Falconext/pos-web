import { useSedesViewModel } from '@/features/admin/sedes/useSedesViewModel';
import { Icon } from '@iconify/react';
import DataTable from '@/components/Datatable';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import ModalConfirm from '@/components/ModalConfirm';
import SedeModal from './SedeModal';

const SedesIndex = () => {
    const vm = useSedesViewModel();

    const tableData = vm.sedes.map(sede => ({
        id: sede.id,
        nombre: sede.nombre,
        direccion: sede.direccion || '-',
        codigo: sede.codigoSunat || '-',
        principal: sede.esPrincipal ? <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold">Principal</span> : <span className="text-gray-500">Secundaria</span>,
        estado: sede.estado === 'ACTIVO' ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activo</span> : <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactivo</span>,
        _original: sede
    }));

    const actions = [
        { onClick: (data: any) => vm.handleEdit(data._original), className: 'edit', icon: <Icon color="#66AD78" icon="material-symbols:edit" />, tooltip: 'Editar' },
        { onClick: (data: any) => vm.handleDelete(data._original), className: 'delete', icon: <Icon icon="healthicons:cancel-24px" color="#EF443C" />, tooltip: 'Eliminar' }
    ];

    if (vm.loading && vm.sedes.length === 0) return <Loading />;

    return (
        <div className="min-h-screen px-2 pb-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Sedes</h1>
                    <p className="text-sm text-gray-500 mt-1">Administra las sucursales y almacenes</p>
                </div>
                <Button color="secondary" onClick={vm.handleCreate} className="flex items-center gap-2">
                    <Icon icon="solar:add-circle-bold" width={20} /> Nueva Sede
                </Button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4">
                {tableData.length > 0 ? (
                    <DataTable actions={actions} bodyData={tableData} headerColumns={['Nombre', 'Dirección', 'Código SUNAT', 'Tipo', 'Estado']} />
                ) : <div className="text-center py-12 text-gray-500">No hay sedes registradas.</div>}
            </div>
            {vm.showModal && <SedeModal isOpen={vm.showModal} onClose={() => vm.setShowModal(false)} sede={vm.selectedSede} isEdit={vm.isEdit} />}
            {vm.showConfirm && vm.selectedSede && (
                <ModalConfirm isOpenModal={vm.showConfirm} setIsOpenModal={vm.setShowConfirm} title="Eliminar Sede"
                    information={`¿Estás seguro de eliminar la sede ${vm.selectedSede.nombre}? Esto no se puede deshacer.`}
                    confirmSubmit={vm.confirmDelete} />
            )}
        </div>
    );
};

export default SedesIndex;
