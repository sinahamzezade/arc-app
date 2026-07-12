"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  Clock,
  Columns2,
  Compass,
  Flag,
  Link2,
  Lock,
  Palette,
  Tag,
  TrendingUp,
  Trophy,
  VenetianMask,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import PathGateScreen from "@/components/path/PathGateScreen";
import { useCurrentRoadmap } from "@/hooks/useCurrentRoadmap";
import { messageForCode } from "@/lib/api/errors";
import { mapRoadmapToPathData } from "@/lib/path/map-roadmap";
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

/* ------------------------------------------------------------------ */
/* Road geometry — one continuous serpentine road in a 400-wide space */
/* ------------------------------------------------------------------ */

const MAP_W = 400;
const X_LEFT = 116;
const X_RIGHT = 284;
const X_CENTER = 200;

const H = {
  gantry: 118,
  stone: 96,
  milestone: 118,
  barrier: 104,
  current: 276,
  terminal: 116,
} as const;

type StoneVariant = "done" | "upcoming" | "current" | "milestone" | "barrier";

type TrailRow =
  | {
      kind: "gantry";
      key: string;
      unit: number;
      title: string;
      locked: boolean;
      count: number;
      top: number;
      h: number;
    }
  | {
      kind: "stone";
      key: string;
      node: PathNode;
      variant: StoneVariant;
      side: "left" | "right";
      top: number;
      h: number;
      ax: number;
      ay: number;
    }
  | {
      kind: "terminal";
      key: string;
      reached: boolean;
      top: number;
      h: number;
    };

interface Pt {
  x: number;
  y: number;
}

function variantOf(node: PathNode): StoneVariant {
  const s = node.status as string;
  if (s === "current") return "current";
  if (s === "milestone") return "milestone";
  if (s === "unit-locked") return "barrier";
  if (s === "done" || s === "completed" || s === "complete") return "done";
  return "upcoming";
}

/** Smooth vertical S-curves between consecutive road points. */
function roadPath(pts: Pt[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const my = (a.y + b.y) / 2;
    d += ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
  }
  return d;
}

function buildTrail(data: PathMockData) {
  const units = Array.from(new Set(data.nodes.map((n) => n.unit))).sort(
    (a, b) => a - b,
  );

  const rows: TrailRow[] = [];
  const builtPts: Pt[] = [];
  const plannedPts: Pt[] = [];
  let phase: "built" | "planned" = "built";
  let y = 0;
  let onLeft = true;

  const pushPt = (pt: Pt) => {
    if (phase === "built") {
      builtPts.push(pt);
    } else {
      if (plannedPts.length === 0 && builtPts.length > 0) {
        plannedPts.push(builtPts[builtPts.length - 1]);
      }
      plannedPts.push(pt);
    }
  };

  for (const unit of units) {
    const unitNodes = data.nodes.filter((n) => n.unit === unit);
    const gate = unitNodes.find((n) => n.kind === "unit-gate");
    const stones = unitNodes.filter((n) => n.kind !== "unit-gate");
    const locked =
      gate?.status === "unit-locked" ||
      (unit > 1 &&
        stones.every(
          (n) => n.status === "locked" || n.status === "unit-locked",
        ));
    const title =
      gate?.title ?? (unit === 1 ? data.rank.title : `Unit ${unit}`);

    if (locked && phase === "built") phase = "planned";

    rows.push({
      kind: "gantry",
      key: `gantry-${unit}`,
      unit,
      title,
      locked,
      count: stones.length,
      top: y,
      h: H.gantry,
    });
    pushPt({ x: X_CENTER, y: y + H.gantry - 14 });
    y += H.gantry;

    for (const node of stones) {
      const variant = variantOf(node);
      const h =
        variant === "current"
          ? H.current
          : variant === "milestone"
            ? H.milestone
            : variant === "barrier"
              ? H.barrier
              : H.stone;
      const ax = variant === "barrier" ? X_CENTER : onLeft ? X_LEFT : X_RIGHT;
      const ay = variant === "current" ? y + 46 : y + h / 2;

      if (variant === "barrier" && phase === "built") phase = "planned";

      rows.push({
        kind: "stone",
        key: node.id,
        node,
        variant,
        side: onLeft ? "left" : "right",
        top: y,
        h,
        ax,
        ay,
      });
      pushPt({ x: ax, y: ay });

      if (variant === "current") phase = "planned";
      if (variant !== "barrier") onLeft = !onLeft;
      y += h;
    }
  }

  const reached = phase === "built";
  rows.push({
    kind: "terminal",
    key: "terminal",
    reached,
    top: y,
    h: H.terminal,
  });
  pushPt({ x: X_CENTER, y: y + 34 });
  y += H.terminal;

  return {
    rows,
    totalH: y,
    builtD: roadPath(builtPts),
    plannedD: roadPath(plannedPts),
  };
}

