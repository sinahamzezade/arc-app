"use client";

import { Skeleton } from "@/components/ui";

/**
 * Profile placeholder — night hero + clay stamps + action rows.
 * Mirrors LeaderboardSkeleton / ProfileScreen structure.
 */
export function ProfileSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton
              animationType="shimmer"
              className="h-3 w-16 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-10 w-48 rounded-lg bg-white/20"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-36 rounded-full bg-white/10"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-[108px] w-[108px] shrink-0 rounded-full bg-white/15"
          />
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <Skeleton
            animationType="shimmer"
            className="h-7 w-16 rounded-full bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-7 w-14 rounded-full bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-7 w-28 rounded-full bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="ml-auto h-3 w-16 rounded-full bg-white/10"
          />
        </div>
      </section>

      <div className="relative z-20 -mt-7 px-4">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              animationType="shimmer"
              className="h-[58px] rounded-2xl bg-[#ebe4f6]"
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 bg-[#f3effc] px-4 pt-4 pb-8">
        <div className="space-y-4">
          <div className="flex gap-2.5">
            <Skeleton
              animationType="shimmer"
              className="h-[68px] flex-1 rounded-[20px] bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-[68px] flex-1 rounded-[20px] bg-[#ebe4f6]"
            />
          </div>

          <Skeleton
            animationType="shimmer"
            className="h-[68px] w-full rounded-[20px] bg-[#ebe4f6]"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton
              animationType="shimmer"
              className="h-[132px] rounded-[22px] bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-[132px] rounded-[22px] bg-[#ebe4f6]"
            />
          </div>

          <Skeleton
            animationType="shimmer"
            className="h-[72px] w-full rounded-[22px] bg-[#ebe4f6]"
          />

          <Skeleton
            animationType="shimmer"
            className="h-[68px] w-full rounded-[22px] bg-[#ebe4f6]"
          />
        </div>
      </div>

      <span className="sr-only">Loading profile…</span>
    </div>
  );
}
