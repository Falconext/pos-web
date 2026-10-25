import type { Variants } from 'framer-motion';

/**
 * Sistema de movimiento de la plantilla Amora (carteras · estilo "ofertas").
 * Enérgico pero corto: entradas con un leve rebote, escalonado con tope. Solo transform/opacity.
 * Cada página envuelve en <MotionConfig reducedMotion="user">.
 */
export const amEase = [0.22, 1, 0.36, 1] as const;
/** Salida con un pequeño sobrepaso (para tarjetas y stickers). */
export const amPop = [0.34, 1.4, 0.64, 1] as const;

/** Bloque de sección que aparece al hacer scroll. */
export const amReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: amEase } },
};

/** Contenedor que escalona a sus hijos. */
export const amStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Ítem de grilla (cards, tiles): sube y escala apenas. */
export const amItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: amPop } },
};

/** Texto del hero, entra por líneas. */
export const amHeroText: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: amEase } },
};

/** Ítem con escalonado propio y tope (grillas largas terminan de entrar en <0.6s). */
export const amCardIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: amEase, delay: Math.min(i, 12) * 0.035 } }),
};

export const amViewport = { once: true, amount: 0.15 } as const;

/** Mezcla de un color de marca con otro (funciona con hex, rgb o nombres). */
export const mix = (color: string, pct: number, base = 'white') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
