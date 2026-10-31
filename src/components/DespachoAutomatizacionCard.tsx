import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { get, put, patch } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import { BRAND } from '@/lib/branding';
import Select from '@/components/Select';
import {
    type CampoProvincia,
    type ProvinciaActiva,
    MENSAJES_PROVINCIA_DEFAULT,
    VARIABLES_PROVINCIA,
    errorProvincia,
    payloadProvincia,
    provinciaActivaDesde,
} from './despachoMensajes';

interface DespachoConfig {
    mensajeEnCamino: string;
    /** Opcional: "en camino" para provincia (agencia). Vacío = el general. */
    mensajeEnCaminoAgencia: string;
    mensajeEntregado: string;
    /** Opcional: "entregado" para provincia (recogió en agencia). */
    mensajeEntregadoAgencia: string;
    /** Llegó a la agencia. Solo sale tal cual cuando el aviso va por Takiy. */
    mensajeEnAgencia: string;
    notificarEnCamino: boolean;
    notificarEntregado: boolean;
    /** Días máximos de recordatorio de recojo en agencia; 0 = apagado. */
    recordatorioRecojoDias: number;
    /** Formas de pago del aviso "en camino" cuando reparte alguien del equipo. */
    pagoRepartidorPropio: string;
    /** … y cuando reparte un contratado. */
    pagoRepartidorContratado: string;
}

const DEFAULTS: DespachoConfig = {
    mensajeEnCamino: 'Hola {{nombre}}, tu pedido {{pedido}} ya está en camino 🚚. Repartidor: {{repartidor}}.',
    mensajeEnCaminoAgencia: '',
    mensajeEntregado: 'Hola {{nombre}}, tu pedido {{pedido}} fue entregado exitosamente ✅. ¡Gracias por preferir {{empresa}}!',
    mensajeEntregadoAgencia: '',
    mensajeEnAgencia: 'Hola {{nombre}}, tu pedido {{pedido}} ya llegó a {{agencia}} 📦. Ya puedes acercarte a recogerlo.',
    notificarEnCamino: true,
    notificarEntregado: true,
    recordatorioRecojoDias: 0,
    pagoRepartidorPropio: '',
    pagoRepartidorContratado: '',
};

const OPCIONES_RECOJO = [
    { id: '0', value: 'Apagado' },
    ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: String(n), value: n === 1 ? 'Solo 1 día' : `Hasta ${n} días` })),
];

const EJEMPLO: Record<string, string> = {
    nombre: 'Juan Pérez',
    pedido: 'B001-00000123',
    repartidor: 'Carlos Quispe',
    empresa: 'Mi Empresa',
    agencia: 'Shalom Cusco Centro',
    clave: '4821',
    saldo: 'S/ 45.00',
};

const VARIABLES_BASE = ['nombre', 'pedido', 'repartidor', 'empresa'];

function interpolar(template: string) {
    return template.replace(/\{\{(\w+)\}\}/g, (m, clave: string) => EJEMPLO[clave] ?? m);
}

