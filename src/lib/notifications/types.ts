export type NotificationFilter = "all" | "unread" | "rewards" | "social";

export type NotificationCategory =
  | "learning"
  | "streak"
  | "coach"
  | "social"
  | "rewards"
  | "system";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  category: NotificationCategory;
  filterTags: NotificationFilter[];
  icon:
    | { kind: "arlo" }
    | {
        kind: "lucide";
        name:
          | "trophy"
          | "award"
          | "gift"
          | "user-plus"
          | "star"
          | "sparkles"
          | "calendar"
          | "flame";
        bg: string;
        color: string;
      };
  coachBadge?: boolean;
  actionUrl?: string | null;
  type?: string;
  createdAt?: string;
};

export type NotificationSection = {
  id: string;
  label: string;
  items: NotificationItem[];
};

export const notificationFilters: {
  id: NotificationFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "rewards", label: "Rewards" },
  { id: "social", label: "Social" },
];
