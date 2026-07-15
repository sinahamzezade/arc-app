"use client";

import { Skeleton } from "@/components/ui";

/**
 * Profile placeholder — centered passport hero + stats board + sections.
 */
export function ProfileSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-56 w-56 rounded-full bg-arc-purple-500/35 blur-3xl"
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-16 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-24 rounded-full bg-white/10"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-10 w-10 rounded-2xl bg-white/15"
          />
        </div>

        <div className="relative mt-5 flex flex-col items-center gap-3">
          <Skeleton
            animationType="shimmer"
            className="h-[108px] w-[108px] rounded-full bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-8 w-40 rounded-lg bg-white/20"
          />
          <Skeleton
            animationType="shimmer"
            className="h-3 w-48 rounded-full bg-white/10"
          />
          <Skeleton
            animationType="shimmer"
            className="mt-1 h-2 w-full max-w-[18rem] rounded-full bg-white/10"
          />
          <div className="mt-2 flex gap-2">
            <Skeleton
              animationType="shimmer"
              className="h-7 w-28 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-7 w-20 rounded-full bg-white/15"
            />
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-6 space-y-4 rounded-t-[28px] bg-[#f3effc] px-4 pt-5 pb-8">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              animationType="shimmer"
              className="h-[58px] rounded-[16px] bg-[#ebe4f6]"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton
            animationType="shimmer"
            className="h-[68px] rounded-[18px] bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-[68px] rounded-[18px] bg-[#ebe4f6]"
          />
        </div>

        <Skeleton
          animationType="shimmer"
          className="h-3 w-16 rounded-full bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="h-[68px] w-full rounded-[18px] bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="h-[88px] w-full rounded-[18px] bg-[#ebe4f6]"
        />

        <Skeleton
          animationType="shimmer"
          className="h-3 w-14 rounded-full bg-[#ebe4f6]"
        />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton
            animationType="shimmer"
            className="h-[120px] rounded-[20px] bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-[120px] rounded-[20px] bg-[#ebe4f6]"
          />
        </div>
      </div>

      <span className="sr-only">Loading profile…</span>
    </div>
  );
}
