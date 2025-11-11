import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useNotificacionesStore } from '../zustand/notificaciones';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificacionesCampana: React.FC = () => {
  const {
    notificaciones,
    noLeidas,
    loading,
    mostrarPanel,
    sonidoHabilitado,
    pushHabilitado,
    obtenerNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    togglePanel,
    cerrarPanel,
    iniciarWebSocket,
    detenerWebSocket,
    toggleSonido,
    togglePush,
    solicitarPermisoPush,
  } = useNotificacionesStore();

  const panelRef = useRef<HTMLDivElement>(null);
  const [mostrarConfig, setMostrarConfig] = useState(false);

  useEffect(() => {
    // Obtener notificaciones iniciales
    obtenerNotificaciones();
    
    // Iniciar WebSocket para notificaciones en tiempo real
    iniciarWebSocket();

    // Detener WebSocket al desmontar
    return () => {
      detenerWebSocket();
    };
  }, [obtenerNotificaciones, iniciarWebSocket, detenerWebSocket]);

  useEffect(() => {
    // Cerrar panel al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        cerrarPanel();
      }
    };

    if (mostrarPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarPanel, cerrarPanel]);

  const handleNotificacionClick = async (notificacion: any) => {
    if (!notificacion.leida) {
      await marcarComoLeida(notificacion.id);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'CRITICAL':
        return { icon: 'material-symbols:error', color: 'text-red-500' };
      case 'WARNING':
        return { icon: 'material-symbols:warning', color: 'text-yellow-500' };
      case 'INFO':
      default:
        return { icon: 'material-symbols:info', color: 'text-blue-500' };
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es });
    } catch {
      return 'Hace un momento';
    }
  };

  console.log(notificaciones);

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón de Campana */}
      <button
        onClick={togglePanel}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Icon icon="material-symbols:notifications" className="h-6 w-6 text-gray-700" />
        
        {/* Badge de notificaciones no leídas */}
        {noLeidas > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel de Notificaciones */}
      {mostrarPanel && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Notificaciones</h3>
                <p className="text-sm text-gray-600">
                  {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMostrarConfig(!mostrarConfig)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  title="Configuración"
                >
                  <Icon icon="material-symbols:settings" className="h-5 w-5 text-gray-600" />
                </button>
                {noLeidas > 0 && (
                  <button
                    onClick={marcarTodasComoLeidas}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Marcar todas
                  </button>
                )}
              </div>
            </div>

            {/* Panel de Configuración */}
            {mostrarConfig && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon icon="material-symbols:volume-up" className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Sonido</span>
                  </div>
                  <button
                    onClick={toggleSonido}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sonidoHabilitado ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sonidoHabilitado ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon icon="material-symbols:notifications-active" className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Push Notifications</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (!pushHabilitado) {
                        await solicitarPermisoPush();
                      } else {
                        togglePush();
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      pushHabilitado ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        pushHabilitado ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <Icon icon="material-symbols:info" className="h-3 w-3" />
                  <span>Notificaciones en tiempo real vía WebSocket</span>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Notificaciones */}
          <div className="overflow-y-auto flex-1">
            {loading && notificaciones?.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Icon icon="line-md:loading-loop" className="h-8 w-8 text-blue-500" />
              </div>
            ) : notificaciones?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Icon icon="material-symbols:notifications-off" className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-center">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notificaciones?.map((notificacion) => {
                  const { icon, color } = getTipoIcon(notificacion.tipo);
                  
                  return (
                    <div
                      key={notificacion.id}
                      onClick={() => handleNotificacionClick(notificacion)}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notificacion.leida ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icono */}
                        <div className={`flex-shrink-0 ${color}`}>
                          <Icon icon={icon} className="h-6 w-6" />
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {notificacion.titulo}
                            </h4>
                            {!notificacion.leida && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notificacion.mensaje}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatFecha(notificacion.creadoEn)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificaciones?.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  cerrarPanel();
                  // Aquí podrías navegar a una página de todas las notificaciones
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificacionesCampana;
