import { useState, useEffect } from 'react';
import { useLogisticaStore } from '@/zustand/logistica';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { IDocumento } from './DocumentosModel';

export function useDocumentosViewModel() {
  const alertStore = useAlertStore();
  const {
    documentos,
    isLoadingDocumentos,
    resumenDocumentos,
    fetchDocumentos,
    fetchResumenDocumentos,
    vehiculos,
    fetchVehiculos,
    conductores,
    fetchConductores,
  } = useLogisticaStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [entidadFilter, setEntidadFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<IDocumento | null>(null);

  useEffect(() => {
    fetchDocumentos({ search: searchTerm, entidad: entidadFilter, estado: estadoFilter });
  }, [searchTerm, entidadFilter, estadoFilter]);

  useEffect(() => {
    fetchResumenDocumentos();
    fetchVehiculos();
    fetchConductores();
  }, []);

  const refetch = () => {
    fetchDocumentos({ search: searchTerm, entidad: entidadFilter, estado: estadoFilter });
    fetchResumenDocumentos();
  };

  const handleCreateOrUpdate = async (data: any) => {
    alertStore.load(true);
    try {
      if (selected) {
        await api.updateDocumento(selected.id, data);
        alertStore.alert('Documento actualizado exitosamente', 'success');
      } else {
        await api.createDocumento(data);
        alertStore.alert('Documento registrado exitosamente', 'success');
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
    if (!window.confirm('¿Eliminar este documento?')) return;
    alertStore.load(true);
    try {
      await api.deleteDocumento(id);
      alertStore.alert('Documento eliminado', 'success');
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
  const openEditModal = (doc: IDocumento) => {
    setSelected(doc);
    setIsModalOpen(true);
  };

  return {
    documentos,
    isLoading: isLoadingDocumentos,
    resumen: resumenDocumentos,
    vehiculos,
    conductores,
    searchTerm,
    setSearchTerm,
    entidadFilter,
    setEntidadFilter,
    estadoFilter,
    setEstadoFilter,
    isModalOpen,
    setIsModalOpen,
    selected,
    actions: { openNewModal, openEditModal, handleCreateOrUpdate, handleDelete },
  };
}
