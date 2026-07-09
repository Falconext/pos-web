import React from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import { useVehiculosViewModel } from './useVehiculosViewModel';
import ModalVehiculo from './shared/ModalVehiculo';
import { ESTADOS_VEHICULO, TIPOS_VEHICULO } from './VehiculosModel';

export default function VehiculosView() {
  const vm = useVehiculosViewModel();
  const { vehiculos, actions } = vm;

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

  const tableData = vehiculos.map(vehiculo => {
    const tipoObj = TIPOS_VEHICULO.find(t => t.value === vehiculo.tipo);
    const estadoObj = ESTADOS_VEHICULO.find(e => e.value === vehiculo.estado);
    const iconMap: Record<string, string> = {
      MOTO: 'solar:scooter-bold-duotone',
      AUTO: 'solar:car-bold-duotone',
      CAMIONETA: 'solar:car-bold-duotone',
      CAMION_LIGERO: 'solar:bus-bold-duotone',
      CAMION_PESADO: 'solar:bus-bold-duotone'
    };
    const estadoColors: Record<string, string> = {
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    };

    return {
      id: vehiculo.id,
      'Vehículo': (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <Icon icon={iconMap[vehiculo.tipo] || 'solar:car-bold-duotone'} width={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{vehiculo.placa}</p>
            <p className="text-xs text-gray-500">{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio ? `(${vehiculo.anio})` : ''}</p>
          </div>
        </div>
      ),
      'Tipo / Capacidad': (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{tipoObj?.label || vehiculo.tipo}</span>
          {(vehiculo.capacidadCargaKg || vehiculo.capacidadVolumenM3) && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Icon icon="solar:box-minimalistic-bold" width={12} />
              {vehiculo.capacidadCargaKg ? `${vehiculo.capacidadCargaKg}kg` : ''} 
              {vehiculo.capacidadCargaKg && vehiculo.capacidadVolumenM3 ? ' - ' : ''}
              {vehiculo.capacidadVolumenM3 ? `${vehiculo.capacidadVolumenM3}m³` : ''}
            </span>
          )}
        </div>
      ),
      'Kilometraje': (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {vehiculo.kilometrajeActual ? `${vehiculo.kilometrajeActual.toLocaleString()} km` : '-'}
        </span>
      ),
      'Estado': estadoObj ? (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${estadoColors[estadoObj.color] || estadoColors.gray}`}>
          {estadoObj.label}
        </span>
      ) : null,
      _original: vehiculo
    };
  });

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Vehículos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de flota y capacidades de transporte</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-violet-600 border-none shadow-md shadow-violet-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nuevo Vehículo
        </Button>
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 relative z-50 overflow-visible">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <InputPro
                name="search"
                placeholder="Buscar por placa, marca o modelo..."
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
                {ESTADOS_VEHICULO.map(est => (
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
              { label: 'Vehículo', key: 'Vehículo' },
              { label: 'Tipo / Capacidad', key: 'Tipo / Capacidad' },
              { label: 'Kilometraje', key: 'Kilometraje' },
              { label: 'Estado', key: 'Estado' }
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalVehiculo 
        isOpen={vm.isModalOpen}
        onClose={() => vm.setIsModalOpen(false)}
        onSubmit={actions.handleCreateOrUpdate}
        vehiculo={vm.selectedVehiculo}
      />
    </div>
  );
}
