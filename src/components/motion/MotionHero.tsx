"use client";

import { motion } from "framer-motion";
import { floatY, mascotEnter } from "@/lib/motion/onboarding";
import { cn } from "@/lib/utils";

type MotionHeroProps = {
  children: React.ReactNode;
  className?: string;
  float?: boolean;
};

export function MotionHero({ children, className, float = true }: MotionHeroProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={mascotEnter}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="relative h-full w-full"
        animate={float ? floatY : undefined}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
