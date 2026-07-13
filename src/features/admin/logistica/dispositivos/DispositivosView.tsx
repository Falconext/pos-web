import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import { useDispositivosViewModel } from './useDispositivosViewModel';
import ModalDispositivo from './shared/ModalDispositivo';
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

export default function DispositivosView() {
  const vm = useDispositivosViewModel();
  const { dispositivos, resumen, actions } = vm;

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dispositivos GPS</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rastreadores y app de conductor. Usa el token para reportar posiciones.</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-cyan-600 border-none shadow-md shadow-cyan-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nuevo Dispositivo
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <KpiCard icon="solar:gps-bold-duotone" label="Total" value={resumen?.total ?? 0} color="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" />
        <KpiCard icon="solar:wi-fi-router-bold-duotone" label="En línea" value={resumen?.online ?? 0} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <KpiCard icon="solar:signal-off-bold-duotone" label="Sin conexión" value={resumen?.offline ?? 0} color="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" />
      </div>

      <div className="mb-4 max-w-md">
        <InputPro name="search" placeholder="Buscar por nombre o IMEI..." value={vm.searchTerm} onChange={(e) => vm.setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {dispositivos.map((d) => (
          <div key={d.id} className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Icon icon="solar:smartphone-bold-duotone" width={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{d.nombre}</p>
                  <p className="text-xs text-gray-500">{d.identificador}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-medium ${d.online ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                <span className={`w-2 h-2 rounded-full ${d.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                {d.online ? 'En línea' : 'Offline'}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Token de acceso</p>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <span className="text-xs font-mono text-cyan-700 dark:text-cyan-300 truncate flex-1">{d.token}</span>
                <button onClick={() => actions.copiarToken(d.token)} className="text-gray-400 hover:text-cyan-600 shrink-0">
                  <Icon icon="solar:copy-bold" width={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1"><Icon icon="solar:bus-bold" width={14} /> {d.vehiculo?.placa ?? 'Sin vehículo'}</span>
              <span className="flex items-center gap-1"><Icon icon="solar:map-point-bold" width={14} /> {d._count?.posiciones ?? 0} posiciones</span>
            </div>
            <div className="mt-1 text-xs text-gray-400">
              Última conexión: {d.ultimaConexion ? format(new Date(d.ultimaConexion), 'dd/MM/yyyy HH:mm') : '—'}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={() => actions.openEditModal(d)} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-1">
                <Icon icon="solar:pen-bold" width={14} /> Editar
              </button>
              <button onClick={() => actions.handleDelete(d.id)} className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg flex items-center gap-1">
                <Icon icon="solar:trash-bin-trash-bold" width={14} /> Eliminar
              </button>
            </div>
          </div>
        ))}
        {dispositivos.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Icon icon="solar:gps-bold-duotone" width={48} className="mx-auto mb-3 opacity-40" />
            <p>No hay dispositivos registrados aún</p>
          </div>
        )}
      </div>

      <ModalDispositivo isOpen={vm.isModalOpen} onClose={() => vm.setIsModalOpen(false)} onSubmit={actions.handleCreateOrUpdate} dispositivo={vm.selected} vehiculos={vm.vehiculos} />
    </div>
  );
}
