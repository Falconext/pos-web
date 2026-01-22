import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

const ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'solar:clock-circle-bold' },
  { value: 'CONFIRMADO', label: 'Confirmado', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'solar:check-circle-bold' },
  { value: 'EN_PREPARACION', label: 'En Preparación', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'solar:chef-hat-bold' },
  { value: 'LISTO', label: 'Listo', color: 'bg-green-50 text-green-700 border-green-200', icon: 'solar:bag-check-bold' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: 'solar:box-bold' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-200', icon: 'solar:close-circle-bold' },
];

export default function PedidosTienda() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const { alert } = useAlertStore();

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      // Always load ALL orders, don't filter by estado in the API call
      const { data } = await apiClient.get(`/tienda/pedidos`);
      const responseData = data?.data;
      const raw = (Array.isArray(responseData) ? responseData : responseData?.data || []) as any[];
      const normalizados = raw.map((p) => ({
        ...p,
        subtotal: Number(p?.subtotal ?? 0),
        igv: Number(p?.igv ?? 0),
        total: Number(p?.total ?? 0),
        costoEnvio: Number(p?.costoEnvio ?? 0),
        items: (p?.items || []).map((it: any) => ({
          ...it,
          precioUnit: Number(it?.precioUnit ?? it?.precioUnitario ?? 0),
          subtotal: Number(it?.subtotal ?? 0),
        })),
      }));
      setPedidos(normalizados);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cargar pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (pedidoId: number, nuevoEstado: string) => {
    try {
      await apiClient.patch(`/tienda/pedidos/${pedidoId}/estado`, {
        estado: nuevoEstado,
      });
      alert('Estado actualizado correctamente', 'success');
      cargarPedidos();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al actualizar estado', 'error');
    }
  };

  const getEstadoInfo = (estado: string) => {
    return ESTADOS.find((e) => e.value === estado) || ESTADOS[0];
  };

  const toggleOrderExpanded = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getEstadisticas = () => {
    // Calculate stats from ALL orders, not just filtered ones
    const stats = ESTADOS.map(estado => ({
      ...estado,
      count: pedidos.filter(p => p.estado === estado.value).length
    }));
    return stats;
  };

  // Filter orders for display
  const pedidosFiltrados = filtroEstado
    ? pedidos.filter(p => p.estado === filtroEstado)
    : pedidos;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Icon icon="eos-icons:loading" className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  const estadisticas = getEstadisticas();

  return (
    <div className="min-h-screen px-4 pb-8">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Icon icon="solar:bag-5-bold" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pedidos de Tienda</h1>
            <p className="text-sm text-gray-500">Gestiona y monitorea todos los pedidos de tu tienda virtual</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-6">
          {estadisticas.map((stat) => (
            <button
              key={stat.value}
              onClick={() => setFiltroEstado(filtroEstado === stat.value ? '' : stat.value)}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${filtroEstado === stat.value
                ? `${stat.color} shadow-sm scale-105`
                : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon icon={stat.icon} className="w-5 h-5" />
                <span className="text-2xl font-bold">{stat.count}</span>
              </div>
              <p className="text-xs font-semibold truncate">{stat.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {pedidosFiltrados.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
            <Icon icon="solar:bag-cross-linear" className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay pedidos</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {filtroEstado
              ? 'No hay pedidos con este estado. Prueba con otro filtro.'
              : 'Los pedidos de tu tienda aparecerán aquí. ¡Empieza a vender!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido) => {
            const estadoInfo = getEstadoInfo(pedido.estado);
            const isExpanded = expandedOrders.has(pedido.id);

            return (
              <div key={pedido.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Order Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrderExpanded(pedido.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                        <Icon icon="solar:shopping-bag-bold" className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-lg text-gray-900">#{pedido.id}</h3>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${estadoInfo.color}`}>
                            <Icon icon={estadoInfo.icon} className="inline w-3.5 h-3.5 mr-1" />
                            {estadoInfo.label}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${pedido.tipoEntrega === 'ENVIO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}>
                            <Icon
                              icon={pedido.tipoEntrega === 'ENVIO' ? 'solar:scooter-bold' : 'solar:shop-bold'}
                              className="inline w-3.5 h-3.5 mr-1"
                            />
                            {pedido.tipoEntrega === 'ENVIO' ? 'Envío' : 'Recojo'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4" />
                            {new Date(pedido.creadoEn).toLocaleDateString('es-PE')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon icon="solar:clock-circle-bold-duotone" className="w-4 h-4" />
                            {new Date(pedido.creadoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs font-mono text-gray-400">{pedido.codigoSeguimiento}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Total</p>
                        <p className="text-2xl font-bold text-gray-900">S/ {pedido?.total?.toFixed(2)}</p>
                      </div>
                      <Icon
                        icon={isExpanded ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"}
                        className="w-5 h-5 text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    <div className="p-5 space-y-6">
                      {/* Customer & Delivery Info */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon icon="solar:user-bold-duotone" className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Cliente</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p className="font-medium text-gray-900">{pedido.clienteNombre}</p>
                            <p className="flex items-center gap-2 text-gray-600">
                              <Icon icon="solar:phone-bold-duotone" className="w-4 h-4" />
                              {pedido.clienteTelefono}
                            </p>
                            {pedido.clienteEmail && (
                              <p className="flex items-center gap-2 text-gray-600">
                                <Icon icon="solar:letter-bold-duotone" className="w-4 h-4" />
                                {pedido.clienteEmail}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon icon="solar:map-point-bold-duotone" className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Entrega</h4>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            {pedido.clienteDireccion && <p>{pedido.clienteDireccion}</p>}
                            {pedido.clienteReferencia && (
                              <p className="text-gray-500 italic">{pedido.clienteReferencia}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Products */}
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon icon="solar:bag-4-bold-duotone" className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">Productos</h4>
                        </div>
                        <div className="space-y-2">
                          {pedido?.items?.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-700">
                                  {item.cantidad}
                                </span>
                                <span className="text-sm text-gray-900">{item.producto.descripcion}</span>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">S/ {item?.subtotal?.toFixed(2)}</span>
                            </div>
                          ))}
                          {pedido.costoEnvio > 0 && (
                            <div className="flex items-center justify-between py-2 text-emerald-600">
                              <span className="text-sm flex items-center gap-2">
                                <Icon icon="solar:delivery-bold-duotone" className="w-4 h-4" />
                                Costo de envío
                              </span>
                              <span className="text-sm font-semibold">S/ {pedido.costoEnvio.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between py-3 border-t-2 border-gray-200">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-gray-900">S/ {pedido?.total?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment & Notes */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-2 text-sm">
                            <Icon icon="solar:wallet-bold-duotone" className="w-5 h-5 text-amber-600" />
                            <span className="font-semibold text-gray-900">{pedido.medioPago}</span>
                            {pedido.referenciaTransf && (
                              <span className="text-gray-500">- Ref: {pedido.referenciaTransf}</span>
                            )}
                          </div>
                        </div>
                        {pedido.observaciones && (
                          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                            <p className="text-sm text-amber-900">
                              <Icon icon="solar:notes-bold-duotone" className="inline w-4 h-4 mr-1" />
                              <strong>Nota:</strong> {pedido.observaciones}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                        {pedido.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => cambiarEstado(pedido.id, 'CONFIRMADO')}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm hover:shadow"
                          >
                            <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                            Confirmar Pago
                          </button>
                        )}
                        {pedido.estado === 'CONFIRMADO' && (
                          <button
                            onClick={() => cambiarEstado(pedido.id, 'EN_PREPARACION')}
                            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm hover:shadow"
                          >
                            <Icon icon="solar:chef-hat-bold" className="w-4 h-4" />
                            En Preparación
                          </button>
                        )}
                        {pedido.estado === 'EN_PREPARACION' && (
                          <button
                            onClick={() => cambiarEstado(pedido.id, 'LISTO')}
                            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm hover:shadow"
                          >
                            <Icon icon="solar:bag-check-bold" className="w-4 h-4" />
                            Marcar Listo
                          </button>
                        )}
                        {pedido.estado === 'LISTO' && (
                          <button
                            onClick={() => cambiarEstado(pedido.id, 'ENTREGADO')}
                            className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm hover:shadow"
                          >
                            <Icon icon="solar:box-bold" className="w-4 h-4" />
                            Marcar Entregado
                          </button>
                        )}
                        {pedido.estado !== 'CANCELADO' && pedido.estado !== 'ENTREGADO' && (
                          <button
                            onClick={() => cambiarEstado(pedido.id, 'CANCELADO')}
                            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm hover:shadow ml-auto"
                          >
                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                            Cancelar Pedido
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
