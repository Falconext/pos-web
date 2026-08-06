import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Aura Spa" (belleza & bienestar).
 * Transiciones suaves y elegantes (400-700ms, easing premium), pensadas para
 * transmitir relajación y lujo sin distraer. Respeta prefers-reduced-motion vía
 * Framer Motion (que lo desactiva automáticamente).
 */
export const spaEase = [0.22, 0.61, 0.36, 1] as const;

export const spaPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: spaEase, staggerChildren: 0.06 } },
};

export const spaSection: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: spaEase } },
};

export const spaStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const spaCard: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: spaEase } },
};

export const spaFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.9, ease: spaEase } },
};

export const spaViewport = { once: true, amount: 0.2 } as const;
export const spaHover = { y: -6 };
export const spaTap = { scale: 0.98 };
