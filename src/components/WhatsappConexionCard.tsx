import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { del, get, patch, post } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import { suscribirWhatsappConexion } from '@/zustand/notificaciones';
import {
    type ConexionWhatsapp,
    type EstadoConexion,
    type EventoConexionWhatsapp,
    type QrWhatsapp,
    formatearCodigoEmparejamiento,
    formatearFechaConexion,
    formatearNumeroWhatsapp,
    normalizarCelularPe,
    segundosRefrescoQr,
    usoDiario,
} from './whatsappConexion';

const lbl = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const btnPrimario = 'inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60';
const btnSecundario = 'inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 px-4 text-sm font-bold text-emerald-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60 dark:text-emerald-400 dark:hover:bg-emerald-900/10';
const btnLink = 'text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded dark:text-emerald-400';

const ESTADO_UI: Record<EstadoConexion, { texto: string; clase: string }> = {
    NO_CONECTADO: { texto: 'Sin conectar', clase: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
    CONECTANDO: { texto: 'Esperando escaneo', clase: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    CONECTADO: { texto: 'Conectado', clase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    DESCONECTADO: { texto: 'Desconectado', clase: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const ESTADOS: readonly EstadoConexion[] = ['NO_CONECTADO', 'CONECTANDO', 'CONECTADO', 'DESCONECTADO'];
const esEvento = (p: unknown): p is EventoConexionWhatsapp =>
    !!p && typeof p === 'object' && ESTADOS.includes((p as EventoConexionWhatsapp).estado);

type Accion = 'conectar' | 'qr' | 'probar' | 'desconectar' | 'guardar' | null;

function Switch({ activo, onChange, disabled, etiqueta }: { activo: boolean; onChange: (v: boolean) => void; disabled?: boolean; etiqueta: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={activo}
            aria-label={etiqueta}
            disabled={disabled}
            onClick={() => onChange(!activo)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${activo ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

interface Props {
    /** Solo el administrador conecta, prueba o desconecta (el backend lo exige igual). */
    esAdmin?: boolean;
    /** Avisa si la conexión por QR está habilitada para la empresa (piloto). */
    onDisponible?: (disponible: boolean) => void;
    /** false mientras la tarjeta está montada pero oculta: no se refresca el QR. */
    activa?: boolean;
}

/**
 * "Conectar mi WhatsApp": el negocio vincula su número escaneando un QR y
 * Krezka manda desde ahí los avisos de despacho, el PDF del comprobante y los
 * avisos al equipo. Con `disponible=false` (servicio apagado o empresa fuera
 * del piloto) no se muestra nada y todo sigue con Takiy como antes.
 */
export default function WhatsappConexionCard({ esAdmin = true, onDisponible, activa = true }: Props) {
    const { alert } = useAlertStore();
    const [conexion, setConexion] = useState<ConexionWhatsapp | null>(null);
    const [qr, setQr] = useState<QrWhatsapp | null>(null);
    const [errorQr, setErrorQr] = useState<string | null>(null);
    const [accion, setAccion] = useState<Accion>(null);
    const [modoCodigo, setModoCodigo] = useState(false);
    const [numeroCodigo, setNumeroCodigo] = useState('');
    const [numeroPrueba, setNumeroPrueba] = useState('');
    const [confirmarDesconexion, setConfirmarDesconexion] = useState(false);
    // Cada intento de refresco (bien o mal) re-arma el temporizador del QR.
    const [tickQr, setTickQr] = useState(0);

    const estadoRef = useRef<EstadoConexion | null>(null);
    const montado = useRef(true);
    const onDisponibleRef = useRef(onDisponible);
    onDisponibleRef.current = onDisponible;

    useEffect(() => {
        montado.current = true;
        return () => {
            montado.current = false;
        };
    }, []);

    const aplicarConexion = useCallback(
        (c: ConexionWhatsapp) => {
            const antes = estadoRef.current;
            estadoRef.current = c.estado;
            setConexion(c);
            if (c.estado !== 'CONECTANDO') setQr(null);
            if (antes === 'CONECTANDO' && c.estado === 'CONECTADO') {
                setModoCodigo(false);
                alert('¡Listo! Tu WhatsApp quedó conectado a Krezka.', 'success');
            }
        },
        [alert],
    );

    const cargar = useCallback(async () => {
        const res = await get<ConexionWhatsapp>('/whatsapp/conexion');
        if (!montado.current) return;
        if (res.success && res.data) {
            aplicarConexion(res.data);
            onDisponibleRef.current?.(!!res.data.disponible);
        } else {
            // Backend sin este módulo o caído: no se muestra nada nuevo.
            onDisponibleRef.current?.(false);
            setConexion((prev) => prev ?? ({ disponible: false } as ConexionWhatsapp));
        }
    }, [aplicarConexion]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    const aplicarQr = useCallback(
        (data: QrWhatsapp) => {
            if (data.estado === 'CONECTANDO') {
                estadoRef.current = 'CONECTANDO';
                setConexion((c) => (c ? { ...c, estado: 'CONECTANDO' } : c));
                setQr((prev) => ({
                    ...data,
                    // El refresco no repite el código: se conserva el que pidió el dueño.
                    codigoEmparejamiento: data.codigoEmparejamiento ?? prev?.codigoEmparejamiento ?? null,
                }));
            } else {
                // Ya escaneó (CONECTADO) o la instancia no existe (NO_CONECTADO).
                void cargar();
            }
        },
        [cargar],
    );

    const refrescarQr = useCallback(async () => {
        setAccion((a) => a ?? 'qr');
        const res = await get<QrWhatsapp>('/whatsapp/conexion/qr');
        if (!montado.current) return;
        setAccion((a) => (a === 'qr' ? null : a));
        if (res.success && res.data) {
            setErrorQr(null);
            aplicarQr(res.data);
        } else {
            setErrorQr(res.error || 'No se pudo actualizar el QR.');
        }
        setTickQr((t) => t + 1);
    }, [aplicarQr]);

    const estado = conexion?.estado ?? null;

    // Entró con la conexión a medias (p. ej. recargó la página): pide el QR.
    useEffect(() => {
        if (estado === 'CONECTANDO' && !qr && esAdmin && activa && accion === null) void refrescarQr();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estado, esAdmin, activa]);

    // El QR caduca: se vuelve a pedir al ritmo que indica el backend.
    useEffect(() => {
        if (estado !== 'CONECTANDO' || !esAdmin || !activa) return;
        const ms = segundosRefrescoQr(qr?.expiraEnSeg) * 1000;
        const t = setTimeout(() => void refrescarQr(), ms);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estado, esAdmin, activa, tickQr]);

    // Tiempo real: QR nuevo o cambio de estado sin esperar el temporizador.
    useEffect(
        () =>
            suscribirWhatsappConexion((payload) => {
                if (!esEvento(payload) || !montado.current) return;
                if (payload.qr && payload.estado === 'CONECTANDO') {
                    aplicarQr({ estado: 'CONECTANDO', qr: payload.qr, codigoEmparejamiento: payload.codigoEmparejamiento, expiraEnSeg: 0 });
                    setTickQr((t) => t + 1);
                } else {
                    void cargar();
                }
            }),
        [aplicarQr, cargar],
    );

    const conectar = async (conNumero: boolean) => {
        let numero: string | null = null;
        if (conNumero) {
            numero = normalizarCelularPe(numeroCodigo);
            if (!numero) {
                alert('El número no es válido. Escribe tu celular de 9 dígitos (ej. 987654321).', 'warning');
                return;
            }
        }
        setAccion('conectar');
        setErrorQr(null);
        const res = await post<QrWhatsapp>('/whatsapp/conexion', numero ? { numero } : {});
        if (!montado.current) return;
        setAccion(null);
        if (!res.success || !res.data) {
            alert(res.error || 'No se pudo iniciar la conexión de WhatsApp.', 'error');
            return;
        }
        // Un código nuevo invalida el anterior: no se arrastra.
        if (!numero) setQr(null);
        aplicarQr(numero ? res.data : { ...res.data, codigoEmparejamiento: null });
        setTickQr((t) => t + 1);
    };

    const cancelar = async () => {
        setAccion('desconectar');
        const res = await del<ConexionWhatsapp>('/whatsapp/conexion');
        if (!montado.current) return;
        setAccion(null);
        if (res.success && res.data) {
            setModoCodigo(false);
            aplicarConexion(res.data);
        } else {
            alert(res.error || 'No se pudo cancelar la conexión.', 'error');
        }
    };

    const desconectar = async () => {
        setAccion('desconectar');
        const res = await del<ConexionWhatsapp>('/whatsapp/conexion');
        if (!montado.current) return;
        setAccion(null);
        setConfirmarDesconexion(false);
        if (!res.success || !res.data) {
            alert(res.error || 'No se pudo desconectar tu WhatsApp.', 'error');
            return;
        }
        aplicarConexion(res.data);
        alert('Tu WhatsApp se desconectó de Krezka.', 'success');
    };

    const probar = async () => {
        let numero: string | undefined;
        if (numeroPrueba.trim()) {
            const n = normalizarCelularPe(numeroPrueba);
            if (!n) {
                alert('El número no es válido. Escribe un celular de 9 dígitos (ej. 987654321).', 'warning');
                return;
            }
            numero = n;
        }
        setAccion('probar');
        const res = await post<{ ok: boolean; error?: string }>('/whatsapp/conexion/prueba', numero ? { numero } : {});
        if (!montado.current) return;
        setAccion(null);
        if (res.success && res.data?.ok) {
            alert('Mensaje de prueba enviado. Revisa ese WhatsApp.', 'success');
            void cargar();
        } else {
            alert(res.data?.error || res.error || 'No se pudo enviar el mensaje de prueba.', 'error');
        }
    };

    const cambiarEnvioComprobante = async (enviarComprobante: boolean) => {
        setAccion('guardar');
        const res = await patch<ConexionWhatsapp>('/whatsapp/conexion', { enviarComprobante });
        if (!montado.current) return;
        setAccion(null);
        if (!res.success || !res.data) {
            alert(res.error || 'No se pudo guardar el ajuste.', 'error');
            return;
        }
        aplicarConexion(res.data);
        alert(enviarComprobante ? 'El comprobante se enviará al emitir.' : 'Ya no se enviará el comprobante al emitir.', 'success');
    };

    if (!conexion) {
        return <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" aria-busy="true" aria-label="Cargando WhatsApp" />;
    }
    if (!conexion.disponible) return null;

    const uiEstado = ESTADO_UI[conexion.estado];
    const ocupado = accion !== null && accion !== 'qr';

    const formCodigo = (
        <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <label className="block" htmlFor="wa-numero-codigo">
                <span className={lbl}>Tu celular con WhatsApp</span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
                <input
                    id="wa-numero-codigo"
                    className={input}
                    value={numeroCodigo}
                    onChange={(e) => setNumeroCodigo(e.target.value)}
                    placeholder="987 654 321"
                    inputMode="tel"
                    autoComplete="tel"
                />
                <button type="button" className={btnPrimario} disabled={ocupado} onClick={() => void conectar(true)}>
                    <Icon icon={accion === 'conectar' ? 'svg-spinners:180-ring' : 'solar:key-minimalistic-bold'} className="text-lg" />
                    Pedir código
                </button>
            </div>
            <p className="text-[11px] text-slate-500">Te daremos un código de 8 letras para escribir en WhatsApp, sin escanear nada.</p>
        </div>
    );

    const enlaceModo = (
        <button type="button" className={btnLink} onClick={() => setModoCodigo((m) => !m)} aria-expanded={modoCodigo}>
            {modoCodigo ? 'Prefiero escanear el QR' : 'Prefiero vincular con mi número de teléfono'}
        </button>
    );

    return (
        <section className="space-y-4" aria-labelledby="wa-conexion-titulo" data-testid="whatsapp-conexion">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Icon icon="mdi:whatsapp" className="text-xl" />
                    </div>
                    <div>
                        <h3 id="wa-conexion-titulo" className="font-bold text-slate-900 dark:text-white">WhatsApp por QR</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Envía desde tu propio número, sin costo por mensaje y sin plantillas.</p>
                    </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${uiEstado.clase}`} data-testid="wa-estado">{uiEstado.texto}</span>
            </div>

            <div aria-live="polite" className="space-y-4">
                {conexion.estado === 'NO_CONECTADO' && (
                    <>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                            Escanea un QR con tu celular y Krezka enviará <strong>desde tu número</strong>:
                            <ul className="mt-1 list-disc pl-5">
                                <li>Avisos de despacho a tus clientes (en camino, en agencia, entregado).</li>
                                <li>El comprobante en PDF al emitirlo.</li>
                                <li>Avisos a tu equipo (leads y derivaciones).</li>
                            </ul>
                        </div>
                        {esAdmin ? (
                            <div className="space-y-3">
                                {!modoCodigo && (
                                    <button type="button" className={`${btnPrimario} w-full sm:w-auto`} disabled={ocupado} onClick={() => void conectar(false)}>
                                        <Icon icon={accion === 'conectar' ? 'svg-spinners:180-ring' : 'mdi:whatsapp'} className="text-lg" />
                                        {accion === 'conectar' ? 'Preparando tu QR…' : 'Vincular mi WhatsApp'}
                                    </button>
                                )}
                                {modoCodigo && formCodigo}
                                <div>{enlaceModo}</div>
                            </div>
                        ) : (
                            <SoloAdmin />
                        )}
                    </>
                )}

                {conexion.estado === 'CONECTANDO' && (
                    <div className="grid gap-4 md:grid-cols-[auto,1fr]">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex h-60 w-60 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700">
                                {qr?.qr ? (
                                    <img src={qr.qr} alt="Código QR para vincular tu WhatsApp con Krezka" className="h-full w-full object-contain" />
                                ) : (
                                    <Icon icon="svg-spinners:180-ring" className="text-4xl text-emerald-500" aria-label="Generando el QR" />
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                                {accion === 'qr' ? 'Actualizando el QR…' : `El QR se renueva cada ${segundosRefrescoQr(qr?.expiraEnSeg)} s`}
                            </p>
                            {errorQr && <p role="alert" className="max-w-[15rem] text-center text-[11px] font-semibold text-red-600">{errorQr}</p>}
                        </div>
                        <div className="space-y-3">
                            {qr?.codigoEmparejamiento && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center dark:border-emerald-800/40 dark:bg-emerald-900/20">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Tu código de vinculación</p>
                                    <p className="mt-1 font-mono text-2xl font-extrabold tracking-[0.25em] text-slate-900 dark:text-white" data-testid="wa-codigo">
                                        {formatearCodigoEmparejamiento(qr.codigoEmparejamiento)}
                                    </p>
                                </div>
                            )}
                            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
                                <li>Abre <strong>WhatsApp</strong> en el celular del negocio.</li>
                                <li>Toca <strong>⋮</strong> (Android) o <strong>Configuración</strong> (iPhone) y entra a <strong>Dispositivos vinculados</strong>.</li>
                                <li>Toca <strong>Vincular un dispositivo</strong>.</li>
                                {qr?.codigoEmparejamiento ? (
                                    <li>Elige <strong>Vincular con el número de teléfono</strong> y escribe el código de arriba.</li>
                                ) : (
                                    <li>Apunta la cámara a este QR. Listo: esta pantalla cambia sola.</li>
                                )}
                            </ol>
                            {esAdmin && (
                                <>
                                    {modoCodigo && formCodigo}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button type="button" className={btnSecundario} disabled={ocupado || accion === 'qr'} onClick={() => void refrescarQr()}>
                                            <Icon icon="solar:refresh-bold" className="text-lg" />
                                            Actualizar QR
                                        </button>
                                        <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" disabled={ocupado} onClick={() => void cancelar()}>
                                            Cancelar
                                        </button>
                                    </div>
                                    <div>{enlaceModo}</div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {conexion.estado === 'CONECTADO' && (
                    <Conectado
                        conexion={conexion}
                        esAdmin={esAdmin}
                        accion={accion}
                        numeroPrueba={numeroPrueba}
                        setNumeroPrueba={setNumeroPrueba}
                        onProbar={() => void probar()}
                        onEnvioComprobante={(v) => void cambiarEnvioComprobante(v)}
                        confirmarDesconexion={confirmarDesconexion}
                        setConfirmarDesconexion={setConfirmarDesconexion}
                        onDesconectar={() => void desconectar()}
                    />
                )}

                {conexion.estado === 'DESCONECTADO' && (
                    <>
                        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-900/20">
                            <Icon icon="solar:danger-triangle-bold" className="mt-0.5 shrink-0 text-lg text-red-500" />
                            <div className="text-xs leading-5 text-red-800 dark:text-red-200">
                                <p className="font-bold">Tu WhatsApp se desconectó{conexion.desconectadoEn ? ` (desde el ${formatearFechaConexion(conexion.desconectadoEn)})` : ''}.</p>
                                <p>
                                    Mientras no vuelvas a escanear el QR, los avisos y comprobantes no salen desde tu número
                                    {conexion.takiyActivo ? ' (se usa Takiy como respaldo).' : '.'}
                                </p>
                            </div>
                        </div>
                        {esAdmin ? (
                            <div className="space-y-3">
                                {!modoCodigo && (
                                    <button type="button" className={`${btnPrimario} w-full sm:w-auto`} disabled={ocupado} onClick={() => void conectar(false)}>
                                        <Icon icon={accion === 'conectar' ? 'svg-spinners:180-ring' : 'solar:qr-code-bold'} className="text-lg" />
                                        {accion === 'conectar' ? 'Preparando tu QR…' : 'Volver a conectar'}
                                    </button>
                                )}
                                {modoCodigo && formCodigo}
                                <div>{enlaceModo}</div>
                            </div>
                        ) : (
                            <SoloAdmin />
                        )}
                    </>
                )}
            </div>

            <details className="group rounded-xl border border-slate-200 p-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <summary className="cursor-pointer select-none font-bold text-slate-700 dark:text-slate-300">Cómo cuidar tu número (evita bloqueos)</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Escribe solo a clientes que te compraron o te escribieron.</li>
                    <li>No lo uses para envíos masivos ni publicidad: WhatsApp puede bloquear el número.</li>
                    <li>Krezka espera unos segundos entre mensajes y tiene un tope de {conexion.topeDiario || 300} por día.</li>
                    <li>Mantén el celular con internet y batería; si cierras sesión allí, vuelve a escanear.</li>
                </ul>
            </details>

            <p className="text-right text-[10px] text-slate-400 dark:text-slate-500">Conexión con tecnología Evolution API</p>
        </section>
    );
}

function SoloAdmin() {
    return (
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            Solo el administrador de la empresa puede conectar o desconectar el WhatsApp.
        </p>
    );
}

interface ConectadoProps {
    conexion: ConexionWhatsapp;
    esAdmin: boolean;
    accion: Accion;
    numeroPrueba: string;
    setNumeroPrueba: (v: string) => void;
    onProbar: () => void;
    onEnvioComprobante: (v: boolean) => void;
    confirmarDesconexion: boolean;
    setConfirmarDesconexion: (v: boolean) => void;
    onDesconectar: () => void;
}

function Conectado({
    conexion,
    esAdmin,
    accion,
    numeroPrueba,
    setNumeroPrueba,
    onProbar,
    onEnvioComprobante,
    confirmarDesconexion,
    setConfirmarDesconexion,
    onDesconectar,
}: ConectadoProps) {
    const uso = usoDiario(conexion.enviadosHoy, conexion.topeDiario);
    const colorBarra = uso.nivel === 'agotado' ? 'bg-red-500' : uso.nivel === 'alto' ? 'bg-amber-500' : 'bg-emerald-500';
    const ocupado = accion !== null && accion !== 'qr';

    return (
        <div className="space-y-4">
            <dl className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-3 dark:border-slate-800">
                <div>
                    <dt className={lbl}>Número</dt>
                    <dd className="text-sm font-bold text-slate-900 dark:text-white" data-testid="wa-numero">{formatearNumeroWhatsapp(conexion.numero) || '—'}</dd>
                </div>
                <div>
                    <dt className={lbl}>Perfil</dt>
                    <dd className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{conexion.nombrePerfil || '—'}</dd>
                </div>
                <div>
                    <dt className={lbl}>Conectado desde</dt>
                    <dd className="text-sm text-slate-700 dark:text-slate-300">{formatearFechaConexion(conexion.conectadoEn) || '—'}</dd>
                </div>
            </dl>

            <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-300" id="wa-uso">Mensajes de hoy</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200" data-testid="wa-uso">{conexion.enviadosHoy} / {conexion.topeDiario}</span>
                </div>
                <div
                    role="progressbar"
                    aria-labelledby="wa-uso"
                    aria-valuemin={0}
                    aria-valuemax={conexion.topeDiario}
                    aria-valuenow={Math.min(conexion.enviadosHoy, conexion.topeDiario)}
                    className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                >
                    <div className={`h-full rounded-full ${colorBarra} transition-all`} style={{ width: `${uso.porcentaje}%` }} />
                </div>
                {uso.nivel === 'agotado' && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">Llegaste al tope de hoy: los siguientes mensajes salen por el respaldo (si tienes) o mañana.</p>
                )}
            </div>

            {conexion.takiyActivo && (
                <p className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200" data-testid="wa-takiy-respaldo">
                    <Icon icon="solar:info-circle-bold" className="mt-0.5 shrink-0 text-base" />
                    Se usa primero este WhatsApp. Takiy queda como respaldo si este número se desconecta o llega a su tope.
                </p>
            )}

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Enviar el comprobante al emitir</p>
                    <p className="text-[11px] text-slate-500">El PDF le llega solo al cliente si tiene celular registrado. No aplica a cotizaciones.</p>
                </div>
                <Switch
                    etiqueta="Enviar el comprobante al emitir"
                    activo={conexion.enviarComprobante}
                    disabled={!esAdmin || ocupado}
                    onChange={onEnvioComprobante}
                />
            </div>

            {esAdmin && (
                <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="flex-1" htmlFor="wa-numero-prueba">
                            <span className={lbl}>Probar con el celular (opcional)</span>
                            <input
                                id="wa-numero-prueba"
                                className={input}
                                value={numeroPrueba}
                                onChange={(e) => setNumeroPrueba(e.target.value)}
                                placeholder="Vacío = tu celular"
                                inputMode="tel"
                            />
                        </label>
                        <button type="button" className={btnSecundario} disabled={ocupado} onClick={onProbar}>
                            <Icon icon={accion === 'probar' ? 'svg-spinners:180-ring' : 'mdi:whatsapp'} className="text-lg" />
                            Enviar mensaje de prueba
                        </button>
                    </div>

                    {confirmarDesconexion ? (
                        <div role="alertdialog" aria-labelledby="wa-confirmar-titulo" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
                            <p id="wa-confirmar-titulo" className="text-sm font-bold text-red-800 dark:text-red-200">¿Desconectar tu WhatsApp de Krezka?</p>
                            <p className="text-xs text-red-700 dark:text-red-300">
                                Dejarán de salir los avisos y comprobantes desde tu número
                                {conexion.takiyActivo ? ' (seguirán por Takiy)' : ''}. Para volver tendrás que escanear el QR otra vez.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                    disabled={ocupado}
                                    onClick={onDesconectar}
                                >
                                    {accion === 'desconectar' && <Icon icon="svg-spinners:180-ring" className="text-lg" />}
                                    Sí, desconectar
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                    disabled={ocupado}
                                    onClick={() => setConfirmarDesconexion(false)}
                                >
                                    No, mantener
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded dark:text-red-400"
                            onClick={() => setConfirmarDesconexion(true)}
                        >
                            <Icon icon="solar:link-broken-bold" className="text-base" />
                            Desconectar
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
