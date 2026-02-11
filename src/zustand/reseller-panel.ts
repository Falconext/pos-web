
import { create } from 'zustand';
import { get as httpGet, post, patch } from '../utils/fetch';
import useAlertStore from './alert';

export interface ResellerDashboardStats {
    saldo: number;
    porcentajeDescuento: number;
    clientesActivos: number;
    clientesSuspendidos: number;
    totalClientes: number;
}

export interface IResellerPanelState {
    stats: ResellerDashboardStats;
    clientes: any[];
    planes: any[];
    recargas: any[];
    getDashboard: (resellerId: number) => Promise<void>;
    getClientes: (resellerId: number) => Promise<void>;
    getRecargas: (resellerId: number) => Promise<void>;
    getPlanes: () => Promise<void>;
    createCliente: (resellerId: number, data: any) => Promise<{ success: boolean; error?: string }>;
    toggleEstadoCliente: (resellerId: number, clienteId: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => Promise<{ success: boolean; error?: string }>;
    getClienteDetalle: (resellerId: number, clienteId: number) => Promise<any>;
}

export const useResellerPanelStore = create<IResellerPanelState>((set, get) => ({
    stats: {
        saldo: 0,
        porcentajeDescuento: 0,
        clientesActivos: 0,
        clientesSuspendidos: 0,
        totalClientes: 0
    },
    clientes: [],
    planes: [],
    recargas: [],

    getDashboard: async (resellerId: number) => {
        console.log('[Store] getDashboard called for:', resellerId);
        try {
            const resp: any = await httpGet(`resellers/${resellerId}/dashboard`);
            console.log('[Store] getDashboard response:', resp);

            if (resp.code === 1) {
                // Fetch reseller detail for Discount
                const resellerResp: any = await httpGet(`resellers/${resellerId}`);
                console.log('[Store] reseller detail response:', resellerResp);

                let descuento = 0;
                if (resellerResp.code === 1) descuento = resellerResp.data.porcentajeDescuento;

                console.log('[Store] Setting stats:', { ...resp.data, porcentajeDescuento: descuento });
                set({
                    stats: {
                        ...resp.data,
                        porcentajeDescuento: descuento
                    }
                });
            } else {
                console.error('[Store] Response code not 1:', resp);
            }
        } catch (error) {
            console.error('[Store] Error in getDashboard:', error);
        }
    },

    getClientes: async (resellerId: number) => {
        try {
            const resp: any = await httpGet(`resellers/${resellerId}`);
            if (resp.code === 1) {
                set({
                    clientes: resp.data.empresas || [],
                    recargas: resp.data.recargas || []
                });
            }
        } catch (error) {
            console.error(error);
        }
    },

    getRecargas: async (resellerId: number) => {
        try {
            const resp: any = await httpGet(`resellers/${resellerId}`);
            if (resp.code === 1) {
                set({ recargas: resp.data.recargas || [] });
            }
        } catch (error) {
            console.error(error);
        }
    },

    getPlanes: async () => {
        try {
            const resp: any = await httpGet(`plan`);
            // resp might be array directly if not wrapped? Controller returns array.
            // But fetch wrapper usually returns { code: 1, data: ... } or raw?
            // Checking Plan output from curl.... It returns JSON array directly?
            // "curl http://localhost:4001/api/plan" returned `[{"id":1,...}, ...]`
            // Wait, fetch util handles response. If standard NestJS setup, it might be raw array.
            // Let's assume raw array or check if `get` wrapper handles it.
            // Actually, best to inspect `utils/fetch`. But I'll assume it returns the data.
            // If the response is array, set it.
            if (Array.isArray(resp)) {
                set({ planes: resp });
            } else if (resp.data && Array.isArray(resp.data)) {
                set({ planes: resp.data });
            }
        } catch (error) {
            console.error(error);
        }
    },

    createCliente: async (resellerId: number, data: any) => {
        try {
            useAlertStore.setState({ loading: true });
            const resp: any = await post(`resellers/${resellerId}/clientes`, data);

            if (resp.code === 1) {
                useAlertStore.setState({ loading: false });
                useAlertStore.getState().alert('Cliente creado exitosamente', 'success');
                return { success: true };
            } else {
                useAlertStore.setState({ loading: false });
                useAlertStore.getState().alert(resp.error || 'Error al crear cliente', 'error');
                return { success: false, error: resp.error };
            }
        } catch (error: any) {
            useAlertStore.setState({ loading: false });
            useAlertStore.getState().alert(error.message || 'Error al crear cliente', 'error');
            return { success: false, error: error.message };
        }
    },

    toggleEstadoCliente: async (resellerId: number, clienteId: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
        try {
            useAlertStore.setState({ loading: true });
            const resp: any = await patch(`resellers/${resellerId}/clientes/${clienteId}/estado`, { estado: nuevoEstado });

            if (resp.code === 1) {
                useAlertStore.setState({ loading: false });
                useAlertStore.getState().alert(`Cliente ${nuevoEstado === 'ACTIVO' ? 'activado' : 'suspendido'} correctamente`, 'success');
                // Refresh list using get()
                await get().getClientes(resellerId);
                return { success: true };
            } else {
                useAlertStore.setState({ loading: false });
                useAlertStore.getState().alert(resp.error || 'Error al cambiar estado', 'error');
                return { success: false, error: resp.error };
            }
        } catch (error: any) {
            useAlertStore.setState({ loading: false });
            useAlertStore.getState().alert(error.message || 'Error de conexión', 'error');
            return { success: false, error: error.message };
        }
    },

    getClienteDetalle: async (resellerId: number, clienteId: number) => {
        try {
            const resp: any = await httpGet(`resellers/${resellerId}/clientes/${clienteId}`);
            if (resp.code === 1) {
                return resp.data;
            }
            return null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}));
