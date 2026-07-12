"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
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

export default function LessonQuizScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const quizIndex = useLessonStore((s) => s.quizIndex);
  const quizAnswers = useLessonStore((s) => s.quizAnswers);
  const setQuizAnswer = useLessonStore((s) => s.setQuizAnswer);
  const setQuizIndex = useLessonStore((s) => s.setQuizIndex);
  const quizReveal = useLessonStore((s) => s.quizReveal);
  const setQuizReveal = useLessonStore((s) => s.setQuizReveal);
  const attemptId = useEnsureLessonAttempt(lessonId);
  const [localRevealed, setLocalRevealed] = useState(false);

  const checkMutation = useMutation({
    mutationFn: (payload: { questionId: string; optionId: string }) => {
      const id = useLessonStore.getState().attemptId;
      if (!id) throw new Error("Start the lesson first");
      return lessonsApi.checkQuiz(
        lessonId,
        { ...payload, attemptId: id },
        session?.accessToken,
      );
    },
    onSuccess: (res, vars) => {
      setQuizReveal(vars.questionId, {
        correctOptionId: res.correctOptionId,
        explanation: res.explanation,
        correct: res.correct,
      });
      setLocalRevealed(true);
    },
  });

  if (isLoading) {
    return (
      <LessonShell lessonId={lessonId} stepLabel="Loading" progress={0} showArlo={false}>
        <p className="text-arc-lavender-600">Loading quiz…</p>
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

  const question = lesson.quiz[quizIndex];
  const total = lesson.quiz.length;
  const selected = quizAnswers[question.id] ?? null;
  const reveal = quizReveal[question.id];
  const revealed = localRevealed && Boolean(reveal);
  const isLast = quizIndex >= total - 1;
  const progress = 65 + ((quizIndex + 1) / total) * 25;

  return (
    <LessonShell
      lessonId={lesson.id}
      stepLabel={`Quiz · ${quizIndex + 1}/${total}`}
      progress={progress}
      onBack={() => {
        if (quizIndex > 0) {
          setLocalRevealed(Boolean(quizReveal[lesson.quiz[quizIndex - 1]?.id]));
          setQuizIndex(quizIndex - 1);
        } else {
          router.push(`/learn/${lesson.id}/practice`);
        }
      }}
    >
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-1 flex-col"
      >
        <h1 className="font-display text-[24px] leading-tight font-bold tracking-[-0.03em] text-[#2b1b57]">
          <InlineMarkdown text={question.prompt} />
        </h1>

        <div className="mt-5 space-y-2.5">
          {question.options.map((option) => (
            <LessonOptionCard
              key={option.id}
              label={option.label}
              selected={selected === option.id}
              correct={option.id === reveal?.correctOptionId}
              revealed={revealed}
              onSelect={() => {
                if (revealed) return;
                setQuizAnswer(question.id, option.id);
              }}
            />
          ))}
        </div>

        {revealed && reveal?.explanation ? (
          <p className="mt-4 text-[14px] font-semibold text-[#4a3d78]">
            <InlineMarkdown text={reveal.explanation} />
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
              disabled={!selected || !attemptId || checkMutation.isPending}
              onClick={() => {
                if (!selected) return;
                checkMutation.mutate({
                  questionId: question.id,
                  optionId: selected,
                });
              }}
            >
              {!attemptId
                ? "Starting…"
                : checkMutation.isPending
                  ? "Checking…"
                  : "Check"}
            </LessonPrimaryButton>
          ) : isLast ? (
            <LessonPrimaryButton href={`/learn/${lesson.id}/reward`}>
              Claim reward
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </LessonPrimaryButton>
          ) : (
            <LessonPrimaryButton
              onClick={() => {
                setLocalRevealed(false);
                setQuizIndex(quizIndex + 1);
              }}
            >
              Next question
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </LessonPrimaryButton>
          )}
        </div>
      </motion.div>
    </LessonShell>
  );
}
