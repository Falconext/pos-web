import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/zustand/auth';
import { BRAND } from '@/lib/branding';
import {
    LANZAMIENTO,
    marcarLanzamientoVisto,
    novedadesDelLanzamiento,
    type DestacadoLanzamiento,
    type ProximamenteLanzamiento,
} from '@/data/lanzamiento';
import {
    normalizarPlan,
    novedadIncluidaEnPlan,
    type Novedad,
    type PlanNovedad,
    type TipoNovedad,
} from '@/data/novedades';

const ETIQUETA_PLAN: Record<PlanNovedad, string> = {
    EMPRENDEDOR: 'Emprendedor',
    NEGOCIO: 'Negocio',
    CORPORATIVO: 'Corporativo',
};

const ACENTO: Record<DestacadoLanzamiento['acento'], { texto: string; glow: string; borde: string; punto: string; halo: string; fondo: string }> = {
    violet: { texto: 'text-violet-300', glow: 'from-violet-600/50 via-fuchsia-600/20', borde: 'ring-violet-400/30', punto: 'bg-violet-400', halo: 'bg-violet-500/35', fondo: 'rgba(139,92,246,.18)' },
    sky: { texto: 'text-sky-300', glow: 'from-sky-600/50 via-cyan-500/20', borde: 'ring-sky-400/30', punto: 'bg-sky-400', halo: 'bg-sky-500/35', fondo: 'rgba(14,165,233,.16)' },
    emerald: { texto: 'text-emerald-300', glow: 'from-emerald-600/50 via-teal-500/20', borde: 'ring-emerald-400/30', punto: 'bg-emerald-400', halo: 'bg-emerald-500/35', fondo: 'rgba(16,185,129,.16)' },
    amber: { texto: 'text-amber-300', glow: 'from-amber-500/50 via-orange-500/20', borde: 'ring-amber-400/30', punto: 'bg-amber-400', halo: 'bg-amber-500/35', fondo: 'rgba(245,158,11,.14)' },
    rose: { texto: 'text-rose-300', glow: 'from-rose-600/50 via-pink-500/20', borde: 'ring-rose-400/30', punto: 'bg-rose-400', halo: 'bg-rose-500/35', fondo: 'rgba(244,63,94,.16)' },
};

