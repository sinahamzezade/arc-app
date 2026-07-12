"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lightbulb } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { lessonsApi } from "@/lib/api/lessons";
import { InlineMarkdown } from "@/lib/lesson/inline-markdown";
import { useEnsureLessonAttempt } from "@/hooks/useEnsureLessonAttempt";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { useLessonStore } from "@/store/useLessonStore";
import {
  LessonOptionCard,
  LessonPrimaryButton,
  LessonShell,
} from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";

export default function LessonPracticeScreen({
  lessonId,
}: {
  lessonId: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const selected = useLessonStore((s) => s.practiceOptionId);
  const setPracticeOption = useLessonStore((s) => s.setPracticeOption);
  const practiceReveal = useLessonStore((s) => s.practiceReveal);
  const setPracticeReveal = useLessonStore((s) => s.setPracticeReveal);
  const attemptId = useEnsureLessonAttempt(lessonId);
  const practiceHintUsed = useLessonStore((s) => s.practiceHintUsed);
  const setPracticeHintUsed = useLessonStore((s) => s.setPracticeHintUsed);
  const [checking, setChecking] = useState(false);

  const revealed = practiceReveal.correctOptionId != null;

  const checkMutation = useMutation({
    mutationFn: (optionId: string) => {
      const id = useLessonStore.getState().attemptId;
      if (!id) throw new Error("Start the lesson first");
      return lessonsApi.checkPractice(
        lessonId,
        {
          optionId,
          attemptId: id,
          hintUsed: practiceHintUsed,
        },
        session?.accessToken,
      );
    },
    onSuccess: (res) => {
      setPracticeReveal({
        correctOptionId: res.correctOptionId,
        feedback: res.feedback,
        correct: res.correct,
      });
    },
    onSettled: () => setChecking(false),
  });

  if (isLoading) {
    return (
      <LessonShell lessonId={lessonId} stepLabel="Loading" progress={0} showArlo={false}>
        <p className="text-arc-lavender-600">Loading practice…</p>
      </LessonShell>
    );
  }

  if (isError || !lesson) {
    return (
      <LessonLoadState
        message={error?.message ?? "Lesson not found."}
        onRetry={isError ? () => refetch() : undefined}
      />
    );
  }

  const practice = lesson.practice;
  const isCorrect = practiceReveal.correct === true;

  return (
    <LessonShell
      lessonId={lesson.id}
      stepLabel="Practice"
      progress={58}
      onBack={() => router.push(`/learn/${lesson.id}/content`)}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col"
      >
        <p className="text-[11px] font-bold tracking-[0.06em] text-arc-purple-500 uppercase">
          Hands-on
        </p>
        <h1 className="mt-1 font-display text-[24px] leading-tight font-bold tracking-[-0.03em] text-[#2b1b57]">
          <InlineMarkdown text={practice.prompt} />
        </h1>

        <div className="mt-5 space-y-2.5">
          {practice.options.map((option) => (
            <LessonOptionCard
              key={option.id}
              label={option.label}
              selected={selected === option.id}
              correct={option.id === practiceReveal.correctOptionId}
              revealed={revealed}
              onSelect={() => {
                if (revealed) return;
                setPracticeOption(option.id);
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className="mt-4 flex w-full items-start gap-2 rounded-2xl bg-[#fff8e8] px-3.5 py-3 text-left text-[13px] font-semibold text-[#8a6a1e]"
          onClick={() => setPracticeHintUsed(true)}
        >
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
          <InlineMarkdown text={practice.hint} />
        </button>

        {revealed && practiceReveal.feedback ? (
          <p
            className={`mt-4 text-[14px] font-bold ${isCorrect ? "text-[#1f6b2e]" : "text-[#9a4a12]"}`}
          >
            <InlineMarkdown text={practiceReveal.feedback} />
          </p>
        ) : null}

        {checkMutation.isError ? (
          <p className="mt-3 text-[13px] font-bold text-[#9a4a12]">
            {(checkMutation.error as Error)?.message ?? "Check failed. Retry."}
          </p>
        ) : null}

        <div className="mt-auto space-y-2 pt-8">
          {!revealed ? (
            <LessonPrimaryButton
              disabled={
                !selected || !attemptId || checking || checkMutation.isPending
              }
              onClick={() => {
                if (!selected) return;
                setChecking(true);
                checkMutation.mutate(selected);
              }}
            >
              {!attemptId
                ? "Starting…"
                : checkMutation.isPending
                  ? "Checking…"
                  : "Check answer"}
            </LessonPrimaryButton>
          ) : (
            <LessonPrimaryButton href={`/learn/${lesson.id}/quiz`}>
              {isCorrect ? "Next: Quiz" : "Got it — Quiz"}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </LessonPrimaryButton>
          )}
        </div>
      </motion.div>
    </LessonShell>
  );
}
