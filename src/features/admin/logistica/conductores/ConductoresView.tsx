import React from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import { useConductoresViewModel } from './useConductoresViewModel';
import ModalConductor from './shared/ModalConductor';
import { ESTADOS_CONDUCTOR } from './ConductoresModel';
import { format } from 'date-fns';

export default function ConductoresView() {
  const vm = useConductoresViewModel();
  const { conductores, actions } = vm;

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

  const tableData = conductores.map(conductor => {
    const estadoObj = ESTADOS_CONDUCTOR.find(e => e.value === conductor.estado);
    const estadoColors: Record<string, string> = {
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    };

    return {
      id: conductor.id,
      'Conductor': (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Icon icon="solar:user-bold-duotone" width={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{conductor.nombre} {conductor.apellido}</p>
            <p className="text-xs text-gray-500">{conductor.tipoDocumento} {conductor.nroDocumento}</p>
          </div>
        </div>
      ),
      'Contacto / Licencia': (
        <div className="flex flex-col gap-0.5">
          {conductor.telefono && <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1"><Icon icon="solar:phone-bold" width={14}/> {conductor.telefono}</span>}
          {conductor.licenciaNro && <span className="text-xs text-gray-500 flex items-center gap-1"><Icon icon="solar:card-bold" width={14}/> Lic: {conductor.licenciaNro}</span>}
        </div>
      ),
      'Score GPS': (
        <div className="flex items-center gap-1.5">
          <Icon icon="solar:star-bold" className="text-amber-400" width={16} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{conductor.scoreGps ?? 'N/A'}</span>
        </div>
      ),
      'Estado': estadoObj ? (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${estadoColors[estadoObj.color] || estadoColors.gray}`}>
          {estadoObj.label}
        </span>
      ) : null,
      'Registro': (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(conductor.creadoEn), 'dd/MM/yyyy')}
        </span>
      ),
      _original: conductor
    };
  });

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Conductores</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Directorio de chóferes y repartidores para despachos</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-violet-600 border-none shadow-md shadow-violet-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nuevo Conductor
        </Button>
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 relative z-50 overflow-visible">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <InputPro
                name="search"
                placeholder="Buscar por nombre o documento..."
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full lg:w-48">
              <select
                value={vm.estadoFilter}
                onChange={(e) => vm.setEstadoFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Todos los estados</option>
                {ESTADOS_CONDUCTOR.map(est => (
                  <option key={est.value} value={est.value}>{est.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-0">
          <DataTable
            actions={tableActions}
            headerColumns={[
              { label: 'Conductor', key: 'Conductor' },
              { label: 'Contacto / Licencia', key: 'Contacto / Licencia' },
              { label: 'Score GPS', key: 'Score GPS' },
              { label: 'Estado', key: 'Estado' },
              { label: 'Registro', key: 'Registro' }
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalConductor 
        isOpen={vm.isModalOpen}
        onClose={() => vm.setIsModalOpen(false)}
        onSubmit={actions.handleCreateOrUpdate}
        conductor={vm.selectedConductor}
      />
    </div>
  );
}
