"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { getLesson } from "@/lib/lesson/mock-data";
import { useLessonStore } from "@/store/useLessonStore";
import { LessonPrimaryButton, LessonShell } from "./LessonShell";

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
      <LessonShell lessonId={lessonId} stepLabel="Missing" progress={0} showArlo={false}>
        <LessonPrimaryButton href="/path">Back to Path</LessonPrimaryButton>
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
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="flex flex-1 flex-col"
      >
        <h1 className="font-display text-[26px] leading-tight font-bold tracking-[-0.03em] text-[#2b1b57]">
          {page.title}
        </h1>

        <div className="mt-5 space-y-3">
          {page.blocks.map((block, i) => {
            if (block.type === "text") {
              return (
                <p
                  key={i}
                  className="text-[15px] leading-relaxed font-semibold text-[#4a3d78]"
                >
                  {block.body}
                </p>
              );
            }
            if (block.type === "callout") {
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-arc-purple-200 bg-[#f6f2ff] px-4 py-3.5"
                >
                  <p className="text-[11px] font-bold tracking-[0.06em] text-arc-purple-500 uppercase">
                    {block.title}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[#2b1b57]">
                    {block.body}
                  </p>
                </div>
              );
            }
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-[#ebe4f6] bg-[#1b1433]"
              >
                <div className="border-b border-white/10 px-3.5 py-2 text-[11px] font-bold tracking-[0.05em] text-white/50 uppercase">
                  {block.label}
                </div>
                <pre className="overflow-x-auto p-3.5 font-mono text-[12px] leading-relaxed whitespace-pre text-[#e8e0ff]">
                  {block.code}
                </pre>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-8">
          {isLast ? (
            <LessonPrimaryButton href={`/learn/${lesson.id}/practice`}>
              Practice time
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </LessonPrimaryButton>
          ) : (
            <LessonPrimaryButton
              onClick={() => setContentStep(contentStep + 1)}
            >
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </LessonPrimaryButton>
          )}
        </div>
      </motion.div>
    </LessonShell>
  );
}
