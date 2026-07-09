import React from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import DataTable from '@/components/Datatable';
import { useZonasViewModel } from './useZonasViewModel';
import ModalZona from './shared/ModalZona';
import { format } from 'date-fns';

export default function ZonasView() {
  const vm = useZonasViewModel();
  const { zonas, actions } = vm;

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

  const tableData = zonas.map(zona => {
    return {
      id: zona.id,
      'Zona de Entrega': (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
            <Icon icon="solar:map-bold-duotone" width={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{zona.nombre}</p>
            <p className="text-xs text-gray-500 truncate max-w-xs">{zona.descripcion || 'Sin descripción'}</p>
          </div>
        </div>
      ),
      'Tarifa Base': (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {zona.tarifaBase ? `S/ ${Number(zona.tarifaBase).toFixed(2)}` : '-'}
        </span>
      ),
      'Estado': zona.activa ? (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
          Activa
        </span>
      ) : (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
          Inactiva
        </span>
      ),
      'Registro': (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(zona.creadoEn), 'dd/MM/yyyy')}
        </span>
      ),
      _original: zona
    };
  });

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Zonas de Entrega</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configuración de áreas geográficas para despachos y cobertura</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-violet-600 border-none shadow-md shadow-violet-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nueva Zona
        </Button>
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 relative z-50 overflow-visible flex justify-end">
          <div className="w-full lg:w-48">
            <select
              value={vm.activaFilter}
              onChange={(e) => vm.setActivaFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Todas las zonas</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>
        </div>

        <div className="p-0">
          <DataTable
            actions={tableActions}
            headerColumns={[
              { label: 'Zona de Entrega', key: 'Zona de Entrega' },
              { label: 'Tarifa Base', key: 'Tarifa Base' },
              { label: 'Estado', key: 'Estado' },
              { label: 'Registro', key: 'Registro' }
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalZona 
        isOpen={vm.isModalOpen}
        onClose={() => vm.setIsModalOpen(false)}
        onSubmit={actions.handleCreateOrUpdate}
        zona={vm.selectedZona}
      />
    </div>
  );
}
