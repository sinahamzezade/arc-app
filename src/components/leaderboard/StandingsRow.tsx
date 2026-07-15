"use client";

import Link from "next/link";
import { ChevronRight, Flame, ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import type { LeaderboardEntry } from "@/lib/leaderboard/types";
import { cn } from "@/lib/utils";
import { RankCell } from "./RankCell";
import { snappySpring } from "./motion";

export function StandingsRow({
  entry,
  zone,
}: {
  entry: LeaderboardEntry;
  zone: "promote" | "mid" | "demote";
}) {
  const you = entry.isYou;
  const anonymized = entry.anonymized;
  const href = you
    ? "/profile"
    : anonymized
      ? null
      : `/leaderboard/${entry.id}`;
  const showCheer = Boolean(entry.showLike && !anonymized);

  const rowClass = cn(
    "flex items-center gap-3 px-3 py-3 transition-colors",
    you && "bg-arc-purple-500/8",
    !you && zone === "promote" && entry.rank === 1 && "bg-[#fffbf0]",
    !you && zone === "demote" && "opacity-70",
  );

  const main = (
    <>
      <RankCell rank={entry.rank} />

      <UserAvatar
        initial={entry.initial}
        color={entry.avatarBg}
        textColor={entry.avatarColor}
        avatarUrl={entry.avatarUrl}
        className={cn(
          "h-10 w-10 shrink-0 rounded-[12px] text-[14px]",
          you && "ring-2 ring-arc-purple-500 ring-offset-1",
        )}
        textClassName="font-display text-[14px] font-bold"
        alt=""
      />

      <div className="min-w-0 flex-1 text-left">
        <p
          className={cn(
            "truncate text-[14px] font-semibold",
            you ? "text-arc-purple-500" : "text-[#0f1220]",
          )}
        >
          {entry.name}
          {you ? (
            <span className="ml-1.5 rounded-full bg-arc-purple-500 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white uppercase">
              You
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-arc-lavender-600">
          {entry.streakWeeks != null ? (
            <span className="inline-flex items-center gap-0.5">
              <Flame className="h-3 w-3 text-[#ff8a3d]" strokeWidth={2.25} />
              {entry.streakWeeks}w
            </span>
          ) : (
            <span>—</span>
          )}
          {entry.nudge && you ? (
            <span className="truncate text-arc-purple-500/70">{entry.nudge}</span>
          ) : null}
        </p>
      </div>

      <span
        className={cn(
          "shrink-0 font-display text-[15px] font-bold tabular-nums",
          you ? "text-arc-purple-500" : "text-[#0f1220]",
        )}
      >
        {entry.xp}
        <span className="ml-0.5 text-[10px] font-extrabold text-arc-lavender-500">
          XP
        </span>
      </span>
    </>
  );

  return (
    <div className={cn(rowClass, href && "hover:bg-[#faf8ff]")}>
      {href ? (
        <Link
          href={href}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:ring-offset-2"
          aria-label={you ? "Open your profile" : `Open ${entry.name}'s profile`}
        >
          {main}
          {!showCheer ? (
            <ChevronRight
              className="h-4 w-4 shrink-0 text-arc-lavender-400"
              strokeWidth={2.5}
            />
          ) : (
            <span className="w-4 shrink-0" aria-hidden />
          )}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{main}</div>
      )}

      {showCheer ? (
        <motion.button
          type="button"
          aria-label={`Cheer ${entry.name}`}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-arc-lavender-400 transition-colors hover:bg-[#f6f2ff] hover:text-arc-purple-500 focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:outline-none"
          whileTap={{ scale: 0.88 }}
          transition={snappySpring}
        >
          <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2} />
        </motion.button>
      ) : null}
    </div>
  );
}
