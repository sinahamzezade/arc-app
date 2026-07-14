"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Lock,
  Map,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { BackButton } from "@/components/BackButton";
import { useCurrentRoadmap } from "@/hooks/useCurrentRoadmap";
import { mapRoadmapToPathData } from "@/lib/path/map-roadmap";
import type { PathNode } from "@/lib/path/types";
import { cn } from "@/lib/utils";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Learn desk — night-hero family.
 * Up-next mission + unit lesson queue from current roadmap.
 */
export default function LearnScreen() {
  const { data: roadmapRes, isLoading } = useCurrentRoadmap();
  const roadmap = roadmapRes?.roadmap ?? null;

  if (isLoading && !roadmap) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-[#f3effc] font-rounded">
        <p className="font-display text-[18px] font-bold text-[#1b1730]">
          Loading path…
        </p>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f3effc] px-6 font-rounded">
        <p className="text-center font-display text-[20px] font-bold text-[#1b1730]">
          No learning path yet
        </p>
        <p className="text-center text-[13px] font-semibold text-[#8a7cb8]">
          Finish the questionnaire to generate your path.
        </p>
        <Link
          href="/path"
          className="rounded-full bg-[#0f1220] px-5 py-2.5 text-[13px] font-black text-white"
        >
          Open Path
        </Link>
      </div>
    );
  }

  const data = mapRoadmapToPathData(roadmap);

  const progress =
    data.lessonsTotal > 0
      ? Math.round((data.lessonsDone / data.lessonsTotal) * 100)
      : 0;
  const unitLessons = data.nodes.filter(
    (n) => n.unit === 1 && n.kind === "lesson",
  );
  const milestone = data.nodes.find(
    (n) => n.unit === 1 && n.kind === "milestone",
  );

  const firstUnit = data.nodes.find((n) => n.unit === 1 && n.kind === "lesson");
  const unitTitle = data.rank.title || firstUnit?.title || "Foundations";

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

        <header className="relative z-[1] flex items-start gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Learn desk
            </p>
            <p className="mt-0.5 truncate text-[13px] font-bold text-white/45">
              {isLoading
                ? "Loading path…"
                : `${data.trackTitle} · ${data.rank.unitLabel}`}
            </p>
          </div>
          <Link
            href="/path"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-[12px] font-extrabold text-white ring-1 ring-white/15"
          >
            <Map className="h-3.5 w-3.5" strokeWidth={2.5} />
            Path
          </Link>
        </header>

        <div className="relative z-[1] mt-6">
          <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
            Up next · Lesson {data.upNext.lessonNumber}
          </p>
          <h1 className="mt-1.5 font-display text-[36px] leading-[0.9] font-bold tracking-[-0.04em] text-balance">
            {data.upNext.title}
          </h1>
          <p className="mt-3 max-w-[18rem] text-[13px] leading-snug font-bold text-white/60 text-pretty">
            Open the lesson, learn the bits, practice, then cash the reward.
          </p>
        </div>

        <div className="relative z-[1] mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold ring-1 ring-white/15">
            <Clock className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
            {data.upNext.minutes} min
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold text-white/70 ring-1 ring-white/15">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2.5} />
            {data.rank.title}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ffc928]/15 px-3 py-1.5 text-[11px] font-extrabold text-[#ffc928]">
            <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
            Track {progress}%
          </span>
        </div>

        <div className="relative z-[1] mt-6">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-extrabold tracking-wide text-white/40 uppercase">
            <span>Track</span>
            <span className="tabular-nums text-[#ffc928]">
              {data.lessonsDone}/{data.lessonsTotal} · {progress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-arc-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progress, 4)}%` }}
              transition={softSpring}
            />
          </div>
        </div>

        <motion.div
          className="relative z-[1] mt-6"
          whileTap={{ scale: 0.98, y: 2 }}
          transition={softSpring}
        >
          <Link
            href={data.upNext.href}
            className="flex h-[54px] w-full items-center justify-between rounded-[18px] bg-[#ffc928] px-4 text-[#0f1220] shadow-[0_5px_0_#c79a2e]"
          >
            <span className="font-display text-[16px] font-bold">
              Continue lesson
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f1220]/15">
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </span>
          </Link>
        </motion.div>
      </section>

      <div className="relative z-10 -mt-12 flex-1 rounded-t-[28px] bg-[#f3effc] px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+28px)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.14em] text-arc-lavender-500 uppercase">
              Unit 1 queue
            </p>
            <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#0f1220]">
              {unitTitle}
            </h2>
          </div>
          <span className="whitespace-nowrap rounded-full bg-[#0f1220] px-2.5 py-1 text-[10px] font-black tracking-wide text-[#ffc928] uppercase">
            {unitLessons.filter((n) => n.status === "current").length} live
          </span>
        </div>

        <ul className="space-y-2.5">
          {unitLessons.map((node, i) => (
            <LessonQueueRow
              key={node.id}
              node={node}
              index={i + 1}
              href={node.status === "current" ? `/learn/${node.id}` : undefined}
              minutes={
                node.status === "current" ? data.upNext.minutes : undefined
              }
            />
          ))}
        </ul>

        {milestone ? (
          <div className="mt-3 flex items-center gap-3 rounded-[18px] border-2 border-dashed border-[#ffc928]/60 bg-[#fff9e6] px-3.5 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ffc928] text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black tracking-[0.1em] text-[#855300] uppercase">
                Milestone
              </p>
              <p className="font-display text-[15px] font-bold text-[#0f1220]">
                {milestone.title}
              </p>
            </div>
            <Lock className="h-4 w-4 text-[#c79a2e]" strokeWidth={2.5} />
          </div>
        ) : null}

        <Link
          href="/path"
          className="mt-5 flex h-12 items-center justify-center gap-2 rounded-[16px] text-[13px] font-extrabold text-arc-lavender-700"
        >
          Open full path
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}

function LessonQueueRow({
  node,
  index,
  href,
  minutes,
}: {
  node: PathNode;
  index: number;
  href?: string;
  minutes?: number;
}) {
  const live = node.status === "current" && href;
  const inner = (
    <>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-display text-[14px] font-bold",
          live
            ? "bg-arc-purple-500 text-white shadow-[0_3px_0_var(--color-arc-purple-700)]"
            : "bg-[#efe9f8] text-arc-lavender-500",
        )}
      >
        {index}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-bold text-[#0f1220]">
          {node.title}
        </span>
        <span className="mt-0.5 block text-[12px] font-bold text-arc-lavender-600">
          {minutes != null ? `${minutes} min · ready` : node.subtitle}
        </span>
      </span>
      {live ? (
        <ArrowRight className="h-4 w-4 text-arc-purple-500" strokeWidth={2.5} />
      ) : (
        <Lock className="h-4 w-4 text-arc-lavender-400" strokeWidth={2.5} />
      )}
    </>
  );

  if (live) {
    return (
      <li>
        <Link
          href={href}
          className="flex items-center gap-3 rounded-[18px] border-2 border-arc-purple-500/30 bg-white p-3 shadow-[0_4px_0_#ebe4f6]"
        >
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-[18px] border-2 border-[#ebe4f6] bg-white/70 p-3 opacity-70">
      {inner}
    </li>
  );
}
