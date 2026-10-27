import { create } from 'zustand';
import { get as apiGet, post as apiPost } from '../utils/fetch';

export interface SoporteMensaje {
    id: number;
    conversacionId: number;
    rol: 'EMPRESA' | 'SISTEMA';
    autorNombre: string | null;
    contenido: string;
    /** Foto o nota de voz del mensaje (S3). */
    imagenUrl?: string | null;
    audioUrl?: string | null;
    creadoEn: string;
}

/** Sube una foto (con pie opcional) o una nota de voz al endpoint dado. */
export async function subirAdjuntoSoporte(endpoint: string, archivo: File, texto?: string) {
    const datos = new FormData();
    datos.append('archivo', archivo);
    if (texto?.trim()) datos.append('texto', texto.trim());
    return apiPost(endpoint, datos);
}

interface SoporteState {
    mensajes: SoporteMensaje[];
    estado: 'ABIERTA' | 'CERRADA';
    loading: boolean;
    enviando: boolean;
    error: string | null;

    cargarMensajes: () => Promise<void>;
    enviarMensaje: (contenido: string) => Promise<void>;
    /** Foto (con `texto` como pie) o nota de voz. */
    enviarAdjunto: (tipo: 'imagen' | 'audio', archivo: File, texto?: string) => Promise<boolean>;
    /** Contador de no leídos sin marcar nada como visto (para el badge del widget cerrado). */
    consultarNoLeidos: () => Promise<number>;
    /** Llamado por el store de notificaciones cuando llega 'nuevo-mensaje-soporte'. */
    recibirMensajeEnVivo: (payload: {
        rol: 'EMPRESA' | 'SISTEMA';
        mensajeId?: number;
        autorNombre: string;
        contenido: string;
        imagenUrl?: string;
        audioUrl?: string;
    }) => void;
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

    enviarAdjunto: async (tipo, archivo, texto) => {
        set({ enviando: true, error: null });
        const res = await subirAdjuntoSoporte(`/soporte/mensajes/${tipo}`, archivo, texto);
        set({ enviando: false });
        if (!res.success) {
            set({ error: res.error || (tipo === 'imagen' ? 'No se pudo enviar la imagen' : 'No se pudo enviar la nota de voz') });
            return false;
        }
        await get().cargarMensajes();
        return true;
    },

    consultarNoLeidos: async () => {
        const res = await apiGet<{ noLeidos: number }>('/soporte/estado');
        return res.success && res.data ? res.data.noLeidos : 0;
    },

    recibirMensajeEnVivo: (payload) => {
        // Solo interesa el lado empresa cuando responde SISTEMA (lo propio ya se agregó al enviar).
        if (payload.rol !== 'SISTEMA') return;
        set((state) => {
            // El aviso trae el id real del mensaje. Si ya está en el hilo, el
            // evento llegó repetido —reconexión del socket, dos pestañas— y
            // agregarlo otra vez le mostraría al empresario el mismo mensaje
            // dos veces. Antes el id se fabricaba con Date.now() y no había
            // forma de reconocerlo.
            const id = payload.mensajeId;
            if (id != null && state.mensajes.some((m) => m.id === id)) return state;
            return {
                mensajes: [
                    ...state.mensajes,
                    {
                        id: id ?? Date.now(),
                        conversacionId: 0,
                        rol: 'SISTEMA' as const,
                        autorNombre: payload.autorNombre,
                        contenido: payload.contenido,
                        imagenUrl: payload.imagenUrl ?? null,
                        audioUrl: payload.audioUrl ?? null,
                        creadoEn: new Date().toISOString(),
                    },
                ],
            };
        });
    },
}));
