import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import { ESTADO_LOGIN_MESSENGER, rutaRetornoMessenger } from '@/components/ConectarMessengerButton';

type Pagina = { id: string; nombre: string };

/**
 * Vuelta del login de Facebook: canjea el código y, si la cuenta administra
 * varias páginas, deja elegir cuál conectar. Igual que Instagram, el `state`
 * tiene que coincidir con el que se guardó al salir.
 */
export default function MessengerCallback() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [paginas, setPaginas] = useState<Pagina[] | null>(null);
    const [seleccion, setSeleccion] = useState('');
    const [eligiendo, setEligiendo] = useState<string | null>(null);
    const hecho = useRef(false);

    const listo = (pagina?: string) => {
        useAlertStore
            .getState()
            .alert(`Messenger conectado${pagina ? `: ${pagina}` : ''}. La IA de Ventas ya responde los mensajes de tu página.`, 'success');
        navigate('/administrador/perfil', { replace: true });
    };

    useEffect(() => {
        if (hecho.current) return;
        hecho.current = true;
        const code = params.get('code');
        const state = params.get('state');
        const esperado = sessionStorage.getItem(ESTADO_LOGIN_MESSENGER);
        sessionStorage.removeItem(ESTADO_LOGIN_MESSENGER);

        if (params.get('error')) {
            setError(params.get('error_description') || 'Cancelaste la conexión con Facebook.');
            return;
        }
        if (!code || !state || state !== esperado) {
            setError('El enlace de Facebook no es válido o ya se usó. Vuelve a intentarlo desde Perfil.');
            return;
        }
        (async () => {
            try {
                const { data } = await apiClient.post('/messenger/conectar', { code, redirectUri: rutaRetornoMessenger() });
                const r = data?.data ?? data;
                if (r?.conectado) return listo(r?.pagina);
                setSeleccion(r?.seleccion ?? '');
                setPaginas(r?.paginas ?? []);
            } catch (e: any) {
                setError(e?.response?.data?.message || 'No se pudo conectar Messenger.');
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    const elegir = async (p: Pagina) => {
        setEligiendo(p.id);
        try {
            const { data } = await apiClient.post('/messenger/pagina', { seleccion, pageId: p.id });
            listo((data?.data ?? data)?.pagina ?? p.nombre);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'No se pudo conectar la página.');
            setEligiendo(null);
        }
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-[#111827]">
                {paginas && !error ? (
                    <>
                        <Icon icon="mdi:facebook-messenger" width={36} className="mx-auto text-[#0084FF]" />
                        <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-white">¿Qué página quieres conectar?</p>
                        <div className="mt-4 flex flex-col gap-2 text-left">
                            {paginas.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => void elegir(p)}
                                    disabled={Boolean(eligiendo)}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-sky-400 hover:bg-sky-50/50 disabled:opacity-60 dark:border-slate-700 dark:text-white dark:hover:bg-sky-900/20"
                                >
                                    <span className="truncate">{p.nombre}</span>
                                    <Icon icon={eligiendo === p.id ? 'svg-spinners:180-ring' : 'solar:arrow-right-linear'} width={18} className="shrink-0" />
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <Icon
                            icon={error ? 'solar:danger-triangle-bold' : 'svg-spinners:180-ring'}
                            width={36}
                            className={`mx-auto ${error ? 'text-rose-500' : 'text-[#0084FF]'}`}
                        />
                        <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-white">{error ?? 'Conectando tu página…'}</p>
                        {error && (
                            <button
                                type="button"
                                onClick={() => navigate('/administrador/perfil', { replace: true })}
                                className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white dark:bg-slate-700"
                            >
                                Volver a Perfil
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
