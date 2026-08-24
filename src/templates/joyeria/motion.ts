import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Aurum" (joyería de alta gama).
 * Transiciones editoriales, lentas y elegantes (400-900ms, easing suave) pensadas
 * para transmitir lujo y sofisticación sin distraer. Framer Motion desactiva la
 * animación automáticamente cuando el usuario tiene prefers-reduced-motion activo.
 */
export const aurEase = [0.22, 0.61, 0.36, 1] as const;

export const aurPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: aurEase, staggerChildren: 0.06 } },
};

export const aurSection: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: aurEase } },
};

export const aurStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const aurCard: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: aurEase } },
};

export const aurFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.95, ease: aurEase } },
};

export const aurViewport = { once: true, amount: 0.2 } as const;
export const aurHover = { y: -6 };
export const aurTap = { scale: 0.98 };
