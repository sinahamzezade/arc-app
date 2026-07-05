"use client";

import { cn } from "@/lib/utils";
import { QUESTIONNAIRE_TOTAL_STEPS } from "@/lib/questionnaire/steps";

type QuestionnaireProgressProps = {
  stepNumber: number;
  className?: string;
};

export function QuestionnaireProgress({
  stepNumber,
  className,
}: QuestionnaireProgressProps) {
  const progress = Math.min(
    100,
    Math.round((stepNumber / QUESTIONNAIRE_TOTAL_STEPS) * 100),
  );

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-arc-purple-100">
        <div
          className="h-full rounded-full bg-arc-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="shrink-0 text-arc-caption font-semibold text-arc-navy-700">
        {stepNumber} of {QUESTIONNAIRE_TOTAL_STEPS}
      </span>
    </div>
  );
}
