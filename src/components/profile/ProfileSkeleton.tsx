"use client";

import { Skeleton } from "@/components/ui";

/**
 * Profile placeholder — clay passport plate + sheet sections.
 */
export function ProfileSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <header className="relative bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-7">
        <div className="relative overflow-hidden rounded-[28px] border-[3px] border-[#0a0c16] bg-arc-purple-500 shadow-[0_7px_0_#35209d]">
          <div className="relative flex items-start justify-between gap-3 px-3.5 pt-4">
            <div className="space-y-2">
              <Skeleton
                animationType="shimmer"
                className="h-2.5 w-16 rounded-full bg-white/20"
              />
              <Skeleton
                animationType="shimmer"
                className="h-3 w-24 rounded-full bg-white/15"
              />
            </div>
            <Skeleton
              animationType="shimmer"
              className="h-10 w-10 rounded-xl bg-[#0f1220]/55"
            />
          </div>

          <div className="relative mt-3 flex gap-3 px-3.5">
            <Skeleton
              animationType="shimmer"
              className="h-[84px] w-[84px] shrink-0 rounded-[22px] bg-[#0f1220]/55"
            />
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <Skeleton
                animationType="shimmer"
                className="h-2.5 w-14 rounded-full bg-white/20"
              />
              <Skeleton
                animationType="shimmer"
                className="h-7 w-32 rounded-lg bg-white/25"
              />
              <Skeleton
                animationType="shimmer"
                className="h-6 w-40 rounded-full bg-[#0f1220]/50"
              />
            </div>
          </div>

          <div className="relative mx-3.5 mt-3.5 space-y-1.5">
            <div className="flex justify-between">
              <Skeleton
                animationType="shimmer"
                className="h-2.5 w-12 rounded-full bg-white/20"
              />
              <Skeleton
                animationType="shimmer"
                className="h-2.5 w-14 rounded-full bg-white/15"
              />
            </div>
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-full rounded-full bg-[#0f1220]/55"
            />
          </div>

          <div className="relative mx-3.5 mt-3 mb-3.5 grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                animationType="shimmer"
                className="h-[52px] w-full rounded-lg bg-[#0f1220]/55"
              />
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-1 px-0.5">
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              animationType="shimmer"
              className="h-7 flex-1 rounded-lg bg-white/10"
            />
          ))}
        </div>
      </header>

      <div className="relative z-10 -mt-3 space-y-4 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-8">
        <Skeleton
          animationType="shimmer"
          className="h-3 w-16 rounded-full bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="h-[120px] w-full rounded-[20px] bg-[#ebe4f6]"
        />

        <Skeleton
          animationType="shimmer"
          className="h-3 w-14 rounded-full bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="h-[56px] w-full rounded-[20px] bg-[#ebe4f6]"
        />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton
            animationType="shimmer"
            className="h-[96px] rounded-[18px] bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-[96px] rounded-[18px] bg-[#ebe4f6]"
          />
        </div>

        <Skeleton
          animationType="shimmer"
          className="h-3 w-16 rounded-full bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="h-[56px] w-full rounded-[20px] bg-[#ebe4f6]"
        />
      </div>

      <span className="sr-only">Loading profile…</span>
    </div>
  );
}
