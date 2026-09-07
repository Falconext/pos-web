import api from '../utils/apiClient';

// El backend envuelve todo en { code, message, data } (ResponseInterceptor).
const unwrap = (response: any) => response?.data?.data ?? response?.data;

/**
 * Mensaje legible de un error de la API. Los errores de Shalom son informativos
 * ("configura la agencia de origen", "ya tiene la guía X"), así que hay que
 * sacarlos del envelope { code: 0, message } en vez de mostrar el de axios.
 */
export const mensajeErrorShalom = (error: unknown, porDefecto: string): string => {
    const data = (error as any)?.response?.data;
    return data?.message || data?.error?.message || porDefecto;
};

/** Estado de la cuenta Shalom Pro conectada por la empresa. */
export interface ShalomInstancia {
    /** El plan de la empresa habilita crear guías (solo Corporativo). */
    habilitadoPorPlan: boolean;
    conectada: boolean;
    instanceId?: string | null;
    nombre?: string | null;
    estado?: 'CONECTADA' | 'ERROR' | null;
    error?: string | null;
    sincronizadoEn?: string | null;
    email?: string | null;
    credencialesGuardadas: boolean;
    securityCodeGuardado: boolean;
    agenciaOrigenId?: string | null;
    agenciaOrigenNombre?: string | null;
}

export interface ConectarInstanciaPayload {
    nombre?: string;
    username?: string;
    password?: string;
    securityCode?: string;
    agenciaOrigenId?: string;
    agenciaOrigenNombre?: string;
}

export interface CrearGuiaPayload {
    origenId?: string;
    origenNombre?: string;
    destinoId?: string;
    destinoNombre?: string;
    dni?: string;
    nombre?: string;
    telefono?: string;
    direccion?: string;
    forzar?: boolean;
}

export interface GuiaCreada {
    id: number;
    nroOrden: string | null;
    claveOrden: string | null;
    claveEnvio: string | null;
    shalomGuiaCreadaEn: string | null;
}

export const shalomService = {
    getInstancia: async (): Promise<ShalomInstancia> =>
        unwrap(await api.get('/shalom/instancia')),

    conectar: async (payload: ConectarInstanciaPayload): Promise<ShalomInstancia> =>
        unwrap(await api.post('/shalom/instancia', payload)),

    actualizarConfig: async (payload: ConectarInstanciaPayload): Promise<ShalomInstancia> =>
        unwrap(await api.patch('/shalom/instancia', payload)),

    reconectar: async (): Promise<ShalomInstancia> =>
        unwrap(await api.post('/shalom/instancia/reconectar', {})),

    desconectar: async (): Promise<ShalomInstancia> =>
        unwrap(await api.delete('/shalom/instancia')),

    pendientes: async (): Promise<any> => unwrap(await api.get('/shalom/pendientes')),

    /** Genera la guía en Shalom Pro desde el despacho de un comprobante. */
    crearGuia: async (comprobanteId: number, payload: CrearGuiaPayload = {}): Promise<GuiaCreada> =>
        unwrap(await api.post(`/shalom/guia/${comprobanteId}`, payload)),
};
