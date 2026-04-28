import { useNotificacionesViewModel } from '@/features/admin/notificaciones/useNotificacionesViewModel';
import { Icon } from '@iconify/react';

const NotificacionesPage = () => {
  const vm = useNotificacionesViewModel();
  const visibles = vm.notificaciones?.length || 0;
  const sinLeer = Math.max(0, vm.noLeidas || 0);
  const totalNotificaciones = Math.max(visibles, sinLeer);
  const leidas = Math.max(0, totalNotificaciones - sinLeer);

  if (vm.loading && vm.notificaciones.length === 0) {
    return (
      <div className="min-h-screen md:px-8 pt-0 md:pt-5 bg-gray-50 dark:bg-[#0A0D14]">
        <div className="flex items-center justify-center min-h-[400px] text-gray-400">
          <Icon icon="line-md:loading-loop" className="h-8 w-8" />
          <span className="ml-2">Cargando notificaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4 px-4 md:px-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Icon icon="solar:bell-bold-duotone" className="text-blue-600 dark:text-blue-400" />
            Notificaciones
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Centro de alertas y mensajes del sistema</p>
        </div>
        {sinLeer > 0 && (
          <button onClick={vm.marcarTodasComoLeidas} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 font-bold text-sm">
            <Icon icon="solar:check-read-bold" className="text-lg" />Marcar todas como leídas
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p><p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalNotificaciones}</p></div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"><Icon icon="solar:bell-bold" className="text-xl text-white" /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sin Leer</p><p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{sinLeer}</p></div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20"><Icon icon="solar:letter-unread-bold" className="text-xl text-white" /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leídas</p><p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{leidas}</p></div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><Icon icon="solar:letter-opened-bold" className="text-xl text-white" /></div>
          </div>
        </div>
      </div>
      {vm.notificaciones?.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-900/50 mb-4"><Icon icon="solar:bell-off-linear" className="h-10 w-10 text-gray-400 dark:text-gray-600" /></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tienes notificaciones</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">Cuando recibas notificaciones importantes, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vm.notificaciones?.map((notificacion) => {
            const { icon, iconColor } = vm.getTipoIcon(notificacion.tipo);
            return (
              <div key={notificacion.id} onClick={() => vm.handleNotificacionClick(notificacion)}
                className={`bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all cursor-pointer overflow-hidden ${!notificacion.leida ? 'ring-2 ring-blue-400 dark:ring-blue-500/50' : ''}`}>
                <div className="p-4 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center"><Icon icon={icon} className={`h-5 w-5 ${iconColor}`} /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight">{notificacion.titulo}</h3>
                      {!notificacion.leida && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white mt-1 shadow-sm shadow-blue-500/20">Nueva</span>}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3 leading-relaxed">{notificacion.mensaje}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500"><Icon icon="solar:clock-circle-bold-duotone" className="h-3.5 w-3.5" /><span>{vm.formatFecha(notificacion.creadoEn)}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificacionesPage;
