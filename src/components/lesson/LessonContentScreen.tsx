"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Lightbulb, Terminal } from "lucide-react";
import { motion } from "motion/react";
import { getLesson, type LessonContentBlock } from "@/lib/lesson/mock-data";
import { useLessonStore } from "@/store/useLessonStore";
import { LessonPrimaryButton, LessonShell } from "./LessonShell";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Lesson content pager — night chrome + clay study sheet.
 * Text / Arlo vault / code terminal. No decorative rotate.
 */
export default function LessonContentScreen({
  lessonId,
}: {
  lessonId: string;
}) {
  const router = useRouter();
  const lesson = getLesson(lessonId);
  const contentStep = useLessonStore((s) => s.contentStep);
  const setContentStep = useLessonStore((s) => s.setContentStep);

  if (!lesson) {
    return (
      <LessonShell
        lessonId={lessonId}
        stepLabel="Missing"
        progress={0}
        showArlo={false}
      >
        <LessonPrimaryButton href="/learn">Back to Learn</LessonPrimaryButton>
      </LessonShell>
    );
  }

  const page = lesson.content[contentStep] ?? lesson.content[0];
  const total = lesson.content.length;
  const isLast = contentStep >= total - 1;
  const progress = 15 + ((contentStep + 1) / total) * 35;

  return (
    <LessonShell
      lessonId={lesson.id}
      stepLabel={`Learn · ${contentStep + 1}/${total}`}
      progress={progress}
      onBack={() => {
        if (contentStep > 0) setContentStep(contentStep - 1);
        else router.push(`/learn/${lesson.id}`);
      }}
    >
      <motion.div
        key={page.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
        className="flex flex-1 flex-col"
      >
        {/* Step notch + asymmetric title */}
        <div className="grid grid-cols-[auto_1fr] items-start gap-3">
          <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f1220] font-display text-[15px] font-bold text-[#ffc928] shadow-[0_3px_0_#2a2f45]">
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
          {page.blocks.map((block, i) => (
            <ContentBlock key={i} block={block} />
          ))}
        </div>

        <div className="mt-auto pt-8">
          <motion.div whileTap={{ scale: 0.98, y: 2 }} transition={softSpring}>
            {isLast ? (
              <LessonPrimaryButton href={`/learn/${lesson.id}/practice`}>
                Practice time
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </LessonPrimaryButton>
            ) : (
              <LessonPrimaryButton
                onClick={() => setContentStep(contentStep + 1)}
              >
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
  if (block.type === "text") {
    return (
      <p className="max-w-[22rem] text-[15px] leading-relaxed font-bold text-arc-lavender-700 text-pretty">
        {block.body}
      </p>
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
        <p className="relative z-[1] mt-2 text-[14px] leading-snug font-bold text-white/85 text-pretty">
          {block.body}
        </p>
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
