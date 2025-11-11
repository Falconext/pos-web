import React, { useEffect, useState } from 'react';
import { useCajaStore } from '../../../zustand/caja';
import { Icon } from '@iconify/react';
import Alert from '../../../components/Alert';
import DataTable from '../../../components/Datatable';
import { useAccountingStore } from '../../../zustand/accounting';
import { useAuthStore } from '../../../zustand/auth';

const ArqueoCaja: React.FC = () => {
  const {
    arqueoCaja,
    loading,
    error,
    filters,
    obtenerArqueoCaja,
    exportarArqueo,
    setFilters,
    clearFilters,
    clearError
  } = useCajaStore();

  const [localFilters, setLocalFilters] = useState(filters);
  const { arqueoData, getAllArqueo } = useAccountingStore();
  const { auth } = useAuthStore();
  const [expandedTurnos, setExpandedTurnos] = useState<Set<string>>(new Set());

  useEffect(() => {
    obtenerArqueoCaja();
  }, [filters, obtenerArqueoCaja]);

  // Cargar también el arqueo contable para la tabla superior (misma fecha, empresa actual)
  useEffect(() => {
    const fi = localFilters.fechaInicio;
    const ff = localFilters.fechaFin;
    if (fi && ff && auth?.empresaId) {
      getAllArqueo({ fechaInicio: fi, fechaFin: ff, empresaId: auth.empresaId });
    }
  }, [localFilters.fechaInicio, localFilters.fechaFin, auth?.empresaId, getAllArqueo]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

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

  const handleExport = async () => {
    await exportarArqueo();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PE');
  }

  const toggleTurno = (turno: string) => {
    setExpandedTurnos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(turno)) {
        newSet.delete(turno);
      } else {
        newSet.add(turno);
      }
      return newSet;
    });
  };

  const detectarTurno = (fecha: string): string => {
    const hora = new Date(fecha).getHours();
    if (hora >= 6 && hora < 14) {
      return 'MAÑANA';
    } else if (hora >= 14 && hora < 22) {
      return 'TARDE';
    } else {
      return 'NOCHE';
    }
  };

  const agruparMovimientosPorTurno = (movimientos: any[]) => {
    const grupos: { [key: string]: any[] } = {};
    
    movimientos.forEach((mov) => {
      const turno = mov.turno || detectarTurno(mov.fecha);
      if (!grupos[turno]) {
        grupos[turno] = [];
      }
      grupos[turno].push(mov);
    });

    return grupos;
  };
  
  console.log(arqueoData)

  if (loading) {
    return (
      <div className="min-h-screen md:px-8 pt-0 md:pt-5">
        <div className="flex items-center justify-center min-h-[400px]">
          <Icon icon="line-md:loading-loop" className="h-8 w-8" />
          <span className="ml-2">Generando arqueo...</span>
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
          <h1 className="text-3xl font-bold">Arqueo de Caja</h1>
          <p className="text-gray-600">
            Analiza los ingresos, movimientos de caja y arqueos del período
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Icon icon="material-symbols:calculate" className="h-5 w-5" />
          <span className="text-sm font-medium">
            {arqueoCaja && arqueoCaja.fechaInicio && arqueoCaja.fechaFin 
              ? `${formatDate(arqueoCaja.fechaInicio)} - ${formatDate(arqueoCaja.fechaFin)}` 
              : 'Sin período'}
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

      {/* Filtros */}
      <div className="bg-white rounded-xl p-6 mb-6">
        <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
          <Icon icon="material-symbols:search" className="h-5 w-5" />
          Filtros de Período
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
              Consultar
            </button>
            <button 
              onClick={resetFilters}
              className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Limpiar
            </button>
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleExport}
              disabled={loading || !arqueoCaja}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon icon="material-symbols:file-download" className="h-4 w-4 mr-2 inline" />
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de comprobantes del período (desde contabilidad) - Agrupados por Turno */}
      <div className="bg-white rounded-xl p-6 mb-6">
        <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
          <Icon icon="material-symbols:table" className="h-5 w-5" />
          Comprobantes del Período (Agrupados por Turno)
        </h3>
        {arqueoData?.movimientosCaja && arqueoData.movimientosCaja.length > 0 ? (
          <div className="space-y-4">
            {(() => {
              const gruposPorTurno = agruparMovimientosPorTurno(arqueoData.movimientosCaja);
              const turnosOrdenados = ['MAÑANA', 'TARDE', 'NOCHE', 'SIN_TURNO'].filter(t => gruposPorTurno[t]);

              return turnosOrdenados.map((turno) => {
                const movimientos = gruposPorTurno[turno];
                const totalTurno = movimientos.reduce((sum: number, mov: any) => sum + (mov.monto || 0), 0);
                const isExpanded = expandedTurnos.has(turno);

                return (
                  <div key={turno} className="rounded-lg overflow-hidden">
                    {/* Header del turno */}
                    <button
                      onClick={() => toggleTurno(turno)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon 
                          icon={isExpanded ? "material-symbols:expand-less" : "material-symbols:expand-more"} 
                          className="h-6 w-6"
                        />
                        <div className="text-left">
                          <h4 className="font-bold text-lg">
                            {turno === 'MAÑANA' && '🌅 Turno Mañana (6:00 - 14:00)'}
                            {turno === 'TARDE' && '☀️ Turno Tarde (14:00 - 22:00)'}
                            {turno === 'NOCHE' && '🌙 Turno Noche (22:00 - 6:00)'}
                            {turno === 'SIN_TURNO' && '📋 Sin Turno Asignado'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {movimientos.length} comprobantes
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-600">
                          {formatCurrency(totalTurno)}
                        </p>
                      </div>
                    </button>

                    {/* Contenido expandible */}
                    {isExpanded && (
                      <div className="p-4 bg-white">
                        <div className="overflow-x-auto">
                          {(() => {
                            const rows = movimientos.map((item: any) => ({
                              Tipo: item?.tipo || '-',
                              Documento: item?.documento || '-',
                              Cliente: item?.cliente || '-',
                              Usuario: item?.usuario || '-',
                              Fecha: item?.fecha ? new Date(item.fecha).toLocaleString('es-PE') : '-',
                              Concepto: item?.concepto || '-',
                              'Medio Pago': item?.medioPago || '-',
                              Monto: typeof item?.monto === 'number' ? `S/ ${item.monto.toFixed(2)}` : '-',
                              Referencia: item?.referencia || '-',
                            }));

                            return (
                              <DataTable
                                actions={[]}
                                bodyData={rows}
                                headerColumns={[
                                  'Tipo',
                                  'Documento',
                                  'Cliente',
                                  'Usuario',
                                  'Fecha',
                                  'Concepto',
                                  'Medio Pago',
                                  'Monto',
                                  'Referencia',
                                ]}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="material-symbols:description" className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold">Sin comprobantes</h3>
            <p className="text-gray-600">No hay comprobantes en el período seleccionado.</p>
          </div>
        )}
      </div>

      {!arqueoCaja ? (
        <div className="bg-white rounded-xl p-6 text-center py-12">
          <Icon icon="material-symbols:calculate" className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">Sin datos de arqueo</h3>
          <p className="text-gray-600">
            Selecciona un período para generar el arqueo de caja.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumen de Ventas */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
              <Icon icon="material-symbols:trending-up" className="h-5 w-5" />
              Resumen de Ventas del Período
            </h3>
            <div className="space-y-6">
              {/* Total general */}
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(arqueoCaja.ventasDelPeriodo?.totalIngresos || 0)}
                </p>
                <p className="text-gray-600">Total Ingresos del Período</p>
              </div>

              {/* Medios de pago */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Icon icon="material-symbols:attach-money" className="h-4 w-4" />
                  Detalle por Medio de Pago
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">💵 Efectivo</span>
                      <span className="font-bold">
                        {formatCurrency(arqueoCaja.ventasDelPeriodo?.mediosPago?.EFECTIVO || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">📱 Yape</span>
                      <span className="font-bold">
                        {formatCurrency(arqueoCaja.ventasDelPeriodo?.mediosPago?.YAPE || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">📱 Plin</span>
                      <span className="font-bold">
                        {formatCurrency(arqueoCaja.ventasDelPeriodo?.mediosPago?.PLIN || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">🏦 Transferencia</span>
                      <span className="font-bold">
                        {formatCurrency(arqueoCaja.ventasDelPeriodo?.mediosPago?.TRANSFERENCIA || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">💳 Tarjeta</span>
                      <span className="font-bold">
                        {formatCurrency(arqueoCaja.ventasDelPeriodo?.mediosPago?.TARJETA || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas de comprobantes */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Icon icon="material-symbols:bar-chart" className="h-4 w-4" />
                  Estadísticas de Comprobantes
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {arqueoCaja.ventasDelPeriodo?.totalComprobantesFormales || 0}
                    </p>
                    <p className="text-sm text-gray-600">Comprobantes Formales</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {arqueoCaja.ventasDelPeriodo?.totalComprobantesInformales || 0}
                    </p>
                    <p className="text-sm text-gray-600">Comprobantes Informales</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {arqueoCaja.ventasDelPeriodo?.totalPagos || 0}
                    </p>
                    <p className="text-sm text-gray-600">Pagos Registrados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de Caja */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
              <Icon icon="material-symbols:wallet" className="h-5 w-5" />
              Resumen de Turnos
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xl font-bold text-green-600">
                    {arqueoCaja.resumenCaja?.totalAperturas || 0}
                  </p>
                  <p className="text-xs text-green-600">Aperturas</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xl font-bold text-red-600">
                    {arqueoCaja.resumenCaja?.totalCierres || 0}
                  </p>
                  <p className="text-xs text-red-600">Cierres</p>
                </div>
              </div>

              {/* Resumen por turno */}
              {arqueoCaja.resumenCaja?.resumenPorTurno && arqueoCaja.resumenCaja.resumenPorTurno.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Resumen por Turno:</h4>
                  <div className="space-y-2">
                    {arqueoCaja.resumenCaja.resumenPorTurno.map((turno: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">{turno.turno}</span>
                          <span className="text-xs text-gray-600">
                            {turno.aperturas}A / {turno.cierres}C
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Inicial:</span>
                            <br />
                            <span className="font-mono">{formatCurrency(turno.montoInicialTotal)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Final:</span>
                            <br />
                            <span className="font-mono">{formatCurrency(turno.montoFinalTotal)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Dif:</span>
                            <br />
                            <span className={`font-mono ${
                              turno.diferenciasTotal > 0 ? 'text-green-600' : 
                              turno.diferenciasTotal < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {formatCurrency(turno.diferenciasTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Monto Inicial Total:</span>
                  <span className="font-bold">
                    {formatCurrency(arqueoCaja.resumenCaja?.montoInicialTotal || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Monto Final Total:</span>
                  <span className="font-bold">
                    {formatCurrency(arqueoCaja.resumenCaja?.montoFinalTotal || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Diferencias Total:</span>
                  <span className={`font-bold ${
                    (arqueoCaja.resumenCaja?.diferenciasTotal || 0) > 0 
                      ? 'text-green-600' 
                      : (arqueoCaja.resumenCaja?.diferenciasTotal || 0) < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {formatCurrency(arqueoCaja.resumenCaja?.diferenciasTotal || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Movimientos de Caja */}
          <div className="lg:col-span-3 bg-white rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
              <Icon icon="material-symbols:calculate" className="h-5 w-5" />
              Movimientos de Caja del Período
            </h3>
            {(!arqueoCaja.movimientosCaja || arqueoCaja.movimientosCaja.length === 0) ? (
              <div className="text-center py-8">
                <Icon icon="material-symbols:wallet" className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">Sin movimientos de caja</h3>
                <p className="text-gray-600">
                  No se registraron aperturas o cierres de caja en este período.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden overflow-x-auto">
                {(() => {
                  const rows = (arqueoCaja.movimientosCaja || []).map((m) => ({
                    Tipo: m.tipoMovimiento,
                    Turno: m.turno || '-',
                    Fecha: new Date(m.fecha).toLocaleString('es-PE'),
                    Usuario: m.usuario?.nombre || '-',
                    Observaciones: m.observaciones || '-',
                    Inicial: m.montoInicial != null ? formatCurrency(Number(m.montoInicial)) : '-',
                    Final: m.montoFinal != null ? formatCurrency(Number(m.montoFinal)) : '-',
                    Efectivo: m.montoEfectivo != null ? formatCurrency(Number(m.montoEfectivo)) : '-',
                    Yape: m.montoYape != null ? formatCurrency(Number(m.montoYape)) : '-',
                    Plin: m.montoPlin != null ? formatCurrency(Number(m.montoPlin)) : '-',
                    Transferencia: m.montoTransferencia != null ? formatCurrency(Number(m.montoTransferencia)) : '-',
                    Tarjeta: m.montoTarjeta != null ? formatCurrency(Number(m.montoTarjeta)) : '-',
                    Diferencia: m.diferencia != null ? formatCurrency(Number(m.diferencia)) : '-',
                  }));

                  return (
                    <DataTable
                      actions={[]}
                      bodyData={rows}
                      headerColumns={[
                        'Tipo',
                        'Turno',
                        'Fecha',
                        'Usuario',
                        'Observaciones',
                        'Inicial',
                        'Final',
                        'Efectivo',
                        'Yape',
                        'Plin',
                        'Transferencia',
                        'Tarjeta',
                        'Diferencia',
                      ]}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArqueoCaja;