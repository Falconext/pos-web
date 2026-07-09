import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IAlmacen } from './AlmacenesModel';

export function useAlmacenesViewModel() {
  const alertStore = useAlertStore();
  const { almacenes, isLoadingAlmacenes, fetchAlmacenes } = useLogisticaStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activoFilter, setActivoFilter] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAlmacen, setSelectedAlmacen] = useState<IAlmacen | null>(null);

  useEffect(() => {
    let activo: boolean | undefined = undefined;
    if (activoFilter === 'true') activo = true;
    if (activoFilter === 'false') activo = false;
    
    fetchAlmacenes(searchTerm, activo);
  }, [searchTerm, activoFilter]);

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selectedAlmacen) {
        await api.updateAlmacen(selectedAlmacen.id, data);
        alertStore.alert('Almacén actualizado exitosamente', 'success');
      } else {
        await api.createAlmacen(data);
        alertStore.alert('Almacén creado exitosamente', 'success');
      }
      setIsModalOpen(false);
      let activo: boolean | undefined = undefined;
      if (activoFilter === 'true') activo = true;
      if (activoFilter === 'false') activo = false;
      fetchAlmacenes(searchTerm, activo);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al guardar almacén', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este almacén?')) return;
    alertStore.load(true);
    try {
      await api.deleteAlmacen(id);
      alertStore.alert('Almacén eliminado', 'success');
      let activo: boolean | undefined = undefined;
      if (activoFilter === 'true') activo = true;
      if (activoFilter === 'false') activo = false;
      fetchAlmacenes(searchTerm, activo);
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al eliminar', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const openNewModal = () => {
    setSelectedAlmacen(null);
    setIsModalOpen(true);
  };

  const openEditModal = (almacen: IAlmacen) => {
    setSelectedAlmacen(almacen);
    setIsModalOpen(true);
  };

  return {
    almacenes,
    isLoading: isLoadingAlmacenes,
    searchTerm,
    setSearchTerm,
    activoFilter,
    setActivoFilter,
    isModalOpen,
    setIsModalOpen,
    selectedAlmacen,
    actions: {
      openNewModal,
      openEditModal,
      handleCreateOrUpdate,
      handleDelete
    }
  };
}
