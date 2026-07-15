"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useSession } from "next-auth/react";
import { useCurrentLeague } from "@/hooks/useCurrentLeague";
import { useLeagueHistory } from "@/hooks/useLeagueHistory";
import { ApiError, messageForCode } from "@/lib/api/errors";
import type { LeaderboardData, LeaderboardTab } from "@/lib/leaderboard/types";
import { cn } from "@/lib/utils";
import { DivisionsPanel } from "@/components/leaderboard/DivisionsPanel";
import { HistoryPanel } from "@/components/leaderboard/HistoryPanel";
import { LeaderboardSkeleton } from "@/components/leaderboard/LeaderboardSkeleton";
import { LeaderboardTabs } from "@/components/leaderboard/LeaderboardTabs";
import { softSpring } from "@/components/leaderboard/motion";
import { QuestsPanel } from "@/components/leaderboard/QuestsPanel";
import { ScoreBreakdownPanel } from "@/components/leaderboard/ScoreBreakdownPanel";
import { SeasonHero } from "@/components/leaderboard/SeasonHero";
import { StandingsTable } from "@/components/leaderboard/StandingsTable";
import { YouDock } from "@/components/leaderboard/YouDock";

const TAB_IDS: LeaderboardTab[] = ["board", "quests", "divisions", "history"];

function parseTab(raw: string | null): LeaderboardTab {
  if (raw && TAB_IDS.includes(raw as LeaderboardTab)) {
    return raw as LeaderboardTab;
  }
  return "board";
}

function LeagueGate({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
      <p className="text-center font-display text-[20px] font-bold text-[#0f1220]">
        Can&apos;t load league
      </p>
      <p className="text-center text-[13px] font-semibold text-arc-lavender-600">
        {message ?? "Something went wrong"}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex h-11 cursor-pointer items-center justify-center rounded-[16px] bg-[#0f1220] px-5 text-[13px] font-extrabold text-white shadow-[0_3px_0_#2a2f45] focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:outline-none"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

/**
 * Season stage — night hero + tabbed board.
 * Tab deep-linked via ?tab=
 */
export default function LeaderboardScreen({
  data: dataProp,
}: {
  data?: LeaderboardData;
}) {
  const { status } = useSession();
  const { league, isLoading, isError, error, refetch } =
    useCurrentLeague(dataProp);
  const data = league ?? dataProp;

  if (
    (status === "loading" && !data) ||
    (status === "authenticated" && isLoading && !data)
  ) {
    return <LeaderboardSkeleton />;
  }

  if (status !== "authenticated" && !data) {
    return <LeagueGate message="Sign in to join this week's league." />;
  }

  if ((isError && !data) || !data) {
    const msg =
      error instanceof ApiError
        ? messageForCode(error.code, error.message)
        : error instanceof Error
          ? error.message
          : "Could not load your league.";
    return <LeagueGate message={msg} onRetry={() => void refetch()} />;
  }

  return <LeaderboardBoard data={data} />;
}

function LeaderboardBoard({ data }: { data: LeaderboardData }) {
  const you = data.entries.find((e) => e.isYou);
  const historyQuery = useLeagueHistory();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = useMemo(
    () => parseTab(searchParams.get("tab")),
    [searchParams],
  );

  const onTabChange = useCallback(
    (tab: LeaderboardTab) => {
      const next = new URLSearchParams(searchParams.toString());
      if (tab === "board") next.delete("tab");
      else next.set("tab", tab);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <SeasonHero data={data} you={you} />

      <div className="relative z-10 -mt-4 rounded-t-[28px] bg-[#f3effc] pt-1 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <LeaderboardTabs activeTab={activeTab} onTabChange={onTabChange} />

        <div
          className={cn(
            "relative px-4 pt-5",
            you && activeTab === "board"
              ? "pb-[calc(5.25rem+env(safe-area-inset-bottom)+128px)]"
              : "pb-[calc(5.25rem+env(safe-area-inset-bottom)+24px)]",
          )}
        >
          <AnimatePresence mode="wait">
            {activeTab === "board" ? (
              <motion.div
                key="board"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={softSpring}
                className="space-y-5"
              >
                <StandingsTable data={data} />
                {data.me ? (
                  <div>
                    <h3 className="mb-2 px-0.5 font-display text-[16px] font-bold text-[#0f1220]">
                      Score sources
                    </h3>
                    <ScoreBreakdownPanel
                      breakdown={data.scoreSourceBreakdown ?? {}}
                      proofWeightedXp={data.me.proofWeightedXp}
                      activeDays={data.me.activeDays}
                    />
                  </div>
                ) : null}
              </motion.div>
            ) : null}
            {activeTab === "quests" ? (
              <motion.div
                key="quests"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={softSpring}
              >
                <QuestsPanel quests={data.quests} />
              </motion.div>
            ) : null}
            {activeTab === "divisions" ? (
              <motion.div
                key="divisions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={softSpring}
              >
                <DivisionsPanel divisions={data.divisions} />
              </motion.div>
            ) : null}
            {activeTab === "history" ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={softSpring}
              >
                <HistoryPanel
                  history={historyQuery.data}
                  loading={historyQuery.isLoading}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {you && activeTab === "board" ? (
          <YouDock key="you-dock" entry={you} daysLeft={data.stats.daysLeft} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
