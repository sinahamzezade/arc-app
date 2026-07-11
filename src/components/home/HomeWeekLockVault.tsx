"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Flame, Gem, RefreshCw, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { HomeMockData } from "@/lib/home/mock-data";
import { cn } from "@/lib/utils";
import { pop, soft } from "./motion";

type HomeWeekLockVaultProps = {
  weeklyProgress: HomeMockData["weeklyProgress"];
  weeklyStreak: HomeMockData["weeklyStreak"];
  replanHref: string;
  estimateMinutes?: number;
};

/**
 * Night seal capsule — full navy, flame pierces left, one-band layout.
 */
export function HomeWeekLockVault({
  weeklyProgress,
  weeklyStreak,
  replanHref,
  estimateMinutes = 18,
}: HomeWeekLockVaultProps) {
  const sessionsLeft =
    weeklyProgress.sessionsPlanned - weeklyProgress.sessionsDone;
  const nextEmpty = weeklyStreak.days.findIndex((d) => d.status === "empty");
  const sealed = sessionsLeft <= 0;
  const targetWeek = weeklyStreak.weeks + (sealed ? 0 : 1);

  return (
    <motion.section
      className="relative z-10 px-5 pt-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...soft, delay: 0.16 }}
    >
      <div className="relative overflow-hidden rounded-[22px] bg-[#0f1220] text-white shadow-[0_14px_32px_rgba(15,18,32,0.35)]">
        {/* Atmosphere */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-arc-orange-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 16% 24%, #fff, transparent), radial-gradient(1px 1px at 78% 18%, #fff, transparent), radial-gradient(1px 1px at 52% 70%, #fff, transparent)",
          }}
        />

        {/* Flame stub — flat clay (no rotate) */}
        <Link
          href="/week"
          className="absolute top-2.5 left-2.5 z-[2] flex flex-col items-center rounded-2xl bg-arc-orange-400 px-2.5 py-2 text-white shadow-[0_4px_0_#d46520]"
        >
          <Flame
            className="h-3.5 w-3.5"
            fill="currentColor"
            strokeWidth={1.5}
          />
          <span className="font-display text-[18px] leading-none font-bold">
            {weeklyStreak.weeks}
          </span>
          <span className="text-[7px] font-extrabold tracking-wide uppercase">
            wks
          </span>
        </Link>

        <div className="relative z-[1] py-3.5 pr-3.5 pl-[68px]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[10px] font-extrabold tracking-[0.12em] text-[#ffc928] uppercase">
                  Seal week {targetWeek}
                </p>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-extrabold",
                    weeklyProgress.onTrack
                      ? "bg-[#62d84e]/20 text-[#62d84e]"
                      : "bg-arc-orange-400/20 text-arc-orange-400",
                  )}
                >
                  {weeklyProgress.onTrack ? "On track" : "Catch up"}
                </span>
              </div>

              <p className="mt-1 flex items-baseline gap-1.5 font-display text-[26px] leading-none font-bold tracking-[-0.03em]">
                {sealed ? (
                  <>
                    <Check className="h-6 w-6 text-[#62d84e]" strokeWidth={3} />
                    <span>Sealed</span>
                  </>
                ) : (
                  <>
                    <span>{sessionsLeft}</span>
                    <span className="text-[13px] font-bold text-white/60">
                      left · ~{estimateMinutes}m
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                href={replanHref}
                aria-label="Replan week"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
              <Link
                href="/week"
                className="inline-flex h-9 items-center gap-1 rounded-xl bg-arc-purple-500 px-3 text-[12px] font-extrabold shadow-[0_3px_0_var(--color-arc-purple-700)]"
              >
                Plan
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Day dashes */}
          <div className="mt-3 flex items-center gap-1">
            {weeklyStreak.days.map((day, i) => {
              const isNext = i === nextEmpty;
              return (
                <motion.div
                  key={`${day.label}-${i}`}
                  title={day.label}
                  className={cn(
                    "h-1.5 min-w-0 flex-1 rounded-full",
                    day.status === "done" && "bg-[#62d84e]",
                    isNext &&
                      "bg-[#ffc928] shadow-[0_0_8px_rgba(255,201,40,0.45)]",
                    day.status === "empty" && !isNext && "bg-white/15",
                  )}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ ...pop, delay: 0.16 + i * 0.03 }}
                />
              );
            })}
          </div>

          {/* Meta chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-extrabold tabular-nums text-white/55">
              {weeklyProgress.sessionsDone}/{weeklyProgress.sessionsPlanned}{" "}
              sessions · {weeklyProgress.hoursDone}/{weeklyProgress.hoursPlanned}
              h
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#ffc928]/15 px-1.5 py-0.5 text-[9px] font-extrabold text-[#ffc928]">
              <Zap className="h-2.5 w-2.5" fill="currentColor" />+
              {weeklyProgress.lockRewardXp}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#b35cff]/20 px-1.5 py-0.5 text-[9px] font-extrabold text-arc-gem-200">
              <Gem className="h-2.5 w-2.5" />+{weeklyProgress.lockRewardGems}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
