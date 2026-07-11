"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Clock,
  Code2,
  Columns2,
  Flag,
  Link2,
  Lock,
  Palette,
  Tag,
  TrendingUp,
  Trophy,
  VenetianMask,
} from "lucide-react";
import { motion } from "motion/react";
import {
  pathMockData,
  type PathIconName,
  type PathMockData,
  type PathNode,
} from "@/lib/path/mock-data";
import { cn } from "@/lib/utils";

const iconMap: Record<PathIconName, LucideIcon> = {
  flag: Flag,
  tag: Tag,
  "trend-up": TrendingUp,
  trophy: Trophy,
  link: Link2,
  mask: VenetianMask,
  lock: Lock,
  palette: Palette,
  columns: Columns2,
};

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };
const snappySpring = { type: "spring" as const, stiffness: 480, damping: 34 };

const pageStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: softSpring },
};

const timelineStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.02 },
  },
};

const timelineItem = {
  hidden: { opacity: 0, y: 12, x: -6 },
  visible: { opacity: 1, y: 0, x: 0, transition: softSpring },
};

export default function PathScreen({
  data = pathMockData,
}: {
  data?: PathMockData;
}) {
  const progress =
    data.lessonsTotal > 0
      ? Math.round((data.lessonsDone / data.lessonsTotal) * 100)
      : 0;

  const unit1 = data.nodes.filter((n) => n.unit === 1);
  const unit2 = data.nodes.filter((n) => n.unit === 2);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md bg-[#f7f4fc] font-rounded">
      <motion.div
        className="px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-36"
        variants={pageStagger}
        initial="hidden"
        animate="visible"
      >
        <PathHeader
          trackTitle={data.trackTitle}
          milestoneCount={data.milestoneCount}
          lessonsDone={data.lessonsDone}
          lessonsTotal={data.lessonsTotal}
          progress={progress}
        />

        <RankStrip rank={data.rank} />

        <PathTimeline unit1={unit1} unit2={unit2} />
      </motion.div>

      <UpNextDock upNext={data.upNext} />
    </div>
  );
}

function PathHeader({
  trackTitle,
  milestoneCount,
  lessonsDone,
  lessonsTotal,
  progress,
}: {
  trackTitle: string;
  milestoneCount: number;
  lessonsDone: number;
  lessonsTotal: number;
  progress: number;
}) {
  return (
    <motion.header className="mb-5" variants={fadeUp}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.06em] text-[#8a7cb8] uppercase">
            Career track
          </p>
          <h1 className="mt-1 font-display text-[26px] leading-none font-semibold tracking-[-0.03em] text-[#2b1b57]">
            Your Path
          </h1>
          <p className="mt-1.5 text-[13px] font-semibold text-[#8a7cb8]">
            {trackTitle} · {milestoneCount} milestones
          </p>
        </div>

        <motion.div
          className="shrink-0 rounded-2xl border border-[#ebe4f6] bg-white px-3 py-2 text-right"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={snappySpring}
        >
          <p className="font-display text-[16px] leading-none font-semibold text-[#2b1b57]">
            {lessonsDone}/{lessonsTotal}
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#8a7cb8]">lessons</p>
        </motion.div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#ebe4f6]">
        <motion.div
          className="h-full rounded-full bg-arc-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(progress, 2)}%` }}
          transition={{ ...softSpring, delay: 0.25 }}
        />
      </div>
    </motion.header>
  );
}

function RankStrip({ rank }: { rank: PathMockData["rank"] }) {
  return (
    <motion.div
      className="mb-6 flex items-center gap-3 rounded-2xl border border-[#ebe4f6] bg-white px-3.5 py-3"
      variants={fadeUp}
    >
      <motion.div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0ecff]"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Flag className="h-5 w-5 text-arc-purple-500" strokeWidth={2.25} />
      </motion.div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-[#8a7cb8]">
          Level {rank.level}
        </p>
        <p className="truncate font-display text-[16px] leading-tight font-semibold text-[#2b1b57]">
          {rank.title}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f6f2ff] px-2.5 py-1 text-[11px] font-bold text-arc-purple-500">
        <Code2 className="h-3.5 w-3.5" strokeWidth={2.5} />
        {rank.unitLabel}
      </span>
    </motion.div>
  );
}

function PathTimeline({
  unit1,
  unit2,
}: {
  unit1: PathNode[];
  unit2: PathNode[];
}) {
  return (
    <motion.div className="space-y-8" variants={fadeUp}>
      <UnitSection label="Unit 1 · Foundations" nodes={unit1} active />
      <UnitSection label="Unit 2 · CSS & Layout" nodes={unit2} locked />
    </motion.div>
  );
}

function UnitSection({
  label,
  nodes,
  active,
  locked,
}: {
  label: string;
  nodes: PathNode[];
  active?: boolean;
  locked?: boolean;
}) {
  return (
    <section className={cn(locked && "opacity-55")}>
      <div className="mb-4 flex items-center gap-2">
        <h2
          className={cn(
            "text-[12px] font-bold tracking-[0.04em] uppercase",
            active ? "text-arc-purple-500" : "text-[#8a7cb8]",
          )}
        >
          {label}
        </h2>
        <div className="h-px flex-1 bg-[#ebe4f6]" />
        {locked ? (
          <Lock className="h-3.5 w-3.5 text-[#b3a8d6]" strokeWidth={2.5} />
        ) : null}
      </div>

      <motion.ol
        className="relative space-y-0"
        variants={timelineStagger}
        initial="hidden"
        animate="visible"
      >
        {nodes.map((node, index) => (
          <TimelineItem
            key={node.id}
            node={node}
            isLast={index === nodes.length - 1}
          />
        ))}
      </motion.ol>
    </section>
  );
}

