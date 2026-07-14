"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSession } from "next-auth/react";
import { useCurrentLeague } from "@/hooks/useCurrentLeague";
import { useLeagueHistory } from "@/hooks/useLeagueHistory";
import { ApiError, messageForCode } from "@/lib/api/errors";
import type {
  LeaderboardData,
  LeaderboardTab,
} from "@/lib/leaderboard/types";
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

function LeagueGate({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
      <p className="text-center font-display text-[20px] font-bold text-[#1b1730]">
        Can&apos;t load league
      </p>
      <p className="text-center text-[13px] font-semibold text-[#8a7cb8]">
        {message ?? "Something went wrong"}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-[#0f1220] px-5 py-2.5 text-[13px] font-black text-white"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

/**
 * Season stage — matches Battle/Wallet night-hero family.
 * Giant rank + overlapping race chips + soft standings table.
 */
export default function LeaderboardScreen({
  data: dataProp,
}: {
  data?: LeaderboardData;
}) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("board");
  const { status } = useSession();
  const { league, isLoading, isError, error, refetch } = useCurrentLeague();

  if (dataProp) {
    return (
      <LeaderboardBoard
        data={dataProp}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  }

  if (
    status === "loading" ||
    (status === "authenticated" && isLoading && !league)
  ) {
    return <LeaderboardSkeleton />;
  }

  if (status !== "authenticated") {
    return <LeagueGate message="Sign in to join this week's league." />;
  }

  if (isError || !league) {
    const msg =
      error instanceof ApiError
        ? messageForCode(error.code, error.message)
        : error instanceof Error
          ? error.message
          : "Could not load your league.";
    return <LeagueGate message={msg} onRetry={() => void refetch()} />;
  }

  return (
    <LeaderboardBoard
      data={league}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}

function LeaderboardBoard({
  data,
  activeTab,
  onTabChange,
}: {
  data: LeaderboardData;
  activeTab: LeaderboardTab;
  onTabChange: (tab: LeaderboardTab) => void;
}) {
  const you = data.entries.find((e) => e.isYou);
  const historyQuery = useLeagueHistory();

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <SeasonHero data={data} you={you} />

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
                  <h3 className="mb-2 px-0.5 font-display text-[16px] font-bold text-[#1b1730]">
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

      <AnimatePresence>
        {you && activeTab === "board" ? (
          <YouDock key="you-dock" entry={you} daysLeft={data.stats.daysLeft} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
