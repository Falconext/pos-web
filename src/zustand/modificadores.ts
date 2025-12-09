import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import useAlertStore from './alert';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface OpcionModificador {
  id: number;
  nombre: string;
  descripcion?: string;
  precioExtra: number;
  orden: number;
  activo: boolean;
  esDefault: boolean;
}

export interface GrupoModificador {
  id: number;
  nombre: string;
  descripcion?: string;
  esObligatorio: boolean;
  seleccionMin: number;
  seleccionMax: number;
  orden: number;
  activo: boolean;
  opciones: OpcionModificador[];
  _count?: { productos: number };
}

interface CrearGrupoPayload {
  nombre: string;
  descripcion?: string;
  esObligatorio?: boolean;
  seleccionMin?: number;
  seleccionMax?: number;
  orden?: number;
}

interface CrearOpcionPayload {
  nombre: string;
  descripcion?: string;
  precioExtra?: number;
  orden?: number;
  esDefault?: boolean;
}

export interface ModificadoresState {
  grupos: GrupoModificador[];
  loading: boolean;
  getAllGrupos: () => Promise<void>;
  crearGrupo: (data: CrearGrupoPayload) => Promise<void>;
  actualizarGrupo: (id: number, data: CrearGrupoPayload) => Promise<void>;
  eliminarGrupo: (id: number) => Promise<void>;
  agregarOpcion: (grupoId: number, data: CrearOpcionPayload) => Promise<void>;
  actualizarOpcion: (id: number, data: Partial<CrearOpcionPayload & { activo: boolean }>) => Promise<void>;
  eliminarOpcion: (id: number) => Promise<void>;
  toggleOpcionActivo: (opcion: OpcionModificador) => Promise<void>;
}

