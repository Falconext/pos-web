import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

/** Clave donde se guarda el `state` del login, para verificarlo al volver. */
export const ESTADO_LOGIN_MESSENGER = 'FB_OAUTH_STATE';
/** A dónde vuelve el login de Facebook (registrada en la app de Meta). */
export const rutaRetornoMessenger = () => `${window.location.origin}/administrador/messenger/callback`;

type Estado = {
    disponible: boolean;
    conectado: boolean;
    pagina: string | null;
    requiereReconectar?: boolean;
    motivoReconectar?: string | null;
};

/**
 * Conecta la página de Facebook del negocio para que la IA de Ventas responda
 * por Messenger. Igual que Instagram: el login lo hace Facebook en su página y
 * vuelve a /administrador/messenger/callback.
 */
export default function ConectarMessengerButton() {
    const [estado, setEstado] = useState<Estado | null>(null);
    const [cargando, setCargando] = useState(false);

    const cargar = async () => {
        try {
            const { data } = await apiClient.get('/messenger/estado');
            setEstado(data?.data ?? data);
        } catch {
            setEstado({ disponible: false, conectado: false, pagina: null });
        }
    };
    useEffect(() => {
        void cargar();
    }, []);

    const conectar = async () => {
        setCargando(true);
        try {
            const state = crypto.randomUUID();
            sessionStorage.setItem(ESTADO_LOGIN_MESSENGER, state);
            const { data } = await apiClient.get('/messenger/autorizar', {
                params: { redirectUri: rutaRetornoMessenger(), state },
            });
            const url = (data?.data ?? data)?.url;
            if (!url) throw new Error();
            window.location.href = url;
        } catch (e: any) {
            useAlertStore.getState().alert(e?.response?.data?.message || 'No se pudo abrir Facebook. Reintenta.', 'error');
            setCargando(false);
        }
    };

    const desconectar = async () => {
        setCargando(true);
        try {
            await apiClient.delete('/messenger');
            useAlertStore.getState().alert('Messenger desconectado. La IA de Ventas ya no responde por ahí.', 'success');
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
                Muy pronto: la conexión con Messenger se está habilitando en la plataforma.
            </span>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {estado.requiereReconectar && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                    <Icon icon="solar:danger-triangle-bold" width={18} className="mt-0.5 shrink-0" />
                    <div className="text-[12.5px] leading-5">
                        <p className="font-bold">Messenger se desconectó: la IA no está respondiendo por ahí.</p>
                        <p>
                            Facebook cerró el acceso, normalmente porque se cambió la clave o se quitaron permisos. Pulsa{' '}
                            <strong>Reconectar Messenger</strong> y vuelve a entrar.
                        </p>
                    </div>
                </div>
            )}
            {estado.conectado && !estado.requiereReconectar && (
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    <Icon icon="mdi:facebook-messenger" width={14} /> Conectada: {estado.pagina || 'tu página'}
                </span>
            )}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={conectar}
                    disabled={cargando}
                    className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#0084FF] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition hover:brightness-95 disabled:opacity-60"
                >
                    <Icon icon={cargando ? 'svg-spinners:180-ring' : 'mdi:facebook-messenger'} width={18} />
                    {cargando ? 'Abriendo Facebook…' : estado.conectado ? 'Reconectar Messenger' : 'Conectar Messenger'}
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
                Entra con el Facebook que administra la página del negocio. La IA de Ventas responderá los mensajes de Messenger igual que en WhatsApp.
            </span>
        </div>
    );
}
