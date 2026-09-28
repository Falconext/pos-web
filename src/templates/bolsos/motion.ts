import type { Variants } from 'framer-motion';

/**
 * Sistema de movimiento de la plantilla Bolsos (Rosé).
 * Lujo sereno: entradas lentas y suaves, sin rebotes. Solo anima transform/opacity.
 * Cada página envuelve en <MotionConfig reducedMotion="user">.
 */
export const rsEase = [0.22, 1, 0.36, 1] as const;

/** Bloque de sección que aparece al hacer scroll. */
export const rsReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: rsEase } },
};

/** Contenedor que escalona a sus hijos. */
export const rsStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** Ítem de grilla (cards, tiles). */
export const rsItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: rsEase } },
};

/** Texto del hero, entra por líneas. */
export const rsHeroText: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: rsEase } },
};

/** Ítem con escalonado propio y tope (grillas largas terminan de entrar en <0.6s). */
export const rsCardIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: rsEase, delay: Math.min(i, 12) * 0.035 } }),
};

export const rsViewport = { once: true, amount: 0.15 } as const;

/** Mezcla de un color de marca con otro (funciona con hex, rgb o nombres). */
export const mix = (color: string, pct: number, base = 'white') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
