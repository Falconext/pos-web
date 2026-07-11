import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IPedidoLogistica } from './PedidosModel';

export function usePedidosViewModel() {
  const alertStore = useAlertStore();
  const { pedidos, isLoadingPedidos, fetchPedidos, clientes, fetchClientes } = useLogisticaStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEntregaModalOpen, setIsEntregaModalOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<IPedidoLogistica | null>(null);

  useEffect(() => {
    fetchPedidos(searchTerm, estadoFilter);
  }, [searchTerm, estadoFilter]);

  useEffect(() => {
    if (isModalOpen) {
      fetchClientes();
    }
  }, [isModalOpen]);

  const handleCreate = async (data: any) => {
    alertStore.load(true);
    try {
      const res = await api.createPedido(data);
      if (!res.success) throw new Error(res.error || 'Error al crear pedido');
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

  const handleConfirmarEntrega = async (data: any) => {
    if (!selectedPedido) return;
    alertStore.load(true);
    try {
      const res = await api.registrarEntrega(selectedPedido.id, data);
      if (!res.success) throw new Error(res.error || 'Error al confirmar entrega');
      alertStore.alert('Entrega confirmada correctamente', 'success');
      setIsEntregaModalOpen(false);
      fetchPedidos(searchTerm, estadoFilter);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al confirmar entrega', 'error');
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

  const openEntregaModal = (pedido: IPedidoLogistica) => {
    setSelectedPedido(pedido);
    setIsEntregaModalOpen(true);
  };

  return {
    pedidos,
    clientes,
    isLoading: isLoadingPedidos,
    searchTerm,
    setSearchTerm,
    estadoFilter,
    setEstadoFilter,
    isModalOpen,
    setIsModalOpen,
    isStatusModalOpen,
    setIsStatusModalOpen,
    isEntregaModalOpen,
    setIsEntregaModalOpen,
    selectedPedido,
    actions: {
      openNewModal,
      openStatusModal,
      openEntregaModal,
      handleCreate,
      handleUpdateStatus,
      handleConfirmarEntrega
    }
  };
}