/** Animaciones de entrada al hacer scroll (se desactivan si el sistema pide menos movimiento). */
const aparecer = (reducido: boolean): Variants => ({
    oculto: { opacity: 0, y: reducido ? 0 : 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
});
const contenedorEscalonado: Variants = {
    oculto: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const SECCIONES_LISTA: Array<{ id: string; tipo: TipoNovedad; titulo: string; icono: string; color: string }> = [
    { id: 'lo-nuevo', tipo: 'NUEVO', titulo: 'Lo nuevo', icono: 'solar:stars-bold-duotone', color: 'text-violet-300' },
    { id: 'mejoras', tipo: 'MEJORA', titulo: 'Mejoras', icono: 'solar:arrow-up-bold-duotone', color: 'text-sky-300' },
    { id: 'corregido', tipo: 'CORRECCION', titulo: 'Corregido', icono: 'solar:shield-check-bold-duotone', color: 'text-emerald-300' },
];

/**
 * Imagen del bloque. Si no existe (todavía) se dibuja un marcador con el icono
 * sobre un degradado, para que la portada se pueda publicar sin todas las fotos.
 */
function Imagen({ src, alt, icono, acento, clase = '' }: { src?: string; alt: string; icono: string; acento: DestacadoLanzamiento['acento']; clase?: string }) {
    const [fallo, setFallo] = useState(false);
    const [cargada, setCargada] = useState(false);
    const reducido = useReducedMotion();
    const a = ACENTO[acento];
    if (src && !fallo) {
        return (
            <div className={`relative ${clase}`}>
                {/* Halo del color del bloque detrás de la imagen, para que no quede
                    "pegada" como un rectángulo sobre el fondo plano. */}
                <div className={`pointer-events-none absolute -inset-6 sm:-inset-10 rounded-[40px] blur-3xl ${a.halo}`} />
                <motion.div
                    className={`relative h-full overflow-hidden rounded-2xl ring-1 ${a.borde} bg-[#0B0F1A] shadow-[0_30px_80px_-20px_rgba(0,0,0,.8)]`}
                    whileHover={reducido ? undefined : { scale: 1.02, rotate: -0.4 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                >
                    <motion.img
                        src={src}
                        alt={alt}
                        onLoad={() => setCargada(true)}
                        onError={() => setFallo(true)}
                        initial={false}
                        animate={{ opacity: cargada ? 1 : 0, scale: cargada || reducido ? 1 : 1.06 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full h-full object-cover"
                    />
                    {/* Viñeta suave + reflejo superior: integra la foto con el fondo oscuro. */}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_55%,rgba(7,9,15,.55)_100%)]" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
                </motion.div>
            </div>
        );
    }
    return (
        <div
            className={`relative overflow-hidden rounded-2xl ring-1 ${a.borde} bg-gradient-to-br ${a.glow} to-[#0B0F1A] ${clase}`}
            aria-label={alt}
            role="img"
        >
            <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Icon icon={icono} className="w-24 h-24 sm:w-32 sm:h-32 text-white/80 drop-shadow-[0_10px_30px_rgba(0,0,0,.5)]" />
            </div>
        </div>
    );
}

function ChipPlan({ planes, planEmpresa }: { planes?: PlanNovedad[]; planEmpresa: PlanNovedad | null }) {
    const paraTodos = !planes || planes.length === 0;
    const incluida = novedadIncluidaEnPlan({ planes } as Novedad, planEmpresa);
    if (paraTodos) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
                <Icon icon="solar:check-circle-bold" width={13} /> Todos los planes
            </span>
        );
    }
    return incluida ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
            <Icon icon="solar:check-circle-bold" width={13} /> Incluido en tu plan
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20">
            <Icon icon="solar:lock-keyhole-bold" width={13} /> Planes {planes!.map((p) => ETIQUETA_PLAN[p]).join(' y ')}
        </span>
    );
}

function Destacado({ d, invertido, planEmpresa, root }: { d: DestacadoLanzamiento; invertido: boolean; planEmpresa: PlanNovedad | null; root: RefObject<HTMLDivElement | null> }) {
    const a = ACENTO[d.acento];
    const reducido = Boolean(useReducedMotion());
    const item = aparecer(reducido);
    return (
        <section
            id={`lz-${d.id}`}
            data-seccion={d.id}
            className="relative scroll-mt-6 px-6 sm:px-10 py-12 sm:py-16 border-t border-white/[0.06] overflow-hidden"
        >
            {/* Mancha de color del bloque, del lado de la imagen, para que cada sección tenga su propia atmósfera. */}
            <div
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 w-[70%] h-[140%] blur-[100px] ${invertido ? 'right-[-20%]' : 'left-[-20%]'}`}
                style={{ background: `radial-gradient(closest-side, ${a.fondo}, transparent)` }}
            />
            <motion.div
                className={`relative grid gap-10 lg:gap-16 items-center lg:grid-cols-2 ${invertido ? 'lg:[&>*:first-child]:order-2' : ''}`}
                variants={contenedorEscalonado}
                initial="oculto"
                whileInView="visible"
                viewport={{ root, once: true, amount: 0.25 }}
            >
                <motion.div
                    variants={{
                        oculto: { opacity: 0, x: reducido ? 0 : invertido ? 40 : -40, scale: reducido ? 1 : 0.96 },
                        visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
                    }}
                >
                    <Imagen src={d.imagen} alt={d.titulo} icono={d.icono} acento={d.acento} clase="aspect-video w-full" />
                </motion.div>
                <div>
                    <motion.p variants={item} className={`text-[11px] font-black uppercase tracking-[0.25em] ${a.texto}`}>{d.etiqueta}</motion.p>
                    <motion.h2 variants={item} className="mt-2 text-2xl sm:text-4xl font-black uppercase leading-[1.02] tracking-tight text-white">{d.titulo}</motion.h2>
                    <motion.p variants={item} className="mt-4 text-[15px] leading-7 text-white/70">{d.descripcion}</motion.p>
                    <ul className="mt-5 space-y-2.5">
                        {d.puntos.map((p) => (
                            <motion.li key={p} variants={item} className="flex items-start gap-3 text-sm text-white/85">
                                <span className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${a.punto}`} />
                                <span>{p}</span>
                            </motion.li>
                        ))}
                    </ul>
                    <motion.div variants={item} className="mt-6 flex flex-wrap items-center gap-2">
                        <ChipPlan planes={d.planes} planEmpresa={planEmpresa} />
                        {d.donde && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
                                <Icon icon="solar:map-point-bold-duotone" width={14} className="text-white/40" />
                                {d.donde}
                            </span>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}

