import { useSedesViewModel } from '@/features/admin/sedes/useSedesViewModel';
import { Icon } from '@iconify/react';
import DataTable from '@/components/Datatable';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import ModalConfirm from '@/components/ModalConfirm';
import SedeModal from './SedeModal';

const SedesIndex = () => {
    const vm = useSedesViewModel();

    const actions = [
        { onClick: (data: any) => vm.handleEdit(data._original), icon: <Icon icon="solar:pen-bold" width={18} />, tooltip: 'Editar', color: 'blue' as const },
        { onClick: (data: any) => vm.handleToggleActivo(data._original), icon: <Icon icon="solar:power-bold" width={18} />, tooltip: 'Activar / Desactivar', color: 'amber' as const },
        { onClick: (data: any) => vm.handleDelete(data._original), icon: <Icon icon="solar:trash-bin-trash-bold" width={18} />, tooltip: 'Eliminar', color: 'rose' as const, condition: (data: any) => !data._original?.esPrincipal && (data._original?.activo !== false) },
    ];

    const tableData = vm.sedes.map(sede => {
        const isActivo = (sede as any).activo !== false;
        const esAlmacen = sede.tipo === 'ALMACEN';
        return {
            id: sede.id,
            nombre: sede.nombre,
            direccion: sede.direccion || '-',
            codigo: sede.codigo || '-',
            'Tipo': (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    esAlmacen
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                    <Icon icon={esAlmacen ? 'solar:box-bold-duotone' : 'solar:shop-bold-duotone'} width={12} />
                    {esAlmacen ? 'Almacén' : 'Punto de Venta'}
                    {sede.esPrincipal && !esAlmacen && (
                        <span className="ml-1 text-[9px] font-bold text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full uppercase">Principal</span>
                    )}
                </span>
            ),
            'Estado': (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isActivo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                             : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActivo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {isActivo ? 'Activo' : 'Inactivo'}
                </span>
            ),
            _original: sede,
        };
    });

    if (vm.loading && vm.sedes.length === 0) return <Loading />;

    return (
        <div className="min-h-screen px-4 pb-6 bg-gray-50 dark:bg-[#0A0D14]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Icon icon="solar:city-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                        Gestión de Sedes
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra las sucursales y almacenes del sistema</p>
                </div>
                <button
                    onClick={vm.handleCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nueva Sede
                </button>
            </div>
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden p-4">
                {tableData.length > 0 ? (
                    <DataTable actions={actions} bodyData={tableData} headerColumns={[
                        { label: 'Nombre', key: 'nombre' }, { label: 'Dirección', key: 'direccion' },
                        { label: 'Código', key: 'codigo' }, { label: 'Tipo', key: 'Tipo' },
                        { label: 'Estado', key: 'Estado' },
                    ]} />
                ) : <div className="text-center py-12 text-gray-500 dark:text-gray-400">No hay sedes registradas.</div>}
            </div>
            {vm.showModal && <SedeModal isOpen={vm.showModal} onClose={() => vm.setShowModal(false)} sede={vm.selectedSede} isEdit={vm.isEdit} />}
            {vm.showConfirm && vm.selectedSede && (
                <ModalConfirm isOpenModal={vm.showConfirm} setIsOpenModal={vm.setShowConfirm} title="Eliminar Sede"
                    information={`¿Estás seguro de eliminar permanentemente la sede "${vm.selectedSede.nombre}"? Esto borrará su configuración y stock. Si la sede ya tiene historial de ventas o movimientos, el sistema no te permitirá eliminarla y deberás desactivarla (usando el botón de encendido) en su lugar.`}
                    confirmSubmit={vm.confirmDelete} />
            )}
        </div>
    );
};

export default SedesIndex;
