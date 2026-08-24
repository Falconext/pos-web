import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Luxora" (carteras & accesorios de lujo).
 * Transiciones editoriales, lentas y elegantes (400-800ms, easing suave) pensadas
 * para transmitir sofisticación sin distraer. Framer Motion desactiva la animación
 * automáticamente cuando el usuario tiene prefers-reduced-motion activo.
 */
export const luxEase = [0.22, 0.61, 0.36, 1] as const;

export const luxPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: luxEase, staggerChildren: 0.06 } },
};

export const luxSection: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: luxEase } },
};

export const luxStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const luxCard: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: luxEase } },
};

export const luxFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.9, ease: luxEase } },
};

export const luxViewport = { once: true, amount: 0.2 } as const;
export const luxHover = { y: -6 };
export const luxTap = { scale: 0.98 };
