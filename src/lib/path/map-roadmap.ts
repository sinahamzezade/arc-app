import type { RoadmapLessonDto, RoadmapTreeDto } from "@/lib/api/types";
import type {
  PathIconName,
  PathMockData,
  PathNode,
  PathNodeStatus,
} from "@/lib/path/mock-data";

const ICONS: PathIconName[] = [
  "flag",
  "tag",
  "trend-up",
  "link",
  "mask",
  "palette",
  "columns",
];

function lessonStatus(lesson: RoadmapLessonDto): PathNodeStatus {
  if (lesson.status === "available") return "current";
  if (lesson.status === "completed") return "done";
  return "locked";
}

/** Map Roadmap Generator tree → Path screen trail model. */
export function mapRoadmapToPathData(roadmap: RoadmapTreeDto): PathMockData {
  const nodes: PathNode[] = [];
  let lessonOrdinal = 0;
  let lessonsDone = 0;
  let lessonsTotal = 0;
  let milestoneCount = 0;
  let firstAvailable: {
    lessonNumber: number;
    title: string;
    href: string;
    minutes: number;
  } | null = null;

  const phases = [...roadmap.phases].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  phases.forEach((phase, phaseIndex) => {
    const unit = phaseIndex + 1;

    if (phaseIndex > 0) {
      nodes.push({
        id: `gate-${phase.id}`,
        title: phase.title,
        subtitle: `Unit ${unit}`,
        kind: "unit-gate",
        status: phase.locked ? "unit-locked" : "locked",
        icon: "lock",
        unit,
      });
    }

    for (const milestone of [...phase.milestones].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    )) {
      milestoneCount += 1;
      for (const lesson of [...milestone.lessons].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      )) {
        lessonsTotal += 1;
        lessonOrdinal += 1;
        if (lesson.status === "completed") lessonsDone += 1;

        const status = lessonStatus(lesson);
        if (!firstAvailable && lesson.status === "available") {
          firstAvailable = {
            lessonNumber: lessonOrdinal,
            title: lesson.missionName || lesson.title,
            href: `/learn/${lesson.id}`,
            minutes: lesson.estimatedMinutes,
          };
        }

        nodes.push({
          id: lesson.id,
          title: lesson.missionName || lesson.title,
          subtitle: `Lesson ${lessonOrdinal}`,
          kind: "lesson",
          status,
          icon: ICONS[(lessonOrdinal - 1) % ICONS.length],
          unit,
          showLock: lesson.status === "locked" && !phase.locked,
        });
      }

      nodes.push({
        id: milestone.id,
        title: milestone.title,
        subtitle: "Milestone",
        kind: "milestone",
        status: "milestone",
        icon: "trophy",
        unit,
      });
    }
  });

  return {
    trackTitle: roadmap.title.replace(/\s+Path$/i, "") || roadmap.title,
    milestoneCount,
    lessonsDone,
    lessonsTotal,
    rank: {
      level: 1,
      title: phases[0]?.title ?? "Start",
      unitLabel: phases[0] ? `Unit 1` : "Unit 1",
    },
    nodes,
    upNext: firstAvailable ?? {
      lessonNumber: 1,
      title: "Your next lesson",
      href: "/learn",
      minutes: 20,
    },
  };
}
