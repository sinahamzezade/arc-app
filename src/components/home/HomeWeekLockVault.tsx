"use client";

import Link from "next/link";
import { ChevronRight, Gem, Lock, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { HomeMockData } from "@/lib/home/mock-data";
import { cn } from "@/lib/utils";
import { sectionVariants } from "./motion";

type HomeWeekLockVaultProps = {
  weeklyProgress: HomeMockData["weeklyProgress"];
  weeklyStreak: HomeMockData["weeklyStreak"];
  replanHref?: string;
  estimateMinutes?: number;
  /** Prefer server-derived when present */
  sealed?: boolean;
  sessionsLeft?: number;
  targetWeek?: number;
};

/**
 * Seal week vault — compact night strip + gold session bolts.
 */
export function HomeWeekLockVault({
  weeklyProgress,
  weeklyStreak,
  replanHref = "/week",
  estimateMinutes = 18,
  sealed: sealedProp,
  sessionsLeft: sessionsLeftProp,
  targetWeek: targetWeekProp,
}: HomeWeekLockVaultProps) {
  const sessionsLeft =
    sessionsLeftProp ??
    Math.max(
      0,
      weeklyProgress.sessionsPlanned - weeklyProgress.sessionsDone,
    );
  const sealed = sealedProp ?? sessionsLeft <= 0;
  const targetWeek = targetWeekProp ?? weeklyStreak.weeks + (sealed ? 0 : 1);

  return (
    <motion.section
      variants={sectionVariants}
      aria-label={`Seal week ${targetWeek}`}
      className="relative overflow-hidden rounded-[18px] bg-[#0f1220] text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-[-16px] h-24 w-24 rounded-full bg-arc-purple-500/35 blur-2xl"
      />

      <div className="relative flex items-center gap-2 px-3.5 pt-3">
        <p className="font-display text-[14px] font-bold tracking-[-0.02em]">
          Seal Week {targetWeek}
        </p>
        {weeklyProgress.onTrack ? (
          <span className="rounded-full bg-[#62d84e]/20 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-[#62d84e] uppercase">
            On track
          </span>
        ) : (
          <span className="rounded-full bg-[#ff8a3d]/20 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-[#ff8a3d] uppercase">
            Behind
          </span>
        )}
        <Link
          href={replanHref}
          className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-black text-[#ffc928] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
        >
          Plan
          <ChevronRight className="h-3 w-3" strokeWidth={2.75} />
        </Link>
      </div>

      <div className="relative mt-2 flex items-center gap-3 px-3.5">
        {sealed ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#62d84e] text-[#0f1220]">
            <Lock className="h-4 w-4" strokeWidth={2.5} />
          </span>
        ) : (
          <p className="shrink-0 font-display text-[28px] leading-none font-bold tracking-[-0.05em]">
            {sessionsLeft}
          </p>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-white/50">
            {sealed
              ? "Week locked in"
              : `${sessionsLeft} left · ~${estimateMinutes}m`}
          </p>
          <div className="mt-1.5 flex gap-1" aria-hidden>
            {Array.from({ length: weeklyProgress.sessionsPlanned }).map(
              (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    i < weeklyProgress.sessionsDone
                      ? "bg-[#ffc928]"
                      : "bg-white/12",
                  )}
                />
              ),
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="inline-flex items-center gap-0.5 rounded-lg bg-[#ffc928] px-1.5 py-0.5 text-[10px] font-black text-[#0f1220]">
            <Zap className="h-3 w-3" strokeWidth={2.5} />+
            {weeklyProgress.lockRewardXp}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-lg bg-white/10 px-1.5 py-0.5 text-[10px] font-black text-white">
            <Gem className="h-3 w-3 text-[#b35cff]" strokeWidth={2.5} />+
            {weeklyProgress.lockRewardGems}
          </span>
        </div>
      </div>

      <p className="relative px-3.5 pt-2 pb-3 text-[10px] font-bold text-white/35">
        {weeklyProgress.sessionsDone}/{weeklyProgress.sessionsPlanned} sessions
        · {weeklyProgress.hoursDone}/{weeklyProgress.hoursPlanned}h
      </p>
    </motion.section>
  );
}
