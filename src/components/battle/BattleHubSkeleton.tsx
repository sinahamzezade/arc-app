"use client";

import { Skeleton } from "@/components/ui";

/**
 * Arena hub placeholder — night hero + challenge CTA + rivals + results.
 * Mirrors LeaderboardSkeleton / BattleHubScreen structure.
 */
export function BattleHubSkeleton() {
  return (
    <div
      className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#f3effc] font-rounded"
      role="status"
      aria-busy="true"
      aria-label="Loading battle hub"
    >
      <section className="relative overflow-hidden bg-[#0f1220] px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-20">
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
              className="h-6 w-24 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-9 w-36 rounded-lg bg-white/20"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-9 w-20 shrink-0 rounded-full bg-white/15"
          />
        </div>

        <div className="relative mt-6 flex items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-16 rounded-full bg-white/15"
            />
            <Skeleton
              animationType="shimmer"
              className="h-12 w-24 rounded-lg bg-white/20"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-36 rounded-full bg-white/10"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-[72px] w-[120px] shrink-0 rounded-[22px] bg-[#ffc928]/35"
          />
        </div>

        <div className="relative mt-5 flex gap-3">
          <Skeleton
            animationType="shimmer"
            className="h-3 w-20 rounded-full bg-white/10"
          />
          <Skeleton
            animationType="shimmer"
            className="h-3 w-16 rounded-full bg-white/10"
          />
        </div>
      </section>

      <div className="relative -mt-10 px-4 pb-8">
        <Skeleton
          animationType="shimmer"
          className="h-[88px] w-full rounded-[26px] bg-arc-purple-500/40"
        />

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
            <Skeleton
              animationType="shimmer"
              className="h-5 w-28 rounded-lg bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-14 rounded-full bg-[#ebe4f6]"
            />
          </div>

          <Skeleton
            animationType="shimmer"
            className="mb-3 h-11 w-full rounded-[16px] bg-[#ebe4f6]"
          />

          <div className="flex items-end gap-3 overflow-hidden pb-2">
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                animationType="shimmer"
                className={
                  i === 0
                    ? "h-[148px] w-[148px] shrink-0 rounded-[22px] bg-[#ebe4f6]"
                    : "h-[132px] w-[112px] shrink-0 rounded-[22px] bg-[#ebe4f6]"
                }
              />
            ))}
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
            <Skeleton
              animationType="shimmer"
              className="h-5 w-36 rounded-lg bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-16 rounded-full bg-[#ebe4f6]"
            />
          </div>

          <div className="overflow-hidden rounded-[20px] border border-[#ebe4f6] bg-white shadow-[0_8px_20px_rgba(70,40,150,0.05)]">
            <ul className="divide-y divide-[#f0ecf7]">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-3.5 py-3.5">
                  <Skeleton
                    animationType="shimmer"
                    className="h-10 w-10 shrink-0 rounded-xl bg-[#ebe4f6]"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton
                      animationType="shimmer"
                      className="h-3 w-2/5 rounded-full bg-[#ebe4f6]"
                    />
                    <Skeleton
                      animationType="shimmer"
                      className="h-2.5 w-3/5 rounded-full bg-[#ebe4f6]"
                    />
                  </div>
                  <div className="space-y-2 text-right">
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
            className="h-12 flex-1 rounded-2xl bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-12 flex-1 rounded-2xl bg-[#ebe4f6]"
          />
        </div>
      </div>

      <span className="sr-only">Loading battle hub…</span>
    </div>
  );
}
