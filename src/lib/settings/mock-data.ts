export type SettingsToggleId =
  | "push"
  | "email"
  | "streakReminders"
  | "battleInvites"
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
      id: "streakReminders",
      label: "Streak reminders",
      detail: "Nudge before day ends",
      on: true,
    },
    {
      id: "battleInvites",
      label: "Battle invites",
      detail: "Friends can ping you live",
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
