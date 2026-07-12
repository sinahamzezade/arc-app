"use client";

import { Check, ClipboardCheck } from "lucide-react";
import { motion } from "motion/react";
import type { LeagueQuest } from "@/lib/leaderboard/mock-data";
import { cn } from "@/lib/utils";
import { softSpring } from "./motion";

export function QuestCard({
  quest,
  index,
}: {
  quest: LeagueQuest;
  index: number;
}) {
  const pct = Math.min(100, Math.round((quest.progress / quest.goal) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -12 : 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...softSpring, delay: index * 0.04 }}
      className={cn(
        "overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white",
        quest.done && "border-[#d4eedf] bg-[#f6fbf8]",
        index === 1 && "ml-3",
      )}
    >
      <div className="flex items-stretch">
        <div
          className={cn(
            "flex w-14 shrink-0 items-center justify-center",
            quest.done
              ? "bg-[#16a56b] text-white"
              : "bg-[#f6f2ff] text-arc-purple-500",
          )}
        >
          {quest.done ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            <ClipboardCheck className="h-5 w-5" strokeWidth={2.25} />
          )}
        </div>
        <div className="min-w-0 flex-1 px-3.5 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display text-[15px] font-semibold text-[#1b1730]">
                {quest.title}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-[#8a7cb8]">
                {quest.detail}
              </p>
            </div>
            {!quest.done ? (
              <span className="shrink-0 rounded-full bg-[#0f1220] px-2.5 py-1 font-display text-[11px] font-bold text-[#ffc928]">
                +{quest.xpReward}
              </span>
            ) : null}
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#ebe4f6]">
            <motion.div
              className={cn(
                "h-full rounded-full",
                quest.done ? "bg-[#16a56b]" : "bg-arc-purple-500",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ ...softSpring, delay: 0.1 + index * 0.04 }}
            />
          </div>
          <p className="mt-1 text-[11px] font-extrabold text-[#8a7cb8]">
            {quest.progress}/{quest.goal}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
