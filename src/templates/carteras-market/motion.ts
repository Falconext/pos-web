import type { Variants } from 'framer-motion';

/**
 * Movimiento de la plantilla Verena (carteras · marketplace premium).
 * Entradas suaves sin rebote, solo transform/opacity. Las páginas envuelven todo en
 * <MotionConfig reducedMotion="user"> para respetar "reducir movimiento".
 */
export const vrEase = [0.22, 1, 0.36, 1] as const;

/** Bloque de sección que aparece al hacer scroll. */
export const vrReveal: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: vrEase } },
};

/** Contenedor que escalona a sus hijos (con tope: los hijos usan delay propio). */
export const vrStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Ítem de grilla (cards, tiles). */
export const vrItem: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: vrEase } },
};

/** Texto del hero, entra por líneas. */
export const vrHeroText: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: vrEase } },
};

/** Ítem de grilla larga: escalonado por índice con tope (la grilla termina de entrar en <0.6s). */
export const vrCardIn: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: vrEase, delay: Math.min(i, 12) * 0.035 } }),
};

export const vrViewport = { once: true, amount: 0.15 } as const;

/** Tinte de un color de marca sobre una base (funciona con hex, rgb o nombres). */
export const mix = (color: string, pct: number, base = 'white') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
