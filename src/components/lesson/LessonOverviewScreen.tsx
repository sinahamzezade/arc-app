"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  ExternalLink,
  Sparkles,
  Target,
} from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { getLesson } from "@/lib/lesson/mock-data";
import { useLessonStore } from "@/store/useLessonStore";
import { LessonPrimaryButton, LessonShell } from "./LessonShell";

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
      <LessonShell lessonId={lessonId} stepLabel="Missing" progress={0} showArlo={false}>
        <p className="text-center font-semibold text-[#8a7cb8]">
          Lesson not found.
        </p>
        <LessonPrimaryButton href="/path" className="mt-6">
          Back to Path
        </LessonPrimaryButton>
      </LessonShell>
    );
  }

  return (
    <LessonShell
      lessonId={lesson.id}
      stepLabel={`Lesson ${lesson.lessonNumber}`}
      progress={8}
      onBack={() => router.push("/path")}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="flex flex-1 flex-col"
      >
        <div className="relative overflow-hidden rounded-[28px] bg-[#1b1433] px-5 pt-5 pb-6 text-white shadow-[0_18px_40px_rgba(27,20,51,0.22)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-8 h-36 w-36 rounded-full bg-arc-purple-500/35 blur-2xl"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-[0.08em] text-[#f0d9a8] uppercase">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                {lesson.missionName}
              </p>
              <h1 className="mt-3 font-display text-[28px] leading-[1.05] font-bold tracking-[-0.03em]">
                {lesson.title}
              </h1>
              <p className="mt-2 flex items-center gap-3 text-[13px] font-bold text-white/55">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {lesson.minutes}m
                </span>
                <span>+{lesson.xpReward} XP</span>
              </p>
            </div>
            <Image
              src={assets.arlo.thinking}
              alt=""
              width={72}
              height={72}
              className="h-[72px] w-[72px] shrink-0 object-contain"
            />
          </div>
        </div>

        <section className="mt-5 rounded-2xl border border-[#ebe4f6] bg-white p-4">
          <div className="flex items-center gap-2 text-arc-purple-500">
            <Target className="h-4 w-4" strokeWidth={2.5} />
            <h2 className="text-[12px] font-bold tracking-[0.05em] uppercase">
              Objective
            </h2>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed font-semibold text-[#2b1b57]">
            {lesson.objective}
          </p>
        </section>

        <section className="mt-3 rounded-2xl border border-[#ebe4f6] bg-white p-4">
          <h2 className="text-[12px] font-bold tracking-[0.05em] text-[#8a7cb8] uppercase">
            Resource
          </h2>
          <a
            href={lesson.resource.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-start gap-2 font-display text-[15px] font-semibold text-arc-purple-500"
          >
            <span className="min-w-0 flex-1">{lesson.resource.label}</span>
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
          </a>
          <p className="mt-1.5 text-[12px] font-semibold text-[#8a7cb8]">
            {lesson.resource.note}
          </p>
        </section>

        <p className="mt-4 text-center text-[13px] font-semibold text-[#8a7cb8]">
          {lesson.arloPrompt}
        </p>

        <div className="mt-auto pt-6">
          <LessonPrimaryButton href={`/learn/${lesson.id}/content`}>
            Start lesson
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </LessonPrimaryButton>
        </div>
      </motion.div>
    </LessonShell>
  );
}
