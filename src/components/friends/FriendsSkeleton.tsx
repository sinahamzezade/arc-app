"use client";

import { BackButton } from "@/components/BackButton";
import { Skeleton } from "@/components/ui";

/**
 * Friends hub skeleton — night hero + sheet lists.
 */
export function FriendsSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading friends"
    >
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-14">
        <div className="relative flex items-center gap-3">
          <BackButton tone="dark" fallbackHref="/home" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-16 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-8 w-36 rounded-xl bg-white/15"
            />
          </div>
        </div>
        <div className="relative mt-5 flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              animationType="shimmer"
              className={`h-11 w-11 rounded-2xl bg-white/15 ${i > 0 ? "-ml-2.5" : ""}`}
            />
          ))}
          <Skeleton
            animationType="shimmer"
            className="ml-3 h-6 w-20 rounded-full bg-white/10"
          />
        </div>
      </header>

      <div className="relative z-10 -mt-6 space-y-3 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-10">
        <Skeleton
          animationType="shimmer"
          className="h-[72px] w-full rounded-[20px] bg-[#ffc928]/35"
        />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              animationType="shimmer"
              className="h-16 rounded-[16px] bg-white"
            />
          ))}
        </div>
        <Skeleton
          animationType="shimmer"
          className="h-12 w-full rounded-[16px] bg-white"
        />
        <div className="flex gap-2 pt-2">
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              animationType="shimmer"
              className="h-10 flex-1 rounded-full bg-white"
            />
          ))}
        </div>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            animationType="shimmer"
            className="h-[72px] w-full rounded-[20px] bg-white"
          />
        ))}
        <span className="sr-only">Loading your crew…</span>
      </div>
    </div>
  );
}
