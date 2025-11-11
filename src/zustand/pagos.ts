import { create } from 'zustand';
import { get, post, patch } from '../utils/fetch';
import { IPago, IPagosFilters, IRegistroPago } from '../interfaces/pagos';
import { devtools } from 'zustand/middleware';
import useAlertStore from './alert';

export interface IPagosState {
  pagos: IPago[];
  totalPagos: number;
  pagoDetalle: IPago | null;
  loading: boolean;
  getAllPagos: (params: IPagosFilters) => Promise<{ success: boolean; error?: string }>;
  getPagoDetalleByComprobante: (comprobanteId: number) => Promise<{ success: boolean; error?: string }>;
  registrarPago: (data: IRegistroPago) => Promise<{ success: boolean; error?: string }>;
  eliminarPago: (pagoId: number) => Promise<{ success: boolean; error?: string }>;
  resetPagos: () => void;
}

export const usePagosStore = create<IPagosState>()(
  devtools(
    (set, _get) => ({
      pagos: [],
      totalPagos: 0,
      pagoDetalle: null,
      loading: false,

      getAllPagos: async (params: IPagosFilters) => {
        try {
          set({ loading: true });
          const filteredParams = Object.entries(params)
            .filter(([_, value]) => value !== undefined && value !== '')
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

          const query = new URLSearchParams(filteredParams as any).toString();
          const resp: any = await get(`pago/listar?${query}`);
          console.log(resp)
          if (resp.code === 1) {
            set({
              pagos: resp.data,
              // totalPagos: resp.data.total,
              loading: false
            });
            return { success: true };
          } else {
            set({ pagos: [], loading: false });
            useAlertStore.getState().alert(resp.error || 'Error al obtener los pagos', 'error');
            return { success: false, error: resp.error };
          }
        } catch (error: any) {
          set({ loading: false });
          useAlertStore.getState().alert(error.message || 'Error al obtener los pagos', 'error');
          return { success: false, error: error.message };
        }
      },

      getPagoDetalleByComprobante: async (comprobanteId: number) => {
        try {
          set({ loading: true });
          const resp: any = await get(`pago/comprobante/${comprobanteId}`);

          if (resp.code === 1) {
            set({
              pagoDetalle: resp.data,
              loading: false
            });
            return { success: true };
          } else {
            set({ loading: false });
            useAlertStore.getState().alert(resp.error || 'Error al obtener el pago', 'error');
            return { success: false, error: resp.error };
          }
        } catch (error: any) {
          set({ loading: false });
          useAlertStore.getState().alert(error.message || 'Error al obtener el pago', 'error');
          return { success: false, error: error.message };
        }
      },

      registrarPago: async (data: IRegistroPago) => {
        try {
          set({ loading: true });
          const resp: any = await post('/pago/registrar', data);

          if (resp.code === 1) {
            set((state) => ({
              pagos: [resp.data, ...state.pagos],
              totalPagos: state.totalPagos + 1,
              loading: false
            }));
            useAlertStore.getState().alert('Pago registrado exitosamente', 'success');
            return { success: true };
          } else {
            set({ loading: false });
            useAlertStore.getState().alert(resp.error || 'Error al registrar el pago', 'error');
            return { success: false, error: resp.error };
          }
        } catch (error: any) {
          set({ loading: false });
          useAlertStore.getState().alert(error.message || 'Error al registrar el pago', 'error');
          return { success: false, error: error.message };
        }
      },

      eliminarPago: async (pagoId: number) => {
        try {
          set({ loading: true });
          const resp: any = await patch(`/pago/${pagoId}/eliminar`, {});

          if (resp.code === 1) {
            set((state) => ({
              pagos: state.pagos.filter((pago) => pago.id !== pagoId),
              totalPagos: state.totalPagos - 1,
              loading: false
            }));
            useAlertStore.getState().alert('Pago eliminado exitosamente', 'success');
            return { success: true };
          } else {
            set({ loading: false });
            useAlertStore.getState().alert(resp.error || 'Error al eliminar el pago', 'error');
            return { success: false, error: resp.error };
          }
        } catch (error: any) {
          set({ loading: false });
          useAlertStore.getState().alert(error.message || 'Error al eliminar el pago', 'error');
          return { success: false, error: error.message };
        }
      },

      resetPagos: () => {
        set({
          pagos: [],
          totalPagos: 0,
          pagoDetalle: null,
          loading: false
        });
      }
    })
  )
);
