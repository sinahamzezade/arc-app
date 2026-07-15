"use client";

import type { LeagueQuest } from "@/lib/leaderboard/types";
import { QuestCard } from "./QuestCard";

export function QuestsPanel({ quests }: { quests: LeagueQuest[] }) {
  return (
    <div className="space-y-3">
      <div className="px-0.5">
        <h2 className="font-display text-[20px] font-bold text-[#0f1220]">
          Weekly quests
        </h2>
        <p className="mt-1 text-[12px] font-bold text-arc-lavender-600">
          Extra League XP · resets Monday
        </p>
      </div>

      {quests.length === 0 ? (
        <div className="rounded-[20px] border-2 border-dashed border-[#d5ccec] bg-white px-4 py-8 text-center">
          <p className="font-display text-[15px] font-bold text-[#0f1220]">
            No quests this week
          </p>
          <p className="mt-1 text-[13px] font-bold text-arc-lavender-600">
            Check back after Monday reset.
          </p>
        </div>
      ) : (
        quests.map((q, i) => <QuestCard key={q.id} quest={q} index={i} />)
      )}
    </div>
  );
}
