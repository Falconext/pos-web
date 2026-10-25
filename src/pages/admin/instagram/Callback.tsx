import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import { ESTADO_LOGIN_INSTAGRAM, rutaRetornoInstagram } from '@/components/ConectarInstagramButton';

/**
 * Vuelta del login de Instagram: canjea el código y regresa a Perfil.
 *
 * El `state` se compara con el que se guardó al salir: si no coincide, el
 * código no lo pidió este navegador y no se usa.
 */
export default function InstagramCallback() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const hecho = useRef(false);

    useEffect(() => {
        if (hecho.current) return;
        hecho.current = true;
        const code = params.get('code');
        const state = params.get('state');
        const esperado = sessionStorage.getItem(ESTADO_LOGIN_INSTAGRAM);
        sessionStorage.removeItem(ESTADO_LOGIN_INSTAGRAM);

        if (params.get('error')) {
            setError(params.get('error_description') || 'Cancelaste la conexión con Instagram.');
            return;
        }
        if (!code || !state || state !== esperado) {
            setError('El enlace de Instagram no es válido o ya se usó. Vuelve a intentarlo desde Perfil.');
            return;
        }
        (async () => {
            try {
                const { data } = await apiClient.post('/instagram/conectar', { code, redirectUri: rutaRetornoInstagram() });
                const r = data?.data ?? data;
                useAlertStore
                    .getState()
                    .alert(`Instagram conectado${r?.usuario ? `: @${r.usuario}` : ''}. La IA de Ventas ya responde tus mensajes directos.`, 'success');
                navigate('/administrador/perfil', { replace: true });
            } catch (e: any) {
                setError(e?.response?.data?.message || 'No se pudo conectar Instagram.');
            }
        })();
    }, [params, navigate]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-[#111827]">
                <Icon
                    icon={error ? 'solar:danger-triangle-bold' : 'svg-spinners:180-ring'}
                    width={36}
                    className={`mx-auto ${error ? 'text-rose-500' : 'text-pink-500'}`}
                />
                <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-white">
                    {error ?? 'Conectando tu Instagram…'}
                </p>
                {error && (
                    <button
                        type="button"
                        onClick={() => navigate('/administrador/perfil', { replace: true })}
                        className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white dark:bg-slate-700"
                    >
                        Volver a Perfil
                    </button>
                )}
            </div>
        </div>
    );
}
