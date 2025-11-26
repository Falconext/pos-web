import React, { useState, useEffect } from 'react';
import Loading from '../../../components/Loading';
import { Card, BarChart as TremorBarChart, DonutChart, Title } from '@tremor/react';
import { useAuthStore } from '@/zustand/auth';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import DataTable from '@/components/Datatable';

interface DashboardData {
  resumenGeneral: {
    totalProductos: number;
    valorTotalInventario: number;
    productosStockCritico: number;
    productosStockCero: number;
  };
  estadisticas: {
    totalProductos: number;
    valorTotalInventario: number;
    productosStockCritico: number;
    productosStockCero: number;
  };
  movimientosRecientes: Array<{
    id: number;
    fecha: Date;
    tipoMovimiento: string;
    concepto: string;
    cantidad: number;
    producto: {
      codigo: string;
      descripcion: string;
    };
  }>;
  alertas: {
    stockCritico: number;
    productosObsoletos: number;
    valorInmovilizado: number;
  };
  topProductos: {
    stockCritico: Array<{
      id: number;
      codigo: string;
      descripcion: string;
      stock: number;
      stockMinimo: number;
      valorTotal: number;
    }>;
    obsoletos: Array<{
      id: number;
      codigo: string;
      descripcion: string;
      stock: number;
      valorInmovilizado: number;
      diasSinMovimiento: number;
    }>;
  };
  fechaActualizacion: Date;
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
};

const PIE_COLORS = [COLORS.success, COLORS.warning, COLORS.danger, COLORS.info];

