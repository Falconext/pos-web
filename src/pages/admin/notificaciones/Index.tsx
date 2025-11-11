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
        return { icon: 'material-symbols:error', color: 'text-red-500', bg: 'bg-red-50' };
      case 'WARNING':
        return { icon: 'material-symbols:warning', color: 'text-yellow-500', bg: 'bg-yellow-50' };
      case 'INFO':
      default:
        return { icon: 'material-symbols:info', color: 'text-blue-500', bg: 'bg-blue-50' };
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
    <div className="min-h-screen md:px-8 pt-0 md:pt-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones</h1>
          <p className="text-gray-600">
            {noLeidas > 0 ? `Tienes ${noLeidas} notificaciones sin leer` : 'Todas tus notificaciones están al día'}
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodasComoLeidas}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon icon="material-symbols:done-all" className="h-5 w-5" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-blue-900">{notificaciones?.length || 0}</p>
            </div>
            <Icon icon="material-symbols:notifications" className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Sin Leer</p>
              <p className="text-3xl font-bold text-red-900">{noLeidas || 0}</p>
            </div>
            <Icon icon="material-symbols:mark-email-unread" className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Leídas</p>
              <p className="text-3xl font-bold text-green-900">{(notificaciones?.length - noLeidas) || 0}</p>
            </div>
            <Icon icon="material-symbols:mark-email-read" className="h-12 w-12 text-green-500" />
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
        <div className="space-y-4">
          {notificaciones?.map((notificacion) => {
            const { icon, color, bg } = getTipoIcon(notificacion.tipo);

            return (
              <div
                key={notificacion.id}
                onClick={() => handleNotificacionClick(notificacion)}
                className={`bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border-l-4 ${
                  notificacion.tipo === 'CRITICAL'
                    ? 'border-red-500'
                    : notificacion.tipo === 'WARNING'
                    ? 'border-yellow-500'
                    : 'border-blue-500'
                } ${!notificacion.leida ? 'ring-2 ring-blue-200' : ''}`}
              >
                <div className="flex gap-4">
                  {/* Icono */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                    <Icon icon={icon} className={`h-6 w-6 ${color}`} />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{notificacion.titulo}</h3>
                        {!notificacion.leida && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Nueva
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          notificacion.tipo === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : notificacion.tipo === 'WARNING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {notificacion.tipo}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3">{notificacion.mensaje}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Icon icon="material-symbols:schedule" className="h-4 w-4" />
                        <span>{formatFecha(notificacion.creadoEn)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon="material-symbols:calendar-today" className="h-4 w-4" />
                        <span>{formatFechaCompleta(notificacion.creadoEn)}</span>
                      </div>
                    </div>
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
