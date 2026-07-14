"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Award, ChevronRight, FerrisWheel, Medal, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useHomeBadgesCard } from "@/hooks/useBadges";
import { useHomeLeagueCard } from "@/hooks/useLeagueHistory";
import { useLuckyWheel } from "@/hooks/useLuckyWheel";
import { useHomeRankCard } from "@/hooks/useRanks";
import { formatWheelCountdown } from "@/lib/api/lucky-wheel";
import type { HomeData } from "@/lib/home/types";
import { cn } from "@/lib/utils";
import { sectionVariants } from "./motion";

type HomeExtrasProps = {
  stats: HomeData["stats"];
  dailyBonus: HomeData["dailyBonus"];
  milestone: HomeData["milestone"];
  leaderboard: HomeData["leaderboard"];
  badges: HomeData["badges"];
};

export function HomeExtras({
  stats,
  dailyBonus,
  milestone,
  leaderboard,
  badges,
}: HomeExtrasProps) {
  const xpPct = Math.round((stats.xpIntoLevel / stats.xpForLevel) * 100);
  const { data: liveLeague } = useHomeLeagueCard();
  const { data: liveRank } = useHomeRankCard();
  const { data: liveBadges } = useHomeBadgesCard();
  const { wheel } = useLuckyWheel();
  const leagueCard = liveLeague ?? leaderboard;
  const badgeCard = liveBadges ?? badges;
  const rankTitle = liveRank?.rank ?? stats.rank;
  const rankNext = liveRank?.nextRank ?? stats.nextRank;
  const rankXp = liveRank?.xpIntoLevel ?? stats.xpIntoLevel;
  const rankPct = liveRank
    ? Math.round(
        (liveRank.xpIntoLevel / Math.max(1, liveRank.xpForLevel)) * 100,
      )
    : xpPct;
  const wheelSpins = wheel?.spinsAvailable ?? dailyBonus.spinsLeft;
  const wheelHours = wheel
    ? formatWheelCountdown(wheel.nextSpinAt ?? wheel.resetsAt, wheel.serverNow)
    : dailyBonus.expiresIn;
  const wheelGems = wheel?.previewGems ?? dailyBonus.previewGems;

  return (
    <>
      <motion.div
        variants={sectionVariants}
        className="relative grid grid-cols-2 gap-2.5"
      >
        <RankInfo
          title={rankTitle}
          nextTitle={rankNext}
          xp={rankXp}
          pct={rankPct}
        />
        <WheelInfo
          spins={wheelSpins}
          hoursLeft={wheelHours}
          maxGems={wheelGems}
        />
      </motion.div>

      <motion.section
        variants={sectionVariants}
        aria-label="Progress"
        className="divide-y divide-[#f0ecf7] rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_6px_16px_rgba(70,40,150,0.05)]"
      >
        <QuietRow
          href={milestone.href ?? "/path"}
          icon={Medal}
          iconClass="bg-[#f0ecf7] text-arc-purple-500"
          title={milestone.subtitle}
          sub={`Milestone ${milestone.stepsDone}/${milestone.stepsTotal} · +${milestone.rewardXp} XP · +${milestone.rewardGems} gems`}
        />
        <QuietRow
          href="/leaderboard"
          icon={Trophy}
          iconClass="bg-[#fff3d0] text-[#c79a2e]"
          title={`${leagueCard.league} · #${leagueCard.yourPlace}`}
          sub={`${leagueCard.endsIn} · ${leagueCard.xpToNext} XP to climb`}
          trailing={
            <span className="mr-1 flex -space-x-2" aria-hidden>
              {leagueCard.peers.map((r) => (
                <span
                  key={r.initial + r.color}
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
          sub={`${badgeCard.earned}/${badgeCard.total} unlocked`}
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
  const r = 18;
  const c = 2 * Math.PI * r;

  return (
    <Link
      href="/rank"
      aria-label="Rank"
      className="flex h-full min-w-0 items-center gap-2.5 rounded-[20px] bg-white px-3 py-3 text-[#1b1730] shadow-[0_5px_0_#d9d0ef,0_12px_24px_rgba(70,40,150,0.08)] ring-1 ring-[#ebe4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
    >
      <div className="relative h-11 w-11 shrink-0">
        <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90" aria-hidden>
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke="#ebe4f6"
            strokeWidth="5"
          />
          <motion.circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke="#ffc928"
            strokeWidth="5"
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
        <span className="absolute inset-0 flex items-center justify-center font-display text-[11px] font-bold text-[#1b1730]">
          {pct}%
        </span>
      </div>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[9px] font-black tracking-[0.12em] text-arc-purple-500 uppercase">
          Rank
        </span>
        <span className="mt-0.5 block truncate font-display text-[14px] leading-tight font-bold tracking-[-0.02em]">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-bold text-[#8a7cb8]">
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
      className="relative flex h-full min-w-0 items-center gap-2.5 rounded-[20px] bg-[#ffc928] px-3 py-3 text-[#0f1220] shadow-[0_5px_0_#c79a2e,0_12px_24px_rgba(199,154,46,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c79a2e]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928] shadow-[0_3px_0_#000]">
        <FerrisWheel className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[9px] font-black tracking-[0.08em] text-[#0f1220]/55 uppercase">
          Bonus · {hoursLeft.replace(" ", "·")}
        </span>
        <span className="mt-0.5 block truncate font-display text-[14px] leading-tight font-bold tracking-[-0.02em]">
          Lucky Wheel
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-bold text-[#0f1220]/55">
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
