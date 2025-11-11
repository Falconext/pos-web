import { create } from 'zustand';
import { get } from '../utils/fetch';
import { devtools } from 'zustand/middleware';

export interface IDashboardState {
    totalCLients: number;
    totalProducts: number;
    totalInvoices: number
    totalAmount: number;
    newClientsByDate: [],
    topSells: [],
    getTopSells: (fechaInicio: string, fechaFin: string) => void,
    amountByDate: [];
    totalPaymentToday: number;
    getTotalHeaderDashboard: (fechaInicio: string, fechaFin: string) => void;
    getTotalAttendancePatients: () => void;
    getTotalPaymentsMonth: () => void;
    getTotalPaymentToday: () => void;
    totalAttendancePatientsByToday: [];
    getTotalAmountByDate: () => void;
    getPatientPackagesByState: () => void;
    dataPatientPackagesByState: []
    getPaymentMethods: () => void;
    dataPaymentMethods: []
    getTotalAmountByDatePayment: () => void
    getNewClientsByDate: (fechaInicio: string, fechaFin: string) => void
}

export const useDashboardStore = create<IDashboardState>()(devtools((set, _get) => ({
    totalCLients: 0,
    amountByDate: [],
    totalInvoices: 0,
    topSells: [],
    totalAmount: 0,
    totalAttendancePatients: 0,
    totalPaymentsMonth: 0,
    getNewClientsByDate: async (fechaInicio: string, fechaFin: string) => {
        try {
            const resp: any = await get(`dashboard/nuevos-clientes-por-fecha?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
            console.log(resp);
            if (resp.code === 1) {
                set({
                    newClientsByDate: resp.data
                }, false, "GET_NEW_CLIENTS");
            } else {
                set({
                    newClientsByDate: []
                });
            }
        } catch (error) {
        }
    },
    getTopSells: async (fechaInicio: string, fechaFin: string) => {
        try {
            const resp: any = await get(`dashboard/top-productos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
            console.log(resp);
            if (resp.code === 1) {
                set({
                    topSells: resp.data
                }, false, "GET_TOP_SELLS");
            } else {
                set({
                    totalCLients: 0
                });
            }
        } catch (error) {
        }
    },
    getTotalHeaderDashboard: async (fechaInicio: string, fechaFin: string) => {
        try {
            const resp: any = await get(`dashboard/dashboard?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
            console.log(resp);
            if (resp.code === 1) {
                set({
                    totalCLients: resp.data.totalClientes,
                    totalProducts: resp.data.totalProductos,
                    totalInvoices: resp.data.totalComprobantes,
                    totalAmount: resp.data.totalIngresos
                }, false, "GET_TOTALS_HEADER_DASHBOARD");
            } else {
                set({
                    totalCLients: 0
                });
            }
        } catch (error) {
        }
    },
    getTotalAmountByDate: async () => {
        try {
            const resp: any = await get(`dashboard/ingresos-por-fecha-comprobante`);
            console.log(resp);
            if (resp.code === 1) {
                set({
                    amountByDate: resp.data
                }, false, "GET_AMOUNT_BY_TOTAL");
            } else {
                set({
                    amountByDate: []
                });
            }
        } catch (error) {
        }
    },
    getTotalAmountByDatePayment: async () => {
        try {
            const resp: any = await get(`dashboard/ingresos-por-fecha-medio-pago`);
            console.log(resp);
            if (resp.code === 1) {
                set({
                    dataPaymentMethods: resp.data
                }, false, "GET_AMOUNT_BY_PAYMENTS");
            } else {
                set({
                    dataPaymentMethods: []
                });
            }
        } catch (error) {
        }
    }
})));


