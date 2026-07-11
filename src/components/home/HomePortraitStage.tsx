"use client";

import Image from "next/image";
import Link from "next/link";
import { Flame, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import type { HomeMockData } from "@/lib/home/mock-data";
import { soft } from "./motion";

type HomePortraitStageProps = {
  greeting: string;
  userName: HomeMockData["userName"];
  quote: HomeMockData["arloSays"]["quote"];
  weeks: HomeMockData["weeklyStreak"]["weeks"];
  askArloHref: string;
};

/**
 * Masthead on night hero — white type, gold Talk CTA, Arlo right crop.
 * Streak stamp flat (no rotate).
 */
export function HomePortraitStage({
  greeting,
  userName,
  quote,
  weeks,
  askArloHref,
}: HomePortraitStageProps) {
  return (
    <section className="relative z-10 overflow-hidden pt-4">
      <motion.div
        className="relative px-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={soft}
      >
        <div className="relative grid grid-cols-[1fr_42%] items-end gap-2 pb-2">
          <div className="relative z-[1] min-w-0 pb-3">
            <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#ffc928] uppercase">
              {greeting}
            </p>
            <h1 className="mt-1 font-display text-[42px] leading-[0.82] font-bold tracking-[-0.04em] text-white text-balance">
              {userName}
            </h1>

            <p className="mt-4 max-w-[220px] text-[13px] leading-snug font-bold text-white/72 text-pretty">
              {quote}
            </p>

            <Link
              href={askArloHref}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[#ffc928] px-3.5 font-display text-[13px] font-bold text-[#0f1220] shadow-[0_3px_0_#c79a2e]"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
              Talk to Arlo
            </Link>
          </div>

          <div className="relative -mr-5 h-[168px]">
            <motion.div
              className="absolute right-[-8%] bottom-0 flex h-full w-[130%] items-end justify-end"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src={assets.arlo.home}
                alt="Arlo"
                width={200}
                height={200}
                className="h-[168px] w-auto max-w-none object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.45)]"
                priority
              />
            </motion.div>

            <Link
              href="/week"
              className="absolute top-1 right-1 z-2 flex flex-col items-center rounded-2xl bg-arc-orange-400 px-2 py-1.5 text-white shadow-[0_3px_0_#d46520]"
            >
              <Flame
                className="h-3.5 w-3.5"
                fill="currentColor"
                strokeWidth={1.5}
              />
              <span className="font-display text-[18px] leading-none font-bold">
                {weeks}
              </span>
              <span className="text-[8px] font-black tracking-[0.12em] uppercase">
                wks
              </span>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
