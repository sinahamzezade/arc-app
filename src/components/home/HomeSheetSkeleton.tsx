"use client";

import { Skeleton } from "@/components/ui";

/**
 * Home sheet placeholder — mirrors mission / seal / rank+wheel / quiet rows.
 */
export function HomeSheetSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label="Loading home"
    >
      {/* Mission ticket */}
      <div className="rounded-[26px] bg-white p-4 shadow-[0_16px_32px_rgba(70,40,150,0.12)] ring-1 ring-[#ebe4f6]">
        <Skeleton
          animationType="shimmer"
          className="h-2.5 w-3/5 rounded-full bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="mt-3 h-7 w-4/5 rounded-lg bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="mt-2 h-7 w-3/5 rounded-lg bg-[#ebe4f6]"
        />
        <div className="mt-3 flex gap-3">
          <Skeleton
            animationType="shimmer"
            className="h-3 w-24 rounded-full bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-3 w-16 rounded-full bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-3 w-12 rounded-full bg-[#ebe4f6]"
          />
        </div>
        <div className="mt-5 space-y-2">
          <Skeleton
            animationType="shimmer"
            className="h-2 w-full rounded-full bg-[#ebe4f6]"
          />
          <div className="flex justify-between">
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-14 rounded-full bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-2.5 w-16 rounded-full bg-[#ebe4f6]"
            />
          </div>
        </div>
        <Skeleton
          animationType="shimmer"
          className="mt-4 h-12 w-full rounded-2xl bg-[#ebe4f6]"
        />
      </div>

      {/* Seal week vault */}
      <div className="rounded-[18px] bg-white p-3.5 ring-1 ring-[#ebe4f6]">
        <div className="flex items-center gap-2">
          <Skeleton
            animationType="shimmer"
            className="h-3.5 w-28 rounded-full bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-4 w-14 rounded-full bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="ml-auto h-3 w-10 rounded-full bg-[#ebe4f6]"
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Skeleton
            animationType="shimmer"
            className="h-9 w-10 rounded-lg bg-[#ebe4f6]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-3 w-24 rounded-full bg-[#ebe4f6]"
          />
          <div className="ml-auto flex flex-col gap-1.5">
            <Skeleton
              animationType="shimmer"
              className="h-5 w-14 rounded-full bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-5 w-14 rounded-full bg-[#ebe4f6]"
            />
          </div>
        </div>
        <Skeleton
          animationType="shimmer"
          className="mt-3 h-2.5 w-full rounded-full bg-[#ebe4f6]"
        />
        <Skeleton
          animationType="shimmer"
          className="mt-2 h-2.5 w-28 rounded-full bg-[#ebe4f6]"
        />
      </div>

      {/* Rank + wheel */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2.5 rounded-[16px] bg-white px-3 py-2.5 ring-1 ring-[#ebe4f6]">
          <Skeleton
            animationType="shimmer"
            className="h-9 w-9 shrink-0 rounded-full bg-[#ebe4f6]"
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton
              animationType="shimmer"
              className="h-2 w-10 rounded-full bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-3 w-20 rounded-full bg-[#ebe4f6]"
            />
            <Skeleton
              animationType="shimmer"
              className="h-2 w-16 rounded-full bg-[#ebe4f6]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-[16px] bg-[#ffc928]/80 px-3 py-2.5">
          <Skeleton
            animationType="shimmer"
            className="h-9 w-9 shrink-0 rounded-xl bg-[#0f1220]/15"
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
            <Skeleton
              animationType="shimmer"
              className="h-2 w-16 rounded-full bg-[#0f1220]/12"
            />
          </div>
        </div>
      </div>

      {/* Quiet rows */}
      <div className="divide-y divide-[#f0ecf7] rounded-[22px] border border-[#ebe4f6] bg-white shadow-[0_6px_16px_rgba(70,40,150,0.05)]">
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
            <Skeleton
              animationType="shimmer"
              className="h-4 w-4 shrink-0 rounded bg-[#ebe4f6]"
            />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading your desk…</span>
    </div>
  );
}