/**
 * Portada de cierre "Próximamente": imagen a pantalla completa con el texto
 * centrado en el tercio inferior (estilo cartel de videojuego). Sin imagen se
 * dibuja un degradado violeta con el icono.
 */
function Proximamente({ p, root }: { p: ProximamenteLanzamiento; root: RefObject<HTMLDivElement | null> }) {
    const reducido = Boolean(useReducedMotion());
    const item = aparecer(reducido);
    const [fallo, setFallo] = useState(false);
    const [cargada, setCargada] = useState(false);
    const conImagen = Boolean(p.imagen) && !fallo;
    return (
        <section
            id={`lz-${p.id}`}
            data-seccion={p.id}
            className={`relative scroll-mt-6 overflow-hidden flex flex-col justify-end min-h-[520px] sm:min-h-[600px] ${conImagen ? 'lg:block lg:min-h-0' : ''} bg-[#07090F]`}
        >
            {/* En escritorio la imagen va completa arriba (ancho total, sin recorte) y el
                texto se monta sobre su tercio inferior y sigue hacia abajo sobre el fondo
                oscuro; en móvil se recorta de fondo con el texto encima. */}
            {conImagen ? (
                <motion.img
                    src={p.imagen}
                    alt=""
                    onLoad={() => setCargada(true)}
                    onError={() => setFallo(true)}
                    initial={false}
                    animate={{ opacity: cargada ? 1 : 0, scale: cargada || reducido ? 1 : 1.06 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 w-full h-full object-cover object-top lg:relative lg:inset-auto lg:block lg:w-full lg:h-auto origin-top"
                />
            ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,36,252,.5),transparent_60%),linear-gradient(180deg,#1a0f3a_0%,#07090F_100%)]">
                    <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:40px_40px]" />
                    <Icon icon={p.icono} className="absolute left-1/2 top-[22%] -translate-x-1/2 w-32 h-32 text-white/25" />
                </div>
            )}
            {/* Fundido superior (viene de la sección anterior) y tercio inferior oscuro para el texto. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07090F] to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07090F] via-[#07090F]/75 to-transparent lg:hidden" />

            <motion.div
                className={`relative w-full px-6 sm:px-10 pt-40 pb-12 sm:pb-16 text-center ${conImagen ? 'lg:-mt-[38%] lg:pt-[22%] lg:bg-gradient-to-t lg:from-[#07090F] lg:via-[#07090F] lg:via-[62%] lg:to-transparent' : ''}`}
                variants={contenedorEscalonado}
                initial="oculto"
                whileInView="visible"
                viewport={{ root, once: true, amount: 0.3 }}
            >
                <motion.p variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.3em] text-amber-200 bg-amber-400/10 ring-1 ring-amber-300/30">
                    <Icon icon="solar:clock-circle-bold" width={13} />
                    {p.etiqueta}
                </motion.p>
                <motion.h2 variants={item} className="mt-4 text-4xl sm:text-6xl xl:text-7xl font-black uppercase leading-[0.92] tracking-tight text-white drop-shadow-[0_8px_40px_rgba(0,0,0,.8)]">
                    {p.titulo}
                </motion.h2>
                <motion.p variants={item} className="mx-auto mt-4 max-w-2xl text-[15px] sm:text-base leading-7 text-white/75">
                    {p.subtitulo}
                </motion.p>
                <motion.ul variants={item} className="mt-6 flex flex-wrap justify-center gap-2">
                    {p.puntos.map((x) => (
                        <li key={x} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white/85 bg-white/[0.07] ring-1 ring-white/10 backdrop-blur">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                            {x}
                        </li>
                    ))}
                </motion.ul>
            </motion.div>
        </section>
    );
}

function TarjetaCompacta({ n, planEmpresa }: { n: Novedad; planEmpresa: PlanNovedad | null }) {
    const incluida = novedadIncluidaEnPlan(n, planEmpresa);
    const [abierta, setAbierta] = useState(false);
    const item = aparecer(Boolean(useReducedMotion()));
    return (
        <motion.button
            type="button"
            variants={item}
            onClick={() => setAbierta((v) => !v)}
            className="group text-left rounded-xl bg-white/[0.035] hover:bg-white/[0.06] ring-1 ring-white/[0.06] hover:ring-white/15 transition-colors p-4"
        >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                <span>{n.categoria}</span>
                {!incluida && (
                    <span className="inline-flex items-center gap-1 text-amber-300/80 normal-case tracking-normal">
                        <Icon icon="solar:lock-keyhole-bold" width={11} /> otro plan
                    </span>
                )}
                {n.estado === 'BETA' && <span className="text-amber-300/80">Beta</span>}
                <Icon icon="solar:alt-arrow-down-linear" width={12} className={`ml-auto text-white/30 transition-transform ${abierta ? 'rotate-180' : ''}`} />
            </div>
            <h4 className="mt-1 text-[14px] font-bold leading-snug text-white/90 group-hover:text-white">{n.titulo}</h4>
            <p className={`mt-1.5 text-[13px] leading-6 text-white/55 ${abierta ? '' : 'line-clamp-2'}`}>{n.descripcion}</p>
            {abierta && n.donde && (
                <p className="mt-2 inline-flex items-start gap-1.5 text-[12px] text-white/45">
                    <Icon icon="solar:map-point-bold-duotone" width={13} className="mt-px shrink-0" />
                    {n.donde}
                </p>
            )}
        </motion.button>
    );
}

interface Props {
    abierto: boolean;
    onClose: () => void;
    /** Abre el historial completo de novedades (el modal clásico). */
    onVerHistorial?: () => void;
}

/**
 * Portada de lanzamiento: pantalla oscura, a lo grande, con los 2-3 cambios
 * que importan y el resto como notas de la versión. Se muestra sola una vez
 * por versión (`LANZAMIENTO.version`) y luego queda en el menú Novedades.
 */
export default function LanzamientoModal({ abierto, onClose, onVerHistorial }: Props) {
    const { auth } = useAuthStore();
    const planEmpresa = normalizarPlan((auth as any)?.empresa?.plan?.nombre);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activa, setActiva] = useState<string>('resumen');
    const [heroFallo, setHeroFallo] = useState(false);
    const heroVisible = Boolean(LANZAMIENTO.heroImagen) && !heroFallo;
    const reducido = Boolean(useReducedMotion());

    const listas = useMemo(() => novedadesDelLanzamiento(), []);
    const totalCambios = listas.NUEVO.length + listas.MEJORA.length + listas.CORRECCION.length;

    const indice = useMemo(
        () => [
            { id: 'resumen', titulo: 'Resumen', icono: 'solar:home-2-bold-duotone' },
            ...LANZAMIENTO.destacados.map((d) => ({ id: d.id, titulo: d.titulo, icono: d.icono })),
            ...(LANZAMIENTO.proximamente ? [{ id: LANZAMIENTO.proximamente.id, titulo: LANZAMIENTO.proximamente.etiqueta, icono: LANZAMIENTO.proximamente.icono }] : []),
            ...SECCIONES_LISTA.filter((s) => listas[s.tipo].length > 0).map((s) => ({ id: s.id, titulo: s.titulo, icono: s.icono })),
        ],
        [listas],
    );

    useEffect(() => {
        if (abierto) marcarLanzamientoVisto();
    }, [abierto]);

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

    // Índice lateral: resalta la sección que domina la ventana de scroll.
    useEffect(() => {
        if (!abierto) return;
        const root = scrollRef.current;
        if (!root) return;
        const secciones = Array.from(root.querySelectorAll<HTMLElement>('[data-seccion]'));
        const visibles = new Map<string, number>();
        const obs = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    const id = (e.target as HTMLElement).dataset.seccion!;
                    if (e.isIntersecting) visibles.set(id, e.intersectionRatio);
                    else visibles.delete(id);
                }
                let mejor: [string, number] | null = null;
                for (const par of visibles) if (!mejor || par[1] > mejor[1]) mejor = par;
                if (mejor) setActiva(mejor[0]);
            },
            { root, threshold: [0.15, 0.35, 0.6] },
        );
        secciones.forEach((s) => obs.observe(s));
        return () => obs.disconnect();
    }, [abierto]);

    const irA = (id: string) => {
        const el = scrollRef.current?.querySelector<HTMLElement>(`#lz-${id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return createPortal(
        <AnimatePresence>
            {abierto && (
                <motion.div
                    key="lanzamiento-modal"
                    className="print:hidden fixed inset-0 z-[9998] flex items-center justify-center p-2 sm:p-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Actualización de ${BRAND.name}`}
                        className="relative w-full max-w-[1320px] h-[94vh] sm:h-[92vh] flex bg-[#07090F] text-white rounded-2xl sm:rounded-3xl shadow-[0_40px_120px_rgba(0,0,0,.7)] ring-1 ring-white/10 overflow-hidden"
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                    >
                        {/* ── Índice lateral (escritorio) ─────────────────────────── */}
                        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0A0D15]">
                            <div className="px-6 pt-7 pb-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{BRAND.name}</p>
                                <p className="mt-1 text-lg font-black leading-tight">Notas de la versión</p>
                                <p className="mt-1 text-xs text-white/40">{LANZAMIENTO.eyebrow}</p>
                            </div>
                            <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
                                {indice.map((s) => {
                                    const activo = activa === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => irA(s.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px] font-semibold transition-colors ${
                                                activo ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <span className={`w-0.5 h-4 rounded-full ${activo ? 'bg-violet-400' : 'bg-transparent'}`} />
                                            <Icon icon={s.icono} width={16} className={activo ? 'text-violet-300' : 'text-white/35'} />
                                            <span className="truncate">{s.titulo}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                            <div className="px-6 py-5 border-t border-white/[0.06]">
                                <p className="text-[11px] text-white/40">
                                    {totalCambios} cambios desde el {LANZAMIENTO.desde.split('-').reverse().join('/')}
                                </p>
                                {onVerHistorial && (
                                    <button
                                        type="button"
                                        onClick={onVerHistorial}
                                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-violet-300 hover:text-white transition-colors"
                                    >
                                        <Icon icon="solar:history-bold-duotone" width={14} />
                                        Ver historial completo
                                    </button>
                                )}
                            </div>
                        </aside>

                        {/* ── Contenido ───────────────────────────────────────────── */}
                        <div ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto overscroll-contain [scrollbar-color:rgba(255,255,255,.15)_transparent]">
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Cerrar"
                                className="fixed sm:absolute top-3 right-3 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/50 text-white/80 hover:bg-white hover:text-black ring-1 ring-white/15 transition-colors backdrop-blur"
                            >
                                <Icon icon="solar:close-circle-bold" width={22} />
                            </button>

                            {/* Hero */}
                            {/* En escritorio la imagen va en flujo (ancho completo, sin recorte) y el
                                texto se superpone sobre su mitad izquierda; en móvil se recorta anclada
                                a la derecha para que los personajes queden visibles. */}
                            <section
                                id="lz-resumen"
                                data-seccion="resumen"
                                className={`relative overflow-hidden flex flex-col justify-end min-h-[440px] ${heroVisible ? 'lg:grid lg:min-h-0' : 'sm:min-h-[500px]'}`}
                            >
                                {heroVisible ? (
                                    <motion.img
                                        src={LANZAMIENTO.heroImagen}
                                        alt=""
                                        onError={() => setHeroFallo(true)}
                                        initial={{ scale: reducido ? 1 : 1.08, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                                        className="absolute inset-0 w-full h-full object-cover object-right lg:relative lg:inset-auto lg:col-start-1 lg:row-start-1 origin-right"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,36,252,.55),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,.35),transparent_55%),linear-gradient(180deg,#141a2e_0%,#07090F_100%)]">
                                        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:40px_40px]" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#07090F] via-[#07090F]/70 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#07090F]/90 via-[#07090F]/40 to-transparent" />

                                <div className="relative lg:col-start-1 lg:row-start-1 lg:self-end px-6 sm:px-10 pt-20 pb-8 xl:pb-10 max-w-2xl lg:max-w-[52%]">
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                        className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-violet-300"
                                    >
                                        <span className="w-6 h-px bg-violet-400" />
                                        {LANZAMIENTO.eyebrow}
                                    </motion.p>
                                    <motion.h1
                                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                                        className="mt-3 text-4xl xl:text-5xl 2xl:text-6xl font-black uppercase leading-[0.95] tracking-tight drop-shadow-[0_6px_30px_rgba(0,0,0,.6)]"
                                    >
                                        {LANZAMIENTO.titulo}
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                        className="mt-3 text-[15px] xl:text-lg leading-relaxed text-white/75 max-w-2xl"
                                    >
                                        {LANZAMIENTO.subtitulo}
                                    </motion.p>
                                    <motion.div
                                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                                        className="mt-5 xl:mt-7 flex flex-wrap items-center gap-3"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => irA(LANZAMIENTO.destacados[0]?.id ?? 'lo-nuevo')}
                                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-sm font-black uppercase tracking-wide hover:bg-violet-200 transition-colors"
                                        >
                                            Ver lo nuevo
                                            <Icon icon="solar:alt-arrow-down-bold" width={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 ring-1 ring-white/15 text-sm font-bold transition-colors"
                                        >
                                            Ir al panel
                                        </button>
                                        <span className="ml-1 text-xs text-white/40">
                                            {listas.NUEVO.length} nuevas · {listas.MEJORA.length} mejoras · {listas.CORRECCION.length} correcciones
                                        </span>
                                    </motion.div>
                                </div>
                            </section>

                            {/* Índice en móvil/tablet: chips horizontales pegados arriba */}
                            <div className="lg:hidden sticky top-0 z-10 flex gap-2 overflow-x-auto px-4 py-2.5 bg-[#07090F]/90 backdrop-blur border-b border-white/[0.06] [scrollbar-width:none]">
                                {indice.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => irA(s.id)}
                                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ring-1 transition-colors ${
                                            activa === s.id ? 'bg-white text-black ring-white' : 'bg-white/5 text-white/60 ring-white/10'
                                        }`}
                                    >
                                        {s.titulo}
                                    </button>
                                ))}
                            </div>

                            {LANZAMIENTO.destacados.map((d, i) => (
                                <Destacado key={d.id} d={d} invertido={i % 2 === 1} planEmpresa={planEmpresa} root={scrollRef} />
                            ))}

                            {LANZAMIENTO.proximamente && <Proximamente p={LANZAMIENTO.proximamente} root={scrollRef} />}

                            {SECCIONES_LISTA.map((s) => {
                                const items = listas[s.tipo];
                                if (!items.length) return null;
                                return (
                                    <section key={s.id} id={`lz-${s.id}`} data-seccion={s.id} className="scroll-mt-6 px-6 sm:px-10 py-10 sm:py-12 border-t border-white/[0.06]">
                                        <div className="flex items-end gap-4 mb-6">
                                            <div>
                                                <p className={`inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] ${s.color}`}>
                                                    <Icon icon={s.icono} width={15} />
                                                    Notas de la versión
                                                </p>
                                                <h2 className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-tight">{s.titulo}</h2>
                                            </div>
                                            <span className="mb-1 text-sm font-bold text-white/35">{items.length}</span>
                                            <div className="flex-1 h-px bg-white/[0.08] mb-3" />
                                        </div>
                                        <motion.div
                                            className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                                            variants={{ oculto: {}, visible: { transition: { staggerChildren: 0.04 } } }}
                                            initial="oculto"
                                            whileInView="visible"
                                            viewport={{ root: scrollRef, once: true, amount: 0.1 }}
                                        >
                                            {items.map((n) => (
                                                <TarjetaCompacta key={n.id} n={n} planEmpresa={planEmpresa} />
                                            ))}
                                        </motion.div>
                                    </section>
                                );
                            })}

                            {/* Cierre */}
                            <section className="px-6 sm:px-10 py-10 border-t border-white/[0.06] bg-gradient-to-b from-transparent to-violet-950/30">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-lg font-black">¿Usas la app del celular?</p>
                                        <p className="mt-1 text-sm text-white/55 max-w-2xl">
                                            Las novedades salen primero en la web; la mayoría llega a la app en las siguientes actualizaciones. Vuelve a esta pantalla cuando quieras desde <strong className="text-white/80">Novedades</strong>, en el menú.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {onVerHistorial && (
                                            <button
                                                type="button"
                                                onClick={onVerHistorial}
                                                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 ring-1 ring-white/15 text-sm font-bold transition-colors"
                                            >
                                                Historial completo
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-black transition-colors"
                                        >
                                            Empezar
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
