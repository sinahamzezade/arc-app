"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, MessageSquare, UserPlus } from "lucide-react";
import {
  ClayChipsSkeleton,
  CoinsClayChip,
  GemsClayChip,
  XpClayChip,
} from "@/components/economy";

type HomeHeaderProps = {
  coins: number;
  xp: number;
  gems: number;
  notificationCount: number;
  friendRequestCount?: number;
  chatUnreadCount?: number;
  loading?: boolean;
};

/**
 * Arc clay wallet chips + night utility icons.
 */
export function HomeHeader({
  coins,
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
        className="flex min-w-0 flex-1 items-center gap-1.5"
        aria-label="Balances"
        aria-busy={loading || undefined}
      >
        {loading ? (
          <ClayChipsSkeleton />
        ) : (
          <>
            <CoinsClayChip amount={coins} compact />
            <XpClayChip amount={xp} />
            <GemsClayChip amount={gems} />
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <IconBtn
          href="/chat"
          label={
            chatUnreadCount > 0
              ? `Chat, ${chatUnreadCount} unread`
              : "Chat"
          }
          count={chatUnreadCount}
          capAtNine
        >
          <MessageSquare className="h-4 w-4" strokeWidth={2.25} />
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
      className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
    >
      {children}
      {display ? (
        <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full border-2 border-[#0f1220] bg-arc-orange-400 px-[3px] text-[9px] font-extrabold text-white">
          {display}
        </span>
      ) : null}
    </Link>
  );
}
