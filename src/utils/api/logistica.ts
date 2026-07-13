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

// Mantenimientos de flota
export const getMantenimientos = (params?: {
  search?: string;
  estado?: string;
  tipo?: string;
  vehiculoId?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.estado) query.append('estado', params.estado);
  if (params?.tipo) query.append('tipo', params.tipo);
  if (params?.vehiculoId !== undefined)
    query.append('vehiculoId', params.vehiculoId.toString());
  return get(`${BASE}/mantenimientos?${query.toString()}`);
};
export const getMantenimiento = (id: number) => get(`${BASE}/mantenimientos/${id}`);
export const getResumenMantenimiento = () => get(`${BASE}/mantenimientos/resumen`);
export const createMantenimiento = (data: any) => post(`${BASE}/mantenimientos`, data);
export const updateMantenimiento = (id: number, data: any) => patch(`${BASE}/mantenimientos/${id}`, data);
export const deleteMantenimiento = (id: number) => del(`${BASE}/mantenimientos/${id}`);

// Combustible
export const getCombustibles = (params?: { search?: string; vehiculoId?: number }) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.vehiculoId !== undefined) query.append('vehiculoId', params.vehiculoId.toString());
  return get(`${BASE}/combustibles?${query.toString()}`);
};
export const getResumenCombustible = () => get(`${BASE}/combustibles/resumen`);
export const createCombustible = (data: any) => post(`${BASE}/combustibles`, data);
export const updateCombustible = (id: number, data: any) => patch(`${BASE}/combustibles/${id}`, data);
export const deleteCombustible = (id: number) => del(`${BASE}/combustibles/${id}`);

// Peajes / Multas
export const getPeajes = (params?: { search?: string; tipo?: string; estado?: string; vehiculoId?: number }) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.tipo) query.append('tipo', params.tipo);
  if (params?.estado) query.append('estado', params.estado);
  if (params?.vehiculoId !== undefined) query.append('vehiculoId', params.vehiculoId.toString());
  return get(`${BASE}/peajes?${query.toString()}`);
};
export const getResumenPeaje = () => get(`${BASE}/peajes/resumen`);
export const createPeaje = (data: any) => post(`${BASE}/peajes`, data);
export const updatePeaje = (id: number, data: any) => patch(`${BASE}/peajes/${id}`, data);
export const deletePeaje = (id: number) => del(`${BASE}/peajes/${id}`);

// Documentos y alertas de vencimiento
export const getDocumentos = (params?: {
  entidad?: string;
  vehiculoId?: number;
  conductorId?: number;
  tipo?: string;
  estado?: string;
  search?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.entidad) query.append('entidad', params.entidad);
  if (params?.vehiculoId !== undefined) query.append('vehiculoId', params.vehiculoId.toString());
  if (params?.conductorId !== undefined) query.append('conductorId', params.conductorId.toString());
  if (params?.tipo) query.append('tipo', params.tipo);
  if (params?.estado) query.append('estado', params.estado);
  if (params?.search) query.append('search', params.search);
  return get(`${BASE}/documentos?${query.toString()}`);
};
export const getDocumento = (id: number) => get(`${BASE}/documentos/${id}`);
export const getAlertasDocumentos = (dias?: number) => get(`${BASE}/documentos/alertas${dias ? `?dias=${dias}` : ''}`);
export const getResumenDocumentos = (dias?: number) => get(`${BASE}/documentos/resumen${dias ? `?dias=${dias}` : ''}`);
export const createDocumento = (data: any) => post(`${BASE}/documentos`, data);
export const updateDocumento = (id: number, data: any) => patch(`${BASE}/documentos/${id}`, data);
export const deleteDocumento = (id: number) => del(`${BASE}/documentos/${id}`);

// Dispositivos GPS
export const getDispositivos = (search?: string) => {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  return get(`${BASE}/dispositivos?${query.toString()}`);
};
export const getResumenDispositivos = () => get(`${BASE}/dispositivos/resumen`);
export const getPosicionesDispositivo = (id: number, limit?: number) => get(`${BASE}/dispositivos/${id}/posiciones${limit ? `?limit=${limit}` : ''}`);
export const createDispositivo = (data: any) => post(`${BASE}/dispositivos`, data);
export const updateDispositivo = (id: number, data: any) => patch(`${BASE}/dispositivos/${id}`, data);
export const deleteDispositivo = (id: number) => del(`${BASE}/dispositivos/${id}`);

// Geocercas
export const getGeocercas = (activo?: boolean) => {
  const query = new URLSearchParams();
  if (activo !== undefined) query.append('activo', activo.toString());
  return get(`${BASE}/geocercas?${query.toString()}`);
};
export const getEventosGeocercas = (params?: { geocercaId?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.geocercaId !== undefined) query.append('geocercaId', params.geocercaId.toString());
  if (params?.limit !== undefined) query.append('limit', params.limit.toString());
  return get(`${BASE}/geocercas/eventos?${query.toString()}`);
};
export const getResumenGeocercas = () => get(`${BASE}/geocercas/resumen`);
export const createGeocerca = (data: any) => post(`${BASE}/geocercas`, data);
export const updateGeocerca = (id: number, data: any) => patch(`${BASE}/geocercas/${id}`, data);
export const deleteGeocerca = (id: number) => del(`${BASE}/geocercas/${id}`);

// Importación masiva (Excel)
export const getPlantillaImport = (tipo: 'vehiculos' | 'conductores') => get(`${BASE}/importar/plantilla?tipo=${tipo}`);
export const importarVehiculosExcel = (archivoBase64: string) => post(`${BASE}/importar/vehiculos`, { archivoBase64 });
export const importarConductoresExcel = (archivoBase64: string) => post(`${BASE}/importar/conductores`, { archivoBase64 });

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
