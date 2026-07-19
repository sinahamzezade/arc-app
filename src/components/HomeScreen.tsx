"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowRight, Route } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useSession } from "next-auth/react";
import { useShallow } from "zustand/react/shallow";
import {
  emptyHomeData,
  greetingForHour,
  type HomeData,
} from "@/lib/home/types";
import { mapHomeFromBackend } from "@/lib/home/map-home";
import { isQuestionnaireComplete } from "@/lib/auth/post-auth-route";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeMissionStage } from "@/components/home/HomeMissionStage";
import { HomeQuestionnaireCta } from "@/components/home/HomeQuestionnaireCta";
import { HomeSheetSkeleton } from "@/components/home/HomeSheetSkeleton";
import { HomeWeekLockVault } from "@/components/home/HomeWeekLockVault";
import { sheetVariants } from "@/components/home/motion";
import { authCtaClassName } from "@/components/onboarding/AuthShell";
import { Button } from "@/components/ui/button";
import { useCourseTiming } from "@/hooks/useCourseTiming";
import { useCurrentRoadmap } from "@/hooks/useCurrentRoadmap";
import { useCurrentWeek } from "@/hooks/useCurrentWeek";
import { paceMeta } from "@/lib/course-timing/format";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";
import type {
  RoadmapCurrentResponse,
  WeekCurrentResponse,
} from "@/lib/api/types";

const HomeExtras = dynamic(
  () =>
    import("@/components/home/HomeExtras").then((m) => m.HomeExtras),
  { ssr: false },
);

/**
 * Home — night dispatch hero + light sheet.
 * Hierarchy: Mission → Week board → Boost / Track.
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
  const { timing } = useCourseTiming({ feasibility: false });
  const { xp, gems, coins } = useEconomyStore(
    useShallow((s) => ({ xp: s.xp, gems: s.gems, coins: s.coins })),
  );

  const qDone =
    questionnaireComplete || isQuestionnaireComplete(session?.profile ?? null);
  const liveRoadmap = roadmapRes?.roadmap ?? null;

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (qDone) return;
    router.replace("/questionnaire");
  }, [sessionStatus, qDone, router]);

  const sheetLoading =
    (sessionStatus === "loading" && !initialRoadmap && !initialWeek) ||
    (sessionStatus === "authenticated" &&
      (roadmapLoading || weekLoading) &&
      !roadmapRes &&
      !week);

  const { data, unit, identityArc } = useMemo(
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
      week,
      xp,
    ],
  );

  const greeting = greetingForHour(new Date().getHours());
  const timingPace = timing ? paceMeta(timing.pace) : null;
  const estimateMinutes =
    timing?.nextSession?.minutes ??
    week?.estimateMinutes ??
    data.mission.minutes;

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-7 text-white">
        <HomeHeader
          greeting={greeting}
          userName={data.userName}
          weekStreak={data.weeklyStreak.weeks}
          identityArc={identityArc}
          avatarUrl={session?.profile?.avatarUrl}
          xp={data.stats.xp}
          gems={data.stats.gems}
          coins={data.stats.coins}
        />
      </header>

      <motion.main
        className="relative z-10 -mt-6 space-y-3.5 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-8"
        initial={reduceMotion || sheetLoading ? false : "hidden"}
        animate="visible"
        variants={sheetVariants}
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
              <section className="relative overflow-hidden rounded-[28px] border-[3px] border-[#0a0c16] bg-[#0f1220] shadow-[0_7px_0_#0a0c16]">
                <div className="relative px-4 pt-4 pb-1">
                  <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#ffc928] uppercase">
                    Path · Cooking
                  </p>
                  <h2 className="mt-2 font-display text-[22px] leading-[1.1] font-bold tracking-[-0.035em] text-white">
                    Trail still baking
                  </h2>
                  <p className="mt-1.5 text-[13px] font-semibold text-white/50">
                    Open Path to watch generation or retry if it stalled.
                  </p>
                </div>
                <div className="relative px-3.5 pt-3 pb-3.5">
                  <Button
                    fullWidth
                    variant="primary"
                    onPress={() => router.push("/path")}
                    className={cn(
                      authCtaClassName,
                      "inline-flex cursor-pointer items-center justify-center gap-2",
                    )}
                  >
                    <Route className="size-5" strokeWidth={2.5} aria-hidden />
                    Open path
                    <ArrowRight className="size-5" strokeWidth={2.75} aria-hidden />
                  </Button>
                </div>
              </section>
            )}
            {liveRoadmap ? (
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
                timing={timing}
              />
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
