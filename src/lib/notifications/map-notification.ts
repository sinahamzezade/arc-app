import type { NotificationDto, NotificationTypeDto } from "@/lib/api/types";
import type {
  NotificationFilter,
  NotificationItem,
  NotificationSection,
} from "@/lib/notifications/types";

const ICON_BY_TYPE: Partial<
  Record<NotificationTypeDto, NotificationItem["icon"]>
> = {
  study_reminder: {
    kind: "lucide",
    name: "flame",
    bg: "#ffeede",
    color: "#ff8a3d",
  },
  study_starting: {
    kind: "lucide",
    name: "flame",
    bg: "#ffeede",
    color: "#ff8a3d",
  },
  missed_session: {
    kind: "lucide",
    name: "calendar",
    bg: "#ede6fb",
    color: "#6b4eff",
  },
  streak_risk: {
    kind: "lucide",
    name: "flame",
    bg: "#ffeede",
    color: "#ff8a3d",
  },
  streak_protected: {
    kind: "lucide",
    name: "flame",
    bg: "#ffeede",
    color: "#ff8a3d",
  },
  streak_broken: {
    kind: "lucide",
    name: "flame",
    bg: "#ffeede",
    color: "#ff8a3d",
  },
  streak_recovered: {
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
  reward_granted: {
    kind: "lucide",
    name: "gift",
    bg: "#fff3dc",
    color: "#f0a81e",
  },
  badge_unlocked: {
    kind: "lucide",
    name: "award",
    bg: "#fff3dc",
    color: "#f0a81e",
  },
  rank_unlocked: {
    kind: "lucide",
    name: "award",
    bg: "#efe9ff",
    color: "#6b4eff",
  },
  rank_close: {
    kind: "lucide",
    name: "star",
    bg: "#fff3dc",
    color: "#f0a81e",
  },
  rank_gate_completed: {
    kind: "lucide",
    name: "award",
    bg: "#eef9f3",
    color: "#16a56b",
  },
  replan_suggestion: { kind: "arlo" },
  battle_invite: {
    kind: "lucide",
    name: "trophy",
    bg: "#e4eeff",
    color: "#2d8cff",
  },
  battle_invite_expiring: {
    kind: "lucide",
    name: "trophy",
    bg: "#e4eeff",
    color: "#2d8cff",
  },
  battle_accepted: {
    kind: "lucide",
    name: "trophy",
    bg: "#e4eeff",
    color: "#2d8cff",
  },
  battle_starting: {
    kind: "lucide",
    name: "trophy",
    bg: "#e4eeff",
    color: "#2d8cff",
  },
  battle_result: {
    kind: "lucide",
    name: "trophy",
    bg: "#fff3dc",
    color: "#f0a81e",
  },
  battle_rematch: {
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
  league_started: {
    kind: "lucide",
    name: "trophy",
    bg: "#e4eeff",
    color: "#2d8cff",
  },
  league_position_changed: {
    kind: "lucide",
    name: "trophy",
    bg: "#e4eeff",
    color: "#2d8cff",
  },
  league_promotion_risk: {
    kind: "lucide",
    name: "trophy",
    bg: "#fff3dc",
    color: "#f0a81e",
  },
  league_demote_risk: {
    kind: "lucide",
    name: "trophy",
    bg: "#ffe4e4",
    color: "#e5484d",
  },
  league_finalized: {
    kind: "lucide",
    name: "trophy",
    bg: "#e4eeff",
    color: "#2d8cff",
  },
  league_promoted: {
    kind: "lucide",
    name: "trophy",
    bg: "#e4f6e8",
    color: "#16c784",
  },
  league_demoted: {
    kind: "lucide",
    name: "trophy",
    bg: "#ffe4e4",
    color: "#e5484d",
  },
  league_gate_blocked: {
    kind: "lucide",
    name: "trophy",
    bg: "#fff3dc",
    color: "#f0a81e",
  },
  lucky_wheel_ready: {
    kind: "lucide",
    name: "sparkles",
    bg: "#efe9ff",
    color: "#6b4eff",
  },
  lucky_wheel_reward: {
    kind: "lucide",
    name: "sparkles",
    bg: "#fff3dc",
    color: "#f0a81e",
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
  security: {
    kind: "lucide",
    name: "star",
    bg: "#ffe8e8",
    color: "#e5484d",
  },
};

export function formatNotificationTime(iso: string, now = new Date()): string {
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
    actionUrl: normalizeActionUrl(dto.actionUrl),
    type: dto.type,
    createdAt: dto.createdAt,
  };
}

/** Map legacy API-shaped deep links to real app routes. */
function normalizeActionUrl(url: string | null): string | null {
  if (!url) return null;
  if (
    url === "/leagues/current" ||
    url === "/league/current" ||
    url === "/leagues" ||
    url === "/league"
  ) {
    return "/leaderboard";
  }
  return url;
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
    const created = item.createdAt ? new Date(item.createdAt) : new Date();
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
