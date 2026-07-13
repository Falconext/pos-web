import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import { useMantenimientoViewModel } from './useMantenimientoViewModel';
import ModalMantenimiento from './shared/ModalMantenimiento';
import {
  ESTADOS_MANTENIMIENTO,
  TIPOS_MANTENIMIENTO,
  BADGE_COLORS,
} from './MantenimientoModel';
import { format } from 'date-fns';

function Badge({ value, options }: { value: string; options: typeof ESTADOS_MANTENIMIENTO }) {
  const obj = options.find((o) => o.value === value);
  if (!obj) return null;
  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
        BADGE_COLORS[obj.color] || BADGE_COLORS.gray
      }`}
    >
      {obj.label}
    </span>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
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

export default function MantenimientoView() {
  const vm = useMantenimientoViewModel();
  const { mantenimientos, resumen, actions } = vm;

  const tableActions = [
    {
      tooltip: 'Editar',
      icon: <Icon icon="solar:pen-bold-duotone" width={18} />,
      onClick: (data: any) => actions.openEditModal(data._original),
      color: 'blue' as const,
    },
    {
      tooltip: 'Cancelar',
      icon: <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />,
      onClick: (data: any) => actions.handleDelete(data.id),
      color: 'rose' as const,
    },
  ];

  const tableData = mantenimientos.map((m) => ({
    id: m.id,
    Vehículo: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Icon icon="solar:bus-bold-duotone" width={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {m.vehiculo?.placa ?? '—'}
          </p>
          <p className="text-xs text-gray-500">
            {[m.vehiculo?.marca, m.vehiculo?.modelo].filter(Boolean).join(' ')}
          </p>
        </div>
      </div>
    ),
    'Tipo / Descripción': (
      <div className="flex flex-col gap-1">
        <Badge value={m.tipo} options={TIPOS_MANTENIMIENTO} />
        <span className="text-sm text-gray-600 dark:text-gray-300">{m.descripcion}</span>
        {m.taller && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Icon icon="solar:garage-bold" width={13} /> {m.taller}
          </span>
        )}
      </div>
    ),
    Programado: (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {format(new Date(m.fechaProgramada), 'dd/MM/yyyy')}
        </span>
        {m.odometroKm != null && (
          <span className="text-xs text-gray-500">{m.odometroKm.toLocaleString()} km</span>
        )}
      </div>
    ),
    Costo: (
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        S/ {Number(m.costo ?? 0).toFixed(2)}
      </span>
    ),
    Estado: <Badge value={m.estado} options={ESTADOS_MANTENIMIENTO} />,
    _original: m,
  }));

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Mantenimiento de Flota
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Historial de mantenimientos preventivos y correctivos de tus vehículos
          </p>
        </div>
        <Button
          color="secondary"
          onClick={actions.openNewModal}
          className="flex items-center gap-2 !bg-blue-600 border-none shadow-md shadow-blue-200/50"
        >
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nuevo Mantenimiento
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          icon="solar:calendar-mark-bold-duotone"
          label="Pendientes"
          value={resumen?.pendientes ?? 0}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <KpiCard
          icon="solar:settings-bold-duotone"
          label="En Proceso"
          value={resumen?.enProceso ?? 0}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <KpiCard
          icon="solar:check-circle-bold-duotone"
          label="Completados"
          value={resumen?.completados ?? 0}
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <KpiCard
          icon="solar:dollar-minimalistic-bold-duotone"
          label="Costo total"
          value={`S/ ${Number(resumen?.costoTotalCompletados ?? 0).toFixed(2)}`}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        />
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 relative z-50 overflow-visible">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <InputPro
                name="search"
                placeholder="Buscar por descripción o taller..."
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full lg:w-44">
              <select
                value={vm.tipoFilter}
                onChange={(e) => vm.setTipoFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                {TIPOS_MANTENIMIENTO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full lg:w-44">
              <select
                value={vm.estadoFilter}
                onChange={(e) => vm.setEstadoFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                {ESTADOS_MANTENIMIENTO.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
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
              { label: 'Tipo / Descripción', key: 'Tipo / Descripción' },
              { label: 'Programado', key: 'Programado' },
              { label: 'Costo', key: 'Costo' },
              { label: 'Estado', key: 'Estado' },
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalMantenimiento
        isOpen={vm.isModalOpen}
        onClose={() => vm.setIsModalOpen(false)}
        onSubmit={actions.handleCreateOrUpdate}
        mantenimiento={vm.selected}
        vehiculos={vm.vehiculos}
      />
    </div>
  );
}
