import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

interface Empresa {
    id: number;
    ruc?: string;
    razonSocial?: string;
    nombreComercial?: string;
    plan?: { nombre: string };
    fechaExpiracion?: string;
    estado?: string;
    brand?: string;
}

interface Nota {
    id: number;
    contenido: string;
    autorNombre: string;
    autorEmail: string;
    notificado: boolean;
    creadoEn: string;
}

interface LogEntry {
    id: number;
    accion: string;
    detalle?: string;
    autorNombre: string;
    autorEmail: string;
    creadoEn: string;
}

const LOG_ICONS: Record<string, { icon: string; color: string; label: string }> = {
    CREADA: { icon: 'solar:add-circle-bold-duotone', color: '#10B981', label: 'Empresa creada' },
    ACTIVADA: { icon: 'solar:check-circle-bold-duotone', color: '#10B981', label: 'Activada' },
    DESACTIVADA: { icon: 'solar:close-circle-bold-duotone', color: '#EF4444', label: 'Desactivada' },
    EDITADA: { icon: 'solar:pen-bold-duotone', color: '#6366F1', label: 'Editada' },
    PLAN_CAMBIADO: { icon: 'solar:star-bold-duotone', color: '#F59E0B', label: 'Plan cambiado' },
};

const DAY_MS = 86400000;

