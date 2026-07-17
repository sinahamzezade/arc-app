"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { BackButton } from "@/components/BackButton";
import { Pencil, Route, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import {
  authCtaClassName,
  authGhostLinkClassName,
} from "@/components/onboarding/AuthShell";
import { Button } from "@/components/ui";
import { questionnaireApi } from "@/lib/api/questionnaire";
import { meApi } from "@/lib/api/auth";
import type { ProfilePreviewDto } from "@/lib/api/types";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { formatAnswerValue } from "@/lib/questionnaire/format-answers";
import { useHydrateQuestionnaire } from "@/lib/questionnaire/api-sync";
import { getReviewItems } from "@/lib/questionnaire/steps";
import { useQuestionnaireStore } from "@/store/useQuestionnaireStore";
import { QuestionnaireReviewSkeleton } from "./QuestionnaireReviewSkeleton";

export default function QuestionnaireReviewScreen() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const { answers, schema, hydrated } = useQuestionnaireStore();
  const { loading, error: hydrateError } = useHydrateQuestionnaire();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProfilePreviewDto | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const reviewItems = getReviewItems(schema, answers);
  const visibleLast =
    reviewItems[reviewItems.length - 1]?.stepNumber ?? schema?.totalSteps ?? 10;
  const isRebuild = session?.profile?.questionnaireStatus === "completed";

  useEffect(() => {
    if (!hydrated || !schema || !session?.accessToken) return;
    let cancelled = false;
    setPreviewLoading(true);
    void (async () => {
      try {
        const res = await questionnaireApi.profilePreview(
          answers,
          session.accessToken,
        );
        if (!cancelled) setPreview(res.preview);
      } catch {
        // Preview is best-effort (e.g. PROFILE_PREVIEW_INCOMPLETE) — answers list still works.
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, schema, session?.accessToken]);

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await questionnaireApi.submit(
        answers,
        session?.accessToken,
        schema?.schemaVersion,
      );
      try {
        const me = await meApi.get();
        await update({ profile: me.profile });
      } catch {
        if (session?.profile) {
          await update({
            profile: {
              ...session.profile,
              questionnaireStatus: "completed",
              questionnaireCompletedAt: new Date().toISOString(),
            },
          });
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
      const placementRequired =
        result.placement?.required ??
        result.learnerProfile?.diagnosticRequired ??
        false;
      // Prefer path so user sees Roadmap Generator result (polls while queued)
      if (result.roadmap?.jobId) {
        router.push(placementRequired ? "/path?placement=required" : "/path");
      } else {
        router.push("/home");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(messageForCode(err.code, err.message));
      } else {
        setError("Could not build roadmap");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !schema) {
    return <QuestionnaireReviewSkeleton />;
  }

  if (!schema) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[#f3effc] px-6 text-center">
        <p className="text-[14px] font-bold text-[#7a6fa3]">
          {hydrateError || "Could not load review"}
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

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[-36px] h-48 w-48 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-20px] h-28 w-28 rounded-full bg-[#ffc928]/18 blur-3xl"
        />

        <BackButton />

        <div className="relative mt-4">
          <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
            Final check
          </p>
          <h1 className="mt-1.5 font-display text-[30px] leading-[0.95] font-bold tracking-[-0.03em]">
            Review your
            <br />
            answers
          </h1>
          <p className="mt-2.5 max-w-[20rem] text-[13px] leading-snug font-bold text-white/50">
            Edit anything before we build your roadmap.
          </p>
        </div>
      </section>

      <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-[#f3effc]">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-4">
          <ProfilePreviewPanel preview={preview} loading={previewLoading} />
          <ul className="space-y-2.5">
          {reviewItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/questionnaire/${item.stepNumber}`)
                  }
                  className="flex w-full items-start gap-3 rounded-[16px] border-2 border-[#ebe4f6] bg-white px-3.5 py-3.5 text-left shadow-[0_3px_0_#ebe4f6]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-arc-purple-500/10 text-arc-purple-500">
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-black tracking-[0.1em] text-[#b3a8d6] uppercase">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[14px] leading-snug font-bold text-[#0f1220]">
                      {formatAnswerValue(schema, item.key, answers) || "—"}
                    </span>
                  </span>
                  <Pencil
                    className="mt-1 h-4 w-4 shrink-0 text-arc-purple-500"
                    strokeWidth={2.5}
                  />
                </button>
              </li>
            );
          })}
          </ul>
        </div>

        <div className="shrink-0 space-y-2 border-t border-[#ebe4f6]/80 bg-[#f3effc]/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] backdrop-blur-sm">
          {error ? (
            <p className="text-center text-[12px] font-bold text-red-500">
              {error}
            </p>
          ) : null}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              className={authCtaClassName}
              isDisabled={submitting}
              onPress={() => {
                void handleSubmit();
              }}
            >
              {submitting
                ? "Building…"
                : isRebuild
                  ? "Looks good — rebuild path"
                  : "Looks good — build roadmap"}
            </Button>
          </motion.div>
          <button
            type="button"
            className={`w-full py-2 text-center text-[13px] ${authGhostLinkClassName}`}
            onClick={() => router.push("/questionnaire/1")}
          >
            Edit from start
          </button>
        </div>
      </div>
    </div>
  );
}

const STAGE_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Medium",
  3: "Pro",
  4: "Advanced",
  5: "Job-ready Specialist",
};

const STAGE_COUNT = 5;

function ProfilePreviewPanel({
  preview,
  loading,
}: {
  preview: ProfilePreviewDto | null;
  loading: boolean;
}) {
  if (loading && !preview) {
    return (
      <div className="mb-4 h-52 animate-pulse rounded-[20px] border-2 border-[#ebe4f6] bg-white/70 shadow-[0_3px_0_#ebe4f6]" />
    );
  }
  if (!preview) return null;

  const here = clampStage(preview.provisionalStage);
  const goal = clampStage(preview.targetStage);
  const confidence = preview.stageConfidence.replace(/_/g, " ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-white shadow-[0_3px_0_#ebe4f6]"
    >
      <div className="relative bg-[#0f1220] px-4 pt-3.5 pb-4 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 right-[-24px] h-28 w-28 rounded-full bg-arc-purple-500/45 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-16px] h-20 w-20 rounded-full bg-[#ffc928]/20 blur-2xl"
        />

        <div className="relative flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-white/10 text-[#ffc928]">
            <Route className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Learner profile
            </p>
            <p className="text-[11px] font-bold text-white/45">
              Estimate — confirmed after placement if needed
            </p>
          </div>
        </div>

        <StageRail here={here} goal={goal} />
      </div>

      <div className="space-y-3.5 px-4 py-3.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
          <StageStat
            eyebrow="You are here"
            stage={here}
            detail={`${STAGE_LABELS[here] ?? "Learner"} · ${confidence} confidence`}
            tone="here"
          />
          <div
            aria-hidden
            className="flex items-center justify-center self-center text-[12px] font-black text-[#c3badb]"
          >
            →
          </div>
          <StageStat
            eyebrow="Goal"
            stage={goal}
            detail={STAGE_LABELS[goal] ?? "Target"}
            tone="goal"
          />
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-black tracking-widest text-arc-lavender-500 uppercase">
            Your pace
          </p>
          <div className="flex flex-wrap gap-1.5">
            <PaceChip label={preview.paceClass.replace(/_/g, " ")} />
            <PaceChip
              label={`~${preview.weeklyEffectiveMinutes} effective min/wk`}
            />
            <PaceChip label={`${preview.preferredSessionMinutes} min sessions`} />
          </div>
        </div>

        {preview.skillMap.length ? (
          <div>
            <p className="mb-1.5 text-[10px] font-black tracking-widest text-arc-lavender-500 uppercase">
              Skill map
            </p>
            <div className="flex flex-wrap gap-1.5">
              {preview.skillMap.map((s) => (
                <span
                  key={s.skillSlug}
                  className="rounded-arc-xs bg-[#f3effc] px-2.5 py-1 text-[11px] font-bold text-[#7a6fa3]"
                >
                  {s.skillSlug} · S{s.provisionalStage}
                  {STAGE_LABELS[s.provisionalStage]
                    ? ` · ${shortStageLabel(STAGE_LABELS[s.provisionalStage])}`
                    : ""}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {preview.diagnosticRequired ? (
          <div className="flex items-start gap-2.5 rounded-arc-sm bg-[#fff7e0] px-3 py-2.5">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-[#b0891a]"
              strokeWidth={2.4}
              aria-hidden
            />
            <p className="text-[12px] leading-snug font-bold text-[#8a6d1a]">
              A short placement check will confirm your level before we skip
              content.
            </p>
          </div>
        ) : null}

        {preview.feasibility?.message ? (
          <p
            className={
              preview.feasibility.state === "feasible"
                ? "text-[12px] leading-snug font-bold text-[#3e9a63]"
                : "text-[12px] leading-snug font-bold text-[#b0731d]"
            }
          >
            {preview.feasibility.message}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

function clampStage(stage: number) {
  return Math.min(STAGE_COUNT, Math.max(1, Math.round(stage || 1)));
}

function shortStageLabel(label: string) {
  return label.replace(" Specialist", "");
}

function StageRail({ here, goal }: { here: number; goal: number }) {
  const fillTo = Math.max(here, goal);

  return (
    <div
      className="mt-4"
      aria-label={`Stage ${here} of ${STAGE_COUNT}, goal stage ${goal}`}
    >
      <ol className="flex items-start">
        {Array.from({ length: STAGE_COUNT }, (_, i) => {
          const stage = i + 1;
          const isHere = stage === here;
          const isGoal = stage === goal && stage !== here;
          const reached = stage <= fillTo;
          const segmentFilled = stage < fillTo;

          return (
            <li
              key={stage}
              className={
                stage < STAGE_COUNT
                  ? "flex min-w-0 flex-1 flex-col items-stretch"
                  : "flex w-6 shrink-0 flex-col items-center"
              }
            >
              <div className="flex items-center">
                <span
                  className={[
                    "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-colors duration-200",
                    isHere
                      ? "bg-arc-purple-500 text-white shadow-[0_0_0_3px_rgba(124,92,255,0.35)]"
                      : isGoal
                        ? "bg-[#ffc928] text-[#0f1220] shadow-[0_0_0_3px_rgba(255,201,40,0.28)]"
                        : reached
                          ? "bg-white/25 text-white"
                          : "bg-white/10 text-white/40",
                  ].join(" ")}
                >
                  {stage}
                </span>
                {stage < STAGE_COUNT ? (
                  <span
                    className={[
                      "mx-1 h-1 min-w-0 flex-1 rounded-full transition-colors duration-200",
                      segmentFilled
                        ? "bg-linear-to-r from-arc-purple-500 to-[#ffc928]"
                        : "bg-white/10",
                    ].join(" ")}
                  />
                ) : null}
              </div>
              <span
                className={[
                  "mt-1.5 w-6 text-center text-[9px] font-black tracking-[0.04em] uppercase",
                  isHere
                    ? "text-arc-purple-200"
                    : isGoal
                      ? "text-[#ffc928]"
                      : "text-transparent",
                ].join(" ")}
              >
                {isHere ? "Here" : isGoal ? "Goal" : "·"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StageStat({
  eyebrow,
  stage,
  detail,
  tone,
}: {
  eyebrow: string;
  stage: number;
  detail: string;
  tone: "here" | "goal";
}) {
  return (
    <div
      className={
        tone === "here"
          ? "rounded-arc-sm bg-arc-purple-500/8 px-3 py-2.5"
          : "rounded-arc-sm bg-[#fff7e0] px-3 py-2.5"
      }
    >
      <p
        className={
          tone === "here"
            ? "text-[9px] font-black tracking-widest text-arc-purple-500 uppercase"
            : "text-[9px] font-black tracking-widest text-[#b0891a] uppercase"
        }
      >
        {eyebrow}
      </p>
      <p className="mt-0.5 font-display text-[18px] leading-none font-bold tracking-[-0.03em] text-[#0f1220]">
        Stage {stage}
      </p>
      <p className="mt-1 text-[11px] leading-snug font-bold text-[#7a6fa3]">
        {detail}
      </p>
    </div>
  );
}

function PaceChip({ label }: { label: string }) {
  return (
    <span className="rounded-arc-xs border border-[#ebe4f6] bg-[#faf8ff] px-2.5 py-1 text-[11px] font-bold capitalize text-[#0f1220]">
      {label}
    </span>
  );
}
