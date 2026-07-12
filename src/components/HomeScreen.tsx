"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useSession } from "next-auth/react";
import {
  greetingForHour,
  homeMockData,
  type HomeMockData,
} from "@/lib/home/mock-data";
import { mapHomeFromBackend } from "@/lib/home/map-home";
import { HomeExtras } from "@/components/home/HomeExtras";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeMissionStage } from "@/components/home/HomeMissionStage";
import { HomePaceStrip } from "@/components/home/HomePaceStrip";
import { HomePortraitStage } from "@/components/home/HomePortraitStage";
import { HomeSheetSkeleton } from "@/components/home/HomeSheetSkeleton";
import { HomeWeekLockVault } from "@/components/home/HomeWeekLockVault";
import { useCourseTiming } from "@/hooks/useCourseTiming";
import { useCurrentRoadmap } from "@/hooks/useCurrentRoadmap";
import { useCurrentWeek } from "@/hooks/useCurrentWeek";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import { paceMeta } from "@/lib/course-timing/format";
import { useEconomyStore } from "@/store/useEconomyStore";

/**
 * Home — night dispatch hero + light sheet.
 * Mission + week seal from `/roadmaps/current` + `/weeks/current`.
 * Pace / ETA from `/course-timing/current`.
 */
export default function HomeScreen({
  data: dataProp = homeMockData,
}: {
  data?: HomeMockData;
}) {
  const reduceMotion = useReducedMotion();
  const { data: session, status: sessionStatus } = useSession();
  const { data: roadmapRes, isLoading: roadmapLoading } = useCurrentRoadmap();
  const { week, isLoading: weekLoading } = useCurrentWeek();
  const { timing } = useCourseTiming();
  const { data: unreadCount } = useUnreadNotificationCount();
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);
  const economyHydrated = useEconomyStore((s) => s.hydrated);

  const sheetLoading =
    sessionStatus === "loading" ||
    (sessionStatus === "authenticated" &&
      (roadmapLoading || weekLoading) &&
      !roadmapRes &&
      !week);

  const { data, unit } = useMemo(
    () =>
      mapHomeFromBackend({
        base: dataProp,
        roadmap: roadmapRes?.roadmap ?? null,
        week: week ?? null,
        userName:
          session?.profile?.displayName ||
          session?.user?.name ||
          dataProp.userName,
        xp,
        gems,
        coins,
        notificationCount: unreadCount ?? dataProp.notificationCount,
        weeklyStreakWeeks: session?.profile?.weeklyStreak,
      }),
    [
      coins,
      dataProp,
      gems,
      roadmapRes?.roadmap,
      session?.profile?.displayName,
      session?.profile?.weeklyStreak,
      session?.user?.name,
      unreadCount,
      week,
      xp,
    ],
  );

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const askArloHref = data.mission.href.startsWith("/learn/")
    ? `${data.mission.href}/arlo`
    : "/learn";
  const timingPace = timing ? paceMeta(timing.pace) : null;
  const estimateMinutes =
    timing?.nextSession?.minutes ??
    week?.estimateMinutes ??
    data.mission.minutes;

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
            coins={data.stats.coins}
            xp={data.stats.xp}
            gems={data.stats.gems}
            notificationCount={data.notificationCount}
            loading={sessionStatus === "authenticated" && !economyHydrated}
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
        initial={reduceMotion || sheetLoading ? false : "hidden"}
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.07, delayChildren: 0.1 },
          },
        }}
      >
        {sheetLoading ? (
          <HomeSheetSkeleton />
        ) : (
          <>
            <HomeMissionStage mission={data.mission} unit={unit} />
            <HomeWeekLockVault
              weeklyProgress={data.weeklyProgress}
              weeklyStreak={data.weeklyStreak}
              replanHref="/week"
              estimateMinutes={estimateMinutes}
              sealed={week?.sealed}
              sessionsLeft={week?.sessionsLeft}
              targetWeek={week?.targetWeek}
              paceLabel={timingPace?.label}
              paceTone={timingPace?.tone}
            />
            <HomePaceStrip timing={timing} />
            <HomeExtras
              stats={data.stats}
              dailyBonus={data.dailyBonus}
              milestone={data.milestone}
              leaderboard={data.leaderboard}
              badges={data.badges}
            />
          </>
        )}
      </motion.main>
    </div>
  );
}
