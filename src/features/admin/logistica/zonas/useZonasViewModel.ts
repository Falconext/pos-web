import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IZona } from './ZonasModel';

export function useZonasViewModel() {
  const alertStore = useAlertStore();
  const { zonas, isLoadingZonas, fetchZonas } = useLogisticaStore();
  
  const [activaFilter, setActivaFilter] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedZona, setSelectedZona] = useState<IZona | null>(null);

  useEffect(() => {
    let activa: boolean | undefined = undefined;
    if (activaFilter === 'true') activa = true;
    if (activaFilter === 'false') activa = false;
    
    fetchZonas(activa);
  }, [activaFilter]);

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selectedZona) {
        await api.updateZona(selectedZona.id, data);
        alertStore.alert('Zona actualizada exitosamente', 'success');
      } else {
        await api.createZona(data);
        alertStore.alert('Zona creada exitosamente', 'success');
      }
      setIsModalOpen(false);
      let activa: boolean | undefined = undefined;
      if (activaFilter === 'true') activa = true;
      if (activaFilter === 'false') activa = false;
      fetchZonas(activa);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al guardar zona', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta zona?')) return;
    alertStore.load(true);
    try {
      await api.deleteZona(id);
      alertStore.alert('Zona eliminada', 'success');
      let activa: boolean | undefined = undefined;
      if (activaFilter === 'true') activa = true;
      if (activaFilter === 'false') activa = false;
      fetchZonas(activa);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al eliminar', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const openNewModal = () => {
    setSelectedZona(null);
    setIsModalOpen(true);
  };

  const openEditModal = (zona: IZona) => {
    setSelectedZona(zona);
    setIsModalOpen(true);
  };

  return {
    zonas,
    isLoading: isLoadingZonas,
    activaFilter,
    setActivaFilter,
    isModalOpen,
    setIsModalOpen,
    selectedZona,
    actions: {
      openNewModal,
      openEditModal,
      handleCreateOrUpdate,
      handleDelete
    }
  };
}
