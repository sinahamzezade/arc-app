"use client";

import { CheckCircle2 } from "lucide-react";
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
      className="min-h-0 flex-1 overflow-y-auto"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-black tracking-widest text-arc-lavender-600 uppercase">
          {isTakeaways ? "Wrap-up" : `Beat ${step + 1} of ${total}`}
        </p>
        <h2 className="mt-0.5 font-display text-[20px] leading-tight font-bold tracking-[-0.03em] text-[#1b1730] text-balance">
          {isTakeaways ? "Key takeaways" : sectionTitle}
        </h2>
      </div>

      <div className="mt-3 space-y-2.5">
        {isTakeaways
          ? takeaways.map((takeaway, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-arc-md border border-[#ebe4f6] bg-white p-3.5"
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
                  className="rounded-arc-md border border-[#ebe4f6] bg-white p-3.5 text-[14px] leading-relaxed font-bold text-[#0f1220] text-pretty"
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
      <aside className="rounded-arc-md border border-arc-purple-500/20 bg-arc-purple-500/5 p-3.5">
        {block.title ? (
          <p className="text-[11px] font-extrabold tracking-[0.08em] text-arc-purple-500 uppercase">
            {block.title}
          </p>
        ) : null}
        <InlineMarkdown
          as="p"
          text={block.body ?? ""}
          className="mt-1 text-[14px] leading-snug font-bold text-[#1b1730] text-pretty"
        />
      </aside>
    );
  }
  if (block.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-arc-md bg-[#0f1220] p-3.5 text-[12px] leading-relaxed font-mono text-[#e8e4ff]">
        {block.code ?? block.body}
      </pre>
    );
  }
  return (
    <InlineMarkdown
      as="p"
      text={block.body ?? ""}
      className="rounded-arc-md border border-[#ebe4f6] bg-white p-3.5 text-[14px] leading-relaxed font-bold text-[#0f1220] text-pretty"
    />
  );
}
