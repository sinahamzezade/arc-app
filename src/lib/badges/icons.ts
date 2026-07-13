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

/** True when src is admin upload / remote — skip next/image optimizer (public/ miss). */
export function isBadgeUploadSrc(src: string): boolean {
  return (
    src.startsWith("/uploads/") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  );
}

/**
 * Resolve badge art from API `iconAssetKey`.
 * Upload paths (`/uploads/...`) stay same-origin (Next rewrites → Nest).
 * Seed keys map to bundled PNGs.
 */
export function badgeImageFor(iconAssetKey: string | null | undefined): string {
  if (!iconAssetKey) return assets.badges.firstStep;
  if (
    iconAssetKey.startsWith("http://") ||
    iconAssetKey.startsWith("https://")
  ) {
    return iconAssetKey;
  }
  if (iconAssetKey.startsWith("/uploads/")) {
    return iconAssetKey;
  }
  return ICON_MAP[iconAssetKey] ?? assets.badges.firstStep;
}
