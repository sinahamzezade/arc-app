"use client";

import type { CourseTimingCurrent } from "@/lib/api/course-timing";

type HomePaceStripProps = {
  timing?: CourseTimingCurrent;
};

/**
 * @deprecated Pace lives inside HomeWeekLockVault. Kept so imports don't break.
 */
export function HomePaceStrip(_props: HomePaceStripProps) {
  return null;
}
