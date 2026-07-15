import type {
  LessonPlayBodyDto,
  LessonPlayDto,
  LessonQuizBodyDto,
  LessonReadingBodyDto,
  LessonSectionDto,
  LessonTaskBodyDto,
  LessonTypeDto,
  LessonVideoBodyDto,
} from "@/lib/api/types";

export type LessonBody =
  | ({ kind: "reading" } & LessonReadingBodyDto)
  | ({ kind: "video" } & LessonVideoBodyDto)
  | ({ kind: "task" } & LessonTaskBodyDto)
  | ({ kind: "quiz" } & LessonQuizBodyDto);

/** UI playable lesson — no grading keys (server owns those). */
export type PlayableLesson = {
  id: string;
  lessonNumber: number;
  title: string;
  missionName: string;
  lessonType: LessonTypeDto;
  minutes: number;
  xpReward: number;
  objective: string;
  status: "locked" | "available" | "completed";
  provider: string | null;
  url: string | null;
  level: number;
  unitId: string | null;
  body: LessonBody;
  arloPrompt: string;
  reward: {
    xp: number;
    gems: number;
    coins: number;
    badgeId?: string;
    badgeLabel?: string;
    arloLine: string;
  };
  suggestedArlo: string[];
};

/** First in-lesson route segment for a lesson type. */
export function startSegmentFor(lessonType: LessonTypeDto): string {
  switch (lessonType) {
    case "quiz":
      return "quiz";
    case "practice":
    case "mini_project":
    case "interactive":
      return "practice";
    default:
      return "content";
  }
}

export function startHrefFor(lesson: PlayableLesson): string {
  return `/learn/${lesson.id}/${startSegmentFor(lesson.lessonType)}`;
}

/** End-of-lesson CTA — review mode skips the reward claim for already-cleared stops. */
export function finishHrefFor(
  lesson: Pick<PlayableLesson, "id" | "status">,
): string {
  return lesson.status === "completed" ? "/path" : `/learn/${lesson.id}/reward`;
}

export function finishLabelFor(
  lesson: Pick<PlayableLesson, "status">,
): string {
  return lesson.status === "completed" ? "Back to Path" : "Claim reward";
}

const ARLO_PROMPTS: Record<LessonBody["kind"], string> = {
  reading: "Read at your pace — I'll recap or explain anything you tap me for.",
  video: "Watch the video, then swing by if anything felt fuzzy.",
  task: "Work through the task step by step. Stuck? Ask me for a nudge.",
  quiz: "Show me what you've got. I'm here if a question trips you up.",
};

const ARLO_SUGGESTIONS: Record<LessonBody["kind"], string[]> = {
  reading: ["Recap the key idea", "Explain it simpler", "Quiz me on this"],
  video: ["What should I watch for?", "Recap the key idea"],
  task: ["Give me a hint", "Break the task into steps"],
  quiz: ["Recap the key idea", "How should I approach this quiz?"],
};

/**
 * Older lessons snapshot `sections` as plain strings; the current shape is
 * `{ id, title, blocks[] }`. Coerce strings into a single text block so the
 * renderer only deals with the structured shape.
 */
function normalizeSections(sections: unknown): LessonSectionDto[] {
  if (!Array.isArray(sections)) return [];
  return sections.map((section, i) => {
    if (typeof section === "string") {
      return {
        id: `s${i}`,
        title: "",
        blocks: [{ type: "text" as const, body: section }],
      };
    }
    const row = (section ?? {}) as Partial<LessonSectionDto>;
    return {
      id: row.id ?? `s${i}`,
      title: row.title ?? "",
      blocks: Array.isArray(row.blocks) ? row.blocks : [],
    };
  });
}

function narrowBody(lessonType: LessonTypeDto, body: LessonPlayBodyDto): LessonBody {
  if (lessonType === "quiz" && "questions" in body) {
    return { kind: "quiz", ...body };
  }
  if (
    (lessonType === "practice" ||
      lessonType === "mini_project" ||
      lessonType === "interactive") &&
    "task" in body
  ) {
    return { kind: "task", ...body };
  }
  if (lessonType === "video" && "note" in body && !("sections" in body)) {
    return { kind: "video", ...body };
  }
  if ("sections" in body) {
    return { kind: "reading", ...body, sections: normalizeSections(body.sections) };
  }
  // Shape/type mismatch fallbacks — trust the body shape over lessonType.
  if ("questions" in body) return { kind: "quiz", ...body };
  if ("task" in body) return { kind: "task", ...body };
  return { kind: "video", ...(body as LessonVideoBodyDto) };
}

export function mapPlayDtoToLesson(dto: LessonPlayDto): PlayableLesson {
  const body = narrowBody(dto.lessonType, dto.body);
  return {
    id: dto.id,
    lessonNumber: dto.lessonNumber,
    title: dto.title,
    missionName: dto.missionName?.trim() || "Trail stop",
    lessonType: dto.lessonType,
    minutes: dto.minutes,
    xpReward: dto.xpReward,
    objective: dto.objective || body.objective,
    status: dto.status,
    provider: dto.provider,
    url: dto.url,
    level: dto.level,
    unitId: dto.unitId,
    body,
    arloPrompt: ARLO_PROMPTS[body.kind],
    reward: {
      xp: dto.rewardPreview.xp,
      gems: dto.rewardPreview.gems,
      coins: dto.rewardPreview.coins,
      badgeId: dto.rewardPreview.badgeId,
      badgeLabel: dto.rewardPreview.badgeLabel,
      arloLine: dto.rewardPreview.arloLine,
    },
    suggestedArlo: ARLO_SUGGESTIONS[body.kind],
  };
}
