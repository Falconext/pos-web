import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IClienteLogistica } from './ClientesModel';

export function useClientesViewModel() {
  const alertStore = useAlertStore();
  const { clientes, isLoadingClientes, fetchClientes, zonas, fetchZonas } = useLogisticaStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<IClienteLogistica | null>(null);

  useEffect(() => {
    fetchClientes(searchTerm);
    fetchZonas(true); // Cargar zonas activas para el select
  }, [searchTerm]);

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selectedCliente) {
        await api.updateCliente(selectedCliente.id, data);
        alertStore.alert('Cliente actualizado exitosamente', 'success');
      } else {
        await api.createCliente(data);
        alertStore.alert('Cliente creado exitosamente', 'success');
      }
      setIsModalOpen(false);
      fetchClientes(searchTerm);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al guardar cliente', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este cliente logístico?')) return;
    alertStore.load(true);
    try {
      await api.deleteCliente(id);
      alertStore.alert('Cliente eliminado', 'success');
      fetchClientes(searchTerm);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al eliminar', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const openNewModal = () => {
    setSelectedCliente(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cliente: IClienteLogistica) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };

  return {
    clientes,
    zonasActivas: zonas,
    isLoading: isLoadingClientes,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    selectedCliente,
    actions: {
      openNewModal,
      openEditModal,
      handleCreateOrUpdate,
      handleDelete
    }
  };
}
