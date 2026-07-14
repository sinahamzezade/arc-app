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
