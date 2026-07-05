"use client";

import { motion, type Variants } from "framer-motion";
import {
  fadeDown,
  fadeUp,
  scaleIn,
  slideUpPanel,
} from "@/lib/motion/onboarding";
import { cn } from "@/lib/utils";

const variantMap = {
  fadeUp,
  fadeDown,
  scaleIn,
  slideUpPanel,
} as const;

type MotionRevealProps = {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof variantMap;
  custom?: Variants;
  as?: "div" | "header" | "footer" | "section" | "form" | "p" | "ul" | "h2" | "article";
};

export function MotionReveal({
  children,
  className,
  variant = "fadeUp",
  custom,
  as = "div",
}: MotionRevealProps) {
  const Component = motion[as];

  return (
    <Component
      className={cn(className)}
      variants={custom ?? variantMap[variant]}
    >
      {children}
    </Component>
  );
}
