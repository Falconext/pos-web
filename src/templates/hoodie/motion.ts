import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Hoodie" (ropa urbana / streetwear).
 * Transiciones editoriales limpias (200-700ms, easing suave) que refuerzan la
 * estética magazine beige/negro sin distraer. Framer Motion respeta
 * automáticamente `prefers-reduced-motion`.
 */
export const hdEase = [0.22, 0.61, 0.36, 1] as const;

export const hdPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45, ease: hdEase, staggerChildren: 0.06 } },
};

export const hdSection: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: hdEase } },
};

export const hdStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const hdCard: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: hdEase } },
};

export const hdFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: hdEase } },
};

export const hdViewport = { once: true, amount: 0.2 } as const;
export const hdHover = { y: -5 };
export const hdTap = { scale: 0.98 };
