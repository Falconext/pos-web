import React, { useEffect, useState } from 'react';
import { useCajaStore } from '../../../zustand/caja';
import { Icon } from '@iconify/react';
import Alert from '../../../components/Alert';

const CajaDashboard: React.FC = () => {
  const {
    estadoCaja,
    loading,
    error,
    obtenerEstadoCaja,
    abrirCaja,
    cerrarCaja,
    clearError
  } = useCajaStore();

  const [showApertura, setShowApertura] = useState(false);
  const [showCierre, setShowCierre] = useState(false);
  const [formApertura, setFormApertura] = useState({
    montoInicial: 0,
    observaciones: ''
  });
  const [formCierre, setFormCierre] = useState({
    montoEfectivo: 0,
    montoYape: 0,
    montoPlin: 0,
    montoTransferencia: 0,
    montoTarjeta: 0,
    observaciones: ''
  });

  useEffect(() => {
    obtenerEstadoCaja();
  }, [obtenerEstadoCaja]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleAbrirCaja = async () => {
    const result = await abrirCaja(formApertura);
    if (result.success) {
      setShowApertura(false);
      setFormApertura({ montoInicial: 0, observaciones: '' });
    }
  };

  const handleCerrarCaja = async () => {
    const result = await cerrarCaja(formCierre);
    if (result.success) {
      setShowCierre(false);
      setFormCierre({
        montoEfectivo: 0,
        montoYape: 0,
        montoPlin: 0,
        montoTransferencia: 0,
        montoTarjeta: 0,
        observaciones: ''
      });
    }
  };

  const getEstadoBadge = () => {
    if (!estadoCaja) return null;
    
    const { estado } = estadoCaja;
    const badgeClasses = {
      CERRADA: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm',
      ABIERTA: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm',
      PENDIENTE_CIERRE: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm'
    };

    return (
      <span className={badgeClasses[estado] || badgeClasses.CERRADA}>
        {estado === 'CERRADA' && '🔒 Turno Cerrado'}
        {estado === 'ABIERTA' && '✅ Turno Abierto'}
        {estado === 'PENDIENTE_CIERRE' && '⏳ Pendiente Cierre'}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading && !estadoCaja) {
    return (
      <div className="min-h-screen md:px-8 pt-0 md:pt-5">
        <div className="flex items-center justify-center min-h-[400px]">
          <Icon icon="line-md:loading-loop" className="h-8 w-8" />
          <span className="ml-2">Cargando estado del turno...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:px-8 pt-0 md:pt-5 pb-10">
      <Alert />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Turnos</h1>
          <p className="text-gray-600">
            Gestiona la apertura y cierre de turnos de trabajo
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getEstadoBadge()}
          <Icon icon="material-symbols:calendar-today" className="h-4 w-4" />
          <span className="text-sm font-medium">
            {new Date().toLocaleDateString('es-PE')}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <Icon icon="material-symbols:error-circle-rounded" className="h-4 w-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Estado de Caja */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Estado Actual */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
            <Icon icon="material-symbols:wallet" className="h-5 w-5" />
            Estado Actual del Turno
          </h3>
          {estadoCaja ? (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-gray-50">
                {getEstadoBadge()}
                <p className="text-sm text-gray-600 mt-2">
                  {estadoCaja.estado === 'CERRADA' && 'El turno está cerrado. Puedes abrir un nuevo turno.'}
                  {estadoCaja.estado === 'ABIERTA' && 'El turno está abierto y listo para operaciones.'}
                  {estadoCaja.estado === 'PENDIENTE_CIERRE' && 'El turno requiere cierre para finalizar.'}
                </p>
              </div>

              {estadoCaja.movimiento && (
                <div className="space-y-2 text-sm">
                  <p><strong>Última operación:</strong> {estadoCaja.movimiento.tipoMovimiento}</p>
                  <p><strong>Fecha:</strong> {new Date(estadoCaja.movimiento.fecha).toLocaleString('es-PE')}</p>
                  {estadoCaja.movimiento.montoInicial && (
                    <p><strong>Monto inicial:</strong> {formatCurrency(Number(estadoCaja.movimiento.montoInicial))}</p>
                  )}
                  {estadoCaja.movimiento.observaciones && (
                    <p><strong>Observaciones:</strong> {estadoCaja.movimiento.observaciones}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {estadoCaja.estado === 'CERRADA' && (
                  <button 
                    onClick={() => setShowApertura(true)} 
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Abrir Turno
                  </button>
                )}
                {estadoCaja.estado === 'ABIERTA' && (
                  <button 
                    onClick={() => setShowCierre(true)} 
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                  >
                    Cerrar Turno
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-600">
              Sin información de turno disponible
            </p>
          )}
        </div>

        {/* Resumen de Ventas del Día */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
            <Icon icon="material-symbols:trending-up" className="h-5 w-5" />
            Ventas del Día
          </h3>
          {estadoCaja?.ventasDelDia ? (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-blue-50">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(estadoCaja.ventasDelDia.totalIngresos)}
                </p>
                <p className="text-sm text-gray-600">Total Ingresos</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Comprobantes</p>
                  <p>Formales: {estadoCaja.ventasDelDia.totalComprobantesFormales}</p>
                  <p>Informales: {estadoCaja.ventasDelDia.totalComprobantesInformales}</p>
                  <p>Pagos: {estadoCaja.ventasDelDia.totalPagos}</p>
                </div>
                <div>
                  <p className="font-medium">Por Medio de Pago</p>
                  <p>💵 {formatCurrency(estadoCaja.ventasDelDia.mediosPago.EFECTIVO)}</p>
                  <p>📱 {formatCurrency(estadoCaja.ventasDelDia.mediosPago.YAPE + estadoCaja.ventasDelDia.mediosPago.PLIN)}</p>
                  <p>💳 {formatCurrency(estadoCaja.ventasDelDia.mediosPago.TARJETA)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-600">
              Sin ventas registradas hoy
            </p>
          )}
        </div>
      </div>

      {/* Modal de Apertura de Caja */}
      {showApertura && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md m-4">
            <h3 className="text-lg font-bold mb-4">Abrir Turno</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monto Inicial *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formApertura.montoInicial}
                  onChange={(e) => setFormApertura(prev => ({ 
                    ...prev, 
                    montoInicial: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea
                  value={formApertura.observaciones}
                  onChange={(e) => setFormApertura(prev => ({ 
                    ...prev, 
                    observaciones: e.target.value 
                  }))}
                  placeholder="Observaciones opcionales..."
                  className="w-full p-2 border border-gray-300 rounded-lg h-20"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setShowApertura(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAbrirCaja}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <Icon icon="line-md:loading-loop" className="h-4 w-4 mx-auto" /> : 'Abrir Turno'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cierre de Caja */}
      {showCierre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg m-4">
            <h3 className="text-lg font-bold mb-2">Cerrar Turno</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Importante:</strong> Ingresa solo los montos físicos que contaste de <strong>este turno</strong>. 
              No incluyas dinero de turnos anteriores.
            </p>
            {estadoCaja?.ventasDelDia && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm font-medium text-blue-800">Ventas del turno actual:</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(estadoCaja.ventasDelDia.totalIngresos)}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>💵 Efectivo: {formatCurrency(estadoCaja.ventasDelDia.mediosPago.EFECTIVO)}</div>
                  <div>📱 Yape: {formatCurrency(estadoCaja.ventasDelDia.mediosPago.YAPE)}</div>
                  <div>📱 Plin: {formatCurrency(estadoCaja.ventasDelDia.mediosPago.PLIN)}</div>
                  <div>💳 Tarjeta: {formatCurrency(estadoCaja.ventasDelDia.mediosPago.TARJETA)}</div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {['montoEfectivo', 'montoYape', 'montoPlin', 'montoTransferencia', 'montoTarjeta'].map((field, index) => {
                  const labels = ['Efectivo *', 'Yape', 'Plin', 'Transferencia', 'Tarjeta'];
                  return (
                    <div key={field}>
                      <label className="block text-sm font-medium mb-1">{labels[index]}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formCierre[field as keyof typeof formCierre] as number}
                        onChange={(e) => setFormCierre(prev => ({ 
                          ...prev, 
                          [field]: parseFloat(e.target.value) || 0 
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t pt-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-sm">Total Declarado:</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(
                      formCierre.montoEfectivo + 
                      formCierre.montoYape + 
                      formCierre.montoPlin + 
                      formCierre.montoTransferencia + 
                      formCierre.montoTarjeta
                    )}
                  </p>
                  {estadoCaja?.ventasDelDia && (
                    <p className="text-sm text-gray-600">
                      Sistema: {formatCurrency(estadoCaja.ventasDelDia.totalIngresos)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea
                  value={formCierre.observaciones}
                  onChange={(e) => setFormCierre(prev => ({ 
                    ...prev, 
                    observaciones: e.target.value 
                  }))}
                  placeholder="Observaciones del cierre..."
                  className="w-full p-2 border border-gray-300 rounded-lg h-20"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setShowCierre(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCerrarCaja}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? <Icon icon="line-md:loading-loop" className="h-4 w-4 mx-auto" /> : 'Cerrar Turno'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CajaDashboard;