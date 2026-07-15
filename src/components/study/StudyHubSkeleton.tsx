"use client";

import { Skeleton } from "@/components/ui";

/**
 * Study Together hub skeleton — night hero + room cards.
 */
export function StudyHubSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading study hub"
    >
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-14">
        <div className="relative space-y-2">
          <Skeleton
            animationType="shimmer"
            className="h-2.5 w-24 rounded-full bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-9 w-52 rounded-xl bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="mt-2 h-4 w-40 rounded-full bg-white/10"
          />
        </div>
        <Skeleton
          animationType="shimmer"
          className="relative mt-5 h-14 w-full rounded-[18px] bg-[#ffc928]/35"
        />
      </header>

      <div className="relative z-10 -mt-6 space-y-3 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-10">
        <Skeleton
          animationType="shimmer"
          className="h-3 w-20 rounded-full bg-[#ebe4f6]"
        />
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            animationType="shimmer"
            className="h-[96px] w-full rounded-[22px] bg-white"
          />
        ))}
        <span className="sr-only">Loading rooms…</span>
      </div>
    </div>
  );
}
