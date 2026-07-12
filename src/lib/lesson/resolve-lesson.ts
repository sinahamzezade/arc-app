import type { RoadmapLessonDto, RoadmapTreeDto } from "@/lib/api/types";
import {
  getDefaultLessonId,
  getLesson,
  type LessonMock,
} from "@/lib/lesson/mock-data";

/** Find lesson inside current roadmap tree. */
export function findRoadmapLesson(
  lessonId: string,
  roadmap: RoadmapTreeDto | null | undefined,
): { lesson: RoadmapLessonDto; ordinal: number } | null {
  if (!roadmap?.phases?.length) return null;
  let ordinal = 0;
  const phases = [...roadmap.phases].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  for (const phase of phases) {
    for (const milestone of [...phase.milestones].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    )) {
      for (const lesson of [...milestone.lessons].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      )) {
        ordinal += 1;
        if (lesson.id === lessonId) {
          return { lesson, ordinal };
        }
      }
    }
  }
  return null;
}

/**
 * Build playable lesson UI model from Roadmap Generator DTO.
 * Never bleed Hello-World mock HTML into roadmap lessons.
 */
export function buildLessonFromRoadmap(
  dto: RoadmapLessonDto,
  ordinal: number,
): LessonMock {
  const title = dto.title.trim() || "Untitled lesson";
  const mission =
    dto.missionName?.trim() ||
    missionFromType(dto.lessonType) ||
    shortMission(title);
  const minutes = dto.estimatedMinutes || 20;
  const xp = dto.xpReward || 20;
  const typeLabel = dto.lessonType || "lesson";

  const resource = dto.resource
    ? {
        label: dto.resource.title,
        href: dto.resource.url,
        note: `${dto.resource.provider} · open before you practice`,
      }
    : {
        label: "Resource coming soon",
        href: "/path",
        note: "No catalog link on this lesson yet — study the objective, then practice.",
      };

  return {
    id: dto.id,
    lessonNumber: ordinal,
    title,
    missionName: mission,
    minutes,
    xpReward: xp,
    objective: `Complete this ${typeLabel}: ${title}. Study the idea, try the practice, then pass the quick check.`,
    resource,
    arloPrompt: `Stuck on “${title}”? Ask me — I’ll break it into tiny steps.`,
    content: [
      {
        id: "c1",
        title: "What you’re learning",
        blocks: [
          {
            type: "text",
            body: `This stop is about: ${title}.`,
          },
          {
            type: "callout",
            title: "Arlo says",
            body: "Read once. Say it back in your own words. Then practice.",
          },
        ],
      },
      {
        id: "c2",
        title: "How to win this lesson",
        blocks: [
          {
            type: "text",
            body: `Goal: finish the ${typeLabel} with enough confidence to explain it out loud.`,
          },
          {
            type: "callout",
            title: "Tip",
            body:
              dto.resource != null
                ? `Skim “${dto.resource.title}” first, then come back for practice.`
                : "No external resource yet — use the objective as your brief.",
          },
        ],
      },
    ],
    practice: {
      prompt: `Which move best matches “${title}?`,
      hint: "Pick the option that sounds like doing the mission, not avoiding it.",
      options: [
        {
          id: "a",
          label: `Practice the core idea behind “${title}”`,
          correct: true,
        },
        {
          id: "b",
          label: "Skip practice and only memorize the title",
          correct: false,
        },
        {
          id: "c",
          label: "Open a random unrelated tutorial",
          correct: false,
        },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: `What is this lesson mainly about?`,
        options: [
          { id: "a", label: title },
          { id: "b", label: "Unrelated HTML starter tags" },
          { id: "c", label: "A different career track" },
        ],
        correctOptionId: "a",
        explanation: `Yep — this stop is “${title}”.`,
      },
      {
        id: "q2",
        prompt: "Best next step after reading?",
        options: [
          { id: "a", label: "Practice, then quiz" },
          { id: "b", label: "Close the app forever" },
          { id: "c", label: "Ignore the objective" },
        ],
        correctOptionId: "a",
        explanation: "Read → practice → quiz. That’s the Arc loop.",
      },
    ],
    reward: {
      xp,
      gems: 2,
      coins: 10,
      badgeId: ordinal === 1 ? "first-step" : undefined,
      badgeLabel: ordinal === 1 ? "First Step" : undefined,
      arloLine: `Nice — “${title}” is on the map now.`,
    },
    suggestedArlo: [
      `Explain “${title}” like I'm five`,
      "Give me a 60-second recap",
      "Quiz me on the key idea",
    ],
  };
}

const roadmapLessonCache = new Map<string, LessonMock>();

/** Resolve catalog mock OR roadmap-built lesson. Prefer roadmap when present. */
export function resolvePlayableLesson(
  lessonId: string,
  roadmap: RoadmapTreeDto | null | undefined,
): LessonMock | null {
  const hit = findRoadmapLesson(lessonId, roadmap);
  if (hit) {
    const cacheKey = `${hit.lesson.id}:${hit.lesson.title}:${hit.lesson.missionName}:${hit.lesson.resource?.id ?? "none"}`;
    const cached = roadmapLessonCache.get(cacheKey);
    if (cached) return cached;
    const built = buildLessonFromRoadmap(hit.lesson, hit.ordinal);
    roadmapLessonCache.set(cacheKey, built);
    return built;
  }

  // Catalog id (e.g. lesson-1) or UUID while roadmap still loading
  const catalog = getLesson(lessonId);
  if (catalog && lessonCatalogHas(lessonId)) return catalog;

  // UUID without roadmap yet — skeleton, not HTML Hello World
  if (lessonId && !lessonCatalogHas(lessonId)) {
    const skeletonKey = `skeleton:${lessonId}`;
    const cached = roadmapLessonCache.get(skeletonKey);
    if (cached) return cached;
    const skeleton = buildLessonFromRoadmap(
      {
        id: lessonId,
        title: "Loading your lesson…",
        missionName: "Trail stop",
        lessonType: "lesson",
        estimatedMinutes: 20,
        xpReward: 20,
        orderIndex: 0,
        status: "available",
        resource: null,
      },
      1,
    );
    roadmapLessonCache.set(skeletonKey, skeleton);
    return skeleton;
  }

  return catalog;
}

function lessonCatalogHas(lessonId: string) {
  return lessonId === getDefaultLessonId() || lessonId.startsWith("lesson-");
}

function missionFromType(lessonType: string) {
  const map: Record<string, string> = {
    video: "Watch & lock it in",
    practice: "Hands-on drill",
    reading: "Read the map",
    quiz: "Quick check",
    project: "Build it",
  };
  return map[lessonType] ?? null;
}

function shortMission(title: string) {
  const words = title.split(/\s+/).slice(0, 3).join(" ");
  return words.length > 28 ? `${words.slice(0, 26)}…` : words;
}
