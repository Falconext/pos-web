import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import Alert from '../../../components/Alert';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ReporteTurno {
  turno: string;
  fecha: string;
  movimientos: any[];
  resumen: {
    totalAperturas: number;
    totalCierres: number;
    montoInicialTotal: number;
    montoFinalTotal: number;
    diferenciasTotal: number;
    totalVentas: number;
    mediosPago: {
      EFECTIVO: number;
      YAPE: number;
      PLIN: number;
      TRANSFERENCIA: number;
      TARJETA: number;
    };
  };
}

const ReporteTurno: React.FC = () => {
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<string>('MAÑANA');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reporte, setReporte] = useState<ReporteTurno | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const turnos = [
    { value: 'MAÑANA', label: '🌅 Mañana (6:00 - 14:00)', color: 'from-yellow-400 to-orange-400' },
    { value: 'TARDE', label: '☀️ Tarde (14:00 - 22:00)', color: 'from-orange-400 to-red-400' },
    { value: 'NOCHE', label: '🌙 Noche (22:00 - 6:00)', color: 'from-indigo-400 to-purple-400' },
  ];

  const obtenerReporte = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ACCESS_TOKEN');

      const response = await axios.get(
        `${API_URL}/caja/reporte-turno?turno=${turnoSeleccionado}&fecha=${fecha}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // El backend responde envuelto en { code, message, data }
      const payload = response.data?.data ?? response.data;
      setReporte(payload);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerReporte();
  }, [turnoSeleccionado, fecha]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const turnoActual = turnos.find((t) => t.value === turnoSeleccionado);

  return (
    <div className="min-h-screen md:px-8 pt-0 md:pt-5 pb-10">
      <Alert />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Reporte de Turno</h1>
        <p className="text-gray-600">Visualiza el detalle de ventas y movimientos por turno</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Seleccionar Turno</label>
            <div className="grid grid-cols-1 gap-2">
              {turnos.map((turno) => (
                <button
                  key={turno.value}
                  onClick={() => setTurnoSeleccionado(turno.value)}
                  className={`p-4 rounded-xl text-left font-semibold transition-all ${
                    turnoSeleccionado === turno.value
                      ? `bg-gradient-to-r ${turno.color} text-white shadow-lg scale-105`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {turno.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <button
              onClick={obtenerReporte}
              className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icon icon="material-symbols:refresh" className="inline h-5 w-5 mr-2" />
              Actualizar Reporte
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon icon="line-md:loading-loop" className="h-8 w-8" />
          <span className="ml-2">Cargando reporte...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <Icon icon="material-symbols:error" className="inline h-5 w-5 mr-2" />
          {error}
        </div>
      ) : reporte ? (
        <>
          {/* Resumen General */}
          <div className={`bg-gradient-to-r ${turnoActual?.color} rounded-xl p-8 mb-6 text-white shadow-xl`}>
            <h2 className="text-2xl font-bold mb-6">{turnoActual?.label}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm opacity-90">Aperturas</p>
                <p className="text-3xl font-bold">{reporte.resumen.totalAperturas}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm opacity-90">Cierres</p>
                <p className="text-3xl font-bold">{reporte.resumen.totalCierres}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm opacity-90">Total Ventas</p>
                <p className="text-2xl font-bold">{formatCurrency(reporte.resumen.totalVentas)}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm opacity-90">Diferencia</p>
                <p className={`text-2xl font-bold ${reporte.resumen.diferenciasTotal >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {formatCurrency(reporte.resumen.diferenciasTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Medios de Pago */}
          <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon icon="material-symbols:payments" className="h-6 w-6" />
              Medios de Pago
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">💵</span>
                  <Icon icon="material-symbols:trending-up" className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Efectivo</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(reporte.resumen.mediosPago.EFECTIVO)}
                </p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📱</span>
                  <Icon icon="material-symbols:trending-up" className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Yape</p>
                <p className="text-xl font-bold text-purple-700">
                  {formatCurrency(reporte.resumen.mediosPago.YAPE)}
                </p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📲</span>
                  <Icon icon="material-symbols:trending-up" className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Plin</p>
                <p className="text-xl font-bold text-blue-700">
                  {formatCurrency(reporte.resumen.mediosPago.PLIN)}
                </p>
              </div>
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🏦</span>
                  <Icon icon="material-symbols:trending-up" className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="text-sm text-gray-600">Transferencia</p>
                <p className="text-xl font-bold text-indigo-700">
                  {formatCurrency(reporte.resumen.mediosPago.TRANSFERENCIA)}
                </p>
              </div>
              <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">💳</span>
                  <Icon icon="material-symbols:trending-up" className="h-5 w-5 text-pink-600" />
                </div>
                <p className="text-sm text-gray-600">Tarjeta</p>
                <p className="text-xl font-bold text-pink-700">
                  {formatCurrency(reporte.resumen.mediosPago.TARJETA)}
                </p>
              </div>
            </div>
          </div>

          {/* Movimientos */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon icon="material-symbols:list" className="h-6 w-6" />
              Movimientos del Turno ({reporte.movimientos.length})
            </h3>
            {reporte.movimientos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon icon="material-symbols:inbox" className="h-12 w-12 mx-auto mb-2" />
                <p>No hay movimientos en este turno</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reporte.movimientos.map((mov: any) => (
                  <div
                    key={mov.id}
                    className={`border-l-4 p-4 rounded-lg ${
                      mov.tipoMovimiento === 'APERTURA'
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{mov.tipoMovimiento}</p>
                        <p className="text-sm text-gray-600">
                          {mov.usuario?.nombre || 'Sin usuario'} • {new Date(mov.fecha).toLocaleString('es-PE')}
                        </p>
                      </div>
                      <div className="text-right">
                        {mov.montoInicial && (
                          <p className="text-sm text-gray-600">
                            Inicial: <span className="font-bold">{formatCurrency(Number(mov.montoInicial))}</span>
                          </p>
                        )}
                        {mov.montoFinal && (
                          <p className="text-sm text-gray-600">
                            Final: <span className="font-bold">{formatCurrency(Number(mov.montoFinal))}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ReporteTurno;
