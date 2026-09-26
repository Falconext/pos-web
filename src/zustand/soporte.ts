import { create } from 'zustand';
import { get as apiGet, post as apiPost } from '../utils/fetch';

export interface SoporteMensaje {
    id: number;
    conversacionId: number;
    rol: 'EMPRESA' | 'SISTEMA';
    autorNombre: string | null;
    contenido: string;
    creadoEn: string;
}

interface SoporteState {
    mensajes: SoporteMensaje[];
    estado: 'ABIERTA' | 'CERRADA';
    loading: boolean;
    enviando: boolean;
    error: string | null;

    cargarMensajes: () => Promise<void>;
    enviarMensaje: (contenido: string) => Promise<void>;
    /** Contador de no leídos sin marcar nada como visto (para el badge del widget cerrado). */
    consultarNoLeidos: () => Promise<number>;
    /** Llamado por el store de notificaciones cuando llega 'nuevo-mensaje-soporte'. */
    recibirMensajeEnVivo: (payload: { rol: 'EMPRESA' | 'SISTEMA'; autorNombre: string; contenido: string }) => void;
}

export const useSoporteStore = create<SoporteState>((set, get) => ({
    mensajes: [],
    estado: 'ABIERTA',
    loading: false,
    enviando: false,
    error: null,

    cargarMensajes: async () => {
        set({ loading: true, error: null });
        const res = await apiGet<{ estado: 'ABIERTA' | 'CERRADA'; mensajes: SoporteMensaje[] }>('/soporte/mensajes');
        if (res.success && res.data) {
            set({ mensajes: res.data.mensajes, estado: res.data.estado, loading: false });
        } else {
            set({ loading: false, error: res.error || 'No se pudo cargar el chat de soporte' });
        }
    },

    enviarMensaje: async (contenido: string) => {
        const texto = contenido.trim();
        if (!texto) return;
        set({ enviando: true });
        const res = await apiPost('/soporte/mensajes', { contenido: texto });
        set({ enviando: false });
        if (res.success) {
            await get().cargarMensajes();
        } else {
            set({ error: res.error || 'No se pudo enviar el mensaje' });
        }
    },

    consultarNoLeidos: async () => {
        const res = await apiGet<{ noLeidos: number }>('/soporte/estado');
        return res.success && res.data ? res.data.noLeidos : 0;
    },

    recibirMensajeEnVivo: (payload) => {
        // Solo interesa el lado empresa cuando responde SISTEMA (lo propio ya se agregó al enviar).
        if (payload.rol !== 'SISTEMA') return;
        set((state) => ({
            mensajes: [
                ...state.mensajes,
                {
                    id: Date.now(),
                    conversacionId: 0,
                    rol: 'SISTEMA',
                    autorNombre: payload.autorNombre,
                    contenido: payload.contenido,
                    creadoEn: new Date().toISOString(),
                },
            ],
        }));
    },
}));
