import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IDispositivo } from './DispositivosModel';

export function useDispositivosViewModel() {
  const alertStore = useAlertStore();
  const {
    dispositivos,
    isLoadingDispositivos,
    resumenDispositivos,
    fetchDispositivos,
    fetchResumenDispositivos,
    vehiculos,
    fetchVehiculos,
  } = useLogisticaStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<IDispositivo | null>(null);

  useEffect(() => {
    fetchDispositivos(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    fetchResumenDispositivos();
    fetchVehiculos();
  }, []);

  const refetch = () => {
    fetchDispositivos(searchTerm);
    fetchResumenDispositivos();
  };

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selected) {
        await api.updateDispositivo(selected.id, data);
        alertStore.alert('Dispositivo actualizado exitosamente', 'success');
      } else {
        await api.createDispositivo(data);
        alertStore.alert('Dispositivo registrado exitosamente', 'success');
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
    if (!window.confirm('¿Eliminar este dispositivo? Se borrará su historial de posiciones.')) return;
    alertStore.load(true);
    try {
      await api.deleteDispositivo(id);
      alertStore.alert('Dispositivo eliminado', 'success');
      refetch();
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al eliminar', 'error');
    } finally {
      alertStore.load(false);
    }
  };

  const copiarToken = (token: string) => {
    navigator.clipboard?.writeText(token);
    alertStore.alert('Token copiado al portapapeles', 'success');
  };

  const openNewModal = () => {
    setSelected(null);
    setIsModalOpen(true);
  };
  const openEditModal = (d: IDispositivo) => {
    setSelected(d);
    setIsModalOpen(true);
  };

  return {
    dispositivos,
    isLoading: isLoadingDispositivos,
    resumen: resumenDispositivos,
    vehiculos,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    selected,
    actions: { openNewModal, openEditModal, handleCreateOrUpdate, handleDelete, copiarToken },
  };
}
