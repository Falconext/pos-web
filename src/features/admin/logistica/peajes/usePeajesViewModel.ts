import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IPeaje } from './PeajesModel';

export function usePeajesViewModel() {
  const alertStore = useAlertStore();
  const {
    peajes,
    isLoadingPeajes,
    resumenPeaje,
    fetchPeajes,
    fetchResumenPeaje,
    vehiculos,
    fetchVehiculos,
  } = useLogisticaStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<IPeaje | null>(null);

  useEffect(() => {
    fetchPeajes({ search: searchTerm, tipo: tipoFilter, estado: estadoFilter });
  }, [searchTerm, tipoFilter, estadoFilter]);

  useEffect(() => {
    fetchResumenPeaje();
    fetchVehiculos();
  }, []);

  const refetch = () => {
    fetchPeajes({ search: searchTerm, tipo: tipoFilter, estado: estadoFilter });
    fetchResumenPeaje();
  };

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selected) {
        await api.updatePeaje(selected.id, data);
        alertStore.alert('Registro actualizado exitosamente', 'success');
      } else {
        await api.createPeaje(data);
        alertStore.alert('Registro creado exitosamente', 'success');
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
    if (!window.confirm('¿Eliminar este registro?')) return;
    alertStore.load(true);
    try {
      await api.deletePeaje(id);
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
  const openEditModal = (reg: IPeaje) => {
    setSelected(reg);
    setIsModalOpen(true);
  };

  return {
    peajes,
    isLoading: isLoadingPeajes,
    resumen: resumenPeaje,
    vehiculos,
    searchTerm,
    setSearchTerm,
    tipoFilter,
    setTipoFilter,
    estadoFilter,
    setEstadoFilter,
    isModalOpen,
    setIsModalOpen,
    selected,
    actions: { openNewModal, openEditModal, handleCreateOrUpdate, handleDelete },
  };
}
