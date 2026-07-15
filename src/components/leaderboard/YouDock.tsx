"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import type { LeaderboardEntry } from "@/lib/leaderboard/types";
import { softSpring, snappySpring } from "./motion";

export function YouDock({
  entry,
  daysLeft,
}: {
  entry: LeaderboardEntry;
  daysLeft: number;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom)+8px)] z-20 mx-auto w-full max-w-md px-4">
      <motion.div
        className="pointer-events-auto overflow-hidden rounded-2xl bg-[#0f1220] shadow-[0_16px_40px_rgba(15,18,32,0.4)]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        transition={{ ...softSpring, delay: 0.15 }}
      >
        <div className="flex items-center gap-2.5 p-2.5">
          <div className="relative shrink-0">
            <UserAvatar
              initial={entry.initial}
              color={entry.avatarBg}
              textColor={entry.avatarColor}
              avatarUrl={entry.avatarUrl}
              className="h-9 w-9 rounded-xl text-[14px]"
              textClassName="font-display text-[14px] font-bold"
              alt=""
            />
            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#ffc928] px-1 font-display text-[9px] font-bold text-[#0f1220]">
              #{entry.rank}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-black text-white">
              {entry.name}
              <span className="ml-1.5 font-display text-[12px] font-bold text-white/60">
                {entry.xp} XP
              </span>
            </p>
            <p className="truncate text-[10.5px] font-bold text-[#ffc928]/80">
              {entry.nudge ?? `${daysLeft} days left to climb`}
            </p>
          </div>
          <motion.div
            whileTap={{ scale: 0.96, y: 1 }}
            transition={snappySpring}
            className="shrink-0"
          >
            <Link
              href="/path"
              className="flex items-center gap-1.5 rounded-xl bg-arc-purple-500 px-3 py-2 font-display text-[12px] font-semibold text-white shadow-[0_3px_0_#4b2fd6]"
            >
              Climb
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.75} />
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
