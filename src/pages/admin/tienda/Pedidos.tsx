import { usePedidosViewModel, ESTADOS } from '@/features/admin/tienda/usePedidosViewModel';
import { Icon } from '@iconify/react';

export default function PedidosTienda() {
  const vm = usePedidosViewModel();

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-[#0A0D14]">
        <div className="text-center">
          <Icon icon="eos-icons:loading" className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-8 bg-gray-50 dark:bg-[#0A0D14]">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3 pt-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Icon icon="solar:bag-5-bold" className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Pedidos de Tienda</h1>
              {vm.newOrdersCount > 0 && (
                <button
                  onClick={vm.clearNewOrders}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse"
                  title="Haz clic para marcar como visto"
                >
                  <Icon icon="solar:bell-bing-bold" className="w-3.5 h-3.5" />
                  {vm.newOrdersCount} nuevo{vm.newOrdersCount > 1 ? 's' : ''}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              Actualizando cada 30s
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-6">
          {vm.estadisticas.map((stat) => (
            <button key={stat.value} onClick={() => vm.setFiltroEstado(vm.filtroEstado === stat.value ? '' : stat.value)}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${vm.filtroEstado === stat.value ? `${stat.color} shadow-sm scale-105` : 'bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <Icon icon={stat.icon} className="w-5 h-5 dark:text-gray-300" />
                <span className="text-2xl font-bold dark:text-white">{stat.count}</span>
              </div>
              <p className="text-xs font-semibold truncate dark:text-gray-300">{stat.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Search + Date Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o teléfono..."
            value={vm.busqueda}
            onChange={(e) => vm.setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Icon icon="solar:calendar-linear" className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="date"
            value={vm.fechaDesde}
            onChange={(e) => vm.setFechaDesde(e.target.value)}
            className="text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={vm.fechaHasta}
            onChange={(e) => vm.setFechaHasta(e.target.value)}
            className="text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          {(vm.busqueda || vm.fechaDesde || vm.fechaHasta) && (
            <button
              onClick={() => { vm.setBusqueda(''); vm.setFechaDesde(''); vm.setFechaHasta(''); }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 transition-colors"
              title="Limpiar filtros"
            >
              <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {vm.pedidosFiltrados.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mx-auto mb-4">
            <Icon icon="solar:bag-cross-linear" className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay pedidos</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {vm.filtroEstado ? 'No hay pedidos con este estado. Prueba con otro filtro.' : 'Los pedidos de tu tienda aparecerán aquí. ¡Empieza a vender!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {vm.pedidosFiltrados.map((pedido) => {
            const estadoInfo = vm.getEstadoInfo(pedido.estado);
            const isExpanded = vm.expandedOrders.has(pedido.id);
            return (
              <div key={pedido.id} className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => vm.toggleOrderExpanded(pedido.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center flex-shrink-0">
                        <Icon icon="solar:shopping-bag-bold" className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{pedido.clienteNombre || `#${pedido.id}`}</h3>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${estadoInfo.color}`}>
                            <Icon icon={estadoInfo.icon} className="inline w-3.5 h-3.5 mr-1" />{estadoInfo.label}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${pedido.tipoEntrega === 'ENVIO' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' : 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50'}`}>
                            <Icon icon={pedido.tipoEntrega === 'ENVIO' ? 'solar:scooter-bold' : 'solar:shop-bold'} className="inline w-3.5 h-3.5 mr-1" />
                            {pedido.tipoEntrega === 'ENVIO' ? 'Envío' : 'Recojo'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1"><Icon icon="solar:calendar-bold-duotone" className="w-4 h-4" />{new Date(pedido.creadoEn).toLocaleDateString('es-PE')}</span>
                          <span className="flex items-center gap-1"><Icon icon="solar:clock-circle-bold-duotone" className="w-4 h-4" />{new Date(pedido.creadoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{pedido.codigoSeguimiento}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">S/ {pedido?.total?.toFixed(2)}</p>
                      </div>
                      <Icon icon={isExpanded ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"} className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/20">
                    <div className="p-5 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-3"><Icon icon="solar:user-bold-duotone" className="w-5 h-5 text-blue-600 dark:text-blue-400" /><h4 className="font-semibold text-gray-900 dark:text-white">Cliente</h4></div>
                          <div className="space-y-2 text-sm">
                            <p className="font-medium text-gray-900 dark:text-white">{pedido.clienteNombre}</p>
                            <a href={`https://wa.me/${(pedido.clienteTelefono || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:underline">
                              <Icon icon="mdi:whatsapp" className="w-4 h-4" />{pedido.clienteTelefono}
                            </a>
                            {pedido.clienteEmail && <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Icon icon="solar:letter-bold-duotone" className="w-4 h-4" />{pedido.clienteEmail}</p>}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-3"><Icon icon="solar:map-point-bold-duotone" className="w-5 h-5 text-green-600 dark:text-green-400" /><h4 className="font-semibold text-gray-900 dark:text-white">Entrega</h4></div>
                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {pedido.clienteDireccion && <p>{pedido.clienteDireccion}</p>}
                            {pedido.clienteReferencia && <p className="text-gray-500 dark:text-gray-500 italic">{pedido.clienteReferencia}</p>}
                            {pedido.observaciones && <p className="text-gray-500 dark:text-gray-500 italic">Obs: {pedido.observaciones}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3"><Icon icon="solar:bag-4-bold-duotone" className="w-5 h-5 text-purple-600 dark:text-purple-400" /><h4 className="font-semibold text-gray-900 dark:text-white">Productos</h4></div>
                        <div className="space-y-2">
                          {pedido?.items?.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800 last:border-0">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {item.producto?.imagenUrl ? (
                                  <img src={item.producto.imagenUrl} alt={item.producto.descripcion} className="w-10 h-10 rounded-lg object-contain border border-gray-100 dark:border-slate-700 bg-white flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                    <Icon icon="solar:gallery-linear" className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white truncate">{item.producto.descripcion}</p>
                                  <p className="text-xs text-gray-400">x{item.cantidad} · S/ {Number(item.precioUnit ?? item.precioUnitario ?? 0).toFixed(2)} c/u</p>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white ml-3">S/ {item?.subtotal?.toFixed(2)}</span>
                            </div>
                          ))}
                          {pedido.costoEnvio > 0 && (
                            <div className="flex items-center justify-between py-2 text-emerald-600 dark:text-emerald-400">
                              <span className="text-sm flex items-center gap-2"><Icon icon="solar:delivery-bold-duotone" className="w-4 h-4" />Costo de envío</span>
                              <span className="text-sm font-semibold">S/ {pedido.costoEnvio.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between py-3 border-t-2 border-gray-200 dark:border-slate-700">
                            <span className="font-bold text-gray-900 dark:text-gray-400">Total</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">S/ {pedido?.total?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                        {pedido.estado === 'PENDIENTE' && (
                          <button onClick={() => vm.cambiarEstado(pedido.id, 'CONFIRMADO')} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
                            <Icon icon="solar:check-circle-bold" className="w-4 h-4" />Confirmar Pago
                          </button>
                        )}
                        {pedido.estado === 'CONFIRMADO' && (
                          <button onClick={() => vm.cambiarEstado(pedido.id, 'EN_PREPARACION')} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
                            <Icon icon="solar:chef-hat-bold" className="w-4 h-4" />En Preparación
                          </button>
                        )}
                        {pedido.estado === 'EN_PREPARACION' && (
                          <button onClick={() => vm.cambiarEstado(pedido.id, 'LISTO')} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
                            <Icon icon="solar:bag-check-bold" className="w-4 h-4" />Marcar Listo
                          </button>
                        )}
                        {pedido.estado === 'LISTO' && (
                          <button onClick={() => vm.cambiarEstado(pedido.id, 'ENTREGADO')} className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
                            <Icon icon="solar:box-bold" className="w-4 h-4" />Marcar Entregado
                          </button>
                        )}
                        {pedido.estado !== 'CANCELADO' && pedido.estado !== 'ENTREGADO' && (
                          <button onClick={() => vm.cambiarEstado(pedido.id, 'CANCELADO')} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ml-auto">
                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />Cancelar Pedido
                          </button>
                        )}
                        {pedido.clienteTelefono && (() => {
                          const nextState = pedido.estado === 'PENDIENTE' ? 'CONFIRMADO'
                            : pedido.estado === 'CONFIRMADO' ? 'EN_PREPARACION'
                            : pedido.estado === 'EN_PREPARACION' ? 'LISTO'
                            : pedido.estado === 'LISTO' ? 'ENTREGADO'
                            : null;
                          const waUrl = nextState ? vm.buildWhatsappUrl(pedido, nextState) : vm.buildWhatsappUrl(pedido, pedido.estado);
                          return waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                            >
                              <Icon icon="mdi:whatsapp" className="w-4 h-4" />Notificar cliente
                            </a>
                          ) : null;
                        })()}
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
