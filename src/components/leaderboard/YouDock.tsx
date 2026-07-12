"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type { LeaderboardEntry } from "@/lib/leaderboard/mock-data";
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
        className="pointer-events-auto overflow-hidden rounded-[22px] bg-[#0f1220] shadow-[0_16px_40px_rgba(15,18,32,0.4)]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        transition={{ ...softSpring, delay: 0.15 }}
      >
        <div className="flex items-center gap-3 p-3.5">
          <div className="relative">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: entry.avatarBg }}
            >
              <span
                className="font-display text-[18px] font-bold"
                style={{ color: entry.avatarColor }}
              >
                {entry.initial}
              </span>
            </div>
            <span className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ffc928] px-1 font-display text-[11px] font-bold text-[#0f1220]">
              #{entry.rank}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black text-white">{entry.name}</p>
            <p className="truncate text-[11.5px] font-bold text-[#ffc928]/80">
              {entry.nudge ?? `${daysLeft} days left to climb`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-[18px] leading-none font-bold text-white">
              {entry.xp}
            </p>
            <p className="text-[9px] font-extrabold tracking-wide text-white/40 uppercase">
              XP
            </p>
          </div>
        </div>

        <motion.div whileTap={{ scale: 0.98, y: 1 }} transition={snappySpring}>
          <Link
            href="/path"
            className="flex w-full items-center justify-center gap-2 bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
          >
            Climb the board
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.75} />
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
