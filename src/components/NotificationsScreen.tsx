"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import {
  Award,
  Bell,
  Calendar,
  CheckCheck,
  Flame,
  Gift,
  Radio,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNotifications } from "@/hooks/useNotifications";
import { assets } from "@/lib/assets";
import {
  notificationFilters,
  type NotificationFilter,
  type NotificationItem,
  type NotificationSection,
} from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const iconMap = {
  trophy: Trophy,
  award: Award,
  gift: Gift,
  "user-plus": UserPlus,
  star: Star,
  sparkles: Sparkles,
  calendar: Calendar,
  flame: Flame,
} as const;

const filterIcons: Record<NotificationFilter, typeof Radio> = {
  all: Radio,
  unread: Zap,
  rewards: Gift,
  social: Users,
};

const categoryInk: Record<NotificationItem["category"], string> = {
  learning: "#6b4eff",
  streak: "#ff8a3d",
  coach: "#6b4eff",
  social: "#2d8cff",
  rewards: "#e6a800",
  system: "#8a7cb8",
};

/**
 * Notifications inbox — night hero + clay filter sheet + signal cards.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const { data, isLoading, isError, markRead, markAllRead } =
    useNotifications(filter);

  const unreadCount = data?.unreadCount ?? 0;
  const sections = data?.sections ?? [];

  const priority = useMemo(() => {
    const items = data?.items ?? [];
    return items.find(
      (item) =>
        item.unread &&
        (item.category === "streak" ||
          item.type === "streak_risk" ||
          item.type === "study_reminder"),
    );
  }, [data?.items]);

  const onMarkAllRead = () => {
    if (unreadCount === 0 || markAllRead.isPending) return;
    markAllRead.mutate();
  };

  const onOpen = (item: NotificationItem) => {
    if (item.unread) {
      markRead.mutate(item.id);
    }
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-14 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-14 -right-8 h-48 w-48 rounded-full bg-arc-purple-500/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-16 -left-12 h-36 w-36 rounded-full bg-[#ffc928]/12 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 14% 22%, #fff, transparent), radial-gradient(1px 1px at 78% 12%, #fff, transparent), radial-gradient(1.5px 1.5px at 58% 48%, #fff, transparent), radial-gradient(1px 1px at 32% 70%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton tone="dark" fallbackHref="/home" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#ffc928] uppercase">
              Inbox
            </p>
            <h1 className="mt-1.5 font-display text-[36px] leading-[0.88] font-bold tracking-[-0.045em]">
              Notifications
            </h1>
          </div>
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0 || markAllRead.isPending}
            aria-label="Mark all as read"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <CheckCheck className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="relative mt-5 flex items-end gap-3">
          <div className="min-w-0 flex-1 pb-2">
            {unreadCount > 0 ? (
              <motion.span
                key={unreadCount}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={softSpring}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#ffc928]/35 bg-[#ffc928]/15 px-2.5 py-1 text-[11px] font-extrabold text-[#ffc928]"
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full bg-[#ffc928]/50",
                      !reduceMotion && "animate-ping",
                    )}
                  />
                  <span className="relative h-2 w-2 rounded-full bg-[#ffc928]" />
                </span>
                {unreadCount} unread
              </motion.span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-extrabold text-white/60">
                <Bell className="h-3.5 w-3.5" strokeWidth={2.25} />
                All caught up
              </span>
            )}
            <p className="mt-3 max-w-[14rem] text-[13px] leading-snug font-bold text-white/50">
              {isLoading
                ? "Pulling your latest signals…"
                : unreadCount === 0
                  ? "Quiet for now. Arlo pings when something matters."
                  : "Tap a card to open it and clear the dot."}
            </p>
          </div>

          <div
            className="relative -mr-3 -mb-3 h-[124px] w-[112px] shrink-0"
            aria-hidden
          >
            <motion.span
              className="absolute inset-0 flex items-end justify-end"
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src={assets.arlo.point}
                alt=""
                width={120}
                height={120}
                className="h-[116px] w-auto max-w-none object-contain object-bottom drop-shadow-[0_14px_28px_rgba(107,78,255,0.5)]"
                priority
              />
            </motion.span>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-8 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <nav
          role="tablist"
          aria-label="Notification filters"
          className="flex gap-1 overflow-x-auto rounded-full border-2 border-[#ebe4f6] bg-white p-1 shadow-[0_3px_0_#ebe4f6] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {notificationFilters.map((chip) => {
            const active = filter === chip.id;
            const Icon = filterIcons[chip.id];
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(chip.id)}
                className={cn(
                  "inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2.5 py-2.5 font-display text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500",
                  active
                    ? "bg-[#0f1220] text-[#ffc928]"
                    : "text-[#8a7cb8] hover:text-[#0f1220]",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
                {chip.label}
              </button>
            );
          })}
        </nav>

        <AnimatePresence>
          {(filter === "all" || filter === "unread") && priority ? (
            <motion.div
              key="priority"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={softSpring}
              className="mt-5"
            >
              <PriorityCard
                title={priority.title}
                body={priority.body}
                onResume={() => {
                  if (priority.unread) markRead.mutate(priority.id);
                  router.push(priority.actionUrl || "/path");
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={softSpring}
            className="mt-5"
          >
            {isError ? (
              <EmptyInbox
                title="Could not load"
                body="Check your connection and try again."
              />
            ) : isLoading ? (
              <EmptyInbox title="Loading…" body="Fetching your notifications." />
            ) : sections.length === 0 ? (
              <EmptyInbox />
            ) : (
              <div className="space-y-6">
                {sections.map((section, si) => (
                  <SignalSection
                    key={section.id}
                    section={section}
                    onOpen={onOpen}
                    reduceMotion={!!reduceMotion}
                    index={si}
                  />
                ))}

                <p className="pt-1 text-center text-[12px] font-extrabold text-[#9a8fc0]">
                  End of inbox · you&apos;re caught up
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function PriorityCard({
  title,
  body,
  onResume,
}: {
  title: string;
  body: string;
  onResume: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border-2 border-[#0f1220] bg-[#0f1220] text-white shadow-[0_6px_0_#2a2f45]">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-[#ff8a3d]"
      />
      <div className="relative flex items-start gap-3 p-4 pr-[4.5rem]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff8a3d] text-white shadow-[0_3px_0_#c45f1a]">
          <Flame className="h-5 w-5" strokeWidth={2.25} fill="currentColor" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black tracking-[0.12em] text-[#ff8a3d] uppercase">
            Needs you now
          </p>
          <p className="mt-1 font-display text-[17px] leading-tight font-bold text-balance">
            {title}
          </p>
          <p className="mt-1 text-[12px] font-bold text-white/50">{body}</p>
          <button
            type="button"
            onClick={onResume}
            className="mt-3 cursor-pointer rounded-2xl border-2 border-[#0f1220] bg-[#ffc928] px-4 py-2 text-[13px] font-extrabold text-[#0f1220] shadow-[0_3px_0_#c79a2e] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] active:translate-y-px active:shadow-none"
          >
            Resume lesson
          </button>
        </div>
        <Image
          src={assets.arlo.thinking}
          alt=""
          width={68}
          height={68}
          className="pointer-events-none absolute right-2 bottom-2 h-auto w-[68px]"
        />
      </div>
    </div>
  );
}

function SignalSection({
  section,
  onOpen,
  reduceMotion,
  index,
}: {
  section: NotificationSection;
  onOpen: (item: NotificationItem) => void;
  reduceMotion: boolean;
  index: number;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-0.5">
        <h2 className="font-display text-[16px] font-semibold text-[#0f1220]">
          {section.label}
        </h2>
        <span className="rounded-full bg-[#0f1220] px-2 py-0.5 text-[10px] font-black text-[#ffc928] tabular-nums">
          {section.items.length}
        </span>
        <span aria-hidden className="h-px flex-1 bg-[#d5ccec]/80" />
      </div>

      <ul className="space-y-2.5">
        {section.items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...softSpring, delay: 0.02 * (index * 3 + i) }}
          >
            <NotificationRow item={item} onOpen={onOpen} />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
}) {
  const ink = categoryInk[item.category];

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        "relative flex w-full cursor-pointer items-start gap-3 overflow-hidden rounded-[18px] border-2 px-3.5 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500",
        item.unread
          ? "border-[#ebe4f6] bg-white shadow-[0_4px_0_#ebe4f6] hover:border-arc-purple-500/30"
          : "border-[#ebe4f6]/80 bg-white/70 shadow-[0_3px_0_#ebe4f6]/60 hover:bg-white",
      )}
    >
      {item.unread ? (
        <span
          aria-hidden
          className="absolute top-3.5 bottom-3.5 left-0 w-1 rounded-r-full bg-arc-purple-500"
        />
      ) : null}

      <NotificationIcon item={item} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate font-display text-[14px] font-bold",
              item.unread ? "text-[#0f1220]" : "text-[#4a4460]",
            )}
          >
            {item.title}
          </span>
          <time
            className={cn(
              "shrink-0 pt-0.5 text-[10px] font-extrabold",
              item.unread ? "text-arc-purple-500" : "text-[#b3a8d6]",
            )}
          >
            {item.time}
          </time>
        </div>

        <p
          className={cn(
            "mt-0.5 text-[12.5px] leading-snug font-semibold text-pretty",
            item.unread ? "text-[#6a6188]" : "text-[#9a8fc0]",
          )}
        >
          {item.body}
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          {item.coachBadge ? (
            <span className="rounded-full border border-[#ffc928]/35 bg-[#ffc928]/15 px-2 py-0.5 text-[9px] font-black tracking-wide text-[#c79a2e] uppercase">
              Coach
            </span>
          ) : (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide uppercase"
              style={{
                background: `${ink}18`,
                color: ink,
              }}
            >
              {item.category}
            </span>
          )}
          {item.unread ? (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-black tracking-wide text-arc-purple-500 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-arc-purple-500" />
              New
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function NotificationIcon({ item }: { item: NotificationItem }) {
  if (item.icon.kind === "arlo") {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#ebe4f6] bg-[#ede6fb]">
        <Image
          src={assets.arlo.point}
          alt="Arlo"
          width={44}
          height={44}
          className="h-11 w-11 object-cover object-top"
        />
      </div>
    );
  }

  const Icon = iconMap[item.icon.name];
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#ebe4f6]"
      style={{ background: item.icon.bg }}
    >
      <Icon
        className="h-5 w-5"
        style={{ color: item.icon.color }}
        fill={item.icon.name === "star" ? item.icon.color : "none"}
        strokeWidth={2.25}
      />
    </div>
  );
}

function EmptyInbox({
  title = "Nothing here",
  body = "No notifications on this filter. Check another tab or come back after your next lesson.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="rounded-[20px] border-2 border-dashed border-[#d5ccec] bg-white px-5 py-10 text-center">
      <div className="relative mx-auto mb-3 h-20 w-20">
        <Image
          src={assets.arlo.thinking}
          alt=""
          fill
          className="object-contain"
          sizes="80px"
        />
      </div>
      <p className="font-display text-[17px] font-bold text-[#0f1220]">
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-[16rem] text-[13px] font-bold text-[#8a7cb8]">
        {body}
      </p>
    </div>
  );
}
