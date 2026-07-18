"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  PlayCircle,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { InlineMarkdown } from "@/lib/lesson/inline-markdown";
import { resolveVideoEmbed } from "@/lib/lesson/video-embed";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonSectionBlockDto } from "@/lib/api/types";
import { startSegmentFor, finishHrefFor, finishLabelFor, type PlayableLesson } from "@/lib/lesson/map-play";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { useLessonStore } from "@/store/useLessonStore";
import { LessonPrimaryButton, LessonShell } from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";
import { ReadingArloAssist } from "./ReadingArloAssist";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Lesson content — reading pager (sections + key takeaways) or video note.
 * Task/quiz lessons are redirected to their own routes.
 */
export default function LessonContentScreen({
  lessonId,
}: {
  lessonId: string;
}) {
  const router = useRouter();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);

  // Wrong route for this lesson type — bounce to the right one.
  const wrongSegment =
    lesson && lesson.body.kind !== "reading" && lesson.body.kind !== "video";
  useEffect(() => {
    if (!lesson || !wrongSegment) return;
    router.replace(`/learn/${lesson.id}/${startSegmentFor(lesson.lessonType)}`);
  }, [lesson, wrongSegment, router]);

  if (isLoading || wrongSegment) {
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

  if (lesson.body.kind === "video") {
    return <VideoContent lesson={lesson} />;
  }

  return <ReadingContent lesson={lesson} />;
}

