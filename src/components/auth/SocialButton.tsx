"use client";

import { motion } from "motion/react";

type Props = {
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

export function SocialButton({ label, children, onPress, disabled }: Props) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      onClick={onPress}
      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[16px] border-2 border-[#ebe4f6] bg-white text-[14px] font-bold text-[#0f1220] shadow-[0_3px_0_#ebe4f6] disabled:opacity-50"
    >
      {children}
      {label}
    </motion.button>
  );
}
