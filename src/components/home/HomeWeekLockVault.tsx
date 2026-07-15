"use client";

import Link from "next/link";
import { ChevronRight, Gem, Lock, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { HomeData } from "@/lib/home/types";
import type { PaceTone } from "@/lib/course-timing/format";
import { cn } from "@/lib/utils";
import { sectionVariants } from "./motion";

type HomeWeekLockVaultProps = {
  weeklyProgress: HomeData["weeklyProgress"];
  weeklyStreak: HomeData["weeklyStreak"];
  replanHref?: string;
  estimateMinutes?: number;
  /** Prefer server-derived when present */
  sealed?: boolean;
  sessionsLeft?: number;
  targetWeek?: number;
  paceLabel?: string;
  paceTone?: PaceTone;
};

/**
 * Seal week vault — light ticket + gold session bolts.
 */
export function HomeWeekLockVault({
  weeklyProgress,
  weeklyStreak,
  replanHref = "/week/plan",
  estimateMinutes = 18,
  sealed: sealedProp,
  sessionsLeft: sessionsLeftProp,
  targetWeek: targetWeekProp,
  paceLabel,
  paceTone,
}: HomeWeekLockVaultProps) {
  const sessionsLeft =
    sessionsLeftProp ??
    Math.max(0, weeklyProgress.sessionsPlanned - weeklyProgress.sessionsDone);
  const sealed = sealedProp ?? sessionsLeft <= 0;
  const targetWeek = targetWeekProp ?? weeklyStreak.weeks + (sealed ? 0 : 1);
  const onTrack =
    paceTone != null ? paceTone === "good" : weeklyProgress.onTrack;
  const badgeLabel =
    paceLabel ?? (weeklyProgress.onTrack ? "On track" : "Behind");

  return (
    <motion.section
      variants={sectionVariants}
      aria-label={`Seal week ${targetWeek}`}
      className="relative flex h-full flex-col overflow-hidden rounded-[18px] bg-white px-3.5 py-3 text-[#1b1730] shadow-[0_10px_24px_rgba(70,40,150,0.08)] ring-1 ring-[#ebe4f6]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-[-16px] h-24 w-24 rounded-full bg-arc-purple-500/10 blur-2xl"
      />

      <div className="relative flex items-center gap-1.5">
        <p className="min-w-0 truncate font-display text-[13px] font-bold tracking-[-0.02em]">
          Seal Week {targetWeek}
        </p>
        <Link
          href={replanHref}
          aria-label="Open week plan"
          className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-[11px] font-black text-arc-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
        >
          Plan
          <ChevronRight className="h-3 w-3" strokeWidth={2.75} />
        </Link>
      </div>

      {onTrack ? (
        <span className="relative mt-1.5 self-start rounded-full bg-[#62d84e]/15 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-[#2d9e45] uppercase">
          {badgeLabel}
        </span>
      ) : (
        <span
          className={cn(
            "relative mt-1.5 self-start rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wide uppercase",
            paceTone === "risk"
              ? "bg-[#ff5a5a]/15 text-[#d63030]"
              : "bg-[#ff8a3d]/15 text-[#e86500]",
          )}
        >
          {badgeLabel}
        </span>
      )}

      <div className="relative mt-2 flex items-center gap-2.5">
        {sealed ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#62d84e] text-white">
            <Lock className="h-4 w-4" strokeWidth={2.5} />
          </span>
        ) : (
          <p className="shrink-0 font-display text-[26px] leading-none font-bold tracking-[-0.05em] text-[#1b1730]">
            {sessionsLeft}
          </p>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold text-[#8a7cb8]">
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
                      : "bg-[#ebe4f6]",
                  )}
                />
              ),
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-2 flex items-center gap-1">
        <span className="inline-flex items-center gap-0.5 rounded-lg bg-[#ffc928] px-1.5 py-0.5 text-[10px] font-black text-[#0f1220]">
          <Zap className="h-3 w-3" strokeWidth={2.5} />+
          {weeklyProgress.lockRewardXp}
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-lg bg-[#f0ecf7] px-1.5 py-0.5 text-[10px] font-black text-[#1b1730]">
          <Gem className="h-3 w-3 text-arc-purple-500" strokeWidth={2.5} />+
          {weeklyProgress.lockRewardGems}
        </span>
      </div>

      <p className="relative mt-auto pt-2 text-[10px] font-bold text-[#b3a8d6]">
        {weeklyProgress.sessionsDone}/{weeklyProgress.sessionsPlanned} sessions
        · {weeklyProgress.hoursDone}/{weeklyProgress.hoursPlanned}h
      </p>
    </motion.section>
  );
}
