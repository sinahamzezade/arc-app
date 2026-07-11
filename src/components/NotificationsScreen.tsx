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
  Star,
  Trophy,
  UserPlus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";
import {
  notificationFilters,
  notificationSections,
  type NotificationFilter,
  type NotificationItem,
  type NotificationSection,
} from "@/lib/notifications/mock-data";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const iconMap = {
  trophy: Trophy,
  award: Award,
  gift: Gift,
  "user-plus": UserPlus,
  star: Star,
  calendar: Calendar,
  flame: Flame,
} as const;

const categorySpine: Record<NotificationItem["category"], string> = {
  streak: "bg-[#ff8a3d]",
  coach: "bg-arc-purple-500",
  social: "bg-[#2d8cff]",
  rewards: "bg-[#ffc928]",
  system: "bg-[#8a7cb8]",
};

/**
 * Signal desk — night hero + overhang filters + soft day slabs.
 * Matches Battle / Wallet / League grammar.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [items, setItems] = useState(() =>
    notificationSections.flatMap((section) => section.items),
  );

  const unreadCount = items.filter((item) => item.unread).length;

  const sections = useMemo(() => {
    return notificationSections
      .map((section) => ({
        ...section,
        items: section.items
          .map((item) => items.find((i) => i.id === item.id) ?? item)
          .filter((item) => matchesFilter(item, filter)),
      }))
      .filter((section) => section.items.length > 0);
  }, [filter, items]);

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const markRead = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      {/* SIGNAL HERO */}
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1.5px at 55% 60%, #fff, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              <Bell className="h-3 w-3" strokeWidth={2.5} />
              Inbox
            </p>
            <h1 className="mt-1 font-display text-[26px] leading-none font-bold tracking-[-0.03em]">
              Notifications
            </h1>
          </div>
          <motion.button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            whileTap={{ scale: 0.96 }}
            transition={snappySpring}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-[12px] font-extrabold text-white ring-1 ring-white/15 disabled:opacity-35"
          >
            <CheckCheck className="h-4 w-4" strokeWidth={2.5} />
            Read all
          </motion.button>
        </div>

        <div className="relative mt-7 grid grid-cols-[1.2fr_1fr] items-end gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
              Waiting
            </p>
            <motion.p
              className="mt-1 font-display text-[64px] leading-[0.85] font-bold tracking-[-0.05em]"
              key={unreadCount}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={softSpring}
            >
              {unreadCount}
            </motion.p>
            <p className="mt-2 text-[13px] font-bold text-white/45">
              {unreadCount === 0 ? "All clear" : "new updates"}
            </p>
          </div>

          <div className="relative h-[100px]">
            <motion.div
              className="absolute top-0 right-0 z-[2] w-[92%] -rotate-2 rounded-2xl bg-arc-purple-500 px-3 py-2.5 shadow-[0_6px_0_#4b2fd6]"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: 0.06 }}
            >
              <p className="text-[10px] font-black tracking-wide text-white/70 uppercase">
                Today
              </p>
              <p className="mt-1 font-display text-[18px] leading-none font-bold">
                {
                  items.filter(
                    (i) =>
                      i.unread &&
                      notificationSections[0]?.items.some((t) => t.id === i.id),
                  ).length
                }{" "}
                unread
              </p>
            </motion.div>
            <motion.div
              className="absolute right-2 bottom-0 z-[1] w-[80%] rotate-2 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/15"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: 0.12 }}
            >
              <p className="text-[10px] font-black tracking-wide text-[#ffc928] uppercase">
                Filters
              </p>
              <p className="mt-0.5 font-display text-[15px] font-bold capitalize">
                {filter}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filter overhang */}
      <div className="relative z-[1] -mt-5 px-4">
        <nav
          role="tablist"
          aria-label="Notification filters"
          className="flex gap-1 overflow-x-auto rounded-[20px] border border-[#ebe4f6] bg-white p-1.5 shadow-[0_14px_32px_rgba(70,40,150,0.1)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {notificationFilters.map((chip) => {
            const active = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(chip.id)}
                className={cn(
                  "min-w-0 flex-1 shrink-0 rounded-[14px] px-2 py-2.5 font-display text-[12px] font-semibold",
                  active
                    ? "bg-[#0f1220] text-[#ffc928]"
                    : "text-[#8a7cb8]",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="relative px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <AnimatePresence>
          {(filter === "all" || filter === "unread") && unreadCount > 0 ? (
            <motion.div
              key="streak"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={softSpring}
              className="mb-4"
            >
              <StreakTicket onResume={() => router.push("/home")} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={softSpring}
            className="space-y-4"
          >
            {sections.map((section, i) => (
              <NotificationGroup
                key={section.id}
                section={section}
                onOpen={markRead}
                offset={i === 1}
              />
            ))}

            {sections.length === 0 ? (
              <p className="rounded-[20px] border border-dashed border-[#d5ccec] bg-white/70 px-5 py-10 text-center text-[13px] font-extrabold text-[#b3a8d6]">
                Nothing here yet
              </p>
            ) : (
              <p className="pt-2 text-center text-[12px] font-extrabold text-[#b3a8d6]">
                You&apos;re all caught up
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function matchesFilter(item: NotificationItem, filter: NotificationFilter) {
  if (filter === "all") return true;
  if (filter === "unread") return item.unread;
  return item.filterTags.includes(filter);
}

function StreakTicket({ onResume }: { onResume: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-[#0f1220] text-white shadow-[0_14px_32px_rgba(15,18,32,0.25)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[#ff8a3d]/30 blur-2xl"
      />
      <div className="relative flex items-stretch">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center bg-[#ff8a3d]">
          <Flame className="h-6 w-6 text-white" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1 px-4 py-4">
          <p className="font-display text-[17px] leading-tight font-bold">
            Keep your streak alive
          </p>
          <p className="mt-1 text-[12px] font-bold text-white/50">
            25 minutes from Day 8. Don&apos;t let it slip.
          </p>
          <motion.button
            type="button"
            onClick={onResume}
            whileTap={{ scale: 0.97, y: 1 }}
            transition={snappySpring}
            className="mt-3 rounded-xl bg-arc-purple-500 px-4 py-2 text-[13px] font-extrabold text-white shadow-[0_3px_0_#4b2fd6]"
          >
            Resume Lesson
          </motion.button>
        </div>
        <Image
          src={assets.arlo.point}
          alt=""
          width={88}
          height={88}
          className="pointer-events-none absolute -right-1 -bottom-2 h-auto w-[88px]"
        />
      </div>
      <div
        aria-hidden
        className="h-1.5 bg-[repeating-linear-gradient(90deg,#ffc928_0_8px,transparent_8px_14px)] opacity-50"
      />
    </div>
  );
}

function NotificationGroup({
  section,
  onOpen,
  offset,
}: {
  section: NotificationSection;
  onOpen: (id: string) => void;
  offset?: boolean;
}) {
  return (
    <section className={cn(offset && "ml-2")}>
      <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
        <h2 className="font-display text-[16px] font-bold text-[#1b1730]">
          {section.label}
        </h2>
        <span className="text-[11px] font-extrabold text-[#8a7cb8]">
          {section.items.length}
        </span>
      </div>

      <ul className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white shadow-[0_10px_24px_rgba(70,40,150,0.06)]">
        {section.items.map((item, i) => (
          <li
            key={item.id}
            className={cn(
              i < section.items.length - 1 && "border-b border-[#f0ecf7]",
            )}
          >
            <NotificationRow item={item} onOpen={onOpen} />
          </li>
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
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className={cn(
        "relative flex w-full items-start gap-3 px-3.5 py-3.5 text-left transition-colors",
        item.unread ? "bg-[#faf8ff]" : "bg-white",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-3 bottom-3 left-0 w-1 rounded-r-full",
          categorySpine[item.category],
          !item.unread && "opacity-30",
        )}
      />

      <NotificationIcon item={item} />

      <div className="min-w-0 flex-1 pl-0.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-display text-[14px] font-semibold text-[#1b1730]">
            {item.title}
          </span>
          {item.coachBadge ? (
            <span className="shrink-0 rounded-full bg-[#0f1220] px-1.5 py-0.5 text-[9px] font-black tracking-wide text-[#ffc928] uppercase">
              Coach
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug font-semibold text-[#8a7cb8]">
          {item.body}
        </p>
        <p className="mt-1.5 text-[11px] font-bold text-[#b3a8d6]">{item.time}</p>
      </div>

      {item.unread ? (
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-arc-purple-500 shadow-[0_0_0_3px_rgba(107,78,255,0.2)]" />
      ) : null}
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
