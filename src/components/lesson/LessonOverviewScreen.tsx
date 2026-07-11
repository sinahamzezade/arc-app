"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
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
import { motion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import { assets } from "@/lib/assets";
import { getLesson } from "@/lib/lesson/mock-data";
import { useLessonStore } from "@/store/useLessonStore";
import { LessonPrimaryButton } from "./LessonShell";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

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
  const lesson = getLesson(lessonId);
  const startLesson = useLessonStore((s) => s.startLesson);

  useEffect(() => {
    if (lesson) startLesson(lesson.id);
  }, [lesson, startLesson]);

  if (!lesson) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
        <p className="text-center font-semibold text-arc-lavender-600">
          Lesson not found.
        </p>
        <LessonPrimaryButton href="/learn">Back to Learn</LessonPrimaryButton>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-24 text-white">
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
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 18% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 14%, #fff, transparent), radial-gradient(1.5px 1px at 55% 60%, #fff, transparent)",
          }}
        />

        {/* Top bar */}
        <header className="relative z-[1] flex items-center gap-3">
          <BackButton onClick={() => router.push("/learn")} />
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
          <Link
            href={`/learn/${lesson.id}/arlo`}
            aria-label="Ask Arlo"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-arc-purple-500 text-white shadow-[0_3px_0_var(--color-arc-purple-700)]"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
          </Link>
        </header>

        {/* Masthead + Arlo */}
        <div className="relative z-[1] mt-6 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="min-w-0 pb-1">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[#ffc928]/15 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.1em] text-[#ffc928] uppercase">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} />
              {lesson.missionName}
            </p>
            <h1 className="mt-3 font-display text-[34px] leading-[0.92] font-bold tracking-[-0.04em] text-balance">
              {lesson.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold ring-1 ring-white/15">
                <Clock className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
                {lesson.minutes} min
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ffc928]/15 px-2.5 py-1.5 text-[11px] font-extrabold text-[#ffc928]">
                <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />+
                {lesson.xpReward} XP
              </span>
            </div>
          </div>

          <motion.div
            className="relative -mr-1 mb-[-6px]"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
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

      {/* Sheet */}
      <div className="relative z-10 -mt-12 flex flex-1 flex-col rounded-t-[28px] bg-[#f3effc] px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        {/* Objective — night vault stamp */}
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

        {/* Resource — clay row, not nested card stack */}
        <a
          href={lesson.resource.href}
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
              {lesson.resource.label}
            </span>
            <span className="mt-1 block text-[12px] font-bold text-arc-lavender-700">
              {lesson.resource.note}
            </span>
          </span>
        </a>

        <div className="mt-auto pt-6">
          <motion.div whileTap={{ scale: 0.98, y: 2 }} transition={softSpring}>
            <LessonPrimaryButton
              href={`/learn/${lesson.id}/content`}
              className="rounded-[18px] py-4 text-[16px] shadow-[0_5px_0_var(--color-arc-purple-700)]"
            >
              Start lesson
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </LessonPrimaryButton>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
