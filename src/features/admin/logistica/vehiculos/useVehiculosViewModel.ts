import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IVehiculo } from './VehiculosModel';

export function useVehiculosViewModel() {
  const alertStore = useAlertStore();
  const { vehiculos, isLoadingVehiculos, fetchVehiculos } = useLogisticaStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<IVehiculo | null>(null);

  useEffect(() => {
    fetchVehiculos(searchTerm, estadoFilter);
  }, [searchTerm, estadoFilter]);

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selectedVehiculo) {
        await api.updateVehiculo(selectedVehiculo.id, data);
        alertStore.alert('Vehículo actualizado exitosamente', 'success');
      } else {
        await api.createVehiculo(data);
        alertStore.alert('Vehículo creado exitosamente', 'success');
      }
      setIsModalOpen(false);
      fetchVehiculos(searchTerm, estadoFilter);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al guardar vehículo', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este vehículo?')) return;
    alertStore.load(true);
    try {
      await api.deleteVehiculo(id);
      alertStore.alert('Vehículo eliminado', 'success');
      fetchVehiculos(searchTerm, estadoFilter);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al eliminar', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const openNewModal = () => {
    setSelectedVehiculo(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vehiculo: IVehiculo) => {
    setSelectedVehiculo(vehiculo);
    setIsModalOpen(true);
  };

  return {
    vehiculos,
    isLoading: isLoadingVehiculos,
    searchTerm,
    setSearchTerm,
    estadoFilter,
    setEstadoFilter,
    isModalOpen,
    setIsModalOpen,
    selectedVehiculo,
    actions: {
      openNewModal,
      openEditModal,
      handleCreateOrUpdate,
      handleDelete
    }
  };
}
