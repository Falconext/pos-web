import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { get, post, put, del } from '@/utils/fetch';
import useAlertStore from './alert';

export interface IListaPrecioItem {
  productoId: number;
  presentacionCodigo: string;
  precioUnitario: number;
  precioOferta?: number | null;
  descuentoPorcentaje?: number | null;
}

export interface IListaPrecio {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  esPorDefecto: boolean;
  /** Desempate: gana la de `orden` menor. */
  orden?: number;
  sedeIds: number[];
  usuarioIds: number[];
  clienteIds?: number[];
  // Nombres ya resueltos por el backend, para pintar las columnas sin cruzar
  // tres listados en el front.
  sedeNombres?: string[];
  usuarioNombres?: string[];
  clienteNombres?: string[];
  clientes?: { id: number; nombre: string }[];
  totalItems?: number;
  items?: IListaPrecioItem[];
}

export interface IListaPrecioForm {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  esPorDefecto?: boolean;
  orden?: number;
  sedeIds?: number[];
  usuarioIds?: number[];
  clienteIds?: number[];
  items?: IListaPrecioItem[];
}

// Lo mínimo que el POS necesita para pintar el selector de lista.
// Reprecio masivo
export type OperacionReprecio = 'AUMENTAR' | 'DISMINUIR' | 'REEMPLAZAR';
export type ModoReprecio = 'MONTO' | 'PORCENTAJE';

export interface IFilaReprecio {
  productoId: number;
  codigo: string;
  descripcion: string;
  costoNeto: number;
  costoConIgv: number;
  precioActual: number;
  precioNuevo: number | null;
  utilidadActual: number | null;
  utilidadNueva: number | null;
  sinCosto: boolean;
  seAplica: boolean;
}

export interface ILoteReprecio {
  id: number;
  listaPrecioId: number;
  listaNombre: string;
  operacion: string;
  modo: string;
  valor: number;
  totalItems: number;
  creadoEn: string;
  revertidoEn: string | null;
}

export interface IListaPrecioOpcion {
  id: number;
  nombre: string;
  descripcion?: string | null;
  esPorDefecto: boolean;
}

// Precios de un producto en una lista (panel de la ficha de producto).
export interface IListaConItemProducto {
  id: number;
  nombre: string;
  esPorDefecto: boolean;
  activo: boolean;
  descripcion?: string | null;
  items: { presentacionCodigo: string; precioUnitario: number; precioOferta: number | null; descuentoPorcentaje?: number | null }[];
}

interface IListasPrecioState {
  listas: IListaPrecio[];
  loading: boolean;
  listar: () => Promise<void>;
  obtener: (id: number) => Promise<IListaPrecio | null>;
  crear: (data: IListaPrecioForm) => Promise<void>;
  actualizar: (id: number, data: IListaPrecioForm) => Promise<void>;
  eliminar: (id: number) => Promise<void>;
  // Ficha de producto:
  itemsDeProducto: (productoId: number) => Promise<IListaConItemProducto[]>;
  // POS:
  aplicables: (clienteId?: number) => Promise<{ listas: IListaPrecioOpcion[]; listaResueltaId: number | null }>;
  reordenar: (ids: number[]) => Promise<void>;
  // Reprecio masivo:
  previsualizarReprecio: (filtro: any, operacion: any) => Promise<IFilaReprecio[]>;
  aplicarReprecio: (filtro: any, operacion: any) => Promise<{ aplicados: number; omitidos: number } | null>;
  lotesReprecio: () => Promise<ILoteReprecio[]>;
  revertirReprecio: (loteId: number) => Promise<boolean>;
  preciosDeLineas: (
    listaPrecioId: number | null,
    lineas: { productoId: number; presentacionCodigo?: string }[],
    sedeId?: number,
  ) => Promise<{ productoId: number; presentacionCodigo: string; precioUnitario: number | null }[]>;
  guardarItemsDeProducto: (
    productoId: number,
    entradas: { listaPrecioId: number; presentacionCodigo?: string; precioUnitario: number; precioOferta?: number | null; descuentoPorcentaje?: number | null }[],
  ) => Promise<boolean>;
}

