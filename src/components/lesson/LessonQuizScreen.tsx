"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { getLesson } from "@/lib/lesson/mock-data";
import { useLessonStore } from "@/store/useLessonStore";
import {
  LessonOptionCard,
  LessonPrimaryButton,
  LessonShell,
} from "./LessonShell";

export default function LessonQuizScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const lesson = getLesson(lessonId);
  const quizIndex = useLessonStore((s) => s.quizIndex);
  const quizAnswers = useLessonStore((s) => s.quizAnswers);
  const setQuizAnswer = useLessonStore((s) => s.setQuizAnswer);
  const setQuizIndex = useLessonStore((s) => s.setQuizIndex);
  const [revealed, setRevealed] = useState(false);

  if (!lesson) {
    return (
      <LessonShell lessonId={lessonId} stepLabel="Missing" progress={0} showArlo={false}>
        <LessonPrimaryButton href="/path">Back to Path</LessonPrimaryButton>
      </LessonShell>
    );
  }

  const question = lesson.quiz[quizIndex];
  const total = lesson.quiz.length;
  const selected = quizAnswers[question.id] ?? null;
  const isCorrect = selected === question.correctOptionId;
  const isLast = quizIndex >= total - 1;
  const progress = 65 + ((quizIndex + 1) / total) * 25;

  return (
    <LessonShell
      lessonId={lesson.id}
      stepLabel={`Quiz · ${quizIndex + 1}/${total}`}
      progress={progress}
      onBack={() => {
        if (quizIndex > 0) {
          setRevealed(false);
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
          {question.prompt}
        </h1>

        <div className="mt-5 space-y-2.5">
          {question.options.map((option) => (
            <LessonOptionCard
              key={option.id}
              label={option.label}
              selected={selected === option.id}
              correct={option.id === question.correctOptionId}
              revealed={revealed}
              onSelect={() => {
                if (revealed) return;
                setQuizAnswer(question.id, option.id);
              }}
            />
          ))}
        </div>

        {revealed ? (
          <p className="mt-4 text-[14px] font-semibold text-[#4a3d78]">
            {question.explanation}
          </p>
        ) : null}

        <div className="mt-auto space-y-2 pt-8">
          {!revealed ? (
            <LessonPrimaryButton
              disabled={!selected}
              onClick={() => setRevealed(true)}
            >
              Check
            </LessonPrimaryButton>
          ) : isLast ? (
            <LessonPrimaryButton href={`/learn/${lesson.id}/reward`}>
              Claim reward
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </LessonPrimaryButton>
          ) : (
            <LessonPrimaryButton
              onClick={() => {
                setRevealed(false);
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
