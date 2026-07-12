"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
 * Seal week strip — session segments + plan link.
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
  const targetWeek =
    targetWeekProp ?? weeklyStreak.weeks + (sealed ? 0 : 1);

  return (
    <motion.section
      variants={sectionVariants}
      aria-label={`Seal week ${targetWeek}`}
      className="rounded-[22px] border border-[#ebe4f6] bg-white px-4 py-3.5 shadow-[0_6px_16px_rgba(70,40,150,0.05)]"
    >
      <div className="flex items-center gap-2">
        <p className="font-display text-[15px] font-semibold text-[#1b1730]">
          Seal Week {targetWeek}
        </p>
        {weeklyProgress.onTrack ? (
          <span className="rounded-full bg-[#e3f8ec] px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-[#1d9d5f] uppercase">
            On track
          </span>
        ) : (
          <span className="rounded-full bg-[#fdeee4] px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-[#d0641c] uppercase">
            Behind
          </span>
        )}
        <Link
          href={replanHref}
          className="ml-auto inline-flex items-center gap-1 text-[12px] font-extrabold text-arc-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:ring-offset-1"
        >
          Plan week
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.75} />
        </Link>
      </div>

      <div className="mt-3 flex gap-1.5" aria-hidden>
        {Array.from({ length: weeklyProgress.sessionsPlanned }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 flex-1 rounded-full",
              i < weeklyProgress.sessionsDone ? "bg-[#ffc928]" : "bg-[#efe9f8]",
            )}
          />
        ))}
      </div>

      <p className="mt-2.5 text-[12px] font-bold text-[#8a7cb8]">
        {sealed ? (
          <>Week sealed</>
        ) : (
          <>
            {sessionsLeft} session{sessionsLeft === 1 ? "" : "s"} left · ~
            {estimateMinutes}m
          </>
        )}
        <span className="text-[#c6bce0]">
          {" "}
          · {weeklyProgress.hoursDone}/{weeklyProgress.hoursPlanned}h · +
          {weeklyProgress.lockRewardXp} XP · +{weeklyProgress.lockRewardGems}{" "}
          gems on seal
        </span>
      </p>
    </motion.section>
  );
}
