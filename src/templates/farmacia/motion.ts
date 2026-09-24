import type { Variants } from 'framer-motion';

/**
 * Sistema de movimiento de la plantilla Farmacia (MediCare).
 * Clínico y confiable: entradas suaves (ease-out expo), sin rebotes exagerados.
 * Solo anima transform/opacity (60fps). <MotionConfig reducedMotion="user"> en el
 * home desactiva los desplazamientos si el usuario pide reducir movimiento.
 */
export const fmEase = [0.22, 1, 0.36, 1] as const;

/** Bloque de sección que aparece al hacer scroll. */
export const fmReveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: fmEase } },
};

/** Contenedor que escalona a sus hijos. */
export const fmStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** Ítem de grilla (cards, tiles). */
export const fmItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: fmEase } },
};

/** Texto del hero, entra por líneas. */
export const fmHeroText: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: fmEase } },
};

export const fmViewport = { once: true, amount: 0.15 } as const;

/** Tinte de un color de marca sobre blanco (funciona con hex, rgb o nombres). */
export const mix = (color: string, pct: number, base = 'white') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
