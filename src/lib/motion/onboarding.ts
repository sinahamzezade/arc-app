import type { Transition, Variants } from "framer-motion";

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 26,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 18,
};

export const easeSmooth: Transition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

export const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.06 },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: springSnappy },
};

export const slideUpPanel: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const mascotEnter: Variants = {
  hidden: { opacity: 0, scale: 0.82, y: 40, rotate: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    transition: springBouncy,
  },
};

export const dividerGrow: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export const otpSlot: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springSnappy, delay: i * 0.07 },
  }),
};

export const checkPop: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: springBouncy },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.15 } },
};

export const floatY = {
  y: [0, -10, 0],
  transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const },
};

export const pulseGlow = {
  boxShadow: [
    "0 8px 24px rgba(107, 78, 255, 0.25)",
    "0 8px 32px rgba(107, 78, 255, 0.45)",
    "0 8px 24px rgba(107, 78, 255, 0.25)",
  ],
  transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const },
};
