import type { Variants } from 'framer-motion';

/**
 * Sistema de movimiento de la plantilla Hoodie (Drop culture).
 * Cinético y directo: entradas rápidas y secas (ease-out expo corto), nada flotante.
 * Solo anima transform/opacity. Cada página envuelve en <MotionConfig reducedMotion="user">.
 */
export const hdEase = [0.22, 1, 0.36, 1] as const;

/** Bloque de sección que aparece al hacer scroll. */
export const hdReveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: hdEase } },
};

/** Contenedor que escalona a sus hijos. */
export const hdStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

/** Ítem de grilla (cards, tiles). */
export const hdItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: hdEase } },
};

/** Texto del hero, entra por líneas. */
export const hdHeroText: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: hdEase } },
};

/** Ítem con escalonado propio y tope (grillas largas terminan de entrar en <0.6s). */
export const hdCardIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: hdEase, delay: Math.min(i, 12) * 0.035 } }),
};

export const hdViewport = { once: true, amount: 0.15 } as const;

/** Mezcla de un color de marca con otro (funciona con hex, rgb o nombres). */
export const mix = (color: string, pct: number, base = 'white') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
