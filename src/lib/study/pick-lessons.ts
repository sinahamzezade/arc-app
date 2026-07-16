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

export type StudyUnitPick = {
  unitId: string;
  lessonId: string;
  title: string;
  estimatedMinutes: number;
  status: RoadmapLessonDto["status"];
};

/** Unique Units (by unitId) from pickable reading lessons. */
export function pickableStudyUnits(
  roadmap: RoadmapTreeDto | null | undefined,
): StudyUnitPick[] {
  const lessons = pickableStudyLessons(roadmap);
  const seen = new Set<string>();
  const out: StudyUnitPick[] = [];
  for (const lesson of lessons) {
    const unitId = lesson.unitId?.trim();
    if (!unitId || seen.has(unitId)) continue;
    seen.add(unitId);
    out.push({
      unitId,
      lessonId: lesson.id,
      title: lesson.title,
      estimatedMinutes: lesson.estimatedMinutes,
      status: lesson.status,
    });
  }
  return out;
}
