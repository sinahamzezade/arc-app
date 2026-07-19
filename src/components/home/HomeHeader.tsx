"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Coins, Flame, Gem, Send, Users, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useIncomingFriendRequestCount } from "@/hooks/useIncomingFriendRequestCount";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import { useUnreadChatCount } from "@/hooks/useUnreadChatCount";
import { formatBalance } from "@/lib/economy/format-balance";
import { useEconomyStore } from "@/store/useEconomyStore";
import { cn } from "@/lib/utils";
import { pop, soft } from "./motion";

type HomeHeaderProps = {
  greeting: string;
  userName: string;
  weekStreak?: number;
  identityArc?: string | null;
  avatarUrl?: string | null;
  xp: number;
  gems: number;
  coins?: number;
};

/**
 * Learner plate — night clay ID with status ports.
 * Built from zero (not a polish of the old masthead).
 * Owns badge counts + economy hydration so pulse ticks stay off the sheet.
 */
export function HomeHeader({
  greeting,
  userName,
  weekStreak = 0,
  identityArc,
  avatarUrl,
  xp,
  gems,
  coins = 0,
}: HomeHeaderProps) {
  const reduceMotion = useReducedMotion();
  const { status: sessionStatus } = useSession();
  const economyHydrated = useEconomyStore((s) => s.hydrated);
  const { data: notificationCount = 0 } = useUnreadNotificationCount();
  const { data: friendRequestCount = 0 } = useIncomingFriendRequestCount();
  const { data: chatUnreadCount = 0 } = useUnreadChatCount();
  const loading = sessionStatus === "authenticated" && !economyHydrated;
  const name = userName?.trim() || "Learner";
  const initial = (name[0] || "?").toUpperCase();
  const dayStamp = greeting.replace(/^good\s+/i, "").trim() || "today";

  return (
    <motion.div
      className="relative"
      aria-label="Learner status"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={soft}
    >
      {/* Plate body */}
      <div className="relative overflow-hidden rounded-[28px] border-[3px] border-[#0a0c16] bg-arc-purple-500 shadow-[0_7px_0_#35209d]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 -right-6 h-28 w-28 rounded-full bg-[#ffc928]/25 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-[#0f1220]/35 blur-2xl"
        />

        {/* Corner day tab */}
        <span className="absolute top-0 right-5 z-[1] rounded-b-xl border-x-[3px] border-b-[3px] border-[#0a0c16] bg-[#ffc928] px-2.5 py-1 font-display text-[10px] font-bold tracking-[0.14em] text-[#0f1220] uppercase shadow-[0_3px_0_#c79a2e]">
          {dayStamp}
        </span>

        <div className="relative flex gap-3 px-3.5 pt-4 pb-3.5">
          {/* Stamp portrait */}
          <motion.div
            className="relative shrink-0"
            whileTap={reduceMotion ? undefined : { y: 2 }}
            transition={pop}
          >
            <div className="rounded-[22px] border-[3px] border-[#0a0c16] bg-[#0f1220] p-1 shadow-[0_4px_0_#0a0c16]">
              <UserAvatar
                initial={initial}
                avatarUrl={avatarUrl}
                className="h-14 w-14 rounded-[16px]"
                textClassName="text-[22px]"
                alt=""
              />
            </div>
            {weekStreak > 0 ? (
              <span
                className="absolute -right-2 -bottom-2 inline-flex items-center gap-0.5 rounded-full border-[3px] border-[#0a0c16] bg-[#ffc928] px-1.5 py-0.5 font-display text-[11px] font-bold text-[#0f1220] shadow-[0_2px_0_#c79a2e]"
                aria-label={`${weekStreak} week streak`}
              >
                <Flame
                  className="h-3 w-3"
                  strokeWidth={2.75}
                  fill="currentColor"
                />
                {weekStreak}
              </span>
            ) : null}
          </motion.div>

          {/* Name block — stacked stamp style */}
          <div className="min-w-0 flex-1 pt-0.5 pr-14">
            <p className="text-[10px] font-extrabold tracking-[0.18em] text-white/55 uppercase">
              Callsign
            </p>
            <h1 className="mt-0.5 truncate font-display text-[26px] leading-[0.95] font-bold tracking-[-0.045em] text-white">
              {name}
            </h1>
            <div className="mt-2 inline-flex max-w-full items-center rounded-full border-[3px] border-[#0a0c16] bg-[#0f1220] px-2.5 py-1 shadow-[0_3px_0_#0a0c16]">
              <span className="truncate font-display text-[11px] font-bold text-[#ffc928]">
                {identityArc?.trim() || "Trailblazer"}
              </span>
            </div>
          </div>
        </div>

        {/* Economy stamps — equal-width trio */}
        <div
          className="relative mx-3.5 mb-3 grid grid-cols-3 gap-2"
          aria-busy={loading || undefined}
        >
          {loading ? (
            <>
              <Skeleton
                animationType="shimmer"
                className="h-[52px] w-full rounded-2xl bg-white/15"
              />
              <Skeleton
                animationType="shimmer"
                className="h-[52px] w-full rounded-2xl bg-white/15"
              />
              <Skeleton
                animationType="shimmer"
                className="h-[52px] w-full rounded-2xl bg-white/15"
              />
            </>
          ) : (
            <>
              <StampLink
                href="/wallet"
                label={`XP ${xp.toLocaleString()}`}
                icon={
                  <Zap
                    className="h-4 w-4 text-[#7eb8ff]"
                    strokeWidth={2.5}
                    fill="currentColor"
                  />
                }
                value={formatBalance(xp)}
                caption="XP"
              />
              <StampLink
                href="/wallet"
                label={`Gems ${gems.toLocaleString()}`}
                icon={
                  <Gem className="h-4 w-4 text-[#e4c4ff]" strokeWidth={2.5} />
                }
                value={formatBalance(gems)}
                caption="Gem"
              />
              <StampLink
                href="/wallet"
                label={`Coins ${coins.toLocaleString()}`}
                icon={
                  <Coins className="h-4 w-4 text-[#ffc928]" strokeWidth={2.5} />
                }
                value={formatBalance(coins)}
                caption="Coins"
              />
            </>
          )}
        </div>
      </div>

      {/* Quiet utility row — secondary to the plate */}
      <nav
        aria-label="Quick signals"
        className="mt-3 flex items-center justify-between gap-1 px-0.5"
      >
        <Port
          href="/chat"
          label={
            chatUnreadCount > 0
              ? `Messages, ${chatUnreadCount} unread`
              : "Messages"
          }
          title="Direct"
          icon={<Send className="h-3.5 w-3.5" strokeWidth={2.25} />}
          count={chatUnreadCount}
          capAtNine
        />
        <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden />
        <Port
          href="/friends?tab=requests"
          label={
            friendRequestCount > 0
              ? `Crew, ${friendRequestCount} requests`
              : "Crew"
          }
          title="Friend"
          icon={<Users className="h-3.5 w-3.5" strokeWidth={2.25} />}
          count={friendRequestCount}
        />
        <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden />
        <Port
          href="/notifications"
          label={
            notificationCount > 0
              ? `Alerts, ${notificationCount} unread`
              : "Alerts"
          }
          title="Alerts"
          icon={<Bell className="h-3.5 w-3.5" strokeWidth={2.25} />}
          count={notificationCount}
        />
      </nav>
    </motion.div>
  );
}

