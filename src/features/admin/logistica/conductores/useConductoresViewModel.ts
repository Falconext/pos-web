import { useState, useEffect, useMemo } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IConductor } from './ConductoresModel';

export function useConductoresViewModel() {
  const alertStore = useAlertStore();
  const { conductores, isLoadingConductores, fetchConductores } = useLogisticaStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState<IConductor | null>(null);

  useEffect(() => {
    fetchConductores(searchTerm, estadoFilter);
  }, [searchTerm, estadoFilter]);

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selectedConductor) {
        await api.updateConductor(selectedConductor.id, data);
        alertStore.alert('Conductor actualizado exitosamente', 'success');
      } else {
        await api.createConductor(data);
        alertStore.alert('Conductor creado exitosamente', 'success');
      }
      setIsModalOpen(false);
      fetchConductores(searchTerm, estadoFilter);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al guardar conductor', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este conductor?')) return;
    alertStore.load(true);
    try {
      await api.deleteConductor(id);
      alertStore.alert('Conductor eliminado', 'success');
      fetchConductores(searchTerm, estadoFilter);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al eliminar', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const openNewModal = () => {
    setSelectedConductor(null);
    setIsModalOpen(true);
  };

  const openEditModal = (conductor: IConductor) => {
    setSelectedConductor(conductor);
    setIsModalOpen(true);
  };

  return {
    conductores,
    isLoading: isLoadingConductores,
    searchTerm,
    setSearchTerm,
    estadoFilter,
    setEstadoFilter,
    isModalOpen,
    setIsModalOpen,
    selectedConductor,
    actions: {
      openNewModal,
      openEditModal,
      handleCreateOrUpdate,
      handleDelete
    }
  };
}
