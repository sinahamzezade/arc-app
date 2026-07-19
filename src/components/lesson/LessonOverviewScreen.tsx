"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import { assets } from "@/lib/assets";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonPlayDto } from "@/lib/api/types";
import { startHrefFor } from "@/lib/lesson/map-play";
import { playQueryKey } from "@/lib/lesson/play-query-key";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { useSystemFlags } from "@/hooks/useSystemFlags";
import { isArloVisibleForLessonType } from "@/lib/lesson/arlo-visibility";
import { useLessonStore } from "@/store/useLessonStore";
import { LessonPrimaryButton } from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";
import { LessonArloSheet } from "./LessonArloSheet";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

const HERO_STARFIELD = {
  backgroundImage:
    "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1px at 55% 60%, #fff, transparent)",
} as const;

const START_LABELS: Record<string, string> = {
  reading: "Start reading",
  video: "Start watching",
  quiz: "Start quiz",
  practice: "Start practice",
  mini_project: "Start project",
  interactive: "Start practice",
  scenario: "Start scenario",
  visual_hotspot: "Start hotspot",
  debate: "Start debate",
  sandbox_simulation: "Start simulation",
};

const REVIEW_LABELS: Record<string, string> = {
  reading: "Review reading",
  video: "Watch again",
  quiz: "Review quiz",
  practice: "Review practice",
  mini_project: "Review project",
  interactive: "Review practice",
  scenario: "Review scenario",
  visual_hotspot: "Review hotspot",
  debate: "Review debate",
  sandbox_simulation: "Review simulation",
};

const TYPE_TAGS: Record<string, string> = {
  reading: "Read",
  video: "Watch",
  quiz: "Quiz",
  practice: "Practice",
  mini_project: "Mini project",
  interactive: "Interactive",
  scenario: "Scenario",
  visual_hotspot: "Hotspot",
  debate: "Debate",
  sandbox_simulation: "Simulation",
};

