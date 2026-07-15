"use client";

import { Skeleton } from "@/components/ui";

/**
 * League desk placeholder — night hero + tab rail + standings rows.
 */
export function LeaderboardSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading league"
    >
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-20">
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
              className="h-6 w-28 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-9 w-4/5 rounded-lg bg-white/20"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-2/5 rounded-full bg-white/10"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-7 w-12 shrink-0 rounded-full bg-white/15"
          />
        </div>

        <div className="relative mt-6 rounded-[22px] bg-white/10 p-4 ring-1 ring-white/10">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-2">
              <Skeleton
                animationType="shimmer"
                className="h-2.5 w-16 rounded-full bg-white/15"
              />
              <Skeleton
                animationType="shimmer"
                className="h-12 w-20 rounded-lg bg-white/20"
              />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton
                animationType="shimmer"
                className="ml-auto h-2.5 w-14 rounded-full bg-white/15"
              />
              <Skeleton
                animationType="shimmer"
                className="ml-auto h-6 w-16 rounded-lg bg-white/20"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
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
      </section>

      <div className="relative z-10 -mt-6 rounded-t-arc-xl bg-[#f3effc]">
        <div className="relative z-[1] -mt-5 px-4">
          <div className="flex gap-1 rounded-[20px] border border-[#ebe4f6] bg-white p-1.5 shadow-[0_14px_32px_rgba(70,40,150,0.1)]">
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                animationType="shimmer"
                className="h-10 flex-1 rounded-[14px] bg-[#ebe4f6]"
              />
            ))}
          </div>
        </div>

        <div className="relative px-4 pt-5 pb-[calc(5.25rem+env(safe-area-inset-bottom)+24px)]">
          <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
            <div className="space-y-2">
              <Skeleton
                animationType="shimmer"
                className="h-5 w-28 rounded-lg bg-[#ebe4f6]"
              />
              <Skeleton
                animationType="shimmer"
                className="h-2.5 w-40 rounded-full bg-[#ebe4f6]"
              />
            </div>
            <Skeleton
              animationType="shimmer"
              className="h-6 w-12 rounded-full bg-[#ebe4f6]"
            />
          </div>

          <div className="overflow-hidden rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_12px_28px_rgba(70,40,150,0.08)]">
            <div className="border-b border-[#f0ecf7] bg-[#faf8ff] px-3 py-3">
              <div className="flex gap-3">
                <Skeleton
                  animationType="shimmer"
                  className="h-2.5 w-6 rounded-full bg-[#ebe4f6]"
                />
                <Skeleton
                  animationType="shimmer"
                  className="h-2.5 flex-1 rounded-full bg-[#ebe4f6]"
                />
                <Skeleton
                  animationType="shimmer"
                  className="h-2.5 w-10 rounded-full bg-[#ebe4f6]"
                />
                <Skeleton
                  animationType="shimmer"
                  className="h-2.5 w-8 rounded-full bg-[#ebe4f6]"
                />
              </div>
            </div>
            <ul className="divide-y divide-[#f0ecf7]">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-3.5">
                  <Skeleton
                    animationType="shimmer"
                    className="h-4 w-5 shrink-0 rounded bg-[#ebe4f6]"
                  />
                  <Skeleton
                    animationType="shimmer"
                    className="h-9 w-9 shrink-0 rounded-full bg-[#ebe4f6]"
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
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading league…</span>
    </div>
  );
}