export const useModificadoresStore = create<ModificadoresState>()(
  devtools((set, get) => ({
    grupos: [],
    loading: false,

    getAllGrupos: async () => {
      try {
        set({ loading: true }, false, 'MODS_GET_ALL_START');
        const res = await axios.get(`${BASE_URL}/modificadores/grupos?incluirInactivos=true`);
        const data: GrupoModificador[] = res.data?.data || res.data || [];
        set({ grupos: data, loading: false }, false, 'MODS_GET_ALL_SUCCESS');
      } catch (error) {
        set({ grupos: [], loading: false }, false, 'MODS_GET_ALL_ERROR');
        useAlertStore.getState().alert('Error al cargar modificadores', 'error');
      }
    },

    crearGrupo: async (data) => {
      try {
        useAlertStore.setState({ loading: true });
        const res = await axios.post(`${BASE_URL}/modificadores/grupos`, data);
        const nuevo: GrupoModificador = res.data?.data;
        set((state) => ({ grupos: [nuevo, ...state.grupos] }), false, 'MODS_CREATE_GROUP');
        useAlertStore.setState({ success: true });
        useAlertStore.getState().alert('Grupo creado', 'success');
      } catch (error: any) {
        useAlertStore.getState().alert(error?.message || 'Error al crear grupo', 'error');
      } finally {
        useAlertStore.setState({ loading: false });
      }
    },

    actualizarGrupo: async (id, data) => {
      try {
        useAlertStore.setState({ loading: true });
        const res = await axios.patch(`${BASE_URL}/modificadores/grupos/${id}`, data);
        const actualizado: GrupoModificador = res.data?.data ?? null;
        set((state) => ({
          grupos: state.grupos.map((g) => (g.id === id && actualizado ? { ...g, ...actualizado } : g)),
        }), false, 'MODS_UPDATE_GROUP');
        useAlertStore.setState({ success: true });
        useAlertStore.getState().alert('Grupo actualizado', 'success');
      } catch (error: any) {
        useAlertStore.getState().alert(error?.message || 'Error al actualizar grupo', 'error');
      } finally {
        useAlertStore.setState({ loading: false });
      }
    },

    eliminarGrupo: async (id) => {
      try {
        useAlertStore.setState({ loading: true });
        await axios.delete(`${BASE_URL}/modificadores/grupos/${id}`);
        set((state) => ({ grupos: state.grupos.filter((g) => g.id !== id) }), false, 'MODS_DELETE_GROUP');
        useAlertStore.setState({ success: true });
        useAlertStore.getState().alert('Grupo eliminado', 'success');
      } catch (error: any) {
        useAlertStore.getState().alert(error?.message || 'Error al eliminar grupo', 'error');
      } finally {
        useAlertStore.setState({ loading: false });
      }
    },

    agregarOpcion: async (grupoId, data) => {
      try {
        useAlertStore.setState({ loading: true });
        const res = await axios.post(`${BASE_URL}/modificadores/grupos/${grupoId}/opciones`, data);
        const opcion: OpcionModificador = res.data?.data ?? null;
        if (!opcion) {
          // Si el backend no devuelve la opción, recargar grupos completos
          await get().getAllGrupos();
        } else {
          set((state) => ({
            grupos: state.grupos.map((g) =>
              g.id === grupoId ? { ...g, opciones: [...g.opciones, opcion] } : g,
            ),
          }), false, 'MODS_ADD_OPTION');
        }
        useAlertStore.setState({ success: true });
        useAlertStore.getState().alert('Opción agregada', 'success');
      } catch (error: any) {
        useAlertStore.getState().alert(error?.message || 'Error al agregar opción', 'error');
      } finally {
        useAlertStore.setState({ loading: false });
      }
    },

    actualizarOpcion: async (id, data) => {
      try {
        useAlertStore.setState({ loading: true });
        const res = await axios.patch(`${BASE_URL}/modificadores/opciones/${id}`, data);
        const updated: OpcionModificador = res.data?.data ?? null;
        if (!updated) {
          await get().getAllGrupos();
        } else {
          set((state) => ({
            grupos: state.grupos.map((g) => ({
              ...g,
              opciones: g.opciones.map((o) => (o.id === id ? { ...o, ...updated } : o)),
            })),
          }), false, 'MODS_UPDATE_OPTION');
        }
        useAlertStore.setState({ success: true });
        useAlertStore.getState().alert('Opción actualizada', 'success');
      } catch (error: any) {
        useAlertStore.getState().alert(error?.message || 'Error al actualizar opción', 'error');
      } finally {
        useAlertStore.setState({ loading: false });
      }
    },

    eliminarOpcion: async (id) => {
      try {
        useAlertStore.setState({ loading: true });
        await axios.delete(`${BASE_URL}/modificadores/opciones/${id}`);
        set((state) => ({
          grupos: state.grupos.map((g) => ({
            ...g,
            opciones: g.opciones.filter((o) => o.id !== id),
          })),
        }), false, 'MODS_DELETE_OPTION');
        useAlertStore.setState({ success: true });
        useAlertStore.getState().alert('Opción eliminada', 'success');
      } catch (error: any) {
        useAlertStore.getState().alert(error?.message || 'Error al eliminar opción', 'error');
      } finally {
        useAlertStore.setState({ loading: false });
      }
    },

    toggleOpcionActivo: async (opcion) => {
      try {
        const nuevoActivo = !opcion.activo;
        await axios.patch(`${BASE_URL}/modificadores/opciones/${opcion.id}`, { activo: nuevoActivo });
        set((state) => ({
          grupos: state.grupos.map((g) => ({
            ...g,
            opciones: g.opciones.map((o) =>
              o.id === opcion.id ? { ...o, activo: nuevoActivo } : o,
            ),
          })),
        }), false, 'MODS_TOGGLE_OPTION_ACTIVE');
      } catch (error: any) {
        useAlertStore.getState().alert(error?.message || 'Error al actualizar opción', 'error');
      }
    },
  })),
);
