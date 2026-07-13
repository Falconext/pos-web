import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import { useGeocercasViewModel } from './useGeocercasViewModel';
import ModalGeocerca from './shared/ModalGeocerca';
import { TIPOS_GEOCERCA } from './GeocercasModel';
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

export default function GeocercasView() {
  const vm = useGeocercasViewModel();
  const { geocercas, eventos, resumen, actions } = vm;

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Geocercas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Zonas vigiladas que generan alertas de entrada y salida de la flota</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-indigo-600 border-none shadow-md shadow-indigo-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nueva Geocerca
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <KpiCard icon="solar:map-bold-duotone" label="Geocercas" value={resumen?.total ?? 0} color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        <KpiCard icon="solar:check-circle-bold-duotone" label="Activas" value={resumen?.activas ?? 0} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <KpiCard icon="solar:bell-bing-bold-duotone" label="Eventos" value={resumen?.eventos ?? 0} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
          {geocercas.map((g) => (
            <div key={g.id} className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: (g.color || '#6366f1') + '22', color: g.color || '#6366f1' }}>
                    <Icon icon="solar:map-point-wave-bold-duotone" width={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{g.nombre}</p>
                    <p className="text-xs text-gray-500">{TIPOS_GEOCERCA.find((t) => t.value === g.tipo)?.label}{g.radio ? ` · ${Number(g.radio).toFixed(0)} m` : ''}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${g.activo ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {g.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              {g.descripcion && <p className="text-xs text-gray-500 mt-3">{g.descripcion}</p>}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><Icon icon="solar:point-on-map-bold" width={13} /> {g.lat != null ? `${Number(g.lat).toFixed(4)}, ${Number(g.lng).toFixed(4)}` : '—'}</span>
                <span className="flex items-center gap-1"><Icon icon="solar:bell-bold" width={13} /> {g._count?.eventos ?? 0} eventos</span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
                <button onClick={() => actions.openEditModal(g)} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-1">
                  <Icon icon="solar:pen-bold" width={14} /> Editar
                </button>
                <button onClick={() => actions.handleDelete(g.id)} className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg flex items-center gap-1">
                  <Icon icon="solar:trash-bin-trash-bold" width={14} /> Eliminar
                </button>
              </div>
            </div>
          ))}
          {geocercas.length === 0 && (
            <div className="md:col-span-2 text-center py-16 text-gray-400">
              <Icon icon="solar:map-bold-duotone" width={48} className="mx-auto mb-3 opacity-40" />
              <p>No hay geocercas registradas aún</p>
            </div>
          )}
        </div>

        {/* Eventos recientes */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="solar:history-bold-duotone" width={18} className="text-amber-500" /> Eventos recientes
          </h3>
          <div className="space-y-3">
            {eventos.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${e.tipo === 'ENTRADA' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                  <Icon icon={e.tipo === 'ENTRADA' ? 'solar:login-3-bold' : 'solar:logout-3-bold'} width={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{e.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} · {e.geocerca?.nombre}</p>
                  <p className="text-[11px] text-gray-400">{e.dispositivo?.nombre ?? 'Dispositivo'} · {format(new Date(e.timestamp), 'dd/MM HH:mm')}</p>
                </div>
              </div>
            ))}
            {eventos.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Sin eventos todavía</p>}
          </div>
        </div>
      </div>

      <ModalGeocerca isOpen={vm.isModalOpen} onClose={() => vm.setIsModalOpen(false)} onSubmit={actions.handleCreateOrUpdate} geocerca={vm.selected} />
    </div>
  );
}
