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
    <div className="min-h-screen px-3 md:px-8 pt-0 md:pt-5 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {noLeidas > 0 && (
          <button
            onClick={marcarTodasComoLeidas}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
          >
            <Icon icon="material-symbols:done-all" className="h-5 w-5" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 md:p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-900">{notificaciones?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Icon icon="material-symbols:notifications" className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-5 md:p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-red-600 font-medium">Sin Leer</p>
              <p className="text-2xl md:text-3xl font-bold text-red-900">{noLeidas || 0}</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Icon icon="material-symbols:mark-email-unread" className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-5 md:p-6 shadow-md sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-green-600 font-medium">Leídas</p>
              <p className="text-2xl md:text-3xl font-bold text-green-900">{(notificaciones?.length - noLeidas) || 0}</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Icon icon="material-symbols:mark-email-read" className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Notificaciones */}
      {notificaciones?.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
            <Icon icon="material-symbols:notifications-off" className="h-10 w-10 text-gray-400" />
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
                className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden ${!notificacion.leida ? 'ring-2 ring-blue-400' : ''}`}
              >
                {/* Header con degradado y color */}
                <div className={`bg-gradient-to-r p-4 pb-3 border-b border-gray-200`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm`}>
                      <Icon icon={icon} className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="flex min-w-0 items-center">
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
                <div className="p-4 bg-white">
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {notificacion.mensaje}
                  </p>

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Icon icon="material-symbols:schedule" className="h-3.5 w-3.5" />
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
