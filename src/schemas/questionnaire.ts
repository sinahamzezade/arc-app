import { z } from "zod";

export type ScheduleAnswer = {
  days: string[];
  times: string[];
  timezone?: string;
};

export type SkillEvidenceAnswer = {
  skillSlug: string;
  exposureLevel: string;
};

export type TrackSelectionAnswer = {
  primary: string;
  secondary: string[];
};

/** Dynamic answers keyed by schema step id (+ `${id}Other` + compound keys). */
export type QuestionnaireAnswers = Record<string, unknown>;

export const scheduleAnswerSchema = z.object({
  days: z.array(z.string()),
  times: z.array(z.string()),
  timezone: z.string().optional(),
});

/** Loose client schema — server enforces against active questionnaire definition. */
export const questionnaireAnswersSchema = z.record(z.string(), z.unknown());

export function isScheduleAnswer(value: unknown): value is ScheduleAnswer {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return Array.isArray(row.days) && Array.isArray(row.times);
}

export function isSkillEvidenceAnswer(
  value: unknown,
): value is SkillEvidenceAnswer {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.skillSlug === "string" && typeof row.exposureLevel === "string"
  );
}

export function isTrackSelectionAnswer(
  value: unknown,
): value is TrackSelectionAnswer {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return typeof row.primary === "string" && Array.isArray(row.secondary);
}

export function asStringArray(
  answers: QuestionnaireAnswers,
  key: string,
): string[] {
  const value = answers[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function asString(answers: QuestionnaireAnswers, key: string): string {
  const value = answers[key];
  return typeof value === "string" ? value : "";
}

export function asOptionalString(
  answers: QuestionnaireAnswers,
  key: string,
): string | undefined {
  const value = answers[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function asSchedule(
  answers: QuestionnaireAnswers,
  key = "schedule",
): ScheduleAnswer {
  const value = answers[key];
  if (isScheduleAnswer(value)) {
    return {
      days: value.days.filter((d): d is string => typeof d === "string"),
      times: value.times.filter((t): t is string => typeof t === "string"),
      timezone:
        typeof value.timezone === "string" && value.timezone.trim()
          ? value.timezone.trim()
          : undefined,
    };
  }
  return { days: [], times: [] };
}

export function asSkillEvidence(
  answers: QuestionnaireAnswers,
  key = "skills",
): SkillEvidenceAnswer[] {
  const value = answers[key];
  if (!Array.isArray(value)) return [];
  // Legacy flat skill list → default exposure
  if (value.every((item) => typeof item === "string")) {
    return (value as string[])
      .filter((s) => s && s !== "none")
      .map((skillSlug) => ({ skillSlug, exposureLevel: "heard_of" }));
  }
  return value.filter(isSkillEvidenceAnswer).map((item) => ({
    skillSlug: item.skillSlug.trim(),
    exposureLevel: item.exposureLevel.trim(),
  }));
}

export function asTrackSelection(
  answers: QuestionnaireAnswers,
  key = "goal",
): TrackSelectionAnswer {
  const value = answers[key];
  if (isTrackSelectionAnswer(value)) {
    return {
      primary: value.primary.trim(),
      secondary: value.secondary
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }
  // Legacy multi-select: first = primary
  const roles = asStringArray(answers, key);
  return {
    primary: roles[0] ?? "",
    secondary: roles.slice(1),
  };
}

/** Browser IANA timezone, e.g. "Europe/Berlin". */
export function detectTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

export function emptyQuestionnaireAnswers(
  schemaSteps?: { id: string; uiKind?: string; selection?: string }[],
): QuestionnaireAnswers {
  if (!schemaSteps?.length) return {};
  const out: QuestionnaireAnswers = {};
  for (const step of schemaSteps) {
    switch (step.uiKind) {
      case "schedule":
        out[step.id] = { days: [], times: [] };
        break;
      case "track-select":
        out[step.id] = { primary: "", secondary: [] };
        break;
      case "skill-evidence":
      case "confidence-barriers":
        out[step.id] = [];
        break;
      case "capacity":
      case "outcome":
      case "context":
        out[step.id] = "";
        break;
      default:
        out[step.id] = step.selection === "single" ? "" : [];
    }
  }
  return out;
}
