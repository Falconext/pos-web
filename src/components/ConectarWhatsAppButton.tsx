import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

// Meta App (reutilizada de salesfilter). Config por env del frontend.
const FB_APP_ID = import.meta.env.VITE_FB_APP_ID as string | undefined;
const FB_CONFIG_ID = import.meta.env.VITE_FB_CONFIG_ID as string | undefined;
const FB_SDK_VERSION = 'v21.0';

let sdkPromise: Promise<void> | null = null;

/** Carga (una sola vez) el SDK de Facebook e inicializa FB con el appId. */
function cargarFbSdk(appId: string): Promise<void> {
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise<void>((resolve, reject) => {
        const w = window as any;
        (w).fbAsyncInit = function () {
            w.FB.init({ appId, cookie: true, xfbml: false, version: FB_SDK_VERSION });
            resolve();
        };
        if (document.getElementById('facebook-jssdk')) { if (w.FB) resolve(); return; }
        const s = document.createElement('script');
        s.id = 'facebook-jssdk';
        s.src = 'https://connect.facebook.net/en_US/sdk.js';
        s.async = true;
        s.defer = true;
        s.onerror = () => reject(new Error('No se pudo cargar el SDK de Facebook.'));
        document.body.appendChild(s);
    });
    return sdkPromise;
}

interface Props {
    /** Número ya conectado (display) si existe. */
    numeroConectado?: string | null;
    /** Callback tras conectar con éxito. */
    onConectado?: (data: { phoneNumberId: string; numeroVisible?: string }) => void;
}

