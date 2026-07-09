import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IDespacho } from './DespachosModel';

export function useDespachosViewModel() {
  const alertStore = useAlertStore();
  const { 
    despachos, isLoadingDespachos, fetchDespachos,
    conductores, fetchConductores,
    vehiculos, fetchVehiculos,
    almacenes, fetchAlmacenes
  } = useLogisticaStore();
  
  const [estadoFilter, setEstadoFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedDespacho, setSelectedDespacho] = useState<IDespacho | null>(null);

  useEffect(() => {
    fetchDespachos(estadoFilter);
  }, [estadoFilter]);

  useEffect(() => {
    if (isModalOpen) {
      fetchConductores('', 'DISPONIBLE');
      fetchVehiculos('', 'DISPONIBLE');
      fetchAlmacenes('', true);
    }
  }, [isModalOpen]);

  const handleCreate = async (data: any) => {
    alertStore.load(true);
    try {
      await api.createDespacho(data);
      alertStore.alert('Ruta de despacho creada', 'success');
      setIsModalOpen(false);
      fetchDespachos(estadoFilter);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al crear despacho', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const handleUpdateStatus = async (data: { estado: string; motivo?: string }) => {
    if (!selectedDespacho) return;
    alertStore.load(true);
    try {
      await api.updateEstadoDespacho(selectedDespacho.id, data);
      alertStore.alert('Estado del despacho actualizado', 'success');
      setIsStatusModalOpen(false);
      fetchDespachos(estadoFilter);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al actualizar estado', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const openNewModal = () => {
    setIsModalOpen(true);
  };

  const openStatusModal = (despacho: IDespacho) => {
    setSelectedDespacho(despacho);
    setIsStatusModalOpen(true);
  };

  return {
    despachos,
    conductores,
    vehiculos,
    almacenes,
    isLoading: isLoadingDespachos,
    estadoFilter,
    setEstadoFilter,
    isModalOpen,
    setIsModalOpen,
    isStatusModalOpen,
    setIsStatusModalOpen,
    selectedDespacho,
    actions: {
      openNewModal,
      openStatusModal,
      handleCreate,
      handleUpdateStatus
    }
  };
}
