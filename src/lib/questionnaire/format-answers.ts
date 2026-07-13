import type { QuestionnaireSchema } from "@/lib/api/types";
import { getOptionLabel } from "@/lib/questionnaire/steps";
import {
  asOptionalString,
  asSchedule,
  asString,
  asStringArray,
  type QuestionnaireAnswers,
} from "@/schemas/questionnaire";

function formatList(
  schema: QuestionnaireSchema | null,
  values: string[],
  stepId: string,
  other?: string,
) {
  const labels = values.map((v) => getOptionLabel(schema, stepId, v));
  if (other?.trim()) labels.push(other.trim());
  return labels.join(", ");
}

export function formatAnswerValue(
  schema: QuestionnaireSchema | null,
  key: string,
  answers: QuestionnaireAnswers,
): string {
  const step = schema?.steps.find((s) => s.id === key);
  const other = asOptionalString(answers, `${key}Other`);

  if (step?.uiKind === "schedule" || isScheduleShape(answers[key])) {
    const schedule = asSchedule(answers, key);
    const days = schedule.days.join(", ");
    const times = schedule.times
      .map(
        (t) =>
          step?.scheduleTimes?.find((s) => s.value === t)?.label ?? t,
      )
      .join(", ");
    return [days, times].filter(Boolean).join(" · ");
  }

  if (step?.selection === "multi" || Array.isArray(answers[key])) {
    return formatList(schema, asStringArray(answers, key), key, other);
  }

  const value = asString(answers, key);
  if (value === "other" && other) return other;
  if (!value && other) return other;
  return value ? getOptionLabel(schema, key, value) : other ?? "";
}

function isScheduleShape(value: unknown): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as { days?: unknown }).days) &&
    Array.isArray((value as { times?: unknown }).times)
  );
}

export function isStepComplete(
  key: string,
  answers: QuestionnaireAnswers,
  schema?: QuestionnaireSchema | null,
): boolean {
  const step = schema?.steps.find((s) => s.id === key);
  const other = asOptionalString(answers, `${key}Other`);

  if (step?.uiKind === "schedule" || isScheduleShape(answers[key])) {
    const schedule = asSchedule(answers, key);
    return schedule.days.length > 0 && schedule.times.length > 0;
  }

  if (step?.selection === "multi" || Array.isArray(answers[key])) {
    return asStringArray(answers, key).length > 0 || Boolean(other);
  }

  return Boolean(asString(answers, key) || other);
}
