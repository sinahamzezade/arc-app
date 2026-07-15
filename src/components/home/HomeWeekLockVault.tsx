"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight, Gem, Lock, Zap } from "lucide-react";
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
 * This-week board — sessions, streak days, pace, seal rewards.
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
      aria-label={`Seal week ${targetWeek}`}
      className="relative overflow-hidden rounded-[22px] border-2 border-[#ebe4f6] bg-white p-4 shadow-[0_4px_0_#ebe4f6]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-[-16px] h-28 w-28 rounded-full bg-arc-purple-500/10 blur-2xl"
      />

      <div className="relative flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black tracking-[0.12em] text-arc-purple-500 uppercase">
            This week
          </p>
          <h2 className="mt-0.5 font-display text-[18px] leading-tight font-bold tracking-[-0.02em] text-[#1b1730]">
            Seal Week {targetWeek}
          </h2>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide uppercase",
            onTrack
              ? "bg-[#62d84e]/15 text-[#2d9e45]"
              : paceTone === "risk"
                ? "bg-[#ff5a5a]/15 text-[#d63030]"
                : "bg-[#ff8a3d]/15 text-[#e86500]",
          )}
        >
          {livePace?.label ?? badgeLabel}
        </span>
        <Link
          href={replanHref}
          aria-label="Open week plan"
          className="inline-flex shrink-0 cursor-pointer items-center gap-0.5 rounded-xl bg-[#f0ecf7] px-2.5 py-1.5 text-[11px] font-black text-arc-purple-500 transition-colors hover:bg-[#e8e0f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
        >
          Plan
          <ChevronRight className="h-3 w-3" strokeWidth={2.75} />
        </Link>
      </div>

      {/* Streak days */}
      <div
        className="relative mt-3.5 flex justify-between gap-1"
        aria-label="Weekly streak days"
      >
        {weeklyStreak.days.map((day) => (
          <div key={day.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black",
                day.status === "done"
                  ? "bg-[#ffc928] text-[#0f1220] shadow-[0_2px_0_#c79a2e]"
                  : "bg-[#f0ecf7] text-[#b3a8d6]",
              )}
            >
              {day.label.charAt(0)}
            </span>
          </div>
        ))}
      </div>

      {/* Sessions */}
      <div className="relative mt-4 flex items-center gap-3">
        {sealed ? (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#62d84e] text-white shadow-[0_3px_0_#2d9e45]">
            <Lock className="h-5 w-5" strokeWidth={2.5} />
          </span>
        ) : (
          <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#0f1220] text-white shadow-[0_3px_0_#2a2f45]">
            <span className="font-display text-[20px] leading-none font-bold tabular-nums">
              {sessionsLeft}
            </span>
            <span className="text-[7px] font-black tracking-wide text-white/45 uppercase">
              left
            </span>
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-extrabold text-[#1b1730]">
            {sealed
              ? "Week locked in"
              : `${sessionsLeft} session${sessionsLeft === 1 ? "" : "s"} · ~${estimateMinutes}m each`}
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-[#ebe4f6]"
            role="progressbar"
            aria-valuenow={sessionPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Sessions completed"
          >
            <div
              className="h-full rounded-full bg-[#ffc928]"
              style={{ width: `${Math.max(sessionPct, sealed ? 100 : 4)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] font-bold text-[#8a7cb8]">
            {weeklyProgress.sessionsDone}/{weeklyProgress.sessionsPlanned}{" "}
            sessions · {weeklyProgress.hoursDone}/{weeklyProgress.hoursPlanned}h
          </p>
        </div>
      </div>

      {/* Pace strip (when timing live) */}
      {timing ? (
        <Link
          href="/week"
          className="relative mt-3.5 flex cursor-pointer items-center gap-2.5 rounded-[16px] bg-[#0f1220] px-3 py-2.5 text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
        >
          <CalendarClock
            className="h-4 w-4 shrink-0 text-[#ffc928]"
            strokeWidth={2.5}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-black tracking-[0.1em] text-white/40 uppercase">
              Finish estimate
            </span>
            <span className="block truncate font-display text-[14px] font-bold tracking-[-0.02em]">
              {eta ?? "Building…"}
            </span>
          </span>
          <span className="shrink-0 text-[10px] font-bold text-white/45">
            {Math.round(timing.effectiveMinutesPerWeek)}m/wk
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#ffc928]" strokeWidth={2.75} />
        </Link>
      ) : null}

      <div className="relative mt-3 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 rounded-lg bg-[#ffc928] px-2 py-1 text-[10px] font-black text-[#0f1220]">
          <Zap className="h-3 w-3" strokeWidth={2.5} />+
          {weeklyProgress.lockRewardXp} XP
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-lg bg-[#f0ecf7] px-2 py-1 text-[10px] font-black text-[#1b1730]">
          <Gem className="h-3 w-3 text-arc-purple-500" strokeWidth={2.5} />+
          {weeklyProgress.lockRewardGems} gems
        </span>
        <span className="ml-auto text-[10px] font-bold text-[#b3a8d6]">
          Seal reward
        </span>
      </div>
    </motion.section>
  );
}