export default function ConectarWhatsAppButton({ numeroConectado, onConectado }: Props) {
    const [loading, setLoading] = useState(false);
    // Datos capturados del evento WA_EMBEDDED_SIGNUP (phone_number_id, waba_id).
    const wabaInfo = useRef<{ phoneNumberId?: string; wabaId?: string }>({});
    // Conexión manual (fallback mientras Meta aprueba el Embedded Signup).
    const [showManual, setShowManual] = useState(false);
    const [manual, setManual] = useState({ phoneNumberId: '', wabaId: '', accessToken: '' });
    const [savingManual, setSavingManual] = useState(false);

    // Escucha el evento de Meta con phone_number_id / waba_id.
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (!String(event.origin).endsWith('facebook.com')) return;
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data?.type === 'WA_EMBEDDED_SIGNUP' && data?.event === 'FINISH') {
                    wabaInfo.current = {
                        phoneNumberId: data.data?.phone_number_id,
                        wabaId: data.data?.waba_id,
                    };
                }
            } catch { /* mensaje no-JSON de facebook, ignorar */ }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const conectar = async () => {
        if (!FB_APP_ID || !FB_CONFIG_ID) {
            useAlertStore.getState().alert('La conexión de WhatsApp no está configurada (falta la Meta App).', 'error');
            return;
        }
        setLoading(true);
        wabaInfo.current = {};
        try {
            await cargarFbSdk(FB_APP_ID);
            const w = window as any;
            const authResp: any = await new Promise((resolve) => {
                w.FB.login(
                    (response: any) => resolve(response),
                    {
                        config_id: FB_CONFIG_ID,
                        response_type: 'code',
                        override_default_response_type: true,
                        extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
                    },
                );
            });
            const code = authResp?.authResponse?.code;
            if (!code) {
                setLoading(false);
                useAlertStore.getState().alert('Conexión cancelada.', 'info');
                return;
            }
            const { data } = await apiClient.post('/whatsapp/embedded-signup', {
                code,
                phoneNumberId: wabaInfo.current.phoneNumberId,
                wabaId: wabaInfo.current.wabaId,
            });
            const res = data?.data ?? data;
            const creadas = res?.plantillas?.creadas?.length ?? 0;
            const existentes = res?.plantillas?.existentes?.length ?? 0;
            useAlertStore.getState().alert(
                `WhatsApp conectado (${res?.numeroVisible ?? res?.phoneNumberId}). Plantillas: ${creadas} creadas, ${existentes} ya existían.`,
                'success',
            );
            onConectado?.({ phoneNumberId: res?.phoneNumberId, numeroVisible: res?.numeroVisible });
        } catch (e: any) {
            useAlertStore.getState().alert(
                e?.response?.data?.message || 'No se pudo conectar tu WhatsApp. Reintenta.',
                'error',
            );
        } finally {
            setLoading(false);
        }
    };

    const conectarManual = async () => {
        const { phoneNumberId, wabaId, accessToken } = manual;
        if (!phoneNumberId.trim() || !wabaId.trim() || !accessToken.trim()) {
            useAlertStore.getState().alert('Completa Phone Number ID, WABA ID y token.', 'error');
            return;
        }
        setSavingManual(true);
        try {
            const { data } = await apiClient.post('/whatsapp/conectar-manual', {
                phoneNumberId: phoneNumberId.trim(),
                wabaId: wabaId.trim(),
                accessToken: accessToken.trim(),
            });
            const res = data?.data ?? data;
            const creadas = res?.plantillas?.creadas?.length ?? 0;
            const existentes = res?.plantillas?.existentes?.length ?? 0;
            useAlertStore.getState().alert(
                `WhatsApp conectado (${res?.numeroVisible}). Plantillas: ${creadas} creadas, ${existentes} ya existían.`,
                'success',
            );
            setManual({ phoneNumberId: '', wabaId: '', accessToken: '' });
            setShowManual(false);
            onConectado?.({ phoneNumberId, numeroVisible: res?.numeroVisible });
        } catch (e: any) {
            useAlertStore.getState().alert(
                e?.response?.data?.message || 'No se pudo conectar. Verifica las credenciales.',
                'error',
            );
        } finally {
            setSavingManual(false);
        }
    };

    const mInp = 'w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400';

    return (
        <div className="flex flex-col gap-2">
            {numeroConectado && (
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Icon icon="mdi:whatsapp" width={14} /> Conectado: {numeroConectado}
                </span>
            )}
            <button
                type="button"
                onClick={conectar}
                disabled={loading}
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[#25D366]/20 transition hover:brightness-95 disabled:opacity-60"
            >
                <Icon icon={loading ? 'svg-spinners:180-ring' : 'mdi:whatsapp'} width={18} />
                {loading ? 'Conectando…' : numeroConectado ? 'Reconectar mi WhatsApp' : 'Conectar mi WhatsApp'}
            </button>
            <span className="text-[11px] text-gray-400">
                Conecta tu número de WhatsApp Business en unos clics. Los avisos a tus clientes saldrán desde tu propio número.
            </span>

            {/* Conexión manual (fallback) */}
            <button
                type="button"
                onClick={() => setShowManual((v) => !v)}
                className="mt-1 inline-flex w-fit items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
                <Icon icon={showManual ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} width={12} />
                Conectar manualmente (pegar credenciales de Meta)
            </button>
            {showManual && (
                <div className="mt-1 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Desde tu WhatsApp Manager de Meta. El número debe estar registrado en Cloud API (dedicado, no tu WhatsApp del celular).
                    </p>
                    <input className={mInp} placeholder="Phone Number ID"
                        value={manual.phoneNumberId} onChange={(e) => setManual((m) => ({ ...m, phoneNumberId: e.target.value }))} />
                    <input className={mInp} placeholder="WhatsApp Business Account ID (WABA)"
                        value={manual.wabaId} onChange={(e) => setManual((m) => ({ ...m, wabaId: e.target.value }))} />
                    <input className={mInp} placeholder="Token permanente de Meta" type="password" autoComplete="new-password"
                        value={manual.accessToken} onChange={(e) => setManual((m) => ({ ...m, accessToken: e.target.value }))} />
                    <button type="button" onClick={conectarManual} disabled={savingManual}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-black text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-slate-700">
                        <Icon icon={savingManual ? 'svg-spinners:180-ring' : 'solar:diskette-bold'} width={14} />
                        {savingManual ? 'Conectando…' : 'Guardar conexión manual'}
                    </button>
                </div>
            )}
        </div>
    );
}
