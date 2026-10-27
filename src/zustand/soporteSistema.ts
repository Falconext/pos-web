import { create } from 'zustand';
import { get as apiGet, post as apiPost, patch as apiPatch } from '../utils/fetch';
import {
    conservarTemporales,
    mensajeTemporal,
    subirAdjuntoSoporte,
    textoDeAdjunto,
    type LecturaSoporte,
    type SoporteMensaje,
    type TipoAdjunto,
} from './soporte';

/** Lo que el equipo necesita para ayudar sin buscarlo en otra pantalla. */
export interface FichaEmpresaSoporte {
    ruc: string;
    razonSocial: string;
    nombreComercial: string | null;
    estado: string;
    plan: string | null;
    rubro: string | null;
    vence: string | null;
    administradores: { nombre: string; email: string; celular: string }[];
    escribieron: string[];
}

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
    /** Hasta cuándo leyó el empresario: lo nuestro anterior va con doble check azul. */
    leidoPorEmpresaEn: string | null;
    ficha: FichaEmpresaSoporte | null;
    loadingLista: boolean;
    loadingChat: boolean;
    enviando: boolean;
    error: string | null;

    cargarConversaciones: (estado?: 'ABIERTA' | 'CERRADA') => Promise<void>;
    abrirConversacion: (id: number, quitarTemporal?: number) => Promise<void>;
    enviarMensaje: (contenido: string) => Promise<void>;
    enviarAdjunto: (tipo: TipoAdjunto, archivo: File, texto?: string) => Promise<boolean>;
    recibirLectura: (lectura: LecturaSoporte) => void;
    resolverTemporal: (id: number, ok: boolean, error: string) => void;
    cerrarConversacionActiva: () => Promise<void>;
    /** Llamado por el store de notificaciones cuando llega 'nuevo-mensaje-soporte'. */
    recibirMensajeEnVivo: (payload: {
        conversacionId: number;
        rol: 'EMPRESA' | 'SISTEMA';
        autorNombre: string;
        contenido: string;
        empresaNombre?: string;
        imagenUrl?: string;
        audioUrl?: string;
        archivoUrl?: string;
        archivoNombre?: string;
    }) => void;
}

export const useSoporteSistemaStore = create<SoporteSistemaState>((set, get) => ({
    conversaciones: [],
    conversacionActivaId: null,
    mensajes: [],
    empresaNombreActiva: null,
    estadoActiva: null,
    leidoPorEmpresaEn: null,
    ficha: null,
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

    abrirConversacion: async (id: number, quitarTemporal?: number) => {
        // Recargar la misma consulta (tras enviar) no muestra el cargando: el
        // hilo se reemplazaba por un spinner y el chat parpadeaba y perdía el final.
        const otra = get().conversacionActivaId !== id;
        set({ loadingChat: otra, conversacionActivaId: id });
        const res = await apiGet<{
            empresaNombre: string;
            estado: 'ABIERTA' | 'CERRADA';
            mensajes: SoporteMensaje[];
            leidoPorEmpresaEn?: string | null;
            ficha?: FichaEmpresaSoporte | null;
        }>(
            `/soporte/sistema/conversaciones/${id}`,
        );
        if (res.success && res.data) {
            set((state) => ({
                // El temporal confirmado se va en el MISMO cambio que trae el real:
                // si se quitara antes, el mensaje desaparecería un instante.
                mensajes: conservarTemporales(
                    res.data!.mensajes,
                    state.mensajes.filter((m) => m.id !== quitarTemporal),
                    id,
                ),
                empresaNombreActiva: res.data!.empresaNombre,
                estadoActiva: res.data!.estado,
                leidoPorEmpresaEn: res.data!.leidoPorEmpresaEn ?? null,
                ficha: res.data!.ficha ?? null,
                loadingChat: false,
            }));
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
        const temporal = { ...mensajeTemporal('SISTEMA', conversacionActivaId, texto), autorNombre: 'Tú' };
        set((state) => ({ mensajes: [...state.mensajes, temporal], error: null }));
        const res = await apiPost(`/soporte/sistema/conversaciones/${conversacionActivaId}/mensajes`, {
            contenido: texto,
        });
        if (!res.success) get().resolverTemporal(temporal.id, false, res.error || 'No se pudo enviar la respuesta');
        else if (get().conversacionActivaId === conversacionActivaId) {
            await get().abrirConversacion(conversacionActivaId, temporal.id);
        }
        if (res.success) await get().cargarConversaciones();
    },

    enviarAdjunto: async (tipo, archivo, texto) => {
        const { conversacionActivaId } = get();
        if (!conversacionActivaId) return false;
        const temporal = {
            ...mensajeTemporal('SISTEMA', conversacionActivaId, textoDeAdjunto(tipo, texto, archivo.name), { tipo, archivo }),
            autorNombre: 'Tú',
        };
        set((state) => ({ mensajes: [...state.mensajes, temporal], error: null }));
        const res = await subirAdjuntoSoporte(
            `/soporte/sistema/conversaciones/${conversacionActivaId}/${tipo}`,
            archivo,
            texto,
        );
        if (!res.success) get().resolverTemporal(temporal.id, false, res.error || 'No se pudo enviar el archivo');
        else if (get().conversacionActivaId === conversacionActivaId) {
            await get().abrirConversacion(conversacionActivaId, temporal.id);
        }
        if (res.success) await get().cargarConversaciones();
        return res.success;
    },

    resolverTemporal: (id, ok, error) => {
        set((state) => {
            const t = state.mensajes.find((m) => m.id === id);
            if (ok) {
                [t?.imagenUrl, t?.audioUrl].forEach((u) => u?.startsWith('blob:') && URL.revokeObjectURL(u));
                return { mensajes: state.mensajes.filter((m) => m.id !== id) };
            }
            return {
                mensajes: state.mensajes.map((m) => (m.id === id ? { ...m, pendiente: false, fallido: true } : m)),
                error,
            };
        });
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
                                imagenUrl: payload.imagenUrl ?? null,
                                audioUrl: payload.audioUrl ?? null,
                                archivoUrl: payload.archivoUrl ?? null,
                                archivoNombre: payload.archivoNombre ?? null,
                                creadoEn: new Date().toISOString(),
                            },
                        ],
                    };
                });
            }
        }
        // En cualquier caso, refresca la lista para subir el hilo y actualizar el badge.
        // Con la consulta abierta en pantalla, lo que llega ya se está viendo:
        // el empresario recibe su doble check azul al instante.
        if (payload.rol === 'EMPRESA' && conversacionActivaId === payload.conversacionId) {
            apiPatch(`/soporte/sistema/conversaciones/${conversacionActivaId}/leido`, {}).catch(() => undefined);
        }
        get().cargarConversaciones();
    },

    recibirLectura: (lectura) => {
        if (lectura.lado === 'EMPRESA' && lectura.conversacionId === get().conversacionActivaId) {
            set({ leidoPorEmpresaEn: lectura.en });
        }
    },
}));
