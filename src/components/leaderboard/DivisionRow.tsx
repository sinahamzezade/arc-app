"use client";

import { Award } from "lucide-react";
import { motion } from "motion/react";
import type { LeagueDivision } from "@/lib/leaderboard/mock-data";
import { cn } from "@/lib/utils";
import { softSpring } from "./motion";

const tierColors: Record<LeagueDivision["tier"], string> = {
  bronze: "#cd7f32",
  silver: "#8a9198",
  gold: "#ffc928",
  platinum: "#b8c4ce",
  diamond: "#7ec8e3",
  master: "#c084fc",
};

export function DivisionRow({
  division,
  index,
}: {
  division: LeagueDivision;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...softSpring, delay: index * 0.08 }}
      className={cn(
        "relative mb-3 flex items-center gap-3 last:mb-0",
        index === 1 && "ml-5",
        index === 2 && "ml-2",
      )}
    >
      <span
        className={cn(
          "relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
          division.active && "ring-2 ring-arc-purple-500 ring-offset-2",
        )}
        style={{ background: tierColors[division.tier] }}
      >
        <Award className="h-5 w-5 text-[#0f1220]" strokeWidth={2.25} />
      </span>
      <div
        className={cn(
          "min-w-0 flex-1 rounded-[18px] border px-3.5 py-3",
          division.active
            ? "border-transparent bg-[#0f1220] text-white"
            : "border-[#ebe4f6] bg-white",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-[16px] font-bold">{division.name}</p>
          {division.active ? (
            <span className="rounded-full bg-[#ffc928] px-2 py-0.5 text-[10px] font-black text-[#0f1220] uppercase">
              You
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-0.5 text-[12px] font-semibold",
            division.active ? "text-white/45" : "text-[#8a7cb8]",
          )}
        >
          {division.rangeLabel}
        </p>
      </div>
    </motion.div>
  );
}
