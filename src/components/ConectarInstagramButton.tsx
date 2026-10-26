import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

/** Clave donde se guarda el `state` del login, para verificarlo al volver. */
export const ESTADO_LOGIN_INSTAGRAM = 'IG_OAUTH_STATE';
/** A dónde vuelve el login de Instagram (registrada en la app de Meta). */
export const rutaRetornoInstagram = () => `${window.location.origin}/administrador/instagram/callback`;

type Estado = {
    disponible: boolean;
    conectado: boolean;
    usuario: string | null;
    venceToken: string | null;
    /** Meta anuló el acceso (cambio de clave, sesión cerrada): hay que volver a conectar. */
    requiereReconectar?: boolean;
    motivoReconectar?: string | null;
    comentarios?: boolean;
    comentariosClave?: string;
    /** Texto fijo que se deja en el comentario; vacío = solo el privado. */
    comentarioPublico?: string;
};

const PUBLICO_POR_DEFECTO = '¡Hola! Te escribimos por DM 📩';

/**
 * Conecta la cuenta profesional de Instagram del negocio a la IA de Ventas.
 *
 * El login lo hace Instagram en su propia página (no hay popup como en
 * WhatsApp): se manda al empresario allá y vuelve a /administrador/instagram/callback.
 */
export default function ConectarInstagramButton() {
    const [estado, setEstado] = useState<Estado | null>(null);
    const [cargando, setCargando] = useState(false);
    const [clave, setClave] = useState('');
    const [publico, setPublico] = useState('');
    const [guardandoComentarios, setGuardandoComentarios] = useState(false);

    const cargar = async () => {
        try {
            const { data } = await apiClient.get('/instagram/estado');
            const e: Estado = data?.data ?? data;
            setEstado(e);
            setClave(e?.comentariosClave ?? '');
            setPublico(e?.comentarioPublico ?? '');
        } catch {
            setEstado({ disponible: false, conectado: false, usuario: null, venceToken: null });
        }
    };
    useEffect(() => {
        void cargar();
    }, []);

    const conectar = async () => {
        setCargando(true);
        try {
            const state = crypto.randomUUID();
            sessionStorage.setItem(ESTADO_LOGIN_INSTAGRAM, state);
            const { data } = await apiClient.get('/instagram/autorizar', {
                params: { redirectUri: rutaRetornoInstagram(), state },
            });
            const url = (data?.data ?? data)?.url;
            if (!url) throw new Error();
            window.location.href = url;
        } catch (e: any) {
            useAlertStore.getState().alert(e?.response?.data?.message || 'No se pudo abrir Instagram. Reintenta.', 'error');
            setCargando(false);
        }
    };

    const desconectar = async () => {
        setCargando(true);
        try {
            await apiClient.delete('/instagram');
            useAlertStore.getState().alert('Instagram desconectado. La IA de Ventas ya no responde por ahí.', 'success');
            await cargar();
        } catch (e: any) {
            useAlertStore.getState().alert(e?.response?.data?.message || 'No se pudo desconectar.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const guardarComentarios = async (activo: boolean, textoPublico = estado?.comentarioPublico ? publico : '') => {
        setGuardandoComentarios(true);
        try {
            const { data } = await apiClient.put('/instagram/comentarios', { activo, clave, publico: textoPublico });
            const e: Estado = data?.data ?? data;
            setEstado(e);
            setClave(e?.comentariosClave ?? '');
            setPublico(e?.comentarioPublico ?? '');
            useAlertStore
                .getState()
                .alert(activo ? 'Listo: la IA responderá por privado a quien comente.' : 'La IA ya no responde los comentarios.', 'success');
        } catch (e: any) {
            useAlertStore.getState().alert(e?.response?.data?.message || 'No se pudo guardar.', 'error');
        } finally {
            setGuardandoComentarios(false);
        }
    };

    if (!estado) return <span className="text-xs text-gray-400">Cargando…</span>;

    if (!estado.disponible) {
        return (
            <span className="text-[12px] text-gray-500 dark:text-gray-400">
                Muy pronto: la conexión con Instagram se está habilitando en la plataforma.
            </span>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {estado.requiereReconectar && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                    <Icon icon="solar:danger-triangle-bold" width={18} className="mt-0.5 shrink-0" />
                    <div className="text-[12.5px] leading-5">
                        <p className="font-bold">Instagram se desconectó: la IA no está respondiendo por ahí.</p>
                        <p>
                            Meta cerró el acceso, normalmente porque se cambió la clave de Instagram o de un Facebook vinculado. Pulsa{' '}
                            <strong>Reconectar Instagram</strong> y vuelve a entrar.
                        </p>
                    </div>
                </div>
            )}
            {estado.conectado && !estado.requiereReconectar && (
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                    <Icon icon="mdi:instagram" width={14} /> Conectado: {estado.usuario ? `@${estado.usuario}` : 'tu cuenta'}
                </span>
            )}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={conectar}
                    disabled={cargando}
                    className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-pink-500/20 transition hover:brightness-95 disabled:opacity-60"
                >
                    <Icon icon={cargando ? 'svg-spinners:180-ring' : 'mdi:instagram'} width={18} />
                    {cargando ? 'Abriendo Instagram…' : estado.conectado ? 'Reconectar Instagram' : 'Conectar Instagram'}
                </button>
                {estado.conectado && (
                    <button
                        type="button"
                        onClick={desconectar}
                        disabled={cargando}
                        className="text-[12px] font-bold text-gray-500 hover:text-rose-600 disabled:opacity-60"
                    >
                        Desconectar
                    </button>
                )}
            </div>
            <span className="text-[11px] text-gray-400">
                Tu cuenta tiene que ser profesional (empresa o creador). La IA de Ventas responderá los mensajes directos igual que en WhatsApp.
            </span>
            {estado.conectado && !estado.requiereReconectar && (
                <div className="mt-2 rounded-xl border border-gray-100 p-3 dark:border-slate-800">
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={Boolean(estado.comentarios)}
                            disabled={guardandoComentarios}
                            onChange={(e) => void guardarComentarios(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <span>
                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">Responder comentarios por privado</span>
                            <span className="mt-0.5 block text-[12px] text-gray-500 dark:text-gray-400">
                                Cuando alguien comenta tus publicaciones, la IA le escribe un mensaje privado y sigue la venta por DM. Instagram permite un solo mensaje hasta que la persona conteste.
                            </span>
                        </span>
                    </label>
                    <div className="mt-3 flex flex-col gap-1.5 pl-7">
                        <label htmlFor="ig-clave" className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                            Solo si el comentario dice (opcional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <input
                                id="ig-clave"
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                placeholder="precio, info, quiero"
                                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => void guardarComentarios(Boolean(estado.comentarios))}
                                disabled={
                                    guardandoComentarios ||
                                    (clave === (estado.comentariosClave ?? '') && publico === (estado.comentarioPublico ?? ''))
                                }
                                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-40 dark:bg-slate-700"
                            >
                                Guardar
                            </button>
                        </div>
                        <span className="text-[11px] text-gray-400">Separa las palabras con comas. Vacío = responde todos los comentarios.</span>
                    </div>
                    {estado.comentarios && (
                        <div className="mt-3 flex flex-col gap-1.5 pl-7">
                            <label className="flex cursor-pointer items-start gap-2">
                                <input
                                    type="checkbox"
                                    checked={Boolean(estado.comentarioPublico)}
                                    disabled={guardandoComentarios}
                                    onChange={(e) => void guardarComentarios(true, e.target.checked ? publico.trim() || PUBLICO_POR_DEFECTO : '')}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 dark:border-slate-700 dark:bg-slate-800"
                                />
                                <span>
                                    <span className="block text-[12px] font-semibold text-gray-700 dark:text-gray-300">Responder también en el comentario</span>
                                    <span className="block text-[11px] text-gray-400">
                                        Deja este texto a la vista de todos, para que sepan que les escribiste. Siempre es el mismo: los precios van solo por privado.
                                    </span>
                                </span>
                            </label>
                            {estado.comentarioPublico && (
                                <input
                                    value={publico}
                                    maxLength={300}
                                    onChange={(e) => setPublico(e.target.value)}
                                    placeholder={PUBLICO_POR_DEFECTO}
                                    className="min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
