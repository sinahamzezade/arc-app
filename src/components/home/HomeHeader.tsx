"use client";

import Link from "next/link";
import { Bell, Flame, Gem } from "lucide-react";
import type { HomeMockData } from "@/lib/home/mock-data";

type HomeHeaderProps = {
  streakWeeks: HomeMockData["weeklyStreak"]["weeks"];
  gems: HomeMockData["stats"]["gems"];
  notificationCount: HomeMockData["notificationCount"];
};

/**
 * Compact clay stamps — streak · gems · bell.
 */
export function HomeHeader({
  streakWeeks,
  gems,
  notificationCount,
}: HomeHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/week"
        aria-label={`${streakWeeks} week streak`}
        className="inline-flex items-center gap-1 rounded-xl bg-arc-orange-400 py-1 pr-2.5 pl-1 text-white shadow-[0_2px_0_#d46520] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 active:translate-y-px active:shadow-[0_1px_0_#d46520]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0f1220]/15">
          <Flame
            className="h-3 w-3"
            fill="currentColor"
            strokeWidth={1.5}
          />
        </span>
        <span className="flex items-baseline gap-0.5">
          <span className="font-display text-[14px] leading-none font-bold tabular-nums">
            {streakWeeks}
          </span>
          <span className="text-[8px] font-extrabold tracking-[0.1em] uppercase opacity-80">
            wks
          </span>
        </span>
      </Link>

      <Link
        href="/wallet"
        aria-label={`${gems} gems`}
        className="inline-flex items-center gap-1 rounded-xl bg-arc-purple-500 py-1 pr-2.5 pl-1 text-white shadow-[0_2px_0_var(--color-arc-purple-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] active:translate-y-px active:shadow-[0_1px_0_var(--color-arc-purple-700)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15">
          <Gem className="h-3 w-3" strokeWidth={2.5} />
        </span>
        <span className="font-display text-[14px] leading-none font-bold tabular-nums">
          {gems.toLocaleString()}
        </span>
      </Link>

      <div className="flex-1" />

      <Link
        href="/notifications"
        aria-label={
          notificationCount > 0
            ? `Notifications, ${notificationCount} unread`
            : "Notifications"
        }
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
      >
        <Bell className="h-4 w-4" strokeWidth={2.25} />
        {notificationCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-arc-orange-400 px-[3px] text-[9px] font-extrabold text-white">
            {notificationCount}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
