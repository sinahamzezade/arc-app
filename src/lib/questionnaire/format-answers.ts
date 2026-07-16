import type {
  QuestionnaireOptionDto,
  QuestionnaireSchema,
  QuestionnaireStepDto,
} from "@/lib/api/types";
import { getOptionLabel } from "@/lib/questionnaire/steps";
import {
  asOptionalString,
  asSchedule,
  asSkillEvidence,
  asString,
  asStringArray,
  asTrackSelection,
  type QuestionnaireAnswers,
} from "@/schemas/questionnaire";

function optionLabel(
  options: QuestionnaireOptionDto[] | undefined,
  value: string,
): string {
  return options?.find((o) => o.value === value)?.label ?? value;
}

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

  switch (step?.uiKind) {
    case "track-select": {
      const track = asTrackSelection(answers, key);
      if (!track.primary) return "";
      const primary = optionLabel(step.options, track.primary);
      const secondary = track.secondary.map((s) =>
        optionLabel(step.options, s),
      );
      return secondary.length ? `${primary} + ${secondary.join(", ")}` : primary;
    }
    case "skill-evidence": {
      const evidence = asSkillEvidence(answers, key);
      if (!evidence.length) return other ?? "No prior skills";
      const parts = evidence.map(
        (e) =>
          `${optionLabel(step.options, e.skillSlug)} (${optionLabel(step.exposureOptions, e.exposureLevel)})`,
      );
      if (other?.trim()) parts.push(other.trim());
      return parts.join(", ");
    }
    case "capacity": {
      const hours = asString(answers, key);
      const session = asString(answers, "preferredSessionMinutes");
      return [
        hours ? optionLabel(step.options, hours) : "",
        session
          ? `${optionLabel(step.sessionOptions, session)} sessions`
          : "",
      ]
        .filter(Boolean)
        .join(" · ");
    }
    case "outcome": {
      const outcome = asString(answers, key);
      const deadline = asString(answers, "deadline");
      return [
        outcome ? optionLabel(step.options, outcome) : "",
        deadline ? optionLabel(step.secondaryOptions, deadline) : "",
      ]
        .filter(Boolean)
        .join(" · ");
    }
    case "context": {
      const status = asString(answers, key);
      const freq = asString(answers, "useFrequency");
      return [
        status ? optionLabel(step.options, status) : (other ?? ""),
        freq ? optionLabel(step.secondaryOptions, freq) : "",
      ]
        .filter(Boolean)
        .join(" · ");
    }
    case "confidence-barriers": {
      const confidence = asString(answers, "confidence");
      const barriers = asStringArray(answers, key).map((b) =>
        optionLabel(step.secondaryOptions, b),
      );
      if (other?.trim()) barriers.push(other.trim());
      return [
        confidence ? optionLabel(step.options, confidence) : "",
        barriers.join(", "),
      ]
        .filter(Boolean)
        .join(" · ");
    }
    default:
      break;
  }

  if (step?.uiKind === "schedule" || isScheduleShape(answers[key])) {
    const schedule = asSchedule(answers, key);
    return schedule.times
      .map(
        (t) =>
          step?.scheduleTimes?.find((s) => s.value === t)?.label ?? t,
      )
      .join(", ");
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

function isTrackShape(value: unknown): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as { primary?: unknown }).primary === "string"
  );
}

/** Mirrors backend listMissingFields per uiKind. */
export function isStepComplete(
  key: string,
  answers: QuestionnaireAnswers,
  schema?: QuestionnaireSchema | null,
): boolean {
  const step: QuestionnaireStepDto | undefined = schema?.steps.find(
    (s) => s.id === key,
  );
  const other = asOptionalString(answers, `${key}Other`);

  switch (step?.uiKind) {
    case "track-select":
      return Boolean(asTrackSelection(answers, key).primary);
    case "skill-evidence":
      // Empty skill list is valid ("no prior skills").
      return true;
    case "capacity":
      return (
        Boolean(asString(answers, key)) &&
        Boolean(asString(answers, "preferredSessionMinutes"))
      );
    case "outcome":
      return (
        Boolean(asString(answers, key)) &&
        Boolean(asString(answers, "deadline"))
      );
    case "context":
      return (
        Boolean(asString(answers, key) || other) &&
        Boolean(asString(answers, "useFrequency"))
      );
    case "confidence-barriers":
      return (
        Boolean(asString(answers, "confidence")) &&
        (asStringArray(answers, key).length > 0 || Boolean(other))
      );
    default:
      break;
  }

  if (step?.uiKind === "schedule" || isScheduleShape(answers[key])) {
    const schedule = asSchedule(answers, key);
    return schedule.times.length > 0;
  }

  if (!step && isTrackShape(answers[key])) {
    return Boolean(asTrackSelection(answers, key).primary);
  }

  if (step?.selection === "multi" || Array.isArray(answers[key])) {
    return asStringArray(answers, key).length > 0 || Boolean(other);
  }

  return Boolean(asString(answers, key) || other);
}
