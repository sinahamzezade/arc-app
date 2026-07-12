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
      <div className="grid grid-cols-2 gap-4">
        <RankCard
          title={stats.rank}
          nextTitle={stats.nextRank}
          xp={stats.xpIntoLevel}
          pct={xpPct}
        />
        <WheelCard
          spins={dailyBonus.spinsLeft}
          hoursLeft={dailyBonus.expiresIn}
          maxGems={dailyBonus.previewGems}
        />
      </div>

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

function RankCard({
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
  const r = 18;
  const c = 2 * Math.PI * r;

  return (
    <motion.section
      variants={sectionVariants}
      aria-label="Rank"
      className="rounded-[22px] border border-[#ebe4f6] bg-white p-4 shadow-[0_6px_16px_rgba(70,40,150,0.05)]"
    >
      <div className="relative h-14 w-14">
        <svg viewBox="0 0 44 44" className="h-14 w-14 -rotate-90" aria-hidden>
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke="#efe9f8"
            strokeWidth="5"
          />
          <motion.circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke="#6b4eff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={
              reduceMotion
                ? { strokeDashoffset: c * (1 - pct / 100) }
                : { strokeDashoffset: c }
            }
            animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-[#1b1730]">
          {pct}%
        </span>
      </div>
      <p className="mt-3 text-[10px] font-extrabold tracking-[0.08em] text-[#b3a8d6] uppercase">
        Rank
      </p>
      <p className="font-display text-[16px] leading-tight font-semibold text-[#1b1730]">
        {title}
      </p>
      <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
        {xp} XP → {nextTitle}
      </p>
    </motion.section>
  );
}

function WheelCard({
  spins,
  hoursLeft,
  maxGems,
}: {
  spins: number;
  hoursLeft: string;
  maxGems: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section variants={sectionVariants} aria-label="Lucky wheel">
      <Link
        href="/lucky-wheel"
        className="block h-full rounded-[22px] border border-[#ead7a0] bg-[linear-gradient(150deg,#fffbf0,#fff0c4)] p-4 shadow-[0_6px_16px_rgba(199,154,46,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c79a2e]"
      >
        <motion.span
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffc928] text-[#1b1730] shadow-[0_4px_0_#c79a2e]"
          animate={reduceMotion ? undefined : { rotate: [0, 8, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <FerrisWheel className="h-6 w-6" strokeWidth={2.2} />
        </motion.span>
        <p className="mt-3 text-[10px] font-extrabold tracking-[0.08em] text-[#c79a2e] uppercase">
          Bonus · {hoursLeft} left
        </p>
        <p className="font-display text-[16px] leading-tight font-semibold text-[#1b1730]">
          Lucky Wheel
        </p>
        <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
          {spins} spin ready · up to {maxGems} gems
        </p>
      </Link>
    </motion.section>
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
