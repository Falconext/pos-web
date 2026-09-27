import { create } from 'zustand';
import { get as apiGet, post as apiPost, patch as apiPatch } from '../utils/fetch';
import type { SoporteMensaje } from './soporte';

export interface SoporteConversacionResumen {
    id: number;
    empresaId: number;
    empresaNombre: string;
    brand: string;
    estado: 'ABIERTA' | 'CERRADA';
    asignadoANombre: string | null;
    noLeidosSistema: number;
    ultimoMensaje: string | null;
    actualizadoEn: string;
}

interface SoporteSistemaState {
    conversaciones: SoporteConversacionResumen[];
    conversacionActivaId: number | null;
    mensajes: SoporteMensaje[];
    empresaNombreActiva: string | null;
    estadoActiva: 'ABIERTA' | 'CERRADA' | null;
    loadingLista: boolean;
    loadingChat: boolean;
    enviando: boolean;
    error: string | null;

    cargarConversaciones: (estado?: 'ABIERTA' | 'CERRADA') => Promise<void>;
    abrirConversacion: (id: number) => Promise<void>;
    enviarMensaje: (contenido: string) => Promise<void>;
    cerrarConversacionActiva: () => Promise<void>;
    /** Llamado por el store de notificaciones cuando llega 'nuevo-mensaje-soporte'. */
    recibirMensajeEnVivo: (payload: {
        conversacionId: number;
        rol: 'EMPRESA' | 'SISTEMA';
        autorNombre: string;
        contenido: string;
        empresaNombre?: string;
    }) => void;
}

export const useSoporteSistemaStore = create<SoporteSistemaState>((set, get) => ({
    conversaciones: [],
    conversacionActivaId: null,
    mensajes: [],
    empresaNombreActiva: null,
    estadoActiva: null,
    loadingLista: false,
    loadingChat: false,
    enviando: false,
    error: null,

    cargarConversaciones: async (estado) => {
        set({ loadingLista: true, error: null });
        const query = estado ? `?estado=${estado}` : '';
        const res = await apiGet<SoporteConversacionResumen[]>(`/soporte/sistema/conversaciones${query}`);
        if (res.success && res.data) {
            set({ conversaciones: res.data, loadingLista: false });
        } else {
            set({ loadingLista: false, error: res.error || 'No se pudieron cargar las consultas' });
        }
    },

    abrirConversacion: async (id: number) => {
        set({ loadingChat: true, conversacionActivaId: id });
        const res = await apiGet<{ empresaNombre: string; estado: 'ABIERTA' | 'CERRADA'; mensajes: SoporteMensaje[] }>(
            `/soporte/sistema/conversaciones/${id}`,
        );
        if (res.success && res.data) {
            set({
                mensajes: res.data.mensajes,
                empresaNombreActiva: res.data.empresaNombre,
                estadoActiva: res.data.estado,
                loadingChat: false,
            });
            // La conversación abierta queda con 0 no leídos; refleja eso en la lista sin refetch.
            set((state) => ({
                conversaciones: state.conversaciones.map((c) =>
                    c.id === id ? { ...c, noLeidosSistema: 0 } : c,
                ),
            }));
        } else {
            set({ loadingChat: false, error: res.error || 'No se pudo abrir la consulta' });
        }
    },

    enviarMensaje: async (contenido: string) => {
        const { conversacionActivaId } = get();
        const texto = contenido.trim();
        if (!texto || !conversacionActivaId) return;
        set({ enviando: true });
        const res = await apiPost(`/soporte/sistema/conversaciones/${conversacionActivaId}/mensajes`, {
            contenido: texto,
        });
        set({ enviando: false });
        if (res.success) {
            await get().abrirConversacion(conversacionActivaId);
            await get().cargarConversaciones();
        } else {
            set({ error: res.error || 'No se pudo enviar la respuesta' });
        }
    },

    cerrarConversacionActiva: async () => {
        const { conversacionActivaId } = get();
        if (!conversacionActivaId) return;
        const res = await apiPatch(`/soporte/sistema/conversaciones/${conversacionActivaId}/cerrar`, {});
        if (res.success) {
            set({ estadoActiva: 'CERRADA' });
            await get().cargarConversaciones();
        }
    },

    recibirMensajeEnVivo: (payload) => {
        const { conversacionActivaId } = get();
        if (payload.rol === 'EMPRESA') {
            if (conversacionActivaId === payload.conversacionId) {
                set((state) => {
                    // Mismo criterio que del lado de la empresa: el id real
                    // permite reconocer un evento repetido y no mostrar el
                    // mensaje dos veces en la bandeja.
                    const id = (payload as any).mensajeId as number | undefined;
                    if (id != null && state.mensajes.some((m) => m.id === id)) return state;
                    return {
                        mensajes: [
                            ...state.mensajes,
                            {
                                id: id ?? Date.now(),
                                conversacionId: payload.conversacionId,
                                rol: 'EMPRESA' as const,
                                autorNombre: payload.autorNombre,
                                contenido: payload.contenido,
                                creadoEn: new Date().toISOString(),
                            },
                        ],
                    };
                });
            }
        }
        // En cualquier caso, refresca la lista para subir el hilo y actualizar el badge.
        get().cargarConversaciones();
    },
}));
