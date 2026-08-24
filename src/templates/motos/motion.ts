import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Voltia Motos" (venta de motos + servicio/taller).
 * Estética dark premium tech: entradas nítidas y con energía (250-650ms, easing decidido)
 * que transmiten velocidad y precisión sin marear. Framer Motion desactiva la animación
 * automáticamente cuando el usuario tiene prefers-reduced-motion activo.
 */
export const motoEase = [0.16, 0.84, 0.28, 1] as const;

export const motoPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: motoEase, staggerChildren: 0.05 } },
};

export const motoSection: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: motoEase } },
};

export const motoStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const motoCard: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: motoEase } },
};

export const motoFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: motoEase } },
};

export const motoViewport = { once: true, amount: 0.2 } as const;
export const motoHover = { y: -6 };
export const motoTap = { scale: 0.97 };
