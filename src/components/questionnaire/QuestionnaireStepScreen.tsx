"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  asOptionalString,
  asSchedule,
  asSkillEvidence,
  asString,
  asStringArray,
  asTrackSelection,
  detectTimezone,
} from "@/schemas/questionnaire";
import { useQuestionnaireStore } from "@/store/useQuestionnaireStore";
import { QuestionnaireLayout } from "./QuestionnaireLayout";
import { QuestionnaireOptionCard } from "./QuestionnaireOptionCard";
import { QuestionnaireStepSkeleton } from "./QuestionnaireStepSkeleton";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

type QuestionnaireStepScreenProps = {
  stepNumber: number;
};

export default function QuestionnaireStepScreen({
  stepNumber,
}: QuestionnaireStepScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const changeGoal = searchParams.get("change") === "1";
  const fastTrack = searchParams.get("mode") === "fast_track";
  const changeQ = changeGoal
    ? "?change=1"
    : fastTrack
      ? "?mode=fast_track"
      : "";
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
        router.replace(`/questionnaire/${next}${changeQ}`);
      } else if (prev !== null) {
        router.replace(`/questionnaire/${prev}${changeQ}`);
      } else {
        router.replace(`/questionnaire/review${changeQ}`);
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
    changeQ,
  ]);

  if (hydrating && !step) {
    return <QuestionnaireStepSkeleton />;
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

  const canProceed = isStepComplete(step.id, answers, schema);
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
      ? `/questionnaire/review${changeQ}`
      : `/questionnaire/${nextVisible}${changeQ}`;

  const handleBack = () => {
    if (prevVisible === null) router.push("/questionnaire");
    else router.push(`/questionnaire/${prevVisible}${changeQ}`);
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
      subtitle={
        (changeGoal || fastTrack) && step.id === "goal"
          ? changeGoal
            ? "Pick a catalog role that has a learning path, then rebuild."
            : "Confirm or change your goal — prior answers stay editable."
          : step.subtitle
      }
      footer={
        <div className="space-y-2">
          {changeGoal ? (
            <p className="text-center text-[11px] font-bold text-arc-purple-500">
              Change goal · save through to rebuild path
            </p>
          ) : fastTrack ? (
            <p className="text-center text-[11px] font-bold text-arc-purple-500">
              Fast-track · answers pre-filled from your last path
            </p>
          ) : null}
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
      <StepBody step={step} answers={answers} setAnswers={setAnswers} />
    </QuestionnaireLayout>
  );
}

type StepBodyProps = {
  step: QuestionnaireStepConfig;
  answers: QuestionnaireAnswers;
  setAnswers: (patch: Partial<QuestionnaireAnswers>) => void;
};

function StepBody({ step, answers, setAnswers }: StepBodyProps) {
  switch (step.uiKind) {
    case "schedule":
      return (
        <ScheduleStep step={step} answers={answers} setAnswers={setAnswers} />
      );
    case "track-select":
      return (
        <TrackSelectStep
          step={step}
          answers={answers}
          setAnswers={setAnswers}
        />
      );
    case "skill-evidence":
      return (
        <SkillEvidenceStep
          step={step}
          answers={answers}
          setAnswers={setAnswers}
        />
      );
    case "capacity":
      return (
        <CompoundSingleStep
          step={step}
          answers={answers}
          setAnswers={setAnswers}
          primaryHeading="Weekly time"
          secondaryHeading="Session length"
          secondaryKey="preferredSessionMinutes"
          secondaryOptions={step.sessionOptions}
        />
      );
    case "outcome":
      return (
        <CompoundSingleStep
          step={step}
          answers={answers}
          setAnswers={setAnswers}
          primaryHeading="Target outcome"
          secondaryHeading="Deadline"
          secondaryKey="deadline"
          secondaryOptions={step.secondaryOptions}
        />
      );
    case "context":
      return (
        <CompoundSingleStep
          step={step}
          answers={answers}
          setAnswers={setAnswers}
          primaryHeading="Your situation"
          secondaryHeading="How often do you use this subject?"
          secondaryKey="useFrequency"
          secondaryOptions={step.secondaryOptions}
        />
      );
    case "confidence-barriers":
      return (
        <ConfidenceBarriersStep
          step={step}
          answers={answers}
          setAnswers={setAnswers}
        />
      );
    default:
      return (
        <StandardStep step={step} answers={answers} setAnswers={setAnswers} />
      );
  }
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2.5 text-[10px] font-black tracking-[0.12em] text-[#7a6fa3] uppercase">
      {children}
    </h2>
  );
}

/** track-select: multi = flat chips (first=primary); single = primary + optional secondary. */
function TrackSelectStep({ step, answers, setAnswers }: StepBodyProps) {
  const [query, setQuery] = useState("");
  const track = asTrackSelection(answers, step.id);
  const isMulti = step.selection === "multi";

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return step.options;
    return step.options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [query, step.options]);

  const orderedPicks = useMemo(() => {
    if (!track.primary) return [] as string[];
    return [track.primary, ...track.secondary.filter((s) => s !== track.primary)];
  }, [track.primary, track.secondary]);

  const setPrimary = (value: string) => {
    const primary = track.primary === value ? "" : value;
    setAnswers({
      [step.id]: {
        primary,
        secondary: track.secondary.filter((s) => s !== primary),
      },
    });
  };

  const toggleSecondary = (value: string) => {
    const next = track.secondary.includes(value)
      ? track.secondary.filter((s) => s !== value)
      : [...track.secondary, value];
    setAnswers({ [step.id]: { primary: track.primary, secondary: next } });
  };

  /** Flat multi: toggle in ordered list; first pick = primary, rest = secondary. */
  const toggleMulti = (value: string) => {
    let next: string[];
    if (orderedPicks.includes(value)) {
      next = orderedPicks.filter((v) => v !== value);
    } else {
      next = [...orderedPicks, value];
    }
    const primary = next[0] ?? "";
    const secondary = next.slice(1);
    setAnswers({ [step.id]: { primary, secondary } });
  };

  const secondaryChoices = step.options.filter(
    (o) => o.value !== track.primary,
  );

  const searchInput =
    step.options.length > 4 ? (
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tracks…"
        className="mb-2.5 h-11 w-full rounded-[14px] border-2 border-[#ebe4f6] bg-white px-3.5 text-[13px] font-semibold text-[#0f1220] placeholder:text-[#c3badb] shadow-[0_3px_0_#ebe4f6] focus:border-arc-purple-500 focus:outline-none"
        aria-label="Search tracks"
      />
    ) : null;

  if (isMulti) {
    return (
      <div className="space-y-6">
        <section>
          <SectionHeading>Select all that apply</SectionHeading>
          <p className="mb-2.5 text-[12px] font-semibold text-[#7a6fa3]">
            First pick becomes your primary track.
          </p>
          {searchInput}
          <div className="space-y-2.5">
            {filteredOptions.length === 0 ? (
              <p className="rounded-[16px] border-2 border-dashed border-[#ebe4f6] bg-white/70 px-4 py-6 text-center text-[13px] font-semibold text-[#7a6fa3]">
                No tracks match — try another search.
              </p>
            ) : (
              filteredOptions.map((option) => (
                <QuestionnaireOptionCard
                  key={option.value}
                  option={option}
                  selected={orderedPicks.includes(option.value)}
                  onToggle={() => toggleMulti(option.value)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading>Primary track</SectionHeading>
        {searchInput}
        <div className="space-y-2.5">
          {filteredOptions.length === 0 ? (
            <p className="rounded-[16px] border-2 border-dashed border-[#ebe4f6] bg-white/70 px-4 py-6 text-center text-[13px] font-semibold text-[#7a6fa3]">
              No tracks match — try another search.
            </p>
          ) : (
            filteredOptions.map((option) => (
              <QuestionnaireOptionCard
                key={option.value}
                option={option}
                selected={track.primary === option.value}
                onToggle={() => setPrimary(option.value)}
              />
            ))
          )}
        </div>
      </section>

      {track.primary && secondaryChoices.length ? (
        <section>
          <SectionHeading>Secondary interests (optional)</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {secondaryChoices.map((option) => {
              const selected = track.secondary.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleSecondary(option.value)}
                  className={cn(
                    "rounded-[12px] px-3.5 py-2 text-[13px] font-bold transition-colors",
                    selected
                      ? "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]"
                      : "border-2 border-[#ebe4f6] bg-white text-[#7a6fa3] shadow-[0_2px_0_#ebe4f6]",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** skill-evidence: pick skills, then rate exposure per selected skill. */
function SkillEvidenceStep({ step, answers, setAnswers }: StepBodyProps) {
  const evidence = asSkillEvidence(answers, step.id);
  const otherKey = `${step.id}Other`;
  const otherValue = asOptionalString(answers, otherKey) ?? "";
  const defaultExposure = step.exposureOptions[0]?.value ?? "heard_of";

  const toggleSkill = (skillSlug: string) => {
    const next = evidence.some((e) => e.skillSlug === skillSlug)
      ? evidence.filter((e) => e.skillSlug !== skillSlug)
      : [...evidence, { skillSlug, exposureLevel: defaultExposure }];
    setAnswers({ [step.id]: next });
  };

  const setExposure = (skillSlug: string, exposureLevel: string) => {
    setAnswers({
      [step.id]: evidence.map((e) =>
        e.skillSlug === skillSlug ? { ...e, exposureLevel } : e,
      ),
    });
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading>Skills you already have</SectionHeading>
        <div className="space-y-2.5">
          {step.options.map((option) => (
            <QuestionnaireOptionCard
              key={option.value}
              option={option}
              selected={evidence.some((e) => e.skillSlug === option.value)}
              onToggle={() => toggleSkill(option.value)}
            />
          ))}
        </div>
      </section>

      {evidence.length ? (
        <section>
          <SectionHeading>How independently can you use each?</SectionHeading>
          <div className="space-y-3">
            {evidence.map((item) => (
              <div
                key={item.skillSlug}
                className="rounded-[16px] border-2 border-[#ebe4f6] bg-white p-3.5 shadow-[0_3px_0_#ebe4f6]"
              >
                <p className="mb-2 text-[13px] font-bold text-[#0f1220]">
                  {step.options.find((o) => o.value === item.skillSlug)
                    ?.label ?? item.skillSlug}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step.exposureOptions.map((exp) => {
                    const selected = item.exposureLevel === exp.value;
                    return (
                      <button
                        key={exp.value}
                        type="button"
                        onClick={() => setExposure(item.skillSlug, exp.value)}
                        className={cn(
                          "rounded-[12px] px-3 py-1.5 text-[12px] font-bold transition-colors",
                          selected
                            ? "bg-arc-purple-500 text-white shadow-[0_2px_0_#4b2fd6]"
                            : "border-2 border-[#ebe4f6] bg-white text-[#7a6fa3]",
                        )}
                      >
                        {exp.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-[16px] border-2 border-dashed border-[#ebe4f6] bg-white/70 px-4 py-4 text-center text-[13px] font-semibold text-[#7a6fa3]">
          No skills yet? That&apos;s fine — we&apos;ll start from foundations.
        </p>
      )}

      {step.allowOther ? (
        <OtherField
          value={otherValue}
          onChange={(text) => setAnswers({ [otherKey]: text })}
          placeholder="Another skill…"
        />
      ) : null}
    </div>
  );
}

/** capacity / outcome / context: single primary answer + single secondary answer. */
function CompoundSingleStep({
  step,
  answers,
  setAnswers,
  primaryHeading,
  secondaryHeading,
  secondaryKey,
  secondaryOptions,
}: StepBodyProps & {
  primaryHeading: string;
  secondaryHeading: string;
  secondaryKey: string;
  secondaryOptions: QuestionnaireStepConfig["secondaryOptions"];
}) {
  const otherKey = `${step.id}Other`;
  const otherValue = asOptionalString(answers, otherKey) ?? "";
  const primary = asString(answers, step.id);
  const secondary = asString(answers, secondaryKey);

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading>{primaryHeading}</SectionHeading>
        <div className="space-y-2.5">
          {step.options.map((option) => (
            <QuestionnaireOptionCard
              key={option.value}
              option={option}
              selected={primary === option.value}
              onToggle={() =>
                setAnswers({
                  [step.id]: primary === option.value ? "" : option.value,
                })
              }
            />
          ))}
        </div>
        {step.allowOther ? (
          <div className="mt-2.5">
            <OtherField
              value={otherValue}
              onChange={(text) => setAnswers({ [otherKey]: text })}
            />
          </div>
        ) : null}
      </section>

      <section>
        <SectionHeading>{secondaryHeading}</SectionHeading>
        <div className="flex flex-wrap gap-2">
          {secondaryOptions.map((option) => {
            const selected = secondary === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setAnswers({
                    [secondaryKey]: selected ? "" : option.value,
                  })
                }
                className={cn(
                  "rounded-[12px] px-3.5 py-2 text-[13px] font-bold transition-colors",
                  selected
                    ? "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]"
                    : "border-2 border-[#ebe4f6] bg-white text-[#7a6fa3] shadow-[0_2px_0_#ebe4f6]",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/** confidence-barriers: single confidence + multi barriers. */
function ConfidenceBarriersStep({ step, answers, setAnswers }: StepBodyProps) {
  const otherKey = `${step.id}Other`;
  const otherValue = asOptionalString(answers, otherKey) ?? "";
  const confidence = asString(answers, "confidence");
  const barriers = asStringArray(answers, step.id);

  const toggleBarrier = (value: string) => {
    const next = barriers.includes(value)
      ? barriers.filter((b) => b !== value)
      : [...barriers, value];
    setAnswers({ [step.id]: next });
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading>Your confidence</SectionHeading>
        <div className="space-y-2.5">
          {step.options.map((option) => (
            <QuestionnaireOptionCard
              key={option.value}
              option={option}
              selected={confidence === option.value}
              onToggle={() =>
                setAnswers({
                  confidence: confidence === option.value ? "" : option.value,
                })
              }
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading>What usually gets in the way?</SectionHeading>
        <div className="flex flex-wrap gap-2">
          {step.secondaryOptions.map((option) => {
            const selected = barriers.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleBarrier(option.value)}
                className={cn(
                  "rounded-[12px] px-3.5 py-2 text-[13px] font-bold transition-colors",
                  selected
                    ? "bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]"
                    : "border-2 border-[#ebe4f6] bg-white text-[#7a6fa3] shadow-[0_2px_0_#ebe4f6]",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {step.allowOther ? (
          <div className="mt-2.5">
            <OtherField
              value={otherValue}
              onChange={(text) => setAnswers({ [otherKey]: text })}
              placeholder="Another barrier…"
            />
          </div>
        ) : null}
      </section>
    </div>
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
  const [query, setQuery] = useState("");
  const otherKey = `${step.id}Other`;
  const otherValue = asOptionalString(answers, otherKey) ?? "";
  const isGoalStep = step.id === "goal";

  const selectedValues = useMemo(() => {
    // Coerce string|array so UI stays checked after hydrate.
    return asStringArray(answers, step.id);
  }, [answers, step.id]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !isGoalStep) return step.options;
    return step.options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [isGoalStep, query, step.options]);

  const toggle = (optionValue: string) => {
    // Goal step always stores string[] — backend upsert + recipes expect arrays.
    // (Schema may say single after AI rewrite; UI still multi-toggle.)
    if (step.selection === "single" && !isGoalStep) {
      setAnswers({ [step.id]: optionValue });
      return;
    }

    const current = asStringArray(answers, step.id);
    const next = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : step.selection === "single"
        ? [optionValue]
        : [...current, optionValue];
    setAnswers({ [step.id]: next });
  };

  const showIcons = step.options.some((o) => o.icon && o.iconClassName);

  return (
    <motion.div
      className="space-y-2.5"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.045 } },
      }}
    >
      {isGoalStep && step.options.length > 4 ? (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: softSpring },
          }}
          className="mb-1"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles…"
            className="h-11 w-full rounded-[14px] border-2 border-[#ebe4f6] bg-white px-3.5 text-[13px] font-semibold text-[#0f1220] placeholder:text-[#c3badb] shadow-[0_3px_0_#ebe4f6] focus:border-arc-purple-500 focus:outline-none"
            aria-label="Search roles"
          />
        </motion.div>
      ) : null}

      {filteredOptions.length === 0 ? (
        <p className="rounded-[16px] border-2 border-dashed border-[#ebe4f6] bg-white/70 px-4 py-6 text-center text-[13px] font-semibold text-[#7a6fa3]">
          No roles match — try another search or add your own below.
        </p>
      ) : (
        filteredOptions.map((option) => (
          <motion.div
            key={option.value}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: softSpring },
            }}
          >
            <QuestionnaireOptionCard
              option={option}
              selected={selectedValues.includes(option.value)}
              onToggle={() => toggle(option.value)}
              showIcon={showIcons}
            />
          </motion.div>
        ))
      )}

      {step.allowOther ? (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: softSpring },
          }}
        >
          <OtherField
            value={otherValue}
            onChange={(text) => setAnswers({ [otherKey]: text })}
            label={isGoalStep ? "Something else" : "Other"}
            placeholder={
              isGoalStep
                ? "Type a role that isn’t listed…"
                : "Write your answer..."
            }
          />
        </motion.div>
      ) : null}
    </motion.div>
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
  const schedule = asSchedule(answers, step.id);
  const { times } = schedule;
  const timezone = schedule.timezone ?? detectTimezone();

  const toggleTime = (time: string) => {
    const next = times.includes(time)
      ? times.filter((t) => t !== time)
      : [...times, time];
    setAnswers({
      [step.id]: {
        // Days retired from intake — keep empty for schema compat.
        days: [],
        times: next,
        ...(timezone ? { timezone } : {}),
      },
    });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-[10px] font-black tracking-[0.12em] text-[#7a6fa3] uppercase">
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
    </div>
  );
}

function OtherField({
  value,
  onChange,
  label = "Other",
  placeholder = "Write your answer...",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}) {
  return (
    <div className="rounded-[16px] border-2 border-[#ebe4f6] bg-white p-4 shadow-[0_3px_0_#ebe4f6]">
      <p className="mb-2 text-[10px] font-black tracking-[0.1em] text-[#b3a8d6] uppercase">
        {label}
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-[12px] border-2 border-[#ebe4f6] bg-[#f3effc] px-3.5 text-[14px] font-bold text-[#0f1220] placeholder:text-[#c3badb] focus:border-arc-purple-500 focus:outline-none"
      />
    </div>
  );
}
