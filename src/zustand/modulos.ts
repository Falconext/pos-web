import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../utils/apiClient';

export interface IModulo {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    icono: string;
    activo: boolean;
    orden: number;
}

export interface IModulosState {
    modulos: IModulo[];
    loading: boolean;
    getAllModulos: () => Promise<void>;
    createModulo: (modulo: any) => Promise<boolean>;
    updateModulo: (id: number, modulo: any) => Promise<boolean>;
    deleteModulo: (id: number) => Promise<boolean>;
}

export const useModulosStore = create<IModulosState>()(
    devtools(
        (set, get) => ({
            modulos: [],
            loading: false,

            getAllModulos: async () => {
                try {
                    set({ loading: true });
                    const { data } = await apiClient.get('/modulos');
                    set({ modulos: Array.isArray(data) ? data : (data.data || []) });
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
                    get().getAllModulos();
                    return true;
                } catch (error) {
                    console.error('Error creating module:', error);
                    return false;
                }
            },

            updateModulo: async (id: number, modulo: any) => {
                try {
                    set({ loading: true });
                    await apiClient.put(`/modulos/${id}`, modulo);
                    get().getAllModulos();
                    return true;
                } catch (error) {
                    console.error('Error updating module:', error);
                    return false;
                }
            },

            deleteModulo: async (id: number) => {
                try {
                    set({ loading: true });
                    await apiClient.delete(`/modulos/${id}`);
                    get().getAllModulos();
                    return true;
                } catch (error) {
                    console.error('Error deleting module:', error);
                    return false;
                }
            }
        }),
        {
            name: 'modulos-storage',
        }
    )
);
