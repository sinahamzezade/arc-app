"use client";

import Link from "next/link";
import { Flame, ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
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

  return (
    <tr
      className={cn(
        "border-b border-[#f0ecf7] last:border-b-0",
        you && "bg-arc-purple-500/10",
        !you && zone === "promote" && entry.rank === 1 && "bg-[#fffbf0]",
        !you && zone === "demote" && "opacity-60",
      )}
    >
      <td className="px-3 py-3 text-center align-middle">
        {href ? (
          <Link href={href} className="block" tabIndex={-1}>
            <RankCell rank={entry.rank} />
          </Link>
        ) : (
          <RankCell rank={entry.rank} />
        )}
      </td>

      <td className="px-2 py-3 align-middle">
        {href ? (
          <Link
            href={href}
            className="flex min-w-0 items-center gap-2.5"
            aria-label={
              you ? "Open your profile" : `Open ${entry.name}'s profile`
            }
          >
            <LearnerCell entry={entry} you={!!you} />
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-2.5">
            <LearnerCell entry={entry} you={!!you} />
          </div>
        )}
      </td>

      <td className="px-2 py-3 text-center align-middle">
        {href ? (
          <Link href={href} className="block" tabIndex={-1}>
            <StreakCell entry={entry} />
          </Link>
        ) : (
          <StreakCell entry={entry} />
        )}
      </td>

      <td className="px-3 py-3 text-right align-middle">
        {href ? (
          <Link href={href} className="block" tabIndex={-1}>
            <XpCell entry={entry} you={!!you} />
          </Link>
        ) : (
          <XpCell entry={entry} you={!!you} />
        )}
      </td>

      <td className="px-2 py-3 align-middle">
        {entry.showLike && !anonymized ? (
          <motion.button
            type="button"
            aria-label={`Cheer ${entry.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#b3a8d6] hover:bg-[#f6f2ff]"
            whileTap={{ scale: 0.88 }}
            transition={snappySpring}
          >
            <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2} />
          </motion.button>
        ) : (
          <span className="block h-8 w-8" aria-hidden />
        )}
      </td>
    </tr>
  );
}

function LearnerCell({
  entry,
  you,
}: {
  entry: LeaderboardEntry;
  you: boolean;
}) {
  return (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-[14px] font-bold",
          you && "ring-2 ring-arc-purple-500 ring-offset-1",
        )}
        style={{ background: entry.avatarBg, color: entry.avatarColor }}
      >
        {entry.initial}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-[14px] font-semibold",
            you ? "text-arc-purple-500" : "text-[#1b1730]",
          )}
        >
          {entry.name}
          {you ? (
            <span className="ml-1.5 rounded-full bg-arc-purple-500 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white uppercase">
              You
            </span>
          ) : null}
        </span>
        {entry.nudge && you ? (
          <span className="mt-0.5 block truncate text-[10px] font-bold text-arc-purple-500/70">
            {entry.nudge}
          </span>
        ) : null}
      </span>
    </>
  );
}

function StreakCell({ entry }: { entry: LeaderboardEntry }) {
  if (entry.streakWeeks != null) {
    return (
      <span className="inline-flex items-center justify-center gap-0.5 text-[12px] font-bold text-[#8a7cb8]">
        <Flame className="h-3.5 w-3.5 text-[#ff8a3d]" strokeWidth={2.25} />
        {entry.streakWeeks}w
      </span>
    );
  }
  return <span className="text-[12px] font-medium text-[#d5cee8]">—</span>;
}

function XpCell({
  entry,
  you,
}: {
  entry: LeaderboardEntry;
  you: boolean;
}) {
  return (
    <span
      className={cn(
        "font-display text-[15px] font-bold tabular-nums",
        you ? "text-arc-purple-500" : "text-[#1b1730]",
      )}
    >
      {entry.xp}
    </span>
  );
}
