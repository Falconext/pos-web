import type { Variants } from 'framer-motion';

/**
 * Sistema de movimiento de la plantilla Maquillaje (Blush).
 * Lujo sereno: entradas suaves y cortas, sin rebotes. Solo anima transform/opacity.
 * Cada página envuelve en <MotionConfig reducedMotion="user">.
 */
export const blEase = [0.22, 1, 0.36, 1] as const;

/** Bloque de sección que aparece al hacer scroll. */
export const blReveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: blEase } },
};

/** Contenedor que escalona a sus hijos. */
export const blStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Ítem de grilla (cards, tiles). */
export const blItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: blEase } },
};

/** Texto del hero, entra por líneas. */
export const blHeroText: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: blEase } },
};

/** Ítem con escalonado propio y tope (grillas largas terminan de entrar en <0.6s). */
export const blCardIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: blEase, delay: Math.min(i, 12) * 0.035 } }),
};

export const blViewport = { once: true, amount: 0.15 } as const;

/** Mezcla de un color de marca con otro (funciona con hex, rgb o nombres). */
export const mix = (color: string, pct: number, base = 'white') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
