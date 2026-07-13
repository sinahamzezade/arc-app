"use client";

import { motion } from "motion/react";
import { Skeleton } from "@/components/ui";

const softSpring = { type: "spring" as const, stiffness: 380, damping: 28 };

export function QuestionnaireReviewSkeleton() {
  return (
    <div
      className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f3effc] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading review"
    >
      <div className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4">
        <Skeleton
          animationType="shimmer"
          className="h-10 w-10 rounded-full bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="h-5 w-32 rounded-md bg-[#ebe4f6]"
        />
      </div>
      <div className="flex-1 space-y-2.5 overflow-hidden px-4 pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...softSpring, delay: i * 0.04 }}
            className="rounded-[16px] border-2 border-[#ebe4f6] bg-white p-4 shadow-[0_3px_0_#ebe4f6]"
          >
            <Skeleton
              animationType="shimmer"
              className="h-3 w-20 rounded-full bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="mt-3 h-4 w-3/4 rounded-md bg-[#ebe4f6]"
            />
          </motion.div>
        ))}
      </div>
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
        <Skeleton
          animationType="shimmer"
          className="h-12 w-full rounded-full bg-arc-purple-200"
        />
      </div>
    </div>
  );
}