/* ------------------------------------------------------------------ */
/* Screen — owns roadmap fetch + gate states, then the road map        */
/* ------------------------------------------------------------------ */

export default function PathScreen({
  data: dataProp,
}: {
  data?: PathMockData;
}) {
  const { data, isLoading, isError, error, refetch } = useCurrentRoadmap();

  if (dataProp) {
    return <RoadMap data={dataProp} />;
  }

  if (isLoading) {
    return <PathGateScreen kind="loading" />;
  }

  const job = data?.job;
  const roadmap = data?.roadmap;

  if (
    job &&
    (job.status === "queued" || job.status === "processing") &&
    !roadmap
  ) {
    return <PathGateScreen kind="building" />;
  }

  if (job?.status === "failed" && !roadmap) {
    const codeMsg = job.errorCode
      ? messageForCode(job.errorCode, job.errorMessage || "")
      : "";
    return (
      <PathGateScreen
        kind="failed"
        message={codeMsg || job.errorMessage || undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  if (isError || !roadmap) {
    return (
      <PathGateScreen
        kind="empty"
        message={
          error instanceof Error
            ? error.message
            : "Finish the questionnaire to generate your learning path."
        }
      />
    );
  }

  return <RoadMap data={mapRoadmapToPathData(roadmap) ?? pathMockData} />;
}

/* ------------------------------------------------------------------ */
/* Road map                                                            */
/* ------------------------------------------------------------------ */

function RoadMap({ data }: { data: PathMockData }) {
  const reduceMotion = useReducedMotion();
  const progress =
    data.lessonsTotal > 0
      ? Math.round((data.lessonsDone / data.lessonsTotal) * 100)
      : 0;

  const trail = useMemo(() => buildTrail(data), [data]);
  const nextStopKey = useMemo(
    () =>
      trail.rows.find((r) => r.kind === "stone" && r.variant === "current")
        ?.key ?? null,
    [trail.rows],
  );

  useEffect(() => {
    if (!nextStopKey) return;
    const el = document.getElementById(`path-stop-${nextStopKey}`);
    if (!el) return;

    const delay = reduceMotion ? 0 : 380;
    const id = window.setTimeout(() => {
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
        inline: "nearest",
      });
    }, delay);

    return () => window.clearTimeout(id);
  }, [nextStopKey, reduceMotion]);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded">
      <RouteHero data={data} progress={progress} />

      {/* The atlas sheet */}
      <div
        className="relative -mt-6 pb-[calc(5.25rem+env(safe-area-inset-bottom)+24px)]"
        style={{
          backgroundImage: [
            // contour rings — faint cartographic texture
            "radial-gradient(circle at 16% 9%, transparent 52px, rgba(107,78,255,0.055) 53px 55px, transparent 56px)",
            "radial-gradient(circle at 16% 9%, transparent 86px, rgba(107,78,255,0.045) 87px 89px, transparent 90px)",
            "radial-gradient(circle at 88% 38%, transparent 60px, rgba(107,78,255,0.05) 61px 63px, transparent 64px)",
            "radial-gradient(circle at 88% 38%, transparent 98px, rgba(107,78,255,0.04) 99px 101px, transparent 102px)",
            "radial-gradient(circle at 8% 72%, transparent 70px, rgba(107,78,255,0.045) 71px 73px, transparent 74px)",
            // graticule grid
            "linear-gradient(rgba(107,78,255,0.05) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(107,78,255,0.05) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "auto, auto, auto, auto, auto, 56px 56px, 56px 56px",
        }}
      >
        <motion.div
          className="relative mx-auto w-full"
          style={{ height: trail.totalH }}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.05, delayChildren: 0.15 },
            },
          }}
        >
          <RoadSvg
            builtD={trail.builtD}
            plannedD={trail.plannedD}
            totalH={trail.totalH}
            reduceMotion={!!reduceMotion}
          />

          {trail.rows.map((row) =>
            row.kind === "gantry" ? (
              <GantrySign key={row.key} row={row} />
            ) : row.kind === "terminal" ? (
              <FinishMarker
                key={row.key}
                row={row}
                lessonsTotal={data.lessonsTotal}
              />
            ) : row.variant === "current" ? (
              <CurrentPin key={row.key} row={row} upNext={data.upNext} />
            ) : row.variant === "milestone" ? (
              <MilestoneSign key={row.key} row={row} />
            ) : row.variant === "barrier" ? (
              <RoadClosed key={row.key} row={row} />
            ) : row.variant === "done" ? (
              <ClearedStop key={row.key} row={row} />
            ) : (
              <UpcomingStop key={row.key} row={row} />
            ),
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — night navigation header with route summary                   */
/* ------------------------------------------------------------------ */

function RouteHero({
  data,
  progress,
}: {
  data: PathMockData;
  progress: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-14 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-arc-purple-500/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 -left-16 h-40 w-40 rounded-full bg-[#ffc928]/18 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 12% 28%, #fff, transparent), radial-gradient(1px 1px at 78% 18%, #fff, transparent), radial-gradient(1.5px 1.5px at 62% 52%, #fff, transparent), radial-gradient(1px 1px at 30% 70%, #fff, transparent)",
        }}
      />

      {/* Off-axis watermark — route sheet mark */}
      <motion.p
        aria-hidden
        className="pointer-events-none absolute -right-2 top-8 select-none font-display text-[92px] leading-none font-bold tracking-[-0.08em] text-white/[0.06]"
        initial={reduceMotion ? false : { opacity: 0, rotate: 6 }}
        animate={{ opacity: 1, rotate: 10 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        ROUTE
      </motion.p>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
        className="relative"
      >
        <div className="grid grid-cols-12 items-start gap-2">
          <div className="col-span-8 min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              <Compass className="h-3.5 w-3.5" strokeWidth={2.5} />
              Career road map
            </p>
            <h1 className="mt-2 font-display text-[36px] leading-[0.92] font-bold tracking-[-0.045em]">
              Your Path
            </h1>
            <p className="mt-2 max-w-[14rem] text-[13px] font-bold text-white/55">
              {data.trackTitle}
            </p>
          </div>

          <div className="col-span-4 flex flex-col items-end gap-2">
            <div className="rotate-[6deg] rounded-md border-2 border-[#ffc928]/55 bg-[#ffc928]/12 px-2 py-1 text-right">
              <p className="font-display text-[16px] leading-none font-bold text-[#ffc928]">
                {Math.max(progress, 0)}%
              </p>
              <p className="mt-0.5 text-[9px] font-black tracking-[0.1em] text-[#ffc928]/80 uppercase">
                paved
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-2.5 py-2 text-right backdrop-blur-sm">
              <p className="font-display text-[16px] leading-none font-bold">
                {data.lessonsDone}/{data.lessonsTotal}
              </p>
              <p className="mt-1 text-[9px] font-bold text-white/50">stops</p>
            </div>
          </div>
        </div>

        {/* Mini route line: origin → you → finish */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold">
            <span className="text-white/50">Route paved</span>
            <span className="text-white/70">{data.rank.title}</span>
          </div>
          <div className="relative h-6">
            {/* dashed planned line */}
            <div
              aria-hidden
              className="absolute top-1/2 right-5 left-2 h-[3px] -translate-y-1/2 rounded-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,0.28) 0 7px, transparent 7px 15px)",
              }}
            />
            {/* paved line */}
            <motion.div
              className="absolute top-1/2 left-2 h-[3px] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#6b4eff,#ffc928)]"
              initial={reduceMotion ? false : { width: 0 }}
              animate={{
                width: `max(10px, calc(${Math.max(progress, 3)}% - 20px))`,
              }}
              transition={{ ...softSpring, delay: 0.2 }}
            />
            {/* origin dot */}
            <span
              aria-hidden
              className="absolute top-1/2 left-0 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white/70 bg-[#0f1220]"
            />
            {/* position marker */}
            <motion.span
              aria-hidden
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffc928] shadow-[0_0_0_4px_rgba(255,201,40,0.22)]"
              initial={reduceMotion ? false : { left: "2%", opacity: 0 }}
              animate={{
                left: `max(12px, calc(${Math.max(progress, 3)}% - 14px))`,
                opacity: 1,
              }}
              transition={{ ...softSpring, delay: 0.25 }}
            />
            {/* finish flag */}
            <Flag
              aria-hidden
              className="absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 text-white/70"
              strokeWidth={2.5}
            />
          </div>
        </div>
      </motion.div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* The road itself                                                     */
/* ------------------------------------------------------------------ */

function RoadSvg({
  builtD,
  plannedD,
  totalH,
  reduceMotion,
}: {
  builtD: string;
  plannedD: string;
  totalH: number;
  reduceMotion: boolean;
}) {
  return (
    <svg
      aria-hidden
      className="absolute inset-x-0 top-0"
      width="100%"
      height={totalH}
      viewBox={`0 0 ${MAP_W} ${totalH}`}
      preserveAspectRatio="none"
      fill="none"
    >
      {/* Planned route — surveyor's dashed line */}
      {plannedD ? (
        <motion.path
          d={plannedD}
          stroke="#b9abdd"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray="1 12"
          vectorEffect="non-scaling-stroke"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        />
      ) : null}

      {builtD ? (
        <>
          {/* Road shoulder / map casing */}
          <motion.path
            d={builtD}
            stroke="#ffffff"
            strokeWidth={30}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          {/* Asphalt */}
          <motion.path
            d={builtD}
            stroke="#2a2440"
            strokeWidth={22}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 0.05 }}
          />
          {/* Yellow center line */}
          <motion.path
            d={builtD}
            stroke="#ffc928"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="10 14"
            vectorEffect="non-scaling-stroke"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 1.05 }}
          />
        </>
      ) : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

const rowVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: softSpring },
};

