import type { Variants } from 'framer-motion';

/**
 * Sistema de movimiento de la plantilla Hogar (Calma).
 * Sereno y táctil: entradas suaves, sin rebotes. Solo anima transform/opacity.
 * Cada página envuelve en <MotionConfig reducedMotion="user">.
 */
export const cmEase = [0.22, 1, 0.36, 1] as const;

/** Bloque de sección que aparece al hacer scroll. */
export const cmReveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: cmEase } },
};

/** Contenedor que escalona a sus hijos. */
export const cmStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Ítem de grilla (cards, tiles). */
export const cmItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: cmEase } },
};

/** Texto del hero, entra por líneas. */
export const cmHeroText: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: cmEase } },
};

/** Ítem con escalonado propio y tope (grillas largas terminan de entrar en <0.6s). */
export const cmCardIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: cmEase, delay: Math.min(i, 12) * 0.035 } }),
};

export const cmViewport = { once: true, amount: 0.15 } as const;

/** Mezcla de un color de marca con otro (funciona con hex, rgb o nombres). */
export const mix = (color: string, pct: number, base = 'white') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
