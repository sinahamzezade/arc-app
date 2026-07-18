"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight, Gem, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { CourseTimingCurrent } from "@/lib/api/course-timing";
import type { HomeData } from "@/lib/home/types";
import { formatEta, paceMeta, type PaceTone } from "@/lib/course-timing/format";
import { cn } from "@/lib/utils";
import { sectionVariants } from "./motion";

type HomeWeekLockVaultProps = {
  weeklyProgress: HomeData["weeklyProgress"];
  weeklyStreak: HomeData["weeklyStreak"];
  replanHref?: string;
  estimateMinutes?: number;
  sealed?: boolean;
  sessionsLeft?: number;
  targetWeek?: number;
  paceLabel?: string;
  paceTone?: PaceTone;
  timing?: CourseTimingCurrent;
};

/**
 * Week board — day beads + seal line. Quieter than the night ticket.
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
  timing,
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
  const sessionPct =
    weeklyProgress.sessionsPlanned > 0
      ? Math.round(
          (weeklyProgress.sessionsDone / weeklyProgress.sessionsPlanned) * 100,
        )
      : 0;
  const eta = timing ? formatEta(timing.estimatedCompletionDate) : null;
  const livePace = timing ? paceMeta(timing.pace) : null;

  return (
    <motion.section
      variants={sectionVariants}
      aria-label={`Week ${targetWeek}`}
      className="rounded-[24px] border-[3px] border-[#0a0c16]/08 bg-white px-3.5 py-3.5 shadow-[0_5px_0_rgba(15,18,32,0.06)]"
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-arc-lavender-600 uppercase">
            Week {targetWeek}
          </p>
          <h2 className="mt-0.5 font-display text-[17px] leading-tight font-bold tracking-[-0.02em] text-[#0f1220]">
            {sealed ? "Sealed" : "In motion"}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide uppercase",
              onTrack
                ? "bg-[#ecfff4] text-[#19783f]"
                : paceTone === "risk"
                  ? "bg-[#fff3ec] text-[#b84d00]"
                  : "bg-arc-lavender-100 text-arc-lavender-700",
            )}
          >
            {livePace?.label ?? badgeLabel}
          </span>
          <Link
            href={replanHref}
            aria-label="Open week plan"
            className="inline-flex cursor-pointer items-center gap-0.5 text-[11px] font-extrabold text-arc-purple-600 transition-colors hover:text-arc-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
          >
            Plan
            <ChevronRight className="h-3 w-3" strokeWidth={2.75} />
          </Link>
        </div>
      </div>

      {/* Day beads — single rail */}
      <div
        className="mt-3.5 flex items-center gap-1.5 rounded-2xl bg-[#f6f2ff] px-2.5 py-2"
        aria-label="Weekly streak days"
      >
        {weeklyStreak.days.map((day) => (
          <div
            key={day.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold",
                day.status === "done"
                  ? "bg-[#ffc928] text-[#0f1220]"
                  : "bg-white text-arc-lavender-500 ring-1 ring-[#ebe4f6]",
              )}
            >
              {day.label.charAt(0)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-arc-lavender-600">
          <span>
            {sealed
              ? "All sessions done"
              : `${sessionsLeft} left · ~${estimateMinutes}m`}
          </span>
          <span className="tabular-nums">
            {weeklyProgress.sessionsDone}/{weeklyProgress.sessionsPlanned}
          </span>
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#ebe4f6]"
          role="progressbar"
          aria-valuenow={sessionPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Sessions completed"
        >
          <div
            className="h-full rounded-full bg-arc-purple-500"
            style={{ width: `${Math.max(sessionPct, sealed ? 100 : 4)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] font-semibold text-arc-lavender-500">
          {weeklyProgress.hoursDone}/{weeklyProgress.hoursPlanned}h logged
        </p>
      </div>

      {timing ? (
        <Link
          href="/week"
          className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl bg-[#f6f2ff] px-2.5 py-2 transition-colors hover:bg-arc-lavender-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
        >
          <CalendarClock
            className="h-3.5 w-3.5 shrink-0 text-arc-purple-500"
            strokeWidth={2.5}
          />
          <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-[#0f1220]">
            {eta ?? "Building estimate…"}
          </span>
          <span className="shrink-0 text-[10px] font-bold text-arc-lavender-600">
            {Math.round(timing.effectiveMinutesPerWeek)}m/wk
          </span>
        </Link>
      ) : null}

      <div className="mt-3 flex items-center gap-2 border-t border-[#f0ecf7] pt-2.5">
        <span className="text-[10px] font-extrabold tracking-wide text-arc-lavender-500 uppercase">
          Seal
        </span>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#0f1220]">
          <Zap className="h-3 w-3 text-[#c79a2e]" strokeWidth={2.5} />+
          {weeklyProgress.lockRewardXp}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#0f1220]">
          <Gem className="h-3 w-3 text-arc-purple-500" strokeWidth={2.5} />+
          {weeklyProgress.lockRewardGems}
        </span>
      </div>
    </motion.section>
  );
}
