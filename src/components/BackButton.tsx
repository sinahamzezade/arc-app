"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const tapSpring = { type: "spring" as const, stiffness: 480, damping: 34 };

export type BackButtonTone = "dark" | "light";

type BackButtonProps = {
  /** Defaults to router.back() when omitted */
  onClick?: () => void;
  /** dark = frosted on navy heroes; light = white on lavender sheets */
  tone?: BackButtonTone;
  className?: string;
  "aria-label"?: string;
};

/**
 * Shared Arc back control — rounded square, never circle.
 * Use tone="dark" on navy stages, tone="light" on light sheets.
 */
export function BackButton({
  onClick,
  tone = "dark",
  className,
  "aria-label": ariaLabel = "Go back",
}: BackButtonProps) {
  const router = useRouter();

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick ?? (() => router.back())}
      whileTap={{ scale: 0.92 }}
      transition={tapSpring}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        tone === "dark" &&
          "bg-white/10 text-white ring-1 ring-white/15",
        tone === "light" &&
          "border border-[#ebe4f6] bg-white text-[#1b1730] shadow-[0_4px_12px_rgba(70,40,150,0.06)]",
        className,
      )}
    >
      <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
    </motion.button>
  );
}
