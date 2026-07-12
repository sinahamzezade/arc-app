"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import {
  Award,
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
} from "@/lib/notifications/mock-data";
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
 * Signal desk v2 — dispatch wire.
 * Live inbox from GET /notifications.
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
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-24 text-white">
        <RadarBackdrop reduceMotion={!!reduceMotion} />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Dispatch
            </p>
            <h1 className="mt-0.5 font-display text-[28px] leading-none font-bold tracking-[-0.03em] text-balance">
              Signals
            </h1>
          </div>
          <motion.button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0 || markAllRead.isPending}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            transition={snappySpring}
            aria-label="Mark all as read"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 disabled:opacity-35"
          >
            <CheckCheck className="h-5 w-5" strokeWidth={2.5} />
          </motion.button>
        </div>

        <div className="relative mt-6 flex items-end gap-3">
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              {unreadCount > 0 ? (
                <motion.span
                  key={unreadCount}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={softSpring}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#ffc928] px-3 py-1 text-[11px] font-black tracking-wide text-[#0f1220]"
                >
                  <span className="relative flex h-2 w-2">
                    <span
                      className={cn(
                        "absolute inset-0 rounded-full bg-[#0f1220]/40",
                        !reduceMotion && "animate-ping",
                      )}
                    />
                    <span className="relative h-2 w-2 rounded-full bg-[#0f1220]" />
                  </span>
                  LIVE · {unreadCount}
                </motion.span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black tracking-wide text-white/70 ring-1 ring-white/15">
                  Clear channel
                </span>
              )}
            </div>
            <p className="mt-3 max-w-[13.5rem] text-[14px] leading-snug font-semibold text-white/55">
              {isLoading
                ? "Tuning the wire…"
                : unreadCount === 0
                  ? "Wire quiet. Arlo will ping when something matters."
                  : "Unread traffic on the wire. Tap a signal to clear it."}
            </p>
          </div>

          <motion.div
            className="relative -mr-3 mb-[-28px] h-[132px] w-[120px] shrink-0"
            animate={
              reduceMotion ? undefined : { y: [0, -5, 0], rotate: [2, -1, 2] }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src={assets.arlo.point}
              alt="Arlo monitoring the signal desk"
              fill
              priority
              className="object-contain object-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
              sizes="120px"
            />
          </motion.div>
        </div>
      </section>

      <div className="relative z-10 -mt-5 px-4">
        <nav
          role="tablist"
          aria-label="Signal channels"
          className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {notificationFilters.map((chip, i) => {
            const active = filter === chip.id;
            const Icon = filterIcons[chip.id];
            return (
              <motion.button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(chip.id)}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...softSpring, delay: 0.04 * i }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-[16px] px-3.5 py-2.5 font-display text-[13px] font-bold ring-1 transition-colors",
                  active
                    ? "bg-[#0f1220] text-[#ffc928] ring-[#0f1220] shadow-[0_4px_0_#4b2fd6]"
                    : "bg-white text-[#5a5278] ring-[#ebe4f6] shadow-[0_3px_0_#ebe4f6]",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                {chip.label}
              </motion.button>
            );
          })}
        </nav>
      </div>

      <div className="relative px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <AnimatePresence>
          {(filter === "all" || filter === "unread") && priority ? (
            <motion.div
              key="priority"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={softSpring}
              className="mb-5"
            >
              <PriorityWire
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
          >
            {isError ? (
              <EmptyWire
                title="Signal lost"
                body="Could not reach the wire. Check connection and try again."
              />
            ) : isLoading ? (
              <EmptyWire title="Listening…" body="Pulling signals off the wire." />
            ) : sections.length === 0 ? (
              <EmptyWire />
            ) : (
              <div className="relative space-y-7">
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-3 bottom-3 left-[11px] w-px bg-[repeating-linear-gradient(180deg,#d5ccec_0_6px,transparent_6px_12px)]"
                />

                {sections.map((section, si) => (
                  <WireGroup
                    key={section.id}
                    section={section}
                    onOpen={onOpen}
                    skew={si % 2 === 1}
                    reduceMotion={!!reduceMotion}
                  />
                ))}

                <p className="pl-8 pt-1 text-[12px] font-extrabold text-[#9a8fc0]">
                  End of wire · you&apos;re caught up
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function RadarBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-48px] h-72 w-72 rounded-full bg-arc-purple-500/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[-36px] h-44 w-44 rounded-full bg-[#ffc928]/18 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1px at 55% 60%, #fff, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-8 -right-16 h-56 w-56"
      >
        {[1, 2, 3].map((ring) => (
          <motion.span
            key={ring}
            className="absolute inset-0 rounded-full border border-[#ffc928]/25"
            style={{
              inset: `${(ring - 1) * 18}%`,
            }}
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.15, 0.45, 0.15], scale: [1, 1.02, 1] }
            }
            transition={{
              duration: 3.2 + ring * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: ring * 0.2,
            }}
          />
        ))}
        <span className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffc928]" />
      </div>
    </>
  );
}

