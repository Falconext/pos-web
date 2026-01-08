import { create } from 'zustand';
import { get } from '../utils/fetch';
import { devtools } from 'zustand/middleware';

export interface KPI {
    porPagar: number;
    porCobrar: number;
    ingresosPeriodo: number;
    egresosPeriodo: number;
    balancePeriodo: number;
}

export interface ChartData {
    fecha: string;
    ingresos: number;
    egresos: number;
}

export interface IFinanzasState {
    kpis: KPI | null;
    chartData: ChartData[];
    getResumenFinanciero: (fechaInicio: string, fechaFin: string) => void;
    isLoading: boolean;
}

export const useFinanzasStore = create<IFinanzasState>()(devtools((set) => ({
    kpis: null,
    chartData: [],
    isLoading: false,
    getResumenFinanciero: async (fechaInicio: string, fechaFin: string) => {
        try {
            set({ isLoading: true });
            const resp: any = await get(`finanzas/resumen?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
            console.log("Respuesta Resumen Financiero:", resp);
            if (resp.code === 1 || resp.success) { // Handle potential different response structure
                // Assuming resp.data contains { kpis: ..., chartData: ... }
                // Based on backend service return
                const data = resp.data || resp; // Fallback if data wrapper is different
                set({
                    kpis: data.kpis,
                    chartData: data.chartData
                });
            } else {
                set({
                    kpis: null,
                    chartData: []
                });
            }
        } catch (error) {
            console.error(error);
            set({
                kpis: null,
                chartData: []
            });
        } finally {
            set({ isLoading: false });
        }
    }
})));
