"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
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
        <Button
          type="button"
          className="mt-6 h-14 w-full rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
          isDisabled={!canProceed}
          onPress={() => router.push(nextPath)}
        >
          Next
        </Button>
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
    <div className="space-y-3">
      {step.options.map((option) => (
        <QuestionnaireOptionCard
          key={option.value}
          option={option}
          selected={selectedValues.includes(option.value)}
          onToggle={() => toggle(option.value)}
          showIcon={showIcons}
        />
      ))}

      {step.allowOther && (
        <OtherField
          value={otherValue}
          onChange={(text) =>
            setAnswers({ [otherKey]: text } as Partial<QuestionnaireAnswers>)
          }
        />
      )}
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
        <h2 className="mb-3 text-arc-caption font-bold text-arc-navy-900">
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
                  "rounded-arc-sm px-4 py-2 text-arc-caption font-semibold transition-colors",
                  selected
                    ? "bg-arc-purple-100 text-arc-purple-600"
                    : "border border-arc-navy-200 bg-white text-arc-navy-500",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-arc-caption font-bold text-arc-navy-900">
          Time of day
        </h2>
        <div className="space-y-3">
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
    <div className="rounded-arc-md border border-arc-navy-200 bg-white p-4">
      <p className="mb-2 text-arc-body font-semibold text-arc-navy-900">
        Other
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer..."
        className="h-12 w-full rounded-arc-sm border border-arc-navy-200 bg-white px-4 text-arc-body text-arc-navy-900 placeholder:text-arc-navy-400 focus:border-arc-purple-500 focus:outline-none"
      />
    </div>
  );
}
