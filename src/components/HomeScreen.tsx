"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
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
 * Home — night dispatch hero + light sheet.
 * Header + Arlo → route ticket, seal week, rank/wheel, quiet rows.
 */
export default function HomeScreen({
  data = homeMockData,
}: {
  data?: HomeMockData;
}) {
  const reduceMotion = useReducedMotion();
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const askArloHref = `${data.mission.href}/arlo`;

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-8 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-14 -right-8 h-44 w-44 rounded-full bg-arc-purple-500/45 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-16 -left-12 h-32 w-32 rounded-full bg-[#ffc928]/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 14% 22%, #fff, transparent), radial-gradient(1px 1px at 78% 12%, #fff, transparent), radial-gradient(1.5px 1.5px at 58% 48%, #fff, transparent), radial-gradient(1px 1px at 32% 70%, #fff, transparent)",
          }}
        />

        <div className="relative">
          <HomeHeader
            streakWeeks={data.weeklyStreak.weeks}
            gems={data.stats.gems}
            notificationCount={data.notificationCount}
          />
          <HomePortraitStage
            greeting={greeting}
            userName={data.userName}
            askArloHref={askArloHref}
          />
        </div>
      </header>

      <motion.main
        className="relative -mt-8 space-y-4 px-4 pb-6"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.07, delayChildren: 0.1 },
          },
        }}
      >
        <HomeMissionStage mission={data.mission} unit={1} />
        <HomeWeekLockVault
          weeklyProgress={data.weeklyProgress}
          weeklyStreak={data.weeklyStreak}
          replanHref="/week"
          estimateMinutes={data.mission.minutes}
        />
        <HomeExtras
          stats={data.stats}
          dailyBonus={data.dailyBonus}
          milestone={data.milestone}
          leaderboard={data.leaderboard}
          badges={data.badges}
        />
      </motion.main>
    </div>
  );
}
