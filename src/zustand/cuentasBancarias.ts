import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { get, post, put, del } from '../utils/fetch';
import useAlertStore from './alert';

export const BANCOS_PERU = ['BCP', 'INTERBANK', 'BBVA', 'SCOTIABANK', 'PICHINCHA', 'BANBIF', 'NACION', 'OTROS'] as const;
export type BancoPeru = typeof BANCOS_PERU[number];

export interface ICuentaBancaria {
  id: number;
  empresaId: number;
  banco: string;
  numeroCuenta: string;
  cci?: string | null;
  titular?: string | null;
  tipoCuenta: string;
  moneda: string;
  alias?: string | null;
  activo: boolean;
  creadoEn: string;
}

export interface ICreateCuentaBancaria {
  banco: string;
  numeroCuenta: string;
  cci?: string;
  titular?: string;
  tipoCuenta?: string;
  moneda?: string;
  alias?: string;
}

export interface IUpdateCuentaBancaria extends Partial<ICreateCuentaBancaria> {
  activo?: boolean;
}

interface CuentasBancariasState {
  cuentas: ICuentaBancaria[];
  loading: boolean;
  listar: () => Promise<void>;
  crear: (data: ICreateCuentaBancaria) => Promise<void>;
  actualizar: (id: number, data: IUpdateCuentaBancaria) => Promise<void>;
  eliminar: (id: number) => Promise<void>;
}

export const useCuentasBancariasStore = create<CuentasBancariasState>()(
  devtools(
    (set, _getState: () => CuentasBancariasState) => ({
      cuentas: [],
      loading: false,

      listar: async () => {
        try {
          set({ loading: true });
          const res: any = await get('empresa/cuentas-bancarias');
          if (res.code === 1) {
            set({ cuentas: res.data || [] });
          }
        } catch {
          // silencioso
        } finally {
          set({ loading: false });
        }
      },

      crear: async (data) => {
        try {
          set({ loading: true });
          const res: any = await post('empresa/cuentas-bancarias', data);
          if (res.code === 1) {
            set((state) => ({ cuentas: [...state.cuentas, res.data] }));
            useAlertStore.getState().alert('Cuenta bancaria creada', 'success');
          } else {
            useAlertStore.getState().alert(res.message || 'Error al crear cuenta', 'error');
          }
        } finally {
          set({ loading: false });
        }
      },

      actualizar: async (id, data) => {
        try {
          set({ loading: true });
          const res: any = await put(`empresa/cuentas-bancarias/${id}`, data);
          if (res.code === 1) {
            set((state) => ({
              cuentas: state.cuentas.map((c) => (c.id === id ? res.data : c)),
            }));
            useAlertStore.getState().alert('Cuenta bancaria actualizada', 'success');
          } else {
            useAlertStore.getState().alert(res.message || 'Error al actualizar', 'error');
          }
        } finally {
          set({ loading: false });
        }
      },

      eliminar: async (id) => {
        try {
          set({ loading: true });
          const res: any = await del(`empresa/cuentas-bancarias/${id}`);
          if (res.code === 1) {
            set((state) => ({
              cuentas: state.cuentas.map((c) => (c.id === id ? { ...c, activo: false } : c)),
            }));
            useAlertStore.getState().alert('Cuenta bancaria desactivada', 'success');
          } else {
            useAlertStore.getState().alert(res.message || 'Error al eliminar', 'error');
          }
        } finally {
          set({ loading: false });
        }
      },
    }),
    { name: 'cuentas-bancarias' }
  )
);
