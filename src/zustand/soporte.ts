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
    /** Mensaje propio que se muestra al instante mientras sube (como WhatsApp). */
    pendiente?: boolean;
    /** No se pudo enviar: se queda en el hilo marcado en rojo. */
    fallido?: boolean;
}

/**
 * Mensaje propio que aparece en el hilo apenas se envía, antes de que el
 * servidor responda: la foto se ve desde el archivo local. Id negativo para
 * no chocar nunca con uno real.
 */
export function mensajeTemporal(
    rol: 'EMPRESA' | 'SISTEMA',
    conversacionId: number,
    contenido: string,
    adjunto: { tipo?: 'imagen' | 'audio'; archivo?: File } = {},
): SoporteMensaje {
    const local = adjunto.archivo ? URL.createObjectURL(adjunto.archivo) : null;
    return {
        id: -Math.floor(Date.now() + Math.random() * 1000),
        conversacionId,
        rol,
        autorNombre: null,
        contenido,
        imagenUrl: adjunto.tipo === 'imagen' ? local : null,
        audioUrl: adjunto.tipo === 'audio' ? local : null,
        creadoEn: new Date().toISOString(),
        pendiente: true,
    };
}

/** Al recargar del servidor se conservan los propios que siguen subiendo o fallaron. */
export const conservarTemporales = (servidor: SoporteMensaje[], actuales: SoporteMensaje[], conversacionId?: number) => [
    ...servidor,
    ...actuales.filter(
        (m) => (m.pendiente || m.fallido) && (conversacionId == null || m.conversacionId === conversacionId),
    ),
];

export const textoDeAdjunto = (tipo: 'imagen' | 'audio', texto?: string) =>
    tipo === 'audio' ? '[Nota de voz]' : texto?.trim() ? `[Imagen] ${texto.trim()}` : '[Imagen]';

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

    cargarMensajes: (quitarTemporal?: number) => Promise<void>;
    enviarMensaje: (contenido: string) => Promise<void>;
    /** Foto (con `texto` como pie) o nota de voz. */
    enviarAdjunto: (tipo: 'imagen' | 'audio', archivo: File, texto?: string) => Promise<boolean>;
    /** Quita el mensaje temporal al confirmarse, o lo marca como no enviado. */
    resolverTemporal: (id: number, ok: boolean, error: string) => void;
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

    cargarMensajes: async (quitarTemporal?: number) => {
        set({ loading: true, error: null });
        const res = await apiGet<{ estado: 'ABIERTA' | 'CERRADA'; mensajes: SoporteMensaje[] }>('/soporte/mensajes');
        if (res.success && res.data) {
            set((state) => ({
                // El temporal confirmado se va en el MISMO cambio que trae el real.
                mensajes: conservarTemporales(
                    res.data!.mensajes,
                    state.mensajes.filter((m) => m.id !== quitarTemporal),
                ),
                estado: res.data!.estado,
                loading: false,
            }));
        } else {
            set({ loading: false, error: res.error || 'No se pudo cargar el chat de soporte' });
        }
    },

    enviarMensaje: async (contenido: string) => {
        const texto = contenido.trim();
        if (!texto) return;
        const temporal = mensajeTemporal('EMPRESA', 0, texto);
        set((state) => ({ mensajes: [...state.mensajes, temporal], error: null }));
        const res = await apiPost('/soporte/mensajes', { contenido: texto });
        if (res.success) await get().cargarMensajes(temporal.id);
        else get().resolverTemporal(temporal.id, false, res.error || 'No se pudo enviar el mensaje');
    },

    enviarAdjunto: async (tipo, archivo, texto) => {
        const temporal = mensajeTemporal('EMPRESA', 0, textoDeAdjunto(tipo, texto), { tipo, archivo });
        set((state) => ({ mensajes: [...state.mensajes, temporal], error: null }));
        const res = await subirAdjuntoSoporte(`/soporte/mensajes/${tipo}`, archivo, texto);
        if (res.success) await get().cargarMensajes(temporal.id);
        else
            get().resolverTemporal(
                temporal.id,
                false,
                res.error || (tipo === 'imagen' ? 'No se pudo enviar la imagen' : 'No se pudo enviar la nota de voz'),
            );
        return res.success;
    },

    resolverTemporal: (id, ok, error) => {
        set((state) => {
            const t = state.mensajes.find((m) => m.id === id);
            if (ok) {
                // La foto local ya no hace falta: la recarga trae la de S3.
                [t?.imagenUrl, t?.audioUrl].forEach((u) => u?.startsWith('blob:') && URL.revokeObjectURL(u));
                return { mensajes: state.mensajes.filter((m) => m.id !== id) };
            }
            return {
                mensajes: state.mensajes.map((m) => (m.id === id ? { ...m, pendiente: false, fallido: true } : m)),
                error,
            };
        });
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
