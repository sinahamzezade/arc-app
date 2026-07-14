"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Lightbulb, Terminal } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import type { LessonContentBlock } from "@/lib/lesson/types";
import { InlineMarkdown } from "@/lib/lesson/inline-markdown";
import { lessonsApi } from "@/lib/api/lessons";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { useLessonStore } from "@/store/useLessonStore";
import { LessonPrimaryButton, LessonShell } from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Lesson content pager — night chrome + clay study sheet.
 */
export default function LessonContentScreen({
  lessonId,
}: {
  lessonId: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const contentStep = useLessonStore((s) => s.contentStep);
  const setContentStep = useLessonStore((s) => s.setContentStep);

  const progressMutation = useMutation({
    mutationFn: (step: number) =>
      lessonsApi.saveProgress(
        lessonId,
        { contentStep: step },
        session?.accessToken,
      ),
  });

  if (isLoading) {
    return (
      <LessonShell
        lessonId={lessonId}
        stepLabel="Loading"
        progress={0}
        showArlo={false}
      >
        <p className="text-arc-lavender-600">Loading content…</p>
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

  const page = lesson.content[contentStep] ?? lesson.content[0];
  const total = lesson.content.length;
  const isLast = contentStep >= total - 1;
  const progress = 15 + ((contentStep + 1) / total) * 35;

  const goNext = () => {
    const next = contentStep + 1;
    setContentStep(next);
    progressMutation.mutate(next);
  };

  return (
    <LessonShell
      lessonId={lesson.id}
      stepLabel={`Learn · ${contentStep + 1}/${total}`}
      progress={progress}
      onBack={() => {
        if (contentStep > 0) {
          const prev = contentStep - 1;
          setContentStep(prev);
          progressMutation.mutate(prev);
        } else {
          router.push(`/learn/${lesson.id}`);
        }
      }}
    >
      <motion.div
        key={page.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <div className="grid grid-cols-[auto_1fr] items-start gap-3">
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] font-display text-[15px] font-bold text-[#ffc928] shadow-[0_3px_0_#2a2f45]">
              {contentStep + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
                Beat {contentStep + 1} of {total}
              </p>
              <h1 className="mt-1 font-display text-[28px] leading-[0.95] font-bold tracking-[-0.035em] text-[#0f1220] text-balance">
                {page.title}
              </h1>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {(page.blocks ?? []).map((block, i) => (
              <ContentBlock key={i} block={block} />
            ))}
          </div>
        </div>

        <div className="shrink-0 pt-6">
          <motion.div whileTap={{ scale: 0.98, y: 2 }} transition={softSpring}>
            {isLast ? (
              <LessonPrimaryButton href={`/learn/${lesson.id}/practice`}>
                Practice time
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </LessonPrimaryButton>
            ) : (
              <LessonPrimaryButton onClick={goNext}>
                Continue
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </LessonPrimaryButton>
            )}
          </motion.div>
        </div>
      </motion.div>
    </LessonShell>
  );
}

function ContentBlock({ block }: { block: LessonContentBlock }) {
  console.log("block", block);
  if (block.type === "text") {
    return (
      <InlineMarkdown
        as="p"
        text={block.body}
        className="max-w-[28rem] text-[15px] leading-relaxed font-bold text-arc-lavender-700 text-pretty"
      />
    );
  }

  if (block.type === "callout") {
    return (
      <aside className="relative overflow-hidden rounded-[20px] bg-[#0f1220] p-4 text-white shadow-[0_12px_28px_rgba(15,18,32,0.22)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 -right-6 h-24 w-24 rounded-full bg-[#ffc928]/20 blur-2xl"
        />
        <div className="relative z-[1] flex items-center gap-2 text-[#ffc928]">
          <Lightbulb className="h-4 w-4" strokeWidth={2.5} />
          <p className="text-[10px] font-extrabold tracking-[0.12em] uppercase">
            {block.title}
          </p>
        </div>
        <InlineMarkdown
          as="p"
          text={block.body}
          className="relative z-[1] mt-2 text-[14px] leading-snug font-bold text-white/85 text-pretty [&_code]:bg-white/15"
        />
      </aside>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-[#0f1220] shadow-[0_4px_0_#ebe4f6]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-2.5">
        <Terminal className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
        <span className="text-[10px] font-black tracking-[0.1em] text-white/50 uppercase">
          {block.label}
        </span>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[12px] leading-relaxed whitespace-pre text-[#e8e0ff]">
        {block.code}
      </pre>
    </div>
  );
}
