import { create } from 'zustand';
import { get, post } from '../utils/fetch';
import useAlertStore from './alert';
import { devtools } from 'zustand/middleware';

export interface ICompra {
    id: number;
    serie: string;
    numero: string;
    fechaEmision: string;
    fechaVencimiento?: string;
    proveedor: {
        nombre: string;
        nroDoc: string;
    };
    moneda: string;
    total: number;
    estado: string;
    estadoPago: string;
    detalles?: any[];
    cuotas?: any | string;
    saldo?: number;
}

export interface IComprasState {
    compras: ICompra[];
    totalCompras: number;
    compraDetalle: ICompra | null;
    listarCompras: (params: any) => Promise<void>;
    crearCompra: (data: any) => Promise<boolean>;
    obtenerCompra: (id: number) => Promise<void>;
    registrarPagoCompra: (compraId: number, data: any) => Promise<any>;
    getHistorialPagos: (compraId: number) => Promise<any>;
    loading?: boolean;
}

export const useComprasStore = create<IComprasState>()(devtools((set) => ({
    compras: [],
    totalCompras: 0,
    compraDetalle: null,

    listarCompras: async (params: any) => {
        try {
            // useAlertStore.setState({ loading: true });
            const filteredParams = Object.entries(params)
                .filter(([_, value]) => value !== undefined)
                .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

            const query = new URLSearchParams(filteredParams).toString();
            const resp: any = await get(`compras?${query}`);

            if (resp.data && Array.isArray(resp.data.data)) {
                set({
                    compras: resp.data.data,
                    totalCompras: resp.data.total
                });
            } else if (Array.isArray(resp.data)) {
                set({
                    compras: resp.data,
                    totalCompras: resp.data.length
                });
            } else {
                set({ compras: [], totalCompras: 0 });
            }
            // useAlertStore.setState({ loading: false });
        } catch (error) {
            console.error(error);
            useAlertStore.setState({ loading: false });
        }
    },

    crearCompra: async (data: any) => {
        useAlertStore.setState({ loading: true });
        try {
            const resp: any = await post(`compras`, data);
            if (resp.code === 1 || (resp.data && resp.data.id)) {
                useAlertStore.setState({ success: true, loading: false });
                useAlertStore.getState().alert("Compra registrada correctamente", "success");
                return true;
            } else {
                useAlertStore.setState({ loading: false });
                useAlertStore.getState().alert("Error al registrar compra", "error");
                return false;
            }
        } catch (error: any) {
            useAlertStore.setState({ loading: false });
            useAlertStore.getState().alert(error.message || "Error al registrar compra", "error");
            return false;
        }
    },

    obtenerCompra: async (id: number) => {
        useAlertStore.setState({ loading: true });
        try {
            const resp: any = await get(`compras/${id}`);
            if (resp.data && resp.data.id) {
                set({ compraDetalle: resp.data });
            }
            useAlertStore.setState({ loading: false });
        } catch (error) {
            useAlertStore.setState({ loading: false });
            console.error(error);
        }
    },

    registrarPagoCompra: async (compraId: number, data: any) => {
        useAlertStore.setState({ loading: true });
        try {
            const resp: any = await post(`compras/${compraId}/pagos`, data);
            // resp.data contains the actual backend response { success, pago, nuevoSaldo, nuevoEstado }
            const result = resp.data || resp;
            useAlertStore.setState({ loading: false });
            if (result.success) {
                useAlertStore.getState().alert("Pago registrado correctamente", "success");
                return { success: true, pago: result.pago, nuevoSaldo: result.nuevoSaldo, nuevoEstado: result.nuevoEstado };
            } else {
                useAlertStore.getState().alert(resp.msg || "Error al registrar pago", "error");
                return { success: false };
            }
        } catch (error: any) {
            useAlertStore.setState({ loading: false });
            useAlertStore.getState().alert(error.message || "Error al registrar pago", "error");
            return { success: false };
        }
    },

    getHistorialPagos: async (compraId: number) => {
        // useAlertStore.setState({ loading: true }); // Optional, modal handles its own loading usually
        try {
            const resp: any = await get(`compras/${compraId}/pagos`);
            // useAlertStore.setState({ loading: false });
            // resp.data contains { success, data (pagos array), totalPagado }
            const result = resp.data || resp;
            if (result.success || Array.isArray(result.data)) {
                return { success: true, pagos: Array.isArray(result.data) ? result.data : [], totalPagado: result.totalPagado || 0 };
            }
            return { success: false, pagos: [] };
        } catch (error) {
            console.error(error);
            // useAlertStore.setState({ loading: false });
            return { success: false, pagos: [] };
        }
    }
})));
