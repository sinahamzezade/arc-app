"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Gem, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { authCtaClassName } from "@/components/onboarding/AuthShell";
import type { HomeData } from "@/lib/home/types";
import { cn } from "@/lib/utils";
import { pop, sectionVariants } from "./motion";

type HomeMissionStageProps = {
  mission: HomeData["mission"];
  unit?: number;
};

/**
 * Next drop — night clay ticket. One lesson, one press.
 */
export function HomeMissionStage({ mission, unit = 1 }: HomeMissionStageProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const pct = Math.min(Math.max(mission.progressPercent, 0), 100);
  const title = mission.title.trim() || "Continue your path";

  return (
    <motion.section
      variants={sectionVariants}
      aria-labelledby="next-drop-title"
      className="relative overflow-hidden rounded-[28px] border-[3px] border-[#0a0c16] bg-[#0f1220] shadow-[0_7px_0_#0a0c16]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 rounded-full bg-arc-purple-500/35 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 left-4 h-24 w-24 rounded-full bg-[#ffc928]/15 blur-2xl"
      />

      <div className="relative px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#ffc928] uppercase">
            Next drop · Unit {unit}
          </p>
          <span
            className="rounded-full border-[2px] border-white/15 bg-white/8 px-2 py-0.5 font-display text-[11px] font-bold tabular-nums text-white"
            aria-label={`${pct} percent of path`}
          >
            {pct}%
          </span>
        </div>

        <h2
          id="next-drop-title"
          className="mt-2 font-display text-[22px] leading-[1.1] font-bold tracking-[-0.035em] text-white"
        >
          {title}
        </h2>
        {mission.track ? (
          <p className="mt-1 truncate text-[12px] font-semibold text-white/45">
            {mission.track}
          </p>
        ) : null}

        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-white/55">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-white/40" strokeWidth={2.5} />
            {mission.type} · {mission.minutes}m
          </span>
          <span className="inline-flex items-center gap-1 text-[#7eb8ff]">
            <Zap
              className="h-3 w-3"
              strokeWidth={2.5}
              fill="currentColor"
            />
            +{mission.xp} XP
          </span>
          <span className="inline-flex items-center gap-1 text-[#e4c4ff]">
            <Gem className="h-3 w-3" strokeWidth={2.5} />
            +{mission.gems}
          </span>
        </p>

        <div
          className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Path progress"
        >
          <motion.div
            className="h-full rounded-full bg-[#ffc928]"
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${Math.max(pct, 4)}%` }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }}
          />
        </div>
      </div>

      <div className="relative px-3.5 pt-1 pb-3.5">
        <motion.div
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          transition={pop}
        >
          <Button
            fullWidth
            variant="primary"
            onPress={() => router.push(mission.href)}
            className={cn(
              authCtaClassName,
              "inline-flex cursor-pointer items-center justify-center gap-2",
            )}
          >
            Open trail
            <ArrowRight className="size-5" strokeWidth={2.75} aria-hidden />
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}
