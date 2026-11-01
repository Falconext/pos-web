import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

/** Clave donde se guarda el `state` del login, para verificarlo al volver. */
export const ESTADO_LOGIN_TIKTOK = 'TT_OAUTH_STATE';
/** A dónde vuelve el login de TikTok (registrada en la app de TikTok). */
export const rutaRetornoTiktok = () => `${window.location.origin}/administrador/tiktok/callback`;

type Respondido = {
    autor: string | null;
    texto: string;
    respuesta: string | null;
    estado: 'PENDIENTE' | 'RESPONDIDO' | 'ERROR' | string;
    error: string | null;
    creadoEn: string;
};

type Estado = {
    disponible: boolean;
    conectado: boolean;
    usuario: string | null;
    requiereReconectar?: boolean;
    motivoReconectar?: string | null;
    comentarios?: boolean;
    comentariosClave?: string;
    ultimas?: Respondido[];
};

/**
 * Conecta la cuenta de TikTok del negocio para que la IA de Ventas responda
 * los comentarios de sus videos. Es en público: la API de TikTok no trae
 * mensajes directos, así que la respuesta invita a escribir por WhatsApp.
 */
export default function ConectarTiktokButton() {
    const [estado, setEstado] = useState<Estado | null>(null);
    const [cargando, setCargando] = useState(false);
    const [clave, setClave] = useState('');
    const [guardando, setGuardando] = useState(false);

    const cargar = async () => {
        try {
            const { data } = await apiClient.get('/tiktok/estado');
            const e: Estado = data?.data ?? data;
            setEstado(e);
            setClave(e?.comentariosClave ?? '');
        } catch {
            setEstado({ disponible: false, conectado: false, usuario: null });
        }
    };
    useEffect(() => {
        void cargar();
    }, []);

    const conectar = async () => {
        setCargando(true);
        try {
            const state = crypto.randomUUID();
            sessionStorage.setItem(ESTADO_LOGIN_TIKTOK, state);
            const { data } = await apiClient.get('/tiktok/autorizar', { params: { redirectUri: rutaRetornoTiktok(), state } });
            const url = (data?.data ?? data)?.url;
            if (!url) throw new Error();
            window.location.href = url;
        } catch (e: any) {
            useAlertStore.getState().alert(e?.response?.data?.message || 'No se pudo abrir TikTok. Reintenta.', 'error');
            setCargando(false);
        }
    };

    const desconectar = async () => {
        setCargando(true);
        try {
            await apiClient.delete('/tiktok');
            useAlertStore.getState().alert('TikTok desconectado. La IA ya no responde tus comentarios.', 'success');
            await cargar();
        } catch (e: any) {
            useAlertStore.getState().alert(e?.response?.data?.message || 'No se pudo desconectar.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const guardarComentarios = async (activo: boolean) => {
        setGuardando(true);
        try {
            const { data } = await apiClient.put('/tiktok/comentarios', { activo, clave });
            const e: Estado = data?.data ?? data;
            setEstado(e);
            setClave(e?.comentariosClave ?? '');
            useAlertStore
                .getState()
                .alert(activo ? 'Listo: la IA responderá los comentarios nuevos de tus videos.' : 'La IA ya no responde los comentarios.', 'success');
        } catch (e: any) {
            useAlertStore.getState().alert(e?.response?.data?.message || 'No se pudo guardar.', 'error');
        } finally {
            setGuardando(false);
        }
    };

    if (!estado) return <span className="text-xs text-gray-400">Cargando…</span>;

    if (!estado.disponible) {
        return (
            <span className="text-[12px] text-gray-500 dark:text-gray-400">
                Muy pronto: la conexión con TikTok se está habilitando en la plataforma.
            </span>
        );
    }

    const ultimas = estado.ultimas ?? [];

    return (
        <div className="flex flex-col gap-2">
            {estado.requiereReconectar && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                    <Icon icon="solar:danger-triangle-bold" width={18} className="mt-0.5 shrink-0" />
                    <p className="text-[12.5px] leading-5">
                        <strong>TikTok se desconectó:</strong> la IA no está respondiendo comentarios. Pulsa <strong>Reconectar TikTok</strong> y vuelve a entrar.
                    </p>
                </div>
            )}
            {estado.conectado && !estado.requiereReconectar && (
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white dark:bg-slate-700">
                    <Icon icon="ic:baseline-tiktok" width={14} /> Conectado: {estado.usuario ? `@${estado.usuario}` : 'tu cuenta'}
                </span>
            )}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={conectar}
                    disabled={cargando}
                    data-testid="conectar-tiktok"
                    className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-gray-900/20 transition hover:bg-black disabled:opacity-60 dark:bg-white dark:text-gray-950"
                >
                    <Icon icon={cargando ? 'svg-spinners:180-ring' : 'ic:baseline-tiktok'} width={18} />
                    {cargando ? 'Abriendo TikTok…' : estado.conectado ? 'Reconectar TikTok' : 'Conectar TikTok'}
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
                Tu cuenta de TikTok tiene que ser de empresa (Business). TikTok todavía no deja responder mensajes directos: la IA contesta en el comentario y lleva al cliente a tu WhatsApp.
            </span>
            {estado.conectado && !estado.requiereReconectar && (
                <div className="mt-2 rounded-xl border border-gray-100 p-3 dark:border-slate-800">
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={Boolean(estado.comentarios)}
                            disabled={guardando}
                            onChange={(e) => void guardarComentarios(e.target.checked)}
                            data-testid="tiktok-comentarios"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <span>
                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">Responder comentarios con la IA</span>
                            <span className="mt-0.5 block text-[12px] text-gray-500 dark:text-gray-400">
                                Cada 5 minutos la IA revisa tus últimos videos y responde los comentarios nuevos: corto, sin precios (es público) y con tu WhatsApp. Los comentarios que ya estaban no se tocan.
                            </span>
                        </span>
                    </label>
                    <div className="mt-3 flex flex-col gap-1.5 pl-7">
                        <label htmlFor="tt-clave" className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                            Solo si el comentario dice (opcional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <input
                                id="tt-clave"
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                placeholder="precio, info, envío"
                                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => void guardarComentarios(Boolean(estado.comentarios))}
                                disabled={guardando || clave === (estado.comentariosClave ?? '')}
                                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-40 dark:bg-slate-700"
                            >
                                Guardar
                            </button>
                        </div>
                        <span className="text-[11px] text-gray-400">Separa las palabras con comas. Vacío = responde todos los comentarios.</span>
                    </div>
                    {ultimas.length > 0 && (
                        <div className="mt-4 pl-7">
                            <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Últimas respuestas</p>
                            <ul className="mt-2 flex flex-col gap-2" data-testid="tiktok-ultimas">
                                {ultimas.map((u, i) => (
                                    <li key={i} className="rounded-lg bg-gray-50 p-2.5 text-[12px] dark:bg-slate-800/60">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            <span className="font-semibold text-gray-700 dark:text-gray-200">{u.autor || 'Alguien'}</span>: {u.texto}
                                        </p>
                                        {u.estado === 'RESPONDIDO' ? (
                                            <p className="mt-1 text-gray-900 dark:text-white">↳ {u.respuesta}</p>
                                        ) : u.estado === 'ERROR' ? (
                                            <p className="mt-1 text-rose-600 dark:text-rose-300">No se pudo responder: {u.error}</p>
                                        ) : (
                                            <p className="mt-1 text-gray-400">Respondiendo…</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
