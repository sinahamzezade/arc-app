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
    <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-12 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1.5px at 55% 60%, #fff, transparent)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
            <Trophy className="h-3 w-3" strokeWidth={2.5} />
            {data.weekLabel}
          </p>
          <h1 className="mt-3 font-display text-[34px] leading-[0.92] font-bold tracking-[-0.04em]">
            {data.leagueName}
          </h1>
          <p className="mt-2 text-[12px] font-bold text-white/45">
            {data.cohortLabel}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ff8a3d] px-2.5 py-1 text-[11px] font-black text-white shadow-[0_3px_0_#d46520]">
          <Clock className="h-3 w-3" strokeWidth={2.75} />
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
      ) : null}
    </section>
  );
}
