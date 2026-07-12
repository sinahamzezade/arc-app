import type { NotificationDto, NotificationTypeDto } from "@/lib/api/types";
import type {
  NotificationFilter,
  NotificationItem,
  NotificationSection,
} from "@/lib/notifications/mock-data";

const ICON_BY_TYPE: Record<
  NotificationTypeDto,
  NotificationItem["icon"]
> = {
  study_reminder: {
    kind: "lucide",
    name: "flame",
    bg: "#ffeede",
    color: "#ff8a3d",
  },
  streak_risk: {
    kind: "lucide",
    name: "flame",
    bg: "#ffeede",
    color: "#ff8a3d",
  },
  weekly_recap: {
    kind: "lucide",
    name: "calendar",
    bg: "#ede6fb",
    color: "#6b4eff",
  },
  missed_week_recovery: { kind: "arlo" },
  badge_unlocked: {
    kind: "lucide",
    name: "award",
    bg: "#fff3dc",
    color: "#f0a81e",
  },
  replan_suggestion: { kind: "arlo" },
  battle_invite: {
    kind: "lucide",
    name: "trophy",
    bg: "#e4eeff",
    color: "#2d8cff",
  },
  league_update: {
    kind: "lucide",
    name: "trophy",
    bg: "#e4eeff",
    color: "#2d8cff",
  },
  referral: {
    kind: "lucide",
    name: "user-plus",
    bg: "#e4f6e8",
    color: "#16c784",
  },
  product_update: {
    kind: "lucide",
    name: "star",
    bg: "#e4eeff",
    color: "#2d8cff",
  },
  coach_message: { kind: "arlo" },
  system: {
    kind: "lucide",
    name: "calendar",
    bg: "#ede6fb",
    color: "#6b4eff",
  },
};

export function formatNotificationTime(
  iso: string,
  now = new Date(),
): string {
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24 && isSameDay(date, now)) return `${diffH}h ago`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `Yesterday · ${formatClock(date)}`;
  }

  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    return `${weekdayShort(date)} · ${formatClock(date)}`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function mapNotificationDto(dto: NotificationDto): NotificationItem {
  const filterTags: NotificationFilter[] = [];
  if (dto.unread) filterTags.push("unread");
  if (dto.category === "rewards") filterTags.push("rewards");
  if (dto.category === "social") filterTags.push("social");

  return {
    id: dto.id,
    title: dto.title,
    body: dto.body,
    time: formatNotificationTime(dto.createdAt),
    unread: dto.unread,
    category: dto.category,
    filterTags,
    icon: ICON_BY_TYPE[dto.type] ?? {
      kind: "lucide",
      name: "calendar",
      bg: "#ede6fb",
      color: "#6b4eff",
    },
    coachBadge: dto.category === "coach",
    actionUrl: dto.actionUrl,
    type: dto.type,
    createdAt: dto.createdAt,
  };
}

export function groupNotificationsByDay(
  items: NotificationItem[],
  now = new Date(),
): NotificationSection[] {
  const today: NotificationItem[] = [];
  const yesterday: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  const y = new Date(now);
  y.setDate(now.getDate() - 1);

  for (const item of items) {
    const created = item.createdAt
      ? new Date(item.createdAt)
      : new Date();
    if (isSameDay(created, now)) today.push(item);
    else if (isSameDay(created, y)) yesterday.push(item);
    else earlier.push(item);
  }

  return [
    { id: "today", label: "Today", items: today },
    { id: "yesterday", label: "Yesterday", items: yesterday },
    { id: "earlier", label: "Earlier", items: earlier },
  ].filter((s) => s.items.length > 0);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatClock(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function weekdayShort(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}
