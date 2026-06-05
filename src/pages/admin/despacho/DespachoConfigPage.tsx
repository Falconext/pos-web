import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { get, put } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';

interface DespachoConfig {
    mensajeEnCamino: string;
    mensajeEntregado: string;
    notificarEnCamino: boolean;
    notificarEntregado: boolean;
}

const DEFAULTS: DespachoConfig = {
    mensajeEnCamino: 'Hola {{nombre}}, tu pedido {{pedido}} ya está en camino 🚚. Repartidor: {{repartidor}}.',
    mensajeEntregado: 'Hola {{nombre}}, tu pedido {{pedido}} fue entregado exitosamente ✅. ¡Gracias por preferir {{empresa}}!',
    notificarEnCamino: true,
    notificarEntregado: true,
};

const EJEMPLO = { nombre: 'Juan Pérez', pedido: 'B001-00000123', repartidor: 'Carlos Quispe', empresa: 'Mi Empresa' };

function interpolar(template: string) {
    return template
        .replace(/\{\{nombre\}\}/g, EJEMPLO.nombre)
        .replace(/\{\{pedido\}\}/g, EJEMPLO.pedido)
        .replace(/\{\{repartidor\}\}/g, EJEMPLO.repartidor)
        .replace(/\{\{empresa\}\}/g, EJEMPLO.empresa);
}

interface SectionProps {
    title: string;
    icon: string;
    color: string;
    estadoLabel: string;
    habilitado: boolean;
    mensaje: string;
    placeholder: string;
    onToggle: (v: boolean) => void;
    onMensaje: (v: string) => void;
}

function SeccionTemplate({ title, icon, color, estadoLabel, habilitado, mensaje, placeholder, onToggle, onMensaje }: SectionProps) {
    const preview = interpolar(mensaje || placeholder);

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${color}`}>
                        <Icon icon={icon} className="text-xl" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">{title}</p>
                        <p className="text-xs text-slate-500">Se envía cuando el estado cambia a <span className="font-semibold">{estadoLabel}</span></p>
                    </div>
                </div>
                {/* Toggle */}
                <button
                    type="button"
                    onClick={() => onToggle(!habilitado)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${habilitado ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${habilitado ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>

            {habilitado && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Mensaje</label>
                        <textarea
                            value={mensaje}
                            onChange={e => onMensaje(e.target.value)}
                            placeholder={placeholder}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <p className="mt-1.5 text-[11px] text-slate-400">
                            Variables: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{{nombre}}'}</code>{' '}
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{{pedido}}'}</code>{' '}
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{{repartidor}}'}</code>{' '}
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{{empresa}}'}</code>
                        </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 p-3">
                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                            <Icon icon="mdi:whatsapp" />
                            Vista previa
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{preview}</p>
                    </div>
                </div>
            )}

            {!habilitado && (
                <p className="text-sm text-slate-400 italic">Notificación desactivada para este estado.</p>
            )}
        </div>
    );
}

export default function DespachoConfigPage() {
    const navigate = useNavigate();
    const { alert } = useAlertStore();
    const [config, setConfig] = useState<DespachoConfig>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const res = await get<DespachoConfig>('/envio-despacho/config');
            if (res.data) {
                setConfig({
                    mensajeEnCamino: res.data.mensajeEnCamino ?? DEFAULTS.mensajeEnCamino,
                    mensajeEntregado: res.data.mensajeEntregado ?? DEFAULTS.mensajeEntregado,
                    notificarEnCamino: res.data.notificarEnCamino ?? true,
                    notificarEntregado: res.data.notificarEntregado ?? true,
                });
            }
        } catch {
            alert('Error al cargar configuración', 'error');
        } finally {
            setLoading(false);
        }
    }, [alert]);

    useEffect(() => { cargar(); }, [cargar]);

    const guardar = async () => {
        setSaving(true);
        try {
            await put('/envio-despacho/config', config);
            alert('Configuración guardada', 'success');
        } catch {
            alert('Error al guardar configuración', 'error');
        } finally {
            setSaving(false);
        }
    };

    const set = <K extends keyof DespachoConfig>(key: K, value: DespachoConfig[K]) =>
        setConfig(prev => ({ ...prev, [key]: value }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon icon="eos-icons:loading" className="text-4xl text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0A0D14] px-4 pb-8 pt-4">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/administrador/despacho')}
                        className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <Icon icon="solar:arrow-left-bold" />
                    </button>
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                        <Icon icon="mdi:whatsapp" className="text-xl" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white">Notificaciones de Despacho</h1>
                        <p className="text-xs text-slate-500">Mensajes automáticos vía WhatsApp al cliente</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={guardar}
                    disabled={saving}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                    {saving
                        ? <Icon icon="eos-icons:loading" className="text-base" />
                        : <Icon icon="solar:floppy-disk-bold" className="text-base" />
                    }
                    Guardar cambios
                </button>
            </div>

            {/* Info banner */}
            <div className="mb-5 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 flex items-start gap-3">
                <Icon icon="solar:info-circle-bold-duotone" className="text-xl text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    Estas notificaciones se envían automáticamente cuando cambias el estado de un despacho.
                    Requiere tener WhatsApp activo en tu empresa.
                </p>
            </div>

            {/* Secciones */}
            <div className="space-y-4">
                <SeccionTemplate
                    title="Estado: En Camino"
                    icon="solar:delivery-bold-duotone"
                    color="bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                    estadoLabel="EN CAMINO"
                    habilitado={config.notificarEnCamino}
                    mensaje={config.mensajeEnCamino}
                    placeholder={DEFAULTS.mensajeEnCamino}
                    onToggle={v => set('notificarEnCamino', v)}
                    onMensaje={v => set('mensajeEnCamino', v)}
                />
                <SeccionTemplate
                    title="Estado: Entregado"
                    icon="solar:check-circle-bold-duotone"
                    color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
                    estadoLabel="ENTREGADO"
                    habilitado={config.notificarEntregado}
                    mensaje={config.mensajeEntregado}
                    placeholder={DEFAULTS.mensajeEntregado}
                    onToggle={v => set('notificarEntregado', v)}
                    onMensaje={v => set('mensajeEntregado', v)}
                />
            </div>
        </div>
    );
}
