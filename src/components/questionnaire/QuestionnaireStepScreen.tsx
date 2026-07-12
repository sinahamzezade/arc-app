"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { authCtaClassName } from "@/components/onboarding/AuthShell";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { isStepComplete } from "@/lib/questionnaire/format-answers";
import {
  saveQuestionnaireDraft,
  useHydrateQuestionnaire,
} from "@/lib/questionnaire/api-sync";
import {
  getAdjacentVisibleStep,
  getVisibleProgress,
  isStepVisible,
} from "@/lib/questionnaire/branching";
import {
  getStepByNumber,
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
  const { data: session } = useSession();
  const { answers, setAnswers, schema } = useQuestionnaireStore();
  const { loading: hydrating, error: hydrateError } = useHydrateQuestionnaire();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const step = getStepByNumber(schema, stepNumber);
  const catalogTotal = schema?.totalSteps ?? 10;
  const progress = getVisibleProgress(schema, answers, stepNumber);
  const progressTotal = progress.total || catalogTotal;
  const progressStep = progress.total ? progress.index + 1 : stepNumber;

  useEffect(() => {
    if (hydrating) return;
    if (hydrateError === "Sign in to continue") {
      router.replace("/login");
      return;
    }
    if (!schema) return;
    if (stepNumber < 1 || stepNumber > catalogTotal || !step) {
      router.replace("/questionnaire");
      return;
    }
    // Question Engine branching: skip hidden steps
    if (!isStepVisible(step, answers)) {
      const next = getAdjacentVisibleStep(schema, answers, stepNumber, "next");
      const prev = getAdjacentVisibleStep(schema, answers, stepNumber, "prev");
      if (next !== null) {
        router.replace(`/questionnaire/${next}`);
      } else if (prev !== null) {
        router.replace(`/questionnaire/${prev}`);
      } else {
        router.replace("/questionnaire/review");
      }
    }
  }, [
    schema,
    step,
    stepNumber,
    catalogTotal,
    answers,
    router,
    hydrating,
    hydrateError,
  ]);

  if (hydrating && !step) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#f3effc] text-[13px] font-bold text-[#7a6fa3]">
        Loading questions…
      </div>
    );
  }

  if (!step) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[#f3effc] px-6 text-center">
        <p className="text-[14px] font-bold text-[#7a6fa3]">
          {hydrateError || "Could not load this step"}
        </p>
        <Button
          type="button"
          className={authCtaClassName}
          onPress={() =>
            router.replace(
              hydrateError === "Sign in to continue"
                ? "/login"
                : "/questionnaire",
            )
          }
        >
          {hydrateError === "Sign in to continue" ? "Sign in" : "Back"}
        </Button>
      </div>
    );
  }

  const canProceed = isStepComplete(step.id, answers);
  const nextVisible = getAdjacentVisibleStep(
    schema,
    answers,
    stepNumber,
    "next",
  );
  const prevVisible = getAdjacentVisibleStep(
    schema,
    answers,
    stepNumber,
    "prev",
  );
  const nextPath =
    nextVisible === null
      ? "/questionnaire/review"
      : `/questionnaire/${nextVisible}`;

  const handleBack = () => {
    if (prevVisible === null) router.push("/questionnaire");
    else router.push(`/questionnaire/${prevVisible}`);
  };

  const handleNext = async () => {
    if (!canProceed || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      await saveQuestionnaireDraft(answers, session?.accessToken);
      router.push(nextPath);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(messageForCode(err.code, err.message));
      } else {
        setSaveError("Could not save progress");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <QuestionnaireLayout
      stepNumber={progressStep}
      totalSteps={progressTotal}
      onBack={handleBack}
      title={step.title}
      subtitle={step.subtitle}
      footer={
        <div className="space-y-2">
          {saveError ? (
            <p className="text-center text-[12px] font-bold text-red-500">
              {saveError}
            </p>
          ) : null}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              className={cn(
                authCtaClassName,
                (!canProceed || hydrating) && "opacity-45",
              )}
              isDisabled={!canProceed || saving || hydrating}
              onPress={() => {
                void handleNext();
              }}
            >
              {saving ? "Saving…" : "Next"}
            </Button>
          </motion.div>
        </div>
      }
    >
      {step.uiKind === "schedule" ? (
        <ScheduleStep
          step={step}
          answers={answers}
          setAnswers={setAnswers}
        />
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
    const value = answers[step.id as keyof QuestionnaireAnswers];
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

    const current =
      (answers[step.id as keyof QuestionnaireAnswers] as string[]) ?? [];
    const next = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    setAnswers({ [step.id]: next } as Partial<QuestionnaireAnswers>);
  };

  const showIcons = step.options.some((o) => o.icon && o.iconClassName);

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
  step,
  answers,
  setAnswers,
}: {
  step: QuestionnaireStepConfig;
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
          {step.scheduleDays.map((day) => {
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
          {step.scheduleTimes.map((time) => (
            <QuestionnaireOptionCard
              key={time.value}
              option={time}
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
