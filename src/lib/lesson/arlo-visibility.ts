import type { PublicSystemFlags } from "@/lib/api/system-flags";

/** Default allowlist — all known lesson types (matches backend seed). */
export const ARLO_LESSON_TYPES_DEFAULT =
  "reading,practice,mini_project,interactive,quiz,video,scenario,visual_hotspot,debate,sandbox_simulation";

/**
 * Ask Arlo chrome: master `arlo_ai_enabled` + CSV allowlist
 * `arlo_ai_lesson_types`. Empty allowlist = nowhere.
 */
export function isArloVisibleForLessonType(
  flags: PublicSystemFlags,
  lessonType: string | null | undefined,
): boolean {
  if (!flags.arlo_ai_enabled) return false;
  if (!lessonType) return false;
  const raw = (flags.arlo_ai_lesson_types || ARLO_LESSON_TYPES_DEFAULT).trim();
  if (!raw) return false;
  const allowed = new Set(
    raw
      .split(/[,\s]+/)
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
  );
  return allowed.has(lessonType.trim().toLowerCase());
}
