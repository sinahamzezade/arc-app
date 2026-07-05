"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { fadeDown } from "@/lib/motion/onboarding";

type MotionBackButtonProps = {
  onClick: () => void;
  className?: string;
};

export function MotionBackButton({ onClick, className }: MotionBackButtonProps) {
  return (
    <motion.header className={className} variants={fadeDown}>
      <motion.button
        type="button"
        aria-label="Go back"
        onClick={onClick}
        whileTap={{ scale: 0.9 }}
        whileHover={{ x: -2 }}
        className="-ml-2 inline-flex rounded-full p-2 text-arc-navy-900"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
      </motion.button>
    </motion.header>
  );
}
