import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Crispy" (app de comida / delivery).
 * Movimiento vivo pero corto (fades + pequeños "pop"), acorde a una app mobile.
 * Framer Motion desactiva la animación automáticamente con prefers-reduced-motion.
 */
export const foodEase = [0.34, 1.2, 0.64, 1] as const;

export const foodPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1], staggerChildren: 0.05 } },
};

export const foodSection: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

export const foodStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
};

export const foodCard: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: foodEase } },
};

export const foodViewport = { once: true, amount: 0.15 } as const;
export const foodTap = { scale: 0.94 };
