"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { pop, sectionVariants } from "./motion";

/**
 * Shown on home when questionnaire reset / incomplete — replaces Next Stop.
 */
export function HomeQuestionnaireCta() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      variants={sectionVariants}
      aria-labelledby="start-q-title"
      className="relative overflow-hidden rounded-[26px] bg-white p-4 shadow-[0_16px_32px_rgba(70,40,150,0.16)] ring-1 ring-[#ebe4f6]"
    >
      <p className="text-[10px] font-black tracking-[0.1em] text-arc-purple-500 uppercase">
        First stop · Onboarding
      </p>
      <h2
        id="start-q-title"
        className="mt-1.5 font-display text-[24px] leading-[1.05] font-bold tracking-[-0.03em] text-[#1b1730]"
      >
        Build your learning path
      </h2>
      <p className="mt-1.5 text-[13px] font-bold text-[#8a7cb8]">
        Answer a few questions so Arc can map your trail.
      </p>

      <motion.div
        className="relative mt-4"
        whileTap={reduceMotion ? undefined : { scale: 0.98, y: 2 }}
        transition={pop}
      >
        <Link
          href="/questionnaire"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-arc-purple-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_6px_0_#4b2fd6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 focus-visible:ring-offset-2"
        >
          <ClipboardList className="h-4 w-4" strokeWidth={2.5} />
          Start questionnaire
          <ArrowRight className="h-4 w-4" strokeWidth={2.75} />
        </Link>
      </motion.div>
    </motion.section>
  );
}
