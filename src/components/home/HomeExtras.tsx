"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Award, ChevronRight, FerrisWheel, Medal, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
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

/**
 * Boost + track — compact rails under the week board.
 */
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
      <motion.div variants={sectionVariants} className="space-y-2">
        <SectionLabel>Boost</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <RankRail
            title={rankTitle}
            nextTitle={rankNext}
            xp={rankXp}
            pct={rankPct}
          />
          <WheelRail
            spins={wheelSpins}
            hoursLeft={wheelHours}
            maxGems={wheelGems}
          />
        </div>
      </motion.div>

      <motion.section
        variants={sectionVariants}
        aria-label="Progress"
        className="space-y-2"
      >
        <SectionLabel>Track</SectionLabel>
        <div className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white">
          <TrackLink
            href={milestone.href ?? "/path"}
            icon={Medal}
            title={milestone.subtitle || "Current milestone"}
            sub={`${milestone.stepsDone}/${milestone.stepsTotal} · +${milestone.rewardXp} XP`}
          />
          <TrackLink
            href="/leaderboard"
            icon={Trophy}
            title={
              leagueCard.league
                ? `${leagueCard.league} · #${leagueCard.yourPlace}`
                : "League standings"
            }
            sub={
              leagueCard.endsIn
                ? `${leagueCard.endsIn} · ${leagueCard.xpToNext} XP up`
                : "See where you rank"
            }
            trailing={
              leagueCard.peers.length > 0 ? (
                <span className="mr-0.5 flex -space-x-1.5" aria-hidden>
                  {leagueCard.peers.map((r, i) => (
                    <UserAvatar
                      key={`${r.initial}-${r.color}-${i}`}
                      initial={r.initial}
                      color={r.color}
                      avatarUrl={r.avatarUrl}
                      className="h-5 w-5 rounded-full text-[9px] ring-2 ring-white"
                      textClassName="text-[9px] font-extrabold"
                      alt=""
                    />
                  ))}
                </span>
              ) : undefined
            }
          />
          <TrackLink
            href="/badges"
            icon={Award}
            title="Badges"
            sub={`${badgeCard.earned}/${badgeCard.total} unlocked`}
            last
          />
        </div>
      </motion.section>
    </>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-0.5 text-[10px] font-extrabold tracking-[0.14em] text-arc-lavender-600 uppercase">
      {children}
    </p>
  );
}

function RankRail({
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

  return (
    <Link
      href="/rank"
      aria-label="Rank"
      className="flex cursor-pointer flex-col gap-2 rounded-[18px] border border-[#ebe4f6] bg-white px-3 py-2.5 transition-colors hover:border-arc-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-extrabold tracking-[0.12em] text-arc-lavender-600 uppercase">
          Rank
        </span>
        <span className="font-display text-[12px] font-bold tabular-nums text-[#0f1220]">
          {pct}%
        </span>
      </div>
      <span className="truncate font-display text-[14px] font-bold tracking-[-0.02em] text-[#0f1220]">
        {title || "—"}
      </span>
      <div
        className="h-1 overflow-hidden rounded-full bg-[#ebe4f6]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Rank progress"
      >
        <motion.div
          className="h-full rounded-full bg-[#ffc928]"
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${Math.max(pct, 4)}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
      <span className="truncate text-[10px] font-semibold text-arc-lavender-600">
        {xp} XP → {nextTitle || "next"}
      </span>
    </Link>
  );
}

function WheelRail({
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
      className={cn(
        "flex cursor-pointer flex-col justify-between gap-2 rounded-[18px] border-[3px] border-[#0a0c16] bg-[#ffc928] px-3 py-2.5",
        "text-[#0f1220] shadow-[0_4px_0_#c79a2e] transition-[transform,box-shadow] duration-200",
        "hover:translate-y-px hover:shadow-[0_3px_0_#c79a2e]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1220]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-extrabold tracking-[0.1em] text-[#0f1220]/55 uppercase">
          Bonus
        </span>
        <FerrisWheel className="h-4 w-4" strokeWidth={2.25} />
      </div>
      <span className="font-display text-[14px] font-bold tracking-[-0.02em]">
        Lucky Wheel
      </span>
      <span className="text-[10px] font-bold text-[#0f1220]/60">
        {spins} spin
        {hoursLeft ? ` · ${hoursLeft}` : ""} · ≤{maxGems}g
      </span>
    </Link>
  );
}

function TrackLink({
  href,
  icon: Icon,
  title,
  sub,
  trailing,
  last,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  sub: string;
  trailing?: ReactNode;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 px-3 py-3 transition-colors hover:bg-[#faf8ff]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500",
        !last && "border-b border-[#f0ecf7]",
      )}
    >
      <Icon
        className="h-4 w-4 shrink-0 text-arc-lavender-500"
        strokeWidth={2.25}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-[#0f1220]">
          {title}
        </span>
        <span className="block truncate text-[10px] font-semibold text-arc-lavender-600">
          {sub}
        </span>
      </span>
      {trailing}
      <ChevronRight
        className="h-3.5 w-3.5 shrink-0 text-arc-lavender-400"
        strokeWidth={2.5}
      />
    </Link>
  );
}
