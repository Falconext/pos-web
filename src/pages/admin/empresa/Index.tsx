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
      {/* Vencimientos próximos */}
      {vm.proximasVencer.length > 0 && !vm.alertasDismissed && (
        <div className="mb-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Icon icon="solar:alarm-bold-duotone" className="text-amber-600 dark:text-amber-400 text-lg" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">Vencimientos próximos</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                  {vm.proximasVencer.length}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { vm.setFiltroPorVencer(!vm.filtroPorVencer); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${vm.filtroPorVencer ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-amber-400 hover:text-amber-600'}`}
              >
                {vm.filtroPorVencer ? 'Ver todas' : 'Filtrar en tabla'}
              </button>
              <button
                onClick={() => vm.setAlertasDismissed(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"
              >
                <Icon icon="solar:close-bold" width={14} />
              </button>
            </div>
          </div>
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-x-0 sm:divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-slate-800">
            {vm.proximasVencer.map((e: any) => {
              const dias = vm.getDiasRestantes(e.fechaExpiracion);
              const isCritico = dias <= 1;
              const isUrgente = dias > 1 && dias <= 3;
              const style = isCritico
                ? { bar: 'bg-red-500', badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400', text: 'text-red-600 dark:text-red-400', icon: 'solar:danger-bold-duotone' }
                : isUrgente
                ? { bar: 'bg-orange-500', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400', text: 'text-orange-600 dark:text-orange-400', icon: 'solar:fire-bold-duotone' }
                : { bar: 'bg-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400', text: 'text-amber-600 dark:text-amber-400', icon: 'solar:clock-circle-bold-duotone' };
              return (
                <button
                  key={e.id}
                  onClick={() => vm.setDrawerEmpresa(e)}
                  className="relative flex flex-col gap-1.5 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar}`} />
                  <div className="flex items-center justify-between gap-2 pl-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {e.nombreComercial || e.razonSocial}
                    </span>
                    <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                      {dias === 0 ? 'Hoy' : dias === 1 ? '1 día' : `${dias} días`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-1">
                    <Icon icon={style.icon} className={`text-base shrink-0 ${style.text}`} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {e.plan?.nombre || 'Sin plan'} · {new Date(e.fechaExpiracion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1"><InputPro name="search" onChange={vm.handleSearch} label="Buscar por RUC o razón social" isLabel value={vm.searchTerm} /></div>
            <div className="w-full lg:w-48"><Select name="tipoFiltro" label="Tipo" error={() => { }} options={[{ id: '', value: 'Todas' }, { id: 'FORMAL', value: 'Formales' }, { id: 'INFORMAL', value: 'Informales' }]} onChange={(id: any) => { vm.setTipoFiltro(id); vm.setCurrentPageState(1); }} withLabel /></div>
            <div className="w-full lg:w-40"><Select name="estadoFiltro" label="Estado" error={() => { }} options={[{ id: 'TODOS', value: 'Todos' }, { id: 'ACTIVO', value: 'Activos' }, { id: 'INACTIVO', value: 'Inactivos' }]} onChange={(id: any) => { vm.setEstadoFiltro(id); vm.setCurrentPageState(1); }} withLabel value={vm.estadoFiltro} /></div>
          </div>
          {vm.filtroPorVencer && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Filtros activos:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                <Icon icon="solar:alarm-bold-duotone" width={12} />
                Por vencer (7 días)
                <button onClick={() => vm.setFiltroPorVencer(false)} className="ml-0.5 hover:text-amber-900 dark:hover:text-amber-200">
                  <Icon icon="solar:close-bold" width={10} />
                </button>
              </span>
            </div>
          )}
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