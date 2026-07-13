import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IGeocerca } from './GeocercasModel';

export function useGeocercasViewModel() {
  const alertStore = useAlertStore();
  const {
    geocercas,
    isLoadingGeocercas,
    resumenGeocercas,
    eventosGeocercas,
    fetchGeocercas,
    fetchResumenGeocercas,
    fetchEventosGeocercas,
  } = useLogisticaStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<IGeocerca | null>(null);

  useEffect(() => {
    fetchGeocercas();
    fetchResumenGeocercas();
    fetchEventosGeocercas(15);
  }, []);

  const refetch = () => {
    fetchGeocercas();
    fetchResumenGeocercas();
    fetchEventosGeocercas(15);
  };

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selected) {
        await api.updateGeocerca(selected.id, data);
        alertStore.alert('Geocerca actualizada exitosamente', 'success');
      } else {
        await api.createGeocerca(data);
        alertStore.alert('Geocerca creada exitosamente', 'success');
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
    if (!window.confirm('¿Eliminar esta geocerca? Se borrarán sus eventos.')) return;
    alertStore.load(true);
    try {
      await api.deleteGeocerca(id);
      alertStore.alert('Geocerca eliminada', 'success');
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
  const openEditModal = (g: IGeocerca) => {
    setSelected(g);
    setIsModalOpen(true);
  };

  return {
    geocercas,
    isLoading: isLoadingGeocercas,
    resumen: resumenGeocercas,
    eventos: eventosGeocercas,
    isModalOpen,
    setIsModalOpen,
    selected,
    actions: { openNewModal, openEditModal, handleCreateOrUpdate, handleDelete },
  };
}
