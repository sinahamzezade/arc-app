"use client";

import { Skeleton } from "@/components/ui";

/**
 * Home sheet placeholder — mission / week board / boost / track.
 */
export function HomeSheetSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label="Loading home"
    >
      {/* Mission */}
      <div className="rounded-[24px] border-2 border-[#ebe4f6] bg-white p-4 shadow-[0_6px_0_#ebe4f6]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-2/5 rounded-full bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-7 w-4/5 rounded-lg bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-3/5 rounded-full bg-[#ebe4f6]"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-12 w-12 shrink-0 rounded-2xl bg-[#ebe4f6]"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Skeleton
            animationType="shimmer"
            className="h-7 w-24 rounded-xl bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-7 w-16 rounded-xl bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-7 w-12 rounded-xl bg-[#ebe4f6]"
          />
        </div>
        <Skeleton
          animationType="shimmer"
          className="mt-4 h-2.5 w-full rounded-full bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="mt-4 h-12 w-full rounded-2xl bg-[#ebe4f6]"
        />
      </div>

      {/* Week board */}
      <div className="rounded-[22px] border-2 border-[#ebe4f6] bg-white p-4 shadow-[0_4px_0_#ebe4f6]">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton
              animationType="shimmer"
              className="h-2 w-16 rounded-full bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-5 w-28 rounded-lg bg-[#ebe4f6]"
            />
          </div>
          <Skeleton
            animationType="shimmer"
            className="h-5 w-14 rounded-full bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-8 w-12 rounded-xl bg-[#ebe4f6]"
          />
        </div>
        <div className="mt-3.5 flex justify-between gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              animationType="shimmer"
              className="h-7 w-7 rounded-full bg-[#ebe4f6]"
            />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Skeleton
            animationType="shimmer"
            className="h-12 w-12 shrink-0 rounded-2xl bg-[#ebe4f6]"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton
              animationType="shimmer"
              className="h-3 w-3/4 rounded-full bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-2 w-full rounded-full bg-[#ebe4f6]"
            />
          </div>
        </div>
      </div>

      {/* Boost */}
      <div className="space-y-2">
        <Skeleton
          animationType="shimmer"
          className="h-2.5 w-12 rounded-full bg-[#ebe4f6]"
        />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 rounded-[20px] border-2 border-[#ebe4f6] bg-white px-3 py-3">
            <Skeleton
              animationType="shimmer"
              className="h-11 w-11 shrink-0 rounded-full bg-[#ebe4f6]"
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton
                animationType="shimmer"
                className="h-2 w-10 rounded-full bg-[#ebe4f6]"
              />
              <Skeleton
                animationType="shimmer"
                className="h-3 w-16 rounded-full bg-[#ebe4f6]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-[20px] bg-[#ffc928]/80 px-3 py-3">
            <Skeleton
              animationType="shimmer"
              className="h-11 w-11 shrink-0 rounded-2xl bg-[#0f1220]/15"
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton
                animationType="shimmer"
                className="h-2 w-14 rounded-full bg-[#0f1220]/12"
              />
              <Skeleton
                animationType="shimmer"
                className="h-3 w-20 rounded-full bg-[#0f1220]/15"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Track rows */}
      <div className="space-y-2">
        <Skeleton
          animationType="shimmer"
          className="h-2.5 w-12 rounded-full bg-[#ebe4f6]"
        />
        <div className="divide-y divide-[#f0ecf7] overflow-hidden rounded-[22px] border-2 border-[#ebe4f6] bg-white">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton
                animationType="shimmer"
                className="h-10 w-10 shrink-0 rounded-xl bg-[#ebe4f6]"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton
                  animationType="shimmer"
                  className="h-3.5 w-4/5 rounded-full bg-[#ebe4f6]"
                />
                <Skeleton
                  animationType="shimmer"
                  className="h-2.5 w-3/5 rounded-full bg-[#ebe4f6]"
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