function Switch({ activo, onChange, color = 'emerald', disabled, etiqueta }: { activo: boolean; onChange: (v: boolean) => void; color?: 'emerald' | 'amber'; disabled?: boolean; etiqueta?: string }) {
    const on = color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <button
            type="button"
            role="switch"
            aria-checked={activo}
            aria-label={etiqueta}
            disabled={disabled}
            onClick={() => onChange(!activo)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${activo ? on : 'bg-slate-300 dark:bg-slate-600'}`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

function EditorMensaje({ etiqueta, mensaje, placeholder, onMensaje, bloqueado, variables, maxLength }: {
    etiqueta?: string; mensaje: string; placeholder: string; onMensaje: (v: string) => void;
    bloqueado?: boolean; variables: string[]; maxLength?: number;
}) {
    return (
        <div className="space-y-2.5">
            {etiqueta && <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{etiqueta}</p>}
            <textarea
                value={mensaje}
                onChange={e => onMensaje(e.target.value)}
                placeholder={placeholder}
                aria-label={etiqueta}
                maxLength={maxLength}
                rows={3}
                disabled={bloqueado}
                className={`w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${bloqueado ? 'cursor-not-allowed opacity-60' : ''}`}
            />
            <p className="text-[11px] text-slate-400">
                Variables:{' '}
                {variables.map((v) => (
                    <code key={v} className="mr-1 rounded bg-slate-100 px-1 dark:bg-slate-800">{`{{${v}}}`}</code>
                ))}
            </p>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-900/20">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Icon icon="mdi:whatsapp" /> Vista previa
                </p>
                <p className="whitespace-pre-line text-xs text-slate-700 dark:text-slate-300">{interpolar(mensaje || placeholder)}</p>
            </div>
        </div>
    );
}

/** Variante opcional del aviso para envíos a provincia (agencia Shalom/Olva). */
interface VarianteProvincia {
    activa: boolean;
    onActiva: (v: boolean) => void;
    mensaje: string;
    onMensaje: (v: string) => void;
    placeholder: string;
    variables: string[];
}

function Plantilla({ title, icon, color, estadoLabel, habilitado, mensaje, placeholder, onToggle, onMensaje, bloqueado, variables = VARIABLES_BASE, provincia, nota }: {
    title: string; icon: string; color: string; estadoLabel: string; habilitado: boolean;
    mensaje: string; placeholder: string; onToggle?: (v: boolean) => void; onMensaje: (v: string) => void;
    bloqueado?: boolean; variables?: string[]; provincia?: VarianteProvincia; nota?: ReactNode;
}) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                        <Icon icon={icon} className="text-lg" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                        <p className="text-[11px] text-slate-500">Se envía al pasar a <span className="font-semibold">{estadoLabel}</span></p>
                    </div>
                </div>
                {onToggle && <Switch activo={habilitado} onChange={onToggle} disabled={bloqueado} etiqueta={`Avisar: ${title}`} />}
            </div>

            {habilitado ? (
                <div className="space-y-3">
                    <EditorMensaje
                        etiqueta={provincia?.activa ? 'A domicilio (motorizado o courier)' : undefined}
                        mensaje={mensaje}
                        placeholder={placeholder}
                        onMensaje={onMensaje}
                        bloqueado={bloqueado}
                        variables={variables}
                    />
                    {nota && <p className="text-[11px] leading-4 text-slate-500">{nota}</p>}
                    {provincia && (
                        <div className="space-y-3 border-t border-dashed border-slate-200 pt-3 dark:border-slate-700">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Mensaje distinto cuando recoge en agencia</p>
                                    <p className="text-[11px] text-slate-500">Envíos marcados «Para agencia» (Shalom, Olva, Marvisur…). Apagado: se manda el mismo texto.</p>
                                </div>
                                <Switch
                                    activo={provincia.activa}
                                    onChange={provincia.onActiva}
                                    disabled={bloqueado}
                                    etiqueta={`Mensaje para recojo en agencia: ${title}`}
                                />
                            </div>
                            {provincia.activa && (
                                <EditorMensaje
                                    etiqueta="Recojo en agencia"
                                    mensaje={provincia.mensaje}
                                    placeholder={provincia.placeholder}
                                    onMensaje={provincia.onMensaje}
                                    bloqueado={bloqueado}
                                    variables={provincia.variables}
                                    maxLength={1000}
                                />
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm italic text-slate-400">Notificación desactivada para este estado.</p>
            )}
        </div>
    );
}

/**
 * Automatización de despacho dentro de Perfil → Configuración: rastreo automático
 * Shalom (interruptor maestro) + plantillas de WhatsApp por estado. Reemplaza a la
 * antigua página `/administrador/despacho/config`, a la que no se llegaba desde el menú.
 */
export default function DespachoAutomatizacionCard({ className, sinTitulo }: { className?: string; sinTitulo?: boolean }) {
    const { alert } = useAlertStore();
    const [config, setConfig] = useState<DespachoConfig>(DEFAULTS);
    const [autoTracking, setAutoTracking] = useState(false);
    // El plan habilita editar esta configuración (solo Corporativo). Lo decide el
    // backend, que además rechaza los cambios: acá solo se refleja.
    const [habilitado, setHabilitado] = useState(true);
    // Con Takiy los textos por estado se editan sin el plan (el resto no).
    const [mensajesEditables, setMensajesEditables] = useState(true);
    // Qué avisos tienen un texto aparte para provincia (agencia).
    const [provincia, setProvincia] = useState<ProvinciaActiva>(() => provinciaActivaDesde({}));
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            const res = await get<DespachoConfig & { shalomAutoTrackingActivo?: boolean; habilitadoPorPlan?: boolean; mensajesEditables?: boolean }>('/envio-despacho/config');
            if (res.data) {
                setConfig({
                    mensajeEnCamino: res.data.mensajeEnCamino ?? DEFAULTS.mensajeEnCamino,
                    mensajeEnCaminoAgencia: res.data.mensajeEnCaminoAgencia ?? '',
                    mensajeEntregado: res.data.mensajeEntregado ?? DEFAULTS.mensajeEntregado,
                    mensajeEntregadoAgencia: res.data.mensajeEntregadoAgencia ?? '',
                    mensajeEnAgencia: res.data.mensajeEnAgencia ?? DEFAULTS.mensajeEnAgencia,
                    notificarEnCamino: res.data.notificarEnCamino ?? true,
                    notificarEntregado: res.data.notificarEntregado ?? true,
                    recordatorioRecojoDias: res.data.recordatorioRecojoDias ?? 0,
                    pagoRepartidorPropio: res.data.pagoRepartidorPropio ?? '',
                    pagoRepartidorContratado: res.data.pagoRepartidorContratado ?? '',
                });
                setProvincia(provinciaActivaDesde(res.data));
                setAutoTracking(res.data.shalomAutoTrackingActivo ?? false);
                setHabilitado(res.data.habilitadoPorPlan ?? false);
                setMensajesEditables(res.data.mensajesEditables ?? res.data.habilitadoPorPlan ?? false);
            }
        } catch {
            alert('Error al cargar la configuración de despacho', 'error');
        } finally {
            setCargando(false);
        }
    }, [alert]);

    useEffect(() => { cargar(); }, [cargar]);

    // El rastreo automático se guarda al instante (no espera al botón "Guardar"),
    // porque activa un comportamiento con efectos hacia el cliente (WhatsApp).
    const toggleAutoTracking = async (activo: boolean) => {
        setAutoTracking(activo); // optimista
        try {
            await patch('/envio-despacho/auto-tracking', { activo });
            alert(
                activo
                    ? 'Rastreo automático Shalom ACTIVADO: los estados se actualizarán solos. Si tienes plantillas de WhatsApp contratadas, también se avisará a tus clientes.'
                    : 'Rastreo automático Shalom desactivado.',
                activo ? 'warning' : 'success',
            );
        } catch {
            setAutoTracking(!activo); // revertir
            alert('No se pudo cambiar el rastreo automático', 'error');
        }
    };

    const guardar = async () => {
        // Con el aviso apagado su cuadro no se ve: no se puede exigir que lo llenen.
        const error = errorProvincia(config, {
            mensajeEnCaminoAgencia: provincia.mensajeEnCaminoAgencia && config.notificarEnCamino,
            mensajeEntregadoAgencia: provincia.mensajeEntregadoAgencia && config.notificarEntregado,
        });
        if (error) {
            alert(error, 'warning');
            return;
        }
        setGuardando(true);
        try {
            const res = await put<{ plantillas?: { errores?: string[] } }>('/envio-despacho/config', {
                ...config,
                ...payloadProvincia(config, provincia),
            });
            const errores = res?.data?.plantillas?.errores ?? [];
            alert(
                errores.length
                    ? `Guardado, pero WhatsApp no aceptó las plantillas del recordatorio: ${errores[0]}`
                    : 'Configuración de despacho guardada',
                errores.length ? 'warning' : 'success',
            );
        } catch {
            alert('Error al guardar la configuración', 'error');
        } finally {
            setGuardando(false);
        }
    };

    const set = <K extends keyof DespachoConfig>(key: K, value: DespachoConfig[K]) =>
        setConfig(prev => ({ ...prev, [key]: value }));

    // Al prenderla por primera vez arranca con un texto de ejemplo editable.
    const varianteProvincia = (campo: CampoProvincia): VarianteProvincia => ({
        activa: provincia[campo],
        onActiva: (v) => {
            setProvincia(prev => ({ ...prev, [campo]: v }));
            if (v) setConfig(prev => (prev[campo].trim() ? prev : { ...prev, [campo]: MENSAJES_PROVINCIA_DEFAULT[campo] }));
        },
        mensaje: config[campo],
        onMensaje: (v) => set(campo, v),
        placeholder: MENSAJES_PROVINCIA_DEFAULT[campo],
        variables: VARIABLES_PROVINCIA[campo],
    });

    return (
        <div className={`lg:order-2 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111827] ${className ?? ''}`}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                {sinTitulo ? <div /> : (
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-900/30">
                        <Icon icon="solar:delivery-bold-duotone" width="20" />
                    </div>
                    Automatización de despacho
                </h2>
                )}
                <button
                    type="button"
                    onClick={guardar}
                    disabled={guardando || cargando || !mensajesEditables}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                >
                    <Icon icon={guardando ? 'eos-icons:loading' : 'solar:floppy-disk-bold'} className="text-base" />
                    Guardar cambios
                </button>
            </div>

            {cargando ? (
                <div className="flex h-32 items-center justify-center">
                    <Icon icon="eos-icons:loading" className="text-3xl text-indigo-500" />
                </div>
            ) : (
                <div className="space-y-4">
                    {!habilitado && (
                        <div className="flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-900/40 dark:bg-violet-900/15">
                            <Icon icon="solar:lock-keyhole-bold-duotone" className="mt-0.5 shrink-0 text-lg text-violet-500" />
                            <p className="text-xs leading-5 text-violet-800 dark:text-violet-200">
                                <b>Solo en el plan Corporativo.</b> Puedes ver cómo funciona, pero para activar el
                                rastreo automático y editar las plantillas necesitas actualizar tu plan.
                                {mensajesEditables && ' Como envías por WhatsApp por QR (Takiy), sí puedes escribir tus mensajes por estado.'}
                            </p>
                        </div>
                    )}

                    {/* Interruptor maestro: rastreo automático Shalom */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800/40 dark:bg-amber-900/15">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40">
                                    <Icon icon="solar:routing-2-bold-duotone" className="text-xl" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-bold text-slate-900 dark:text-white">Rastreo automático Shalom</p>
                                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Plan Corporativo</span>
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                                        Cada 30 min consulta Shalom y <b>actualiza solo</b> el estado de tus despachos
                                        en tu panel (En camino / En agencia / Entregado). Por sí solo <b>no le envía
                                        nada a tus clientes</b>.
                                        <br />
                                        Si además tienes contratadas las plantillas de WhatsApp, cada cambio de estado
                                        le avisa al cliente automáticamente — actívalo cuando estés listo para eso.
                                    </p>
                                </div>
                            </div>
                            <Switch activo={autoTracking} onChange={toggleAutoTracking} color="amber" disabled={!habilitado} />
                        </div>
                        {!autoTracking && (
                            <p className="mt-3 text-xs italic text-slate-500">
                                Desactivado: los estados no se actualizan solos. Puedes seguir cambiándolos a mano
                                en el panel.
                            </p>
                        )}
                    </div>

                    {/* Plantillas de WhatsApp — se contratan aparte */}
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Avisos por WhatsApp al cliente</p>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Plan aparte</span>
                        </div>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Si envías por <strong>WhatsApp por QR (Takiy)</strong>, estos textos salen tal cual desde tu número.
                                Con la API de Meta sale la plantilla aprobada.
                            </p>
                            <a
                                href={`${BRAND.website}/#ventas-ia`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                            >
                                <Icon icon="mdi:whatsapp" className="text-sm" />
                                Ver planes
                                <Icon icon="solar:arrow-right-up-linear" className="text-sm" />
                            </a>
                        </div>
                        <div className="space-y-3">
                            <Plantilla
                                title="Estado: En Camino"
                                icon="solar:delivery-bold-duotone"
                                color="bg-blue-50 text-blue-600 dark:bg-blue-900/30"
                                estadoLabel="EN CAMINO"
                                habilitado={config.notificarEnCamino}
                                mensaje={config.mensajeEnCamino}
                                placeholder={DEFAULTS.mensajeEnCamino}
                                onToggle={v => set('notificarEnCamino', v)}
                                onMensaje={v => set('mensajeEnCamino', v)}
                                bloqueado={!mensajesEditables}
                                provincia={varianteProvincia('mensajeEnCaminoAgencia')}
                            />
                            <Plantilla
                                title="Estado: Llegó a la agencia"
                                icon="solar:box-bold-duotone"
                                color="bg-amber-50 text-amber-600 dark:bg-amber-900/30"
                                estadoLabel="EN AGENCIA (Shalom/Olva)"
                                habilitado
                                mensaje={config.mensajeEnAgencia}
                                placeholder={DEFAULTS.mensajeEnAgencia}
                                onMensaje={v => set('mensajeEnAgencia', v)}
                                variables={['nombre', 'pedido', 'agencia', 'clave', 'saldo', 'empresa']}
                                bloqueado={!mensajesEditables}
                                nota={<>Si no usas <code>{'{{clave}}'}</code> o <code>{'{{saldo}}'}</code>, los agregamos al final para que el cliente no llegue a la agencia sin ellos.</>}
                            />
                            <Plantilla
                                title="Estado: Entregado"
                                icon="solar:check-circle-bold-duotone"
                                color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30"
                                estadoLabel="ENTREGADO"
                                habilitado={config.notificarEntregado}
                                mensaje={config.mensajeEntregado}
                                placeholder={DEFAULTS.mensajeEntregado}
                                onToggle={v => set('notificarEntregado', v)}
                                onMensaje={v => set('mensajeEntregado', v)}
                                bloqueado={!mensajesEditables}
                                provincia={varianteProvincia('mensajeEntregadoAgencia')}
                            />
                            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-900/30">
                                        <Icon icon="solar:wallet-money-bold-duotone" className="text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Cómo pagar al repartidor</p>
                                        <p className="mt-0.5 max-w-md text-[11px] leading-4 text-slate-500">
                                            Si el pedido tiene saldo por cobrar, el aviso de "En camino" le dice al cliente cuánto pagar
                                            y cómo, según quién lo lleva. Déjalo vacío si no quieres que lo diga.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    {([
                                        ['pagoRepartidorPropio', 'Repartidor de tu equipo (planilla)', 'efectivo, Yape 955 947 892, transferencia o ZIPAGO desde tu banca móvil'],
                                        ['pagoRepartidorContratado', 'Repartidor contratado (eventual)', 'Yape 955 947 892, transferencia o ZIPAGO a nombre del negocio. No en efectivo ni al Yape del repartidor'],
                                    ] as const).map(([campo, titulo, ejemplo]) => (
                                        <label key={campo} className="block">
                                            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{titulo}</span>
                                            <textarea
                                                value={config[campo]}
                                                onChange={(e) => set(campo, e.target.value.slice(0, 300))}
                                                placeholder={`Ej.: ${ejemplo}`}
                                                rows={3}
                                                disabled={!habilitado}
                                                className={`w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white ${!habilitado ? 'cursor-not-allowed opacity-60' : ''}`}
                                            />
                                        </label>
                                    ))}
                                </div>
                                {(config.pagoRepartidorPropio || config.pagoRepartidorContratado) && (
                                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-900/20">
                                        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            <Icon icon="mdi:whatsapp" /> Vista previa
                                        </p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300">
                                            Hola {EJEMPLO.nombre}, tu pedido {EJEMPLO.pedido} ya está en camino con {EJEMPLO.repartidor} (cel. 955 111 222).
                                            Monto a pagar al recibir: S/ 71.00. Formas de pago:{' '}
                                            {(config.pagoRepartidorPropio || config.pagoRepartidorContratado).replace(/\s+/g, ' ').trim()}. ¡Pronto llega!
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30">
                                            <Icon icon="solar:alarm-bold-duotone" className="text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Recordatorio de recojo en agencia</p>
                                            <p className="mt-0.5 max-w-md text-[11px] leading-4 text-slate-500">
                                                Si el paquete sigue en la agencia de Shalom u Olva, le recuerda al cliente una vez al
                                                día que lo recoja (y el saldo, si falta pagar). Se corta cuando lo recoge o cuando te
                                                responde. Cada recordatorio lo cobra WhatsApp a tu cuenta de Meta.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-44">
                                        <Select
                                            key={config.recordatorioRecojoDias}
                                            name="recordatorioRecojoDias"
                                            label=""
                                            error=""
                                            value={OPCIONES_RECOJO.find((o) => o.id === String(config.recordatorioRecojoDias))?.value ?? 'Apagado'}
                                            options={OPCIONES_RECOJO}
                                            disabled={!habilitado}
                                            onChange={(id: string) => set('recordatorioRecojoDias', Number(id) || 0)}
                                        />
                                    </div>
                                </div>
                                {config.recordatorioRecojoDias > 0 && (
                                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-900/20">
                                        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            <Icon icon="mdi:whatsapp" /> Vista previa
                                        </p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300">
                                            Hola {EJEMPLO.nombre}, tu pedido {EJEMPLO.pedido} sigue esperándote en la agencia Shalom Pichanaki. Para
                                            retirarlo falta el pago de S/ 25.00. Respóndenos por aquí y lo coordinamos.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Crear guías Shalom Pro — solo plan Corporativo */}
                    <div className="rounded-xl border border-red-100 bg-red-50/40 p-4 dark:border-red-900/30 dark:bg-red-900/10">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white">Crear guías en Shalom Pro</p>
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Plan Corporativo</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                            Genera la guía de cada pedido desde el panel, sin entrar a Shalom: el N° de orden y la clave
                            se guardan solos en el despacho.
                            {habilitado
                                ? ' Conecta tu cuenta en la tarjeta de arriba.'
                                : ' Disponible al pasar al plan Corporativo.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
