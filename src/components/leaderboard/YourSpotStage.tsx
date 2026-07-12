"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { softSpring } from "./motion";

export function YourSpotStage({
  rank,
  xp,
  promoteTop,
  demoteBottom,
  cohortSize,
  daysLeft,
}: {
  rank: number;
  xp: number;
  promoteTop: number;
  demoteBottom: number;
  cohortSize: number;
  daysLeft: number;
}) {
  const demoteFloor = cohortSize - demoteBottom + 1;
  const promotePct = (promoteTop / cohortSize) * 100;
  const demotePct = (demoteBottom / cohortSize) * 100;
  const midPct = 100 - promotePct - demotePct;
  const pinPct = Math.min(
    96,
    Math.max(4, ((rank - 0.5) / cohortSize) * 100),
  );

  const zone =
    rank <= promoteTop
      ? "promote"
      : rank >= demoteFloor
        ? "demote"
        : "safe";

  const zoneCopy =
    zone === "promote"
      ? "In the promote cut — hold it"
      : zone === "demote"
        ? "Demote danger — climb now"
        : "Safe midfield — keep climbing";

  const zoneTone =
    zone === "promote"
      ? "bg-[#16a56b]/20 text-[#62d84e]"
      : zone === "demote"
        ? "bg-[#e5484d]/20 text-[#ff8a8a]"
        : "bg-[#ffc928]/20 text-[#ffc928]";

  return (
    <motion.div
      className="relative mt-7"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
            Your spot
          </p>
          <p className="mt-1 font-display text-[64px] leading-[0.82] font-bold tracking-[-0.05em]">
            #{rank}
          </p>
        </div>
        <div className="mb-2 flex flex-col items-end gap-1.5">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-extrabold tabular-nums text-white ring-1 ring-white/15">
            of {cohortSize}
          </span>
          <span className="rounded-full bg-[#ffc928]/15 px-2.5 py-1 text-[12px] font-extrabold tabular-nums text-[#ffc928]">
            {xp} XP
          </span>
        </div>
      </div>

      <p
        className={cn(
          "mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold",
          zoneTone,
        )}
      >
        {zoneCopy}
      </p>

      <div className="relative mt-5">
        <div className="mb-2 flex items-center justify-between text-[9px] font-extrabold tracking-wide uppercase">
          <span className="inline-flex items-center gap-1 text-[#62d84e]">
            <ArrowUp className="h-3 w-3" strokeWidth={3} />
            #1
          </span>
          <span className="text-white/35">Cohort track</span>
          <span className="inline-flex items-center gap-1 text-[#ff8a8a]">
            #{cohortSize}
            <ArrowDown className="h-3 w-3" strokeWidth={3} />
          </span>
        </div>

        <div className="relative pt-5">
          <span
            className="absolute top-0 -translate-x-1/2 text-[11px] font-extrabold text-[#ffc928]"
            style={{ left: `${pinPct}%` }}
          >
            You
          </span>

          <div className="relative h-4 overflow-hidden rounded-full bg-white/10">
            <div className="flex h-full w-full">
              <span
                className="h-full bg-[#16a56b]"
                style={{ width: `${promotePct}%` }}
              />
              <span
                className="h-full bg-white/15"
                style={{ width: `${midPct}%` }}
              />
              <span
                className="h-full bg-[#e5484d]"
                style={{ width: `${demotePct}%` }}
              />
            </div>

            <motion.span
              className="absolute top-1/2 z-[2] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffc928] shadow-[0_0_0_3px_#0f1220,0_0_12px_rgba(255,201,40,0.55)]"
              style={{ left: `${pinPct}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...softSpring, delay: 0.12 }}
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[#16a56b] px-2.5 py-2.5 text-white shadow-[0_3px_0_#0e7a4c]">
          <p className="text-[9px] font-black tracking-wide uppercase opacity-85">
            Promote
          </p>
          <p className="mt-0.5 font-display text-[15px] leading-none font-bold">
            Top {promoteTop}
          </p>
        </div>
        <div className="rounded-2xl bg-[#ffc928] px-2.5 py-2.5 text-[#0f1220] shadow-[0_3px_0_#c79a2e]">
          <p className="text-[9px] font-black tracking-wide uppercase opacity-70">
            Season
          </p>
          <p className="mt-0.5 font-display text-[15px] leading-none font-bold">
            {daysLeft}d left
          </p>
        </div>
        <div className="rounded-2xl bg-[#e5484d] px-2.5 py-2.5 text-white shadow-[0_3px_0_#b43438]">
          <p className="text-[9px] font-black tracking-wide uppercase opacity-85">
            Demote
          </p>
          <p className="mt-0.5 font-display text-[15px] leading-none font-bold">
            Bot {demoteBottom}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
