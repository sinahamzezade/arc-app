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
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-[#ffc928] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-black tracking-wide text-white/60 uppercase">
        {stepNumber}/{QUESTIONNAIRE_TOTAL_STEPS}
      </span>
    </div>
  );
}