const normalizeDateOnly = (value?: string | null): string => {
    if (!value) return '';
    const iso = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

const getDaysUntilDate = (value?: string | null): number | null => {
    const iso = normalizeDateOnly(value);
    if (!iso) return null;
    const [year, month, day] = iso.split('-').map(Number);
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const targetUtc = Date.UTC(year, month - 1, day);
    return Math.ceil((targetUtc - todayUtc) / DAY_MS);
};

const relativeTime = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`;
    return new Date(dateStr).toLocaleDateString('es-PE');
};

export default function EmpresaDrawer({
    empresa,
    onClose,
}: {
    empresa: Empresa | null;
    onClose: () => void;
}) {
    const { alert } = useAlertStore();
    const [tab, setTab] = useState<'notas' | 'historial' | 'comunicar'>('notas');
    const [notas, setNotas] = useState<Nota[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loadingNotas, setLoadingNotas] = useState(false);
    const [loadingLog, setLoadingLog] = useState(false);
    const [nuevaNota, setNuevaNota] = useState('');
    const [notificar, setNotificar] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [emailTipo, setEmailTipo] = useState<'BIENVENIDA' | 'AGRADECIMIENTO' | 'RECORDATORIO' | 'PROMOCION' | null>(null);
    const [emailMensaje, setEmailMensaje] = useState('');
    const [emailTituloPromo, setEmailTituloPromo] = useState('');
    const [enviandoEmail, setEnviandoEmail] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!empresa) return;
        cargarNotas();
        cargarLog();
    }, [empresa?.id]);

    const cargarNotas = async () => {
        if (!empresa) return;
        setLoadingNotas(true);
        try {
            const { data } = await apiClient.get(`/empresa/${empresa.id}/notas`);
            setNotas((data?.data ?? data) || []);
        } catch { } finally { setLoadingNotas(false); }
    };

    const cargarLog = async () => {
        if (!empresa) return;
        setLoadingLog(true);
        try {
            const { data } = await apiClient.get(`/empresa/${empresa.id}/log`);
            setLogs((data?.data ?? data) || []);
        } catch { } finally { setLoadingLog(false); }
    };

    const guardarNota = async () => {
        if (!nuevaNota.trim() || !empresa) return;
        setGuardando(true);
        try {
            await apiClient.post(`/empresa/${empresa.id}/notas`, { contenido: nuevaNota.trim(), notificar });
            setNuevaNota('');
            setNotificar(false);
            await cargarNotas();
            alert(notificar ? 'Nota guardada y cliente notificado' : 'Nota guardada', 'success');
        } catch { alert('Error al guardar', 'error'); }
        finally { setGuardando(false); }
    };

    const eliminarNota = async (notaId: number) => {
        if (!empresa || !confirm('¿Eliminar esta nota?')) return;
        try {
            await apiClient.delete(`/empresa/${empresa.id}/notas/${notaId}`);
            setNotas((prev) => prev.filter((n) => n.id !== notaId));
        } catch { alert('Error al eliminar', 'error'); }
    };

    const enviarEmail = async () => {
        if (!emailTipo || !empresa) return;
        if (emailTipo === 'PROMOCION' && !emailMensaje.trim()) {
            alert('Escribe el mensaje de la promoción', 'error');
            return;
        }
        setEnviandoEmail(true);
        try {
            await apiClient.post(`/empresa/${empresa.id}/enviar-email`, {
                tipo: emailTipo,
                mensajeCustom: emailMensaje.trim() || undefined,
                tituloPromo: emailTituloPromo.trim() || undefined,
            });
            alert('Email enviado correctamente', 'success');
            setEmailMensaje('');
            setEmailTituloPromo('');
            setEmailTipo(null);
        } catch { alert('Error al enviar el email', 'error'); }
        finally { setEnviandoEmail(false); }
    };

    const diasRestantes = getDaysUntilDate(empresa?.fechaExpiracion);

    const expColor = diasRestantes === null ? '' :
        diasRestantes <= 0 ? 'text-red-600' :
        diasRestantes <= 7 ? 'text-red-500' :
        diasRestantes <= 30 ? 'text-amber-600' : 'text-emerald-600';

    if (!empresa) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-white dark:bg-[#0F1219] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${empresa.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                                {empresa.nombreComercial || empresa.razonSocial}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                            <span className="font-mono">{empresa.ruc}</span>
                            {empresa.plan?.nombre && (
                                <span className="px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 font-semibold">
                                    {empresa.plan.nombre}
                                </span>
                            )}
                            {diasRestantes !== null && (
                                <span className={`font-semibold ${expColor}`}>
                                    {diasRestantes <= 0 ? 'Vencido' : `Vence en ${diasRestantes}d`}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 ml-2 flex-shrink-0"
                    >
                        <Icon icon="solar:close-bold" width={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-4 pt-3 pb-0 flex-shrink-0">
                    {([
                        { key: 'notas', label: 'Notas', icon: 'solar:notes-bold-duotone', count: notas.length },
                        { key: 'comunicar', label: 'Email', icon: 'solar:letter-bold-duotone', count: 0 },
                        { key: 'historial', label: 'Historial', icon: 'solar:clock-circle-bold-duotone', count: logs.length },
                    ] as const).map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t.key
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Icon icon={t.icon} width={14} />
                            {t.label}
                            {t.count > 0 && (
                                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {tab === 'notas' && (
                        <div className="flex flex-col h-full">
                            {/* Add nota */}
                            <div className="px-4 pt-3 pb-2 border-b border-gray-50 dark:border-slate-800/60">
                                <textarea
                                    ref={textareaRef}
                                    value={nuevaNota}
                                    onChange={(e) => setNuevaNota(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) guardarNota();
                                    }}
                                    placeholder="Escribe una nota interna... (⌘ + Enter para guardar)"
                                    rows={3}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 placeholder:text-gray-400 transition-all"
                                />
                                <div className="flex items-center justify-between mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setNotificar((v) => !v)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                            notificar
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                                                : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-blue-300'
                                        }`}
                                    >
                                        <Icon icon={notificar ? 'solar:bell-bold-duotone' : 'solar:bell-linear'} width={14} />
                                        {notificar ? 'Notificar (WSP + Email)' : 'Solo nota interna'}
                                    </button>
                                    <button
                                        onClick={guardarNota}
                                        disabled={!nuevaNota.trim() || guardando}
                                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
                                    >
                                        {guardando && <Icon icon="eos-icons:loading" width={13} />}
                                        <Icon icon="solar:notes-bold" width={13} />
                                        Guardar nota
                                    </button>
                                </div>
                            </div>

                            {/* Lista notas */}
                            <div className="flex-1 px-4 py-3 space-y-3">
                                {loadingNotas ? (
                                    <div className="flex justify-center pt-8">
                                        <Icon icon="eos-icons:loading" className="w-6 h-6 text-violet-500" />
                                    </div>
                                ) : notas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <Icon icon="solar:notes-bold-duotone" width={40} className="opacity-30 mb-2" />
                                        <p className="text-sm font-medium">Sin notas aún</p>
                                        <p className="text-xs mt-1 text-center">Agrega recordatorios, pendientes o acuerdos con el cliente</p>
                                    </div>
                                ) : notas.map((nota) => (
                                    <div key={nota.id} className="group relative bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl p-3.5">
                                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{nota.contenido}</p>
                                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-amber-100 dark:border-amber-800/20">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                                                    <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300">
                                                        {nota.autorNombre.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{nota.autorNombre}</span>
                                                <span className="text-[11px] text-gray-400">·</span>
                                                <span className="text-[11px] text-gray-400">{relativeTime(nota.creadoEn)}</span>
                                                {nota.notificado && (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                                                        <Icon icon="solar:bell-bold" width={10} />
                                                        Notificado
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => eliminarNota(nota.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all"
                                            >
                                                <Icon icon="solar:trash-bin-trash-bold" width={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'comunicar' && (
                        <div className="px-4 py-4 flex flex-col gap-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Selecciona una plantilla para enviar un email profesional al administrador de esta empresa.</p>

                            {/* Template cards */}
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { tipo: 'BIENVENIDA', label: 'Bienvenida', icon: '🎉', color: 'emerald', desc: 'Cuenta activada y lista' },
                                    { tipo: 'AGRADECIMIENTO', label: 'Agradecimiento', icon: '🙌', color: 'violet', desc: 'Gracias por pago puntual' },
                                    { tipo: 'RECORDATORIO', label: 'Recordatorio', icon: '⏰', color: 'amber', desc: 'Suscripción por vencer' },
                                    { tipo: 'PROMOCION', label: 'Promoción', icon: '🎁', color: 'pink', desc: 'Oferta o novedad especial' },
                                ] as const).map((t) => {
                                    const selected = emailTipo === t.tipo;
                                    const colors: Record<string, string> = {
                                        emerald: selected ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-300/50' : 'border-gray-200 dark:border-slate-700 hover:border-emerald-300',
                                        violet: selected ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-300/50' : 'border-gray-200 dark:border-slate-700 hover:border-violet-300',
                                        amber: selected ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-300/50' : 'border-gray-200 dark:border-slate-700 hover:border-amber-300',
                                        pink: selected ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20 ring-2 ring-pink-300/50' : 'border-gray-200 dark:border-slate-700 hover:border-pink-300',
                                    };
                                    return (
                                        <button
                                            key={t.tipo}
                                            onClick={() => { setEmailTipo(t.tipo); setEmailMensaje(''); setEmailTituloPromo(''); }}
                                            className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${colors[t.color]}`}
                                        >
                                            <span className="text-2xl mb-1.5">{t.icon}</span>
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{t.label}</span>
                                            <span className="text-[11px] text-gray-400 mt-0.5 leading-tight">{t.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Dynamic fields */}
                            {emailTipo && (
                                <div className="flex flex-col gap-3">
                                    {emailTipo === 'PROMOCION' && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Título de la promoción *</label>
                                            <input
                                                type="text"
                                                value={emailTituloPromo}
                                                onChange={(e) => setEmailTituloPromo(e.target.value)}
                                                placeholder="Ej: 50% de descuento en renovación"
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 transition-all"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                                            {emailTipo === 'PROMOCION' ? 'Descripción de la oferta *' : 'Mensaje adicional (opcional)'}
                                        </label>
                                        <textarea
                                            value={emailMensaje}
                                            onChange={(e) => setEmailMensaje(e.target.value)}
                                            rows={4}
                                            placeholder={
                                                emailTipo === 'BIENVENIDA' ? 'Ej: Recuerda que puedes contactarnos en cualquier momento...' :
                                                emailTipo === 'AGRADECIMIENTO' ? 'Ej: Además queremos informarte que hemos lanzado...' :
                                                emailTipo === 'RECORDATORIO' ? 'Ej: Puedes realizar tu pago mediante transferencia a...' :
                                                'Describe la oferta o promoción especial...'
                                            }
                                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 placeholder:text-gray-400 transition-all"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/30">
                                        <Icon icon="solar:info-circle-bold-duotone" className="text-blue-500 flex-shrink-0" width={16} />
                                        <p className="text-xs text-blue-700 dark:text-blue-400">
                                            El email se enviará al administrador de <strong>{empresa.nombreComercial || empresa.razonSocial}</strong> con diseño profesional.
                                        </p>
                                    </div>

                                    <button
                                        onClick={enviarEmail}
                                        disabled={enviandoEmail || (emailTipo === 'PROMOCION' && !emailMensaje.trim())}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
                                    >
                                        {enviandoEmail
                                            ? <><Icon icon="eos-icons:loading" width={16} /> Enviando...</>
                                            : <><Icon icon="solar:letter-bold" width={16} /> Enviar email</>
                                        }
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'historial' && (
                        <div className="px-4 py-4">
                            {loadingLog ? (
                                <div className="flex justify-center pt-8">
                                    <Icon icon="eos-icons:loading" className="w-6 h-6 text-violet-500" />
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Icon icon="solar:clock-circle-bold-duotone" width={40} className="opacity-30 mb-2" />
                                    <p className="text-sm font-medium">Sin historial aún</p>
                                    <p className="text-xs mt-1">Los cambios aparecerán aquí automáticamente</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-slate-800" />
                                    <div className="space-y-4">
                                        {logs.map((log) => {
                                            const info = LOG_ICONS[log.accion] ?? { icon: 'solar:info-circle-bold-duotone', color: '#6B7280', label: log.accion };
                                            return (
                                                <div key={log.id} className="flex gap-3 relative">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 z-10" style={{ backgroundColor: info.color + '15' }}>
                                                        <Icon icon={info.icon} width={18} style={{ color: info.color }} />
                                                    </div>
                                                    <div className="flex-1 pt-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-semibold text-gray-800 dark:text-white">{info.label}</span>
                                                            <span className="text-[11px] text-gray-400">{relativeTime(log.creadoEn)}</span>
                                                        </div>
                                                        {log.detalle && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{log.detalle}</p>
                                                        )}
                                                        <p className="text-[11px] text-gray-400 mt-0.5">por {log.autorNombre}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
