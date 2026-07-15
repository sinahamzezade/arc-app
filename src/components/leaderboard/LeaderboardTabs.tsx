"use client";

import { Award, ClipboardCheck, History, Trophy } from "lucide-react";
import type { LeaderboardTab } from "@/lib/leaderboard/types";
import { cn } from "@/lib/utils";

const tabs: {
  id: LeaderboardTab;
  label: string;
  icon: typeof Trophy;
}[] = [
  { id: "board", label: "Board", icon: Trophy },
  { id: "quests", label: "Quests", icon: ClipboardCheck },
  { id: "divisions", label: "Tiers", icon: Award },
  { id: "history", label: "Past", icon: History },
];

export function LeaderboardTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: LeaderboardTab;
  onTabChange: (tab: LeaderboardTab) => void;
}) {
  return (
    <div className="relative z-[1] -mt-4 px-4">
      <nav
        role="tablist"
        aria-label="League sections"
        className="flex gap-1 rounded-[20px] border-2 border-[#ebe4f6] bg-white p-1.5 shadow-[0_6px_0_#ebe4f6]"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-[14px] py-2.5 font-display text-[12px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none sm:gap-1.5 sm:text-[13px]",
                active
                  ? "bg-[#0f1220] text-[#ffc928] shadow-[0_2px_0_#2a2f45]"
                  : "text-arc-lavender-600 hover:text-[#0f1220]",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
