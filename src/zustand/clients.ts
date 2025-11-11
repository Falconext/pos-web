import { create } from 'zustand';
import { del, get, patch, post, put } from '../utils/fetch';
import { IResponse } from '../interfaces/auth';
import { IFormClient, IClient } from '../interfaces/clients';
import useAlertStore from './alert';
import { devtools } from 'zustand/middleware';

export interface IClientsState {
    clients: IClient[];
    totalClients: number;
    resetClients: () => void;
    // getDocument: (data: IDocument) => void
    addClients: (data: IFormClient) => void
    editClients: (data: IFormClient) => void
    getAllClients: (params: any, callback?: Function,
        allProperties?: boolean) => void
    // updateDocument: (data: any) => void
    toggleStateClient: (data: number) => void
    getClientFromDoc: (nroDoc: string) => Promise<any>;
    exportClients: (empresaId: number, search?: string) => Promise<void>;
    importClients: (file: File) => Promise<void>;
}

export const useClientsStore = create<IClientsState>()(devtools((set, _get) => ({
    clients: [],
    getAllClients: async (params: any, callback?: Function,
        _allProperties?: boolean) => {
        try {
            // useAlertStore.setState({ loading: true })
            const filteredParams = Object.entries(params)
                .filter(([_, value]) => value !== undefined)
                .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

            const query = new URLSearchParams(filteredParams).toString();
            const resp: any = await get(`cliente/listar?${query}`);
            console.log(resp)
            if (resp.code === 1) {
                useAlertStore.setState({ success: true });
                set({
                    clients: resp.data.clientes,
                    totalClients: resp.data.total
                }, false, "GET_CLIENTS");
                useAlertStore.setState({ loading: false })
            } else {
                set({
                    clients: []
                });
                useAlertStore.setState({ loading: false })
            }
        } catch (error) {
            useAlertStore.setState({ loading: false })
        } finally {
            if (callback) {
                callback();
            }
        }
    },
    addClients: async (data: any) => {
        useAlertStore.setState({ loading: true });
        try {
            const resp: any = await post(`cliente/crear`, data);
            console.log(resp);
            if (resp.code === 1) {
                useAlertStore.setState({ success: true });
                set((state) => ({
                    clients: [{
                        ...data,
                        id: resp.data?.id,
                    }, ...state.clients]
                }), false, "ADD_CLIENTS");
                useAlertStore.setState({ loading: false });
                useAlertStore.getState().alert("Se agrego el cliente correctamente", "success")
            }
            if (resp.success === false) {
                useAlertStore.setState({ success: false });
                useAlertStore.getState().alert(`Este dni ya ha sido registrado en un cliente`, "error")
            }
        } catch (error: any) {
            useAlertStore.setState({ success: false });
            return useAlertStore.getState().alert(`${error}, el dni ya ha sido registrado en un cliente`, "error")
        }
    },
    editClients: async (data: any) => {
        useAlertStore.setState({ loading: true });
        try {
            const resp: any = await put(`cliente/${data.id}`, data);
            if (resp.code === 1) {
                useAlertStore.setState({ success: true });
                set((state) => ({
                    clients: state.clients.map((item: IClient) =>
                        item.id === data?.id ? { ...item, ...data } : item
                    ),
                }), false, "UPDATE_Clients");
                useAlertStore.setState({ loading: false })
                useAlertStore.getState().alert("Se actualizo el cliente correctamente", "success");
            } else {
                useAlertStore.setState({ loading: false })
                useAlertStore.getState().alert("Error al editar el Clientso", "error");
            }
        } catch (error: any) {
            return useAlertStore.getState().alert(`${error}`, "error")
        }
    },
    toggleStateClient: async (id: number) => {
        console.log(id)
        try {
            const resp: any = await patch(`cliente/${id}/estado`);
            if (resp.code === 1) {
                set((state) => ({
                    clients: state.clients.map((client) =>
                        client.id === id
                            ? { ...client, estado: client.estado === "INACTIVO" ? "ACTIVO" : "INACTIVO" }
                            : client
                    ),
                }), false, "DELETE_Clients");
                useAlertStore.getState().alert("El cliente se ha cambiado su estado correctamente", "success");
            } else {
                useAlertStore.getState().alert("Error al eliminar el documento", "error");
            }
        } catch (error) {

        }
    },
    getClientFromDoc: async (nroDoc: string) => {
        useAlertStore.setState({ loading: true });
        try {
            const endpoint = nroDoc.length === 8 ? `cliente/consultar/DNI/${nroDoc}` : `cliente/consultar/RUC/${nroDoc}`; 
            const resp: any = await get(endpoint);
            console.log("Respuesta backend:", resp);
            useAlertStore.setState({ loading: false });
            if (resp.code === 1) {
                return resp.data;
            } else {
                useAlertStore.getState().alert(`Error: ${resp.message || 'No se encontraron datos'}`, "error");
                return null;
            }
        } catch (error: any) {
            console.error("Error en frontend:", error);
            useAlertStore.setState({ loading: false });
            const errorMessage = error.response?.data?.message || error.message || 'Error al consultar el documento';
            useAlertStore.getState().alert(errorMessage, "error");
            return null;
        }
    },
    exportClients: async (empresaId: number, search?: string) => {
        try {
            useAlertStore.setState({ loading: true });
            const baseUrl = import.meta.env.VITE_API_URL as string;
            const qs = search ? `?search=${encodeURIComponent(search)}` : '';
            const response = await fetch(`${baseUrl}/cliente/empresa/${empresaId}/exportar-archivo${qs}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
                },
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Error al descargar el archivo');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clientes.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            useAlertStore.setState({ success: true });
            useAlertStore.getState().alert('Exportación exitosa', 'success');
        } catch (error: any) {
            console.error('Error en exportClients:', error.message || error);
            useAlertStore.getState().alert(error.message || 'Error al exportar los clientes', 'error');
        } finally {
            useAlertStore.setState({ loading: false });
        }
    },
    importClients: async (file: File) => {
        try {
            useAlertStore.setState({ loading: true });
            const formData = new FormData();
            formData.append('file', file);
            const baseUrl = import.meta.env.VITE_API_URL as string;
            const response = await fetch(`${baseUrl}/cliente/carga-masiva`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
                },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Error al importar los clientes');
            }
            if (result.code === 1 || result.total >= 0) {
                useAlertStore.setState({ success: true });
                useAlertStore.getState().alert('Clientes importados exitosamente', 'success');
            } else {
                throw new Error(result.message || 'Error al importar los clientes');
            }
        } catch (error: any) {
            console.error('Error en importClients:', error.message || error);
            useAlertStore.getState().alert(error.message || 'Error al importar los clientes', 'error');
        } finally {
            useAlertStore.setState({ loading: false });
        }
    },
    resetClients: async () => {
        try {
            set(
                (_state) => ({
                    clients: []
                }),
                false,
                'RESET_CLIENTS'
            );
        } catch (error) {
            console.log(error);
        }
    },
}))); 