function TimelineItem({
  node,
  isLast,
}: {
  node: PathNode;
  isLast: boolean;
}) {
  const Icon = iconMap[node.icon];
  const isCurrent = node.status === "current";
  const isMilestone = node.status === "milestone";
  const isGate = node.status === "unit-locked";

  return (
    <motion.li className="relative flex gap-3.5" variants={timelineItem}>
      {!isLast ? (
        <span
          aria-hidden
          className="absolute top-10 bottom-0 left-[17px] w-px bg-[#ebe4f6]"
        />
      ) : null}

      <div className="relative z-[1] flex w-9 shrink-0 justify-center pt-1">
        {isCurrent ? (
          <motion.span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-arc-purple-500"
            animate={{
              boxShadow: [
                "0 0 0 4px rgba(107,78,255,0.16)",
                "0 0 0 10px rgba(107,78,255,0)",
                "0 0 0 4px rgba(107,78,255,0.16)",
              ],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
          </motion.span>
        ) : isMilestone ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-[#e8c56a] bg-[#fff8e8]">
            <Icon className="h-4 w-4 text-[#c79a2e]" strokeWidth={2.25} />
          </span>
        ) : isGate ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efe9f8]">
            <Lock className="h-4 w-4 text-[#b3a8d6]" strokeWidth={2.25} />
          </span>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-[#ebe4f6]">
            <Icon className="h-4 w-4 text-[#b3a8d6]" strokeWidth={2.25} />
          </span>
        )}
      </div>

      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-4")}>
        {isCurrent ? (
          <CurrentNodeCard node={node} Icon={Icon} />
        ) : isMilestone ? (
          <div className="rounded-2xl border border-dashed border-[#ead7a0] bg-[#fffbf0] px-3.5 py-3">
            <p className="text-[10px] font-bold tracking-[0.06em] text-[#c79a2e] uppercase">
              Milestone
            </p>
            <p className="mt-0.5 font-display text-[15px] font-semibold text-[#2b1b57]">
              {node.title}
            </p>
          </div>
        ) : isGate ? (
          <div className="rounded-2xl border border-[#ebe4f6] bg-white px-3.5 py-3">
            <p className="text-[10px] font-bold tracking-[0.06em] text-[#b3a8d6] uppercase">
              Locked chapter
            </p>
            <p className="mt-0.5 font-display text-[15px] font-semibold text-[#8a7cb8]">
              {node.title}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-[#ebe4f6] bg-white px-3.5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[15px] font-semibold text-[#8a7cb8]">
                {node.title}
              </p>
              <p className="text-[12px] font-semibold text-[#c6bce0]">
                {node.subtitle}
              </p>
            </div>
            {node.showLock !== false ? (
              <Lock className="h-3.5 w-3.5 shrink-0 text-[#c6bce0]" strokeWidth={2.5} />
            ) : null}
          </div>
        )}
      </div>
    </motion.li>
  );
}

function CurrentNodeCard({
  node,
  Icon,
}: {
  node: PathNode;
  Icon: LucideIcon;
}) {
  return (
    <Link href="/learn/lesson-1" className="block">
      <motion.div
        className="rounded-2xl border border-arc-purple-200 bg-white p-3.5 shadow-[0_10px_28px_rgba(107,78,255,0.1)]"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={snappySpring}
        whileTap={{ scale: 0.985 }}
      >
        <div className="flex items-center justify-between gap-2">
          <motion.span
            className="rounded-full bg-arc-purple-500 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.04em] text-white uppercase"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            Up next
          </motion.span>
          <span className="text-[12px] font-bold text-arc-purple-500">
            {node.subtitle}
          </span>
        </div>
        <div className="mt-2.5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0ecff]">
            <Icon className="h-5 w-5 text-arc-purple-500" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-[17px] leading-tight font-semibold text-[#2b1b57]">
              {node.title}
            </p>
            <p className="mt-1 text-[12px] font-semibold text-[#8a7cb8]">
              Start here — unlocks the rest of Unit 1
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function UpNextDock({ upNext }: { upNext: PathMockData["upNext"] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom)+8px)] z-20 mx-auto w-full max-w-md px-5">
      <motion.div
        className="pointer-events-auto rounded-2xl border border-[#ebe4f6] bg-white/95 p-3.5 shadow-[0_12px_32px_rgba(70,40,150,0.12)] backdrop-blur-xl"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...softSpring, delay: 0.35 }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#8a7cb8]">
              Lesson {upNext.lessonNumber}
            </p>
            <p className="truncate font-display text-[16px] font-semibold text-[#2b1b57]">
              {upNext.title}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#8a7cb8]">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
            {upNext.minutes}m
          </span>
        </div>

        <motion.div whileTap={{ scale: 0.98, y: 1 }} transition={snappySpring}>
          <Link
            href={upNext.href}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-arc-purple-500 py-3 font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#4b2fd6]"
          >
            Start lesson
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
