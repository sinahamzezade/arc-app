"use client";

import { Skeleton } from "@/components/ui";

/**
 * Home sheet placeholder — night ticket / week rail / boost / track.
 */
export function HomeSheetSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label="Loading home"
    >
      <div className="overflow-hidden rounded-[28px] border-[3px] border-[#0a0c16]/20 bg-[#0f1220]">
        <div className="space-y-3 px-4 pt-4 pb-3">
          <Skeleton
            animationType="shimmer"
            className="h-2.5 w-28 rounded-full bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-6 w-4/5 rounded-lg bg-white/15"
          />
          <Skeleton
            animationType="shimmer"
            className="h-3 w-2/5 rounded-full bg-white/10"
          />
          <Skeleton
            animationType="shimmer"
            className="h-1.5 w-full rounded-full bg-white/10"
          />
        </div>
        <Skeleton
          animationType="shimmer"
          className="h-12 w-full rounded-none bg-arc-purple-500/40"
        />
      </div>

      <div className="rounded-[24px] border border-[#ebe4f6] bg-white px-3.5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton
            animationType="shimmer"
            className="h-5 w-24 rounded-lg bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-4 w-16 rounded-md bg-[#ebe4f6]"
          />
        </div>
        <Skeleton
          animationType="shimmer"
          className="mt-3.5 h-11 w-full rounded-2xl bg-[#f6f2ff]"
        />
        <Skeleton
          animationType="shimmer"
          className="mt-3 h-1.5 w-full rounded-full bg-[#ebe4f6]"
        />
      </div>

      <div className="space-y-2">
        <Skeleton
          animationType="shimmer"
          className="h-2.5 w-12 rounded-full bg-[#ebe4f6]"
        />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton
            animationType="shimmer"
            className="h-[88px] rounded-[18px] bg-white"
          />
          <Skeleton
            animationType="shimmer"
            className="h-[88px] rounded-[18px] bg-[#ffc928]/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton
          animationType="shimmer"
          className="h-2.5 w-12 rounded-full bg-[#ebe4f6]"
        />
        <div className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 border-b border-[#f0ecf7] px-3 py-3 last:border-0"
            >
              <Skeleton
                animationType="shimmer"
                className="h-4 w-4 shrink-0 rounded bg-[#ebe4f6]"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton
                  animationType="shimmer"
                  className="h-3 w-3/5 rounded-full bg-[#ebe4f6]"
                />
                <Skeleton
                  animationType="shimmer"
                  className="h-2.5 w-2/5 rounded-full bg-[#ebe4f6]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading your desk…</span>
    </div>
  );
}
