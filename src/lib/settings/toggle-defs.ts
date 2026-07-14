import type { SettingsToggle } from "./types";

/** Static labels for notification preference toggles. `on` is a UI default until API loads. */
export const settingsToggleDefs: SettingsToggle[] = [
  {
    id: "push",
    label: "Push notifications",
    detail: "Streak, battles, league cuts",
    on: true,
  },
  {
    id: "email",
    label: "Email digests",
    detail: "Weekly progress summary",
    on: true,
  },
  {
    id: "learningReminders",
    label: "Learning reminders",
    detail: "Study windows & missed sessions",
    on: true,
  },
  {
    id: "weeklyProgress",
    label: "Weekly progress",
    detail: "Recap & pace nudges",
    on: true,
  },
  {
    id: "streakReminders",
    label: "Streak reminders",
    detail: "Nudge before day ends",
    on: true,
  },
  {
    id: "rewards",
    label: "Rewards",
    detail: "XP, badges, chests",
    on: true,
  },
  {
    id: "social",
    label: "Social",
    detail: "Friends & follows",
    on: true,
  },
  {
    id: "studyTogetherInvites",
    label: "Study Together",
    detail: "Invites & session pings",
    on: true,
  },
  {
    id: "battleInvites",
    label: "Battle invites",
    detail: "Friends can ping you live",
    on: true,
  },
  {
    id: "leagueUpdates",
    label: "League updates",
    detail: "Cuts, promotes, risks",
    on: true,
  },
  {
    id: "luckyWheel",
    label: "Lucky wheel",
    detail: "Ready & reward alerts",
    on: true,
  },
  {
    id: "coachMessages",
    label: "Coach messages",
    detail: "Arlo tips & recovery",
    on: true,
  },
  {
    id: "marketing",
    label: "Product updates",
    detail: "New features & tips",
    on: false,
  },
];
