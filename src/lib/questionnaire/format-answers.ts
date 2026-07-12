import type { QuestionnaireSchema } from "@/lib/api/types";
import { getOptionLabel } from "@/lib/questionnaire/steps";
import type { QuestionnaireAnswers } from "@/schemas/questionnaire";

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
  const scheduleStep = schema?.steps.find((s) => s.id === "schedule");

  switch (key) {
    case "goal":
      return formatList(schema, answers.goal, "goal");
    case "motivation":
      return formatList(
        schema,
        answers.motivation,
        "motivation",
        answers.motivationOther,
      );
    case "currentJob":
      return answers.currentJob === "other" && answers.currentJobOther
        ? answers.currentJobOther
        : getOptionLabel(schema, "currentJob", answers.currentJob);
    case "skills":
      return formatList(schema, answers.skills, "skills", answers.skillsOther);
    case "studyHours":
      return getOptionLabel(schema, "studyHours", answers.studyHours);
    case "schedule": {
      const days = answers.schedule.days.join(", ");
      const times = answers.schedule.times
        .map(
          (t) =>
            scheduleStep?.scheduleTimes?.find((s) => s.value === t)?.label ?? t,
        )
        .join(", ");
      return [days, times].filter(Boolean).join(", ");
    }
    case "deadline":
      return getOptionLabel(schema, "deadline", answers.deadline);
    case "learningStyle":
      return formatList(
        schema,
        answers.learningStyle,
        "learningStyle",
        answers.learningStyleOther,
      );
    case "confidence":
      return getOptionLabel(schema, "confidence", answers.confidence);
    case "quitReasons":
      return formatList(
        schema,
        answers.quitReasons,
        "quitReasons",
        answers.quitReasonsOther,
      );
    default:
      return "";
  }
}

export function isStepComplete(
  key: string,
  answers: QuestionnaireAnswers,
): boolean {
  switch (key) {
    case "goal":
      return answers.goal.length > 0;
    case "motivation":
      return answers.motivation.length > 0;
    case "currentJob":
      return Boolean(answers.currentJob);
    case "skills":
      return answers.skills.length > 0;
    case "studyHours":
      return Boolean(answers.studyHours);
    case "schedule":
      return (
        answers.schedule.days.length > 0 && answers.schedule.times.length > 0
      );
    case "deadline":
      return Boolean(answers.deadline);
    case "learningStyle":
      return answers.learningStyle.length > 0;
    case "confidence":
      return Boolean(answers.confidence);
    case "quitReasons":
      return answers.quitReasons.length > 0;
    default: {
      const value = answers[key as keyof QuestionnaireAnswers];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "string") return Boolean(value);
      return false;
    }
  }
}
