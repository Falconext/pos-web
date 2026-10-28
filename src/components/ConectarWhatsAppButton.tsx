import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

// Meta App (reutilizada de salesfilter). Config por env del frontend.
const FB_APP_ID = import.meta.env.VITE_FB_APP_ID as string | undefined;
const FB_CONFIG_ID = import.meta.env.VITE_FB_CONFIG_ID as string | undefined;
const FB_SDK_VERSION = 'v21.0';

let sdkPromise: Promise<void> | null = null;

/**
 * Mensaje del resultado de conectar. Un número puede quedar guardado y aun así
 * NO estar operativo: Meta lo deja en `PENDING` hasta que se registra en Cloud
 * API. Avisarlo en verde como si todo estuviera listo esconde un número que no
 * recibe un solo mensaje, así que el aviso sigue al estado real.
 */
function avisoConexion(res: any): { texto: string; tipo: 'success' | 'error' } {
    const numero = res?.numeroVisible ?? res?.phoneNumberId ?? 'tu número';
    const creadas = res?.plantillas?.creadas?.length ?? 0;
    const existentes = res?.plantillas?.existentes?.length ?? 0;
    // `conectado` no viaja en respuestas de versiones anteriores del backend:
    // si no viene, no inventamos una falla.
    if (res?.conectado === false) {
        return {
            texto:
                `${numero} quedó guardado pero Meta lo dejó en estado ${res?.estado ?? 'PENDIENTE'}: ` +
                `todavía no puede enviar ni recibir mensajes.` +
                (res?.motivo ? ` Motivo: ${res.motivo}.` : '') +
                ' Vuelve a intentar la conexión o escríbenos para activarlo.',
            tipo: 'error',
        };
    }
    return {
        texto: `WhatsApp conectado (${numero}). Plantillas: ${creadas} creadas, ${existentes} ya existían.`,
        tipo: 'success',
    };
}

/** Carga (una sola vez) el SDK de Facebook e inicializa FB con el appId. */
function cargarFbSdk(appId: string): Promise<void> {
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise<void>((resolve, reject) => {
        const w = window as any;
        (w).fbAsyncInit = function () {
            // fedCM:false es obligatorio para el Embedded Signup: en Chrome el SDK
            // usa FedCM por defecto y la ventana de continuación que abre Facebook
            // pierde el config_id → "Esta app necesita al menos un supported permission".
            w.FB.init({ appId, cookie: true, xfbml: false, version: FB_SDK_VERSION, fedCM: false });
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
    // Qué botón está conectando: el de siempre o el de coexistencia.
    const [loading, setLoading] = useState<false | 'normal' | 'coexistencia'>(false);
    // Datos capturados del evento WA_EMBEDDED_SIGNUP (phone_number_id, waba_id).
    // `coexistencia` lo confirma Meta con su propio evento de fin.
    const wabaInfo = useRef<{ phoneNumberId?: string; wabaId?: string; coexistencia?: boolean }>({});
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
                    // v5 cambió `waba_id` por `messaging_account_ids` y marca con
                    // `is_on_biz_app` cuando el número sigue en la app del celular.
                    const cuentas = data.data?.messaging_account_ids;
                    const wabaV5 = Array.isArray(cuentas) ? cuentas[0] : cuentas;
                    wabaInfo.current = {
                        phoneNumberId: data.data?.phone_number_id,
                        wabaId: data.data?.waba_id ?? (typeof wabaV5 === 'object' ? wabaV5?.id : wabaV5),
                        ...(data.data?.is_on_biz_app === true ? { coexistencia: true } : {}),
                    };
                }
                // Coexistencia: Meta solo devuelve la WABA; el número lo busca el backend.
                if (data?.type === 'WA_EMBEDDED_SIGNUP' && data?.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
                    wabaInfo.current = { wabaId: data.data?.waba_id, coexistencia: true };
                }
            } catch { /* mensaje no-JSON de facebook, ignorar */ }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    /**
     * `coexistencia`: el número sigue funcionando en la app WhatsApp Business
     * del celular y la IA responde por la API al mismo tiempo. Sin eso, el
     * número pasa entero a la API y la app del celular deja de usarlo.
     */
    const conectar = async (coexistencia = false) => {
        if (!FB_APP_ID || !FB_CONFIG_ID) {
            useAlertStore.getState().alert('La conexión de WhatsApp no está configurada (falta la Meta App).', 'error');
            return;
        }
        setLoading(coexistencia ? 'coexistencia' : 'normal');
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
                        // Desde el 15-10-2026 Meta sirve como v4 lo que no pide versión, y
                        // en v4 `featureType` ya no aplica: el botón del celular caía al
                        // registro normal ("este número ya está registrado"). En v5 la
                        // conexión de la app WhatsApp Business viene activada.
                        extras: coexistencia
                            ? { setup: {}, version: 'v5' }
                            : { setup: {}, featureType: '', sessionInfoVersion: '3' },
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
                coexistencia: wabaInfo.current.coexistencia ?? coexistencia,
            });
            const res = data?.data ?? data;
            const aviso = avisoConexion(res);
            useAlertStore.getState().alert(aviso.texto, aviso.tipo);
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
            const aviso = avisoConexion(res);
            useAlertStore.getState().alert(aviso.texto, aviso.tipo);
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
                onClick={() => conectar(false)}
                disabled={!!loading}
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[#25D366]/20 transition hover:brightness-95 disabled:opacity-60"
            >
                <Icon icon={loading === 'normal' ? 'svg-spinners:180-ring' : 'mdi:whatsapp'} width={18} />
                {loading === 'normal' ? 'Conectando…' : numeroConectado ? 'Reconectar mi WhatsApp' : 'Conectar mi WhatsApp'}
            </button>
            <span className="text-[11px] text-gray-400">
                Conecta tu número de WhatsApp Business en unos clics. Los avisos a tus clientes saldrán desde tu propio número.
            </span>

            {/* Coexistencia: el número sigue en la app del celular */}
            <button
                type="button"
                onClick={() => conectar(true)}
                disabled={!!loading}
                className="mt-1 inline-flex w-fit items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] px-4 py-2 text-sm font-black text-[#128C7E] transition hover:bg-[#25D366]/10 disabled:opacity-60 dark:text-[#25D366]"
            >
                <Icon icon={loading === 'coexistencia' ? 'svg-spinners:180-ring' : 'solar:smartphone-bold'} width={18} />
                {loading === 'coexistencia' ? 'Conectando…' : 'Usar el WhatsApp Business de mi celular'}
            </button>
            <span className="text-[11px] text-gray-400">
                Sigues contestando desde tu celular y la IA responde por ti. Cuando tú escribes en un chat, la IA se
                calla ahí por 2 horas. Ten la app WhatsApp Business actualizada y abierta mientras conectas. En la app
                se desactivan las listas de difusión, y WhatsApp para Windows deja de funcionar.
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
