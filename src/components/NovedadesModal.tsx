import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/zustand/auth';
import { BRAND } from '@/lib/branding';
import {
    agruparPorMes,
    CATEGORIAS_NOVEDADES,
    etiquetaMes,
    marcarNovedadesVistas,
    normalizarPlan,
    NOVEDADES,
    esProximamente,
    estadoDeNovedad,
    estaEnMovil,
    novedadIncluidaEnPlan,
    planesDeNovedad,
    type Novedad,
    type PlanNovedad,
    type TipoNovedad,
} from '@/data/novedades';

const CHIP_TIPO: Record<TipoNovedad, { label: string; clase: string; icon: string }> = {
    NUEVO: {
        label: 'Nuevo',
        icon: 'solar:stars-bold-duotone',
        clase: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    },
    MEJORA: {
        label: 'Mejora',
        icon: 'solar:arrow-up-bold-duotone',
        clase: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    },
    CORRECCION: {
        label: 'Corrección',
        icon: 'solar:shield-check-bold-duotone',
        clase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
};

/** Chip de madurez. `DISPONIBLE` no pinta nada: es el caso normal. */
const CHIP_ESTADO: Record<string, { label: string; clase: string; icon: string }> = {
    BETA: {
        label: 'Beta',
        icon: 'solar:test-tube-bold-duotone',
        clase: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    },
    PROXIMAMENTE: {
        label: 'Próximamente',
        icon: 'solar:clock-circle-bold-duotone',
        clase: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    },
};

const ETIQUETA_PLAN: Record<PlanNovedad, string> = {
    EMPRENDEDOR: 'Emprendedor',
    NEGOCIO: 'Negocio',
    CORPORATIVO: 'Corporativo',
};

/**
 * Niky, la mascota de Krezka, para el panel izquierdo. Es un banner apaisado con
 * su propio texto, así que se muestra ENTERO (`object-contain`): recortarlo
 * partía las frases por la mitad y se veía mal.
 */
const MASCOTA_URL = '/assets/novedades.png';

const formatearFecha = (iso: string): string => {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
};

/** Tarjeta de una novedad dentro del modal. */
function TarjetaNovedad({ novedad, planEmpresa }: { novedad: Novedad; planEmpresa: PlanNovedad | null }) {
    const chip = CHIP_TIPO[novedad.tipo];
    const incluida = novedadIncluidaEnPlan(novedad, planEmpresa);
    const planes = planesDeNovedad(novedad);
    const paraTodos = !novedad.planes || novedad.planes.length === 0;
    const enMovil = estaEnMovil(novedad);
    const chipEstado = CHIP_ESTADO[estadoDeNovedad(novedad)];
    const proximamente = esProximamente(novedad);

    return (
        <article className="rounded-2xl border border-gray-200/70 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${chip.clase}`}>
                    <Icon icon={chip.icon} width={13} />
                    {chip.label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300">
                    {novedad.categoria}
                </span>
                {chipEstado && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${chipEstado.clase}`}>
                        <Icon icon={chipEstado.icon} width={13} />
                        {chipEstado.label}
                    </span>
                )}
                <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                    {formatearFecha(novedad.fecha)}
                </span>
            </div>

            <h3 className="text-[15px] font-black text-gray-950 dark:text-white">{novedad.titulo}</h3>
            <p className="mt-1.5 text-sm leading-6 text-gray-600 dark:text-gray-400">{novedad.descripcion}</p>

            {novedad.donde && (
                <p className="mt-2.5 inline-flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Icon icon="solar:map-point-bold-duotone" width={14} className="mt-px shrink-0 text-gray-400" />
                    <span>Lo encuentras en <strong className="font-semibold text-gray-700 dark:text-gray-300">{novedad.donde}</strong></span>
                </p>
            )}

            {/* Disponibilidad: primero si TU plan lo tiene, después en cuáles está. */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                {proximamente ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Icon icon="solar:clock-circle-bold" width={13} />
                        {paraTodos
                            ? 'Llegará a todos los planes'
                            : `Llegará a ${planes.map((p) => ETIQUETA_PLAN[p]).join(' y ')}`}
                    </span>
                ) : paraTodos ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <Icon icon="solar:check-circle-bold" width={13} />
                        Disponible en todos los planes
                    </span>
                ) : incluida ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <Icon icon="solar:check-circle-bold" width={13} />
                        Incluido en tu plan
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                        <Icon icon="solar:lock-keyhole-bold" width={13} />
                        Disponible en {planes.map((p) => ETIQUETA_PLAN[p]).join(' y ')}
                    </span>
                )}

                {/* Dónde funciona. Solo se promete la app cuando se verificó en el
                    código de falconext-mype-mobile. */}
                {!proximamente && (
                    <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        title={enMovil ? 'Disponible en el panel web y en la app móvil' : 'Por ahora solo en el panel web'}
                    >
                        <Icon icon="solar:monitor-smartphone-bold-duotone" width={13} />
                        {enMovil ? 'Web y celular' : 'Solo web'}
                    </span>
                )}

                {!paraTodos && incluida && !proximamente && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        Planes: {planes.map((p) => ETIQUETA_PLAN[p]).join(' · ')}
                    </span>
                )}

                {novedad.nota && (
                    <span className="w-full inline-flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <Icon icon="solar:info-circle-bold" width={13} className="mt-px shrink-0 text-gray-400" />
                        {novedad.nota}
                    </span>
                )}
            </div>
        </article>
    );
}

interface Props {
    abierto: boolean;
    onClose: () => void;
    /** `true` cuando se abrió solo (no lo pidió el usuario): cambia el encabezado. */
    autoAbierto?: boolean;
}

/**
 * Novedades del sistema, en modal. Lista curada (`src/data/novedades.ts`) de lo
 * publicado cada mes, marcando para cada función si el plan de la empresa la
 * incluye — así el empresario sabe qué ya puede usar y qué le falta contratar.
 *
 * Se abre desde el menú lateral y, una vez por inicio de sesión, solo.
 */
export default function NovedadesModal({ abierto, onClose, autoAbierto = false }: Props) {
    const { auth } = useAuthStore();
    const planEmpresa = normalizarPlan((auth as any)?.empresa?.plan?.nombre);

    const [categoria, setCategoria] = useState<string>('TODAS');
    const [soloMiPlan, setSoloMiPlan] = useState(false);
    // Si la imagen faltara, se oculta el bloque en vez de dejar el icono roto.
    const [mascotaFallo, setMascotaFallo] = useState(false);

    // Al abrirlo se dan por leídas: el punto del menú deja de aparecer.
    useEffect(() => {
        if (abierto) marcarNovedadesVistas();
    }, [abierto]);

    // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
    useEffect(() => {
        if (!abierto) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const overflowPrevio = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflowPrevio;
        };
    }, [abierto, onClose]);

    const filtradas = useMemo(
        () =>
            NOVEDADES.filter((n) => {
                if (categoria !== 'TODAS' && n.categoria !== categoria) return false;
                if (soloMiPlan && !novedadIncluidaEnPlan(n, planEmpresa)) return false;
                return true;
            }),
        [categoria, soloMiPlan, planEmpresa],
    );

    const grupos = useMemo(() => agruparPorMes(filtradas), [filtradas]);

    const chipFiltro = (activo: boolean) =>
        `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activo
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
        }`;

    return createPortal(
        <AnimatePresence>
            {abierto && (
                <motion.div
                    key="novedades-modal"
                    className="print:hidden fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Novedades del sistema"
                        className="relative w-full max-w-7xl max-h-[88vh] lg:h-[min(560px,88vh)] flex flex-col lg:flex-row bg-[#F9FAFC] dark:bg-[#0A0D14] rounded-3xl shadow-2xl overflow-hidden"
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* ── Lado izquierdo: solo Niky ─────────────────────────────
                            Banner apaisado (1500×1049) con su propio texto, así que se muestra
                            ENTERO (`object-contain`) sobre un degradado tomado de los bordes de
                            la imagen: recortarlo partía las frases ("te dar las nuevas…").
                            El panel ocupa un ancho fijo y el listado se queda con el resto.
                            En móvil se oculta: ahí manda el listado. */}
                        {!mascotaFallo && (
                            <aside className="hidden lg:flex shrink-0 h-full w-[46%] flex-col overflow-hidden bg-[linear-gradient(90deg,#1a0ea9_0%,#3214d5_50%,#7c24fc_100%)]">
                                {/* Encabezado sobre el mismo degradado del borde superior de la imagen, para que no se note el corte. */}
                                <div className="px-7 pt-7 pb-2 text-white">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Novedades de {BRAND.name}</p>
                                    <h2 className="mt-1 text-2xl font-black leading-tight">Lo nuevo de {etiquetaMes(NOVEDADES[0]?.fecha.slice(0, 7) ?? '')}</h2>
                                    <p className="mt-1 text-sm text-white/80">{NOVEDADES.length} funciones y mejoras publicadas.</p>
                                </div>
                                <div className="flex-1 min-h-0 flex items-end">
                                    <img
                                        src={MASCOTA_URL}
                                        alt={`Niky, la mascota de ${BRAND.name}, presentando las novedades del sistema`}
                                        onError={() => setMascotaFallo(true)}
                                        className="w-full h-auto max-h-full object-contain object-bottom"
                                    />
                                </div>
                            </aside>
                        )}

                        {/* ── Lado derecho: filtros + listado ──────────────────────── */}
                        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                            <div className="shrink-0 relative flex flex-wrap items-center gap-2 px-5 py-3 pr-14 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-[#111827]">
                                <button type="button" onClick={() => setCategoria('TODAS')} className={chipFiltro(categoria === 'TODAS')}>
                                    Todas
                                </button>
                                {CATEGORIAS_NOVEDADES.map((c) => (
                                    <button key={c} type="button" onClick={() => setCategoria(c)} className={chipFiltro(categoria === c)}>
                                        {c}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setSoloMiPlan((v) => !v)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                        soloMiPlan
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <Icon icon={soloMiPlan ? 'solar:check-circle-bold' : 'solar:filter-bold-duotone'} width={14} />
                                    Solo lo de mi plan
                                </button>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Cerrar novedades"
                                    className="absolute top-2.5 right-3 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                                >
                                    <Icon icon="solar:close-circle-bold" width={20} />
                                </button>
                            </div>

                            <div className="flex-1 min-h-0 max-h-[72vh] overflow-y-auto p-5">
                                {grupos.length === 0 ? (
                                    <div className="rounded-2xl border border-gray-200/70 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center">
                                        <Icon icon="solar:inbox-line-duotone" width={40} className="mx-auto text-gray-300 dark:text-slate-700" />
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            No hay novedades con estos filtros.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-7">
                                        {grupos.map(([mes, items]) => (
                                            <section key={mes}>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                        {etiquetaMes(mes)}
                                                    </h3>
                                                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                                                        {items.length} {items.length === 1 ? 'novedad' : 'novedades'}
                                                    </span>
                                                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-800" />
                                                </div>
                                                <div className="space-y-3">
                                                    {items.map((n) => (
                                                        <TarjetaNovedad key={n.id} novedad={n} planEmpresa={planEmpresa} />
                                                    ))}
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-[#111827]">
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 hidden md:block">
                                    Vuelve a verlas cuando quieras desde <strong className="font-semibold text-gray-500 dark:text-gray-400">Novedades</strong>, en el menú.
                                </p>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="ml-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
                                >
                                    {autoAbierto ? 'Entendido, ir al panel' : 'Cerrar'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
