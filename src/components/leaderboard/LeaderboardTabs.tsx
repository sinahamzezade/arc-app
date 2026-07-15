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
    <div className="relative z-[1] -mt-5 px-4 pt-2">
      <nav
        role="tablist"
        aria-label="League sections"
        className="flex gap-1 rounded-[20px] border border-[#ebe4f6] bg-white p-1.5 shadow-[0_14px_32px_rgba(70,40,150,0.1)]"
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
                "flex flex-1 items-center justify-center gap-1.5 rounded-[14px] py-2.5 font-display text-[13px] font-semibold",
                active ? "bg-[#0f1220] text-[#ffc928]" : "text-[#8a7cb8]",
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
