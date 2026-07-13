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

  // Mantenimientos
  mantenimientos: any[];
  isLoadingMantenimientos: boolean;
  resumenMantenimiento: any | null;
  fetchMantenimientos: (params?: {
    search?: string;
    estado?: string;
    tipo?: string;
    vehiculoId?: number;
  }) => Promise<void>;
  fetchResumenMantenimiento: () => Promise<void>;

  // Combustible
  combustibles: any[];
  isLoadingCombustibles: boolean;
  resumenCombustible: any | null;
  fetchCombustibles: (params?: { search?: string; vehiculoId?: number }) => Promise<void>;
  fetchResumenCombustible: () => Promise<void>;

  // Peajes
  peajes: any[];
  isLoadingPeajes: boolean;
  resumenPeaje: any | null;
  fetchPeajes: (params?: { search?: string; tipo?: string; estado?: string; vehiculoId?: number }) => Promise<void>;
  fetchResumenPeaje: () => Promise<void>;

  // Documentos
  documentos: any[];
  isLoadingDocumentos: boolean;
  resumenDocumentos: any | null;
  fetchDocumentos: (params?: {
    entidad?: string;
    tipo?: string;
    estado?: string;
    search?: string;
  }) => Promise<void>;
  fetchResumenDocumentos: () => Promise<void>;

  // Dispositivos GPS
  dispositivos: any[];
  isLoadingDispositivos: boolean;
  resumenDispositivos: any | null;
  fetchDispositivos: (search?: string) => Promise<void>;
  fetchResumenDispositivos: () => Promise<void>;

  // Geocercas
  geocercas: any[];
  isLoadingGeocercas: boolean;
  resumenGeocercas: any | null;
  eventosGeocercas: any[];
  fetchGeocercas: () => Promise<void>;
  fetchResumenGeocercas: () => Promise<void>;
  fetchEventosGeocercas: (limit?: number) => Promise<void>;
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

  mantenimientos: [],
  isLoadingMantenimientos: false,
  resumenMantenimiento: null,
  fetchMantenimientos: async (params) => {
    set({ isLoadingMantenimientos: true });
    try {
      const res = await api.getMantenimientos(params);
      if (res.success) set({ mantenimientos: res.data as any[] });
    } finally {
      set({ isLoadingMantenimientos: false });
    }
  },
  fetchResumenMantenimiento: async () => {
    const res = await api.getResumenMantenimiento();
    if (res.success) set({ resumenMantenimiento: res.data });
  },

  combustibles: [],
  isLoadingCombustibles: false,
  resumenCombustible: null,
  fetchCombustibles: async (params) => {
    set({ isLoadingCombustibles: true });
    try {
      const res = await api.getCombustibles(params);
      if (res.success) set({ combustibles: res.data as any[] });
    } finally {
      set({ isLoadingCombustibles: false });
    }
  },
  fetchResumenCombustible: async () => {
    const res = await api.getResumenCombustible();
    if (res.success) set({ resumenCombustible: res.data });
  },

  peajes: [],
  isLoadingPeajes: false,
  resumenPeaje: null,
  fetchPeajes: async (params) => {
    set({ isLoadingPeajes: true });
    try {
      const res = await api.getPeajes(params);
      if (res.success) set({ peajes: res.data as any[] });
    } finally {
      set({ isLoadingPeajes: false });
    }
  },
  fetchResumenPeaje: async () => {
    const res = await api.getResumenPeaje();
    if (res.success) set({ resumenPeaje: res.data });
  },

  documentos: [],
  isLoadingDocumentos: false,
  resumenDocumentos: null,
  fetchDocumentos: async (params) => {
    set({ isLoadingDocumentos: true });
    try {
      const res = await api.getDocumentos(params);
      if (res.success) set({ documentos: res.data as any[] });
    } finally {
      set({ isLoadingDocumentos: false });
    }
  },
  fetchResumenDocumentos: async () => {
    const res = await api.getResumenDocumentos();
    if (res.success) set({ resumenDocumentos: res.data });
  },

  dispositivos: [],
  isLoadingDispositivos: false,
  resumenDispositivos: null,
  fetchDispositivos: async (search) => {
    set({ isLoadingDispositivos: true });
    try {
      const res = await api.getDispositivos(search);
      if (res.success) set({ dispositivos: res.data as any[] });
    } finally {
      set({ isLoadingDispositivos: false });
    }
  },
  fetchResumenDispositivos: async () => {
    const res = await api.getResumenDispositivos();
    if (res.success) set({ resumenDispositivos: res.data });
  },

  geocercas: [],
  isLoadingGeocercas: false,
  resumenGeocercas: null,
  eventosGeocercas: [],
  fetchGeocercas: async () => {
    set({ isLoadingGeocercas: true });
    try {
      const res = await api.getGeocercas();
      if (res.success) set({ geocercas: res.data as any[] });
    } finally {
      set({ isLoadingGeocercas: false });
    }
  },
  fetchResumenGeocercas: async () => {
    const res = await api.getResumenGeocercas();
    if (res.success) set({ resumenGeocercas: res.data });
  },
  fetchEventosGeocercas: async (limit) => {
    const res = await api.getEventosGeocercas({ limit: limit ?? 20 });
    if (res.success) set({ eventosGeocercas: res.data as any[] });
  },
}));
