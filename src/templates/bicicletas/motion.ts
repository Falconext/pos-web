import type { Variants } from 'framer-motion';

/**
 * Variantes de movimiento para la plantilla "Vonica" (bicicletas & deportes).
 * Transiciones enérgicas y deportivas (250-500ms, easing con carácter) pensadas
 * para transmitir velocidad y potencia sin sacrificar legibilidad. Framer Motion
 * respeta prefers-reduced-motion automáticamente.
 */
export const veloEase = [0.16, 0.84, 0.32, 1] as const;

export const veloPage: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: veloEase, staggerChildren: 0.05 } },
};

export const veloSection: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: veloEase } },
};

export const veloStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const veloCard: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: veloEase } },
};

export const veloFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: veloEase } },
};

export const veloViewport = { once: true, amount: 0.2 } as const;
export const veloHover = { y: -6 };
export const veloTap = { scale: 0.97 };
