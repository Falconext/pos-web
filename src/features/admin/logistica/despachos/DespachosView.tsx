import React from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import DataTable from '@/components/Datatable';
import { useDespachosViewModel } from './useDespachosViewModel';
import ModalDespacho from './shared/ModalDespacho';
import ModalEstadoDespacho from './shared/ModalEstadoDespacho';
import { ESTADOS_DESPACHO } from './DespachosModel';
import { format } from 'date-fns';

export default function DespachosView() {
  const vm = useDespachosViewModel();
  const { despachos, conductores, vehiculos, almacenes, actions } = vm;

  const tableActions = [
    {
      onClick: (data: any) => actions.openStatusModal(data._original),
      icon: <Icon icon="solar:refresh-circle-bold-duotone" width={18} />,
      tooltip: 'Cambiar Estado',
      color: 'blue' as const
    }
  ];

  const tableData = despachos.map(despacho => {
    const estadoObj = ESTADOS_DESPACHO.find(e => e.value === despacho.estado);
    const colors: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
    };

    return {
      id: despacho.id,
      'Ruta / Despacho': (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Icon icon="solar:route-bold-duotone" width={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{despacho.codigo}</p>
            <p className="text-xs text-gray-500 font-semibold text-teal-600 dark:text-teal-400">
              {format(new Date(despacho.fechaProgramada + 'T00:00:00'), 'dd/MMM/yyyy')}
            </p>
          </div>
        </div>
      ),
      'Asignación': (
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]" title={despacho.conductor?.nombre + ' ' + despacho.conductor?.apellido}>
            <Icon icon="solar:user-bold" className="inline-block mr-1 text-gray-400" width={14}/>
            {despacho.conductor?.nombre} {despacho.conductor?.apellido}
          </p>
          <p className="text-xs text-gray-500">
            <Icon icon="solar:car-bold" className="inline-block mr-1 text-gray-400" width={14}/>
            {despacho.vehiculo?.placa} - {despacho.vehiculo?.marca}
          </p>
        </div>
      ),
      'Pedidos Asignados': (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs">
          <Icon icon="solar:box-bold-duotone" className="text-violet-500" width={14}/>
          {despacho._count?.pedidos || 0}
        </span>
      ),
      'Estado': estadoObj ? (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colors[estadoObj.color] || colors.gray}`}>
          {estadoObj.label}
        </span>
      ) : null,
      _original: despacho
    };
  });

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Despachos / Rutas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de hojas de ruta, vehículos y entregas consolidadas</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-violet-600 border-none shadow-md shadow-violet-200/50">
          <Icon icon="solar:route-bold-duotone" className="text-lg" />
          Nueva Ruta de Despacho
        </Button>
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 relative z-50 overflow-visible flex justify-end">
          <div className="w-full lg:w-48">
            <select
              value={vm.estadoFilter}
              onChange={(e) => vm.setEstadoFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Todos los estados</option>
              {ESTADOS_DESPACHO.map(est => (
                <option key={est.value} value={est.value}>{est.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-0">
          <DataTable
            actions={tableActions}
            headerColumns={[
              { label: 'Ruta / Despacho', key: 'Ruta / Despacho' },
              { label: 'Asignación', key: 'Asignación' },
              { label: 'Pedidos Asignados', key: 'Pedidos Asignados' },
              { label: 'Estado', key: 'Estado' },
              { label: 'Acciones', key: 'Acciones' }
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalDespacho 
        isOpen={vm.isModalOpen}
        onClose={() => vm.setIsModalOpen(false)}
        onSubmit={actions.handleCreate}
        conductores={conductores}
        vehiculos={vehiculos}
        almacenes={almacenes}
      />

      <ModalEstadoDespacho 
        isOpen={vm.isStatusModalOpen}
        onClose={() => vm.setIsStatusModalOpen(false)}
        onSubmit={actions.handleUpdateStatus}
        despacho={vm.selectedDespacho}
      />
    </div>
  );
}
