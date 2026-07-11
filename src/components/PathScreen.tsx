"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Clock,
  Columns2,
  Flag,
  Link2,
  Lock,
  Map as MapIcon,
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

const trailStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

const trailItem = {
  hidden: { opacity: 0, y: 22, scale: 0.94 },
  visible: { opacity: 1, y: 0, scale: 1, transition: softSpring },
};

/**
 * Path = night trail map. Zigzag stones. Current island holds CTA.
 * Not a vertical timeline. Not a sticky dock.
 */
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
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded">
      <TrailHero data={data} progress={progress} />

      <div className="relative -mt-8 px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom)+24px)]">
        <ChapterBanner
          chapter={1}
          title="Foundations"
          active
          count={unit1.length}
        />

        <motion.ol
          className="relative mt-2"
          variants={trailStagger}
          initial="hidden"
          animate="visible"
        >
          {/* trail spine */}
          <span
            aria-hidden
            className="absolute top-6 bottom-6 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#c9b8ff_0%,#ebe4f6_40%,#ebe4f6_100%)]"
          />

          {unit1.map((node, i) => (
            <TrailStone
              key={node.id}
              node={node}
              side={i % 2 === 0 ? "left" : "right"}
              upNext={data.upNext}
              index={i}
            />
          ))}
        </motion.ol>

        <ChapterBanner
          chapter={2}
          title="CSS & Layout"
          locked
          count={unit2.length}
        />

        <motion.ol
          className="relative mt-2 opacity-55"
          variants={trailStagger}
          initial="hidden"
          animate="visible"
        >
          <span
            aria-hidden
            className="absolute top-6 bottom-6 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-[#e3dbf5]"
          />
          {unit2.map((node, i) => (
            <TrailStone
              key={node.id}
              node={node}
              side={i % 2 === 0 ? "right" : "left"}
              upNext={data.upNext}
              index={i}
            />
          ))}
        </motion.ol>
      </div>
    </div>
  );
}

function TrailHero({
  data,
  progress,
}: {
  data: PathMockData;
  progress: number;
}) {
  return (
    <header className="relative overflow-hidden bg-[#0f1220] px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-16 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-arc-purple-500/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 -left-16 h-40 w-40 rounded-full bg-[#ffc928]/18 blur-3xl"
      />
      {/* star dust */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 12% 28%, #fff, transparent), radial-gradient(1px 1px at 78% 18%, #fff, transparent), radial-gradient(1.5px 1.5px at 62% 52%, #fff, transparent), radial-gradient(1px 1px at 30% 70%, #fff, transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
        className="relative"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-[0.1em] text-[#f0d9a8] uppercase">
              <MapIcon className="h-3 w-3" strokeWidth={2.5} />
              Career trail
            </p>
            <h1 className="mt-3 font-display text-[34px] leading-[0.95] font-bold tracking-[-0.04em]">
              Your Path
            </h1>
            <p className="mt-2 text-[14px] font-bold text-white/55">
              {data.trackTitle}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
            <p className="font-display text-[18px] leading-none font-bold">
              {data.lessonsDone}/{data.lessonsTotal}
            </p>
            <p className="mt-1 text-[10px] font-bold text-white/50">lessons</p>
          </div>
        </div>

        <div className="mt-5 flex items-end gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-extrabold">
              <span className="text-white/50">Trail progress</span>
              <span className="text-[#ffc928]">{Math.max(progress, 0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,#6b4eff,#ffc928)]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progress, 3)}%` }}
                transition={{ ...softSpring, delay: 0.2 }}
              />
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] font-extrabold tracking-wide text-white/45 uppercase">
              Rank
            </p>
            <p className="mt-0.5 font-display text-[14px] font-bold text-white">
              {data.rank.title}
            </p>
          </div>
        </div>
      </motion.div>
    </header>
  );
}

function ChapterBanner({
  chapter,
  title,
  active,
  locked,
  count,
}: {
  chapter: number;
  title: string;
  active?: boolean;
  locked?: boolean;
  count: number;
}) {
  return (
    <div
      className={cn(
        "relative z-[2] mb-1 flex items-center gap-3 rounded-[20px] px-4 py-3",
        active &&
          "bg-white shadow-[0_12px_28px_rgba(70,40,150,0.1)] ring-1 ring-[#ebe4f6]",
        locked && "border border-dashed border-[#d5ccec] bg-white/70",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-[18px] font-bold",
          active && "bg-arc-purple-500 text-white shadow-[0_4px_0_#4b2fd6]",
          locked && "bg-[#efe9f8] text-[#b3a8d6]",
        )}
      >
        {locked ? <Lock className="h-4 w-4" strokeWidth={2.5} /> : chapter}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[10px] font-extrabold tracking-[0.08em] uppercase",
            active ? "text-arc-purple-500" : "text-[#b3a8d6]",
          )}
        >
          Unit {chapter}
        </p>
        <p
          className={cn(
            "font-display text-[17px] leading-tight font-semibold",
            active ? "text-[#1b1730]" : "text-[#8a7cb8]",
          )}
        >
          {title}
        </p>
      </div>
      <span className="text-[11px] font-bold text-[#8a7cb8]">{count} stops</span>
    </div>
  );
}

function TrailStone({
  node,
  side,
  upNext,
  index,
}: {
  node: PathNode;
  side: "left" | "right";
  upNext: PathMockData["upNext"];
  index: number;
}) {
  const Icon = iconMap[node.icon];
  const isCurrent = node.status === "current";
  const isMilestone = node.status === "milestone";
  const isGate = node.status === "unit-locked";
  const alignLeft = side === "left";

  return (
    <motion.li
      variants={trailItem}
      className={cn(
        "relative flex py-3",
        alignLeft ? "justify-start pr-[18%]" : "justify-end pl-[18%]",
      )}
    >
      {/* connector nub on spine */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-1/2 z-[1] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white",
          isCurrent && "bg-arc-purple-500 shadow-[0_0_0_6px_rgba(107,78,255,0.2)]",
          isMilestone && "bg-[#ffc928]",
          !isCurrent && !isMilestone && "bg-[#d5ccec]",
        )}
      />

      {isCurrent ? (
        <CurrentIsland node={node} Icon={Icon} upNext={upNext} />
      ) : isMilestone ? (
        <MilestoneIsland node={node} Icon={Icon} />
      ) : isGate ? (
        <GateIsland node={node} />
      ) : (
        <LockedIsland node={node} Icon={Icon} delay={index * 0.02} />
      )}
    </motion.li>
  );
}

