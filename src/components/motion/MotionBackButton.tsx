"use client";

import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { fadeDown } from "@/lib/motion/onboarding";

type MotionBackButtonProps = {
  onClick: () => void;
  className?: string;
};

export function MotionBackButton({ onClick, className }: MotionBackButtonProps) {
  return (
    <motion.header className={className} variants={fadeDown}>
      <BackButton onClick={onClick} tone="light" className="-ml-1" />
    </motion.header>
  );
}
