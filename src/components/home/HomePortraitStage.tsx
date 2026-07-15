"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { assets } from "@/lib/assets";
import type { HomeData } from "@/lib/home/types";
import { soft } from "./motion";

type HomePortraitStageProps = {
  greeting: string;
  userName: HomeData["userName"];
  askArloHref: string;
  weekStreak?: number;
};

/**
 * Night masthead — greeting + name, Arlo coach tap target.
 */
export function HomePortraitStage({
  greeting,
  userName,
  askArloHref,
  weekStreak = 0,
}: HomePortraitStageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className="relative mt-4"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={soft}
      aria-label="Welcome"
    >
      <div className="relative flex items-end gap-2">
        <div className="relative z-2 min-w-0 flex-1 pb-1">
          <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#ffc928] uppercase">
            {greeting}
          </p>
          <h1 className="mt-1 truncate font-display text-[34px] leading-[0.9] font-bold tracking-[-0.045em]">
            {userName || "Learner"}
          </h1>
          {weekStreak > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-extrabold text-white/85">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-[#ffc928]"
              />
              {weekStreak} week streak
            </p>
          ) : (
            <p className="mt-2 text-[12px] font-bold text-white/45">
              Ready when you are
            </p>
          )}
        </div>

        <Link
          href={askArloHref}
          aria-label="Talk to Arlo"
          className="group relative -mr-2 -mb-1 h-[120px] w-[118px] shrink-0 cursor-pointer focus-visible:rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1220]"
        >
          <span className="absolute top-1 right-0 z-10 inline-flex max-w-[5.5rem] items-center gap-1 rounded-2xl rounded-br-md bg-white px-2 py-1 text-[10px] leading-tight font-extrabold text-[#1b1730] shadow-[0_3px_0_#c7bddf] transition-colors group-hover:bg-[#ffc928]">
            <MessageCircle className="h-3 w-3 shrink-0" strokeWidth={2.5} />
            Ask Arlo
          </span>
          <motion.span
            className="absolute inset-0 flex items-end justify-end"
            animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
            transition={{
              duration: 5,
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
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-2 left-1/2 h-5 w-16 -translate-x-1/2 rounded-full bg-arc-purple-500/50 blur-lg"
          />
        </Link>
      </div>
    </motion.section>
  );
}
