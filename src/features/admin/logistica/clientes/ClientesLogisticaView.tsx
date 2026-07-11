import React from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import DataTable from '@/components/Datatable';
import { useClientesViewModel } from './useClientesViewModel';
import ModalClienteLogistica from './shared/ModalClienteLogistica';
import { format } from 'date-fns';

export default function ClientesLogisticaView() {
  const vm = useClientesViewModel();
  const { clientes, actions } = vm;

  const tableActions = [
    {
      tooltip: 'Editar',
      icon: <Icon icon="solar:pen-bold-duotone" width={18} />,
      onClick: (data: any) => actions.openEditModal(data._original),
      color: 'blue' as const
    },
    {
      tooltip: 'Eliminar',
      icon: <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />,
      onClick: (data: any) => actions.handleDelete(data.id),
      color: 'rose' as const
    }
  ];

  const tableData = clientes.map(cliente => {
    return {
      id: cliente.id,
      'Cliente': (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Icon icon={cliente.tipoDocumento === 'RUC' ? 'solar:buildings-bold-duotone' : 'solar:user-bold-duotone'} width={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{cliente.nombre}</p>
            <p className="text-xs text-gray-500">{cliente.tipoDocumento} {cliente.nroDocumento}</p>
          </div>
        </div>
      ),
      'Contacto': (
        <div className="flex flex-col gap-0.5">
          {cliente.celular ? <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1"><Icon icon="solar:phone-bold" width={14}/> {cliente.celular}</span> : <span className="text-sm text-gray-400">-</span>}
          {cliente.whatsapp && <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><Icon icon="solar:chat-round-bold" width={14}/> {cliente.whatsapp}</span>}
          {cliente.email && <span className="text-xs text-gray-500 flex items-center gap-1"><Icon icon="solar:letter-bold" width={14}/> {cliente.email}</span>}
        </div>
      ),
      'Direcciones': (
        <div className="flex flex-col gap-0.5 max-w-xs">
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={cliente.direcciones?.[0]?.direccion}>
            {cliente.direcciones?.[0]?.direccion || 'Sin direcciones'}
          </span>
          {cliente.direcciones && cliente.direcciones.length > 1 && (
            <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1">
              <Icon icon="solar:map-bold-duotone" width={12} />
              +{cliente.direcciones.length - 1} más
            </span>
          )}
        </div>
      ),
      'Registro': (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(cliente.creadoEn), 'dd/MM/yyyy')}
        </span>
      ),
      _original: cliente
    };
  });

  return (
    <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Clientes / Destinatarios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de destinatarios para pedidos logísticos</p>
        </div>
        <Button color="secondary" onClick={actions.openNewModal} className="flex items-center gap-2 !bg-violet-600 border-none shadow-md shadow-violet-200/50">
          <Icon icon="solar:add-circle-bold" className="text-lg" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 relative z-50 overflow-visible">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <InputPro
                name="search"
                placeholder="Buscar por nombre, RUC o DNI..."
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-0">
          <DataTable
            actions={tableActions}
            headerColumns={[
              { label: 'Cliente', key: 'Cliente' },
              { label: 'Contacto', key: 'Contacto' },
              { label: 'Direcciones', key: 'Direcciones' },
              { label: 'Registro', key: 'Registro' }
            ]}
            bodyData={tableData}
          />
        </div>
      </div>

      <ModalClienteLogistica
        isOpen={vm.isModalOpen}
        onClose={() => vm.setIsModalOpen(false)}
        onSubmit={actions.handleCreateOrUpdate}
        cliente={vm.selectedCliente}
      />
    </div>
  );
}
