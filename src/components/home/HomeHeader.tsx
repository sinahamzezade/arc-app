"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Gem, Send, UserPlus, Wallet, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { formatBalance } from "@/lib/economy/format-balance";
import { cn } from "@/lib/utils";

type HomeHeaderProps = {
  xp: number;
  gems: number;
  notificationCount: number;
  friendRequestCount?: number;
  chatUnreadCount?: number;
  loading?: boolean;
};

/**
 * Compact wallet entry + utility icons. Full balances live on /wallet.
 */
export function HomeHeader({
  xp,
  gems,
  notificationCount,
  friendRequestCount = 0,
  chatUnreadCount = 0,
  loading = false,
}: HomeHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex min-w-0 flex-1 items-center"
        aria-busy={loading || undefined}
      >
        {loading ? (
          <Skeleton
            animationType="shimmer"
            className="h-9 w-[9.5rem] rounded-xl bg-white/15"
          />
        ) : (
          <Link
            href="/wallet"
            aria-label={`Wallet — ${xp.toLocaleString()} XP, ${gems.toLocaleString()} gems. Open for coins too.`}
            className={cn(
              "inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-2.5 py-1.5",
              "text-white/90 ring-1 ring-white/10 transition-colors duration-200",
              "hover:bg-white/15 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Wallet className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <span className="flex min-w-0 items-center gap-2 font-display text-[12px] font-bold tabular-nums">
              <span className="inline-flex items-center gap-0.5 text-[#7eb8ff]">
                <Zap
                  className="h-3 w-3"
                  strokeWidth={2.5}
                  fill="currentColor"
                />
                {formatBalance(xp)}
              </span>
              <span className="text-white/25" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-0.5 text-[#d4a8ff]">
                <Gem className="h-3 w-3" strokeWidth={2.5} />
                {formatBalance(gems)}
              </span>
            </span>
          </Link>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <IconBtn
          href="/chat"
          label={
            chatUnreadCount > 0 ? `Chat, ${chatUnreadCount} unread` : "Chat"
          }
          count={chatUnreadCount}
          capAtNine
        >
          <Send className="h-4 w-4" strokeWidth={2.25} />
        </IconBtn>
        <IconBtn
          href="/friends?tab=requests"
          label={
            friendRequestCount > 0
              ? `Friend requests, ${friendRequestCount} pending`
              : "Friend requests"
          }
          count={friendRequestCount}
        >
          <UserPlus className="h-4 w-4" strokeWidth={2.25} />
        </IconBtn>
        <IconBtn
          href="/notifications"
          label={
            notificationCount > 0
              ? `Notifications, ${notificationCount} unread`
              : "Notifications"
          }
          count={notificationCount}
        >
          <Bell className="h-4 w-4" strokeWidth={2.25} />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  href,
  label,
  count,
  children,
  capAtNine = false,
}: {
  href: string;
  label: string;
  count: number;
  children: ReactNode;
  capAtNine?: boolean;
}) {
  const display =
    count <= 0
      ? null
      : capAtNine && count > 9
        ? "9+"
        : count > 99
          ? "99+"
          : String(count);

  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-white/85 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
    >
      {children}
      {display ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-arc-orange-400 px-[3px] text-[8px] font-extrabold text-white">
          {display}
        </span>
      ) : null}
    </Link>
  );
}
