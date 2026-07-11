import { get, post, patch, del } from '../fetch';

const BASE = '/logistica';

// Conductores
export const getConductores = (search?: string, estado?: string) => {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  if (estado) query.append('estado', estado);
  return get(`${BASE}/conductores?${query.toString()}`);
};
export const getConductor = (id: number) => get(`${BASE}/conductores/${id}`);
export const createConductor = (data: any) => post(`${BASE}/conductores`, data);
export const updateConductor = (id: number, data: any) => patch(`${BASE}/conductores/${id}`, data);
export const deleteConductor = (id: number) => del(`${BASE}/conductores/${id}`);

// Vehículos
export const getVehiculos = (search?: string, estado?: string) => {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  if (estado) query.append('estado', estado);
  return get(`${BASE}/vehiculos?${query.toString()}`);
};
export const getVehiculo = (id: number) => get(`${BASE}/vehiculos/${id}`);
export const createVehiculo = (data: any) => post(`${BASE}/vehiculos`, data);
export const updateVehiculo = (id: number, data: any) => patch(`${BASE}/vehiculos/${id}`, data);
export const deleteVehiculo = (id: number) => del(`${BASE}/vehiculos/${id}`);

// Tipos de vehículo (lazy-seed en backend)
export const getTiposVehiculo = () => get(`${BASE}/vehiculos/tipos`);
export const createTipoVehiculo = (data: {
  nombre: string;
  capacidadPesoKg: number;
  capacidadVolumenM3: number;
  costoPromedioKm?: number;
}) => post(`${BASE}/vehiculos/tipos`, data);

// Almacenes
export const getAlmacenes = (search?: string, activo?: boolean) => {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  if (activo !== undefined) query.append('activo', activo.toString());
  return get(`${BASE}/almacenes?${query.toString()}`);
};
export const getAlmacen = (id: number) => get(`${BASE}/almacenes/${id}`);
export const createAlmacen = (data: any) => post(`${BASE}/almacenes`, data);
export const updateAlmacen = (id: number, data: any) => patch(`${BASE}/almacenes/${id}`, data);
export const deleteAlmacen = (id: number) => del(`${BASE}/almacenes/${id}`);

// Zonas
export const getZonas = (activa?: boolean) => {
  const query = new URLSearchParams();
  if (activa !== undefined) query.append('activa', activa.toString());
  return get(`${BASE}/zonas?${query.toString()}`);
};
export const getZona = (id: number) => get(`${BASE}/zonas/${id}`);
export const createZona = (data: any) => post(`${BASE}/zonas`, data);
export const updateZona = (id: number, data: any) => patch(`${BASE}/zonas/${id}`, data);
export const deleteZona = (id: number) => del(`${BASE}/zonas/${id}`);

// Clientes
export const getClientes = (search?: string) => {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  return get(`${BASE}/clientes?${query.toString()}`);
};
export const getCliente = (id: number) => get(`${BASE}/clientes/${id}`);
export const createCliente = (data: any) => post(`${BASE}/clientes`, data);
export const updateCliente = (id: number, data: any) => patch(`${BASE}/clientes/${id}`, data);
export const deleteCliente = (id: number) => del(`${BASE}/clientes/${id}`);

// Pedidos
export const getPedidos = (search?: string, estado?: string) => {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  if (estado) query.append('estado', estado);
  return get(`${BASE}/pedidos?${query.toString()}`);
};
export const getPedido = (id: number) => get(`${BASE}/pedidos/${id}`);
export const createPedido = (data: any) => post(`${BASE}/pedidos`, data);
export const updateEstadoPedido = (id: number, data: { estado: string; motivo?: string; notas?: string; lat?: number; lng?: number }) => patch(`${BASE}/pedidos/${id}/estado`, data);
export const registrarEntrega = (id: number, data: {
  nombreReceptor?: string;
  dniReceptor?: string;
  parentesco?: string;
  firmaUrl?: string;
  fotosUrls?: string[];
  montoCobrado?: number;
  metodoPago?: string;
  lat?: number;
  lng?: number;
  notas?: string;
}) => post(`${BASE}/pedidos/${id}/entrega`, data);

// Despachos
export const getDespachos = (estado?: string) => {
  const query = new URLSearchParams();
  if (estado) query.append('estado', estado);
  return get(`${BASE}/despachos?${query.toString()}`);
};
export const getDespacho = (id: number) => get(`${BASE}/despachos/${id}`);
export const createDespacho = (data: any) => post(`${BASE}/despachos`, data);
export const updateEstadoDespacho = (id: number, data: { estado: string; motivo?: string }) => patch(`${BASE}/despachos/${id}/estado`, data);

// Tracking
export const registrarUbicacion = (data: any) => post(`${BASE}/tracking/ubicacion`, data);
export const getConductoresTracking = () => get(`${BASE}/tracking/conductores`);
export const getTrackingPublico = (codigoTracking: string) => get(`${BASE}/tracking/publico/${codigoTracking}`);

// ── Integraciones: API Keys ──────────────────────────────────────────────
import type { IApiKey, IApiKeyCreada, IWebhook, IWebhookCreado } from '@/features/admin/logistica/integraciones/IntegracionesModel';

export const getApiKeys = () => get<IApiKey[]>(`${BASE}/api-keys`);
export const createApiKey = (data: { nombre?: string; entorno?: 'live' | 'test' }) =>
  post<IApiKeyCreada>(`${BASE}/api-keys`, data);
export const deleteApiKey = (id: string) => del(`${BASE}/api-keys/${id}`);

// ── Integraciones: Webhooks ──────────────────────────────────────────────
export const getWebhooks = () => get<IWebhook[]>(`${BASE}/webhooks`);
export const createWebhook = (data: { url: string; events: string[] }) =>
  post<IWebhookCreado>(`${BASE}/webhooks`, data);
export const deleteWebhook = (id: string) => del(`${BASE}/webhooks/${id}`);
