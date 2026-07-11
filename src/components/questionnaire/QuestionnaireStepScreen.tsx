"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { authCtaClassName } from "@/components/onboarding/AuthShell";
import { isStepComplete } from "@/lib/questionnaire/format-answers";
import {
  getStepByNumber,
  scheduleDays,
  scheduleTimes,
  type QuestionnaireStepConfig,
} from "@/lib/questionnaire/steps";
import type { QuestionnaireAnswers } from "@/schemas/questionnaire";
import { useQuestionnaireStore } from "@/store/useQuestionnaireStore";
import { QuestionnaireLayout } from "./QuestionnaireLayout";
import { QuestionnaireOptionCard } from "./QuestionnaireOptionCard";

type QuestionnaireStepScreenProps = {
  stepNumber: number;
};

export default function QuestionnaireStepScreen({
  stepNumber,
}: QuestionnaireStepScreenProps) {
  const router = useRouter();
  const step = getStepByNumber(stepNumber);
  const { answers, setAnswers } = useQuestionnaireStore();

  if (!step) return null;

  const canProceed = isStepComplete(step.id, answers);
  const nextPath =
    stepNumber >= 10
      ? "/questionnaire/review"
      : `/questionnaire/${stepNumber + 1}`;

  const handleBack = () => {
    if (stepNumber === 1) router.push("/questionnaire");
    else router.push(`/questionnaire/${stepNumber - 1}`);
  };

  return (
    <QuestionnaireLayout
      stepNumber={stepNumber}
      onBack={handleBack}
      title={step.title}
      subtitle={step.subtitle}
      footer={
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            className={cn(authCtaClassName, !canProceed && "opacity-45")}
            isDisabled={!canProceed}
            onPress={() => router.push(nextPath)}
          >
            Next
          </Button>
        </motion.div>
      }
    >
      {step.id === "schedule" ? (
        <ScheduleStep answers={answers} setAnswers={setAnswers} />
      ) : (
        <StandardStep step={step} answers={answers} setAnswers={setAnswers} />
      )}
    </QuestionnaireLayout>
  );
}

function StandardStep({
  step,
  answers,
  setAnswers,
}: {
  step: QuestionnaireStepConfig;
  answers: QuestionnaireAnswers;
  setAnswers: (patch: Partial<QuestionnaireAnswers>) => void;
}) {
  const otherKey = `${step.id}Other` as keyof QuestionnaireAnswers;
  const otherValue = (answers[otherKey] as string | undefined) ?? "";

  const selectedValues = useMemo(() => {
    const value = answers[step.id];
    if (step.selection === "multi" && Array.isArray(value)) return value;
    if (step.selection === "single" && typeof value === "string" && value)
      return [value];
    return [];
  }, [answers, step.id, step.selection]);

  const toggle = (optionValue: string) => {
    if (step.selection === "single") {
      setAnswers({ [step.id]: optionValue } as Partial<QuestionnaireAnswers>);
      return;
    }

    const current = (answers[step.id] as string[]) ?? [];
    const next = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    setAnswers({ [step.id]: next } as Partial<QuestionnaireAnswers>);
  };

  const showIcons = step.id === "goal";

  return (
    <div className="space-y-2.5">
      {step.options.map((option) => (
        <QuestionnaireOptionCard
          key={option.value}
          option={option}
          selected={selectedValues.includes(option.value)}
          onToggle={() => toggle(option.value)}
          showIcon={showIcons}
        />
      ))}

      {step.allowOther ? (
        <OtherField
          value={otherValue}
          onChange={(text) =>
            setAnswers({ [otherKey]: text } as Partial<QuestionnaireAnswers>)
          }
        />
      ) : null}
    </div>
  );
}

function ScheduleStep({
  answers,
  setAnswers,
}: {
  answers: QuestionnaireAnswers;
  setAnswers: (patch: Partial<QuestionnaireAnswers>) => void;
}) {
  const { days, times } = answers.schedule;

  const toggleDay = (day: string) => {
    const next = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];
    setAnswers({ schedule: { ...answers.schedule, days: next } });
  };

  const toggleTime = (time: string) => {
    const next = times.includes(time)
      ? times.filter((t) => t !== time)
      : [...times, time];
    setAnswers({ schedule: { ...answers.schedule, times: next } });
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2.5 text-[10px] font-black tracking-[0.12em] text-[#7a6fa3] uppercase">
          Days
        </h2>
        <div className="flex flex-wrap gap-2">
          {scheduleDays.map((day) => {
            const selected = days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "rounded-[12px] px-3.5 py-2 text-[13px] font-bold transition-colors",
                  selected
                    ? "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]"
                    : "border-2 border-[#ebe4f6] bg-white text-[#7a6fa3] shadow-[0_2px_0_#ebe4f6]",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-[10px] font-black tracking-[0.12em] text-[#7a6fa3] uppercase">
          Time of day
        </h2>
        <div className="space-y-2.5">
          {scheduleTimes.map((time) => (
            <QuestionnaireOptionCard
              key={time.value}
              option={{ value: time.value, label: time.label }}
              selected={times.includes(time.value)}
              onToggle={() => toggleTime(time.value)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function OtherField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[16px] border-2 border-[#ebe4f6] bg-white p-4 shadow-[0_3px_0_#ebe4f6]">
      <p className="mb-2 text-[10px] font-black tracking-[0.1em] text-[#b3a8d6] uppercase">
        Other
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer..."
        className="h-12 w-full rounded-[12px] border-2 border-[#ebe4f6] bg-[#f3effc] px-3.5 text-[14px] font-bold text-[#0f1220] placeholder:text-[#c3badb] focus:border-arc-purple-500 focus:outline-none"
      />
    </div>
  );
}