/** Fallback for unknown API types — `visual_hotspot` → `Visual hotspot`. */
function prettyLessonType(raw: string): string {
  const tagged = TYPE_TAGS[raw];
  if (tagged) return tagged;
  return raw
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Lesson launch — night-hero family (Home / Learn desk).
 * Masthead + Arlo; sheet holds objective + resource + Start.
 */
export default function LessonOverviewScreen({
  lessonId,
}: {
  lessonId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const userId = session?.user?.id;
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const { flags } = useSystemFlags();
  const [arloOpen, setArloOpen] = useState(false);
  const startLesson = useLessonStore((s) => s.startLesson);
  const setAttemptId = useLessonStore((s) => s.setAttemptId);

  const startMutation = useMutation({
    mutationFn: () => lessonsApi.start(lessonId, accessToken),
    onSuccess: (res) => {
      if (!res.attemptId) return;
      setAttemptId(res.attemptId);
      queryClient.setQueryData<LessonPlayDto>(
        playQueryKey(lessonId, userId),
        (old) => (old ? { ...old, attemptId: res.attemptId } : old),
      );
    },
  });

  const beginLesson = () => {
    if (!lesson) return;
    startLesson(lesson.id);
    if (!useLessonStore.getState().attemptId) {
      startMutation.mutate();
    }
    router.push(startHrefFor(lesson));
  };

  if (isLoading) {
    return <LessonLoadState message="Loading lesson…" />;
  }

  if (isError || !lesson) {
    return (
      <LessonLoadState
        message={error?.message ?? "Lesson not found."}
        actionHref="/path"
        actionLabel="Back to Path"
        onRetry={isError ? () => refetch() : undefined}
      />
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-18 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={HERO_STARFIELD}
        />

        <header className="relative z-20 flex items-center gap-3">
          <BackButton onClick={() => router.push("/path")} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Lesson {lesson.lessonNumber}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-arc-purple-500"
                initial={{ width: 0 }}
                animate={{ width: "8%" }}
                transition={softSpring}
              />
            </div>
          </div>
          {isArloVisibleForLessonType(flags, lesson.lessonType) ? (
            <button
              type="button"
              aria-label="Ask Arlo"
              onClick={() => setArloOpen(true)}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-arc-purple-500 text-white shadow-[0_3px_0_var(--color-arc-purple-700)]"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
            </button>
          ) : null}
        </header>

        <div className="relative z-[1] mt-6 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="min-w-0 pb-1">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[#ffc928]/15 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.1em] text-[#ffc928] uppercase">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} />
              {lesson.status === "completed"
                ? "Cleared · review"
                : lesson.missionName}
            </p>
            <h1 className="mt-3 font-display text-[34px] leading-[0.92] font-bold tracking-[-0.04em] text-balance">
              {lesson.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold ring-1 ring-white/15">
                <Clock
                  className="h-3.5 w-3.5 text-[#ffc928]"
                  strokeWidth={2.5}
                />
                {lesson.minutes} min
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ffc928]/15 px-2.5 py-1.5 text-[11px] font-extrabold text-[#ffc928]">
                <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />+
                {lesson.reward.xp} XP
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold ring-1 ring-white/15">
                +{lesson.reward.gems} gems · +{lesson.reward.coins} coins
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold tracking-[-0.01em] ring-1 ring-white/15">
                {prettyLessonType(lesson.lessonType)}
              </span>
            </div>
          </div>

          <motion.div
            className="relative -mr-1 mb-[-6px]"
            animate={arloOpen ? { y: 0 } : { y: [0, -5, 0] }}
            transition={
              arloOpen
                ? softSpring
                : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <Image
              src={assets.arlo.thinking}
              alt="Arlo"
              width={110}
              height={110}
              className="h-[110px] w-[110px] object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.4)]"
              priority
            />
          </motion.div>
        </div>

        <p className="relative z-[1] mt-5 max-w-[17rem] text-[13px] leading-snug font-bold text-white/55 text-pretty">
          {lesson.arloPrompt}
        </p>
      </section>

      <div className="relative z-10 -mt-12 flex flex-1 flex-col rounded-t-[28px] bg-[#f3effc] px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        <div className="relative overflow-hidden rounded-[22px] bg-[#0f1220] p-4 text-white shadow-[0_14px_32px_rgba(15,18,32,0.28)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-6 h-28 w-28 rounded-full bg-arc-purple-500/30 blur-3xl"
          />
          <div className="relative z-[1] flex items-center gap-2 text-[#ffc928]">
            <Target className="h-4 w-4" strokeWidth={2.5} />
            <h2 className="text-[10px] font-extrabold tracking-[0.12em] uppercase">
              Objective
            </h2>
          </div>
          <p className="relative z-[1] mt-2 text-[14px] leading-snug font-bold text-white/85 text-pretty">
            {lesson.objective}
          </p>
        </div>

        {lesson.url?.startsWith("http") ? (
          <a
            href={lesson.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-start gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white p-3.5 shadow-[0_4px_0_#ebe4f6]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-arc-purple-500 text-white shadow-[0_3px_0_var(--color-arc-purple-700)]">
              <ExternalLink className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black tracking-[0.1em] text-arc-lavender-500 uppercase">
                Resource
              </span>
              <span className="mt-0.5 block font-display text-[15px] leading-snug font-bold text-[#0f1220]">
                {lesson.provider ?? "External resource"}
              </span>
              <span className="mt-1 block truncate text-[12px] font-bold text-arc-lavender-700">
                {lesson.url}
              </span>
            </span>
          </a>
        ) : null}

        <div className="mt-auto pt-6">
          <motion.div whileTap={{ scale: 0.98, y: 2 }} transition={softSpring}>
            <LessonPrimaryButton
              onClick={beginLesson}
              disabled={startMutation.isPending}
              className="rounded-[18px] py-4 text-[16px] shadow-[0_5px_0_var(--color-arc-purple-700)]"
            >
              {lesson.status === "completed"
                ? (REVIEW_LABELS[lesson.lessonType] ?? "Review lesson")
                : (START_LABELS[lesson.lessonType] ?? "Start lesson")}
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </LessonPrimaryButton>
          </motion.div>
        </div>
      </div>

      {arloOpen &&
      isArloVisibleForLessonType(flags, lesson.lessonType) ? (
        <LessonArloSheet
          open
          onClose={() => setArloOpen(false)}
          lessonId={lesson.id}
          lessonTitle={lesson.title}
        />
      ) : null}
    </div>
  );
}
