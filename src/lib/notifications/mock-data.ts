export type NotificationFilter = "all" | "unread" | "rewards" | "social";

export type NotificationCategory = "streak" | "coach" | "social" | "rewards" | "system";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  category: NotificationCategory;
  filterTags: NotificationFilter[];
  icon:
    | { kind: "emoji"; value: string; bg: string }
    | { kind: "arlo" }
    | {
        kind: "lucide";
        name: "trophy" | "award" | "gift" | "user-plus" | "star" | "calendar";
        bg: string;
        color: string;
      };
  coachBadge?: boolean;
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

export const notificationSections: NotificationSection[] = [
  {
    id: "today",
    label: "TODAY",
    items: [
      {
        id: "streak-1",
        title: "Streak reminder",
        body: "Complete a lesson today to reach your 8-day streak.",
        time: "2h ago",
        unread: true,
        category: "streak",
        filterTags: ["unread"],
        icon: { kind: "emoji", value: "🔥", bg: "#ffeede" },
      },
      {
        id: "coach-1",
        title: "Arlo",
        body: "Nice work on WHERE clauses! Ready to try JOINs next?",
        time: "4h ago",
        unread: true,
        category: "coach",
        filterTags: ["unread"],
        icon: { kind: "arlo" },
        coachBadge: true,
      },
      {
        id: "social-1",
        title: "You moved up to 4th place! 🎉",
        body: "Silver League · 2 spots from promotion.",
        time: "6h ago",
        unread: true,
        category: "social",
        filterTags: ["unread", "social"],
        icon: {
          kind: "lucide",
          name: "trophy",
          bg: "#e4eeff",
          color: "#2d8cff",
        },
      },
    ],
  },
  {
    id: "yesterday",
    label: "YESTERDAY",
    items: [
      {
        id: "reward-1",
        title: "Badge unlocked: Query Rookie",
        body: "You've earned your 12th badge. 12 to go!",
        time: "Yesterday · 7:40 PM",
        unread: false,
        category: "rewards",
        filterTags: ["rewards"],
        icon: {
          kind: "lucide",
          name: "award",
          bg: "#fff3dc",
          color: "#f0a81e",
        },
      },
      {
        id: "reward-2",
        title: "Daily bonus ready 🎁",
        body: "Spin the Lucky Wheel to win up to 100 gems.",
        time: "Yesterday · 9:00 AM",
        unread: false,
        category: "rewards",
        filterTags: ["rewards"],
        icon: {
          kind: "lucide",
          name: "gift",
          bg: "#ede6fb",
          color: "#6b4eff",
        },
      },
      {
        id: "social-2",
        title: "Maya joined with your invite!",
        body: "You both earned +50 gems. Keep inviting friends!",
        time: "Yesterday · 8:15 AM",
        unread: false,
        category: "social",
        filterTags: ["social", "rewards"],
        icon: {
          kind: "lucide",
          name: "user-plus",
          bg: "#e4f6e8",
          color: "#16c784",
        },
      },
    ],
  },
  {
    id: "earlier",
    label: "EARLIER",
    items: [
      {
        id: "reward-3",
        title: "Level 5 reached — Semi Ninja! 🥷",
        body: "New avatar items unlocked in the store.",
        time: "Mon · 5:20 PM",
        unread: false,
        category: "rewards",
        filterTags: ["rewards"],
        icon: {
          kind: "lucide",
          name: "star",
          bg: "#e4eeff",
          color: "#2d8cff",
        },
      },
      {
        id: "system-1",
        title: "Weekly plan updated",
        body: "Arlo rescheduled 2 sessions to fit your week.",
        time: "Mon · 8:00 AM",
        unread: false,
        category: "system",
        filterTags: [],
        icon: {
          kind: "lucide",
          name: "calendar",
          bg: "#ede6fb",
          color: "#6b4eff",
        },
      },
    ],
  },
];
