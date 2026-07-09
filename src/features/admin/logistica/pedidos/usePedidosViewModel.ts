import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IPedidoLogistica } from './PedidosModel';

export function usePedidosViewModel() {
  const alertStore = useAlertStore();
  const { pedidos, isLoadingPedidos, fetchPedidos, clientes, fetchClientes, zonas, fetchZonas } = useLogisticaStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<IPedidoLogistica | null>(null);

  useEffect(() => {
    fetchPedidos(searchTerm, estadoFilter);
  }, [searchTerm, estadoFilter]);

  useEffect(() => {
    if (isModalOpen) {
      fetchClientes();
      fetchZonas(true);
    }
  }, [isModalOpen]);

  const handleCreate = async (data: any) => {
    alertStore.load(true);
    try {
      await api.createPedido(data);
      alertStore.alert('Pedido logístico creado exitosamente', 'success');
      setIsModalOpen(false);
      fetchPedidos(searchTerm, estadoFilter);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al crear pedido', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const handleUpdateStatus = async (data: { estado: string; motivo?: string; notas?: string }) => {
    if (!selectedPedido) return;
    alertStore.load(true);
    try {
      await api.updateEstadoPedido(selectedPedido.id, data);
      alertStore.alert('Estado del pedido actualizado', 'success');
      setIsStatusModalOpen(false);
      fetchPedidos(searchTerm, estadoFilter);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al actualizar estado', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const openNewModal = () => {
    setIsModalOpen(true);
  };

  const openStatusModal = (pedido: IPedidoLogistica) => {
    setSelectedPedido(pedido);
    setIsStatusModalOpen(true);
  };

  return {
    pedidos,
    clientes,
    zonasActivas: zonas,
    isLoading: isLoadingPedidos,
    searchTerm,
    setSearchTerm,
    estadoFilter,
    setEstadoFilter,
    isModalOpen,
    setIsModalOpen,
    isStatusModalOpen,
    setIsStatusModalOpen,
    selectedPedido,
    actions: {
      openNewModal,
      openStatusModal,
      handleCreate,
      handleUpdateStatus
    }
  };
}
