import { z } from "zod";

export type ScheduleAnswer = {
  days: string[];
  times: string[];
};

/** Dynamic answers keyed by schema step id (+ `${id}Other`). */
export type QuestionnaireAnswers = Record<string, unknown>;

export const scheduleAnswerSchema = z.object({
  days: z.array(z.string()),
  times: z.array(z.string()),
});

/** Loose client schema — server enforces against active questionnaire definition. */
export const questionnaireAnswersSchema = z.record(z.string(), z.unknown());

export function isScheduleAnswer(value: unknown): value is ScheduleAnswer {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return Array.isArray(row.days) && Array.isArray(row.times);
}

export function asStringArray(
  answers: QuestionnaireAnswers,
  key: string,
): string[] {
  const value = answers[key];
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
    };
  }
  return { days: [], times: [] };
}

export function emptyQuestionnaireAnswers(
  schemaSteps?: { id: string; uiKind?: string; selection?: string }[],
): QuestionnaireAnswers {
  if (!schemaSteps?.length) return {};
  const out: QuestionnaireAnswers = {};
  for (const step of schemaSteps) {
    if (step.uiKind === "schedule") {
      out[step.id] = { days: [], times: [] };
    } else if (step.selection === "single") {
      out[step.id] = "";
    } else {
      out[step.id] = [];
    }
  }
  return out;
}
