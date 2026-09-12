import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { BRAND } from '@/lib/branding';
import { TOUR_STEPS, type TourStep } from './useWelcomeTour';

interface TourSpotlightProps {
    step: number;
    onNext: () => void;
    onPrev: () => void;
    onEnd: () => void;
}

interface Rect { top: number; left: number; width: number; height: number; }

const ACCENT = BRAND.panelAccent || BRAND.primaryColor || '#7C3AED';
const PAD = 6;
const TOOLTIP_W = 272;
const GAP = 14;

const isVisibleElement = (el: HTMLElement): boolean => {
    let current: HTMLElement | null = el;
    while (current) {
        const style = window.getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
            return false;
        }
        current = current.parentElement;
    }
    const rect = el.getBoundingClientRect();
    const inViewport =
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth;
    return rect.width > 0 && rect.height > 0 && inViewport;
};

const findInSidebar = (selector: string): HTMLElement | null =>
    Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
        (el) => Boolean(el.closest('aside')) && isVisibleElement(el),
    ) ?? null;

/** Candidatos del paso: el principal y sus alternativas, en orden. */
const candidatosDe = (step: TourStep) => [{ modulo: step.modulo, sub: step.sub }, ...(step.alternativas ?? [])];

/**
 * Pide al sidebar abrir el módulo del paso (solo tiene efecto si el módulo
 * existe y tiene submódulos). Se llama una vez por paso, antes de buscar.
 */
const abrirModuloDelPaso = (step: TourStep) => {
    for (const c of candidatosDe(step)) {
        if (c.sub && findInSidebar(`[data-tour="mod:${c.modulo}"]`)) {
            window.dispatchEvent(new CustomEvent('tour:open-module', { detail: c.modulo }));
            return;
        }
    }
};

/**
 * Elemento a resaltar: el submódulo (ya abierto) o, si el plan no lo tiene, el
 * módulo. El dashboard es un enlace simple, así que cae en la rama de módulo.
 */
const getTargetElement = (step: TourStep, permitirModulo = true): HTMLElement | null => {
    for (const c of candidatosDe(step)) {
        if (c.sub) {
            const sub = findInSidebar(`[data-tour="sub:${c.sub}"]`);
            if (sub) return sub;
        }
    }
    // Mientras el acordeón se abre, el submódulo todavía no existe: se espera
    // (permitirModulo=false) antes de conformarse con resaltar el módulo.
    if (!permitirModulo) return null;
    for (const c of candidatosDe(step)) {
        const mod = findInSidebar(`[data-tour="mod:${c.modulo}"]`);
        if (mod) return mod;
    }
    // Dashboard legacy (plan sin módulo dashboard).
    if (step.modulo === 'dashboard') return findInSidebar('[data-tour="dashboard"]');
    return null;
};

