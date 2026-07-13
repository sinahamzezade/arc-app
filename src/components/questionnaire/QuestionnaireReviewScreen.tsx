"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { BackButton } from "@/components/BackButton";
import { Pencil } from "lucide-react";
import { motion } from "motion/react";
import {
  authCtaClassName,
  authGhostLinkClassName,
} from "@/components/onboarding/AuthShell";
import { Button } from "@/components/ui";
import { questionnaireApi } from "@/lib/api/questionnaire";
import { meApi } from "@/lib/api/auth";
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
  const { answers, schema } = useQuestionnaireStore();
  const { loading, error: hydrateError } = useHydrateQuestionnaire();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reviewItems = getReviewItems(schema, answers);
  const visibleLast =
    reviewItems[reviewItems.length - 1]?.stepNumber ?? schema?.totalSteps ?? 10;
  const isRebuild =
    session?.profile?.questionnaireStatus === "completed";

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await questionnaireApi.submit(
        answers,
        session?.accessToken,
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
      // Prefer path so user sees Roadmap Generator result (polls while queued)
      if (result.roadmap?.jobId) {
        router.push(`/path`);
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
        <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pt-5 pb-4">
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
