"use client";

import type { LeagueQuest } from "@/lib/leaderboard/mock-data";
import { QuestCard } from "./QuestCard";

export function QuestsPanel({ quests }: { quests: LeagueQuest[] }) {
  return (
    <div className="space-y-3">
      <div className="px-0.5">
        <h2 className="font-display text-[20px] font-bold text-[#1b1730]">
          Weekly quests
        </h2>
        <p className="mt-1 text-[12px] font-bold text-[#8a7cb8]">
          Extra League XP · resets Monday
        </p>
      </div>

      {quests.map((q, i) => (
        <QuestCard key={q.id} quest={q} index={i} />
      ))}
    </div>
  );
}
