import type { Transition, Variants } from 'framer-motion';

/** Curva de entrada suave con overshoot ligero — sensación "apetitosa" y rebotona. */
export const antojoEase: Transition['ease'] = [0.22, 1, 0.36, 1];

export const antojoViewport = { once: true, margin: '-80px' } as const;

export const antojoPage: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.35, ease: antojoEase, staggerChildren: 0.08, delayChildren: 0.03 },
  },
};

export const antojoSection: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: antojoEase },
  },
};

export const antojoStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const antojoCard: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: antojoEase },
  },
};

export const antojoPop: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.45, ease: antojoEase },
  },
};

export const antojoHover = {
  y: -8,
  scale: 1.015,
  transition: { duration: 0.22, ease: antojoEase },
};

export const antojoTap = { scale: 0.97 };
