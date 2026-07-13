import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IMantenimiento } from './MantenimientoModel';

export function useMantenimientoViewModel() {
  const alertStore = useAlertStore();
  const {
    mantenimientos,
    isLoadingMantenimientos,
    resumenMantenimiento,
    fetchMantenimientos,
    fetchResumenMantenimiento,
    vehiculos,
    fetchVehiculos,
  } = useLogisticaStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<IMantenimiento | null>(null);

  useEffect(() => {
    fetchMantenimientos({
      search: searchTerm,
      estado: estadoFilter,
      tipo: tipoFilter,
    });
  }, [searchTerm, estadoFilter, tipoFilter]);

  useEffect(() => {
    fetchResumenMantenimiento();
    // Vehículos para el selector del modal
    fetchVehiculos();
  }, []);

  const refetch = () => {
    fetchMantenimientos({
      search: searchTerm,
      estado: estadoFilter,
      tipo: tipoFilter,
    });
    fetchResumenMantenimiento();
  };

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selected) {
        await api.updateMantenimiento(selected.id, data);
        alertStore.alert('Mantenimiento actualizado exitosamente', 'success');
      } else {
        await api.createMantenimiento(data);
        alertStore.alert('Mantenimiento registrado exitosamente', 'success');
      }
      setIsModalOpen(false);
      refetch();
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al guardar mantenimiento', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de cancelar este mantenimiento?')) return;
    alertStore.load(true);
    try {
      await api.deleteMantenimiento(id);
      alertStore.alert('Mantenimiento cancelado', 'success');
      refetch();
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al cancelar', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const openNewModal = () => {
    setSelected(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mant: IMantenimiento) => {
    setSelected(mant);
    setIsModalOpen(true);
  };

  return {
    mantenimientos,
    isLoading: isLoadingMantenimientos,
    resumen: resumenMantenimiento,
    vehiculos,
    searchTerm,
    setSearchTerm,
    estadoFilter,
    setEstadoFilter,
    tipoFilter,
    setTipoFilter,
    isModalOpen,
    setIsModalOpen,
    selected,
    actions: {
      openNewModal,
      openEditModal,
      handleCreateOrUpdate,
      handleDelete,
    },
  };
}
