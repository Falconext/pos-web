import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import { usePeajesViewModel } from './usePeajesViewModel';
import ModalPeaje from './shared/ModalPeaje';
import { TIPOS_PEAJE, ESTADOS_PEAJE, BADGE_COLORS } from './PeajesModel';
import { format } from 'date-fns';

function Badge({ value, options }: { value: string; options: typeof ESTADOS_PEAJE }) {
  const obj = options.find((o) => o.value === value);
  if (!obj) return null;
  return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${BADGE_COLORS[obj.color] || BADGE_COLORS.gray}`}>{obj.label}</span>;
}

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

export default function PeajesView() {
  const vm = usePeajesViewModel();
  const { peajes, resumen, actions } = vm;

  const tableActions = [
    { tooltip: 'Editar', icon: <Icon icon="solar:pen-bold-duotone" width={18} />, onClick: (d: any) => actions.openEditModal(d._original), color: 'blue' as const },
    { tooltip: 'Eliminar', icon: <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />, onClick: (d: any) => actions.handleDelete(d.id), color: 'rose' as const },
  ];

  const tableData = peajes.map((p) => ({
    id: p.id,
    'Tipo / Detalle': (
      <div className="flex flex-col gap-1">
        <Badge value={p.tipo} options={TIPOS_PEAJE} />
        {p.descripcion && <span className="text-sm text-gray-600 dark:text-gray-300">{p.descripcion}</span>}
        {p.lugar && <span className="text-xs text-gray-500 flex items-center gap-1"><Icon icon="solar:map-point-bold" width={13} /> {p.lugar}</span>}
      </div>
    ),
    Vehículo: (
      <span className="text-sm text-gray-700 dark:text-gray-300">{p.vehiculo?.placa ?? p.placa ?? '—'}</span>
    ),
    Fecha: <span className="text-sm text-gray-700 dark:text-gray-300">{format(new Date(p.fecha), 'dd/MM/yyyy')}</span>,
    Monto: <span className="text-sm font-medium text-gray-700 dark:text-gray-300">S/ {Number(p.monto).toFixed(2)}</span>,
    Estado: <Badge value={p.estado} options={ESTADOS_PEAJE} />,
    _original: p,
  }));

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Peajes y Multas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Peajes, multas e infracciones de la flota con su estado de pago</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-rose-600 border-none shadow-md shadow-rose-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nuevo Registro
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard icon="solar:bell-bing-bold-duotone" label="Pendientes" value={resumen?.pendientesCount ?? 0} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <KpiCard icon="solar:banknote-2-bold-duotone" label="Monto pendiente" value={`S/ ${Number(resumen?.montoPendiente ?? 0).toFixed(2)}`} color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
        <KpiCard icon="solar:check-circle-bold-duotone" label="Monto pagado" value={`S/ ${Number(resumen?.montoPagado ?? 0).toFixed(2)}`} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <KpiCard icon="solar:wallet-bold-duotone" label="Monto total" value={`S/ ${Number(resumen?.montoTotal ?? 0).toFixed(2)}`} color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <InputPro name="search" placeholder="Buscar por lugar, descripción o placa..." value={vm.searchTerm} onChange={(e) => vm.setSearchTerm(e.target.value)} />
            </div>
            <div className="w-full lg:w-44">
              <select value={vm.tipoFilter} onChange={(e) => vm.setTipoFilter(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-rose-500">
                <option value="">Todos los tipos</option>
                {TIPOS_PEAJE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="w-full lg:w-44">
              <select value={vm.estadoFilter} onChange={(e) => vm.setEstadoFilter(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-rose-500">
                <option value="">Todos los estados</option>
                {ESTADOS_PEAJE.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="p-0">
          <DataTable
            actions={tableActions}
            headerColumns={[
              { label: 'Tipo / Detalle', key: 'Tipo / Detalle' },
              { label: 'Vehículo', key: 'Vehículo' },
              { label: 'Fecha', key: 'Fecha' },
              { label: 'Monto', key: 'Monto' },
              { label: 'Estado', key: 'Estado' },
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalPeaje isOpen={vm.isModalOpen} onClose={() => vm.setIsModalOpen(false)} onSubmit={actions.handleCreateOrUpdate} registro={vm.selected} vehiculos={vm.vehiculos} />
    </div>
  );
}
