import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Grogin" (abarrotes / supermercado).
 * Transiciones limpias y ágiles (200-450ms) tipo e-commerce, con stagger de grilla.
 * Framer Motion desactiva la animación con prefers-reduced-motion activo.
 */
export const groEase = [0.22, 0.61, 0.36, 1] as const;

export const groPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: groEase, staggerChildren: 0.05 } },
};

export const groSection: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: groEase } },
};

export const groStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const groCard: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: groEase } },
};

export const groFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: groEase } },
};

export const groViewport = { once: true, amount: 0.15 } as const;
export const groHover = { y: -5 };
export const groTap = { scale: 0.97 };
