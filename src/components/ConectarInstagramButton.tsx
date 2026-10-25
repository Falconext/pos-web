import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

/** Clave donde se guarda el `state` del login, para verificarlo al volver. */
export const ESTADO_LOGIN_INSTAGRAM = 'IG_OAUTH_STATE';
/** A dónde vuelve el login de Instagram (registrada en la app de Meta). */
export const rutaRetornoInstagram = () => `${window.location.origin}/administrador/instagram/callback`;

type Estado = { disponible: boolean; conectado: boolean; usuario: string | null; venceToken: string | null };

/**
 * Conecta la cuenta profesional de Instagram del negocio a la IA de Ventas.
 *
 * El login lo hace Instagram en su propia página (no hay popup como en
 * WhatsApp): se manda al empresario allá y vuelve a /administrador/instagram/callback.
 */
export default function ConectarInstagramButton() {
    const [estado, setEstado] = useState<Estado | null>(null);
    const [cargando, setCargando] = useState(false);

    const cargar = async () => {
        try {
            const { data } = await apiClient.get('/instagram/estado');
            setEstado(data?.data ?? data);
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
            {estado.conectado && (
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
        </div>
    );
}
