import type { Variants } from 'framer-motion';

/**
 * Sistema de movimiento de la plantilla Olmo (carteras · editorial verde botella y crema).
 * Sereno y corto: entradas suaves sin rebote, escalonado con tope. Solo transform/opacity.
 * Cada página envuelve en <MotionConfig reducedMotion="user">.
 */
export const olEase = [0.22, 1, 0.36, 1] as const;
/** Curva más suave para piezas grandes (imagen del hero, banners). */
export const olPop = [0.16, 1, 0.3, 1] as const;

/** Bloque de sección que aparece al hacer scroll. */
export const olReveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: olEase } },
};

/** Contenedor que escalona a sus hijos. */
export const olStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** Ítem de grilla (cards, círculos): sube apenas. */
export const olItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: olPop } },
};

/** Texto del hero, entra por líneas. */
export const olHeroText: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: olEase } },
};

/** Ítem con escalonado propio y tope (grillas largas terminan de entrar en <0.6s). */
export const olCardIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: olEase, delay: Math.min(i, 12) * 0.035 } }),
};

export const olViewport = { once: true, amount: 0.15 } as const;

/** Mezcla de un color de marca con otro (funciona con hex, rgb o nombres). */
export const mix = (color: string, pct: number, base = 'white') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
