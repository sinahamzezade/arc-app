"use client";

import { Skeleton } from "@/components/ui";

/**
 * Peer passport placeholder — centered avatar hero + sheet.
 */
export function PeerProfileSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <Skeleton
            animationType="shimmer"
            className="h-10 w-10 shrink-0 rounded-xl bg-white/15"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-24 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-32 rounded-full bg-white/10"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-6 w-20 rounded-full bg-white/15"
          />
        </div>

        <div className="relative mt-6 flex flex-col items-center gap-3">
          <Skeleton
            animationType="shimmer"
            className="h-24 w-24 rounded-[28px] bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-2.5 w-20 rounded-full bg-white/10"
          />
          <Skeleton
            animationType="shimmer"
            className="h-8 w-40 rounded-lg bg-white/20"
          />
          <Skeleton
            animationType="shimmer"
            className="h-3 w-28 rounded-full bg-white/10"
          />
          <div className="mt-2 flex gap-2">
            <Skeleton
              animationType="shimmer"
              className="h-7 w-20 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-7 w-24 rounded-full bg-white/15"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="mt-2 h-2 w-full max-w-[20rem] rounded-full bg-white/10"
          />
        </div>
      </header>

      <div className="relative z-10 -mt-8 space-y-3 rounded-t-[28px] bg-[#f3effc] px-4 pt-5 pb-8">
        <Skeleton
          animationType="shimmer"
          className="h-[132px] w-full rounded-[22px] bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="h-[52px] w-full rounded-[18px] bg-[#ebe4f6]"
        />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton
            animationType="shimmer"
            className="h-12 rounded-[16px] bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-12 rounded-[16px] bg-[#ebe4f6]"
          />
        </div>
        <Skeleton
          animationType="shimmer"
          className="h-[160px] w-full rounded-[20px] bg-[#ebe4f6]"
        />
      </div>

      <span className="sr-only">Loading profile…</span>
    </div>
  );
}
