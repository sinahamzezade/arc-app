import type { RoadmapLessonDto, RoadmapTreeDto } from "@/lib/api/types";

/** Reading lessons on path that can be shared in Study Together. */
export function pickableStudyLessons(
  roadmap: RoadmapTreeDto | null | undefined,
): RoadmapLessonDto[] {
  if (!roadmap) return [];
  const out: RoadmapLessonDto[] = [];
  for (const phase of roadmap.phases) {
    for (const milestone of phase.milestones) {
      for (const lesson of milestone.lessons) {
        if (
          lesson.lessonType === "reading" &&
          (lesson.status === "available" || lesson.status === "completed")
        ) {
          out.push(lesson);
        }
      }
    }
  }
  return out;
}
