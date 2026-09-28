import type { Variants } from 'framer-motion';

/**
 * Sistema de movimiento de la plantilla Mueblería (Nórdica).
 * Sereno y cálido: entradas con ease-out expo, sin rebotes.
 * Solo anima transform/opacity. Cada página envuelve en <MotionConfig reducedMotion="user">.
 */
export const ndEase = [0.22, 1, 0.36, 1] as const;

/** Bloque de sección que aparece al hacer scroll. */
export const ndReveal: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: ndEase } },
};

/** Contenedor que escalona a sus hijos. */
export const ndStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Ítem de grilla (cards, tiles). */
export const ndItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: ndEase } },
};

/** Texto del hero, entra por líneas. */
export const ndHeroText: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: ndEase } },
};

/** Ítem con escalonado propio y tope (grillas largas terminan de entrar en <0.6s). */
export const ndCardIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: ndEase, delay: Math.min(i, 12) * 0.035 } }),
};

export const ndViewport = { once: true, amount: 0.15 } as const;

/** Mezcla de un color de marca con otro (funciona con hex, rgb o nombres). */
export const mix = (color: string, pct: number, base = 'white') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
