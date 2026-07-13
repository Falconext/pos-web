import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { ICombustible } from './CombustibleModel';

export function useCombustibleViewModel() {
  const alertStore = useAlertStore();
  const {
    combustibles,
    isLoadingCombustibles,
    resumenCombustible,
    fetchCombustibles,
    fetchResumenCombustible,
    vehiculos,
    fetchVehiculos,
  } = useLogisticaStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<ICombustible | null>(null);

  useEffect(() => {
    fetchCombustibles({ search: searchTerm });
  }, [searchTerm]);

  useEffect(() => {
    fetchResumenCombustible();
    fetchVehiculos();
  }, []);

  const refetch = () => {
    fetchCombustibles({ search: searchTerm });
    fetchResumenCombustible();
  };

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selected) {
        await api.updateCombustible(selected.id, data);
        alertStore.alert('Carga actualizada exitosamente', 'success');
      } else {
        await api.createCombustible(data);
        alertStore.alert('Carga registrada exitosamente', 'success');
      }
      setIsModalOpen(false);
      refetch();
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al guardar', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este registro de combustible?')) return;
    alertStore.load(true);
    try {
      await api.deleteCombustible(id);
      alertStore.alert('Registro eliminado', 'success');
      refetch();
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al eliminar', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const openNewModal = () => {
    setSelected(null);
    setIsModalOpen(true);
  };
  const openEditModal = (reg: ICombustible) => {
    setSelected(reg);
    setIsModalOpen(true);
  };

  return {
    combustibles,
    isLoading: isLoadingCombustibles,
    resumen: resumenCombustible,
    vehiculos,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    selected,
    actions: { openNewModal, openEditModal, handleCreateOrUpdate, handleDelete },
  };
}
