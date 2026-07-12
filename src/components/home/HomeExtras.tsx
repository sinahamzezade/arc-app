"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  ChevronRight,
  FerrisWheel,
  Medal,
  Trophy,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { HomeMockData } from "@/lib/home/mock-data";
import { cn } from "@/lib/utils";
import { sectionVariants } from "./motion";

type HomeExtrasProps = {
  stats: HomeMockData["stats"];
  dailyBonus: HomeMockData["dailyBonus"];
  milestone: HomeMockData["milestone"];
  leaderboard: HomeMockData["leaderboard"];
  badges: HomeMockData["badges"];
};

export function HomeExtras({
  stats,
  dailyBonus,
  milestone,
  leaderboard,
  badges,
}: HomeExtrasProps) {
  const xpPct = Math.round((stats.xpIntoLevel / stats.xpForLevel) * 100);

  return (
    <>
      <motion.div
        variants={sectionVariants}
        className="grid grid-cols-2 gap-2"
      >
        <RankInfo
          title={stats.rank}
          nextTitle={stats.nextRank}
          xp={stats.xpIntoLevel}
          pct={xpPct}
        />
        <WheelInfo
          spins={dailyBonus.spinsLeft}
          hoursLeft={dailyBonus.expiresIn}
          maxGems={dailyBonus.previewGems}
        />
      </motion.div>

      <motion.section
        variants={sectionVariants}
        aria-label="Progress"
        className="divide-y divide-[#f0ecf7] rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_6px_16px_rgba(70,40,150,0.05)]"
      >
        <QuietRow
          href="/milestones"
          icon={Medal}
          iconClass="bg-[#f0ecf7] text-arc-purple-500"
          title={milestone.subtitle}
          sub={`Milestone ${milestone.stepsDone}/${milestone.stepsTotal} · +${milestone.rewardXp} XP · +${milestone.rewardGems} gems`}
        />
        <QuietRow
          href="/leaderboard"
          icon={Trophy}
          iconClass="bg-[#fff3d0] text-[#c79a2e]"
          title={`${leaderboard.league} · #${leaderboard.yourPlace}`}
          sub={`${leaderboard.endsIn} · ${leaderboard.xpToNext} XP to climb`}
          trailing={
            <span className="mr-1 flex -space-x-2" aria-hidden>
              {leaderboard.peers.map((r) => (
                <span
                  key={r.initial}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold text-white ring-2 ring-white"
                  style={{ backgroundColor: r.color }}
                >
                  {r.initial}
                </span>
              ))}
            </span>
          }
        />
        <QuietRow
          href="/badges"
          icon={Award}
          iconClass="bg-[#f0ecf7] text-[#8a7cb8]"
          title="Badges"
          sub={`${badges.earned}/${badges.total} unlocked`}
        />
      </motion.section>
    </>
  );
}

function RankInfo({
  title,
  nextTitle,
  xp,
  pct,
}: {
  title: string;
  nextTitle: string;
  xp: number;
  pct: number;
}) {
  const reduceMotion = useReducedMotion();
  const r = 14;
  const c = 2 * Math.PI * r;

  return (
    <Link
      href="/rank"
      aria-label="Rank"
      className="flex items-center gap-2.5 rounded-[16px] bg-[#0f1220] px-3 py-2.5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
    >
      <div className="relative h-9 w-9 shrink-0">
        <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90" aria-hidden>
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="4"
          />
          <motion.circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke="#ffc928"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={
              reduceMotion
                ? { strokeDashoffset: c * (1 - pct / 100) }
                : { strokeDashoffset: c }
            }
            animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black">
          {pct}%
        </span>
      </div>
      <span className="min-w-0">
        <span className="block text-[9px] font-black tracking-[0.1em] text-white/40 uppercase">
          Rank
        </span>
        <span className="block truncate font-display text-[13px] leading-tight font-bold">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-bold text-white/40">
          {xp} XP → {nextTitle}
        </span>
      </span>
    </Link>
  );
}

function WheelInfo({
  spins,
  hoursLeft,
  maxGems,
}: {
  spins: number;
  hoursLeft: string;
  maxGems: number;
}) {
  return (
    <Link
      href="/lucky-wheel"
      aria-label="Lucky wheel"
      className="flex items-center gap-2.5 rounded-[16px] bg-[#ffc928] px-3 py-2.5 text-[#0f1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c79a2e]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f1220] text-[#ffc928]">
        <FerrisWheel className="h-[18px] w-[18px]" strokeWidth={2.25} />
      </span>
      <span className="min-w-0">
        <span className="block text-[9px] font-black tracking-[0.1em] text-[#0f1220]/55 uppercase">
          Bonus · {hoursLeft}
        </span>
        <span className="block truncate font-display text-[13px] leading-tight font-bold">
          Lucky Wheel
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-bold text-[#0f1220]/50">
          {spins} spin · ≤{maxGems} gems
        </span>
      </span>
    </Link>
  );
}

function QuietRow({
  href,
  icon: Icon,
  iconClass,
  title,
  sub,
  trailing,
}: {
  href: string;
  icon: LucideIcon;
  iconClass: string;
  title: string;
  sub: string;
  trailing?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500 first:rounded-t-[22px] last:rounded-b-[22px]"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          iconClass,
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] font-semibold text-[#1b1730]">
          {title}
        </span>
        <span className="block truncate text-[11px] font-bold text-[#8a7cb8]">
          {sub}
        </span>
      </span>
      {trailing}
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[#c6bce0]"
        strokeWidth={2.5}
      />
    </Link>
  );
}
