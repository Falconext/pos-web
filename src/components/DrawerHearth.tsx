import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, animate, motion, stagger } from 'framer-motion';
import { useReducedMotionPreference } from '@/lib/motion/reducedMotion';

/**
 * Panel lateral del panel admin (estilo Hearth): fondo desenfocado y la hoja a
 * la derecha, despegada del borde. Va a <body> por portal para quedar sobre
 * todo, incluidos los cajones que se montan con z altos.
 *
 * Animación de apertura como la de Hearth: la hoja entra desde la derecha y,
 * detrás, los bloques del contenido suben en cascada. Para eso el contenido
 * marca su contenedor con `data-drawer-stagger`: se animan sus hijos directos.
 * `contentKey` vuelve a disparar la cascada cuando el contenido llega después
 * (p. ej. al terminar de cargar).
 */
export default function DrawerHearth({
    isOpen,
    onClose,
    label,
    contentKey,
    width = 540,
    zIndex = 1000,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    label: string;
    contentKey?: string | number | null;
    width?: number;
    zIndex?: number;
    children: ReactNode;
}) {
    const asideRef = useRef<HTMLElement | null>(null);
    const reduceMotion = useReducedMotionPreference();

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        // En captura: otros listeners de la pantalla no deben tragarse el Esc.
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [isOpen, onClose]);

    useLayoutEffect(() => {
        if (!isOpen || reduceMotion) return;
        const root = asideRef.current?.querySelector('[data-drawer-stagger]');
        if (!root) return;
        const bloques = Array.from(root.children) as HTMLElement[];
        if (!bloques.length) return;
        const controls = animate(
            bloques,
            { opacity: [0, 1], y: [14, 0] },
            { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: stagger(0.05, { startDelay: 0.08 }) },
        );
        return () => controls.stop();
    }, [isOpen, contentKey, reduceMotion]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0" style={{ zIndex }} role="dialog" aria-modal="true" aria-label={label}>
                    <motion.div
                        className="absolute inset-0 bg-[rgba(20,16,12,0.3)] backdrop-blur-[6px] dark:bg-black/60"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                    />
                    <motion.aside
                        ref={asideRef}
                        className="absolute bottom-3 right-3 top-3 overflow-y-auto rounded-[24px] border border-[rgba(40,30,20,0.09)] bg-[#fffdfa] p-6 shadow-[0_24px_60px_-18px_rgba(40,30,20,0.32),0_2px_6px_rgba(40,30,20,0.08)] sm:p-7 dark:border-white/10 dark:bg-slate-900"
                        style={{ width: `min(${width}px, calc(100vw - 24px))` }}
                        initial={reduceMotion ? { opacity: 0 } : { x: 60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { x: 60, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="absolute right-5 top-5 z-[2] grid h-11 w-11 place-items-center rounded-xl border border-[rgba(40,30,20,0.09)] bg-[#fffdfa] text-[#1d1915] transition-colors hover:bg-[#f7f3ed] dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
                        >
                            <Icon icon="lucide:x" width={18} />
                        </button>
                        {children}
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

// ── Piezas comunes de los paneles ──────────────────────────────────────────────

export const DRAWER_BTN = 'inline-flex h-11 items-center gap-2 rounded-xl border border-[rgba(40,30,20,0.12)] bg-[#fffdfa] px-4 text-[14px] font-bold text-[#1d1915] transition-colors hover:border-[rgba(40,30,20,0.2)] hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700';
export const DRAWER_H3 = 'mb-2 text-[17px] font-bold text-[#1d1915] dark:text-slate-100';
export const DRAWER_ROW = 'flex items-start justify-between gap-4 border-b border-[rgba(40,30,20,0.09)] py-3.5 last:border-0 dark:border-white/10';
export const DRAWER_INPUT = 'h-11 min-w-0 flex-1 rounded-xl border border-[rgba(40,30,20,0.12)] bg-[#fffdfa] px-3 text-sm text-[#1d1915] placeholder:text-[#978f86] outline-none focus:border-[rgba(40,30,20,0.32)] focus:ring-[3px] focus:ring-[rgba(40,30,20,0.07)] dark:border-white/10 dark:bg-slate-800 dark:text-slate-100';
/** Bloque gris del monto principal (como el "Last sync" de Hearth). */
export const DRAWER_WELL = 'flex items-center justify-between gap-4 rounded-2xl bg-[#f3eee6] px-5 py-4 dark:bg-slate-800/70';
export const DRAWER_MONTO_STYLE = { fontFamily: "'Bricolage Grotesque', 'Manrope', sans-serif" };

/** Cabecera: ícono en cuadro de color + título + subtítulo. */
export function DrawerHeader({
    icon,
    title,
    subtitle,
    tone = 'iris',
}: {
    icon: string;
    title: ReactNode;
    subtitle?: ReactNode;
    tone?: 'iris' | 'spruce' | 'ember' | 'saffron';
}) {
    const tonos = {
        iris: 'bg-[#e8e6fb] text-[#4a41c4] dark:bg-[#7a72e6]/20 dark:text-[#aaa4f5]',
        spruce: 'bg-[#dcf2ec] text-[#0a7a63] dark:bg-emerald-500/15 dark:text-emerald-300',
        ember: 'bg-[#fbe6dd] text-[#b53f19] dark:bg-orange-500/15 dark:text-orange-300',
        saffron: 'bg-[#f8ecd2] text-[#8f600a] dark:bg-amber-500/15 dark:text-amber-300',
    };
    return (
        <header className="flex items-start gap-4 pr-12">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${tonos[tone]}`}>
                <Icon icon={icon} width={26} />
            </span>
            <div className="min-w-0">
                <h2 className="text-[24px] font-bold leading-tight text-[#1d1915] dark:text-slate-100">{title}</h2>
                {subtitle && (
                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[14px] font-semibold text-[#6b645c] dark:text-slate-400">
                        {subtitle}
                    </div>
                )}
            </div>
        </header>
    );
}

/** Estado con punto de color. */
export function DrawerEstado({ label, tone }: { label: string; tone: 'spruce' | 'iris' | 'saffron' | 'ember' | 'plain' }) {
    const map = {
        spruce: ['bg-[#0a8f74]', 'text-[#0a7a63] dark:text-emerald-300'],
        iris: ['bg-[#5b52d6]', 'text-[#4a41c4] dark:text-indigo-300'],
        saffron: ['bg-[#c98a12]', 'text-[#8f600a] dark:text-amber-300'],
        ember: ['bg-[#e4572e]', 'text-[#b53f19] dark:text-orange-300'],
        plain: ['bg-[#978f86]', 'text-[#6b645c] dark:text-slate-400'],
    }[tone];
    return (
        <span className={`inline-flex items-center gap-1.5 ${map[1]}`}>
            <span className={`h-2 w-2 rounded-full ${map[0]}`} />
            {label}
        </span>
    );
}

/** Dato etiqueta/valor para la grilla de dos columnas. */
export function DrawerDato({ label, value, extra }: { label: string; value: ReactNode; extra?: string[] }) {
    return (
        <div className="min-w-0">
            <dt className="text-[13px] font-semibold text-[#6b645c] dark:text-slate-400">{label}</dt>
            <dd className="mt-0.5 break-words text-[15px] font-bold text-[#1d1915] dark:text-slate-100">{value}</dd>
            {extra?.map((t) => (
                <dd key={t} className="text-[13px] text-[#6b645c] dark:text-slate-400">{t}</dd>
            ))}
        </div>
    );
}

export function DrawerCargando({ texto = 'Cargando…' }: { texto?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#978f86]">
            <Icon icon="line-md:loading-twotone-loop" className="text-4xl" />
            <span className="text-sm">{texto}</span>
        </div>
    );
}
