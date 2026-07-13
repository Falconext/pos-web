import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import { useCombustibleViewModel } from './useCombustibleViewModel';
import ModalCombustible from './shared/ModalCombustible';
import { TIPOS_COMBUSTIBLE } from './CombustibleModel';
import { format } from 'date-fns';

function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon icon={icon} width={22} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function CombustibleView() {
  const vm = useCombustibleViewModel();
  const { combustibles, resumen, actions } = vm;

  const tableActions = [
    { tooltip: 'Editar', icon: <Icon icon="solar:pen-bold-duotone" width={18} />, onClick: (d: any) => actions.openEditModal(d._original), color: 'blue' as const },
    { tooltip: 'Eliminar', icon: <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />, onClick: (d: any) => actions.handleDelete(d.id), color: 'rose' as const },
  ];

  const tableData = combustibles.map((c) => ({
    id: c.id,
    Vehículo: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Icon icon="solar:gas-station-bold-duotone" width={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.vehiculo?.placa ?? '—'}</p>
          <p className="text-xs text-gray-500">{[c.vehiculo?.marca, c.vehiculo?.modelo].filter(Boolean).join(' ')}</p>
        </div>
      </div>
    ),
    Fecha: <span className="text-sm text-gray-700 dark:text-gray-300">{format(new Date(c.fecha), 'dd/MM/yyyy')}</span>,
    'Combustible': (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-gray-700 dark:text-gray-300">{TIPOS_COMBUSTIBLE.find((t) => t.value === c.tipoCombustible)?.label ?? c.tipoCombustible}</span>
        <span className="text-xs text-gray-500">{Number(c.cantidadLitros).toFixed(2)} L{c.estacion ? ` · ${c.estacion}` : ''}</span>
      </div>
    ),
    'Costo': (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">S/ {Number(c.costoTotal).toFixed(2)}</span>
        {c.costoPorLitro != null && <span className="text-xs text-gray-500">S/ {Number(c.costoPorLitro).toFixed(2)}/L</span>}
      </div>
    ),
    'Odómetro': <span className="text-sm text-gray-600 dark:text-gray-400">{c.odometroKm != null ? `${c.odometroKm.toLocaleString()} km` : '—'}</span>,
    _original: c,
  }));

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Combustible</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control de cargas de combustible y consumo de la flota</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-emerald-600 border-none shadow-md shadow-emerald-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Registrar Carga
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard icon="solar:calendar-bold-duotone" label="Cargas del mes" value={resumen?.registrosMes ?? 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <KpiCard icon="solar:gas-station-bold-duotone" label="Litros del mes" value={`${Number(resumen?.litrosMes ?? 0).toFixed(0)} L`} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <KpiCard icon="solar:dollar-minimalistic-bold-duotone" label="Gasto del mes" value={`S/ ${Number(resumen?.gastoMes ?? 0).toFixed(2)}`} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <KpiCard icon="solar:wallet-bold-duotone" label="Gasto total" value={`S/ ${Number(resumen?.gastoTotal ?? 0).toFixed(2)}`} color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800">
          <InputPro name="search" placeholder="Buscar por estación o comprobante..." value={vm.searchTerm} onChange={(e) => vm.setSearchTerm(e.target.value)} />
        </div>
        <div className="p-0">
          <DataTable
            actions={tableActions}
            headerColumns={[
              { label: 'Vehículo', key: 'Vehículo' },
              { label: 'Fecha', key: 'Fecha' },
              { label: 'Combustible', key: 'Combustible' },
              { label: 'Costo', key: 'Costo' },
              { label: 'Odómetro', key: 'Odómetro' },
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalCombustible isOpen={vm.isModalOpen} onClose={() => vm.setIsModalOpen(false)} onSubmit={actions.handleCreateOrUpdate} registro={vm.selected} vehiculos={vm.vehiculos} />
    </div>
  );
}
