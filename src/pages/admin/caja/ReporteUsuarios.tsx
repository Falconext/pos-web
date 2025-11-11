import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import Alert from '../../../components/Alert';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ReporteUsuarios {
  fechaInicio: string;
  fechaFin: string;
  usuarios: Array<{
    usuarioId: number;
    usuarioNombre: string;
    usuarioEmail: string;
    turnos: Array<{
      turno: string;
      aperturas: number;
      cierres: number;
      montoInicialTotal: number;
      montoFinalTotal: number;
      diferenciasTotal: number;
      movimientos: any[];
    }>;
    totales: {
      aperturas: number;
      cierres: number;
      montoInicialTotal: number;
      montoFinalTotal: number;
      diferenciasTotal: number;
    };
  }>;
}

const ReporteUsuarios: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reporte, setReporte] = useState<ReporteUsuarios | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuarioExpandido, setUsuarioExpandido] = useState<number | null>(null);

  const obtenerReporte = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ACCESS_TOKEN');

      const response = await axios.get(
        `${API_URL}/caja/reporte-usuarios-turno?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
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
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const getTurnoIcon = (turno: string) => {
    switch (turno) {
      case 'MAÑANA':
        return '🌅';
      case 'TARDE':
        return '☀️';
      case 'NOCHE':
        return '🌙';
      default:
        return '📋';
    }
  };

  const getTurnoColor = (turno: string) => {
    switch (turno) {
      case 'MAÑANA':
        return 'from-yellow-400 to-orange-400';
      case 'TARDE':
        return 'from-orange-400 to-red-400';
      case 'NOCHE':
        return 'from-indigo-400 to-purple-400';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="min-h-screen md:px-8 pt-0 md:pt-5 pb-10">
      <Alert />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Reporte de Usuarios por Turno</h1>
        <p className="text-gray-600">Analiza el rendimiento de cada usuario en sus turnos asignados</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={obtenerReporte}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icon icon="material-symbols:search" className="inline h-5 w-5 mr-2" />
              Buscar
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
      ) : reporte && reporte.usuarios.length > 0 ? (
        <div className="space-y-6">
          {reporte.usuarios.map((usuario) => (
            <div key={usuario.usuarioId} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header del Usuario */}
              <div
                onClick={() =>
                  setUsuarioExpandido(usuarioExpandido === usuario.usuarioId ? null : usuario.usuarioId)
                }
                className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 cursor-pointer hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <Icon icon="material-symbols:person" className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{usuario.usuarioNombre}</h3>
                      <p className="text-blue-100">{usuario.usuarioEmail}</p>
                    </div>
                  </div>
                  <Icon
                    icon={
                      usuarioExpandido === usuario.usuarioId
                        ? 'material-symbols:expand-less'
                        : 'material-symbols:expand-more'
                    }
                    className="h-8 w-8 text-white"
                  />
                </div>

                {/* Totales del Usuario */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm text-white/80">Aperturas</p>
                    <p className="text-2xl font-bold text-white">{usuario.totales.aperturas}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm text-white/80">Cierres</p>
                    <p className="text-2xl font-bold text-white">{usuario.totales.cierres}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm text-white/80">Monto Final</p>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(usuario.totales.montoFinalTotal)}
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm text-white/80">Diferencias</p>
                    <p
                      className={`text-xl font-bold ${
                        usuario.totales.diferenciasTotal >= 0 ? 'text-green-200' : 'text-red-200'
                      }`}
                    >
                      {formatCurrency(usuario.totales.diferenciasTotal)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalle por Turno */}
              {usuarioExpandido === usuario.usuarioId && (
                <div className="p-6 space-y-4">
                  {usuario.turnos.map((turno) => (
                    <div
                      key={turno.turno}
                      className={`bg-gradient-to-r ${getTurnoColor(turno.turno)} rounded-xl p-6 text-white`}
                    >
                      <h4 className="text-xl font-bold mb-4">
                        {getTurnoIcon(turno.turno)} Turno {turno.turno}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                          <p className="text-sm opacity-90">Aperturas</p>
                          <p className="text-2xl font-bold">{turno.aperturas}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                          <p className="text-sm opacity-90">Cierres</p>
                          <p className="text-2xl font-bold">{turno.cierres}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                          <p className="text-sm opacity-90">Monto Inicial</p>
                          <p className="text-lg font-bold">{formatCurrency(turno.montoInicialTotal)}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                          <p className="text-sm opacity-90">Monto Final</p>
                          <p className="text-lg font-bold">{formatCurrency(turno.montoFinalTotal)}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                          <p className="text-sm opacity-90">Diferencia</p>
                          <p className="text-lg font-bold">{formatCurrency(turno.diferenciasTotal)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center">
          <Icon icon="material-symbols:person-off" className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin datos</h3>
          <p className="text-gray-600">No hay movimientos de usuarios en el período seleccionado</p>
        </div>
      )}
    </div>
  );
};

export default ReporteUsuarios;
