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
      ? "Promote cut — hold it"
      : zone === "demote"
        ? "Demote danger"
        : "Safe midfield";

  const zoneTone =
    zone === "promote"
      ? "bg-[#16a56b]/20 text-[#62d84e]"
      : zone === "demote"
        ? "bg-[#e5484d]/20 text-[#ff8a8a]"
        : "bg-[#ffc928]/20 text-[#ffc928]";

  return (
    <motion.div
      className="relative mt-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
    >
      <div className="flex items-center gap-3">
        <p className="shrink-0 font-display text-[40px] leading-[0.85] font-bold tracking-[-0.05em]">
          #{rank}
        </p>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black tracking-[0.12em] text-[#ffc928] uppercase">
            Your spot
          </p>
          <p className="mt-0.5 text-[12px] font-extrabold tabular-nums text-white/60">
            of {cohortSize} · {xp} XP
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold",
            zoneTone,
          )}
        >
          {zoneCopy}
        </span>
      </div>

      <div className="relative mt-2.5 pt-4">
        <span
          className="absolute top-0 -translate-x-1/2 text-[10px] font-extrabold text-[#ffc928]"
          style={{ left: `clamp(14px, ${pinPct}%, calc(100% - 14px))` }}
        >
          You
        </span>

        <div className="relative h-3">
          <div className="absolute inset-0 flex overflow-hidden rounded-full bg-white/10">
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
            className="absolute top-1/2 z-[2] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffc928] shadow-[0_0_0_3px_#0f1220,0_0_12px_rgba(255,201,40,0.55)]"
            style={{ left: `clamp(11px, ${pinPct}%, calc(100% - 11px))` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...softSpring, delay: 0.12 }}
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-2.5 flex gap-1.5">
        <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#16a56b] px-2 py-1.5 text-[11px] font-black text-white shadow-[0_2px_0_#0e7a4c]">
          <ArrowUp className="h-3 w-3" strokeWidth={3} />
          Top {promoteTop}
        </span>
        <span className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#ffc928] px-2 py-1.5 text-[11px] font-black text-[#0f1220] shadow-[0_2px_0_#c79a2e]">
          {daysLeft}d left
        </span>
        <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#e5484d] px-2 py-1.5 text-[11px] font-black text-white shadow-[0_2px_0_#b43438]">
          <ArrowDown className="h-3 w-3" strokeWidth={3} />
          Bot {demoteBottom}
        </span>
      </div>
    </motion.div>
  );
}
