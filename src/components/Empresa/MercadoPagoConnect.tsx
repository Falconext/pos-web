import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

interface EstadoMp {
    configuradoPlataforma: boolean;
    conectado: boolean;
    mpUserId: string | null;
}

/**
 * Tarjeta de conexión de Mercado Pago (OAuth Marketplace).
 * La empresa conecta su propia cuenta MP; los pagos de su tienda caen directo
 * en su cuenta. Al conectar/desconectar se llama a /mercadopago/*.
 */
export default function MercadoPagoConnect() {
    const { alert } = useAlertStore();
    const [estado, setEstado] = useState<EstadoMp | null>(null);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);

    const cargar = async () => {
        try {
            const { data } = await apiClient.get('/mercadopago/estado');
            setEstado(data.data || data);
        } catch {
            setEstado({ configuradoPlataforma: false, conectado: false, mpUserId: null });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
        // Feedback tras el callback de OAuth (?mp=conectado|error)
        const params = new URLSearchParams(window.location.search);
        const mp = params.get('mp');
        if (mp === 'conectado') alert('Mercado Pago conectado correctamente', 'success');
        else if (mp === 'error') alert('No se pudo conectar Mercado Pago. Intenta de nuevo.', 'error');
        if (mp) {
            params.delete('mp');
            const q = params.toString();
            window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const conectar = async () => {
        if (working) return;
        setWorking(true);
        try {
            const { data } = await apiClient.get('/mercadopago/oauth/connect');
            const url = (data.data || data)?.url;
            if (url) window.location.href = url;
            else alert('No se pudo iniciar la conexión', 'error');
        } catch (e: any) {
            alert(e.response?.data?.message || 'No se pudo iniciar la conexión con Mercado Pago', 'error');
            setWorking(false);
        }
    };

    const desconectar = async () => {
        if (working) return;
        setWorking(true);
        try {
            await apiClient.post('/mercadopago/disconnect');
            await cargar();
            alert('Mercado Pago desconectado', 'success');
        } catch {
            alert('No se pudo desconectar', 'error');
        } finally {
            setWorking(false);
        }
    };

    return (
        <div className="mt-6 border border-gray-100 dark:border-slate-800 rounded-xl p-5 bg-gray-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                    <Icon icon="simple-icons:mercadopago" className="text-sky-500" width={18} />
                </div>
                <span className="font-semibold text-gray-800 dark:text-white">Mercado Pago</span>
                {estado?.conectado && (
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectado
                    </span>
                )}
            </div>

            {loading ? (
                <div className="text-sm text-gray-400 flex items-center gap-2"><Icon icon="eos-icons:loading" className="animate-spin" /> Cargando…</div>
            ) : !estado?.configuradoPlataforma ? (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                    <Icon icon="solar:danger-triangle-bold" width={16} className="mt-0.5 shrink-0" />
                    Mercado Pago aún no está habilitado en la plataforma. Contacta al administrador.
                </p>
            ) : estado.conectado ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                        Tu cuenta de Mercado Pago está conectada. Los pagos de tu tienda se acreditan directo en tu cuenta.
                    </p>
                    <button
                        type="button"
                        onClick={desconectar}
                        disabled={working}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/30 disabled:opacity-50"
                    >
                        <Icon icon="solar:link-broken-bold" width={16} /> Desconectar
                    </button>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                        Conecta tu cuenta de Mercado Pago para aceptar pagos con tarjeta, Yape y más en tu tienda. El dinero llega directo a tu cuenta.
                    </p>
                    <button
                        type="button"
                        onClick={conectar}
                        disabled={working}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 transition disabled:opacity-50"
                    >
                        <Icon icon={working ? 'solar:refresh-bold' : 'simple-icons:mercadopago'} className={working ? 'animate-spin' : ''} width={16} />
                        {working ? 'Conectando…' : 'Conectar Mercado Pago'}
                    </button>
                </div>
            )}
        </div>
    );
}
