import { useEmpresaIndexViewModel } from '@/features/admin/empresa/useEmpresaIndexViewModel';
import { Icon } from '@iconify/react/dist/iconify.js';
import DataTable from '@/components/Datatable';
import Pagination from '@/components/Pagination';
import Button from '@/components/Button';
import EmpresaFormModal from '@/components/Empresa/EmpresaFormModal';
import EmpresaDrawer from '@/components/Empresa/EmpresaDrawer';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import ModalConfirm from '@/components/ModalConfirm';
import TableSkeleton from '@/components/Skeletons/table';

const EmpresasIndex = () => {
  const vm = useEmpresaIndexViewModel();

  const actions: any = [
    { onClick: vm.handleViewDetails, className: "details", icon: <Icon color="#6366F1" icon="solar:eye-bold-duotone" />, tooltip: "Ver detalles" },
    { onClick: vm.handleEdit, className: "edit", icon: <Icon color="#66AD78" icon="material-symbols:edit" />, tooltip: "Editar" },
    { onClick: vm.handleToggleState, className: "toggle", icon: <Icon icon="mdi:power" color="#F59E0B" />, tooltip: "Activar/Desactivar" },
    { onClick: vm.handleDelete, className: "delete", icon: <Icon icon="mdi:trash-can" color="#EF443C" />, tooltip: "Eliminar" },
  ];

  if (vm.loading && vm.empresas.length === 0) return <TableSkeleton />;

  return (
    <div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Icon icon="solar:buildings-bold-duotone" className="text-blue-600 dark:text-blue-400" />
            Empresas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra las empresas registradas en el sistema</p>
        </div>
        <button
          onClick={() => { vm.setEmpresaEditingId(undefined); vm.setEmpresaModalMode('create'); vm.setOpenEmpresaModal(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nueva Empresa
        </button>
      </div>
      {/* Alertas de vencimiento */}
      {vm.proximasVencer.length > 0 && !vm.alertasDismissed && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center flex-shrink-0">
            <Icon icon="solar:alarm-bold-duotone" className="text-amber-600 dark:text-amber-400 text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {vm.proximasVencer.length === 1
                ? '1 empresa vence en los próximos 7 días'
                : `${vm.proximasVencer.length} empresas vencen en los próximos 7 días`}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {vm.proximasVencer.map((e: any) => {
                const dias = Math.ceil((new Date(e.fechaExpiracion).getTime() - Date.now()) / 86400000);
                return (
                  <button
                    key={e.id}
                    onClick={() => vm.setDrawerEmpresa(e)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-800/40 hover:bg-amber-200 dark:hover:bg-amber-700/50 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors"
                  >
                    <span>{e.nombreComercial || e.razonSocial}</span>
                    <span className="text-amber-600 dark:text-amber-400">·</span>
                    <span className={dias === 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                      {dias === 0 ? 'vence hoy' : `${dias}d`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => vm.setAlertasDismissed(true)}
            className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-800/40 text-amber-500 flex-shrink-0 transition-colors"
          >
            <Icon icon="solar:close-bold" width={16} />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1"><InputPro name="search" onChange={vm.handleSearch} label="Buscar por RUC o razón social" isLabel value={vm.searchTerm} /></div>
            <div className="w-full lg:w-48"><Select name="tipoFiltro" label="Tipo" error={() => { }} options={[{ id: '', value: 'Todas' }, { id: 'FORMAL', value: 'Formales' }, { id: 'INFORMAL', value: 'Informales' }]} onChange={(id: any) => { vm.setTipoFiltro(id); vm.setCurrentPageState(1); }} withLabel /></div>
            <div className="w-full lg:w-40"><Select name="estadoFiltro" label="Estado" error={() => { }} options={[{ id: 'TODOS', value: 'Todos' }, { id: 'ACTIVO', value: 'Activos' }, { id: 'INACTIVO', value: 'Inactivos' }]} onChange={(id: any) => { vm.setEstadoFiltro(id); vm.setCurrentPageState(1); }} withLabel value={vm.estadoFiltro} /></div>
          </div>
        </div>
        {vm.error && <div className="mx-5 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2 font-medium text-sm"><Icon icon="solar:danger-circle-bold" className="text-xl" />{vm.error}</div>}
        <div className="p-4">
          {vm.empresasTable?.length > 0 ? (
            <>
              <div className="overflow-hidden overflow-x-auto"><DataTable actions={actions} bodyData={vm.empresasTable} headerColumns={['RUC', 'Razon Social', 'Rubro', 'Plan', 'Uso Mensual', 'Tienda Virtual', 'Expiración', 'Estado']} /></div>
              <div className="mt-4 pt-4 border-t border-gray-100"><Pagination pages={vm.pages} currentPage={vm.currentPageState} setcurrentPage={vm.setCurrentPageState} indexOfFirstItem={vm.indexOfFirstItem} indexOfLastItem={Math.min(vm.indexOfLastItem, vm.totalEmpresas)} total={vm.totalEmpresas} setitemsPerPage={vm.setItemsPerPage} optionSelect={true} /></div>
            </>
          ) : !vm.loading && (
            <div className="py-12 text-center">
              <Icon icon="solar:buildings-3-linear" className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron empresas</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{vm.searchTerm ? 'Intenta con otros términos de búsqueda' : 'Aún no tienes empresas registradas'}</p>
              <Button variant="default" onClick={() => { vm.setEmpresaEditingId(undefined); vm.setEmpresaModalMode('create'); vm.setOpenEmpresaModal(true); }} className="mt-4"><Icon icon="solar:add-circle-bold" className="mr-2" />Crear Primera Empresa</Button>
            </div>
          )}
        </div>
      </div>
      <ModalConfirm isOpenModal={vm.isOpenModalConfirm} setIsOpenModal={vm.setIsOpenModalConfirm}
        title={vm.selectedEmpresa?.accion === 'eliminar' ? 'Eliminar Empresa' : `${vm.selectedEmpresa?.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'} Empresa`}
        information={vm.selectedEmpresa?.accion === 'eliminar' ? `⚠️ Esta acción eliminará PERMANENTEMENTE la empresa "${vm.selectedEmpresa?.['Razon Social']}". Esta acción NO se puede deshacer.` : `¿Estás seguro que deseas ${vm.selectedEmpresa?.estado === 'ACTIVO' ? 'desactivar' : 'activar'} la empresa "${vm.selectedEmpresa?.['Razon Social']}"?`}
        confirmSubmit={vm.confirmAction}
      />
      <EmpresaFormModal open={vm.openEmpresaModal} mode={vm.empresaModalMode} empresaId={vm.empresaEditingId} onClose={() => vm.setOpenEmpresaModal(false)} onSaved={vm.refreshEmpresas} />
      <EmpresaDrawer empresa={vm.drawerEmpresa} onClose={() => vm.setDrawerEmpresa(null)} />
    </div>
  );
};

export default EmpresasIndex;