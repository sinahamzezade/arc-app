"use client";

import Link from "next/link";
import { ArrowRight, Clock, Flag, Gem, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { HomeData } from "@/lib/home/types";
import { pop, sectionVariants, soft } from "./motion";

type HomeMissionStageProps = {
  mission: HomeData["mission"];
  /** Optional unit number for route ticket label */
  unit?: number;
};

/**
 * Route ticket — today's leg of the path.
 */
export function HomeMissionStage({ mission, unit = 1 }: HomeMissionStageProps) {
  const reduceMotion = useReducedMotion();
  const pct = Math.min(Math.max(mission.progressPercent, 0), 100);

  return (
    <motion.section
      variants={sectionVariants}
      aria-labelledby="up-next-title"
      className="relative overflow-hidden rounded-[26px] bg-white p-4 shadow-[0_16px_32px_rgba(70,40,150,0.16)] ring-1 ring-[#ebe4f6]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-arc-purple-500/10"
      />

      <p className="text-[10px] font-black tracking-[0.1em] text-arc-purple-500 uppercase">
        Next stop · {mission.track} · Unit {unit}
      </p>
      <h2
        id="up-next-title"
        className="mt-1.5 font-display text-[24px] leading-[1.05] font-bold tracking-[-0.03em] text-[#1b1730]"
      >
        {mission.title}
      </h2>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-bold text-[#8a7cb8]">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
          {mission.type} · {mission.minutes} min
        </span>
        <span className="inline-flex items-center gap-1 text-[#c79a2e]">
          <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />+{mission.xp} XP
        </span>
        <span className="inline-flex items-center gap-1 text-arc-purple-500">
          <Gem className="h-3.5 w-3.5" strokeWidth={2.5} />+{mission.gems}
        </span>
      </p>

      <div className="mt-4">
        <div className="relative h-7">
          <div
            aria-hidden
            className="absolute top-1/2 right-5 left-1 h-[3px] -translate-y-1/2 rounded-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #d5ccec 0 7px, transparent 7px 15px)",
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1 h-[5px] -translate-y-1/2 rounded-full bg-[#2a2440]"
            initial={reduceMotion ? false : { width: 0 }}
            animate={{
              width: `max(14px, calc(${Math.max(pct, 4)}% - 12px))`,
            }}
            transition={{ ...soft, delay: 0.25 }}
          />
          <span
            aria-hidden
            className="absolute top-1/2 left-0 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#2a2440]"
          />
          <motion.span
            aria-hidden
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-arc-purple-500 ring-[3px] ring-white shadow-[0_0_0_5px_rgba(107,78,255,0.18)]"
            initial={reduceMotion ? false : { left: "4px", opacity: 0 }}
            animate={{
              left: `max(14px, calc(${Math.max(pct, 4)}% - 10px))`,
              opacity: 1,
            }}
            transition={{ ...soft, delay: 0.3 }}
          />
          <Flag
            aria-hidden
            className="absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 text-[#b3a8d6]"
            strokeWidth={2.5}
          />
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[10px] font-extrabold tracking-wide text-[#b3a8d6] uppercase">
          <span>Unit {unit}</span>
          <span className="text-[#8a7cb8]">{pct}% paved</span>
        </div>
      </div>

      <motion.div
        className="relative mt-4"
        whileTap={{ scale: 0.98, y: 2 }}
        transition={pop}
      >
        <Link
          href={mission.href}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_6px_0_#4b2fd6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:ring-offset-2"
        >
          Continue lesson
          <ArrowRight className="h-4 w-4" strokeWidth={2.75} />
        </Link>
      </motion.div>
    </motion.section>
  );
}
