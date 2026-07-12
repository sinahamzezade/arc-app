"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import type { CourseTimingCurrent } from "@/lib/api/course-timing";
import {
  formatEta,
  formatNextSession,
  paceMeta,
} from "@/lib/course-timing/format";
import { cn } from "@/lib/utils";
import { sectionVariants } from "./motion";

type HomePaceStripProps = {
  timing?: CourseTimingCurrent;
};

/**
 * Course-timing pace + ETA — sits under Seal Week vault.
 */
export function HomePaceStrip({ timing }: HomePaceStripProps) {
  if (!timing) return null;

  const { label, tone } = paceMeta(timing.pace);
  const eta = formatEta(timing.estimatedCompletionDate);
  const next = formatNextSession(timing);

  return (
    <motion.section
      variants={sectionVariants}
      aria-label="Learning pace"
      className="relative overflow-hidden rounded-[18px] bg-[#0f1220] px-3.5 py-3 text-white shadow-[0_10px_24px_rgba(15,18,32,0.18)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 right-[-10px] h-20 w-20 rounded-full bg-arc-purple-500/35 blur-2xl"
      />

      <div className="relative flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-[#ffc928]" strokeWidth={2.5} />
        <p className="font-display text-[14px] font-bold tracking-[-0.02em]">
          Path pace
        </p>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wide uppercase",
            tone === "good" && "bg-[#62d84e]/20 text-[#7dffb5]",
            tone === "warn" && "bg-[#ff8a3d]/20 text-[#ffc9a0]",
            tone === "risk" && "bg-[#ff5a5a]/20 text-[#ffb0b0]",
            tone === "neutral" && "bg-white/10 text-white/70",
          )}
        >
          {label}
        </span>
        <Link
          href="/week"
          className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-black text-[#ffc928] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
        >
          Week
          <ChevronRight className="h-3 w-3" strokeWidth={2.75} />
        </Link>
      </div>

      <div className="relative mt-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.1em] text-white/40 uppercase">
            Finish estimate
          </p>
          <p className="mt-0.5 font-display text-[20px] leading-none font-bold tracking-[-0.03em]">
            {eta ?? "Building…"}
          </p>
          <p className="mt-1.5 text-[11px] font-bold text-white/45">
            {Math.round(timing.effectiveMinutesPerWeek)}m/wk effective ·{" "}
            {timing.remainingMinutes}m left
          </p>
        </div>

        {next ? (
          <Link
            href={next.href}
            className="shrink-0 rounded-xl bg-white/10 px-2.5 py-2 text-right ring-1 ring-white/15 transition-colors hover:bg-white/15"
          >
            <p className="text-[9px] font-black tracking-wide text-[#ffc928] uppercase">
              Next block
            </p>
            <p className="mt-0.5 text-[12px] font-bold">{next.when}</p>
            <p className="text-[10px] font-semibold text-white/50">
              {next.minutes}m
            </p>
          </Link>
        ) : null}
      </div>
    </motion.section>
  );
}
