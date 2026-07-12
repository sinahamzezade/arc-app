"use client";

import { cn } from "@/lib/utils";

type QuestionnaireProgressProps = {
  stepNumber: number;
  totalSteps: number;
  className?: string;
};

export function QuestionnaireProgress({
  stepNumber,
  totalSteps,
  className,
}: QuestionnaireProgressProps) {
  const progress = Math.min(
    100,
    Math.round((stepNumber / Math.max(totalSteps, 1)) * 100),
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
        {stepNumber}/{totalSteps}
      </span>
    </div>
  );
}