function pct(x: number) {
  return `${(x / MAP_W) * 100}%`;
}

/** Overhead gantry sign — the road runs underneath it. */
function GantrySign({ row }: { row: Extract<TrailRow, { kind: "gantry" }> }) {
  return (
    <motion.div
      variants={rowVariants}
      className="absolute inset-x-0"
      style={{ top: row.top, height: row.h }}
    >
      {/* posts down to the roadside */}
      <span
        aria-hidden
        className="absolute top-[64px] bottom-[10px] left-[9%] z-[1] w-1.5 rounded-b-sm bg-[#3a3357]"
      />
      <span
        aria-hidden
        className="absolute top-[64px] right-[9%] bottom-[10px] z-[1] w-1.5 rounded-b-sm bg-[#3a3357]"
      />

      <div
        className={cn(
          "absolute inset-x-4 top-2 z-[2] flex items-center gap-3 rounded-[18px] px-4 py-3",
          row.locked
            ? "border-2 border-dashed border-[#d5ccec] bg-white/80 text-[#8a7cb8]"
            : "bg-[#1b1730] text-white shadow-[0_10px_24px_rgba(27,23,48,0.32),inset_0_0_0_2px_rgba(255,255,255,0.14)]",
        )}
      >
        <span
          className={cn(
            "flex h-9 shrink-0 items-center justify-center rounded-lg px-2 font-display text-[13px] font-bold tracking-wide",
            row.locked
              ? "bg-[#efe9f8] text-[#b3a8d6]"
              : "bg-[#ffc928] text-[#1b1730]",
          )}
        >
          {row.locked ? (
            <Lock className="h-4 w-4" strokeWidth={2.5} />
          ) : (
            `UNIT ${row.unit}`
          )}
        </span>
        <p
          className={cn(
            "min-w-0 flex-1 truncate font-display text-[16px] leading-tight font-semibold",
            row.locked ? "text-[#8a7cb8]" : "text-white",
          )}
        >
          {row.title}
        </p>
        <span
          className={cn(
            "shrink-0 text-[11px] font-bold",
            row.locked ? "text-[#b3a8d6]" : "text-white/55",
          )}
        >
          {row.count} stops
        </span>
      </div>
    </motion.div>
  );
}

