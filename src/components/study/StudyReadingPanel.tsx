"use client";

import { CheckCircle2, Lightbulb } from "lucide-react";
import { motion } from "motion/react";
import { InlineMarkdown } from "@/lib/lesson/inline-markdown";
import type { StudyContentDto } from "@/lib/api/study";
import type { LessonSectionBlockDto } from "@/lib/api/types";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

type Section =
  | string
  | {
      id: string;
      title: string;
      blocks: LessonSectionBlockDto[];
    };

export function StudyReadingPanel({
  content,
  lessonTitle,
}: {
  content: StudyContentDto;
  lessonTitle: string;
}) {
  const sections = (content.body.sections ?? []) as Section[];
  const takeaways = content.body.keyTakeaways ?? [];
  const hasTakeaways = takeaways.length > 0;
  const total = Math.max(sections.length + (hasTakeaways ? 1 : 0), 1);
  const step = Math.min(content.contentStep, total - 1);
  const isTakeaways = hasTakeaways && step === total - 1;
  const section = isTakeaways ? null : sections[step];
  const sectionTitle =
    typeof section === "string"
      ? `Section ${step + 1}`
      : section?.title?.trim() || lessonTitle;

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      <div className="grid grid-cols-[auto_1fr] items-start gap-3">
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f1220] font-display text-[15px] font-bold text-[#ffc928] shadow-[0_3px_0_#2a2f45]">
          {step + 1}
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-[10px] font-black tracking-[0.12em] text-arc-lavender-500 uppercase">
            {isTakeaways ? "Wrap-up" : `Beat ${step + 1} of ${total}`}
          </p>
          <h2 className="mt-1 font-display text-[24px] leading-[0.95] font-bold tracking-[-0.035em] text-[#0f1220] text-balance">
            {isTakeaways ? "Key takeaways" : sectionTitle}
          </h2>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {isTakeaways
          ? takeaways.map((takeaway, i) => (
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
          : typeof section === "string"
            ? (
                <InlineMarkdown
                  as="p"
                  text={section}
                  className="max-w-[28rem] text-[15px] leading-relaxed font-bold text-arc-lavender-700 text-pretty"
                />
              )
            : (section?.blocks ?? []).map((block, i) => (
                <Block key={i} block={block} />
              ))}
      </div>
    </motion.div>
  );
}

function Block({ block }: { block: LessonSectionBlockDto }) {
  if (block.type === "callout") {
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
  }
  if (block.type === "code") {
    return (
      <div className="overflow-hidden rounded-[18px] bg-[#0f1220] shadow-[0_4px_0_#2a2f45]">
        <p className="border-b border-white/10 px-4 py-2 text-[10px] font-extrabold tracking-[0.12em] text-[#ffc928] uppercase">
          {block.label?.trim() || "Code"}
        </p>
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-white/90">
          <code>{block.code ?? block.body ?? ""}</code>
        </pre>
      </div>
    );
  }
  return (
    <InlineMarkdown
      as="p"
      text={block.body ?? ""}
      className="max-w-[28rem] text-[15px] leading-relaxed font-bold text-arc-lavender-700 text-pretty"
    />
  );
}