function StampLink({
  href,
  label,
  icon,
  value,
  caption,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  value: string;
  caption: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex min-w-0 w-full cursor-pointer items-center gap-1.5 rounded-lg border-[3px] border-[#0a0c16] bg-[#0f1220] px-2 py-2",
        "shadow-[0_4px_0_#0a0c16] transition-[transform,box-shadow] duration-200",
        "hover:translate-y-px hover:shadow-[0_3px_0_#0a0c16]",
        "active:translate-y-[3px] active:shadow-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-arc-purple-500",
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/8">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[14px] leading-none font-bold tabular-nums text-white">
          {value}
        </span>
        <span className="mt-0.5 block truncate text-[9px] font-extrabold tracking-[0.12em] text-white/45 uppercase">
          {caption}
        </span>
      </span>
    </Link>
  );
}

function Port({
  href,
  label,
  title,
  icon,
  count,
  capAtNine = false,
}: {
  href: string;
  label: string;
  title: string;
  icon: ReactNode;
  count: number;
  capAtNine?: boolean;
}) {
  const badge =
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
      className={cn(
        "relative flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-1 py-1.5",
        "text-white/45 transition-colors duration-200",
        "hover:bg-white/5 hover:text-white/75",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]/60",
      )}
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      <span className="truncate text-[11px] font-semibold tracking-tight">
        {title}
      </span>
      {badge ? (
        <span className="shrink-0 rounded-md bg-white/10 px-1 py-px text-[9px] font-bold tabular-nums text-white/70">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