function CurrentIsland({
  node,
  Icon,
  upNext,
}: {
  node: PathNode;
  Icon: LucideIcon;
  upNext: PathMockData["upNext"];
}) {
  return (
    <motion.div
      className="relative z-[2] w-[78%] overflow-hidden rounded-[26px] bg-arc-purple-500 p-4 text-white shadow-[0_10px_0_#4b2fd6,0_18px_36px_rgba(75,47,214,0.35)]"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-6 h-28 w-28 rounded-full bg-white/15"
      />
      <div className="relative flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
          <Icon className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black tracking-[0.1em] text-[#ffc928] uppercase">
            You are here · {node.subtitle}
          </p>
          <h3 className="mt-1 font-display text-[20px] leading-tight font-bold tracking-[-0.02em]">
            {upNext.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[12px] font-bold text-white/70">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
            {upNext.minutes}m · {node.title}
          </p>
        </div>
      </div>

      <motion.div
        className="relative mt-4"
        whileTap={{ scale: 0.98, y: 2 }}
        transition={snappySpring}
      >
        <Link
          href={upNext.href}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-display text-[15px] font-semibold text-arc-purple-700 shadow-[0_6px_16px_rgba(0,0,0,0.18)]"
        >
          Start lesson
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </motion.div>
    </motion.div>
  );
}

function MilestoneIsland({
  node,
  Icon,
}: {
  node: PathNode;
  Icon: LucideIcon;
}) {
  return (
    <div className="relative z-[2] w-[70%] rounded-[24px] border border-[#ead7a0] bg-[linear-gradient(145deg,#fffbf0,#fff3d0)] px-4 py-3.5 shadow-[0_8px_20px_rgba(199,154,46,0.15)]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ffc928] text-[#1b1730] shadow-[0_4px_0_#c79a2e]">
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold tracking-[0.08em] text-[#c79a2e] uppercase">
            Milestone
          </p>
          <p className="font-display text-[16px] font-semibold text-[#1b1730]">
            {node.title}
          </p>
        </div>
      </div>
    </div>
  );
}

function GateIsland({ node }: { node: PathNode }) {
  return (
    <div className="relative z-[2] w-[72%] rounded-[24px] border border-dashed border-[#d5ccec] bg-white px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#efe9f8] text-[#b3a8d6]">
          <Lock className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold tracking-[0.08em] text-[#b3a8d6] uppercase">
            Chapter lock
          </p>
          <p className="font-display text-[16px] font-semibold text-[#8a7cb8]">
            {node.title}
          </p>
        </div>
      </div>
    </div>
  );
}

function LockedIsland({
  node,
  Icon,
}: {
  node: PathNode;
  Icon: LucideIcon;
  delay?: number;
}) {
  return (
    <div className="relative z-[2] w-[68%] rounded-[22px] border border-[#ebe4f6] bg-white px-3.5 py-3 shadow-[0_6px_16px_rgba(70,40,150,0.05)]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0ecf7] text-[#b3a8d6]">
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold text-[#8a7cb8]">
            {node.title}
          </p>
          <p className="text-[11px] font-bold text-[#c6bce0]">{node.subtitle}</p>
        </div>
        {node.showLock !== false ? (
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#c6bce0]" strokeWidth={2.5} />
        ) : null}
      </div>
    </div>
  );
}