/** Cleared stop — small waypoint on the paved road. */
function ClearedStop({ row }: { row: Extract<TrailRow, { kind: "stone" }> }) {
  return (
    <motion.div
      variants={rowVariants}
      className="absolute inset-x-0"
      style={{ top: row.top, height: row.h }}
    >
      <span
        className="absolute top-1/2 z-[2] flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-arc-purple-500 text-white ring-4 ring-white"
        style={{ left: pct(row.ax) }}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
      <div
        className={cn(
          "absolute inset-y-0 z-[1] flex items-center",
          row.side === "left"
            ? "left-[42%] right-4 justify-start"
            : "left-4 right-[42%] justify-end",
        )}
      >
        <p className="max-w-full truncate rounded-full bg-white/85 px-3 py-1.5 text-[12px] font-bold text-[#6b5f92] ring-1 ring-[#ebe4f6]">
          {row.node.title}
        </p>
      </div>
    </motion.div>
  );
}

/** Upcoming stop — waypoint on the planned route with a roadside plaque. */
function UpcomingStop({ row }: { row: Extract<TrailRow, { kind: "stone" }> }) {
  const Icon = iconMap[row.node.icon];
  return (
    <motion.div
      variants={rowVariants}
      className="absolute inset-x-0"
      style={{ top: row.top, height: row.h }}
    >
      <span
        className="absolute top-1/2 z-[2] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#c6bce0] bg-white"
        style={{ left: pct(row.ax) }}
      />
      <div
        className={cn(
          "absolute inset-y-0 z-[1] flex items-center",
          row.side === "left" ? "left-[40%] right-4" : "left-4 right-[40%]",
        )}
      >
        <div className="flex w-full items-center gap-2.5 rounded-[20px] border border-[#ebe4f6] bg-white px-3 py-2.5 shadow-[0_6px_16px_rgba(70,40,150,0.05)]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0ecf7] text-[#b3a8d6]">
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[14px] leading-tight font-semibold text-[#8a7cb8]">
              {row.node.title}
            </p>
            <p className="truncate text-[11px] font-bold text-[#c6bce0]">
              {row.node.subtitle}
            </p>
          </div>
          {row.node.showLock !== false ? (
            <Lock
              className="h-3.5 w-3.5 shrink-0 text-[#c6bce0]"
              strokeWidth={2.5}
            />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

/** Milestone — yellow diamond road sign. */
function MilestoneSign({ row }: { row: Extract<TrailRow, { kind: "stone" }> }) {
  const Icon = iconMap[row.node.icon];
  return (
    <motion.div
      variants={rowVariants}
      className="absolute inset-x-0"
      style={{ top: row.top, height: row.h }}
    >
      <span
        className="absolute top-1/2 z-[2] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 rotate-45 items-center justify-center rounded-[14px] border-[3px] border-[#2a2440] bg-[#ffc928] shadow-[0_5px_0_#c79a2e]"
        style={{ left: pct(row.ax) }}
      >
        <Icon className="h-5 w-5 -rotate-45 text-[#1b1730]" strokeWidth={2.4} />
      </span>
      <div
        className={cn(
          "absolute inset-y-0 z-[1] flex items-center",
          row.side === "left" ? "left-[42%] right-4" : "left-4 right-[42%]",
        )}
      >
        <div className="w-full rounded-[20px] border border-[#ead7a0] bg-[linear-gradient(145deg,#fffbf0,#fff3d0)] px-3.5 py-2.5 shadow-[0_8px_20px_rgba(199,154,46,0.15)]">
          <p className="text-[9px] font-extrabold tracking-[0.1em] text-[#c79a2e] uppercase">
            Milestone
          </p>
          <p className="truncate font-display text-[15px] leading-tight font-semibold text-[#1b1730]">
            {row.node.title}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/** Road closed — striped barrier across the route. */
function RoadClosed({ row }: { row: Extract<TrailRow, { kind: "stone" }> }) {
  return (
    <motion.div
      variants={rowVariants}
      className="absolute inset-x-0"
      style={{ top: row.top, height: row.h }}
    >
      <div
        aria-hidden
        className="absolute inset-x-10 top-[26px] z-[2] h-6 rounded-full border-2 border-white shadow-[0_6px_14px_rgba(27,23,48,0.18)]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #ffc928 0 13px, #2a2440 13px 26px)",
        }}
      />
      <div className="absolute inset-x-0 top-[60px] z-[2] flex justify-center">
        <p className="inline-flex max-w-[80%] items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#8a7cb8] ring-1 ring-[#ebe4f6]">
          <Lock className="h-3 w-3 shrink-0" strokeWidth={2.75} />
          <span className="truncate">{row.node.title}</span>
        </p>
      </div>
    </motion.div>
  );
}

/** Current lesson — pulsing "You are here" map pin + billboard CTA. */
function CurrentPin({
  row,
  upNext,
}: {
  row: Extract<TrailRow, { kind: "stone" }>;
  upNext: PathMockData["upNext"];
}) {
  const reduceMotion = useReducedMotion();
  const Icon = iconMap[row.node.icon];
  const pinOnLeft = row.side === "left";

  return (
    <motion.div
      id={`path-stop-${row.key}`}
      variants={rowVariants}
      className="absolute inset-x-0 scroll-mt-[calc(env(safe-area-inset-top)+5rem)] scroll-mb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      style={{ top: row.top, height: row.h }}
    >
      {/* Pin at the road anchor */}
      <div
        className="absolute z-[3] -translate-x-1/2"
        style={{ left: pct(row.ax), top: 16 }}
      >
        {!reduceMotion ? (
          <motion.span
            aria-hidden
            className="absolute top-1/2 left-1/2 h-[60px] w-[60px] -translate-x-1/2 -translate-y-[calc(50%+7px)] rounded-full bg-arc-purple-500/25"
            animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
        <span className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-arc-purple-500 text-white ring-4 ring-white shadow-[0_8px_18px_rgba(75,47,214,0.4)]">
          <Icon className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <span
          aria-hidden
          className="absolute -bottom-1 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-[3px] bg-arc-purple-500"
        />
        {/* You-are-here tag beside the pin */}
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#ffc928] px-2 py-1 text-[9px] font-black tracking-[0.1em] text-[#1b1730] uppercase shadow-[0_3px_0_#c79a2e]",
            pinOnLeft ? "left-full ml-3" : "right-full mr-3",
          )}
        >
          You are here
        </span>
      </div>

      {/* Billboard CTA */}
      <div className="absolute inset-x-2 top-[92px] z-[2] overflow-hidden rounded-[26px] bg-white p-4 shadow-[0_16px_32px_rgba(70,40,150,0.16)] ring-1 ring-[#ebe4f6]">
        <p className="text-[10px] font-black tracking-[0.1em] text-arc-purple-500 uppercase">
          Next stop · {row.node.subtitle}
        </p>
        <h3 className="mt-1 line-clamp-2 font-display text-[20px] leading-tight font-bold tracking-[-0.02em] text-[#1b1730]">
          {upNext.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-[12px] font-bold text-[#8a7cb8]">
          <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
          {upNext.minutes}m · {row.node.title}
        </p>

        <motion.div
          className="relative mt-4"
          whileTap={{ scale: 0.98, y: 2 }}
          transition={snappySpring}
        >
          <Link
            href={`/learn/${row.node.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_6px_0_#4b2fd6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:ring-offset-2"
          >
            Start lesson
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

/** End of the surveyed route. */
function FinishMarker({
  row,
  lessonsTotal,
}: {
  row: Extract<TrailRow, { kind: "terminal" }>;
  lessonsTotal: number;
}) {
  return (
    <motion.div
      variants={rowVariants}
      className="absolute inset-x-0"
      style={{ top: row.top, height: row.h }}
    >
      <div className="absolute inset-x-0 top-2 z-[2] flex flex-col items-center gap-2">
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-white",
            row.reached
              ? "bg-[#ffc928] text-[#1b1730] shadow-[0_5px_0_#c79a2e]"
              : "border-[3px] border-dashed border-[#c6bce0] bg-white text-[#b3a8d6]",
          )}
        >
          <Flag className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <p className="text-[11px] font-bold text-[#8a7cb8]">
          Finish line · {lessonsTotal} stops
        </p>
      </div>
    </motion.div>
  );
}
