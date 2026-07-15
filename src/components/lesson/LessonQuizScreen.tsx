"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { lessonsApi } from "@/lib/api/lessons";
import type {
  LessonQuizAnswerValue,
  LessonQuizQuestionDto,
} from "@/lib/api/types";
import { InlineMarkdown } from "@/lib/lesson/inline-markdown";
import { startSegmentFor, finishHrefFor, finishLabelFor } from "@/lib/lesson/map-play";
import { useEnsureLessonAttempt } from "@/hooks/useEnsureLessonAttempt";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { useLessonStore } from "@/store/useLessonStore";
import {
  LessonOptionCard,
  LessonPrimaryButton,
  LessonShell,
} from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";

const BOOLEAN_LABELS: Array<{ value: boolean; label: string }> = [
  { value: true, label: "True" },
  { value: false, label: "False" },
];

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
  const resetQuizRun = useLessonStore((s) => s.resetQuizRun);
  const attemptId = useEnsureLessonAttempt(lessonId);
  const [localRevealed, setLocalRevealed] = useState(false);

  const wrongSegment = lesson && lesson.body.kind !== "quiz";
  useEffect(() => {
    if (!lesson || !wrongSegment) return;
    router.replace(`/learn/${lesson.id}/${startSegmentFor(lesson.lessonType)}`);
  }, [lesson, wrongSegment, router]);

  const checkMutation = useMutation({
    mutationFn: (payload: {
      question: LessonQuizQuestionDto;
      answer: LessonQuizAnswerValue;
    }) => {
      const id = useLessonStore.getState().attemptId;
      if (!id) throw new Error("Start the lesson first");
      return lessonsApi.checkQuiz(
        lessonId,
        {
          attemptId: id,
          questionId: payload.question.id,
          ...(payload.question.type === "boolean"
            ? { booleanAnswer: payload.answer as boolean }
            : { optionIndex: payload.answer as number }),
        },
        session?.accessToken,
      );
    },
    onSuccess: (res) => {
      setQuizReveal(res.questionId, {
        correct: res.correct,
        answer: res.answer,
        explain: res.explain,
      });
      setLocalRevealed(true);
    },
  });

  if (isLoading || wrongSegment) {
    return (
      <LessonShell
        lessonId={lessonId}
        stepLabel="Loading"
        progress={0}
        showArlo={false}
      >
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

  const body = lesson.body;
  if (body.kind !== "quiz") return null;

  const questions = body.questions;
  const total = questions.length;
  const index = Math.min(quizIndex, total - 1);
  const question = questions[index];
  const selected = quizAnswers[question.id] ?? null;
  const reveal = quizReveal[question.id];
  const revealed = localRevealed && Boolean(reveal);
  const isLast = index >= total - 1;
  const progress = 10 + ((index + 1) / total) * 80;

  const revealedCount = questions.filter((q) => quizReveal[q.id]).length;
  const correctCount = questions.filter(
    (q) => quizReveal[q.id]?.correct,
  ).length;
  const scorePercent =
    total > 0 ? Math.round((correctCount / total) * 100) : 100;
  const allRevealed = revealedCount === total;
  const passed = scorePercent >= body.passScore;

  return (
    <LessonShell
      lessonId={lesson.id}
      stepLabel={`Quiz · ${index + 1}/${total}`}
      progress={progress}
      onBack={() => {
        if (index > 0) {
          setLocalRevealed(Boolean(quizReveal[questions[index - 1]?.id]));
          setQuizIndex(index - 1);
        } else {
          router.push(`/learn/${lesson.id}`);
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
          <InlineMarkdown text={question.q} />
        </h1>

        <div className="mt-5 space-y-2.5">
          {question.type === "boolean"
            ? BOOLEAN_LABELS.map(({ value, label }) => (
                <LessonOptionCard
                  key={label}
                  label={label}
                  selected={selected === value}
                  correct={reveal ? reveal.answer === value : false}
                  revealed={revealed}
                  onSelect={() => {
                    if (revealed) return;
                    setQuizAnswer(question.id, value);
                  }}
                />
              ))
            : (question.options ?? []).map((option, optionIndex) => (
                <LessonOptionCard
                  key={optionIndex}
                  label={option}
                  selected={selected === optionIndex}
                  correct={reveal ? reveal.answer === optionIndex : false}
                  revealed={revealed}
                  onSelect={() => {
                    if (revealed) return;
                    setQuizAnswer(question.id, optionIndex);
                  }}
                />
              ))}
        </div>

        {revealed && reveal?.explain ? (
          <p className="mt-4 text-[14px] font-semibold text-[#4a3d78]">
            <InlineMarkdown text={reveal.explain} />
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
                selected == null || !attemptId || checkMutation.isPending
              }
              onClick={() => {
                if (selected == null) return;
                checkMutation.mutate({ question, answer: selected });
              }}
            >
              {!attemptId
                ? "Starting…"
                : checkMutation.isPending
                  ? "Checking…"
                  : "Check"}
            </LessonPrimaryButton>
          ) : isLast ? (
            allRevealed && !passed ? (
              <>
                <p className="text-center text-[13px] font-bold text-[#9a4a12]">
                  {scorePercent}% — you need {body.passScore}% to pass. One more
                  run!
                </p>
                <LessonPrimaryButton
                  onClick={() => {
                    resetQuizRun();
                    setLocalRevealed(false);
                  }}
                >
                  Try again
                  <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
                </LessonPrimaryButton>
              </>
            ) : (
              <LessonPrimaryButton href={finishHrefFor(lesson)}>
                {finishLabelFor(lesson)}
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </LessonPrimaryButton>
            )
          ) : (
            <LessonPrimaryButton
              onClick={() => {
                setLocalRevealed(false);
                setQuizIndex(index + 1);
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
