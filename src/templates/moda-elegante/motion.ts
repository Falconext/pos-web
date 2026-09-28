import type { Variants } from 'framer-motion';

/**
 * Sistema de movimiento de la plantilla Moda Elegante (Élan).
 * Lujo minimal: entradas lentas y cortas en recorrido, sin rebotes.
 * Solo anima transform/opacity. Cada página envuelve en <MotionConfig reducedMotion="user">.
 */
export const elEase = [0.22, 1, 0.36, 1] as const;

/** Bloque de sección que aparece al hacer scroll. */
export const elReveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: elEase } },
};

/** Contenedor que escalona a sus hijos. */
export const elStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Ítem de grilla (cards, tiles). */
export const elItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: elEase } },
};

/** Texto del hero, entra por líneas. */
export const elHeroText: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: elEase } },
};

/** Ítem con escalonado propio y tope (grillas largas terminan de entrar en <0.6s). */
export const elCardIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: elEase, delay: Math.min(i, 12) * 0.035 } }),
};

export const elViewport = { once: true, amount: 0.15 } as const;

/** Mezcla de un color de marca con otro (funciona con hex, rgb o nombres). */
export const mix = (color: string, pct: number, base = 'white') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
