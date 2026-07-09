import { create } from 'zustand';
import * as api from '../utils/api/logistica';

interface LogisticaState {
  // Conductores
  conductores: any[];
  isLoadingConductores: boolean;
  fetchConductores: (search?: string, estado?: string) => Promise<void>;

  // Vehículos
  vehiculos: any[];
  isLoadingVehiculos: boolean;
  fetchVehiculos: (search?: string, estado?: string) => Promise<void>;

  // Almacenes
  almacenes: any[];
  isLoadingAlmacenes: boolean;
  fetchAlmacenes: (search?: string, activo?: boolean) => Promise<void>;

  // Zonas
  zonas: any[];
  isLoadingZonas: boolean;
  fetchZonas: (activa?: boolean) => Promise<void>;

  // Clientes
  clientes: any[];
  isLoadingClientes: boolean;
  fetchClientes: (search?: string) => Promise<void>;

  // Pedidos
  pedidos: any[];
  isLoadingPedidos: boolean;
  fetchPedidos: (search?: string, estado?: string) => Promise<void>;

  // Despachos
  despachos: any[];
  isLoadingDespachos: boolean;
  fetchDespachos: (estado?: string) => Promise<void>;
}

export const useLogisticaStore = create<LogisticaState>((set) => ({
  conductores: [],
  isLoadingConductores: false,
  fetchConductores: async (search, estado) => {
    set({ isLoadingConductores: true });
    try {
      const res = await api.getConductores(search, estado);
      if (res.success) set({ conductores: res.data as any[] });
    } finally {
      set({ isLoadingConductores: false });
    }
  },

  vehiculos: [],
  isLoadingVehiculos: false,
  fetchVehiculos: async (search, estado) => {
    set({ isLoadingVehiculos: true });
    try {
      const res = await api.getVehiculos(search, estado);
      if (res.success) set({ vehiculos: res.data as any[] });
    } finally {
      set({ isLoadingVehiculos: false });
    }
  },

  almacenes: [],
  isLoadingAlmacenes: false,
  fetchAlmacenes: async (search, activo) => {
    set({ isLoadingAlmacenes: true });
    try {
      const res = await api.getAlmacenes(search, activo);
      if (res.success) set({ almacenes: res.data as any[] });
    } finally {
      set({ isLoadingAlmacenes: false });
    }
  },

  zonas: [],
  isLoadingZonas: false,
  fetchZonas: async (activa) => {
    set({ isLoadingZonas: true });
    try {
      const res = await api.getZonas(activa);
      if (res.success) set({ zonas: res.data as any[] });
    } finally {
      set({ isLoadingZonas: false });
    }
  },

  clientes: [],
  isLoadingClientes: false,
  fetchClientes: async (search) => {
    set({ isLoadingClientes: true });
    try {
      const res = await api.getClientes(search);
      if (res.success) set({ clientes: res.data as any[] });
    } finally {
      set({ isLoadingClientes: false });
    }
  },

  pedidos: [],
  isLoadingPedidos: false,
  fetchPedidos: async (search, estado) => {
    set({ isLoadingPedidos: true });
    try {
      const res = await api.getPedidos(search, estado);
      if (res.success) set({ pedidos: res.data as any[] });
    } finally {
      set({ isLoadingPedidos: false });
    }
  },

  despachos: [],
  isLoadingDespachos: false,
  fetchDespachos: async (estado) => {
    set({ isLoadingDespachos: true });
    try {
      const res = await api.getDespachos(estado);
      if (res.success) set({ despachos: res.data as any[] });
    } finally {
      set({ isLoadingDespachos: false });
    }
  },
}));
