import type {
  QuestionnaireSchema,
  QuestionnaireStepDto,
  StepVisibleWhen,
} from "@/lib/api/types";
import type { QuestionnaireAnswers } from "@/schemas/questionnaire";

function asRules(
  visibleWhen: StepVisibleWhen | StepVisibleWhen[] | undefined,
): StepVisibleWhen[] {
  if (!visibleWhen) return [];
  return Array.isArray(visibleWhen) ? visibleWhen : [visibleWhen];
}

function fieldValues(
  answers: QuestionnaireAnswers,
  field: string,
): string[] {
  const value = answers[field];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value) return [value];
  if (
    value &&
    typeof value === "object" &&
    "days" in value &&
    "times" in value
  ) {
    const schedule = value as { days: unknown; times: unknown };
    const days = Array.isArray(schedule.days)
      ? schedule.days.filter((d): d is string => typeof d === "string")
      : [];
    const times = Array.isArray(schedule.times)
      ? schedule.times.filter((t): t is string => typeof t === "string")
      : [];
    return [...days, ...times];
  }
  return [];
}

function matchesRule(
  answers: QuestionnaireAnswers,
  rule: StepVisibleWhen,
): boolean {
  const actual = fieldValues(answers, rule.field);
  const expected = Array.isArray(rule.value) ? rule.value : [rule.value];

  switch (rule.op) {
    case "eq":
      return (
        actual.length === expected.length &&
        expected.every((token) => actual.includes(token))
      );
    case "neq":
      return !(
        actual.length === expected.length &&
        expected.every((token) => actual.includes(token))
      );
    case "includes":
      return expected.some((token) => actual.includes(token));
    case "excludes":
      return expected.every((token) => !actual.includes(token));
    default:
      return true;
  }
}

/** Question Engine client: adaptive branch evaluation. */
export function isStepVisible(
  step: Pick<QuestionnaireStepDto, "visibleWhen">,
  answers: QuestionnaireAnswers,
): boolean {
  const rules = asRules(step.visibleWhen);
  if (!rules.length) return true;
  return rules.every((rule) => matchesRule(answers, rule));
}

export function getVisibleSteps(
  schema: QuestionnaireSchema | null,
  answers: QuestionnaireAnswers,
): QuestionnaireStepDto[] {
  if (!schema) return [];
  return schema.steps
    .slice()
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .filter((step) => isStepVisible(step, answers));
}

export function getVisibleStepNumbers(
  schema: QuestionnaireSchema | null,
  answers: QuestionnaireAnswers,
): number[] {
  return getVisibleSteps(schema, answers).map((s) => s.stepNumber);
}

export function getAdjacentVisibleStep(
  schema: QuestionnaireSchema | null,
  answers: QuestionnaireAnswers,
  currentStepNumber: number,
  direction: "prev" | "next",
): number | null {
  const numbers = getVisibleStepNumbers(schema, answers);
  const index = numbers.indexOf(currentStepNumber);
  if (index === -1) return null;
  const nextIndex = direction === "next" ? index + 1 : index - 1;
  return numbers[nextIndex] ?? null;
}

export function getVisibleProgress(
  schema: QuestionnaireSchema | null,
  answers: QuestionnaireAnswers,
  currentStepNumber: number,
): { index: number; total: number } {
  const numbers = getVisibleStepNumbers(schema, answers);
  const index = numbers.indexOf(currentStepNumber);
  return {
    index: index === -1 ? 0 : index,
    total: numbers.length || schema?.totalSteps || 0,
  };
}
