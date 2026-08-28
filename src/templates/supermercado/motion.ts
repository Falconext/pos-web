import type { Variants } from 'framer-motion';

/** Movimiento para la plantilla "FreshMart" (supermercado de comestibles). Limpio y ágil. */
export const fmEase = [0.22, 0.61, 0.36, 1] as const;

export const fmPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: fmEase, staggerChildren: 0.05 } },
};

export const fmSection: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: fmEase } },
};

export const fmStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const fmCard: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: fmEase } },
};

export const fmFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: fmEase } },
};

export const fmViewport = { once: true, amount: 0.15 } as const;
export const fmHover = { y: -5 };
export const fmTap = { scale: 0.97 };
