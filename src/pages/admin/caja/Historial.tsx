import React, { useEffect, useState } from 'react';
import { useCajaStore } from '../../../zustand/caja';
import { Icon } from '@iconify/react';
import Alert from '../../../components/Alert';

const HistorialCaja: React.FC = () => {
  const {
    historialCaja,
    loading,
    error,
    pagination,
    filters,
    obtenerHistorialCaja,
    setFilters,
    clearFilters,
    clearError
  } = useCajaStore();

  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    obtenerHistorialCaja(1, 50);
  }, [filters]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
  };

  const resetFilters = () => {
    clearFilters();
    const today = new Date().toISOString().split('T')[0];
    setLocalFilters({ fechaInicio: today, fechaFin: today });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'APERTURA':
        return <Icon icon="material-symbols:arrow-circle-up" className="h-4 w-4 text-green-600" />;
      case 'CIERRE':
        return <Icon icon="material-symbols:arrow-circle-down" className="h-4 w-4 text-red-600" />;
      default:
        return <Icon icon="material-symbols:attach-money" className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const badgeClasses = {
      APERTURA: 'bg-green-100 text-green-800 px-2 py-1 rounded text-sm',
      CIERRE: 'bg-red-100 text-red-800 px-2 py-1 rounded text-sm',
      INGRESO: 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm',
      EGRESO: 'bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm'
    };

    return (
      <span className={badgeClasses[tipo as keyof typeof badgeClasses] || badgeClasses.APERTURA}>
        {tipo}
      </span>
    );
  };

  if (loading && historialCaja?.length === 0) {
    return (
      <div className="min-h-screen md:px-8 pt-0 md:pt-5">
        <div className="flex items-center justify-center min-h-[400px]">
          <Icon icon="line-md:loading-loop" className="h-8 w-8" />
          <span className="ml-2">Cargando historial...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:px-8 pt-0 md:pt-5 pb-10">
      <Alert />
      
      {/* Header */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <Icon icon="material-symbols:error-circle-rounded" className="h-4 w-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl p-6 mb-6">
        <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
          <Icon icon="material-symbols:search" className="h-5 w-5" />
          Filtros de Búsqueda
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={localFilters.fechaInicio}
              onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha Fin</label>
            <input
              type="date"
              value={localFilters.fechaFin}
              onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end gap-2">
            <button 
              onClick={applyFilters} 
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Buscar
            </button>
            <button 
              onClick={resetFilters}
              className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Movimientos con Cards Modernas */}
      {historialCaja?.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
            <Icon icon="material-symbols:history" className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin movimientos</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            No se encontraron movimientos de caja para el período seleccionado. Intenta ajustar los filtros de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {historialCaja?.map((movimiento) => (
            <div
              key={movimiento.id}
              className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                movimiento.tipoMovimiento === 'APERTURA'
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200'
              }`}
            >
              {/* Header del Card */}
              <div className={`p-6 pb-4 ${
                movimiento.tipoMovimiento === 'APERTURA' ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      {getTipoIcon(movimiento.tipoMovimiento)}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {movimiento.tipoMovimiento}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {movimiento.turno || 'Sin turno'}
                      </p>
                    </div>
                  </div>
                  <Icon 
                    icon={movimiento.tipoMovimiento === 'APERTURA' 
                      ? "material-symbols:arrow-circle-up" 
                      : "material-symbols:arrow-circle-down"
                    } 
                    className="h-8 w-8 text-white/50" 
                  />
                </div>
              </div>

              {/* Body del Card */}
              <div className="p-6 space-y-4">
                {/* Usuario y Fecha */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Icon icon="material-symbols:person" className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      {movimiento.usuario?.nombre || 'Sin usuario'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Icon icon="material-symbols:calendar-today" className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date(movimiento.fecha).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <Icon icon="material-symbols:schedule" className="h-4 w-4 ml-2" />
                    <span className="text-sm">
                      {new Date(movimiento.fecha).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Montos Principales */}
                <div className="bg-white rounded-xl p-4 space-y-3">
                  {movimiento.montoInicial && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monto Inicial</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(Number(movimiento.montoInicial))}
                      </span>
                    </div>
                  )}
                  {movimiento.montoFinal && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Monto Final</span>
                        <span className="font-bold text-lg text-blue-600">
                          {formatCurrency(Number(movimiento.montoFinal))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Ventas</span>
                        <span className="font-bold text-lg text-purple-600">
                          {formatCurrency(Number(movimiento.totalVentas || 0))}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Medios de Pago (solo para cierres) */}
                {movimiento.tipoMovimiento === 'CIERRE' && (
                  <div className="bg-white rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Icon icon="material-symbols:payments" className="h-4 w-4" />
                      Medios de Pago
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {movimiento.montoEfectivo !== undefined && movimiento.montoEfectivo > 0 && (
                        <div className="flex items-center gap-1">
                          <span>💵</span>
                          <span className="font-mono">{formatCurrency(Number(movimiento.montoEfectivo))}</span>
                        </div>
                      )}
                      {movimiento.montoYape !== undefined && movimiento.montoYape > 0 && (
                        <div className="flex items-center gap-1">
                          <span>📱</span>
                          <span className="font-mono">{formatCurrency(Number(movimiento.montoYape))}</span>
                        </div>
                      )}
                      {movimiento.montoPlin !== undefined && movimiento.montoPlin > 0 && (
                        <div className="flex items-center gap-1">
                          <span>📲</span>
                          <span className="font-mono">{formatCurrency(Number(movimiento.montoPlin))}</span>
                        </div>
                      )}
                      {movimiento.montoTransferencia !== undefined && movimiento.montoTransferencia > 0 && (
                        <div className="flex items-center gap-1">
                          <span>🏦</span>
                          <span className="font-mono">{formatCurrency(Number(movimiento.montoTransferencia))}</span>
                        </div>
                      )}
                      {movimiento.montoTarjeta !== undefined && movimiento.montoTarjeta > 0 && (
                        <div className="flex items-center gap-1">
                          <span>💳</span>
                          <span className="font-mono">{formatCurrency(Number(movimiento.montoTarjeta))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Diferencia */}
                {movimiento.diferencia !== undefined && (
                  <div className={`rounded-xl p-4 ${
                    Number(movimiento.diferencia) > 0 
                      ? 'bg-green-100 border-2 border-green-300' 
                      : Number(movimiento.diferencia) < 0 
                      ? 'bg-red-100 border-2 border-red-300' 
                      : 'bg-gray-100 border-2 border-gray-300'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Diferencia</span>
                      <span className={`text-xl font-bold ${
                        Number(movimiento.diferencia) > 0 
                          ? 'text-green-700' 
                          : Number(movimiento.diferencia) < 0 
                          ? 'text-red-700' 
                          : 'text-gray-700'
                      }`}>
                        {formatCurrency(Number(movimiento.diferencia))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Observaciones */}
                {movimiento.observaciones && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                    <p className="text-xs text-amber-800 flex items-start gap-2">
                      <Icon icon="material-symbols:info" className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{movimiento.observaciones}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorialCaja;