import {
  getOptionLabel,
  scheduleDays,
  scheduleTimes,
  type StepFieldKey,
} from "@/lib/questionnaire/steps";
import type { QuestionnaireAnswers } from "@/schemas/questionnaire";

function formatList(values: string[], stepId: StepFieldKey, other?: string) {
  const labels = values.map((v) => getOptionLabel(stepId, v));
  if (other?.trim()) labels.push(other.trim());
  return labels.join(", ");
}

export function formatAnswerValue(
  key: StepFieldKey,
  answers: QuestionnaireAnswers,
): string {
  switch (key) {
    case "goal":
      return formatList(answers.goal, "goal");
    case "motivation":
      return formatList(answers.motivation, "motivation", answers.motivationOther);
    case "currentJob":
      return answers.currentJob === "other" && answers.currentJobOther
        ? answers.currentJobOther
        : getOptionLabel("currentJob", answers.currentJob);
    case "skills":
      return formatList(answers.skills, "skills", answers.skillsOther);
    case "studyHours":
      return getOptionLabel("studyHours", answers.studyHours);
    case "schedule": {
      const days = answers.schedule.days.join(", ");
      const times = answers.schedule.times
        .map((t) => scheduleTimes.find((s) => s.value === t)?.label ?? t)
        .join(", ");
      return [days, times].filter(Boolean).join(", ");
    }
    case "deadline":
      return getOptionLabel("deadline", answers.deadline);
    case "learningStyle":
      return formatList(
        answers.learningStyle,
        "learningStyle",
        answers.learningStyleOther,
      );
    case "confidence":
      return getOptionLabel("confidence", answers.confidence);
    case "quitReasons":
      return formatList(
        answers.quitReasons,
        "quitReasons",
        answers.quitReasonsOther,
      );
    default:
      return "";
  }
}

export function isStepComplete(
  key: StepFieldKey,
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
    default:
      return false;
  }
}

export { scheduleDays, scheduleTimes };
