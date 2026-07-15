"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Coins, Gem, UserPlus, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

type HomeHeaderProps = {
  coins: number;
  xp: number;
  gems: number;
  notificationCount: number;
  friendRequestCount?: number;
  loading?: boolean;
};

function formatBalance(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}m`;
  }
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return n.toLocaleString();
}

/**
 * Arc clay wallet chips — same stamp language as Rank / CTAs.
 * Coin gold · XP blue · Gem purple + night bell.
 */
export function HomeHeader({
  coins,
  xp,
  gems,
  notificationCount,
  friendRequestCount = 0,
  loading = false,
}: HomeHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex min-w-0 flex-1 items-center gap-1.5"
        aria-label="Balances"
        aria-busy={loading || undefined}
      >
        {loading ? (
          <ChipsSkeleton />
        ) : (
          <>
            <ClayChip
              href="/wallet"
              label={`${coins.toLocaleString()} coins`}
              value={formatBalance(coins)}
              tone="coin"
              icon={<Coins className="h-3.5 w-3.5" strokeWidth={2.5} />}
            />
            <ClayChip
              href="/rank"
              label={`${xp.toLocaleString()} XP`}
              value={formatBalance(xp)}
              tone="xp"
              icon={
                <Zap
                  className="h-3.5 w-3.5"
                  strokeWidth={2.5}
                  fill="currentColor"
                />
              }
            />
            <ClayChip
              href="/wallet"
              label={`${gems.toLocaleString()} gems`}
              value={formatBalance(gems)}
              tone="gem"
              icon={<Gem className="h-3.5 w-3.5" strokeWidth={2.5} />}
            />
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href="/friends?tab=requests"
          aria-label={
            friendRequestCount > 0
              ? `Friend requests, ${friendRequestCount} pending`
              : "Friend requests"
          }
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
        >
          <UserPlus className="h-4 w-4" strokeWidth={2.25} />
          {friendRequestCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-arc-orange-400 px-[3px] text-[9px] font-extrabold text-white">
              {friendRequestCount > 99 ? "99+" : friendRequestCount}
            </span>
          ) : null}
        </Link>

        <Link
          href="/notifications"
          aria-label={
            notificationCount > 0
              ? `Notifications, ${notificationCount} unread`
              : "Notifications"
          }
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
        >
          <Bell className="h-4 w-4" strokeWidth={2.25} />
          {notificationCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-arc-orange-400 px-[3px] text-[9px] font-extrabold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}

function ClayChip({
  href,
  label,
  value,
  tone,
  icon,
}: {
  href: string;
  label: string;
  value: string;
  tone: "coin" | "xp" | "gem";
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "inline-flex min-w-0 cursor-pointer items-center gap-1 rounded-xl py-1 pr-2.5 pl-1 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1220] active:translate-y-px active:shadow-none",
        tone === "coin" &&
          "bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]",
        tone === "xp" &&
          "bg-[#2d8cff] text-white shadow-[0_3px_0_#1a5fad]",
        tone === "gem" &&
          "bg-[#b35cff] text-white shadow-[0_3px_0_#7a2fc4]",
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black/15">
        {icon}
      </span>
      <span className="truncate font-display text-[13px] leading-none font-bold tabular-nums">
        {value}
      </span>
    </Link>
  );
}

function ChipsSkeleton() {
  return (
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-label="Loading balances"
    >
      {[
        "bg-[#ffc928]/40",
        "bg-[#2d8cff]/40",
        "bg-[#b35cff]/40",
      ].map((bg, i) => (
        <Skeleton
          key={i}
          animationType="shimmer"
          className={cn("h-8 w-[4.5rem] rounded-xl", bg)}
        />
      ))}
    </div>
  );
}
