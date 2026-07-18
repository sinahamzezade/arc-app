"use client";

import { Skeleton } from "@/components/ui";

/**
 * Arena hub placeholder — night stats board + CTA + rivals + results.
 */
export function BattleHubSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f2eefb] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading battle hub"
    >
      <header className="relative bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-7">
        <div className="relative overflow-hidden rounded-[28px] border-[3px] border-[#0a0c16] bg-arc-purple-500 shadow-[0_7px_0_#35209d]">
          <div className="relative flex items-start justify-between gap-3 px-3.5 pt-4">
            <div className="min-w-0 space-y-2">
              <Skeleton
                animationType="shimmer"
                className="h-3 w-14 rounded-full bg-white/20"
              />
              <Skeleton
                animationType="shimmer"
                className="h-7 w-28 rounded-lg bg-white/25"
              />
            </div>
            <Skeleton
              animationType="shimmer"
              className="h-8 w-20 shrink-0 rounded-2xl bg-[#ffc928]/40"
            />
          </div>

          <div className="relative mx-3.5 mt-3.5 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                animationType="shimmer"
                className="h-[58px] w-full rounded-lg bg-[#0f1220]/55"
              />
            ))}
          </div>

          <div className="relative mx-3.5 mt-3 mb-3.5 flex items-center justify-between gap-2 border-t border-white/15 pt-2.5">
            <div className="flex gap-3">
              <Skeleton
                animationType="shimmer"
                className="h-3 w-16 rounded-full bg-white/20"
              />
              <Skeleton
                animationType="shimmer"
                className="h-3 w-14 rounded-full bg-white/20"
              />
            </div>
            <Skeleton
              animationType="shimmer"
              className="h-6 w-20 rounded-full bg-[#0f1220]/50"
            />
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-3 space-y-3.5 rounded-t-[28px] bg-[#f2eefb] px-4 pt-5 pb-8">
        <Skeleton
          animationType="shimmer"
          className="h-[88px] w-full rounded-[22px] bg-arc-purple-500/40"
        />

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-2">
            <div className="space-y-2">
              <Skeleton
                animationType="shimmer"
                className="h-5 w-20 rounded-lg bg-[#ebe4f6]"
              />
              <Skeleton
                animationType="shimmer"
                className="h-3 w-28 rounded-full bg-[#ebe4f6]"
              />
            </div>
            <Skeleton
              animationType="shimmer"
              className="h-3 w-14 rounded-full bg-[#ebe4f6]"
            />
          </div>

          <Skeleton
            animationType="shimmer"
            className="mb-3 h-11 w-full rounded-[16px] bg-[#ebe4f6]"
          />

          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                animationType="shimmer"
                className="h-[72px] w-full rounded-[18px] bg-[#ebe4f6]"
              />
            ))}
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-2">
            <Skeleton
              animationType="shimmer"
              className="h-5 w-36 rounded-lg bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-16 rounded-full bg-[#ebe4f6]"
            />
          </div>

          <div className="overflow-hidden rounded-[20px] border-2 border-[#ebe4f6] bg-white">
            <ul className="divide-y divide-[#f0ecf7]">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-3.5 py-3.5">
                  <Skeleton
                    animationType="shimmer"
                    className="h-10 w-10 shrink-0 rounded-xl bg-[#ebe4f6]"
                  />
                  <div className="min-h-0 flex-1 space-y-2">
                    <Skeleton
                      animationType="shimmer"
                      className="h-3 w-2/5 rounded-full bg-[#ebe4f6]"
                    />
                    <Skeleton
                      animationType="shimmer"
                      className="h-2.5 w-3/5 rounded-full bg-[#ebe4f6]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Skeleton
                      animationType="shimmer"
                      className="ml-auto h-3 w-10 rounded-full bg-[#ebe4f6]"
                    />
                    <Skeleton
                      animationType="shimmer"
                      className="ml-auto h-2.5 w-8 rounded-full bg-[#ebe4f6]"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mt-6 flex gap-2">
          <Skeleton
            animationType="shimmer"
            className="h-12 flex-1 rounded-[18px] bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-12 flex-1 rounded-[18px] bg-[#ebe4f6]"
          />
        </div>
      </div>

      <span className="sr-only">Loading battle hub…</span>
    </div>
  );
}
