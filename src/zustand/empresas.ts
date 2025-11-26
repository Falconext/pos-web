import { create } from 'zustand';
import apiClient from '../utils/apiClient';

interface Empresa {
  id: number;
  ruc: string;
  razonSocial: string;
  direccion: string;
  logo?: string;
  fechaActivacion: string;
  fechaExpiracion: string;
  estado: 'ACTIVO' | 'INACTIVO';
  departamento?: string;
  provincia?: string;
  distrito?: string;
  ubigeo?: string;
  nombreComercial?: string;
  plan: {
    id: number;
    nombre: string;
    tieneTienda: boolean
    descripcion?: string;
    limiteUsuarios?: number;
    costo?: number;
  };
  rubro?: {
    id: number;
    nombre: string;
  };
}

interface Plan {
  id: number;
  nombre: string;
  descripcion?: string;
  limiteUsuarios?: number;
  costo?: number;
}

interface Rubro {
  id: number;
  nombre: string;
}

interface Ubigeo {
  codigo: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

interface CreateEmpresaDto {
  ruc: string;
  razonSocial: string;
  direccion: string;
  logo?: File;
  planId?: number;
  esPrueba: boolean;
  tipoEmpresa: 'FORMAL' | 'INFORMAL';
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  rubroId: number;
  nombreComercial: string;
  fechaActivacion: string;
  fechaExpiracion?: string;
  providerToken?: string;
  providerId?: string;
  usuario: {
    nombre: string;
    email: string;
    password: string;
    dni: string;
    celular: string;
  };
}

interface UpdateEmpresaDto {
  id: number;
  ruc: string;
  razonSocial: string;
  direccion: string;
  logo?: File | string | any;
  planId: number;
  tipoEmpresa: 'FORMAL' | 'INFORMAL';
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  rubroId: number;
  nombreComercial: string;
  fechaActivacion: string;
  fechaExpiracion: string;
  providerToken?: string;
  providerId?: string;
}

interface ListEmpresaDto {
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'id' | 'ruc' | 'razonSocial' | 'fechaActivacion' | 'fechaExpiracion';
  order?: 'asc' | 'desc';
}

interface EmpresasListResponse {
  empresas: Empresa[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Suscripcion {
  planActual: Plan;
  fechaExpiracion: string;
  diasRestantes: number;
  estado: 'ACTIVA' | 'VENCIDA' | 'PROXIMA_VENCER';
}

interface EmpresasState {
  // Estado
  empresas: Empresa[];
  empresa: Empresa | null;
  miEmpresa: Empresa | null;
  planes: Plan[];
  rubros: Rubro[];
  ubigeos: Ubigeo[];
  suscripcion: Suscripcion | null;
  loading: boolean;
  error: string | null;
  
  // Paginación
  currentPage: number;
  totalPages: number;
  totalEmpresas: number;
  
  // Acciones - Empresas
  listarEmpresas: (params?: ListEmpresaDto) => Promise<void>;
  crearEmpresa: (data: CreateEmpresaDto) => Promise<Empresa>;
  obtenerEmpresa: (id: number) => Promise<void>;
  actualizarEmpresa: (data: UpdateEmpresaDto) => Promise<void>;
  cambiarEstadoEmpresa: (id: number, estado: 'ACTIVO' | 'INACTIVO') => Promise<void>;
  obtenerMiEmpresa: () => Promise<void>;

  
  // Acciones - Suscripciones
  obtenerSuscripcion: () => Promise<void>;
  
  // Acciones auxiliares
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useEmpresasStore = create<EmpresasState>((set, get) => ({
  // Estado inicial
  empresas: [],
  empresa: null,
  miEmpresa: null,
  planes: [],
  rubros: [],
  ubigeos: [],
  suscripcion: null,
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalEmpresas: 0,

  // Acciones - Empresas
  listarEmpresas: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<EmpresasListResponse>('/empresa/listar', { 
        params: {
          page: 1,
          limit: 10,
          ...params
        }
      });
      const { data} : any = response;
      set({
        empresas: data.data.empresas,
        currentPage: data.data.page,
        totalPages: data.data.totalPages,
        totalEmpresas: data.data.total,
        loading: false
      });
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Error al cargar empresas', 
        loading: false 
      });
    }
  },

  crearEmpresa: async (data: CreateEmpresaDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Empresa>('/empresa/crear', data);
      
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Error al crear empresa', 
        loading: false 
      });
      throw error;
    }
  },

  obtenerEmpresa: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response : any = await apiClient.get<Empresa>(`/empresa/${id}`);
      console.log(response)
      set({ empresa: response?.data?.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Error al obtener empresa', 
        loading: false 
      });
    }
  },

  actualizarEmpresa: async (data: UpdateEmpresaDto) => {
    set({ loading: true, error: null });
    try {
      // Preparar datos para envío como JSON
      const updateData: any = { ...data };
      
      // Si hay logo como File, convertir a base64
      if (data.logo instanceof File) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(data.logo!);
        });
        updateData.logo = await base64Promise;
      }

      const response = await apiClient.put<Empresa>(`/empresa/${data.id}`, updateData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Actualizar la empresa en la lista si existe
      const { empresas } = get();
      const updatedEmpresas = empresas.map(emp => 
        emp.id === data.id ? response.data : emp
      );
      
      set({ 
        empresas: updatedEmpresas,
        empresa: response.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Error al actualizar empresa', 
        loading: false 
      });
      throw error;
    }
  },

  cambiarEstadoEmpresa: async (id: number, estado: 'ACTIVO' | 'INACTIVO') => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch(`/empresa/${id}/estado`, { estado });
      
      // Actualizar la empresa en la lista
      const { empresas } = get();
      const updatedEmpresas = empresas.map(emp => 
        emp.id === id ? { ...emp, estado } : emp
      );
      
      set({ 
        empresas: updatedEmpresas,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Error al cambiar estado', 
        loading: false 
      });
      throw error;
    }
  },

  obtenerMiEmpresa: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Empresa>('/empresa/mia');
      set({ miEmpresa: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Error al obtener mi empresa', 
        loading: false 
      });
    }
  },

  // Acciones - Suscripciones
  obtenerSuscripcion: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Suscripcion>('/suscripcion');
      set({ suscripcion: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Error al obtener suscripción', 
        loading: false 
      });
    }
  },

  // Búsqueda de RUC
  buscarPorRuc: async (ruc: string) => {
    try {
      const response = await apiClient.get(`/empresa/consultar-ruc/${ruc}`);
      return response.data?.data || response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Acciones auxiliares
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
  reset: () => set({
    empresas: [],
    empresa: null,
    miEmpresa: null,
    planes: [],
    rubros: [],
    ubigeos: [],
    suscripcion: null,
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 0,
    totalEmpresas: 0
  })
}));

export default useEmpresasStore;