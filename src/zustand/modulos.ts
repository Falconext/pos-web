import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../utils/apiClient';

export interface ISubModulo {
    id: number;
    moduloId: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    orden: number;
}

export interface IModulo {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    icono: string;
    activo: boolean;
    orden: number;
    subModulos: ISubModulo[];
}

export interface IModulosState {
    modulos: IModulo[];
    loading: boolean;
    getAllModulos: (admin?: boolean) => Promise<void>;
    createModulo: (modulo: any) => Promise<boolean>;
    updateModulo: (id: number, modulo: any) => Promise<boolean>;
    deleteModulo: (id: number) => Promise<boolean>;
    createSubModulo: (dto: { moduloId: number; codigo: string; nombre: string; descripcion?: string; activo?: boolean; orden?: number }) => Promise<boolean>;
    updateSubModulo: (id: number, dto: { nombre?: string; descripcion?: string; activo?: boolean; orden?: number }) => Promise<boolean>;
    deleteSubModulo: (id: number) => Promise<boolean>;
}

export const useModulosStore = create<IModulosState>()(
    devtools(
        (set, get) => ({
            modulos: [],
            loading: false,

            getAllModulos: async (admin = false) => {
                try {
                    set({ loading: true });
                    const { data } = await apiClient.get(`/modulos${admin ? '?admin=true' : ''}`);
                    const list = Array.isArray(data) ? data : (data.data || []);
                    set({ modulos: list.map((m: any) => ({ ...m, subModulos: m.subModulos || [] })) });
                } catch (error) {
                    console.error('Error loading modules:', error);
                    set({ modulos: [] });
                } finally {
                    set({ loading: false });
                }
            },

            createModulo: async (modulo: any) => {
                try {
                    set({ loading: true });
                    await apiClient.post('/modulos', modulo);
                    await get().getAllModulos(true);
                    return true;
                } catch (error) {
                    console.error('Error creating module:', error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            updateModulo: async (id: number, modulo: any) => {
                try {
                    set({ loading: true });
                    await apiClient.put(`/modulos/${id}`, modulo);
                    await get().getAllModulos(true);
                    return true;
                } catch (error) {
                    console.error('Error updating module:', error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            deleteModulo: async (id: number) => {
                try {
                    set({ loading: true });
                    await apiClient.delete(`/modulos/${id}`);
                    await get().getAllModulos(true);
                    return true;
                } catch (error) {
                    console.error('Error deleting module:', error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            createSubModulo: async (dto) => {
                try {
                    set({ loading: true });
                    await apiClient.post('/modulos/submodulos', dto);
                    await get().getAllModulos(true);
                    return true;
                } catch (error) {
                    console.error('Error creating submodule:', error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            updateSubModulo: async (id, dto) => {
                try {
                    set({ loading: true });
                    await apiClient.put(`/modulos/submodulos/${id}`, dto);
                    await get().getAllModulos(true);
                    return true;
                } catch (error) {
                    console.error('Error updating submodule:', error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            deleteSubModulo: async (id) => {
                try {
                    set({ loading: true });
                    await apiClient.delete(`/modulos/submodulos/${id}`);
                    await get().getAllModulos(true);
                    return true;
                } catch (error) {
                    console.error('Error deleting submodule:', error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },
        }),
        {
            name: 'modulos-storage',
        }
    )
);