function PriorityWire({
  title,
  body,
  onResume,
}: {
  title: string;
  body: string;
  onResume: () => void;
}) {
  return (
    <div className="relative ml-1 overflow-hidden rounded-[22px] bg-[#0f1220] text-white shadow-[0_14px_32px_rgba(15,18,32,0.22)]">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5 bg-[#ff8a3d]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-8 h-28 w-28 rounded-full bg-[#ff8a3d]/25 blur-2xl"
      />
      <div className="relative flex items-start gap-3 px-4 py-4 pl-5">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ff8a3d]">
          <Flame className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <p className="text-[10px] font-black tracking-[0.12em] text-[#ff8a3d] uppercase">
            Priority wire
          </p>
          <p className="mt-1 font-display text-[17px] leading-tight font-bold text-balance">
            {title}
          </p>
          <p className="mt-1 text-[12px] font-bold text-white/50">{body}</p>
          <motion.button
            type="button"
            onClick={onResume}
            whileTap={{ scale: 0.97, y: 1 }}
            transition={snappySpring}
            className="mt-3 rounded-xl bg-[#ffc928] px-4 py-2 text-[13px] font-extrabold text-[#0f1220] shadow-[0_3px_0_#c79a2e]"
          >
            Resume lesson
          </motion.button>
        </div>
        <Image
          src={assets.arlo.thinking}
          alt=""
          width={72}
          height={72}
          className="pointer-events-none absolute right-1 bottom-0 h-auto w-[72px]"
        />
      </div>
      <div
        aria-hidden
        className="h-1 bg-[repeating-linear-gradient(90deg,#ffc928_0_8px,transparent_8px_14px)] opacity-55"
      />
    </div>
  );
}

function WireGroup({
  section,
  onOpen,
  skew,
  reduceMotion,
}: {
  section: NotificationSection;
  onOpen: (item: NotificationItem) => void;
  skew?: boolean;
  reduceMotion: boolean;
}) {
  return (
    <section className={cn("relative", skew && "translate-x-1")}>
      <div className="mb-3 flex items-center gap-3">
        <span className="relative z-[1] flex h-6 w-6 items-center justify-center rounded-full bg-[#0f1220] text-[10px] font-black text-[#ffc928] ring-4 ring-[#f3effc]">
          {section.items.length}
        </span>
        <h2 className="-rotate-1 font-display text-[15px] font-bold tracking-[-0.02em] text-[#1b1730]">
          {section.label}
        </h2>
        <span aria-hidden className="h-px flex-1 bg-[#d5ccec]/80" />
      </div>

      <ul className="space-y-2.5 pl-7">
        {section.items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={reduceMotion ? false : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...softSpring, delay: 0.03 * i }}
            className={cn(i % 2 === 1 && "ml-2")}
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
        "relative flex w-full items-start gap-3 overflow-hidden rounded-[18px] px-3 py-3 text-left transition-colors",
        item.unread
          ? "bg-white shadow-[0_8px_20px_rgba(70,40,150,0.1)] ring-1 ring-[#ebe4f6]"
          : "bg-white/65 ring-1 ring-[#ebe4f6]/80",
      )}
    >
      <span
        aria-hidden
        className="absolute top-0 bottom-0 left-0 w-1"
        style={{ background: ink, opacity: item.unread ? 1 : 0.35 }}
      />

      <NotificationIcon item={item} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate font-display text-[14px] font-semibold",
              item.unread ? "text-[#1b1730]" : "text-[#4a4460]",
            )}
          >
            {item.title}
          </span>
          <time
            className={cn(
              "shrink-0 pt-0.5 text-[10px] font-bold",
              item.unread ? "text-[#6b4eff]" : "text-[#b3a8d6]",
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
            <span className="rounded-full bg-[#0f1220] px-1.5 py-0.5 text-[9px] font-black tracking-wide text-[#ffc928] uppercase">
              Coach
            </span>
          ) : (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wide uppercase"
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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#ede6fb] ring-1 ring-[#ebe4f6]">
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
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
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

function EmptyWire({
  title = "Channel empty",
  body = "Nothing on this frequency. Flip channels or check back after your next lesson.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-dashed border-[#d5ccec] bg-white/70 px-5 py-10 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-arc-purple-500/10 blur-2xl"
      />
      <div className="relative mx-auto mb-3 h-20 w-20">
        <Image
          src={assets.arlo.thinking}
          alt=""
          fill
          className="object-contain"
          sizes="80px"
        />
      </div>
      <p className="font-display text-[17px] font-bold text-[#1b1730]">
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-[16rem] text-[13px] font-semibold text-[#8a7cb8]">
        {body}
      </p>
    </div>
  );
}
