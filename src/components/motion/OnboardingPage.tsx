"use client";

import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion/onboarding";
import { cn } from "@/lib/utils";

type OnboardingPageProps = {
  children: React.ReactNode;
  className?: string;
};

export function OnboardingPage({ children, className }: OnboardingPageProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
