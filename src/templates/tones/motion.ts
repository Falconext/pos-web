import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Tones" (ropa infantil / familiar).
 * Transiciones suaves y cálidas (250-750ms, easing amable) acordes a la estética
 * beige/marrón premium. Framer Motion respeta `prefers-reduced-motion`.
 */
export const tnEase = [0.22, 0.61, 0.36, 1] as const;

export const tnPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45, ease: tnEase, staggerChildren: 0.06 } },
};

export const tnSection: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: tnEase } },
};

export const tnStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const tnCard: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: tnEase } },
};

export const tnFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: tnEase } },
};

export const tnViewport = { once: true, amount: 0.2 } as const;
export const tnHover = { y: -5 };
export const tnTap = { scale: 0.98 };
