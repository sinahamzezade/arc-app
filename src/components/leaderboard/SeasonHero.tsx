"use client";

import { Clock, Trophy } from "lucide-react";
import type {
  LeaderboardEntry,
  LeaderboardData,
} from "@/lib/leaderboard/types";
import { YourSpotStage } from "./YourSpotStage";

export function SeasonHero({
  data,
  you,
}: {
  data: LeaderboardData;
  you?: LeaderboardEntry;
}) {
  return (
    <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-10 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-[-40px] h-56 w-56 rounded-full bg-arc-purple-500/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[-28px] h-36 w-36 rounded-full bg-[#ffc928]/14 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
            <Trophy className="mr-1 inline h-3 w-3" strokeWidth={2.5} />
            {data.weekLabel}
          </p>
          <h1 className="mt-1.5 font-display text-[28px] leading-[0.95] font-bold tracking-[-0.04em] text-balance">
            {data.leagueName}
          </h1>
          <p className="mt-1.5 text-[12px] font-bold text-white/45">
            {data.cohortLabel}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ff8a3d] px-2.5 py-1.5 text-[11px] font-black text-white shadow-[0_3px_0_#d46520]">
          <Clock className="h-3.5 w-3.5" strokeWidth={2.75} />
          {data.endsInLabel ?? `${data.stats.daysLeft}d`}
        </span>
      </div>

      {you ? (
        <YourSpotStage
          rank={you.rank}
          xp={you.xp}
          promoteTop={data.stats.promoteTop}
          demoteBottom={data.stats.demoteBottom}
          cohortSize={data.stats.cohortSize}
          daysLeft={data.stats.daysLeft}
        />
      ) : (
        <p className="relative mt-5 rounded-[16px] border border-dashed border-white/20 bg-white/5 px-3.5 py-3 text-[13px] font-bold text-white/55">
          Finish a lesson this week to join the standings.
        </p>
      )}
    </header>
  );
}
