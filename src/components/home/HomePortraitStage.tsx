"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { assets } from "@/lib/assets";
import type { HomeData } from "@/lib/home/types";
import { soft } from "./motion";

type HomePortraitStageProps = {
  greeting: string;
  userName: HomeData["userName"];
  askArloHref: string;
};

/**
 * Compact masthead — greeting + name left, Arlo right (tap → coach).
 * No dispatch plaque.
 */
export function HomePortraitStage({
  greeting,
  userName,
  askArloHref,
}: HomePortraitStageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className="relative mt-3.5"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={soft}
      aria-label="Welcome"
    >
      <div className="relative flex items-center gap-1">
        <div className="relative z-2 min-w-0 flex-1 pb-2">
          <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#ffc928] uppercase">
            {greeting}
          </p>
          <h1 className="mt-1 truncate font-display text-[32px] leading-[0.88] font-bold tracking-[-0.045em]">
            {userName}
          </h1>
        </div>

        <div
          aria-label="Talk to Arlo"
          className="relative -mr-3 -mb-1 h-[112px] w-[118px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1220]"
        >
          <motion.span
            className="absolute inset-0 flex items-end justify-end"
            animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src={assets.arlo.home}
              alt=""
              width={130}
              height={130}
              className="h-[112px] w-auto max-w-none object-contain object-bottom drop-shadow-[0_12px_24px_rgba(107,78,255,0.45)]"
              priority
            />
          </motion.span>

          {/* Soft primary glow under feet */}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-2 left-1/2 h-5 w-16 -translate-x-1/2 rounded-full bg-arc-purple-500/50 blur-lg"
          />
        </div>
      </div>
    </motion.section>
  );
}
