import { assets } from "@/lib/assets";

const ICON_MAP: Record<string, string> = {
  "first-step": assets.badges.firstStep,
  "weekly-warrior": assets.badges.weeklyWarrior,
  "sql-spark": assets.badges.sqlSpark,
  "comeback-eagle": assets.badges.comebackEagle,
  "night-owl": assets.badges.nightOwl,
  "early-bird": assets.badges.earlyBird,
  "quiz-crusher": assets.badges.quizCrusher,
  "project-starter": assets.badges.projectStarter,
  "four-week-flame": assets.badges.fourWeekFlame,
  "job-ready-eagle": assets.badges.jobReadyEagle,
};

export function badgeImageFor(iconAssetKey: string | null | undefined): string {
  if (!iconAssetKey) return assets.badges.firstStep;
  return ICON_MAP[iconAssetKey] ?? assets.badges.firstStep;
}
