import React from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import { usePedidosViewModel } from './usePedidosViewModel';
import ModalPedido from './shared/ModalPedido';
import ModalEstadoPedido from './shared/ModalEstadoPedido';
import { ESTADOS_PEDIDO, PRIORIDADES_PEDIDO } from './PedidosModel';
import { format } from 'date-fns';

export default function PedidosLogisticaView() {
  const vm = usePedidosViewModel();
  const { pedidos, clientes, zonasActivas, actions } = vm;

  const tableActions = [
    {
      onClick: (data: any) => actions.openStatusModal(data._original),
      icon: <Icon icon="solar:refresh-circle-bold-duotone" width={18} />,
      tooltip: 'Cambiar Estado',
      color: 'blue' as const
    }
  ];

  const tableData = pedidos.map(pedido => {
    const prioridadObj = PRIORIDADES_PEDIDO.find(p => p.value === pedido.prioridad);
    const estadoObj = ESTADOS_PEDIDO.find(e => e.value === pedido.estado);

    const prioColors: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold'
    };

    const estadoColors: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
    };

    return {
      id: pedido.id,
      'Pedido / Prioridad': (
        <div>
          <p className="text-sm font-bold text-violet-700 dark:text-violet-400 tracking-wider">
            {pedido.codigo}
          </p>
          <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] uppercase rounded-md ${prioColors[prioridadObj?.color || 'gray']}`}>
            {prioridadObj?.label || pedido.prioridad}
          </span>
        </div>
      ),
      'Destino': (
        <div className="flex flex-col gap-0.5 max-w-[200px]">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={pedido.cliente?.nombre}>
            {pedido.cliente?.nombre || 'Sin cliente'}
          </p>
          <p className="text-xs text-gray-500 truncate" title={pedido.direccionEntrega}>
            {pedido.direccionEntrega}
          </p>
          {pedido.zona && (
            <span className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold flex items-center gap-1 mt-0.5">
              <Icon icon="solar:map-bold-duotone" width={10} /> {pedido.zona.nombre}
            </span>
          )}
        </div>
      ),
      'Programación': (
        <div className="flex flex-col gap-0.5">
          {pedido.fechaPrometida ? (
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Icon icon="solar:calendar-date-bold-duotone" className="text-violet-500" width={14}/>
              {format(new Date(pedido.fechaPrometida + 'T00:00:00'), 'dd/MM/yyyy')}
            </span>
          ) : <span className="text-xs text-gray-400">Sin fecha</span>}
          
          {(pedido.ventanaInicio || pedido.ventanaFin) && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Icon icon="solar:clock-circle-bold" width={12}/>
              {pedido.ventanaInicio || '00:00'} - {pedido.ventanaFin || '23:59'}
            </span>
          )}
        </div>
      ),
      'Carga': (
        <div className="flex flex-col gap-0.5">
          {pedido.bultos ? <span className="text-xs text-gray-600 dark:text-gray-400">{pedido.bultos} bulto(s)</span> : null}
          {pedido.pesoTotalKg ? <span className="text-xs text-gray-500">{pedido.pesoTotalKg} kg</span> : null}
        </div>
      ),
      'Estado': estadoObj ? (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${estadoColors[estadoObj.color] || estadoColors.gray}`}>
          {estadoObj.label}
        </span>
      ) : null,
      _original: pedido
    };
  });

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Pedidos / Órdenes de Servicio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de envíos logísticos pendientes y en curso</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-violet-600 border-none shadow-md shadow-violet-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Crear Pedido Manual
        </Button>
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 relative z-50 overflow-visible">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <InputPro
                name="search"
                placeholder="Buscar por código de pedido o cliente..."
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full lg:w-48">
              <select
                value={vm.estadoFilter}
                onChange={(e) => vm.setEstadoFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Todos los estados</option>
                {ESTADOS_PEDIDO.map(est => (
                  <option key={est.value} value={est.value}>{est.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-0">
          <DataTable
            actions={tableActions}
            headerColumns={[
              { label: 'Pedido / Prioridad', key: 'Pedido / Prioridad' },
              { label: 'Destino', key: 'Destino' },
              { label: 'Programación', key: 'Programación' },
              { label: 'Carga', key: 'Carga' },
              { label: 'Estado', key: 'Estado' }
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalPedido 
        isOpen={vm.isModalOpen}
        onClose={() => vm.setIsModalOpen(false)}
        onSubmit={actions.handleCreate}
        clientes={clientes}
        zonasActivas={zonasActivas}
      />

      <ModalEstadoPedido 
        isOpen={vm.isStatusModalOpen}
        onClose={() => vm.setIsStatusModalOpen(false)}
        onSubmit={actions.handleUpdateStatus}
        pedido={vm.selectedPedido}
      />
    </div>
  );
}
