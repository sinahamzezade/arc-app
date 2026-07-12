import {
  Target,
  type LucideIcon,
} from "lucide-react";
import type {
  QuestionnaireOptionDto,
  QuestionnaireSchema,
  QuestionnaireStepDto,
} from "@/lib/api/types";
import { getVisibleSteps, isStepVisible } from "@/lib/questionnaire/branching";
import { resolveQuestionnaireIcon } from "@/lib/questionnaire/icons";
import type { QuestionnaireAnswers } from "@/schemas/questionnaire";

export type StepFieldKey = string;

export type StepOption = {
  value: string;
  label: string;
  icon?: LucideIcon;
  iconClassName?: string;
};

export type QuestionnaireStepConfig = {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  selection: "single" | "multi";
  allowOther?: boolean;
  uiKind: "options" | "schedule";
  reviewLabel: string;
  reviewIcon: string;
  options: StepOption[];
  scheduleDays: string[];
  scheduleTimes: StepOption[];
  visibleWhen?: QuestionnaireStepDto["visibleWhen"];
};

export type ReviewItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  stepNumber: number;
};

function mapOption(option: QuestionnaireOptionDto): StepOption {
  return {
    value: option.value,
    label: option.label,
    icon: resolveQuestionnaireIcon(option.icon),
    iconClassName: option.iconClassName,
  };
}

export function mapSchemaStep(step: QuestionnaireStepDto): QuestionnaireStepConfig {
  return {
    id: step.id,
    stepNumber: step.stepNumber,
    title: step.title,
    subtitle: step.subtitle,
    selection: step.selection,
    allowOther: step.allowOther,
    uiKind: step.uiKind,
    reviewLabel: step.reviewLabel,
    reviewIcon: step.reviewIcon,
    options: step.options.map(mapOption),
    scheduleDays: step.scheduleDays ?? [],
    scheduleTimes: (step.scheduleTimes ?? []).map(mapOption),
    visibleWhen: step.visibleWhen,
  };
}

export function mapSchemaSteps(
  schema: QuestionnaireSchema | null,
): QuestionnaireStepConfig[] {
  if (!schema) return [];
  return schema.steps.map(mapSchemaStep);
}

export function getStepByNumber(
  schema: QuestionnaireSchema | null,
  stepNumber: number,
) {
  const step = schema?.steps.find((s) => s.stepNumber === stepNumber);
  return step ? mapSchemaStep(step) : undefined;
}

export function getReviewItems(
  schema: QuestionnaireSchema | null,
  answers?: QuestionnaireAnswers,
): ReviewItem[] {
  if (!schema) return [];
  const steps = answers ? getVisibleSteps(schema, answers) : schema.steps;
  return steps.map((step) => ({
    key: step.id,
    label: step.reviewLabel,
    icon: resolveQuestionnaireIcon(step.reviewIcon) ?? Target,
    stepNumber: step.stepNumber,
  }));
}

export function getOptionLabel(
  schema: QuestionnaireSchema | null,
  stepId: string,
  value: string,
): string {
  const step = schema?.steps.find((s) => s.id === stepId);
  if (!step) return value;

  if (step.uiKind === "schedule") {
    const day = step.scheduleDays?.find(
      (d) => d === value || d.toLowerCase() === value.toLowerCase(),
    );
    if (day) return day;
    return (
      step.scheduleTimes?.find((t) => t.value === value)?.label ?? value
    );
  }

  return step.options.find((o) => o.value === value)?.label ?? value;
}

export { isStepVisible, getVisibleSteps };
