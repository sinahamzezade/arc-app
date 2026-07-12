export type SettingsToggleId =
  | "push"
  | "email"
  | "learningReminders"
  | "weeklyProgress"
  | "streakReminders"
  | "rewards"
  | "social"
  | "studyTogetherInvites"
  | "battleInvites"
  | "leagueUpdates"
  | "luckyWheel"
  | "coachMessages"
  | "marketing";

export type SettingsToggle = {
  id: SettingsToggleId;
  label: string;
  detail: string;
  on: boolean;
};

export type SettingsMockData = {
  email: string;
  language: string;
  privacy: string;
  toggles: SettingsToggle[];
};

export const settingsMockData: SettingsMockData = {
  email: "soheil@arc.app",
  language: "English",
  privacy: "Friends can challenge you",
  toggles: [
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
  ],
};
