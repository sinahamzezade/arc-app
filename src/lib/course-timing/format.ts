import type { CourseTimingCurrent } from "@/lib/api/course-timing";

export type PaceTone = "good" | "warn" | "risk" | "neutral";

const PACE_LABELS: Record<string, { label: string; tone: PaceTone }> = {
  ahead: { label: "Ahead", tone: "good" },
  on_track: { label: "On track", tone: "good" },
  slightly_behind: { label: "Behind", tone: "warn" },
  at_risk: { label: "At risk", tone: "risk" },
  paused: { label: "Paused", tone: "neutral" },
};

export function paceMeta(pace: string | null | undefined) {
  if (!pace) return { label: "On track", tone: "good" as PaceTone };
  return PACE_LABELS[pace] ?? { label: "On track", tone: "good" as PaceTone };
}

export function formatEta(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatNextSession(timing: CourseTimingCurrent | undefined) {
  const next = timing?.nextSession;
  if (!next) return null;
  const starts = new Date(next.startsAt);
  if (Number.isNaN(starts.getTime())) return null;
  const when = starts.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return {
    when,
    minutes: next.minutes,
    title: next.title,
    lessonId: next.lessonId,
    slotId: next.slotId,
    href: next.lessonId ? `/learn/${next.lessonId}` : "/week",
  };
}
