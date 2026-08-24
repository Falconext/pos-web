import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Urbanic" (ropa de hombre / moda urbana premium).
 * Transiciones editoriales y elegantes (400-800ms, easing suave) pensadas para transmitir
 * carácter y sofisticación masculina sin distraer. Framer Motion desactiva la animación
 * automáticamente cuando el usuario tiene prefers-reduced-motion activo.
 */
export const urbEase = [0.22, 0.61, 0.36, 1] as const;

export const urbPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: urbEase, staggerChildren: 0.06 } },
};

export const urbSection: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: urbEase } },
};

export const urbStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const urbCard: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: urbEase } },
};

export const urbFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.9, ease: urbEase } },
};

export const urbViewport = { once: true, amount: 0.2 } as const;
export const urbHover = { y: -6 };
export const urbTap = { scale: 0.98 };
