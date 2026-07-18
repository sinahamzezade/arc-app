"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Lightbulb,
  Terminal,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { lessonsApi } from "@/lib/api/lessons";
import { InlineMarkdown } from "@/lib/lesson/inline-markdown";
import { startSegmentFor, finishHrefFor, finishLabelFor } from "@/lib/lesson/map-play";
import { useEnsureLessonAttempt } from "@/hooks/useEnsureLessonAttempt";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { useLessonStore } from "@/store/useLessonStore";
import { LessonPrimaryButton, LessonShell } from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";

/**
 * Task screen for practice / mini_project / interactive lessons.
 * Learner self-attests via acceptance-criteria checklist, then
 * practice/check → straight to reward (no quiz step).
 */
export default function LessonPracticeScreen({
  lessonId,
}: {
  lessonId: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const practiceChecked = useLessonStore((s) => s.practiceChecked);
  const togglePracticeChecked = useLessonStore((s) => s.togglePracticeChecked);
  const practiceDone = useLessonStore((s) => s.practiceDone);
  const setPracticeDone = useLessonStore((s) => s.setPracticeDone);
  const practiceHintUsed = useLessonStore((s) => s.practiceHintUsed);
  const setPracticeHintUsed = useLessonStore((s) => s.setPracticeHintUsed);
  const attemptId = useEnsureLessonAttempt(lessonId);
  const [hintsOpen, setHintsOpen] = useState(false);

  const wrongSegment = lesson && lesson.body.kind !== "task";
  useEffect(() => {
    if (!lesson || !wrongSegment) return;
    router.replace(`/learn/${lesson.id}/${startSegmentFor(lesson.lessonType)}`);
  }, [lesson, wrongSegment, router]);

  const checkMutation = useMutation({
    mutationFn: () => {
      const id = useLessonStore.getState().attemptId;
      if (!id) throw new Error("Start the lesson first");
      return lessonsApi.checkPractice(
        lessonId,
        { attemptId: id, done: true, hintUsed: practiceHintUsed },
        session?.accessToken,
      );
    },
    onSuccess: () => {
      setPracticeDone(true);
      router.push(
        lesson?.status === "completed" ? "/path" : `/learn/${lessonId}/reward`,
      );
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

  const body = lesson.body;
  if (body.kind !== "task") return null;

  const criteria = body.acceptanceCriteria;
  const checkedCount = criteria.filter((_, i) => practiceChecked[i]).length;
  const allChecked = criteria.length === 0 || checkedCount === criteria.length;
  const hints = body.hints ?? [];
  const stepLabel =
    lesson.lessonType === "mini_project" ? "Mini project" : "Practice";
  const progress =
    30 + (criteria.length > 0 ? (checkedCount / criteria.length) * 55 : 55);

  return (
    <LessonShell
      lessonId={lesson.id}
      lessonType={lesson.lessonType}
      stepLabel={stepLabel}
      progress={progress}
      onBack={() => router.push(`/learn/${lesson.id}`)}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <p className="text-[11px] font-bold tracking-[0.06em] text-arc-purple-500 uppercase">
            Hands-on
          </p>
          <h1 className="mt-1 font-display text-[24px] leading-tight font-bold tracking-[-0.03em] text-[#2b1b57]">
            <InlineMarkdown text={body.task} />
          </h1>

          {lesson.url?.startsWith("http") ? (
            <a
              href={lesson.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2.5 rounded-2xl border-2 border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_4px_0_#ebe4f6]"
            >
              <ExternalLink
                className="h-4 w-4 shrink-0 text-arc-purple-500"
                strokeWidth={2.5}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#0f1220]">
                {lesson.provider ?? "Open resource"} · {lesson.url}
              </span>
            </a>
          ) : null}

          {body.starterHtml ? (
            <div className="mt-4 overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-[#0f1220] shadow-[0_4px_0_#ebe4f6]">
              <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-2.5">
                <Terminal
                  className="h-3.5 w-3.5 text-[#ffc928]"
                  strokeWidth={2.5}
                />
                <span className="text-[10px] font-black tracking-[0.1em] text-white/50 uppercase">
                  Starter code
                </span>
              </div>
              <pre className="overflow-x-auto p-3.5 font-mono text-[12px] leading-relaxed whitespace-pre text-[#e8e0ff]">
                {body.starterHtml}
              </pre>
            </div>
          ) : null}

          {criteria.length > 0 ? (
            <div className="mt-5">
              <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
                Done when · {checkedCount}/{criteria.length}
              </p>
              <div className="mt-2.5 space-y-2.5">
                {criteria.map((criterion, i) => {
                  const checked = Boolean(practiceChecked[i]);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (!practiceDone) togglePracticeChecked(i);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-[18px] border-2 px-4 py-3.5 text-left font-display text-[15px] font-bold transition-colors",
                        checked
                          ? "border-[#62d84e] bg-[#f0fbeb] text-[#1f6b2e] shadow-[0_4px_0_#b8e6a8]"
                          : "border-[#ebe4f6] bg-white text-[#0f1220] shadow-[0_4px_0_#ebe4f6]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                          checked
                            ? "border-[#62d84e] bg-[#62d84e] text-white"
                            : "border-[#d8ccff] bg-white",
                        )}
                      >
                        {checked ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : null}
                      </span>
                      <span className="text-[14px] leading-snug">
                        <InlineMarkdown text={criterion} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {hints.length > 0 ? (
            <div className="mt-4">
              {!hintsOpen ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-2xl bg-[#fff8e8] px-3.5 py-3 text-left text-[13px] font-semibold text-[#8a6a1e]"
                  onClick={() => {
                    setHintsOpen(true);
                    setPracticeHintUsed(true);
                  }}
                >
                  <Lightbulb className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                  Need a hint? ({hints.length})
                </button>
              ) : (
                <div className="space-y-2">
                  {hints.map((hint, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-2xl bg-[#fff8e8] px-3.5 py-3 text-[13px] font-semibold text-[#8a6a1e]"
                    >
                      <Lightbulb
                        className="mt-0.5 h-4 w-4 shrink-0"
                        strokeWidth={2.25}
                      />
                      <InlineMarkdown text={hint} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {checkMutation.isError ? (
            <p className="mt-3 text-[13px] font-bold text-[#9a4a12]">
              {(checkMutation.error as Error)?.message ??
                "Couldn't save. Retry."}
            </p>
          ) : null}
        </div>

        <div className="mt-auto shrink-0 space-y-2 pt-6">
          {practiceDone ? (
            <LessonPrimaryButton href={finishHrefFor(lesson)}>
              {finishLabelFor(lesson)}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </LessonPrimaryButton>
          ) : (
            <LessonPrimaryButton
              disabled={!allChecked || !attemptId || checkMutation.isPending}
              onClick={() => checkMutation.mutate()}
            >
              {!attemptId
                ? "Starting…"
                : checkMutation.isPending
                  ? "Saving…"
                  : allChecked
                    ? "I did it — complete"
                    : `Check off all ${criteria.length} to finish`}
              {allChecked && attemptId && !checkMutation.isPending ? (
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              ) : null}
            </LessonPrimaryButton>
          )}
        </div>
      </motion.div>
    </LessonShell>
  );
}
