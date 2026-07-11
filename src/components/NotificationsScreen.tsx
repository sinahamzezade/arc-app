"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Calendar,
  CheckCheck,
  ChevronLeft,
  Gift,
  Star,
  Trophy,
  UserPlus,
} from "lucide-react";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";
import {
  notificationFilters,
  notificationSections,
  type NotificationFilter,
  type NotificationItem,
  type NotificationSection,
} from "@/lib/notifications/mock-data";

const iconMap = {
  trophy: Trophy,
  award: Award,
  gift: Gift,
  "user-plus": UserPlus,
  star: Star,
  calendar: Calendar,
} as const;

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
    <div className="mx-auto min-h-dvh w-full max-w-md bg-[#f4f1fa] pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+26px)] font-rounded">
      <header className="flex items-center gap-3 px-[18px] pb-1">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_4px_12px_rgba(70,40,150,0.06)]"
        >
          <ChevronLeft className="h-6 w-6 text-[#1b1730]" strokeWidth={2.25} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl leading-none font-black tracking-[-0.02em] text-[#1b1730]">
            Notifications
          </h1>
          <p className="mt-0.5 text-[13px] font-bold text-arc-lavender-600">
            {unreadCount} new updates
          </p>
        </div>

        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-1.5 text-[13px] font-extrabold text-arc-purple-500 disabled:opacity-40"
        >
          <CheckCheck className="h-[18px] w-[18px]" />
          Mark all read
        </button>
      </header>

      <div className="flex gap-[9px] overflow-x-auto px-[18px] pt-3.5 pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {notificationFilters.map((chip) => {
          const active = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={cn(
                "shrink-0 rounded-full px-[18px] py-2 text-[13.5px] font-extrabold",
                active
                  ? "bg-arc-purple-500 text-white shadow-[0_6px_16px_-6px_rgba(91,46,224,0.6)]"
                  : "border border-[#ece6f7] bg-white text-[#6e6690]",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {(filter === "all" || filter === "unread") && unreadCount > 0 && (
        <StreakBanner onResume={() => router.push("/home")} />
      )}

      {sections.map((section) => (
        <NotificationGroup
          key={section.id}
          section={section}
          onOpen={markRead}
        />
      ))}

      {sections.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] font-extrabold text-[#b3a8d6]">
          Nothing here yet
        </p>
      ) : (
        <p className="px-5 pt-6 pb-1 text-center text-[13px] font-extrabold text-[#b3a8d6]">
          You&apos;re all caught up 🎉
        </p>
      )}
    </div>
  );
}

function matchesFilter(item: NotificationItem, filter: NotificationFilter) {
  if (filter === "all") return true;
  if (filter === "unread") return item.unread;
  return item.filterTags.includes(filter);
}

function StreakBanner({ onResume }: { onResume: () => void }) {
  return (
    <div className="relative mx-[18px] mt-2.5 mb-1 overflow-hidden rounded-[22px] bg-[linear-gradient(120deg,#7c5cff,#5b2ee0)] px-5 py-[18px] shadow-[0_14px_30px_-10px_rgba(91,46,224,0.6)]">
      <div className="relative z-10 max-w-[64%]">
        <div className="text-lg leading-[1.1] font-black text-white">
          Keep your streak alive! 🔥
        </div>
        <p className="mt-1 text-[13.5px] leading-[1.4] font-bold text-[#e7deff]">
          You&apos;re 25 minutes away from Day 8. Don&apos;t let it slip!
        </p>
        <button
          type="button"
          onClick={onResume}
          className="mt-3 rounded-xl bg-white px-4 py-2 text-[13px] font-extrabold text-[#5b2ee0]"
        >
          Resume Lesson
        </button>
      </div>
      <Image
        src={assets.arlo.point}
        alt="Arlo"
        width={104}
        height={104}
        className="pointer-events-none absolute -right-1.5 -bottom-2 h-auto w-[104px]"
      />
    </div>
  );
}

function NotificationGroup({
  section,
  onOpen,
}: {
  section: NotificationSection;
  onOpen: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="px-5 pt-5 pb-2 text-[13px] font-black tracking-[0.6px] text-arc-lavender-600">
        {section.label}
      </h2>
      <div className="flex flex-col gap-px bg-[#efeaf7]">
        {section.items.map((item) => (
          <NotificationRow key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
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
        "flex w-full items-start gap-3.5 px-[18px] py-[15px] text-left",
        item.unread ? "bg-[#fbfafe]" : "bg-white",
      )}
    >
      <NotificationIcon item={item} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[15.5px] leading-[1.2] font-black text-[#1b1730]">
            {item.title}
          </span>
          {item.coachBadge && (
            <span className="rounded-full bg-[#ede6fb] px-1.5 py-0.5 text-[10px] font-extrabold text-arc-purple-500">
              COACH
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[13.5px] leading-[1.4] font-bold text-[#6e6690]">
          {item.body}
        </p>
        <p className="mt-1.5 text-xs font-bold text-[#b3a8d6]">{item.time}</p>
      </div>

      {item.unread && (
        <span className="mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full bg-arc-purple-500" />
      )}
    </button>
  );
}

function NotificationIcon({ item }: { item: NotificationItem }) {
  if (item.icon.kind === "emoji") {
    return (
      <div
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] text-2xl"
        style={{ background: item.icon.bg }}
      >
        {item.icon.value}
      </div>
    );
  }

  if (item.icon.kind === "arlo") {
    return (
      <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ede6fb]">
        <Image
          src={assets.arlo.point}
          alt="Arlo"
          width={46}
          height={46}
          className="h-[46px] w-[46px] object-cover object-top"
        />
      </div>
    );
  }

  const Icon = iconMap[item.icon.name];
  return (
    <div
      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px]"
      style={{ background: item.icon.bg }}
    >
      <Icon
        className="h-6 w-6"
        style={{ color: item.icon.color }}
        fill={item.icon.name === "star" ? item.icon.color : "none"}
      />
    </div>
  );
}
