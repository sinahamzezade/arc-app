"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { StepOption } from "@/lib/questionnaire/steps";

type QuestionnaireOptionCardProps = {
  option: StepOption;
  selected: boolean;
  onToggle: () => void;
  showIcon?: boolean;
};

export function QuestionnaireOptionCard({
  option,
  selected,
  onToggle,
  showIcon = false,
}: QuestionnaireOptionCardProps) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-arc-md border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-arc-purple-500 bg-arc-purple-50 text-arc-purple-600"
          : "border-arc-navy-200 bg-white text-arc-navy-900",
      )}
    >
      {showIcon && Icon && (
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-arc-sm",
            option.iconClassName ?? "bg-arc-purple-100 text-arc-purple-600",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      )}

      {option.emoji && (
        <span className="text-xl leading-none" aria-hidden>
          {option.emoji}
        </span>
      )}

      <span className="flex-1 text-arc-body font-semibold">{option.label}</span>

      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors",
          selected
            ? "border-arc-purple-500 bg-arc-purple-500"
            : "border-arc-navy-200 bg-white",
        )}
        aria-hidden
      >
        {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
    </button>
  );
}
