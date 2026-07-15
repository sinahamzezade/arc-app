"use client";

import { Skeleton } from "@/components/ui";

/**
 * League desk placeholder — night hero + tab rail + standings cards.
 */
export function LeaderboardSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading league"
    >
      <header className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-56 w-56 rounded-full bg-arc-purple-500/35 blur-3xl"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton
              animationType="shimmer"
              className="h-3 w-24 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-8 w-3/4 rounded-lg bg-white/20"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-2/5 rounded-full bg-white/10"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-7 w-14 shrink-0 rounded-full bg-white/15"
          />
        </div>

        <div className="relative mt-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton
              animationType="shimmer"
              className="h-10 w-16 rounded-lg bg-white/20"
            />
            <div className="flex-1 space-y-2">
              <Skeleton
                animationType="shimmer"
                className="h-2.5 w-20 rounded-full bg-white/15"
              />
              <Skeleton
                animationType="shimmer"
                className="h-3 w-28 rounded-full bg-white/10"
              />
            </div>
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-3 w-full rounded-full bg-white/10"
          />
          <div className="flex gap-1.5">
            <Skeleton
              animationType="shimmer"
              className="h-8 flex-1 rounded-xl bg-white/10"
            />
            <Skeleton
              animationType="shimmer"
              className="h-8 flex-1 rounded-xl bg-white/10"
            />
            <Skeleton
              animationType="shimmer"
              className="h-8 flex-1 rounded-xl bg-white/10"
            />
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-4 rounded-t-[28px] bg-[#f3effc] pt-1">
        <div className="relative z-[1] -mt-4 px-4">
          <div className="flex gap-1 rounded-[20px] border-2 border-[#ebe4f6] bg-white p-1.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                animationType="shimmer"
                className="h-10 flex-1 rounded-[14px] bg-[#ebe4f6]"
              />
            ))}
          </div>
        </div>

        <div className="relative space-y-3 px-4 pt-5 pb-[calc(5.25rem+env(safe-area-inset-bottom)+24px)]">
          <Skeleton
            animationType="shimmer"
            className="h-5 w-28 rounded-lg bg-[#ebe4f6]"
          />
          {[0, 1, 2].map((block) => (
            <div
              key={block}
              className="overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-white"
            >
              <Skeleton
                animationType="shimmer"
                className="h-8 w-full rounded-none bg-[#ebe4f6]"
              />
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-t border-[#f0ecf7] px-3 py-3"
                >
                  <Skeleton
                    animationType="shimmer"
                    className="h-5 w-5 shrink-0 rounded bg-[#ebe4f6]"
                  />
                  <Skeleton
                    animationType="shimmer"
                    className="h-10 w-10 shrink-0 rounded-[12px] bg-[#ebe4f6]"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton
                      animationType="shimmer"
                      className="h-3 w-3/5 rounded-full bg-[#ebe4f6]"
                    />
                    <Skeleton
                      animationType="shimmer"
                      className="h-2.5 w-2/5 rounded-full bg-[#ebe4f6]"
                    />
                  </div>
                  <Skeleton
                    animationType="shimmer"
                    className="h-3 w-10 shrink-0 rounded-full bg-[#ebe4f6]"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading league…</span>
    </div>
  );
}
