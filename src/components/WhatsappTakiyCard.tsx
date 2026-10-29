import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { get, patch, post } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';

interface TakiyConfig {
    activo: boolean;
    enviarComprobante: boolean;
    /** Solo los últimos 4 caracteres; la llave entera nunca vuelve al panel. */
    appKey: string | null;
    authKeyConfigurada: boolean;
}

const lbl = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

function Switch({ activo, onChange, disabled }: { activo: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!activo)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${activo ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

/**
 * WhatsApp por QR con Takiy (takiy.space): los avisos de despacho, el PDF del
 * comprobante y los avisos al equipo salen desde el número del propio negocio,
 * sin conectar Meta ni esperar plantillas aprobadas.
 */
export default function WhatsappTakiyCard() {
    const { alert } = useAlertStore();
    const [config, setConfig] = useState<TakiyConfig | null>(null);
    const [appKey, setAppKey] = useState('');
    const [authKey, setAuthKey] = useState('');
    const [numeroPrueba, setNumeroPrueba] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [probando, setProbando] = useState(false);

    const cargar = useCallback(async () => {
        const res = await get<TakiyConfig>('/whatsapp/takiy');
        if (res.success && res.data) setConfig(res.data);
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const guardar = async (cambios: Partial<{ activo: boolean; enviarComprobante: boolean }> = {}) => {
        setGuardando(true);
        const res = await patch<TakiyConfig>('/whatsapp/takiy', {
            ...(appKey.trim() ? { appKey: appKey.trim() } : {}),
            ...(authKey.trim() ? { authKey: authKey.trim() } : {}),
            ...cambios,
        });
        setGuardando(false);
        if (!res.success || !res.data) {
            alert(res.error || 'No se pudo guardar Takiy', 'error');
            return;
        }
        setConfig(res.data);
        setAppKey('');
        setAuthKey('');
        alert('WhatsApp por QR guardado', 'success');
    };

    const probar = async () => {
        if (!numeroPrueba.trim()) {
            alert('Escribe el celular al que mandar la prueba', 'warning');
            return;
        }
        setProbando(true);
        const res = await post('/whatsapp/takiy/prueba', {
            numero: numeroPrueba.trim(),
            ...(appKey.trim() ? { appKey: appKey.trim() } : {}),
            ...(authKey.trim() ? { authKey: authKey.trim() } : {}),
        });
        setProbando(false);
        alert(
            res.success ? 'Mensaje de prueba enviado. Revisa ese WhatsApp.' : res.error || 'Takiy no envió el mensaje',
            res.success ? 'success' : 'error',
        );
    };

    if (!config) {
        return <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />;
    }

    const tieneLlaves = !!config.appKey && config.authKeyConfigurada;

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                Los avisos de despacho, el PDF del comprobante y los avisos a tu equipo salen desde <strong>tu propio número</strong>,
                vinculado por QR en <a href="https://takiy.space" target="_blank" rel="noopener noreferrer" className="font-bold underline">takiy.space</a>.
                No necesitas conectar Meta ni esperar plantillas. Si tu celular se desvincula en Takiy, los envíos fallan hasta que vuelvas a escanear el QR.
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <label>
                    <span className={lbl}>App Key</span>
                    <input
                        className={input}
                        value={appKey}
                        onChange={(e) => setAppKey(e.target.value)}
                        placeholder={config.appKey ? `Guardada (${config.appKey}). Vacío = conservar` : 'Pega el App Key de Takiy (My Apps)'}
                        autoComplete="off"
                    />
                </label>
                <label>
                    <span className={lbl}>Auth Key</span>
                    <input
                        className={input}
                        type="password"
                        value={authKey}
                        onChange={(e) => setAuthKey(e.target.value)}
                        placeholder={config.authKeyConfigurada ? 'Guardada. Vacío = conservar' : 'Pega el Auth Key de Takiy'}
                        autoComplete="new-password"
                    />
                </label>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Enviar avisos por Takiy</p>
                        <p className="text-[11px] text-slate-500">Despacho (en camino, en agencia, entregado), pago confirmado y avisos de leads a tu equipo.</p>
                    </div>
                    <Switch
                        activo={config.activo}
                        disabled={guardando || (!tieneLlaves && !(appKey.trim() && authKey.trim()))}
                        onChange={(v) => guardar({ activo: v })}
                    />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Mandar el comprobante al emitir</p>
                        <p className="text-[11px] text-slate-500">El PDF le llega solo al cliente si tiene celular registrado. No aplica a cotizaciones.</p>
                    </div>
                    <Switch
                        activo={config.enviarComprobante}
                        disabled={guardando || !config.activo}
                        onChange={(v) => guardar({ enviarComprobante: v })}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1">
                    <span className={lbl}>Probar con el celular</span>
                    <input
                        className={input}
                        value={numeroPrueba}
                        onChange={(e) => setNumeroPrueba(e.target.value)}
                        placeholder="999 999 999"
                        inputMode="tel"
                    />
                </label>
                <button
                    type="button"
                    onClick={probar}
                    disabled={probando}
                    className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 px-4 text-sm font-bold text-emerald-600 hover:bg-emerald-50 disabled:opacity-60 dark:text-emerald-400 dark:hover:bg-emerald-900/10"
                >
                    <Icon icon={probando ? 'svg-spinners:180-ring' : 'mdi:whatsapp'} className="text-lg" />
                    Enviar prueba
                </button>
                <button
                    type="button"
                    onClick={() => guardar()}
                    disabled={guardando || (!appKey.trim() && !authKey.trim())}
                    className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                    <Icon icon={guardando ? 'svg-spinners:180-ring' : 'solar:diskette-bold'} className="text-lg" />
                    Guardar llaves
                </button>
            </div>
        </div>
    );
}