export const useListasPrecioStore = create<IListasPrecioState>()(
  devtools((set, get_) => ({
    listas: [],
    loading: false,

    listar: async () => {
      try {
        set({ loading: true });
        const resp: any = await get('lista-precio');
        if (resp.code === 1) set({ listas: resp.data || [] });
      } catch (e: any) {
        useAlertStore.getState().alert(e.message || 'Error al listar listas de precio', 'error');
      } finally {
        set({ loading: false });
      }
    },

    obtener: async (id) => {
      try {
        const resp: any = await get(`lista-precio/${id}`);
        return resp.code === 1 ? resp.data : null;
      } catch {
        return null;
      }
    },

    crear: async (data) => {
      try {
        set({ loading: true });
        const resp: any = await post('lista-precio', data);
        if (resp.code === 1) {
          await get_().listar();
          useAlertStore.getState().alert('Lista de precio creada', 'success');
        } else {
          throw new Error(resp.message || resp.error || 'Error al crear');
        }
      } catch (e: any) {
        useAlertStore.getState().alert(e.message || 'Error al crear lista de precio', 'error');
        throw e;
      } finally {
        set({ loading: false });
      }
    },

    actualizar: async (id, data) => {
      try {
        set({ loading: true });
        const resp: any = await put(`lista-precio/${id}`, data);
        if (resp.code === 1) {
          await get_().listar();
          useAlertStore.getState().alert('Lista de precio actualizada', 'success');
        } else {
          throw new Error(resp.message || resp.error || 'Error al actualizar');
        }
      } catch (e: any) {
        useAlertStore.getState().alert(e.message || 'Error al actualizar lista de precio', 'error');
        throw e;
      } finally {
        set({ loading: false });
      }
    },

    eliminar: async (id) => {
      try {
        set({ loading: true });
        const resp: any = await del(`lista-precio/${id}`);
        if (resp.code === 1) {
          await get_().listar();
          useAlertStore.getState().alert('Lista de precio eliminada', 'success');
        }
      } catch (e: any) {
        useAlertStore.getState().alert(e.message || 'Error al eliminar lista de precio', 'error');
      } finally {
        set({ loading: false });
      }
    },

    // El POS las pide al abrir la venta. Silencioso a propósito: si falla, el
    // selector no se pinta y la venta sigue con la lista que resuelve el
    // backend — nunca se bloquea al cajero por esto.
    aplicables: async (clienteId?: number) => {
      try {
        const qs = clienteId ? `?clienteId=${clienteId}` : '';
        const resp: any = await get(`lista-precio/aplicables${qs}`);
        if (resp.code === 1) return resp.data;
      } catch { /* sin selector */ }
      return { listas: [], listaResueltaId: null };
    },

    reordenar: async (ids) => {
      try {
        const resp: any = await put('lista-precio/reordenar', { ids });
        if (resp.code === 1) {
          set({ listas: resp.data });
        }
      } catch (e: any) {
        useAlertStore.getState().alert(e.message || 'No se pudo reordenar', 'error');
        await get_().listar();
      }
    },

    previsualizarReprecio: async (filtro, operacion) => {
      try {
        const resp: any = await post('lista-precio/reprecio-masivo/previsualizar', { filtro, operacion });
        return resp.code === 1 ? (resp.data?.filas ?? []) : [];
      } catch (e: any) {
        useAlertStore.getState().alert(e.message || 'No se pudo previsualizar', 'error');
        return [];
      }
    },

    aplicarReprecio: async (filtro, operacion) => {
      try {
        const resp: any = await post('lista-precio/reprecio-masivo/aplicar', { filtro, operacion });
        if (resp.code === 1) {
          const d = resp.data;
          useAlertStore.getState().alert(
            `Se repreciaron ${d.aplicados} producto(s) en "${d.lista}".` +
            (d.omitidos ? ` ${d.omitidos} sin cambios.` : ''),
            'success',
          );
          return d;
        }
        throw new Error(resp.message || 'No se pudo aplicar');
      } catch (e: any) {
        useAlertStore.getState().alert(e.message || 'No se pudo aplicar el reprecio', 'error');
        return null;
      }
    },

    lotesReprecio: async () => {
      try {
        const resp: any = await get('lista-precio/reprecio-masivo/lotes?limit=10');
        return resp.code === 1 ? resp.data : [];
      } catch { return []; }
    },

    revertirReprecio: async (loteId) => {
      try {
        const resp: any = await post(`lista-precio/reprecio-masivo/revertir/${loteId}`, {});
        if (resp.code === 1) {
          useAlertStore.getState().alert('Reprecio deshecho: los precios volvieron a como estaban.', 'success');
          return true;
        }
        throw new Error(resp.message || 'No se pudo deshacer');
      } catch (e: any) {
        useAlertStore.getState().alert(e.message || 'No se pudo deshacer', 'error');
        return false;
      }
    },

    preciosDeLineas: async (listaPrecioId, lineas, sedeId) => {
      if (!lineas.length) return [];
      try {
        const resp: any = await post('lista-precio/precios-de-lineas', {
          listaPrecioId: listaPrecioId ?? undefined,
          sedeId,
          lineas,
        });
        return resp.code === 1 ? (resp.data?.precios ?? []) : [];
      } catch {
        return [];
      }
    },

    itemsDeProducto: async (productoId) => {
      try {
        const resp: any = await get(`lista-precio/producto/${productoId}`);
        return resp.code === 1 ? resp.data : [];
      } catch {
        return [];
      }
    },

    guardarItemsDeProducto: async (productoId, entradas) => {
      try {
        const resp: any = await put(`lista-precio/producto/${productoId}`, { entradas });
        if (resp.code === 1) {
          useAlertStore.getState().alert('Precios por lista guardados', 'success');
          return true;
        }
        throw new Error(resp.message || resp.error || 'Error al guardar');
      } catch (e: any) {
        useAlertStore.getState().alert(e.message || 'Error al guardar precios por lista', 'error');
        return false;
      }
    },
  })),
);
