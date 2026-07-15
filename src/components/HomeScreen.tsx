"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Route } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useSession } from "next-auth/react";
import {
  emptyHomeData,
  greetingForHour,
  type HomeData,
} from "@/lib/home/types";
import { mapHomeFromBackend } from "@/lib/home/map-home";
import { isQuestionnaireComplete } from "@/lib/auth/post-auth-route";
import { cn } from "@/lib/utils";
import { HomeExtras } from "@/components/home/HomeExtras";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeMissionStage } from "@/components/home/HomeMissionStage";
import { HomeQuestionnaireCta } from "@/components/home/HomeQuestionnaireCta";
import { HomePaceStrip } from "@/components/home/HomePaceStrip";
import { HomePortraitStage } from "@/components/home/HomePortraitStage";
import { HomeSheetSkeleton } from "@/components/home/HomeSheetSkeleton";
import { HomeWeekLockVault } from "@/components/home/HomeWeekLockVault";
import { useCourseTiming } from "@/hooks/useCourseTiming";
import { useCurrentRoadmap } from "@/hooks/useCurrentRoadmap";
import { useCurrentWeek } from "@/hooks/useCurrentWeek";
import { useIncomingFriendRequestCount } from "@/hooks/useIncomingFriendRequestCount";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import { useSystemFlags } from "@/hooks/useSystemFlags";
import { paceMeta } from "@/lib/course-timing/format";
import { useEconomyStore } from "@/store/useEconomyStore";
import type {
  RoadmapCurrentResponse,
  WeekCurrentResponse,
} from "@/lib/api/types";

/**
 * Home — night dispatch hero + light sheet.
 * Mission + week seal from `/roadmaps/current` + `/weeks/current`.
 * No live roadmap → never show Next Stop (admin reset / pre-path).
 */
export default function HomeScreen({
  data: dataProp,
  initialRoadmap,
  initialWeek,
  questionnaireComplete = false,
}: {
  data?: HomeData;
  initialRoadmap?: RoadmapCurrentResponse;
  initialWeek?: WeekCurrentResponse;
  questionnaireComplete?: boolean;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { data: session, status: sessionStatus } = useSession();
  const { data: roadmapRes, isLoading: roadmapLoading } =
    useCurrentRoadmap(initialRoadmap);
  const { week, isLoading: weekLoading } = useCurrentWeek(initialWeek);
  const { timing } = useCourseTiming();
  const { data: unreadCount } = useUnreadNotificationCount();
  const { data: friendRequestCount } = useIncomingFriendRequestCount();
  const { flags } = useSystemFlags();
  const xp = useEconomyStore((s) => s.xp);
  const gems = useEconomyStore((s) => s.gems);
  const coins = useEconomyStore((s) => s.coins);
  const economyHydrated = useEconomyStore((s) => s.hydrated);

  const qDone =
    questionnaireComplete ||
    isQuestionnaireComplete(session?.profile ?? null);
  const liveRoadmap = roadmapRes?.roadmap ?? null;

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (qDone) return;
    router.replace("/questionnaire");
  }, [sessionStatus, qDone, router]);

  const sheetLoading =
    (sessionStatus === "loading" &&
      !initialRoadmap &&
      !initialWeek) ||
    (sessionStatus === "authenticated" &&
      (roadmapLoading || weekLoading) &&
      !roadmapRes &&
      !week);

  const { data, unit } = useMemo(
    () =>
      mapHomeFromBackend({
        base: dataProp ?? emptyHomeData(),
        roadmap: liveRoadmap,
        week: week ?? null,
        userName:
          session?.profile?.displayName ||
          session?.user?.name ||
          dataProp?.userName ||
          "",
        xp,
        gems,
        coins,
        notificationCount: unreadCount ?? dataProp?.notificationCount ?? 0,
        weeklyStreakWeeks: session?.profile?.weeklyStreak,
      }),
    [
      coins,
      dataProp,
      gems,
      liveRoadmap,
      session?.profile?.displayName,
      session?.profile?.weeklyStreak,
      session?.user?.name,
      unreadCount,
      week,
      xp,
    ],
  );

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const askArloHref =
    flags.arlo_ai_enabled &&
    liveRoadmap &&
    data.mission.href.startsWith("/learn/")
      ? `${data.mission.href}/arlo`
      : liveRoadmap && data.mission.href.startsWith("/learn/")
        ? data.mission.href
        : "/learn";
  const timingPace = timing ? paceMeta(timing.pace) : null;
  const estimateMinutes =
    timing?.nextSession?.minutes ??
    week?.estimateMinutes ??
    data.mission.minutes;

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-10 text-white">
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
            friendRequestCount={friendRequestCount ?? 0}
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
        className="relative z-10 -mt-6 space-y-4 rounded-t-arc-xl bg-[#f2eefb] px-4 pt-4 pb-6"
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
            {liveRoadmap ? (
              <HomeMissionStage mission={data.mission} unit={unit} />
            ) : !qDone ? (
              <HomeQuestionnaireCta />
            ) : (
              <section className="relative overflow-hidden rounded-[26px] bg-white p-4 shadow-[0_16px_32px_rgba(70,40,150,0.16)] ring-1 ring-[#ebe4f6]">
                <p className="text-[10px] font-black tracking-[0.1em] text-arc-purple-500 uppercase">
                  Path · Building
                </p>
                <h2 className="mt-1.5 font-display text-[22px] leading-[1.05] font-bold tracking-[-0.03em] text-[#1b1730]">
                  Your trail is cooking
                </h2>
                <p className="mt-1.5 text-[13px] font-bold text-[#8a7cb8]">
                  Open Path to watch generation or retry if it stalled.
                </p>
                <Link
                  href="/path"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_6px_0_#4b2fd6]"
                >
                  <Route className="h-4 w-4" strokeWidth={2.5} />
                  Open path
                  <ArrowRight className="h-4 w-4" strokeWidth={2.75} />
                </Link>
              </section>
            )}
            {liveRoadmap ? (
              <div
                className={cn(
                  "grid items-stretch gap-2.5",
                  timing ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                <HomePaceStrip timing={timing} />
                <HomeWeekLockVault
                  weeklyProgress={data.weeklyProgress}
                  weeklyStreak={data.weeklyStreak}
                  replanHref={week?.replanHref ?? "/week/plan"}
                  estimateMinutes={estimateMinutes}
                  sealed={week?.sealed}
                  sessionsLeft={week?.sessionsLeft}
                  targetWeek={week?.targetWeek}
                  paceLabel={timingPace?.label}
                  paceTone={timingPace?.tone}
                />
              </div>
            ) : null}
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
