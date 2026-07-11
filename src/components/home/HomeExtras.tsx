"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  Gem,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import type { HomeMockData } from "@/lib/home/mock-data";
import { cn } from "@/lib/utils";
import { soft } from "./motion";

type HomeExtrasProps = {
  stats: HomeMockData["stats"];
  dailyBonus: HomeMockData["dailyBonus"];
  milestone: HomeMockData["milestone"];
  leaderboard: HomeMockData["leaderboard"];
  missionHref: string;
  badges: HomeMockData["badges"];
};

export function HomeExtras({
  stats,
  dailyBonus,
  milestone,
  leaderboard,
  missionHref,
  badges,
}: HomeExtrasProps) {
  const xpLeft = stats.xpForLevel - stats.xpIntoLevel;
  const xpPct = Math.round((stats.xpIntoLevel / stats.xpForLevel) * 100);
  const xpRing = 2 * Math.PI * 20;
  const milestonePct = Math.round(
    (milestone.stepsDone / milestone.stepsTotal) * 100,
  );
  const almostDone = milestone.stepsDone >= milestone.stepsTotal - 1;
  const raceRows = [
    { label: "You", xp: leaderboard.yourXp, color: "#6B4EFF", you: true },
    ...leaderboard.peers.map((p) => ({
      label: p.initial,
      xp: p.xp,
      color: p.color,
      you: false,
    })),
  ].sort((a, b) => b.xp - a.xp);
  const raceMax = Math.max(...raceRows.map((r) => r.xp));

  return (
    <motion.section
      className="relative z-10 space-y-3 px-5 pt-7 pb-[calc(env(safe-area-inset-bottom)+118px)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...soft, delay: 0.22 }}
    >
      {/* RANK — night climb capsule + XP dial */}
      <Link
        href="/rank"
        className="relative block overflow-hidden rounded-[22px] bg-[#0f1220] p-3.5 text-white shadow-[0_14px_32px_rgba(15,18,32,0.28)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-8 h-36 w-36 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-arc-purple-500/30 blur-3xl"
        />

        <div className="relative z-[1] flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Image
                src={assets.home.ninja}
                alt=""
                width={38}
                height={42}
                className="h-10 w-auto"
              />
            </div>
            <span className="absolute -right-1 -bottom-1 rounded-md bg-[#ffc928] px-1.5 text-[10px] font-black text-[#0f1220]">
              {stats.level}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold tracking-[0.12em] text-[#ffc928] uppercase">
              Rank
            </p>
            <p className="mt-0.5 font-display text-[18px] font-bold leading-tight">
              {stats.rank}
            </p>
            <p className="mt-1 text-[11px] font-bold text-white/60">
              {xpLeft} XP → {stats.nextRank}
            </p>
          </div>

          {/* XP dial */}
          <div className="relative flex h-[56px] w-[56px] shrink-0 items-center justify-center">
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              className="-rotate-90"
              aria-hidden
            >
              <circle
                cx="28"
                cy="28"
                r="20"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="5"
              />
              <motion.circle
                cx="28"
                cy="28"
                r="20"
                fill="none"
                stroke="#FFC928"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={xpRing}
                initial={{ strokeDashoffset: xpRing }}
                animate={{
                  strokeDashoffset: xpRing * (1 - xpPct / 100),
                }}
                transition={{ ...soft, delay: 0.26 }}
              />
            </svg>
            <span className="absolute font-display text-[12px] font-bold tabular-nums">
              {xpPct}
              <span className="text-[8px]">%</span>
            </span>
          </div>
        </div>
      </Link>

      {/* BENTO — wheel (wide) + milestone (tight) */}
      <div className="grid grid-cols-[1.15fr_0.85fr] gap-2.5">
        <Link
          href="/lucky-wheel"
          className="relative flex min-h-[132px] flex-col overflow-hidden rounded-[22px] bg-[#ffc928] p-3.5 text-[#0f1220] shadow-[0_5px_0_#c79a2e]"
        >
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={assets.home.prizeWheel}
              alt=""
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 bg-transparent object-contain"
            />
          </motion.div>

          <p className="text-[10px] font-extrabold tracking-[0.08em] text-[#0f1220]/70 uppercase">
            Bonus
          </p>
          <p className="mt-1 max-w-[72%] font-display text-[16px] leading-tight font-bold">
            {dailyBonus.title}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0f1220] px-2 py-1 text-[10px] font-extrabold text-[#ffc928]">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} />
              {dailyBonus.spinsLeft} spin
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-extrabold text-[#0f1220]">
              <Clock className="h-3 w-3" strokeWidth={2.5} />
              {dailyBonus.expiresIn}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/80 px-2 py-1 text-[10px] font-extrabold text-[#0f1220]">
              <Gem className="h-3 w-3 text-[#b35cff]" strokeWidth={2.5} />
              up to {dailyBonus.previewGems}
            </span>
          </div>
        </Link>

        <Link
          href={missionHref}
          className="relative flex min-h-[132px] flex-col overflow-hidden rounded-[22px] bg-white p-3.5 ring-1 ring-arc-lavender-300"
        >
          <motion.div
            className="absolute top-2 right-1.5"
            animate={almostDone ? { y: [0, -3, 0] } : undefined}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={assets.home.chest}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          </motion.div>

          <p className="text-[10px] font-extrabold tracking-[0.08em] text-arc-lavender-700 uppercase">
            Milestone
          </p>
          <p className="mt-1 font-display text-[26px] leading-none font-bold text-[#101923]">
            {milestone.stepsDone}
            <span className="text-[16px] text-arc-lavender-500">
              /{milestone.stepsTotal}
            </span>
          </p>
          <p className="mt-1.5 line-clamp-2 pr-8 text-[11px] leading-snug font-bold text-arc-lavender-700">
            {milestone.subtitle}
          </p>

          {/* Step dots feature */}
          <div className="mt-2 flex gap-1">
            {Array.from({ length: milestone.stepsTotal }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i < milestone.stepsDone
                    ? "bg-arc-purple-500"
                    : "bg-arc-lavender-200",
                )}
              />
            ))}
          </div>

          <div className="mt-auto flex items-center gap-1.5 pt-2 text-[10px] font-extrabold text-arc-lavender-700">
            <Zap className="h-3 w-3 text-[#ffc928]" fill="currentColor" />
            +{milestone.rewardXp}
            <Gem className="ml-1 h-3 w-3 text-[#b35cff]" />
            +{milestone.rewardGems}
            <span className="ml-auto tabular-nums">{milestonePct}%</span>
          </div>
        </Link>
      </div>

      {/* LEAGUE — night race lane */}
      <Link
        href="/leaderboard"
        className="relative block overflow-hidden rounded-[22px] bg-[#0f1220] p-3.5 text-white shadow-[0_14px_32px_rgba(15,18,32,0.28)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 right-0 h-32 w-32 rounded-full bg-[#ffc928]/15 blur-3xl"
        />

        <div className="relative z-[1] flex items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ffc928]/15 ring-1 ring-[#ffc928]/25">
            <Trophy className="h-5 w-5 text-[#ffc928]" strokeWidth={2.25} />
            <span className="absolute -right-1 -bottom-1 rounded-md bg-arc-purple-500 px-1 text-[9px] font-black">
              #{leaderboard.yourPlace}
            </span>
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-bold">
              {leaderboard.league}
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white/60">
              {leaderboard.endsIn} · {leaderboard.xpToNext} XP to climb
            </p>
          </div>

          <div className="flex items-center">
            {leaderboard.peers.map((peer, i) => (
              <div
                key={peer.initial}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0f1220] text-[9px] font-extrabold text-white",
                  i > 0 && "-ml-1.5",
                )}
                style={{ background: peer.color }}
                title={`${peer.initial} · ${peer.xp} XP`}
              >
                {peer.initial}
              </div>
            ))}
            <ChevronRight className="ml-1 h-4 w-4 text-white/40" />
          </div>
        </div>

        {/* Horizontal race lane — pins on one track */}
        <div className="relative z-[1] mt-3.5">
          <div className="relative h-2 rounded-full bg-white/10">
            {raceRows.map((row, i) => {
              const pct = Math.round((row.xp / raceMax) * 100);
              return (
                <motion.span
                  key={row.label}
                  className={cn(
                    "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#0f1220]",
                    row.you && "h-3.5 w-3.5",
                  )}
                  style={{
                    left: `${Math.min(Math.max(pct, 4), 96)}%`,
                    background: row.color,
                    zIndex: row.you ? 3 : 1 + i,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...soft, delay: 0.22 + i * 0.04 }}
                />
              );
            })}
          </div>
          <div className="relative mt-2 h-4">
            {raceRows.map((row) => {
              const pct = Math.round((row.xp / raceMax) * 100);
              return (
                <span
                  key={`pin-${row.label}`}
                  className={cn(
                    "absolute top-0 -translate-x-1/2 text-[9px] font-extrabold",
                    row.you ? "text-[#ffc928]" : "text-white/55",
                  )}
                  style={{ left: `${Math.min(Math.max(pct, 4), 96)}%` }}
                >
                  {row.label}
                </span>
              );
            })}
          </div>
        </div>
      </Link>

      {/* BADGES teaser feature */}
      <Link
        href="/badges"
        className="flex items-center gap-3 rounded-[18px] px-1 py-1"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-arc-lavender-300">
          <Sparkles className="h-4 w-4 text-arc-purple-500" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-extrabold text-[#101923]">
            Badges {badges.earned}/{badges.total}
          </p>
          <p className="text-[11px] font-bold text-arc-lavender-700">
            {badges.total - badges.earned} left to unlock
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-arc-lavender-400" />
      </Link>
    </motion.section>
  );
}
