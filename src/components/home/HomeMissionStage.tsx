"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Gem, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { HomeData } from "@/lib/home/types";
import { pop, sectionVariants } from "./motion";

type HomeMissionStageProps = {
  mission: HomeData["mission"];
  /** Optional unit number for route ticket label */
  unit?: number;
};

/**
 * Primary home CTA — today's lesson, one job.
 */
export function HomeMissionStage({ mission, unit = 1 }: HomeMissionStageProps) {
  const reduceMotion = useReducedMotion();
  const pct = Math.min(Math.max(mission.progressPercent, 0), 100);
  const title = mission.title.trim() || "Continue your path";

  return (
    <motion.section
      variants={sectionVariants}
      aria-labelledby="up-next-title"
      className="relative overflow-hidden rounded-[24px] border-2 border-[#0f1220] bg-white p-4 shadow-[0_6px_0_#0f1220]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-10 h-32 w-32 rounded-full bg-arc-purple-500/12"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.12em] text-arc-purple-500 uppercase">
            Up next · Unit {unit}
          </p>
          <h2
            id="up-next-title"
            className="mt-1.5 font-display text-[24px] leading-[1.08] font-bold tracking-[-0.03em] text-[#1b1730]"
          >
            {title}
          </h2>
          {mission.track ? (
            <p className="mt-1 truncate text-[12px] font-bold text-[#8a7cb8]">
              {mission.track}
            </p>
          ) : null}
        </div>
        <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#0f1220] text-white shadow-[0_3px_0_#2a2f45]">
          <span className="font-display text-[15px] leading-none font-bold tabular-nums">
            {pct}
          </span>
          <span className="text-[8px] font-black tracking-wide text-white/50 uppercase">
            path
          </span>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MetaChip
          icon={<Clock className="h-3.5 w-3.5" strokeWidth={2.5} />}
          label={`${mission.type} · ${mission.minutes} min`}
          className="bg-[#f0ecf7] text-[#4a3d78]"
        />
        <MetaChip
          icon={<Zap className="h-3.5 w-3.5" strokeWidth={2.5} />}
          label={`+${mission.xp} XP`}
          className="bg-[#fff3d0] text-[#8a6a10]"
        />
        <MetaChip
          icon={<Gem className="h-3.5 w-3.5" strokeWidth={2.5} />}
          label={`+${mission.gems}`}
          className="bg-[#f0ecf7] text-arc-purple-500"
        />
      </div>

      <div className="mt-4">
        <div
          className="h-2.5 overflow-hidden rounded-full bg-[#ebe4f6]"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Path progress"
        >
          <motion.div
            className="h-full rounded-full bg-arc-purple-500"
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${Math.max(pct, 3)}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          />
        </div>
        <p className="mt-1.5 text-[10px] font-extrabold tracking-wide text-[#b3a8d6] uppercase">
          {pct}% of path paved
        </p>
      </div>

      <motion.div
        className="relative mt-4"
        whileTap={reduceMotion ? undefined : { scale: 0.98, y: 2 }}
        transition={pop}
      >
        <Link
          href={mission.href}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_5px_0_#4b2fd6] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:ring-offset-2"
        >
          Continue lesson
          <ArrowRight className="h-4 w-4" strokeWidth={2.75} />
        </Link>
      </motion.div>
    </motion.section>
  );
}

function MetaChip({
  icon,
  label,
  className,
}: {
  icon: ReactNode;
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-extrabold ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
