"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import type { StepOption } from "@/lib/questionnaire/steps";

type QuestionnaireOptionCardProps = {
  option: StepOption;
  selected: boolean;
  onToggle: () => void;
  showIcon?: boolean;
};

/** Option chips match IntakeChat suggestion chip style. */
export function QuestionnaireOptionCard({
  option,
  selected,
  onToggle,
  showIcon = false,
}: QuestionnaireOptionCardProps) {
  const Icon = option.icon;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition-colors",
        selected
          ? "border-[#0f1220] bg-[#0f1220] text-[#ffc928] shadow-[0_3px_0_#05060c]"
          : "border-[#0f1220]/12 bg-white text-[#0f1220] shadow-[0_3px_0_#ebe4f6] hover:border-[#0f1220]/35",
      )}
    >
      {showIcon && Icon ? (
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
            selected
              ? "bg-white/10 text-[#ffc928]"
              : (option.iconClassName ??
                "bg-arc-purple-100 text-arc-purple-600"),
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
      ) : null}

      {!showIcon && Icon ? (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]",
            selected
              ? "bg-white/10 text-[#ffc928]"
              : "bg-[#f3effc] text-arc-purple-500",
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </span>
      ) : null}

      <span className="flex-1 text-[13px] font-bold">{option.label}</span>

      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors",
          selected
            ? "border-[#ffc928] bg-[#ffc928] text-[#0f1220]"
            : "border-[#d8d0ea] bg-white",
        )}
        aria-hidden
      >
        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
    </motion.button>
  );
}
