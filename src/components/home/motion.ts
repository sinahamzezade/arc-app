export const soft = { type: "spring" as const, stiffness: 380, damping: 28 };
export const pop = { type: "spring" as const, stiffness: 480, damping: 34 };

export const sectionVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: soft },
};
