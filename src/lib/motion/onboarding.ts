import type { Transition, Variants } from "framer-motion";

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 480,
  damping: 34,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 28,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 20,
};

export const easeSmooth: Transition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
};

/** Page wrapper — no opacity fade (prevents white flash). Children stagger only. */
export const pageVariants: Variants = {
  hidden: {},
  visible: {
    transition: { when: "beforeChildren", staggerChildren: 0.035, delayChildren: 0 },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.01 },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: springSnappy },
};

export const slideUpPanel: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const mascotEnter: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20, rotate: -2 },
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
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

export const otpSlot: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springSnappy, delay: i * 0.03 },
  }),
};

export const checkPop: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: springBouncy },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.1 } },
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
