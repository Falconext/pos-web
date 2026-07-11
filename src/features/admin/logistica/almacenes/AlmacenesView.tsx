import React from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import { useAlmacenesViewModel } from './useAlmacenesViewModel';
import ModalAlmacen from './shared/ModalAlmacen';
import { format } from 'date-fns';

export default function AlmacenesView() {
  const vm = useAlmacenesViewModel();
  const { almacenes, actions } = vm;

  const tableActions = [
    {
      tooltip: 'Editar',
      icon: <Icon icon="solar:pen-bold-duotone" width={18} />,
      onClick: (data: any) => actions.openEditModal(data._original),
      color: 'blue' as const
    },
    {
      tooltip: 'Eliminar',
      icon: <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />,
      onClick: (data: any) => actions.handleDelete(data.id),
      color: 'rose' as const
    }
  ];

  const tableData = almacenes.map(almacen => {
    return {
      id: almacen.id,
      'Almacén': (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Icon icon="solar:box-minimalistic-bold-duotone" width={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{almacen.nombre}</p>
            <p className="text-xs text-gray-500">{almacen.direccion}</p>
          </div>
        </div>
      ),
      'Tipo': (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {almacen.tipo || '-'}
        </span>
      ),
      'Ubicación': (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {[almacen.distrito, almacen.ciudad].filter(Boolean).join(', ') || almacen.codigo || '-'}
        </span>
      ),
      'Estado': almacen.activo ? (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
          Operativo
        </span>
      ) : (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
          Inactivo
        </span>
      ),
      'Registro': (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(almacen.creadoEn), 'dd/MM/yyyy')}
        </span>
      ),
      _original: almacen
    };
  });

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Almacenes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de centros de distribución y depósitos</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-violet-600 border-none shadow-md shadow-violet-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nuevo Almacén
        </Button>
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 relative z-50 overflow-visible">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <InputPro
                name="search"
                placeholder="Buscar por nombre o dirección..."
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full lg:w-48">
              <select
                value={vm.activoFilter}
                onChange={(e) => vm.setActivoFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Todos los estados</option>
                <option value="true">Operativo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-0">
          <DataTable
            actions={tableActions}
            headerColumns={[
              { label: 'Almacén', key: 'Almacén' },
              { label: 'Tipo', key: 'Tipo' },
              { label: 'Ubicación', key: 'Ubicación' },
              { label: 'Estado', key: 'Estado' },
              { label: 'Registro', key: 'Registro' }
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalAlmacen 
        isOpen={vm.isModalOpen}
        onClose={() => vm.setIsModalOpen(false)}
        onSubmit={actions.handleCreateOrUpdate}
        almacen={vm.selectedAlmacen}
      />
    </div>
  );
}
