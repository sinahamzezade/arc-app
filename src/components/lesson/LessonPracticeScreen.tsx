"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lightbulb } from "lucide-react";
import { motion } from "motion/react";
import { getLesson } from "@/lib/lesson/mock-data";
import { useLessonStore } from "@/store/useLessonStore";
import {
  LessonOptionCard,
  LessonPrimaryButton,
  LessonShell,
} from "./LessonShell";

export default function LessonPracticeScreen({
  lessonId,
}: {
  lessonId: string;
}) {
  const router = useRouter();
  const lesson = getLesson(lessonId);
  const selected = useLessonStore((s) => s.practiceOptionId);
  const setPracticeOption = useLessonStore((s) => s.setPracticeOption);
  const [revealed, setRevealed] = useState(false);

  if (!lesson) {
    return (
      <LessonShell lessonId={lessonId} stepLabel="Missing" progress={0} showArlo={false}>
        <LessonPrimaryButton href="/path">Back to Path</LessonPrimaryButton>
      </LessonShell>
    );
  }

  const practice = lesson.practice;
  const correct = practice.options.find((o) => o.correct);
  const isCorrect = selected === correct?.id;

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
          {practice.prompt}
        </h1>

        <div className="mt-5 space-y-2.5">
          {practice.options.map((option) => (
            <LessonOptionCard
              key={option.id}
              label={option.label}
              selected={selected === option.id}
              correct={option.correct}
              revealed={revealed}
              onSelect={() => {
                if (revealed) return;
                setPracticeOption(option.id);
              }}
            />
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#fff8e8] px-3.5 py-3 text-[13px] font-semibold text-[#8a6a1e]">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
          {practice.hint}
        </div>

        {revealed ? (
          <p
            className={`mt-4 text-[14px] font-bold ${isCorrect ? "text-[#1f6b2e]" : "text-[#9a4a12]"}`}
          >
            {isCorrect
              ? "Nailed it — tags closed clean."
              : "Close! Opening + text + closing slash is the move."}
          </p>
        ) : null}

        <div className="mt-auto space-y-2 pt-8">
          {!revealed ? (
            <LessonPrimaryButton
              disabled={!selected}
              onClick={() => setRevealed(true)}
            >
              Check answer
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
