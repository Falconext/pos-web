import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

const ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMADO', label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  { value: 'EN_PREPARACION', label: 'En Preparación', color: 'bg-purple-100 text-purple-800' },
  { value: 'LISTO', label: 'Listo', color: 'bg-green-100 text-green-800' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'bg-gray-100 text-gray-800' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

export default function PedidosTienda() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const { alert } = useAlertStore();

  useEffect(() => {
    cargarPedidos();
  }, [filtroEstado]);

  const cargarPedidos = async () => {
    try {
      const params = filtroEstado ? `?estado=${filtroEstado}` : '';
      const { data } = await apiClient.get(`/tienda/pedidos${params}`);
      const raw = (data?.data || []) as any[];
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
      alert('Estado actualizado', 'success');
      cargarPedidos();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al actualizar estado', 'error');
    }
  };

  const getEstadoInfo = (estado: string) => {
    return ESTADOS.find((e) => e.value === estado) || ESTADOS[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Icon icon="mdi:cart-off" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No hay pedidos {filtroEstado ? 'con este estado' : 'aún'}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pedidos.map((pedido) => {
            const estadoInfo = getEstadoInfo(pedido.estado);
            return (
              <div key={pedido.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Pedido #{pedido.id}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(pedido.creadoEn).toLocaleString('es-PE')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Código: {pedido.codigoSeguimiento}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoInfo.color}`}>
                      {estadoInfo.label}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${pedido.tipoEntrega === 'ENVIO'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      <Icon
                        icon={pedido.tipoEntrega === 'ENVIO' ? 'mdi:moped' : 'mdi:store'}
                        className="inline w-3 h-3 mr-1"
                      />
                      {pedido.tipoEntrega === 'ENVIO' ? 'Envío' : 'Recojo'}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-medium">{pedido.clienteNombre}</p>
                    <p className="text-sm">{pedido.clienteTelefono}</p>
                    {pedido.clienteEmail && <p className="text-sm">{pedido.clienteEmail}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Entrega</p>
                    {pedido.clienteDireccion && <p className="text-sm">{pedido.clienteDireccion}</p>}
                    {pedido.clienteReferencia && (
                      <p className="text-sm text-gray-500">{pedido.clienteReferencia}</p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <p className="text-sm font-medium mb-2">Productos:</p>
                  {pedido?.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm mb-1">
                      <span>
                        {item.cantidad}x {item.producto.descripcion}
                      </span>
                      <span>S/ {item?.subtotal?.toFixed(2)}</span>
                    </div>
                  ))}
                  {pedido.costoEnvio > 0 && (
                    <div className="flex justify-between text-sm mb-1 text-green-600">
                      <span>Costo de envío</span>
                      <span>S/ {pedido.costoEnvio.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span>S/ {pedido?.total?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm mb-4">
                  <Icon icon="mdi:cash" className="w-5 h-5" />
                  <span className="font-medium">{pedido.medioPago}</span>
                  {pedido.referenciaTransf && (
                    <span className="text-gray-600">- Ref: {pedido.referenciaTransf}</span>
                  )}
                </div>

                {pedido.observaciones && (
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Observaciones:</strong> {pedido.observaciones}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {pedido.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => cambiarEstado(pedido.id, 'CONFIRMADO')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Confirmar Pago
                    </button>
                  )}
                  {pedido.estado === 'CONFIRMADO' && (
                    <button
                      onClick={() => cambiarEstado(pedido.id, 'EN_PREPARACION')}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      En Preparación
                    </button>
                  )}
                  {pedido.estado === 'EN_PREPARACION' && (
                    <button
                      onClick={() => cambiarEstado(pedido.id, 'LISTO')}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Marcar Listo
                    </button>
                  )}
                  {pedido.estado === 'LISTO' && (
                    <button
                      onClick={() => cambiarEstado(pedido.id, 'ENTREGADO')}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Marcar Entregado
                    </button>
                  )}
                  {pedido.estado !== 'CANCELADO' && pedido.estado !== 'ENTREGADO' && (
                    <button
                      onClick={() => cambiarEstado(pedido.id, 'CANCELADO')}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