const InventarioDashboard: React.FC = () => {
  const { auth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const token = localStorage.getItem('token');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/kardex/dashboard');
      // El API devuelve { code, message, data: {...} }
      const dashboardInfo = response.data.data || response.data;
      setDashboardData(dashboardInfo);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return '-';
      return new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date);
    } catch (error) {
      return '-';
    }
  };

  const getTipoMovimientoColor = (tipo: string) => {
    switch (tipo) {
      case 'INGRESO':
        return 'text-green-600 bg-green-100';
      case 'SALIDA':
        return 'text-red-600 bg-red-100';
      case 'AJUSTE':
        return 'text-blue-600 bg-blue-100';
      case 'TRANSFERENCIA':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Preparar datos para gráficos
  const prepareChartData = () => {
    if (!dashboardData) return { barData: [], pieData: [] };

    const barData = [
      {
        name: 'Stock Normal',
        cantidad: dashboardData?.resumenGeneral?.totalProductos -
          dashboardData?.resumenGeneral?.productosStockCritico -
          dashboardData?.resumenGeneral?.productosStockCero,
        color: COLORS.success,
      },
      {
        name: 'Stock Crítico',
        cantidad: dashboardData?.resumenGeneral?.productosStockCritico,
        color: COLORS.warning,
      },
      {
        name: 'Sin Stock',
        cantidad: dashboardData?.resumenGeneral?.productosStockCero,
        color: COLORS.danger,
      },
    ];

    const pieData = [
      {
        name: 'Stock Normal',
        value: dashboardData?.resumenGeneral?.totalProductos -
          dashboardData?.resumenGeneral?.productosStockCritico -
          dashboardData?.resumenGeneral?.productosStockCero,
        color: COLORS.success,
      },
      {
        name: 'Stock Crítico',
        value: dashboardData?.resumenGeneral?.productosStockCritico,
        color: COLORS.warning,
      },
      {
        name: 'Sin Stock',
        value: dashboardData?.resumenGeneral?.productosStockCero,
        color: COLORS.danger,
      },
    ];

    return { barData, pieData: pieData.filter(item => item.value > 0) };
  };

  if (loading) {
    return <Loading />;
  }


  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Icon icon="mingcute:exclamation-triangle-fill" width={48} height={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar dashboard
          </h3>
          <p className="text-gray-500">
            No se pudo cargar la información del inventario.
          </p>
        </div>
      </div>
    );
  }

  const { barData, pieData } = prepareChartData();

  const stockChartData = [
    {
      estado: 'Inventario',
      'Stock normal': barData[0]?.cantidad ?? 0,
      'Stock crítico': barData[1]?.cantidad ?? 0,
      'Sin stock': barData[2]?.cantidad ?? 0,
    },
  ];

  return (
    <div className="md:p-6 p-3 px-0 md:px-8 pt-4">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon icon="mingcute:package-fill" width={24} height={24} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.resumenGeneral.totalProductos.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon icon="mingcute:dollar-fill" width={24} height={24} className="text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.resumenGeneral.valorTotalInventario)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icon icon="mingcute:alert-triangle-fill" width={24} height={24} className="text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Stock Crítico</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.resumenGeneral.productosStockCritico}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icon icon="mingcute:x-circle-fill" width={24} height={24} className="text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sin Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.resumenGeneral.productosStockCero}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos con Tremor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border border-tremor-border bg-tremor-background shadow-tremorCard">
          <Title>Estado del stock</Title>
          <TremorBarChart
            className="mt-4 h-64"
            data={stockChartData}
            index="estado"
            categories={["Stock normal", "Stock crítico", "Sin stock"]}
            colors={["emerald", "amber", "rose"]}
            showLegend
            showGridLines
            showAnimation
            yAxisWidth={56}
            valueFormatter={(value: number) =>
              Number(value || 0).toLocaleString("es-PE")
            }
          />
        </Card>

        <Card className="border border-tremor-border bg-tremor-background shadow-tremorCard">
          <Title>Distribución del inventario</Title>
          <DonutChart
            className="mt-4 h-64"
            data={pieData}
            index="name"
            category="value"
            colors={["emerald", "amber", "rose", "cyan"]}
            valueFormatter={(value: number) =>
              Number(value || 0).toLocaleString("es-PE")
            }
          />
        </Card>
      </div>

      {/* Alertas y productos críticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Productos con stock crítico */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Crítico</h3>
          {dashboardData.topProductos.stockCritico.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.topProductos.stockCritico.map((producto) => (
                <div key={producto.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{producto.codigo}</p>
                    <p className="text-xs text-gray-500 truncate">{producto.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-yellow-600">
                        Stock: {producto.stock} / Mínimo: {producto.stockMinimo}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(producto.valorTotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay productos con stock crítico</p>
          )}
        </div>

        {/* Productos obsoletos */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Productos Obsoletos</h3>
          {dashboardData.topProductos.obsoletos.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.topProductos.obsoletos.map((producto) => (
                <div key={producto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{producto.codigo}</p>
                    <p className="text-xs text-gray-500 truncate">{producto.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">
                        {producto.diasSinMovimiento} días sin movimiento
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(producto.valorInmovilizado)}
                    </p>
                    <p className="text-xs text-gray-500">{producto.stock} unidades</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay productos obsoletos detectados</p>
          )}
        </div>
      </div>

      {/* Movimientos recientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Movimientos Recientes</h3>
        </div>
        <div className='p-5'>
          {
          dashboardData.movimientosRecientes.length > 0 ? (
            <DataTable actions={[]} bodyData={dashboardData.movimientosRecientes.map((movimiento) => ({
              fecha: formatDate(movimiento.fecha),
              producto: `${movimiento.producto?.codigo || ''} - ${movimiento.producto?.descripcion || 'Sin descripción'}`,
              concepto: movimiento.concepto,
              cantidad: movimiento.cantidad,
            }))}
              headerColumns={[
                'Fecha',
                'Producto',
                'Concepto',
                'Cantidad',
              ]} />
          ) : (
            <p className="text-sm text-gray-500">No hay movimientos recientes</p>
          )
        }
        </div>
      </div>
    </div>
  );
};

export default InventarioDashboard;