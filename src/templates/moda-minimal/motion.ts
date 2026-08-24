import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Norda" (moda minimalista, estilo Everlane).
 * Movimiento muy sobrio: fades cortos y desplazamientos pequeños que refuerzan la
 * estética limpia y editorial sin distraer. Framer Motion desactiva la animación
 * automáticamente cuando el usuario tiene prefers-reduced-motion activo.
 */
export const minEase = [0.4, 0, 0.2, 1] as const;

export const minPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: minEase, staggerChildren: 0.05 } },
};

export const minSection: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: minEase } },
};

export const minStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const minCard: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: minEase } },
};

export const minFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: minEase } },
};

export const minViewport = { once: true, amount: 0.2 } as const;
export const minHover = { y: -3 };
export const minTap = { scale: 0.99 };
