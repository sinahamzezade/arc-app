"use client";

import Link from "next/link";
import { ArrowRight, Clock, Code2, Gem, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { HomeMockData } from "@/lib/home/mock-data";
import { pop, soft } from "./motion";

type HomeMissionStageProps = {
  mission: HomeMockData["mission"];
};

/**
 * Up-next mission — night vault on sheet (Learn-desk cousin).
 * Code peek axis-aligned top-right. No decorative rotate.
 */
export function HomeMissionStage({ mission }: HomeMissionStageProps) {
  return (
    <motion.section
      className="relative z-10 px-4 pt-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...pop, delay: 0.1 }}
    >
      <div className="relative overflow-hidden rounded-[24px] bg-[#0f1220] p-4 text-white shadow-[0_14px_32px_rgba(15,18,32,0.28)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-arc-purple-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-[#ffc928]/18 blur-3xl"
        />

        {/* HTML peek — flat, not tilted */}
        <div className="absolute top-3 right-3 z-[1] w-[108px] overflow-hidden rounded-xl bg-white/8 px-2.5 pt-2 pb-1.5 ring-1 ring-white/12">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Code2 className="h-3 w-3 text-[#ffc928]" strokeWidth={2.5} />
            <span className="text-[8px] font-black tracking-[0.1em] text-white/45 uppercase">
              html
            </span>
          </div>
          <div className="font-mono text-[8px] leading-[1.45]">
            <div>
              <span className="text-arc-purple-300">&lt;h1&gt;</span>
              <span className="text-white">Hi</span>
              <span className="text-arc-purple-300">&lt;/h1&gt;</span>
            </div>
            <div>
              <span className="text-arc-purple-300">&lt;p&gt;</span>
              <span className="text-white/70">…</span>
            </div>
          </div>
        </div>

        <div className="relative z-[2] max-w-[68%] pr-2">
          <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
            Up next · {mission.track}
          </p>
          <h2 className="mt-2 font-display text-[26px] leading-[0.95] font-bold tracking-[-0.03em] text-balance">
            {mission.title}
          </h2>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/55">
            <Clock className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
            {mission.type} · {mission.minutes} min
          </p>
        </div>

        <div className="relative z-[2] mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ffc928]/15 px-2.5 py-1.5 text-[11px] font-extrabold text-[#ffc928]">
            <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />+{mission.xp} XP
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#b35cff]/20 px-2.5 py-1.5 text-[11px] font-extrabold text-arc-gem-200">
            <Gem className="h-3.5 w-3.5" strokeWidth={2.5} />+{mission.gems}
          </span>
          <span className="ml-auto text-[12px] font-extrabold tabular-nums text-white/45">
            {mission.progressPercent}%
          </span>
        </div>

        <div className="relative z-[2] mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-arc-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(mission.progressPercent, 4)}%` }}
            transition={{ ...soft, delay: 0.2 }}
          />
        </div>

        <motion.div
          className="relative z-[2] mt-4"
          whileTap={{ scale: 0.98, y: 2 }}
          transition={pop}
        >
          <Link
            href={mission.href}
            className="flex h-[52px] w-full items-center justify-between rounded-[16px] bg-[#ffc928] px-4 text-[#0f1220] shadow-[0_4px_0_#c79a2e]"
          >
            <span className="font-display text-[15px] font-bold">
              Continue lesson
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f1220]/15">
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
