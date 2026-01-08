import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNotificacionesStore } from '../../../zustand/notificaciones';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificacionesPage: React.FC = () => {
  const {
    notificaciones,
    noLeidas,
    loading,
    obtenerNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
  } = useNotificacionesStore();

  useEffect(() => {
    obtenerNotificaciones();
  }, [obtenerNotificaciones]);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'CRITICAL':
        return {
          icon: 'mdi:alert-circle',
          iconColor: 'text-red-400',
          iconBg: 'bg-white',

          badgeBg: 'bg-red-100',
          badgeText: 'text-red-800'
        };
      case 'WARNING':
        return {
          icon: 'mdi:alert',
          iconColor: 'text-yellow-400',
          iconBg: 'bg-white',

          badgeBg: 'bg-yellow-100',
          badgeText: 'text-yellow-800'
        };
      case 'INFO':
      default:
        return {
          icon: 'mdi:information',
          iconColor: 'text-blue-400',
          iconBg: 'bg-white',

          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-800'
        };
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es });
    } catch {
      return 'Hace un momento';
    }
  };

  const formatFechaCompleta = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fecha;
    }
  };

  const handleNotificacionClick = async (notificacion: any) => {
    if (!notificacion.leida) {
      await marcarComoLeida(notificacion.id);
    }
  };

  if (loading && notificaciones.length === 0) {
    return (
      <div className="min-h-screen md:px-8 pt-0 md:pt-5">
        <div className="flex items-center justify-center min-h-[400px]">
          <Icon icon="line-md:loading-loop" className="h-8 w-8" />
          <span className="ml-2">Cargando notificaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notificaciones</h1>
          <p className="text-sm text-gray-500 mt-1">Centro de alertas y mensajes del sistema</p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodasComoLeidas}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md font-medium text-sm"
          >
            <Icon icon="solar:check-read-bold" className="text-lg" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{notificaciones?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Icon icon="solar:bell-bold" className="text-xl text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sin Leer</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{noLeidas || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <Icon icon="solar:letter-unread-bold" className="text-xl text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Leídas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{(notificaciones?.length - noLeidas) || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Icon icon="solar:letter-opened-bold" className="text-xl text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Notificaciones */}
      {notificaciones?.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
            <Icon icon="solar:bell-off-linear" className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes notificaciones</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Cuando recibas notificaciones importantes, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notificaciones?.map((notificacion) => {
            const { icon, iconColor } = getTipoIcon(notificacion.tipo);

            return (
              <div
                key={notificacion.id}
                onClick={() => handleNotificacionClick(notificacion)}
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer overflow-hidden ${!notificacion.leida ? 'ring-2 ring-blue-400' : ''}`}
              >
                {/* Header con degradado y color */}
                <div className="p-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                      <Icon icon={icon} className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">{notificacion.titulo}</h3>
                      {!notificacion.leida && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white mt-1">
                          Nueva
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body blanco */}
                <div className="p-4">
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {notificacion.mensaje}
                  </p>

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Icon icon="solar:clock-circle-bold-duotone" className="h-3.5 w-3.5" />
                    <span>{formatFecha(notificacion.creadoEn)}</span>
                  </div>
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

