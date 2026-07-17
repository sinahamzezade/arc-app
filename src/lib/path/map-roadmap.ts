import type { RoadmapTreeDto } from "@/lib/api/types";
import type {
  PathIconName,
  PathData,
  PathNode,
  PathNodeStatus,
} from "@/lib/path/types";

const ICONS: PathIconName[] = [
  "flag",
  "tag",
  "trend-up",
  "link",
  "mask",
  "palette",
  "columns",
];

/** Map Roadmap Generator tree → Path screen trail model. */
export function mapRoadmapToPathData(roadmap: RoadmapTreeDto): PathData {
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
  let currentAssigned = false;

  const phases = [...roadmap.phases].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  phases.forEach((phase, phaseIndex) => {
    const unit = phaseIndex + 1;

    if (phaseIndex > 0) {
      const phaseLabel =
        phase.narrativeTitle?.trim() || phase.title || `Unit ${unit}`;
      nodes.push({
        id: `gate-${phase.id}`,
        title: phaseLabel,
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

        let status: PathNodeStatus = "locked";
        if (lesson.status === "completed") {
          status = "done";
        } else if (lesson.status === "available" && !currentAssigned) {
          // One "You are here" only — extras are career-path bleed / race.
          status = "current";
          currentAssigned = true;
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

  const currentPhase =
    phases.find((p) =>
      p.milestones.some((m) =>
        m.lessons.some((l) => l.status === "available"),
      ),
    ) ?? phases[0];

  const identityTitle =
    currentPhase?.narrativeTitle?.trim() ||
    currentPhase?.title ||
    phases[0]?.title ||
    "Start";

  return {
    roadmapId: roadmap.id,
    trackTitle: roadmap.title.replace(/\s+Path$/i, "") || roadmap.title,
    milestoneCount,
    lessonsDone,
    lessonsTotal,
    rank: {
      level: 1,
      title: identityTitle,
      unitLabel: currentPhase
        ? `Unit ${phases.indexOf(currentPhase) + 1}`
        : "Unit 1",
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