function ReadingContent({ lesson }: { lesson: PlayableLesson }) {
  const router = useRouter();
  const { data: session } = useSession();
  const contentStep = useLessonStore((s) => s.contentStep);
  const setContentStep = useLessonStore((s) => s.setContentStep);

  const progressMutation = useMutation({
    mutationFn: (step: number) =>
      lessonsApi.saveProgress(
        lesson.id,
        { contentStep: step },
        session?.accessToken,
      ),
  });

  const body = lesson.body;
  if (body.kind !== "reading") return null;

  const sections = body.sections;
  const hasTakeaways = body.keyTakeaways.length > 0;
  // Key takeaways get their own final beat.
  const total = Math.max(sections.length + (hasTakeaways ? 1 : 0), 1);
  const step = Math.min(contentStep, total - 1);
  const isTakeaways = hasTakeaways && step === total - 1;
  const section = isTakeaways ? null : sections[step];
  const isLast = step >= total - 1;
  const progress = 15 + ((step + 1) / total) * 70;

  const goTo = (next: number) => {
    setContentStep(next);
    progressMutation.mutate(next);
  };

  return (
    <LessonShell
      lessonId={lesson.id}
      lessonType={lesson.lessonType}
      stepLabel={`Read · ${step + 1}/${total}`}
      progress={progress}
      onBack={() => {
        if (step > 0) {
          goTo(step - 1);
        } else {
          router.push(`/learn/${lesson.id}`);
        }
      }}
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <div className="grid grid-cols-[auto_1fr] items-start gap-3">
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] font-display text-[15px] font-bold text-[#ffc928] shadow-[0_3px_0_#2a2f45]">
              {step + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
                {isTakeaways ? "Wrap-up" : `Beat ${step + 1} of ${total}`}
              </p>
              <h1 className="mt-1 font-display text-[28px] leading-[0.95] font-bold tracking-[-0.035em] text-[#0f1220] text-balance">
                {isTakeaways
                  ? "Key takeaways"
                  : section?.title?.trim() || lesson.title}
              </h1>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {isTakeaways
              ? body.keyTakeaways.map((takeaway, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white p-3.5 shadow-[0_4px_0_#ebe4f6]"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-arc-purple-500"
                      strokeWidth={2.5}
                    />
                    <InlineMarkdown
                      as="p"
                      text={takeaway}
                      className="text-[14px] leading-snug font-bold text-[#0f1220] text-pretty"
                    />
                  </div>
                ))
              : (section?.blocks ?? []).map((block, i) => (
                  <SectionBlock key={i} block={block} />
                ))}
          </div>

          <ReadingArloAssist
            key={step}
            lessonId={lesson.id}
            lessonType={lesson.lessonType}
            focusTitle={
              isTakeaways
                ? "Key takeaways"
                : section?.title?.trim() || lesson.title
            }
          />
        </div>

        <div className="shrink-0 pt-6">
          <motion.div whileTap={{ scale: 0.98, y: 2 }} transition={softSpring}>
            {isLast ? (
              <LessonPrimaryButton href={finishHrefFor(lesson)}>
                {finishLabelFor(lesson)}
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </LessonPrimaryButton>
            ) : (
              <LessonPrimaryButton onClick={() => goTo(step + 1)}>
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

function VideoContent({ lesson }: { lesson: PlayableLesson }) {
  const router = useRouter();
  const body = lesson.body;
  if (body.kind !== "video") return null;

  const embed = resolveVideoEmbed(lesson.url);

  return (
    <LessonShell
      lessonId={lesson.id}
      lessonType={lesson.lessonType}
      stepLabel="Watch"
      progress={50}
      onBack={() => router.push(`/learn/${lesson.id}`)}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <div className="grid grid-cols-[auto_1fr] items-start gap-3">
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] text-[#ffc928] shadow-[0_3px_0_#2a2f45]">
              <PlayCircle className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
                {lesson.provider ?? "Video"}
              </p>
              <h1 className="mt-1 font-display text-[28px] leading-[0.95] font-bold tracking-[-0.035em] text-[#0f1220] text-balance">
                {lesson.title}
              </h1>
            </div>
          </div>

          <aside className="relative mt-5 overflow-hidden rounded-[20px] bg-[#0f1220] p-4 text-white shadow-[0_12px_28px_rgba(15,18,32,0.22)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-8 -right-6 h-24 w-24 rounded-full bg-[#ffc928]/20 blur-2xl"
            />
            <div className="relative z-[1] flex items-center gap-2 text-[#ffc928]">
              <Lightbulb className="h-4 w-4" strokeWidth={2.5} />
              <p className="text-[10px] font-extrabold tracking-[0.12em] uppercase">
                Watch for
              </p>
            </div>
            <InlineMarkdown
              as="p"
              text={body.note}
              className="relative z-[1] mt-2 text-[14px] leading-snug font-bold text-white/85 text-pretty [&_code]:bg-white/15"
            />
          </aside>

          {embed?.kind === "embed" ? (
            <div className="mt-3 overflow-hidden rounded-[18px] border-2 border-[#ebe4f6] bg-[#0f1220] shadow-[0_4px_0_#ebe4f6]">
              <div className="relative aspect-video w-full">
                <iframe
                  src={embed.src}
                  title={lesson.title}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  // No allow-top-navigation*: YouTube "Watch on YouTube" must not
                  // navigate/reload the Arlo lesson page — open popups only.
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-forms"
                  referrerPolicy="origin-when-cross-origin"
                  loading="eager"
                />
              </div>
              {lesson.url?.startsWith("http") ? (
                <button
                  type="button"
                  onClick={() =>
                    window.open(lesson.url!, "_blank", "noopener,noreferrer")
                  }
                  className="flex w-full cursor-pointer items-center gap-2 border-t border-white/10 px-3.5 py-2.5 text-left text-[12px] font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  Open on {embed.provider === "vimeo" ? "Vimeo" : "YouTube"}
                </button>
              ) : null}
            </div>
          ) : embed?.kind === "external" ? (
            <button
              type="button"
              onClick={() =>
                window.open(embed.href, "_blank", "noopener,noreferrer")
              }
              className="mt-3 flex w-full cursor-pointer items-center gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white p-3.5 text-left shadow-[0_4px_0_#ebe4f6]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-arc-purple-500 text-white shadow-[0_3px_0_var(--color-arc-purple-700)]">
                <ExternalLink className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-black tracking-[0.1em] text-arc-lavender-500 uppercase">
                  Open video
                </span>
                <span className="mt-0.5 block truncate font-display text-[15px] leading-snug font-bold text-[#0f1220]">
                  {embed.href}
                </span>
              </span>
            </button>
          ) : null}

          <p className="mt-4 text-[13px] leading-snug font-bold text-arc-lavender-600 text-pretty">
            About {lesson.minutes} min. Come back and claim your reward when
            you&apos;re done watching.
          </p>
        </div>

        <div className="shrink-0 pt-6">
          <motion.div whileTap={{ scale: 0.98, y: 2 }} transition={softSpring}>
            <LessonPrimaryButton href={finishHrefFor(lesson)}>
              {lesson.status === "completed"
                ? "Back to Path"
                : "I watched it — claim reward"}
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </LessonPrimaryButton>
          </motion.div>
        </div>
      </motion.div>
    </LessonShell>
  );
}

function SectionBlock({ block }: { block: LessonSectionBlockDto }) {
  switch (block.type) {
    case "callout":
      return (
        <aside className="rounded-[18px] border-2 border-[#ebe4f6] bg-white p-3.5 shadow-[0_4px_0_#ebe4f6]">
          <div className="flex items-center gap-2 text-arc-purple-500">
            <Lightbulb className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            <p className="text-[10px] font-extrabold tracking-[0.12em] uppercase">
              {block.title?.trim() || "Note"}
            </p>
          </div>
          {block.body ? (
            <InlineMarkdown
              as="p"
              text={block.body}
              className="mt-2 text-[14px] leading-snug font-bold text-[#0f1220] text-pretty"
            />
          ) : null}
        </aside>
      );
    case "code":
      return (
        <div className="overflow-hidden rounded-[18px] bg-[#0f1220] shadow-[0_4px_0_#2a2f45]">
          <p className="border-b border-white/10 px-4 py-2 text-[10px] font-extrabold tracking-[0.12em] text-[#ffc928] uppercase">
            {block.label?.trim() || "Code"}
          </p>
          <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-white/90">
            <code>{block.code ?? ""}</code>
          </pre>
        </div>
      );
    default:
      return (
        <>
          {splitParagraphs(block.body ?? "").map((para, i) => (
            <InlineMarkdown
              key={i}
              as="p"
              text={para}
              className="max-w-[28rem] text-[15px] leading-relaxed font-bold text-arc-lavender-700 text-pretty"
            />
          ))}
        </>
      );
  }
}

function splitParagraphs(section: string): string[] {
  const parts = section
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [section];
}
