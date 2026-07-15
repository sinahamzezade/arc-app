"use client";

import { BackButton } from "@/components/BackButton";
import { Skeleton } from "@/components/ui";

/**
 * Week pulse skeleton — night hero + day rail + plan.
 */
export function WeekPulseSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading week"
    >
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-14">
        <div className="relative flex items-center gap-3">
          <BackButton tone="dark" fallbackHref="/home" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-28 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-7 w-36 rounded-xl bg-white/15"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-7 w-16 rounded-full bg-white/10"
          />
        </div>
        <div className="relative mt-6 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-20 rounded-full bg-white/10"
            />
            <Skeleton
              animationType="shimmer"
              className="h-14 w-24 rounded-xl bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-40 rounded-full bg-white/10"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-24 w-28 rounded-2xl bg-[#ffc928]/30"
          />
        </div>
        <Skeleton
          animationType="shimmer"
          className="relative mt-5 h-2 w-full rounded-full bg-white/10"
        />
      </header>

      <div className="relative z-10 -mt-6 space-y-3 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-28">
        <Skeleton
          animationType="shimmer"
          className="h-16 w-full rounded-[20px] bg-white"
        />
        <Skeleton
          animationType="shimmer"
          className="h-[120px] w-full rounded-[22px] bg-white"
        />
        <Skeleton
          animationType="shimmer"
          className="h-3 w-16 rounded-full bg-[#ebe4f6]"
        />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            animationType="shimmer"
            className="h-16 w-full rounded-[18px] bg-white"
          />
        ))}
        <span className="sr-only">Loading week plan…</span>
      </div>
    </div>
  );
}