export const TourSpotlight: React.FC<TourSpotlightProps> = ({ step, onNext, onPrev, onEnd }) => {
    const current = TOUR_STEPS[step];
    const tooltipRef = useRef<HTMLDivElement>(null);

    // rect = null → overlay invisible (entre pasos)
    const [rect, setRect] = useState<Rect | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const [tooltipReady, setTooltipReady] = useState(false);
    const [targetMissing, setTargetMissing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let findRafId = 0;
        let settleRafId = 0;
        let settleTimeoutId: ReturnType<typeof setTimeout> | null = null;
        // 1. Resetear inmediatamente al cambiar paso -> overlay oculto
        setRect(null);
        setTooltipReady(false);
        setTargetMissing(false);

        const startTracking = (el: HTMLElement) => {
            if (cancelled) return;
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

            let samples = 0;
            let stableSamples = 0;
            let lastSignature = '';

            const setCurrentRect = () => {
                if (cancelled) return;
                const r = el.getBoundingClientRect();
                if (r.width <= 0 || r.height <= 0) return;
                setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
            };

            const updateUntilStable = () => {
                if (cancelled) return;
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) {
                    const signature = `${Math.round(r.top)}:${Math.round(r.left)}:${Math.round(r.width)}:${Math.round(r.height)}`;
                    if (signature === lastSignature) {
                        stableSamples += 1;
                    } else {
                        stableSamples = 0;
                        lastSignature = signature;
                    }
                    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
                }

                samples += 1;
                if (stableSamples < 2 && samples < 36) {
                    settleRafId = window.requestAnimationFrame(updateUntilStable);
                }
            };

            settleTimeoutId = setTimeout(() => {
                settleRafId = window.requestAnimationFrame(updateUntilStable);
            }, 80);

            window.addEventListener('resize', setCurrentRect);
            window.addEventListener('scroll', setCurrentRect, true);

            return () => {
                window.removeEventListener('resize', setCurrentRect);
                window.removeEventListener('scroll', setCurrentRect, true);
            };
        };

        let cleanupTracking: (() => void) | undefined;

        // Abrir el módulo (acordeón) y esperar a que el submódulo exista y termine
        // de animarse antes de medirlo.
        abrirModuloDelPaso(current);

        const resolveTargetElement = (attempt = 0) => {
            if (cancelled) return;

            // ~45 frames (≈750 ms) para que aparezca el submódulo; después vale el módulo.
            const found = getTargetElement(current, attempt >= 45);

            if (found) {
                cleanupTracking = startTracking(found);
                return;
            }

            if (attempt < 90) {
                findRafId = window.requestAnimationFrame(() => resolveTargetElement(attempt + 1));
            } else {
                setTargetMissing(true);
                setTooltipReady(true);
            }
        };

        resolveTargetElement();

        return () => {
            cancelled = true;
            if (settleTimeoutId) clearTimeout(settleTimeoutId);
            window.cancelAnimationFrame(findRafId);
            window.cancelAnimationFrame(settleRafId);
            cleanupTracking?.();
        };
    }, [step, current]);

    // 3. Posicionar tooltip midiendo su altura real
    useLayoutEffect(() => {
        if (!rect || !tooltipRef.current) return;

        const th = tooltipRef.current.getBoundingClientRect().height || 100;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let left = rect.left + rect.width + GAP;
        let top = rect.top + rect.height / 2 - th / 2;

        if (left + TOOLTIP_W > vw - 8) left = rect.left - TOOLTIP_W - GAP;

        // Si el elemento está muy arriba, evita "pegar" el tooltip al borde:
        // mostrar debajo del target mantiene una percepción más centrada.
        if (top < 8) {
            top = rect.top + rect.height + GAP;
        }

        // Si se va por abajo, súbelo arriba del target.
        if (top + th > vh - 8) {
            top = rect.top - th - GAP;
        }

        top = Math.max(8, Math.min(top, vh - th - 8));

        setTooltipPos({ top, left });
        setTooltipReady(true);
    }, [rect]);

    const isLast = step === TOUR_STEPS.length - 1;

    // Si aún está buscando objetivo, no renderiza nada.
    if (!rect && !targetMissing) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: 'none' }}>

            {/* Overlay */}
            {rect ? (
                <div
                    style={{
                        position: 'absolute',
                        top: rect.top - PAD,
                        left: rect.left - PAD,
                        width: rect.width + PAD * 2,
                        height: rect.height + PAD * 2,
                        borderRadius: 10,
                        boxShadow: `0 0 0 9999px rgba(0,0,0,0.52)`,
                        outline: `2.5px solid ${ACCENT}`,
                        pointerEvents: 'none',
                    }}
                />
            ) : (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.52)',
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Tooltip — fade-in suave una vez posicionado */}
            <div
                ref={tooltipRef}
                className="absolute rounded-2xl shadow-2xl bg-white dark:bg-[#1a1f2e]
                           border border-gray-100 dark:border-white/10 p-5"
                style={{
                    top: rect ? tooltipPos.top  : '50%',
                    left: rect ? tooltipPos.left : '50%',
                    transform: rect ? 'none' : 'translate(-50%, -50%)',
                    width: TOOLTIP_W,
                    opacity: tooltipReady ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: 'all',
                    zIndex: 9999,
                }}
            >
                {/* Icono + meta */}
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${ACCENT}18` }}
                    >
                        <Icon icon={current.icon} style={{ color: ACCENT, fontSize: 20 }} />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Paso {step + 1} de {TOUR_STEPS.length}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                            {current.title}
                        </p>
                    </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    {current.description}
                </p>
                {!rect && targetMissing && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-3">
                        Este elemento no estuvo visible, pero puedes continuar el tour sin perder pasos.
                    </p>
                )}

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 mb-3">
                    {TOUR_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width: i === step ? 18 : 6,
                                height: 6,
                                background: i === step ? ACCENT : `${ACCENT}28`,
                            }}
                        />
                    ))}
                </div>

                {/* Botones */}
                <div className="flex items-center gap-2">
                    {step > 0 && (
                        <button
                            onClick={onPrev}
                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                                       bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400
                                       hover:bg-gray-200 dark:hover:bg-white/12 transition-colors"
                        >
                            <Icon icon="solar:arrow-left-linear" style={{ fontSize: 15 }} />
                        </button>
                    )}
                    <button
                        onClick={isLast ? onEnd : onNext}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all
                                   hover:opacity-90 active:scale-[0.98]"
                        style={{ background: ACCENT }}
                    >
                        {isLast ? '¡Listo, empecemos!' : 'Siguiente →'}
                    </button>
                    <button
                        onClick={onEnd}
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                                   text-gray-300 dark:text-gray-600 hover:text-gray-500 transition-colors"
                        title="Saltar tour"
                    >
                        <Icon icon="solar:close-square-linear" style={{ fontSize: 16 }} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
