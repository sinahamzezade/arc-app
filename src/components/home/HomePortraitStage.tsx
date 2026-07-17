"use client";

import { Flame } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { HomeData } from "@/lib/home/types";
import { soft } from "./motion";

type HomePortraitStageProps = {
  greeting: string;
  userName: HomeData["userName"];
  weekStreak?: number;
  identityArc?: string | null;
};

/**
 * Minimal masthead — name + optional streak. No mascot, no CTA clutter.
 */
export function HomePortraitStage({
  greeting,
  userName,
  weekStreak = 0,
  identityArc,
}: HomePortraitStageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className="relative mt-4"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={soft}
      aria-label="Welcome"
    >
      <p className="text-[11px] font-bold tracking-[0.12em] text-white/45 uppercase">
        {greeting}
      </p>
      <div className="mt-1 flex min-w-0 items-baseline gap-2.5">
        <h1 className="truncate font-display text-[28px] leading-none font-bold tracking-[-0.04em] text-white">
          {userName || "Learner"}
        </h1>
        {weekStreak > 0 ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-[#ffc928]/90"
            aria-label={`${weekStreak} week streak`}
          >
            <Flame
              className="h-3.5 w-3.5"
              strokeWidth={2.5}
              fill="currentColor"
            />
            {weekStreak}w
          </span>
        ) : null}
      </div>
      {identityArc ? (
        <p className="mt-2 text-[12px] font-bold text-white/55">
          You are:{" "}
          <span className="text-[#ffc928]/90">{identityArc}</span>
        </p>
      ) : null}
    </motion.section>
  );
}
