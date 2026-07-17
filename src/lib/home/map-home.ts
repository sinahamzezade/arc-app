import type {
  RoadmapLessonDto,
  RoadmapTreeDto,
  WeekCurrentResponse,
} from "@/lib/api/types";
import { emptyHomeData, type HomeData } from "@/lib/home/types";

export type NextMission = {
  lesson: RoadmapLessonDto;
  unit: number;
  track: string;
  progressPercent: number;
  ordinal: number;
};

/** Current phase narrative identity (engagement §9). */
export function findPhaseIdentity(
  roadmap: RoadmapTreeDto,
): string | null {
  const phases = [...roadmap.phases].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  for (const phase of phases) {
    const hasAvailable = phase.milestones.some((m) =>
      m.lessons.some((l) => l.status === "available"),
    );
    if (hasAvailable) {
      return phase.narrativeTitle?.trim() || phase.title || null;
    }
  }

  const first = phases[0];
  return first?.narrativeTitle?.trim() || first?.title || null;
}

/** First available lesson on the path (or first incomplete). */
export function findNextMission(
  roadmap: RoadmapTreeDto,
): NextMission | null {
  const phases = [...roadmap.phases].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  let ordinal = 0;
  let fallback: NextMission | null = null;

  for (let pi = 0; pi < phases.length; pi++) {
    const phase = phases[pi]!;
    const unit = pi + 1;
    for (const milestone of [...phase.milestones].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    )) {
      for (const lesson of [...milestone.lessons].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      )) {
        ordinal += 1;
        const hit: NextMission = {
          lesson,
          unit,
          track: roadmap.title,
          progressPercent: roadmap.progressPercent,
          ordinal,
        };
        if (lesson.status === "available") return hit;
        if (!fallback && lesson.status !== "completed") fallback = hit;
      }
    }
  }

  return fallback;
}

function lessonTypeLabel(type: string): string {
  const t = type.trim();
  if (!t) return "Lesson";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/** Rough gem preview when roadmap DTO has XP only. */
function gemsFromXp(xp: number): number {
  return Math.max(1, Math.round(xp / 7));
}

export type CurrentMilestone = {
  title: string;
  subtitle: string;
  stepsDone: number;
  stepsTotal: number;
  rewardXp: number;
  rewardGems: number;
  href: string;
};

/** First milestone with incomplete lessons (active quest). */
export function findCurrentMilestone(
  roadmap: RoadmapTreeDto,
): CurrentMilestone | null {
  const phases = [...roadmap.phases].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  for (const phase of phases) {
    for (const milestone of [...phase.milestones].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    )) {
      const lessons = [...milestone.lessons].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      if (lessons.length === 0) continue;

      const stepsDone = lessons.filter((l) => l.status === "completed").length;
      const stepsTotal = lessons.length;
      if (stepsDone >= stepsTotal) continue;

      const rewardXp = lessons.reduce((sum, l) => sum + (l.xpReward || 0), 0);
      const nextLesson =
        lessons.find((l) => l.status === "available") ??
        lessons.find((l) => l.status !== "completed") ??
        lessons[0]!;

      return {
        title: milestone.title,
        subtitle: `Finish ${milestone.title}`,
        stepsDone,
        stepsTotal,
        rewardXp,
        rewardGems: gemsFromXp(rewardXp),
        href: `/learn/${nextLesson.id}`,
      };
    }
  }

  return null;
}

/**
 * Overlay live roadmap + week onto home desk model.
 * Mission href always `/learn/{uuid}` when a lesson exists.
 */
export function mapHomeFromBackend(input: {
  base?: HomeData;
  roadmap?: RoadmapTreeDto | null;
  week?: WeekCurrentResponse | null;
  userName?: string | null;
  gems?: number;
  xp?: number;
  coins?: number;
  notificationCount?: number;
  weeklyStreakWeeks?: number;
}): { data: HomeData; unit: number; identityArc: string | null } {
  const base = input.base ?? emptyHomeData();
  let data: HomeData = { ...base };
  let unit = 1;
  let identityArc: string | null = null;

  if (input.userName) {
    data = { ...data, userName: input.userName };
  }

  if (typeof input.notificationCount === "number") {
    data = { ...data, notificationCount: input.notificationCount };
  }

  data = {
    ...data,
    stats: {
      ...data.stats,
      ...(typeof input.xp === "number" ? { xp: input.xp } : {}),
      ...(typeof input.gems === "number" ? { gems: input.gems } : {}),
      ...(typeof input.coins === "number" ? { coins: input.coins } : {}),
    },
  };

  if (input.roadmap) {
    identityArc = findPhaseIdentity(input.roadmap);
    const next = findNextMission(input.roadmap);
    if (next) {
      unit = next.unit;
      const { lesson } = next;
      data = {
        ...data,
        mission: {
          title: lesson.missionName?.trim() || lesson.title,
          track: next.track,
          type: lessonTypeLabel(lesson.lessonType),
          minutes: lesson.estimatedMinutes,
          xp: lesson.xpReward,
          gems: gemsFromXp(lesson.xpReward),
          progressPercent: next.progressPercent,
          href: `/learn/${lesson.id}`,
        },
      };
    } else {
      data = {
        ...data,
        mission: {
          ...data.mission,
          track: input.roadmap.title,
          progressPercent: input.roadmap.progressPercent,
          href: "/learn",
        },
      };
    }

    const milestone = findCurrentMilestone(input.roadmap);
    if (milestone) {
      data = { ...data, milestone };
    } else {
      data = {
        ...data,
        milestone: {
          ...data.milestone,
          stepsDone: data.milestone.stepsTotal,
          href: "/path",
        },
      };
    }
  }

  if (input.week) {
    const streakWeeks =
      input.weeklyStreakWeeks ?? input.week.streak.weeks;
    data = {
      ...data,
      weeklyProgress: { ...input.week.progress },
      weeklyStreak: {
        weeks: streakWeeks,
        days: input.week.streak.days.map((d) => ({
          label: d.label,
          status: d.status,
        })),
      },
      arloSays: {
        ...data.arloSays,
        quote: input.week.arloNudge || data.arloSays.quote,
      },
    };
  } else if (typeof input.weeklyStreakWeeks === "number") {
    data = {
      ...data,
      weeklyStreak: {
        ...data.weeklyStreak,
        weeks: input.weeklyStreakWeeks,
      },
    };
  }

  return { data, unit, identityArc };
}
