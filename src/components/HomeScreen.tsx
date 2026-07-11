"use client";

import { useMemo } from "react";
import {
  greetingForHour,
  homeMockData,
  type HomeMockData,
} from "@/lib/home/mock-data";
import { HomeExtras } from "@/components/home/HomeExtras";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeMissionStage } from "@/components/home/HomeMissionStage";
import { HomePortraitStage } from "@/components/home/HomePortraitStage";
import { HomeWeekLockVault } from "@/components/home/HomeWeekLockVault";

/**
 * Home — night-hero coach desk.
 * Night masthead (Arlo + Talk) → sheet: night mission vault, week seal, extras.
 * No decorative rotate.
 */
export default function HomeScreen({
  data = homeMockData,
}: {
  data?: HomeMockData;
}) {
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const askArloHref = `${data.mission.href}/arlo`;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* NIGHT HERO */}
      <section className="relative overflow-hidden bg-[#0f1220] pb-20 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/18 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1px at 55% 60%, #fff, transparent)",
          }}
        />

        <HomeHeader
          xp={data.stats.xp}
          gems={data.stats.gems}
          notificationCount={data.notificationCount}
          tone="night"
        />

        <HomePortraitStage
          greeting={greeting}
          userName={data.userName}
          quote={data.arloSays.quote}
          weeks={data.weeklyStreak.weeks}
          askArloHref={askArloHref}
        />
      </section>

      {/* LIGHT SHEET */}
      <div className="relative z-10 -mt-12 rounded-t-[28px] bg-[#f3effc] pt-1 shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        <HomeMissionStage mission={data.mission} />

        <HomeWeekLockVault
          weeklyProgress={data.weeklyProgress}
          weeklyStreak={data.weeklyStreak}
          replanHref={askArloHref}
          estimateMinutes={data.mission.minutes}
        />

        <HomeExtras
          stats={data.stats}
          dailyBonus={data.dailyBonus}
          milestone={data.milestone}
          leaderboard={data.leaderboard}
          missionHref={data.mission.href}
          badges={data.badges}
        />
      </div>
    </div>
  );
}
