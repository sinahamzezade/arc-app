"use client";

import { motion } from "motion/react";
import { Skeleton } from "@/components/ui";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

/**
 * Mirrors questionnaire step chrome: dark header, option cards, CTA.
 */
export function QuestionnaireStepSkeleton() {
  return (
    <div
      className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading questionnaire"
    >
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[-36px] h-48 w-48 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div className="relative flex items-center gap-2">
          <Skeleton
            animationType="shimmer"
            className="h-10 w-10 shrink-0 rounded-full bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-2.5 min-w-0 flex-1 rounded-full bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-10 w-10 shrink-0 rounded-full bg-white/15"
          />
        </div>
        <div className="relative mt-5 space-y-3">
          <Skeleton
            animationType="shimmer"
            className="h-2.5 w-16 rounded-full bg-[#ffc928]/35"
          />
          <Skeleton
            animationType="shimmer"
            className="h-8 w-4/5 rounded-lg bg-white/20"
          />
          <Skeleton
            animationType="shimmer"
            className="h-4 w-3/5 rounded-md bg-white/10"
          />
        </div>
      </section>

      <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-[#f3effc]">
        <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden px-4 pt-5 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={softSpring}
          >
            <Skeleton
              animationType="shimmer"
              className="h-11 w-full rounded-[14px] bg-[#ebe4f6]"
            />
          </motion.div>

          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: 0.05 + i * 0.04 }}
              className="flex items-center gap-3 rounded-[16px] border-2 border-[#ebe4f6] bg-white px-4 py-3.5 shadow-[0_3px_0_#ebe4f6]"
            >
              <Skeleton
                animationType="shimmer"
                className="h-10 w-10 shrink-0 rounded-[12px] bg-[#ebe4f6]"
              />
              <Skeleton
                animationType="shimmer"
                className="h-4 flex-1 rounded-md bg-[#ebe4f6]"
              />
              <Skeleton
                animationType="shimmer"
                className="h-5 w-5 shrink-0 rounded-[6px] bg-[#ebe4f6]"
              />
            </motion.div>
          ))}
        </div>

        <div className="shrink-0 border-t border-[#ebe4f6]/80 bg-[#f3effc]/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)]">
          <Skeleton
            animationType="shimmer"
            className="h-12 w-full rounded-full bg-arc-purple-200"
          />
        </div>
      </div>
    </div>
  );
}
