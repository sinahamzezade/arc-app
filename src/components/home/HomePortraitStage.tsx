"use client";

import Image from "next/image";
import { Flame } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { assets } from "@/lib/assets";
import type { HomeData } from "@/lib/home/types";
import { soft } from "./motion";

type HomePortraitStageProps = {
  greeting: string;
  userName: HomeData["userName"];
  /** Kept for when Ask Arlo CTA returns. */
  askArloHref?: string;
  weekStreak?: number;
};

/**
 * Night masthead — greeting + name left, Arlo coach right.
 * Ask Arlo = clay CTA under mascot (no face overlay).
 */
export function HomePortraitStage({
  greeting,
  userName,
  weekStreak = 0,
}: HomePortraitStageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className="relative mt-5"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={soft}
      aria-label="Welcome"
    >
      <div className="relative flex items-end gap-3">
        <div className="relative z-2 min-w-0 flex-1 pb-2">
          <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#ffc928] uppercase">
            {greeting}
          </p>
          <h1 className="mt-1.5 truncate font-display text-[36px] leading-[0.88] font-bold tracking-[-0.045em]">
            {userName || "Learner"}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {weekStreak > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#ffc928]/35 bg-[#ffc928]/15 px-2.5 py-1 text-[11px] font-extrabold text-[#ffc928]">
                <Flame
                  className="h-3.5 w-3.5"
                  strokeWidth={2.5}
                  fill="currentColor"
                />
                {weekStreak} week streak
              </span>
            ) : (
              <span className="text-[12px] font-bold text-white/45">
                Ready when you are
              </span>
            )}
          </div>

          {/* Ask Arlo CTA temporarily removed — restore with `askArloHref` when needed. */}
        </div>

        <div
          className="relative -mr-3 -mb-3 h-[132px] w-[124px] shrink-0"
          aria-hidden
        >
          <motion.span
            className="absolute inset-0 flex items-end justify-end"
            animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src={assets.arlo.home}
              alt=""
              width={140}
              height={140}
              className="h-[128px] w-auto max-w-none object-contain object-bottom drop-shadow-[0_14px_28px_rgba(107,78,255,0.5)]"
              priority
            />
          </motion.span>
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-3 left-1/2 h-6 w-20 -translate-x-1/2 rounded-full bg-arc-purple-500/55 blur-lg"
          />
        </div>
      </div>
    </motion.section>
  );
}
